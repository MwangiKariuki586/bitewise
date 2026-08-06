create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 2 and 80),
  budget_period text not null default 'weekly' check (budget_period in ('daily', 'weekly')),
  budget_minor integer check (budget_minor is null or budget_minor between 100 and 100000000),
  household_size smallint not null default 1 check (household_size between 1 and 30),
  available_minutes smallint not null default 45 check (available_minutes between 5 and 480),
  equipment text[] not null default '{}',
  dietary_preferences text[] not null default '{}',
  health_goals text[] not null default '{}',
  preferred_cuisines text[] not null default '{}',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select, insert, update on table public.profiles to authenticated;

create policy "Users can read their profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create index profiles_onboarding_lookup_idx
on public.profiles (user_id, onboarding_completed);

create table public.rate_limit_buckets (
  key_hash text not null,
  action text not null,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  expires_at timestamptz not null,
  primary key (key_hash, action, window_started_at)
);

alter table public.rate_limit_buckets enable row level security;

revoke all on table public.rate_limit_buckets from public, anon, authenticated;
grant select, insert, update, delete on table public.rate_limit_buckets to service_role;

create index rate_limit_buckets_expiry_idx
on public.rate_limit_buckets (expires_at);

create or replace function public.consume_rate_limit(
  p_key_hash text,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_window_start timestamptz;
  v_count integer;
begin
  if p_key_hash is null or char_length(p_key_hash) < 32 then
    raise exception 'A valid hashed rate-limit key is required';
  end if;

  if p_action is null or char_length(p_action) > 80 or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate-limit configuration';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limit_buckets (
    key_hash,
    action,
    window_started_at,
    request_count,
    expires_at
  )
  values (
    p_key_hash,
    p_action,
    v_window_start,
    1,
    v_window_start + make_interval(secs => p_window_seconds * 2)
  )
  on conflict (key_hash, action, window_started_at)
  do update set request_count = public.rate_limit_buckets.request_count + 1
  returning request_count into v_count;

  delete from public.rate_limit_buckets
  where expires_at < v_now
    and random() < 0.01;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, integer)
from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer)
to service_role;
