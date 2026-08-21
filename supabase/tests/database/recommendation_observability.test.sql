begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(25);

select has_table('public', 'recommendation_runs', 'recommendation runs table exists');
select has_table('public', 'recommendation_run_items', 'recommendation run items table exists');
select has_table('public', 'recommendation_events', 'recommendation events table exists');
select has_function(
  'public',
  'record_recommendation_run',
  array['text', 'jsonb', 'jsonb'],
  'atomic recommendation run recorder exists'
);
select has_function(
  'public',
  'record_recommendation_events',
  array['uuid', 'text', 'bigint[]'],
  'bounded recommendation event recorder exists'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.record_recommendation_run(text,jsonb,jsonb)',
    'execute'
  ),
  'authenticated users can record their recommendation runs'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.record_recommendation_events(uuid,text,bigint[])',
    'execute'
  ),
  'authenticated users can record recommendation events'
);
select is(
  has_function_privilege(
    'anon',
    'public.record_recommendation_run(text,jsonb,jsonb)',
    'execute'
  ),
  false,
  'anonymous users cannot record recommendation runs'
);
select is(
  has_function_privilege(
    'anon',
    'public.record_recommendation_events(uuid,text,bigint[])',
    'execute'
  ),
  false,
  'anonymous users cannot record recommendation events'
);
select has_index(
  'public',
  'recommendation_runs',
  'recommendation_runs_user_created_idx',
  'run history has an owner and date index'
);
select has_index(
  'public',
  'recommendation_run_items',
  'recommendation_run_items_user_recipe_idx',
  'run item outcomes have an owner and recipe index'
);
select has_index(
  'public',
  'recommendation_events',
  'recommendation_events_user_created_idx',
  'event history has an owner and date index'
);
select has_index(
  'public',
  'recommendation_events',
  'recommendation_events_run_owner_recipe_idx',
  'event foreign keys have a covering index'
);

insert into auth.users (id, email)
values
  ('91000000-0000-4000-8000-000000000001', 'recommendation-a@example.com'),
  ('92000000-0000-4000-8000-000000000002', 'recommendation-b@example.com');

create temporary table test_recommendation_recipes on commit drop as
select recipes.id, row_number() over (order by recipes.id)::smallint as position
from public.recipes
where recipes.is_active
order by recipes.id
limit 3;
grant select on table test_recommendation_recipes to authenticated, service_role;

create temporary table test_recommendation_run (
  run_id uuid primary key
) on commit drop;
grant select, insert on table test_recommendation_run to authenticated, service_role;

select set_config(
  'request.jwt.claims',
  '{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

insert into test_recommendation_run (run_id)
select public.record_recommendation_run(
  'eat-now-v2',
  '{"budget_minor":20000,"candidate_count":3}'::jsonb,
  (
    select jsonb_agg(jsonb_build_object(
      'recipe_id', id,
      'position', position,
      'score', 80 - position,
      'cash_needed_minor', 10000,
      'pantry_coverage_percent', 50
    ) order by position)
    from test_recommendation_recipes
    where position <= 2
  )
);

select ok(
  (select run_id is not null from test_recommendation_run),
  'a valid recommendation run is recorded'
);
select is(
  (select count(*) from public.recommendation_runs),
  1::bigint,
  'the owner sees one recommendation run'
);
select is(
  (select count(*) from public.recommendation_run_items),
  2::bigint,
  'the run records its ordered shortlist'
);
select is(
  public.record_recommendation_events(
    (select run_id from test_recommendation_run),
    'impression',
    (select array_agg(id order by position) from test_recommendation_recipes where position <= 2)
  ),
  2,
  'a bounded batch records shortlist impressions'
);
select is(
  (select count(*) from public.recommendation_events),
  2::bigint,
  'two impression events are retained'
);
select throws_ok(
  $$
    select public.record_recommendation_events(
      (select run_id from test_recommendation_run),
      'opened',
      (select array[id] from test_recommendation_recipes where position = 3)
    )
  $$,
  '22023',
  'A recipe does not belong to that recommendation.',
  'events cannot be attached to recipes outside the shortlist'
);
select throws_ok(
  $$
    select public.record_recommendation_run(
      'INVALID VERSION',
      '{}'::jsonb,
      '[]'::jsonb
    )
  $$,
  '22023',
  'A valid scoring version is required.',
  'invalid scoring versions are rejected'
);

reset role;
select set_config(
  'request.jwt.claims',
  '{"sub":"92000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);
set local role authenticated;

select is(
  (select count(*) from public.recommendation_runs),
  0::bigint,
  'another user cannot read the run'
);
select is(
  (select count(*) from public.recommendation_run_items),
  0::bigint,
  'another user cannot read the shortlist'
);
select is(
  (select count(*) from public.recommendation_events),
  0::bigint,
  'another user cannot read the events'
);
select throws_ok(
  $$
    select public.record_recommendation_events(
      (select run_id from test_recommendation_run),
      'opened',
      (select array[id] from test_recommendation_recipes where position = 1)
    )
  $$,
  '22023',
  'A recipe does not belong to that recommendation.',
  'another user cannot attach an event to the run'
);

reset role;
set local role service_role;
select is(
  (
    select count(*)
    from public.recommendation_events
    where user_id = '91000000-0000-4000-8000-000000000001'
  ),
  2::bigint,
  'the privileged client can inspect retained owner events'
);

select * from finish();
rollback;
