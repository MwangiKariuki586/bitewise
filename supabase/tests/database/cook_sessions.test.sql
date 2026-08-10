begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(25);

select has_table('public', 'cook_sessions', 'cook sessions table exists');
select has_table('public', 'cook_session_steps', 'cook step progress table exists');
select has_function(
  'public',
  'mutate_cook_session',
  array['bigint', 'text', 'smallint', 'smallint', 'smallint', 'boolean'],
  'atomic cook session function exists'
);
select has_index('public', 'cook_sessions', 'cook_sessions_user_status_updated_idx', 'resume lookup index exists');
select has_index('public', 'cook_sessions', 'cook_sessions_recipe_id_idx', 'recipe foreign key index exists');
select has_index('public', 'cook_session_steps', 'cook_session_steps_session_owner_idx', 'step owner foreign key index exists');
select ok(has_function_privilege('authenticated', 'public.mutate_cook_session(bigint,text,smallint,smallint,smallint,boolean)', 'execute'), 'authenticated users can mutate sessions');
select is(has_function_privilege('anon', 'public.mutate_cook_session(bigint,text,smallint,smallint,smallint,boolean)', 'execute'), false, 'anonymous users cannot mutate sessions');

insert into auth.users (id, email)
values
  ('50000000-0000-4000-8000-000000000005', 'cook-a@example.com'),
  ('60000000-0000-4000-8000-000000000006', 'cook-b@example.com');

create temporary table test_cook_recipe as
select recipes.id, count(recipe_steps.step_number)::integer as step_count
from public.recipes
join public.recipe_steps on recipe_steps.recipe_id = recipes.id
where recipes.is_active
group by recipes.id
order by recipes.id
limit 1;
grant select on table test_cook_recipe to authenticated, service_role;

select set_config('request.jwt.claims', '{"sub":"50000000-0000-4000-8000-000000000005","role":"authenticated"}', true);
set local role authenticated;

select is(
  (select count(*) from public.mutate_cook_session((select id from test_cook_recipe), 'start', 4::smallint)),
  1::bigint,
  'user A starts one session'
);
select is((select count(*) from public.cook_sessions), 1::bigint, 'user A reads the active session');
select is((select servings from public.cook_sessions limit 1), 4::smallint, 'chosen servings are stored');
select is(
  (select count(*) from public.mutate_cook_session((select id from test_cook_recipe), 'navigate', p_current_step => 2::smallint)),
  1::bigint,
  'current step is persisted'
);
select is((select current_step from public.cook_sessions limit 1), 2::smallint, 'resume step is stored');
select is(
  (select count(*) from public.mutate_cook_session((select id from test_cook_recipe), 'step', p_step_number => 1::smallint, p_completed => true)),
  1::bigint,
  'a step can be completed'
);
select is((select count(*) from public.cook_session_steps), 1::bigint, 'completed step progress is stored');
select is(
  (select count(*) from public.mutate_cook_session((select id from test_cook_recipe), 'step', p_step_number => 1::smallint, p_completed => false)),
  1::bigint,
  'step completion can be undone'
);
select is((select count(*) from public.cook_session_steps), 0::bigint, 'undone step progress is removed');
select throws_ok(
  format('select * from public.mutate_cook_session(%s, %L)', (select id from test_cook_recipe), 'complete'),
  '22023',
  'Complete every step before finishing.',
  'a session cannot finish with skipped steps'
);

insert into public.cook_session_steps (session_id, user_id, step_number)
select cook_sessions.id, cook_sessions.user_id, recipe_steps.step_number
from public.cook_sessions
join public.recipe_steps on recipe_steps.recipe_id = cook_sessions.recipe_id;

select is(
  (select session_status from public.mutate_cook_session((select id from test_cook_recipe), 'complete')),
  'completed',
  'finishing records the completed meal'
);
select ok((select completed_at is not null from public.cook_sessions limit 1), 'completion timestamp is retained');

reset role;
select set_config('request.jwt.claims', '{"sub":"60000000-0000-4000-8000-000000000006","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*) from public.cook_sessions), 0::bigint, 'user B cannot read user A sessions');
select is((select count(*) from public.cook_session_steps), 0::bigint, 'user B cannot read user A step progress');
select throws_ok(
  format('select * from public.mutate_cook_session(%s, %L, null, null, %s::smallint)', (select id from test_cook_recipe), 'navigate', 1),
  '22023',
  'No active cooking session was found.',
  'user B cannot mutate user A session'
);

reset role;
set local role service_role;
select is(
  (select count(*) from public.cook_sessions where user_id = '50000000-0000-4000-8000-000000000005'),
  1::bigint,
  'privileged client can inspect the completed session'
);
select is(
  (select count(*) from public.cook_session_steps where user_id = '50000000-0000-4000-8000-000000000005'),
  (select step_count::bigint from test_cook_recipe),
  'privileged client can inspect completed progress'
);

select * from finish();
rollback;
