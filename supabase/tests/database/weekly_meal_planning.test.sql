begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(25);

select has_table('public', 'meal_plans', 'meal plans table exists');
select has_table('public', 'meal_plan_items', 'meal plan items table exists');
select has_function(
  'public',
  'replace_weekly_meal_plan',
  array['date', 'integer', 'jsonb'],
  'atomic weekly replacement function exists'
);
select col_is_unique(
  'public',
  'meal_plans',
  array['user_id', 'week_start'],
  'each user has one plan per week'
);
select has_index(
  'public',
  'meal_plan_items',
  'meal_plan_items_recipe_id_idx',
  'recipe foreign key index exists'
);
select has_index(
  'public',
  'meal_plan_items',
  'meal_plan_items_plan_owner_idx',
  'composite plan owner foreign key index exists'
);
select is(
  has_function_privilege(
    'authenticated',
    'public.replace_weekly_meal_plan(date,integer,jsonb)',
    'execute'
  ),
  true,
  'authenticated users can replace their week'
);
select is(
  has_function_privilege(
    'anon',
    'public.replace_weekly_meal_plan(date,integer,jsonb)',
    'execute'
  ),
  false,
  'anonymous users cannot execute weekly replacement'
);
select is(
  has_table_privilege('anon', 'public.meal_plans', 'select'),
  false,
  'anonymous users cannot read private meal plans'
);

insert into auth.users (id, email)
values
  ('10000000-0000-4000-8000-000000000001', 'plan-a@example.com'),
  ('20000000-0000-4000-8000-000000000002', 'plan-b@example.com');

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
    '10000000-0000-4000-8000-000000000001',
    'Plan User A',
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
    '20000000-0000-4000-8000-000000000002',
    'Plan User B',
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

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',
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
        'meal_type', 'breakfast',
        'recipe_id', (
          select recipe_id
          from public.get_recommendation_candidates(
            '{}', array['gas_cooker'], 480, 5000000, 2, 'breakfast'
          )
          limit 1
        ),
        'servings', 2
      ))
    )
  ),
  1::bigint,
  'user A atomically creates a priced plan'
);
select is(
  (select count(*) from public.meal_plans),
  1::bigint,
  'user A reads their own plan'
);
select is(
  (select count(*) from public.meal_plan_items),
  1::bigint,
  'user A reads their own plan item'
);
select cmp_ok(
  (select estimated_total_minor from public.meal_plans limit 1),
  '>',
  0::bigint,
  'the database calculates a positive total'
);
select cmp_ok(
  (select estimated_total_minor from public.meal_plans limit 1),
  '<=',
  5000000::bigint,
  'the stored total stays under the profile budget'
);

reset role;
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);
set local role authenticated;

select is(
  (select count(*) from public.meal_plans),
  0::bigint,
  'user B cannot read user A plan'
);
select is(
  (select count(*) from public.meal_plan_items),
  0::bigint,
  'user B cannot read user A items'
);
select lives_ok(
  $$
    delete from public.meal_plans
    where user_id = '10000000-0000-4000-8000-000000000001'
  $$,
  'a cross-user delete safely affects no visible row'
);
select is(
  (
    select count(*)
    from public.replace_weekly_meal_plan(
      '2026-08-10',
      5000000,
      jsonb_build_array(jsonb_build_object(
        'day_of_week', 0,
        'meal_type', 'dinner',
        'recipe_id', (
          select recipe_id
          from public.get_recommendation_candidates(
            '{}', array['gas_cooker'], 480, 5000000, 2, 'dinner'
          )
          limit 1
        ),
        'servings', 2
      ))
    )
  ),
  1::bigint,
  'user B creates a separate owned plan'
);
select is(
  (select count(*) from public.meal_plans),
  1::bigint,
  'user B still sees only their plan'
);

reset role;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',
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
        'day_of_week', 2,
        'meal_type', 'lunch',
        'recipe_id', (
          select recipe_id
          from public.get_recommendation_candidates(
            '{}', array['gas_cooker'], 480, 5000000, 2, 'lunch'
          )
          limit 1
        ),
        'servings', 2
      ))
    )
  ),
  1::bigint,
  'replacing user A plan succeeds'
);
select is(
  (select count(*) from public.meal_plan_items),
  1::bigint,
  'replacement removes stale slots atomically'
);
select is(
  (select meal_type from public.meal_plan_items limit 1),
  'lunch',
  'replacement stores the complete new item set'
);
select throws_ok(
  $$
    select *
    from public.replace_weekly_meal_plan('2026-08-11', 5000000, '[]'::jsonb)
  $$,
  '22023',
  'The plan week must begin on a Monday.',
  'the RPC rejects a non-Monday week'
);
select throws_ok(
  $$
    select *
    from public.replace_weekly_meal_plan('2026-08-10', 4999999, '[]'::jsonb)
  $$,
  '22023',
  'The plan budget must match the active profile budget.',
  'the RPC does not trust a client-supplied budget'
);

reset role;
set local role service_role;
select is(
  (select count(*) from public.meal_plans),
  2::bigint,
  'the privileged client can inspect both plans for trusted operations'
);

select * from finish();
rollback;
