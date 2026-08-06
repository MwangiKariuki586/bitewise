create table public.leftovers (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  recipe_id bigint,
  servings numeric(6, 2) not null check (servings > 0 and servings <= 100),
  prepared_date date not null,
  expiry_date date not null check (expiry_date >= prepared_date),
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.leftovers enable row level security;
revoke all on table public.leftovers from public, anon, authenticated;
grant select, insert, update, delete on table public.leftovers to authenticated;
grant select, insert, update, delete on table public.leftovers to service_role;
grant usage, select on sequence public.leftovers_id_seq to authenticated, service_role;

create policy "Users can read their leftovers"
on public.leftovers for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can add leftovers"
on public.leftovers for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their leftovers"
on public.leftovers for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can remove leftovers"
on public.leftovers for delete
to authenticated
using ((select auth.uid()) = user_id);

create trigger leftovers_set_updated_at
before update on public.leftovers
for each row execute function public.set_updated_at();

create index leftovers_user_expiry_idx
on public.leftovers (user_id, expiry_date, id);

create index leftovers_name_search_idx
on public.leftovers using gin (lower(name) extensions.gin_trgm_ops);
