begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(30);

select has_table('public', 'shopping_lists', 'shopping lists table exists');
select has_table('public', 'shopping_list_items', 'shopping list items table exists');
select has_function(
  'public',
  'regenerate_shopping_list',
  array['bigint'],
  'atomic list regeneration function exists'
);
select has_function(
  'public',
  'mutate_shopping_list_item',
  array['bigint', 'text', 'bigint', 'text', 'numeric', 'text', 'bigint', 'boolean'],
  'atomic item mutation function exists'
);
select has_index(
  'public',
  'shopping_lists',
  'shopping_lists_plan_owner_idx',
  'meal plan owner foreign key index exists'
);
select has_index(
  'public',
  'shopping_list_items',
  'shopping_list_items_list_owner_idx',
  'shopping list owner foreign key index exists'
);
select has_index(
  'public',
  'shopping_list_items',
  'shopping_list_items_ingredient_id_idx',
  'ingredient foreign key index exists'
);
select has_index(
  'public',
  'shopping_list_items',
  'shopping_list_items_user_id_idx',
  'user foreign key index exists'
);
select is(
  has_function_privilege(
    'authenticated',
    'public.regenerate_shopping_list(bigint)',
    'execute'
  ),
  true,
  'authenticated users can regenerate their list'
);
select is(
  has_function_privilege(
    'anon',
    'public.regenerate_shopping_list(bigint)',
    'execute'
  ),
  false,
  'anonymous users cannot regenerate lists'
);
select is(
  has_table_privilege('anon', 'public.shopping_lists', 'select'),
  false,
  'anonymous users cannot read private shopping lists'
);

insert into auth.users (id, email)
values
  ('30000000-0000-4000-8000-000000000003', 'shopping-a@example.com'),
  ('40000000-0000-4000-8000-000000000004', 'shopping-b@example.com');

insert into public.profiles (
  user_id,
  display_name,
  budget_period,
  budget_minor,
  household_size,
  available_minutes,
  equipment,
  dietary_preferences,
  health_goals,
  preferred_cuisines,
  preferred_dishes,
  onboarding_completed
)
values
  (
    '30000000-0000-4000-8000-000000000003',
    'Shopping User A',
    'weekly',
    5000000,
    2,
    480,
    array['gas_cooker'],
    '{}',
    '{}',
    array['kenyan'],
    '{}',
    true
  ),
  (
    '40000000-0000-4000-8000-000000000004',
    'Shopping User B',
    'weekly',
    5000000,
    2,
    480,
    array['gas_cooker'],
    '{}',
    '{}',
    array['kenyan'],
    '{}',
    true
  );

create temporary table test_shopping_recipe as
select recipes.id
from public.recipes
where recipes.is_active
  and recipes.required_equipment <@ array['gas_cooker']::text[]
  and (
    cardinality(recipes.accepted_heat_sources) = 0
    or 'gas_cooker' = any(recipes.accepted_heat_sources)
  )
  and recipes.prep_minutes + recipes.cook_minutes <= 480
  and exists (
    select 1
    from public.recipe_ingredients
    where recipe_ingredients.recipe_id = recipes.id
      and not recipe_ingredients.is_optional
      and recipe_ingredients.unit = 'g'
      and recipe_ingredients.quantity * 2 / recipes.base_servings <= 1000
  )
  and (
    select count(*)
    from public.recipe_ingredients
    where recipe_ingredients.recipe_id = recipes.id
      and not recipe_ingredients.is_optional
  ) >= 2
order by recipes.id
limit 1;

grant select on table test_shopping_recipe to authenticated;

select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-4000-8000-000000000003","role":"authenticated"}',
  true
);
set local role authenticated;

select is(
  (
    select count(*)
    from public.replace_weekly_meal_plan(
      '2026-08-10',
      5000000,
      jsonb_build_array(jsonb_build_object(
        'day_of_week', 0,
        'meal_type', (
          select recipes.meal_types[1]
          from public.recipes
          join test_shopping_recipe on test_shopping_recipe.id = recipes.id
        ),
        'recipe_id', (select id from test_shopping_recipe),
        'servings', 2
      ))
    )
  ),
  1::bigint,
  'user A creates the source meal plan'
);

insert into public.pantry_items (
  user_id,
  ingredient_id,
  quantity,
  unit,
  expiry_date
)
select
  '30000000-0000-4000-8000-000000000003',
  recipe_ingredients.ingredient_id,
  1,
  'kg',
  current_date + 3
from public.recipe_ingredients
join test_shopping_recipe on test_shopping_recipe.id = recipe_ingredients.recipe_id
where not recipe_ingredients.is_optional
  and recipe_ingredients.unit = 'g'
order by recipe_ingredients.sort_order
limit 1;

insert into public.pantry_items (
  user_id,
  ingredient_id,
  quantity,
  unit,
  expiry_date
)
select
  '30000000-0000-4000-8000-000000000003',
  recipe_ingredients.ingredient_id,
  999999999,
  recipe_ingredients.unit,
  current_date - 1
from public.recipe_ingredients
join test_shopping_recipe on test_shopping_recipe.id = recipe_ingredients.recipe_id
where not recipe_ingredients.is_optional
  and recipe_ingredients.ingredient_id <> (
    select pantry_items.ingredient_id
    from public.pantry_items
    where pantry_items.user_id = '30000000-0000-4000-8000-000000000003'
    limit 1
  )
order by recipe_ingredients.sort_order
limit 1;

select is(
  (
    select count(*)
    from public.regenerate_shopping_list(
      (select id from public.meal_plans limit 1)
    )
  ),
  1::bigint,
  'one database operation creates the active shopping list'
);
select is(
  (select count(*) from public.shopping_lists),
  1::bigint,
  'user A reads one owned shopping list'
);
select ok(
  (select is_active from public.shopping_lists limit 1),
  'the generated list is active'
);
select cmp_ok(
  (select count(*) from public.shopping_list_items where source = 'generated'),
  '>',
  0::bigint,
  'the meal plan produces generated ingredients'
);
select is(
  (
    select count(*)
    from public.shopping_list_items
    where ingredient_id = (
      select pantry_items.ingredient_id
      from public.pantry_items
      where pantry_items.user_id = '30000000-0000-4000-8000-000000000003'
        and pantry_items.expiry_date >= current_date
      limit 1
    )
  ),
  0::bigint,
  'usable kilogram pantry stock is converted and subtracted from gram requirements'
);
select is(
  (
    select count(*)
    from public.shopping_list_items
    where ingredient_id = (
      select pantry_items.ingredient_id
      from public.pantry_items
      where pantry_items.user_id = '30000000-0000-4000-8000-000000000003'
        and pantry_items.expiry_date < current_date
      limit 1
    )
  ),
  1::bigint,
  'expired pantry stock is not subtracted'
);
select cmp_ok(
  (select estimated_total_minor from public.shopping_lists limit 1),
  '>',
  0::bigint,
  'the database calculates a positive estimated total'
);
select is(
  (select estimated_total_minor from public.shopping_lists limit 1),
  (
    select sum(estimated_cost_minor)::bigint
    from public.shopping_list_items
  ),
  'the stored total equals the item estimates'
);

select is(
  (
    select count(*)
    from public.mutate_shopping_list_item(
      (select id from public.shopping_lists limit 1),
      'add',
      p_name => 'Dish soap',
      p_quantity => 1,
      p_unit => 'piece',
      p_estimated_cost_minor => 25000
    )
  ),
  1::bigint,
  'a manual item is added atomically'
);
select is(
  (select count(*) from public.shopping_list_items where source = 'manual'),
  1::bigint,
  'the manual item is stored separately'
);

select is(
  (
    select count(*)
    from public.mutate_shopping_list_item(
      (select id from public.shopping_lists limit 1),
      'toggle',
      p_item_id => (
        select id
        from public.shopping_list_items
        where source = 'generated'
        order by id
        limit 1
      ),
      p_is_checked => true
    )
  ),
  1::bigint,
  'a generated item can be checked atomically'
);

select is(
  (
    select count(*)
    from public.regenerate_shopping_list(
      (select id from public.meal_plans limit 1)
    )
  ),
  1::bigint,
  'regeneration succeeds for the same plan'
);
select is(
  (select count(*) from public.shopping_list_items where source = 'manual'),
  1::bigint,
  'regeneration preserves manual items'
);
select is(
  (select count(*) from public.shopping_list_items where source = 'generated' and is_checked),
  1::bigint,
  'regeneration preserves checked state for unchanged generated items'
);

reset role;
create temporary table test_shopping_plan as
select id
from public.meal_plans
where user_id = '30000000-0000-4000-8000-000000000003';
grant select on table test_shopping_plan to authenticated;

select set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-4000-8000-000000000004","role":"authenticated"}',
  true
);
set local role authenticated;

select is(
  (select count(*) from public.shopping_lists),
  0::bigint,
  'user B cannot read user A shopping list'
);
select is(
  (select count(*) from public.shopping_list_items),
  0::bigint,
  'user B cannot read user A shopping items'
);
select throws_ok(
  format(
    'select * from public.regenerate_shopping_list(%s)',
    (select id from test_shopping_plan)
  ),
  '22023',
  'That meal plan is unavailable.',
  'user B cannot generate from user A plan'
);

reset role;
set local role service_role;
select is(
  (
    select count(*)
    from public.shopping_lists
    where user_id = '30000000-0000-4000-8000-000000000003'
  ),
  1::bigint,
  'the privileged client can inspect the owned list'
);

select * from finish();
rollback;
