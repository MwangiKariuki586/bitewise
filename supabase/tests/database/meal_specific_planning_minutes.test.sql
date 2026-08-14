begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(6);

select has_column('public', 'profiles', 'eat_now_minutes', 'profiles stores the Eat Now time separately');
select has_column('public', 'profiles', 'breakfast_minutes', 'profiles stores a breakfast planning limit');
select has_column('public', 'profiles', 'lunch_minutes', 'profiles stores a lunch planning limit');
select has_column('public', 'profiles', 'dinner_minutes', 'profiles stores a dinner planning limit');
select has_trigger(
  'public',
  'meal_plan_items',
  'meal_plan_items_enforce_time_limit',
  'meal plan items enforce meal-specific time limits'
);

insert into auth.users (id, email)
values ('30000000-0000-4000-8000-000000000003', 'meal-times@example.com');

insert into public.profiles (
  user_id,
  display_name,
  budget_period,
  budget_minor,
  household_size,
  available_minutes,
  eat_now_minutes,
  breakfast_minutes,
  lunch_minutes,
  dinner_minutes,
  equipment,
  onboarding_completed
)
values (
  '30000000-0000-4000-8000-000000000003',
  'Meal Times',
  'weekly',
  5000000,
  2,
  120,
  30,
  120,
  120,
  30,
  array['gas_cooker'],
  true
);

select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-4000-8000-000000000003","role":"authenticated"}',
  true
);
set local role authenticated;

select throws_ok(
  $$
    select *
    from public.replace_weekly_meal_plan(
      '2026-08-10',
      5000000,
      jsonb_build_array(jsonb_build_object(
        'day_of_week', 0,
        'meal_type', 'dinner',
        'recipe_id', (select id from public.recipes where slug = 'ugali-sukuma-wiki'),
        'servings', 2
      ))
    )
  $$,
  '22023',
  'The planned recipe exceeds the active meal-specific time limit.',
  'the database rejects a dinner above its own time limit'
);

select * from finish();
rollback;
