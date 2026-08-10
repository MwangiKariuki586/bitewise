create table public.recipe_feedback (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id bigint not null references public.recipes(id) on delete cascade,
  state text not null check (state in ('liked', 'disliked')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, recipe_id)
);

alter table public.recipe_feedback enable row level security;
revoke all on table public.recipe_feedback from public, anon, authenticated;
grant select, insert, update, delete on table public.recipe_feedback to authenticated, service_role;

create policy "Users can read their recipe feedback"
on public.recipe_feedback for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users can add their recipe feedback"
on public.recipe_feedback for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Users can update their recipe feedback"
on public.recipe_feedback for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Users can remove their recipe feedback"
on public.recipe_feedback for delete to authenticated
using ((select auth.uid()) = user_id);

create trigger recipe_feedback_set_updated_at
before update on public.recipe_feedback
for each row execute function public.set_updated_at();

create index recipe_feedback_user_state_updated_idx
on public.recipe_feedback (user_id, state, updated_at desc, recipe_id);
create index recipe_feedback_recipe_id_idx
on public.recipe_feedback (recipe_id, user_id);

create table public.saved_recipes (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id bigint not null references public.recipes(id) on delete cascade,
  saved_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, recipe_id)
);

alter table public.saved_recipes enable row level security;
revoke all on table public.saved_recipes from public, anon, authenticated;
grant select, insert, update, delete on table public.saved_recipes to authenticated, service_role;

create policy "Users can read their saved recipes"
on public.saved_recipes for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users can save recipes"
on public.saved_recipes for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Users can update their saved recipes"
on public.saved_recipes for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Users can remove saved recipes"
on public.saved_recipes for delete to authenticated
using ((select auth.uid()) = user_id);

create index saved_recipes_user_saved_idx
on public.saved_recipes (user_id, saved_at desc, recipe_id);
create index saved_recipes_recipe_id_idx
on public.saved_recipes (recipe_id, user_id);

create table public.meal_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id bigint not null references public.recipes(id) on delete cascade,
  source text not null check (source in ('manual', 'cook')),
  cook_session_id bigint unique references public.cook_sessions(id) on delete set null,
  eaten_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  check (
    (source = 'manual' and cook_session_id is null)
    or (source = 'cook' and cook_session_id is not null)
  )
);

alter table public.meal_history enable row level security;
revoke all on table public.meal_history from public, anon, authenticated;
grant select, insert, update, delete on table public.meal_history to authenticated, service_role;
grant usage, select on sequence public.meal_history_id_seq to authenticated, service_role;

create policy "Users can read their meal history"
on public.meal_history for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users can add their meal history"
on public.meal_history for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Users can update their meal history"
on public.meal_history for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Users can remove their meal history"
on public.meal_history for delete to authenticated
using ((select auth.uid()) = user_id);

create index meal_history_user_eaten_idx
on public.meal_history (user_id, eaten_at desc, id desc);
create index meal_history_user_recipe_eaten_idx
on public.meal_history (user_id, recipe_id, eaten_at desc);
create index meal_history_recipe_id_idx
on public.meal_history (recipe_id, id);

create or replace function public.mutate_recipe_personalisation(
  p_recipe_id bigint,
  p_operation text
)
returns table (
  feedback_state text,
  is_saved boolean,
  last_eaten_at timestamptz
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;
  if not exists (select 1 from public.recipes where id = p_recipe_id and is_active) then
    raise exception using errcode = '22023', message = 'That recipe is unavailable.';
  end if;

  if p_operation in ('like', 'dislike') then
    insert into public.recipe_feedback (user_id, recipe_id, state)
    values (v_user_id, p_recipe_id, case when p_operation = 'like' then 'liked' else 'disliked' end)
    on conflict (user_id, recipe_id)
    do update set state = excluded.state;
  elsif p_operation = 'undo_feedback' then
    delete from public.recipe_feedback
    where user_id = v_user_id and recipe_id = p_recipe_id;
  elsif p_operation = 'save' then
    insert into public.saved_recipes (user_id, recipe_id)
    values (v_user_id, p_recipe_id)
    on conflict (user_id, recipe_id) do nothing;
  elsif p_operation = 'unsave' then
    delete from public.saved_recipes
    where user_id = v_user_id and recipe_id = p_recipe_id;
  elsif p_operation = 'eaten' then
    insert into public.meal_history (user_id, recipe_id, source)
    values (v_user_id, p_recipe_id, 'manual');
  else
    raise exception using errcode = '22023', message = 'Unsupported personalisation operation.';
  end if;

  return query
  select
    (select state from public.recipe_feedback where user_id = v_user_id and recipe_id = p_recipe_id),
    exists (select 1 from public.saved_recipes where user_id = v_user_id and recipe_id = p_recipe_id),
    (select max(eaten_at) from public.meal_history where user_id = v_user_id and recipe_id = p_recipe_id);
end;
$$;

revoke all on function public.mutate_recipe_personalisation(bigint, text)
from public, anon;
grant execute on function public.mutate_recipe_personalisation(bigint, text)
to authenticated, service_role;

create or replace function public.mutate_cook_session(
  p_recipe_id bigint,
  p_operation text,
  p_servings smallint default null,
  p_step_number smallint default null,
  p_current_step smallint default null,
  p_completed boolean default null
)
returns table (
  cook_session_id bigint,
  session_status text,
  session_current_step smallint,
  completed_steps integer
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_user_id uuid := (select auth.uid());
  v_session public.cook_sessions%rowtype;
  v_step_count integer;
  v_completed_steps integer;
begin
  if v_user_id is null then raise exception using errcode = '42501', message = 'Authentication is required.'; end if;
  select count(*)::integer into v_step_count
  from public.recipe_steps join public.recipes on recipes.id = recipe_steps.recipe_id
  where recipe_steps.recipe_id = p_recipe_id and recipes.is_active;
  if v_step_count < 1 then raise exception using errcode = '22023', message = 'That recipe is unavailable.'; end if;

  if p_operation = 'start' then
    if p_servings is null or p_servings < 1 or p_servings > 30 then raise exception using errcode = '22023', message = 'Choose between 1 and 30 servings.'; end if;
    select * into v_session from public.cook_sessions
    where user_id = v_user_id and recipe_id = p_recipe_id and status = 'active' for update;
    if found then
      update public.cook_sessions set servings = p_servings where id = v_session.id returning * into v_session;
    else
      insert into public.cook_sessions (user_id, recipe_id, servings) values (v_user_id, p_recipe_id, p_servings) returning * into v_session;
    end if;
  else
    select * into v_session from public.cook_sessions
    where user_id = v_user_id and recipe_id = p_recipe_id and status = 'active' for update;
    if not found then raise exception using errcode = '22023', message = 'No active cooking session was found.'; end if;

    if p_operation = 'navigate' then
      if p_current_step is null or p_current_step < 1 or p_current_step > v_step_count then raise exception using errcode = '22023', message = 'That cooking step is unavailable.'; end if;
      update public.cook_sessions set current_step = p_current_step where id = v_session.id returning * into v_session;
    elsif p_operation = 'step' then
      if p_step_number is null or p_step_number < 1 or p_step_number > v_step_count or p_completed is null then raise exception using errcode = '22023', message = 'Valid step progress is required.'; end if;
      if p_completed then
        insert into public.cook_session_steps (session_id, user_id, step_number) values (v_session.id, v_user_id, p_step_number)
        on conflict (session_id, step_number) do update set completed_at = timezone('utc', now());
      else
        delete from public.cook_session_steps where session_id = v_session.id and step_number = p_step_number;
      end if;
      if p_current_step is not null then
        if p_current_step < 1 or p_current_step > v_step_count then raise exception using errcode = '22023', message = 'That cooking step is unavailable.'; end if;
        update public.cook_sessions set current_step = p_current_step where id = v_session.id returning * into v_session;
      end if;
    elsif p_operation = 'complete' then
      select count(*)::integer into v_completed_steps from public.cook_session_steps where session_id = v_session.id;
      if v_completed_steps <> v_step_count then raise exception using errcode = '22023', message = 'Complete every step before finishing.'; end if;
      update public.cook_sessions set status = 'completed', current_step = v_step_count, completed_at = timezone('utc', now())
      where id = v_session.id returning * into v_session;
      insert into public.meal_history (user_id, recipe_id, source, cook_session_id, eaten_at)
      values (v_user_id, p_recipe_id, 'cook', v_session.id, v_session.completed_at)
      on conflict (cook_session_id) do nothing;
    else
      raise exception using errcode = '22023', message = 'Unsupported cooking session operation.';
    end if;
  end if;

  select count(*)::integer into v_completed_steps from public.cook_session_steps where session_id = v_session.id;
  return query select v_session.id, v_session.status, v_session.current_step, v_completed_steps;
end;
$$;
