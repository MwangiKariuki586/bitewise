create table public.cook_sessions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id bigint not null references public.recipes(id) on delete restrict,
  servings smallint not null check (servings between 1 and 30),
  current_step smallint not null default 1 check (current_step between 1 and 30),
  status text not null default 'active' check (status in ('active', 'completed')),
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  check (
    (status = 'active' and completed_at is null)
    or (status = 'completed' and completed_at is not null)
  )
);

alter table public.cook_sessions enable row level security;
revoke all on table public.cook_sessions from public, anon, authenticated;
grant select, insert, update, delete on table public.cook_sessions to authenticated;
grant select, insert, update, delete on table public.cook_sessions to service_role;
grant usage, select on sequence public.cook_sessions_id_seq to authenticated, service_role;

create policy "Users can read their cook sessions"
on public.cook_sessions for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can add their cook sessions"
on public.cook_sessions for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their cook sessions"
on public.cook_sessions for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can remove their cook sessions"
on public.cook_sessions for delete to authenticated
using ((select auth.uid()) = user_id);

create trigger cook_sessions_set_updated_at
before update on public.cook_sessions
for each row execute function public.set_updated_at();

create unique index cook_sessions_one_active_recipe_idx
on public.cook_sessions (user_id, recipe_id)
where status = 'active';

create index cook_sessions_user_status_updated_idx
on public.cook_sessions (user_id, status, updated_at desc, id desc);

create index cook_sessions_recipe_id_idx
on public.cook_sessions (recipe_id, id);

create table public.cook_session_steps (
  session_id bigint not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  step_number smallint not null check (step_number between 1 and 30),
  completed_at timestamptz not null default timezone('utc', now()),
  primary key (session_id, step_number),
  constraint cook_session_steps_session_owner_fkey
    foreign key (session_id, user_id)
    references public.cook_sessions(id, user_id)
    on delete cascade
);

alter table public.cook_session_steps enable row level security;
revoke all on table public.cook_session_steps from public, anon, authenticated;
grant select, insert, update, delete on table public.cook_session_steps to authenticated;
grant select, insert, update, delete on table public.cook_session_steps to service_role;

create policy "Users can read their cook step progress"
on public.cook_session_steps for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can add their cook step progress"
on public.cook_session_steps for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their cook step progress"
on public.cook_session_steps for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can remove their cook step progress"
on public.cook_session_steps for delete to authenticated
using ((select auth.uid()) = user_id);

create index cook_session_steps_session_owner_idx
on public.cook_session_steps (session_id, user_id);

create index cook_session_steps_user_id_idx
on public.cook_session_steps (user_id, session_id);

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
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  select count(*)::integer
  into v_step_count
  from public.recipe_steps
  join public.recipes on recipes.id = recipe_steps.recipe_id
  where recipe_steps.recipe_id = p_recipe_id
    and recipes.is_active;

  if v_step_count < 1 then
    raise exception using errcode = '22023', message = 'That recipe is unavailable.';
  end if;

  if p_operation = 'start' then
    if p_servings is null or p_servings < 1 or p_servings > 30 then
      raise exception using errcode = '22023', message = 'Choose between 1 and 30 servings.';
    end if;

    select * into v_session
    from public.cook_sessions
    where user_id = v_user_id
      and recipe_id = p_recipe_id
      and status = 'active'
    for update;

    if found then
      update public.cook_sessions
      set servings = p_servings
      where id = v_session.id
      returning * into v_session;
    else
      insert into public.cook_sessions (user_id, recipe_id, servings)
      values (v_user_id, p_recipe_id, p_servings)
      returning * into v_session;
    end if;
  else
    select * into v_session
    from public.cook_sessions
    where user_id = v_user_id
      and recipe_id = p_recipe_id
      and status = 'active'
    for update;

    if not found then
      raise exception using errcode = '22023', message = 'No active cooking session was found.';
    end if;

    if p_operation = 'navigate' then
      if p_current_step is null or p_current_step < 1 or p_current_step > v_step_count then
        raise exception using errcode = '22023', message = 'That cooking step is unavailable.';
      end if;
      update public.cook_sessions
      set current_step = p_current_step
      where id = v_session.id
      returning * into v_session;
    elsif p_operation = 'step' then
      if p_step_number is null or p_step_number < 1 or p_step_number > v_step_count
        or p_completed is null then
        raise exception using errcode = '22023', message = 'Valid step progress is required.';
      end if;

      if p_completed then
        insert into public.cook_session_steps (session_id, user_id, step_number)
        values (v_session.id, v_user_id, p_step_number)
        on conflict (session_id, step_number)
        do update set completed_at = timezone('utc', now());
      else
        delete from public.cook_session_steps
        where session_id = v_session.id
          and step_number = p_step_number;
      end if;

      if p_current_step is not null then
        if p_current_step < 1 or p_current_step > v_step_count then
          raise exception using errcode = '22023', message = 'That cooking step is unavailable.';
        end if;
        update public.cook_sessions
        set current_step = p_current_step
        where id = v_session.id
        returning * into v_session;
      end if;
    elsif p_operation = 'complete' then
      select count(*)::integer into v_completed_steps
      from public.cook_session_steps
      where session_id = v_session.id;

      if v_completed_steps <> v_step_count then
        raise exception using errcode = '22023', message = 'Complete every step before finishing.';
      end if;

      update public.cook_sessions
      set
        status = 'completed',
        current_step = v_step_count,
        completed_at = timezone('utc', now())
      where id = v_session.id
      returning * into v_session;
    else
      raise exception using errcode = '22023', message = 'Unsupported cooking session operation.';
    end if;
  end if;

  select count(*)::integer into v_completed_steps
  from public.cook_session_steps
  where session_id = v_session.id;

  return query
  select v_session.id, v_session.status, v_session.current_step, v_completed_steps;
end;
$$;

revoke all on function public.mutate_cook_session(
  bigint, text, smallint, smallint, smallint, boolean
) from public, anon;
grant execute on function public.mutate_cook_session(
  bigint, text, smallint, smallint, smallint, boolean
) to authenticated, service_role;
