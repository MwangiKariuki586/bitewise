create table public.recommendation_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scoring_version text not null check (
    scoring_version ~ '^[a-z0-9][a-z0-9-]{2,39}$'
  ),
  context jsonb not null default '{}'::jsonb check (
    jsonb_typeof(context) = 'object'
  ),
  created_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id)
);

create table public.recommendation_run_items (
  run_id uuid not null,
  user_id uuid not null,
  recipe_id bigint not null references public.recipes(id) on delete cascade,
  position smallint not null check (position between 1 and 5),
  score numeric(7, 2) not null check (score between -1000 and 1000),
  cash_needed_minor bigint not null check (
    cash_needed_minor between 0 and 100000000
  ),
  pantry_coverage_percent smallint not null check (
    pantry_coverage_percent between 0 and 100
  ),
  primary key (run_id, recipe_id),
  unique (run_id, position),
  unique (run_id, user_id, recipe_id),
  foreign key (run_id, user_id)
    references public.recommendation_runs(id, user_id)
    on delete cascade
);

create table public.recommendation_events (
  id bigint generated always as identity primary key,
  run_id uuid not null,
  user_id uuid not null,
  recipe_id bigint not null,
  event_type text not null check (event_type in (
    'impression',
    'opened',
    'liked',
    'disliked',
    'feedback_undone',
    'saved',
    'unsaved',
    'eaten'
  )),
  created_at timestamptz not null default timezone('utc', now()),
  foreign key (run_id, user_id, recipe_id)
    references public.recommendation_run_items(run_id, user_id, recipe_id)
    on delete cascade
);

alter table public.recommendation_runs enable row level security;
alter table public.recommendation_run_items enable row level security;
alter table public.recommendation_events enable row level security;

revoke all on table public.recommendation_runs from public, anon, authenticated;
revoke all on table public.recommendation_run_items from public, anon, authenticated;
revoke all on table public.recommendation_events from public, anon, authenticated;
grant select, insert on table public.recommendation_runs to authenticated, service_role;
grant select, insert on table public.recommendation_run_items to authenticated, service_role;
grant select, insert on table public.recommendation_events to authenticated, service_role;
grant usage, select on sequence public.recommendation_events_id_seq
to authenticated, service_role;

create policy "Users can read their recommendation runs"
on public.recommendation_runs for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users can record their recommendation runs"
on public.recommendation_runs for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can read their recommendation run items"
on public.recommendation_run_items for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users can record their recommendation run items"
on public.recommendation_run_items for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can read their recommendation events"
on public.recommendation_events for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users can record their recommendation events"
on public.recommendation_events for insert to authenticated
with check ((select auth.uid()) = user_id);

create index recommendation_runs_user_created_idx
on public.recommendation_runs (user_id, created_at desc, id);
create index recommendation_run_items_user_recipe_idx
on public.recommendation_run_items (user_id, recipe_id, run_id);
create index recommendation_run_items_recipe_id_idx
on public.recommendation_run_items (recipe_id, run_id);
create index recommendation_events_user_created_idx
on public.recommendation_events (user_id, created_at desc, id desc);
create index recommendation_events_run_type_idx
on public.recommendation_events (run_id, event_type, created_at desc, id desc);

create or replace function public.record_recommendation_run(
  p_scoring_version text,
  p_context jsonb,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_run_id uuid;
  v_item_count integer;
  v_distinct_recipes integer;
  v_distinct_positions integer;
  v_valid_items boolean;
  v_active_recipes integer;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;
  if p_scoring_version is null
    or p_scoring_version !~ '^[a-z0-9][a-z0-9-]{2,39}$' then
    raise exception using errcode = '22023', message = 'A valid scoring version is required.';
  end if;
  if p_context is null or jsonb_typeof(p_context) <> 'object' then
    raise exception using errcode = '22023', message = 'Recommendation context must be an object.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) > 5 then
    raise exception using errcode = '22023', message = 'Provide at most five recommendation items.';
  end if;

  select
    count(*)::integer,
    count(distinct item.recipe_id)::integer,
    count(distinct item.position)::integer,
    coalesce(bool_and(
      item.recipe_id is not null
      and item.recipe_id > 0
      and item.position between 1 and 5
      and item.score between -1000 and 1000
      and item.cash_needed_minor between 0 and 100000000
      and item.pantry_coverage_percent between 0 and 100
    ), true)
  into v_item_count, v_distinct_recipes, v_distinct_positions, v_valid_items
  from jsonb_to_recordset(p_items) as item(
    recipe_id bigint,
    position smallint,
    score numeric,
    cash_needed_minor bigint,
    pantry_coverage_percent smallint
  );

  if not v_valid_items
    or v_item_count <> v_distinct_recipes
    or v_item_count <> v_distinct_positions then
    raise exception using errcode = '22023', message = 'Recommendation items are invalid.';
  end if;

  select count(*)::integer into v_active_recipes
  from jsonb_to_recordset(p_items) as item(recipe_id bigint)
  join public.recipes on recipes.id = item.recipe_id and recipes.is_active;
  if v_active_recipes <> v_item_count then
    raise exception using errcode = '22023', message = 'A recommendation recipe is unavailable.';
  end if;

  insert into public.recommendation_runs (user_id, scoring_version, context)
  values (v_user_id, p_scoring_version, p_context)
  returning id into v_run_id;

  insert into public.recommendation_run_items (
    run_id,
    user_id,
    recipe_id,
    position,
    score,
    cash_needed_minor,
    pantry_coverage_percent
  )
  select
    v_run_id,
    v_user_id,
    item.recipe_id,
    item.position,
    item.score,
    item.cash_needed_minor,
    item.pantry_coverage_percent
  from jsonb_to_recordset(p_items) as item(
    recipe_id bigint,
    position smallint,
    score numeric,
    cash_needed_minor bigint,
    pantry_coverage_percent smallint
  );

  return v_run_id;
end;
$$;

create or replace function public.record_recommendation_events(
  p_run_id uuid,
  p_event_type text,
  p_recipe_ids bigint[]
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_requested_count integer;
  v_recorded_count integer;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;
  if p_event_type is null or p_event_type not in (
    'impression', 'opened', 'liked', 'disliked', 'feedback_undone',
    'saved', 'unsaved', 'eaten'
  ) then
    raise exception using errcode = '22023', message = 'Unsupported recommendation event.';
  end if;
  if p_recipe_ids is null
    or cardinality(p_recipe_ids) < 1
    or cardinality(p_recipe_ids) > 5
    or array_position(p_recipe_ids, null) is not null then
    raise exception using errcode = '22023', message = 'Provide between one and five recipes.';
  end if;

  select count(distinct recipe_id)::integer
  into v_requested_count
  from unnest(p_recipe_ids) as recipe_id;
  if v_requested_count <> cardinality(p_recipe_ids) then
    raise exception using errcode = '22023', message = 'Recommendation recipes must be unique.';
  end if;

  insert into public.recommendation_events (
    run_id,
    user_id,
    recipe_id,
    event_type
  )
  select
    items.run_id,
    items.user_id,
    items.recipe_id,
    p_event_type
  from public.recommendation_run_items items
  where items.run_id = p_run_id
    and items.user_id = v_user_id
    and items.recipe_id = any(p_recipe_ids);
  get diagnostics v_recorded_count = row_count;

  if v_recorded_count <> v_requested_count then
    raise exception using errcode = '22023', message = 'A recipe does not belong to that recommendation.';
  end if;
  return v_recorded_count;
end;
$$;

revoke all on function public.record_recommendation_run(text, jsonb, jsonb)
from public, anon;
grant execute on function public.record_recommendation_run(text, jsonb, jsonb)
to authenticated, service_role;
revoke all on function public.record_recommendation_events(uuid, text, bigint[])
from public, anon;
grant execute on function public.record_recommendation_events(uuid, text, bigint[])
to authenticated, service_role;
