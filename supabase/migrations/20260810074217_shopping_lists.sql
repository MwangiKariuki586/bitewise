create table public.shopping_lists (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_plan_id bigint not null,
  is_active boolean not null default true,
  estimated_total_minor bigint not null default 0 check (
    estimated_total_minor between 0 and 1000000000
  ),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint shopping_lists_plan_owner_fkey
    foreign key (meal_plan_id, user_id)
    references public.meal_plans(id, user_id) on delete cascade,
  unique (user_id, meal_plan_id),
  unique (id, user_id)
);

alter table public.shopping_lists enable row level security;
revoke all on table public.shopping_lists from public, anon, authenticated;
grant select, insert, update, delete on table public.shopping_lists to authenticated;
grant select, insert, update, delete on table public.shopping_lists to service_role;
grant usage, select on sequence public.shopping_lists_id_seq to authenticated, service_role;

create policy "Users can read their shopping lists"
on public.shopping_lists for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their shopping lists"
on public.shopping_lists for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their shopping lists"
on public.shopping_lists for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can remove their shopping lists"
on public.shopping_lists for delete
to authenticated
using ((select auth.uid()) = user_id);

create trigger shopping_lists_set_updated_at
before update on public.shopping_lists
for each row execute function public.set_updated_at();

create unique index shopping_lists_one_active_user_idx
on public.shopping_lists (user_id)
where is_active;

create index shopping_lists_plan_owner_idx
on public.shopping_lists (meal_plan_id, user_id);

create table public.shopping_list_items (
  id bigint generated always as identity primary key,
  shopping_list_id bigint not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  ingredient_id bigint,
  name text not null check (char_length(name) between 2 and 120),
  quantity numeric(12, 3) not null check (quantity > 0 and quantity <= 1000000000),
  unit text not null check (
    unit in ('g', 'kg', 'ml', 'l', 'piece', 'packet', 'bunch', 'cup', 'tbsp', 'tsp')
  ),
  estimated_cost_minor bigint not null default 0 check (
    estimated_cost_minor between 0 and 1000000000
  ),
  source text not null check (source in ('generated', 'manual')),
  is_checked boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint shopping_list_items_list_owner_fkey
    foreign key (shopping_list_id, user_id)
    references public.shopping_lists(id, user_id) on delete cascade,
  constraint shopping_list_items_ingredient_unit_fkey
    foreign key (ingredient_id, unit)
    references public.ingredients(id, default_unit) on delete restrict,
  check (
    (source = 'generated' and ingredient_id is not null)
    or source = 'manual'
  )
);

alter table public.shopping_list_items enable row level security;
revoke all on table public.shopping_list_items from public, anon, authenticated;
grant select, insert, update, delete on table public.shopping_list_items to authenticated;
grant select, insert, update, delete on table public.shopping_list_items to service_role;
grant usage, select on sequence public.shopping_list_items_id_seq to authenticated, service_role;

create policy "Users can read their shopping list items"
on public.shopping_list_items for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their shopping list items"
on public.shopping_list_items for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their shopping list items"
on public.shopping_list_items for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can remove their shopping list items"
on public.shopping_list_items for delete
to authenticated
using ((select auth.uid()) = user_id);

create trigger shopping_list_items_set_updated_at
before update on public.shopping_list_items
for each row execute function public.set_updated_at();

create unique index shopping_list_generated_ingredient_idx
on public.shopping_list_items (shopping_list_id, ingredient_id, unit)
where source = 'generated';

create index shopping_list_items_list_owner_idx
on public.shopping_list_items (shopping_list_id, user_id, is_checked, id);

create index shopping_list_items_user_id_idx
on public.shopping_list_items (user_id, shopping_list_id, is_checked, id);

create index shopping_list_items_ingredient_id_idx
on public.shopping_list_items (ingredient_id, unit, shopping_list_id)
where ingredient_id is not null;

create function public.regenerate_shopping_list(p_meal_plan_id bigint)
returns table (
  shopping_list_id bigint,
  estimated_total_minor bigint,
  item_count integer
)
language plpgsql
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_user_id uuid := (select auth.uid());
  v_list_id bigint;
  v_total bigint;
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.meal_plans
    where meal_plans.id = p_meal_plan_id
      and meal_plans.user_id = v_user_id
  ) then
    raise exception 'That meal plan is unavailable.' using errcode = '22023';
  end if;

  update public.shopping_lists
  set is_active = false
  where shopping_lists.user_id = v_user_id
    and shopping_lists.meal_plan_id <> p_meal_plan_id
    and shopping_lists.is_active;

  insert into public.shopping_lists (user_id, meal_plan_id, is_active)
  values (v_user_id, p_meal_plan_id, true)
  on conflict (user_id, meal_plan_id) do update
  set is_active = true
  returning id into v_list_id;

  with required as (
    select
      recipe_ingredients.ingredient_id,
      recipe_ingredients.unit,
      ingredients.name,
      sum(
        recipe_ingredients.quantity
        * meal_plan_items.servings::numeric
        / recipes.base_servings
      )::numeric(12, 3) as required_quantity
    from public.meal_plan_items
    join public.recipes on recipes.id = meal_plan_items.recipe_id
    join public.recipe_ingredients
      on recipe_ingredients.recipe_id = meal_plan_items.recipe_id
      and not recipe_ingredients.is_optional
    join public.ingredients on ingredients.id = recipe_ingredients.ingredient_id
    where meal_plan_items.meal_plan_id = p_meal_plan_id
      and meal_plan_items.user_id = v_user_id
    group by
      recipe_ingredients.ingredient_id,
      recipe_ingredients.unit,
      ingredients.name
  ),
  needed as (
    select
      required.ingredient_id,
      required.unit,
      required.name,
      greatest(
        required.required_quantity - coalesce(pantry.available_quantity, 0),
        0
      )::numeric(12, 3) as quantity,
      case
        when ingredient_costs.id is null then 0
        else ceil(
          greatest(
            required.required_quantity - coalesce(pantry.available_quantity, 0),
            0
          )
          / ingredient_costs.quantity
          * ingredient_costs.price_minor
        )::bigint
      end as estimated_cost_minor
    from required
    left join lateral (
      select sum(
        case
          when pantry_items.unit = required.unit then pantry_items.quantity
          when pantry_items.unit = 'kg' and required.unit = 'g' then pantry_items.quantity * 1000
          when pantry_items.unit = 'g' and required.unit = 'kg' then pantry_items.quantity / 1000
          when pantry_items.unit = 'l' and required.unit = 'ml' then pantry_items.quantity * 1000
          when pantry_items.unit = 'ml' and required.unit = 'l' then pantry_items.quantity / 1000
          else 0
        end
      ) as available_quantity
      from public.pantry_items
      where pantry_items.user_id = v_user_id
        and pantry_items.ingredient_id = required.ingredient_id
        and (
          pantry_items.expiry_date is null
          or pantry_items.expiry_date >= current_date
        )
    ) pantry on true
    left join public.ingredient_costs
      on ingredient_costs.ingredient_id = required.ingredient_id
      and ingredient_costs.unit = required.unit
      and ingredient_costs.location = 'Nairobi'
      and ingredient_costs.is_active
    where required.required_quantity > coalesce(pantry.available_quantity, 0)
  ),
  removed as (
    delete from public.shopping_list_items
    where shopping_list_items.shopping_list_id = v_list_id
      and shopping_list_items.user_id = v_user_id
      and shopping_list_items.source = 'generated'
      and not exists (
        select 1
        from needed
        where needed.ingredient_id = shopping_list_items.ingredient_id
          and needed.unit = shopping_list_items.unit
      )
    returning id
  )
  insert into public.shopping_list_items (
    shopping_list_id,
    user_id,
    ingredient_id,
    name,
    quantity,
    unit,
    estimated_cost_minor,
    source
  )
  select
    v_list_id,
    v_user_id,
    needed.ingredient_id,
    needed.name,
    needed.quantity,
    needed.unit,
    needed.estimated_cost_minor,
    'generated'
  from needed
  on conflict (shopping_list_id, ingredient_id, unit)
    where source = 'generated'
  do update set
    name = excluded.name,
    quantity = excluded.quantity,
    estimated_cost_minor = excluded.estimated_cost_minor;

  select
    coalesce(sum(shopping_list_items.estimated_cost_minor), 0),
    count(*)::integer
  into v_total, v_count
  from public.shopping_list_items
  where shopping_list_items.shopping_list_id = v_list_id
    and shopping_list_items.user_id = v_user_id;

  update public.shopping_lists
  set estimated_total_minor = v_total
  where shopping_lists.id = v_list_id
    and shopping_lists.user_id = v_user_id;

  return query select v_list_id, v_total, v_count;
end;
$$;

revoke all on function public.regenerate_shopping_list(bigint)
from public, anon;
grant execute on function public.regenerate_shopping_list(bigint)
to authenticated, service_role;

create function public.mutate_shopping_list_item(
  p_shopping_list_id bigint,
  p_operation text,
  p_item_id bigint default null,
  p_name text default null,
  p_quantity numeric default null,
  p_unit text default null,
  p_estimated_cost_minor bigint default null,
  p_is_checked boolean default null
)
returns table (
  shopping_list_item_id bigint,
  estimated_total_minor bigint
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_item_id bigint;
  v_source text;
  v_total bigint;
begin
  if v_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.shopping_lists
    where shopping_lists.id = p_shopping_list_id
      and shopping_lists.user_id = v_user_id
  ) then
    raise exception 'That shopping list is unavailable.' using errcode = '22023';
  end if;

  if p_operation = 'add' then
    if p_name is null
      or char_length(btrim(p_name)) not between 2 and 120
      or p_quantity is null
      or p_quantity <= 0
      or p_quantity > 1000000000
      or p_unit is null
      or p_unit not in ('g', 'kg', 'ml', 'l', 'piece', 'packet', 'bunch', 'cup', 'tbsp', 'tsp')
      or coalesce(p_estimated_cost_minor, 0) not between 0 and 1000000000
    then
      raise exception 'The manual shopping item is invalid.' using errcode = '22023';
    end if;

    insert into public.shopping_list_items (
      shopping_list_id,
      user_id,
      name,
      quantity,
      unit,
      estimated_cost_minor,
      source
    )
    values (
      p_shopping_list_id,
      v_user_id,
      btrim(p_name),
      p_quantity,
      p_unit,
      coalesce(p_estimated_cost_minor, 0),
      'manual'
    )
    returning id into v_item_id;
  elsif p_operation in ('edit', 'toggle', 'delete') then
    select shopping_list_items.source
    into v_source
    from public.shopping_list_items
    where shopping_list_items.id = p_item_id
      and shopping_list_items.shopping_list_id = p_shopping_list_id
      and shopping_list_items.user_id = v_user_id;

    if v_source is null then
      raise exception 'That shopping item is unavailable.' using errcode = '22023';
    end if;

    v_item_id := p_item_id;

    if p_operation = 'toggle' then
      if p_is_checked is null then
        raise exception 'The checked state is required.' using errcode = '22023';
      end if;
      update public.shopping_list_items
      set is_checked = p_is_checked
      where id = p_item_id
        and shopping_list_id = p_shopping_list_id
        and user_id = v_user_id;
    elsif p_operation = 'delete' then
      delete from public.shopping_list_items
      where id = p_item_id
        and shopping_list_id = p_shopping_list_id
        and user_id = v_user_id;
      v_item_id := null;
    elsif v_source = 'generated' then
      if p_quantity is null
        or p_quantity <= 0
        or p_quantity > 1000000000
        or coalesce(p_estimated_cost_minor, 0) not between 0 and 1000000000
      then
        raise exception 'The generated shopping item update is invalid.' using errcode = '22023';
      end if;
      update public.shopping_list_items
      set
        quantity = p_quantity,
        estimated_cost_minor = coalesce(p_estimated_cost_minor, 0)
      where id = p_item_id
        and shopping_list_id = p_shopping_list_id
        and user_id = v_user_id;
    else
      if p_name is null
        or char_length(btrim(p_name)) not between 2 and 120
        or p_quantity is null
        or p_quantity <= 0
        or p_quantity > 1000000000
        or p_unit is null
        or p_unit not in ('g', 'kg', 'ml', 'l', 'piece', 'packet', 'bunch', 'cup', 'tbsp', 'tsp')
        or coalesce(p_estimated_cost_minor, 0) not between 0 and 1000000000
      then
        raise exception 'The manual shopping item update is invalid.' using errcode = '22023';
      end if;
      update public.shopping_list_items
      set
        name = btrim(p_name),
        quantity = p_quantity,
        unit = p_unit,
        estimated_cost_minor = coalesce(p_estimated_cost_minor, 0)
      where id = p_item_id
        and shopping_list_id = p_shopping_list_id
        and user_id = v_user_id;
    end if;
  else
    raise exception 'That shopping-list operation is unsupported.' using errcode = '22023';
  end if;

  select coalesce(sum(shopping_list_items.estimated_cost_minor), 0)
  into v_total
  from public.shopping_list_items
  where shopping_list_items.shopping_list_id = p_shopping_list_id
    and shopping_list_items.user_id = v_user_id;

  update public.shopping_lists
  set estimated_total_minor = v_total
  where shopping_lists.id = p_shopping_list_id
    and shopping_lists.user_id = v_user_id;

  return query select v_item_id, v_total;
end;
$$;

revoke all on function public.mutate_shopping_list_item(
  bigint,
  text,
  bigint,
  text,
  numeric,
  text,
  bigint,
  boolean
)
from public, anon;
grant execute on function public.mutate_shopping_list_item(
  bigint,
  text,
  bigint,
  text,
  numeric,
  text,
  bigint,
  boolean
)
to authenticated, service_role;
