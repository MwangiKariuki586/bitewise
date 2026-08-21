alter table public.ingredients
add column category text not null default 'other';

alter table public.ingredients
add constraint ingredients_category_check check (
  category in (
    'produce',
    'protein',
    'grains',
    'dairy',
    'pantry-staples',
    'other'
  )
);

update public.ingredients
set category = case
  when slug in (
    'avocado', 'banana', 'bell-pepper', 'cabbage', 'carrot', 'coriander',
    'garlic', 'ginger', 'kale', 'onion', 'peas', 'potato', 'pumpkin',
    'spinach', 'sweet-potato', 'tomato'
  ) then 'produce'
  when slug in ('beef', 'chicken', 'eggs', 'fish') then 'protein'
  when slug in (
    'black-beans', 'cowpeas', 'dried-beans', 'green-grams', 'maize',
    'maize-flour', 'red-lentils', 'rice', 'wheat-flour'
  ) then 'grains'
  when slug in ('milk', 'yoghurt') then 'dairy'
  when slug in ('coconut-milk', 'cooking-oil', 'salt', 'tea-leaves')
    then 'pantry-staples'
  else 'other'
end;

alter table public.pantry_items
add column archived_at timestamptz;

alter table public.pantry_items
drop constraint pantry_items_quantity_check;

alter table public.pantry_items
add constraint pantry_items_quantity_check check (
  quantity >= 0 and quantity <= 1000000000
);

alter table public.pantry_items
drop constraint pantry_items_user_id_ingredient_id_unit_expiry_date_key;

create unique index pantry_items_active_batch_unique_idx
on public.pantry_items (user_id, ingredient_id, unit, expiry_date)
nulls not distinct
where archived_at is null;

create index pantry_items_user_active_expiry_idx
on public.pantry_items (user_id, expiry_date asc nulls last, id)
where archived_at is null and quantity > 0;

create index pantry_items_user_archived_idx
on public.pantry_items (user_id, archived_at desc, id)
where archived_at is not null;

create or replace function public.regenerate_shopping_list(p_meal_plan_id bigint)
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
        and pantry_items.archived_at is null
        and pantry_items.quantity > 0
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
