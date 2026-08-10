create table public.meal_plans (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),
  budget_limit_minor integer not null check (
    budget_limit_minor between 10000 and 700000000
  ),
  estimated_total_minor bigint not null default 0 check (
    estimated_total_minor between 0 and 700000000
  ),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, week_start),
  unique (id, user_id)
);

alter table public.meal_plans enable row level security;
revoke all on table public.meal_plans from public, anon, authenticated;
grant select, insert, update, delete on table public.meal_plans to authenticated;
grant select, insert, update, delete on table public.meal_plans to service_role;
grant usage, select on sequence public.meal_plans_id_seq to authenticated, service_role;

create policy "Users can read their meal plans"
on public.meal_plans for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their meal plans"
on public.meal_plans for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their meal plans"
on public.meal_plans for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can remove their meal plans"
on public.meal_plans for delete
to authenticated
using ((select auth.uid()) = user_id);

create trigger meal_plans_set_updated_at
before update on public.meal_plans
for each row execute function public.set_updated_at();

create table public.meal_plan_items (
  id bigint generated always as identity primary key,
  meal_plan_id bigint not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner')),
  recipe_id bigint not null references public.recipes(id) on delete restrict,
  servings smallint not null check (servings between 1 and 30),
  estimated_cost_minor bigint not null check (
    estimated_cost_minor between 1 and 100000000
  ),
  budgeted_cost_minor bigint not null check (
    budgeted_cost_minor between 1 and 100000000
  ),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint meal_plan_items_plan_owner_fkey
    foreign key (meal_plan_id, user_id)
    references public.meal_plans(id, user_id) on delete cascade,
  unique (meal_plan_id, day_of_week, meal_type)
);

alter table public.meal_plan_items enable row level security;
revoke all on table public.meal_plan_items from public, anon, authenticated;
grant select, insert, update, delete on table public.meal_plan_items to authenticated;
grant select, insert, update, delete on table public.meal_plan_items to service_role;
grant usage, select on sequence public.meal_plan_items_id_seq to authenticated, service_role;

create policy "Users can read their meal plan items"
on public.meal_plan_items for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their meal plan items"
on public.meal_plan_items for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their meal plan items"
on public.meal_plan_items for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can remove their meal plan items"
on public.meal_plan_items for delete
to authenticated
using ((select auth.uid()) = user_id);

create trigger meal_plan_items_set_updated_at
before update on public.meal_plan_items
for each row execute function public.set_updated_at();

create index meal_plan_items_user_plan_idx
on public.meal_plan_items (user_id, meal_plan_id, day_of_week, meal_type);

create index meal_plan_items_recipe_id_idx
on public.meal_plan_items (recipe_id, meal_plan_id);

create function public.replace_weekly_meal_plan(
  p_week_start date,
  p_budget_limit_minor integer,
  p_items jsonb
)
returns table (
  meal_plan_id bigint,
  estimated_total_minor bigint
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_plan_id bigint;
  v_expected_budget integer;
  v_available_minutes integer;
  v_equipment text[];
  v_dietary text[];
  v_item_count integer;
  v_priced_count integer;
  v_total bigint;
begin
  if v_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  select
    case
      when profiles.budget_period = 'weekly' then profiles.budget_minor
      else profiles.budget_minor * 7
    end,
    profiles.available_minutes,
    profiles.equipment,
    profiles.dietary_preferences
  into
    v_expected_budget,
    v_available_minutes,
    v_equipment,
    v_dietary
  from public.profiles
  where profiles.user_id = v_user_id
    and profiles.onboarding_completed;

  if v_expected_budget is null then
    raise exception 'Complete onboarding before planning meals.' using errcode = '22023';
  end if;

  if p_week_start is null or extract(isodow from p_week_start) <> 1 then
    raise exception 'The plan week must begin on a Monday.' using errcode = '22023';
  end if;

  if p_budget_limit_minor is distinct from v_expected_budget then
    raise exception 'The plan budget must match the active profile budget.' using errcode = '22023';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Plan items must be a JSON array.' using errcode = '22023';
  end if;

  v_item_count := jsonb_array_length(p_items);
  if v_item_count > 21 then
    raise exception 'A weekly plan can contain at most 21 meals.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as item(
      day_of_week integer,
      meal_type text,
      recipe_id bigint,
      servings integer
    )
    where item.day_of_week is null
      or item.day_of_week not between 0 and 6
      or item.meal_type is null
      or item.meal_type not in ('breakfast', 'lunch', 'dinner')
      or item.recipe_id is null
      or item.servings is null
      or item.servings not between 1 and 30
  ) then
    raise exception 'One or more plan items are invalid.' using errcode = '22023';
  end if;

  if (
    select count(*)
    from (
      select item.day_of_week, item.meal_type
      from jsonb_to_recordset(p_items) as item(
        day_of_week integer,
        meal_type text,
        recipe_id bigint,
        servings integer
      )
      group by item.day_of_week, item.meal_type
      having count(*) > 1
    ) duplicates
  ) > 0 then
    raise exception 'Each weekly meal slot must be unique.' using errcode = '22023';
  end if;

  with requested as (
    select *
    from jsonb_to_recordset(p_items) as item(
      day_of_week integer,
      meal_type text,
      recipe_id bigint,
      servings integer
    )
  ),
  active_costs as (
    select ingredient_id, quantity, unit, price_minor
    from public.ingredient_costs
    where is_active and location = 'Nairobi'
  ),
  component_costs as (
    select
      recipe_ingredients.recipe_id,
      (recipe_ingredients.quantity / base_cost.quantity) * base_cost.price_minor
        as base_cost_minor,
      least(
        (recipe_ingredients.quantity / base_cost.quantity) * base_cost.price_minor,
        coalesce(
          substitution.substitution_cost_minor,
          (recipe_ingredients.quantity / base_cost.quantity) * base_cost.price_minor
        )
      ) as budgeted_cost_minor
    from public.recipe_ingredients
    left join active_costs base_cost
      on base_cost.ingredient_id = recipe_ingredients.ingredient_id
      and base_cost.unit = recipe_ingredients.unit
    left join lateral (
      select min(
        (recipe_ingredients.quantity / ingredient_substitutions.source_quantity)
        * ingredient_substitutions.alternative_quantity
        / alternative_cost.quantity
        * alternative_cost.price_minor
      ) as substitution_cost_minor
      from public.ingredient_substitutions
      join active_costs alternative_cost
        on alternative_cost.ingredient_id = ingredient_substitutions.alternative_ingredient_id
        and alternative_cost.unit = ingredient_substitutions.alternative_unit
      where ingredient_substitutions.source_ingredient_id = recipe_ingredients.ingredient_id
        and ingredient_substitutions.source_unit = recipe_ingredients.unit
        and ingredient_substitutions.is_active
    ) substitution on true
    where not recipe_ingredients.is_optional
  ),
  recipe_costs as (
    select
      recipe_id,
      ceil(sum(base_cost_minor))::bigint as base_cost_minor,
      ceil(sum(budgeted_cost_minor))::bigint as budgeted_cost_minor,
      bool_and(base_cost_minor is not null) as is_fully_priced
    from component_costs
    group by recipe_id
  ),
  priced as (
    select
      requested.day_of_week,
      requested.meal_type,
      requested.recipe_id,
      requested.servings,
      ceil(recipe_costs.base_cost_minor * requested.servings::numeric / recipes.base_servings)::bigint
        as estimated_cost_minor,
      ceil(recipe_costs.budgeted_cost_minor * requested.servings::numeric / recipes.base_servings)::bigint
        as budgeted_cost_minor
    from requested
    join public.recipes on recipes.id = requested.recipe_id
    join recipe_costs on recipe_costs.recipe_id = recipes.id
    where recipes.is_active
      and recipe_costs.is_fully_priced
      and requested.meal_type = any(recipes.meal_types)
      and recipes.dietary_tags @> coalesce(v_dietary, '{}'::text[])
      and recipes.required_equipment <@ coalesce(v_equipment, '{}'::text[])
      and (
        cardinality(recipes.accepted_heat_sources) = 0
        or recipes.accepted_heat_sources && coalesce(v_equipment, '{}'::text[])
      )
      and recipes.prep_minutes + recipes.cook_minutes <= v_available_minutes
  )
  select count(*), coalesce(sum(priced.budgeted_cost_minor), 0)
  into v_priced_count, v_total
  from priced;

  if v_priced_count <> v_item_count then
    raise exception 'Every planned recipe must be active, fully priced, and fit profile constraints.'
      using errcode = '22023';
  end if;

  if v_total > p_budget_limit_minor then
    raise exception 'The weekly plan exceeds the active budget.' using errcode = '22023';
  end if;

  insert into public.meal_plans (
    user_id,
    week_start,
    budget_limit_minor,
    estimated_total_minor
  )
  values (v_user_id, p_week_start, p_budget_limit_minor, v_total)
  on conflict (user_id, week_start) do update
  set
    budget_limit_minor = excluded.budget_limit_minor,
    estimated_total_minor = excluded.estimated_total_minor
  returning id into v_plan_id;

  delete from public.meal_plan_items
  where meal_plan_items.meal_plan_id = v_plan_id
    and meal_plan_items.user_id = v_user_id;

  with requested as (
    select *
    from jsonb_to_recordset(p_items) as item(
      day_of_week integer,
      meal_type text,
      recipe_id bigint,
      servings integer
    )
  ),
  active_costs as (
    select ingredient_id, quantity, unit, price_minor
    from public.ingredient_costs
    where is_active and location = 'Nairobi'
  ),
  component_costs as (
    select
      recipe_ingredients.recipe_id,
      (recipe_ingredients.quantity / base_cost.quantity) * base_cost.price_minor
        as base_cost_minor,
      least(
        (recipe_ingredients.quantity / base_cost.quantity) * base_cost.price_minor,
        coalesce(
          substitution.substitution_cost_minor,
          (recipe_ingredients.quantity / base_cost.quantity) * base_cost.price_minor
        )
      ) as budgeted_cost_minor
    from public.recipe_ingredients
    left join active_costs base_cost
      on base_cost.ingredient_id = recipe_ingredients.ingredient_id
      and base_cost.unit = recipe_ingredients.unit
    left join lateral (
      select min(
        (recipe_ingredients.quantity / ingredient_substitutions.source_quantity)
        * ingredient_substitutions.alternative_quantity
        / alternative_cost.quantity
        * alternative_cost.price_minor
      ) as substitution_cost_minor
      from public.ingredient_substitutions
      join active_costs alternative_cost
        on alternative_cost.ingredient_id = ingredient_substitutions.alternative_ingredient_id
        and alternative_cost.unit = ingredient_substitutions.alternative_unit
      where ingredient_substitutions.source_ingredient_id = recipe_ingredients.ingredient_id
        and ingredient_substitutions.source_unit = recipe_ingredients.unit
        and ingredient_substitutions.is_active
    ) substitution on true
    where not recipe_ingredients.is_optional
  ),
  recipe_costs as (
    select
      recipe_id,
      ceil(sum(base_cost_minor))::bigint as base_cost_minor,
      ceil(sum(budgeted_cost_minor))::bigint as budgeted_cost_minor
    from component_costs
    group by recipe_id
    having bool_and(base_cost_minor is not null)
  )
  insert into public.meal_plan_items (
    meal_plan_id,
    user_id,
    day_of_week,
    meal_type,
    recipe_id,
    servings,
    estimated_cost_minor,
    budgeted_cost_minor
  )
  select
    v_plan_id,
    v_user_id,
    requested.day_of_week,
    requested.meal_type,
    requested.recipe_id,
    requested.servings,
    ceil(recipe_costs.base_cost_minor * requested.servings::numeric / recipes.base_servings)::bigint,
    ceil(recipe_costs.budgeted_cost_minor * requested.servings::numeric / recipes.base_servings)::bigint
  from requested
  join public.recipes on recipes.id = requested.recipe_id
  join recipe_costs on recipe_costs.recipe_id = recipes.id
  order by requested.day_of_week, requested.meal_type;

  return query select v_plan_id, v_total;
end;
$$;

revoke all on function public.replace_weekly_meal_plan(date, integer, jsonb)
from public, anon;
grant execute on function public.replace_weekly_meal_plan(date, integer, jsonb)
to authenticated, service_role;
