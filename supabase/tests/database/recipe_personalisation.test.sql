begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(32);

select has_table('public', 'recipe_feedback', 'recipe feedback table exists');
select has_table('public', 'saved_recipes', 'saved recipes table exists');
select has_table('public', 'meal_history', 'meal history table exists');
select has_function('public', 'mutate_recipe_personalisation', array['bigint', 'text'], 'atomic personalisation function exists');
select has_index('public', 'recipe_feedback', 'recipe_feedback_user_state_updated_idx', 'feedback lookup index exists');
select has_index('public', 'saved_recipes', 'saved_recipes_user_saved_idx', 'saved meal lookup index exists');
select has_index('public', 'meal_history', 'meal_history_user_recipe_eaten_idx', 'meal history ranking index exists');
select ok(has_function_privilege('authenticated', 'public.mutate_recipe_personalisation(bigint,text)', 'execute'), 'authenticated users can mutate personalisation');
select is(has_function_privilege('anon', 'public.mutate_recipe_personalisation(bigint,text)', 'execute'), false, 'anonymous users cannot mutate personalisation');

insert into auth.users (id, email)
values
  ('70000000-0000-4000-8000-000000000007', 'personal-a@example.com'),
  ('80000000-0000-4000-8000-000000000008', 'personal-b@example.com');

create temporary table test_personal_recipe as
select recipes.id, count(recipe_steps.step_number)::integer as step_count
from public.recipes join public.recipe_steps on recipe_steps.recipe_id = recipes.id
where recipes.is_active
group by recipes.id
order by recipes.id
limit 1;
grant select on table test_personal_recipe to authenticated, service_role;

select set_config('request.jwt.claims', '{"sub":"70000000-0000-4000-8000-000000000007","role":"authenticated"}', true);
set local role authenticated;

select is((select feedback_state from public.mutate_recipe_personalisation((select id from test_personal_recipe), 'like')), 'liked', 'user A likes a recipe');
select is((select count(*) from public.recipe_feedback), 1::bigint, 'one feedback row is stored');
select is((select feedback_state from public.mutate_recipe_personalisation((select id from test_personal_recipe), 'dislike')), 'disliked', 'dislike replaces like');
select is((select count(*) from public.recipe_feedback), 1::bigint, 'feedback remains one current state');
select is((select feedback_state from public.mutate_recipe_personalisation((select id from test_personal_recipe), 'undo_feedback')), null, 'feedback can be undone');
select is((select count(*) from public.recipe_feedback), 0::bigint, 'undo removes current feedback');
select ok((select is_saved from public.mutate_recipe_personalisation((select id from test_personal_recipe), 'save')), 'recipe can be saved');
select is((select count(*) from public.saved_recipes), 1::bigint, 'one saved recipe is stored');
select ok((select is_saved from public.mutate_recipe_personalisation((select id from test_personal_recipe), 'save')), 'saving again is idempotent');
select is((select count(*) from public.saved_recipes), 1::bigint, 'duplicate favourite is not created');
select ok((select last_eaten_at is not null from public.mutate_recipe_personalisation((select id from test_personal_recipe), 'eaten')), 'recently eaten records a timestamp');
select is((select count(*) from public.meal_history where source = 'manual'), 1::bigint, 'manual meal history is retained');

select is((select count(*) from public.mutate_cook_session((select id from test_personal_recipe), 'start', 2::smallint)), 1::bigint, 'a cook session starts for meal history integration');
insert into public.cook_session_steps (session_id, user_id, step_number)
select cook_sessions.id, cook_sessions.user_id, recipe_steps.step_number
from public.cook_sessions join public.recipe_steps on recipe_steps.recipe_id = cook_sessions.recipe_id;
select is((select session_status from public.mutate_cook_session((select id from test_personal_recipe), 'complete')), 'completed', 'Cook completion succeeds');
select is((select count(*) from public.meal_history where source = 'cook'), 1::bigint, 'Cook completion records one eaten timestamp');
select ok((select cook_session_id is not null from public.meal_history where source = 'cook'), 'Cook history links to its source session');

reset role;
select set_config('request.jwt.claims', '{"sub":"80000000-0000-4000-8000-000000000008","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*) from public.recipe_feedback), 0::bigint, 'user B cannot read user A feedback');
select is((select count(*) from public.saved_recipes), 0::bigint, 'user B cannot read user A saved recipes');
select is((select count(*) from public.meal_history), 0::bigint, 'user B cannot read user A meal history');
select is_empty(
  $$
    update public.saved_recipes set saved_at = timezone('utc', now())
    where user_id = '70000000-0000-4000-8000-000000000007'
    returning recipe_id
  $$,
  'user B cannot mutate user A saved recipe'
);

reset role;
set local role service_role;
select is((select count(*) from public.saved_recipes where user_id = '70000000-0000-4000-8000-000000000007'), 1::bigint, 'privileged client can inspect user A saved recipe');
select is((select count(*) from public.meal_history where user_id = '70000000-0000-4000-8000-000000000007'), 2::bigint, 'privileged client can inspect retained history');
select is((select count(*) from public.meal_history where user_id = '70000000-0000-4000-8000-000000000007' and source = 'cook' and cook_session_id is not null), 1::bigint, 'privileged client sees linked Cook history');

select * from finish();
rollback;
