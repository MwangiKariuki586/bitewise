create extension if not exists pg_trgm with schema extensions;

create table public.ingredients (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null unique check (char_length(name) between 2 and 100),
  aliases text[] not null default '{}',
  default_unit text not null check (
    default_unit in ('g', 'kg', 'ml', 'l', 'piece', 'packet', 'bunch', 'cup', 'tbsp', 'tsp')
  ),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.ingredients enable row level security;
revoke all on table public.ingredients from public, anon, authenticated;
grant select on table public.ingredients to anon, authenticated;
grant select, insert, update, delete on table public.ingredients to service_role;
grant usage, select on sequence public.ingredients_id_seq to service_role;

create policy "Active ingredients are publicly readable"
on public.ingredients for select
to anon, authenticated
using (is_active);

create index ingredients_name_search_idx
on public.ingredients using gin (lower(name) extensions.gin_trgm_ops)
where is_active;

create table public.pantry_items (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  ingredient_id bigint not null references public.ingredients(id) on delete restrict,
  quantity numeric(12, 3) not null check (quantity > 0 and quantity <= 1000000000),
  unit text not null check (
    unit in ('g', 'kg', 'ml', 'l', 'piece', 'packet', 'bunch', 'cup', 'tbsp', 'tsp')
  ),
  expiry_date date,
  notes text check (notes is null or char_length(notes) <= 300),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique nulls not distinct (user_id, ingredient_id, unit, expiry_date)
);

alter table public.pantry_items enable row level security;
revoke all on table public.pantry_items from public, anon, authenticated;
grant select, insert, update, delete on table public.pantry_items to authenticated;
grant select, insert, update, delete on table public.pantry_items to service_role;
grant usage, select on sequence public.pantry_items_id_seq to authenticated, service_role;

create policy "Users can read their pantry"
on public.pantry_items for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can add to their pantry"
on public.pantry_items for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their pantry"
on public.pantry_items for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can remove from their pantry"
on public.pantry_items for delete
to authenticated
using ((select auth.uid()) = user_id);

create trigger pantry_items_set_updated_at
before update on public.pantry_items
for each row execute function public.set_updated_at();

create index pantry_items_user_expiry_idx
on public.pantry_items (user_id, expiry_date asc nulls last, id);

create index pantry_items_user_ingredient_idx
on public.pantry_items (user_id, ingredient_id);

insert into public.ingredients (slug, name, aliases, default_unit)
values
  ('avocado', 'Avocado', array['avocados'], 'piece'),
  ('banana', 'Banana', array['matoke'], 'piece'),
  ('beef', 'Beef', array['nyama ya ngombe'], 'g'),
  ('bell-pepper', 'Bell pepper', array['capsicum', 'pilipili hoho'], 'piece'),
  ('black-beans', 'Black beans', array['njahi'], 'g'),
  ('cabbage', 'Cabbage', array['kabichi'], 'g'),
  ('carrot', 'Carrot', array['carrots'], 'g'),
  ('chicken', 'Chicken', array['kuku'], 'g'),
  ('coconut-milk', 'Coconut milk', array['maziwa ya nazi'], 'ml'),
  ('cooking-oil', 'Cooking oil', array['vegetable oil'], 'ml'),
  ('coriander', 'Coriander', array['dhania', 'cilantro'], 'bunch'),
  ('cowpeas', 'Cowpeas', array['kunde'], 'g'),
  ('dried-beans', 'Dried beans', array['maharagwe'], 'g'),
  ('eggs', 'Eggs', array['mayai'], 'piece'),
  ('fish', 'Fish', array['samaki'], 'g'),
  ('garlic', 'Garlic', array['kitunguu saumu'], 'g'),
  ('ginger', 'Ginger', array['tangawizi'], 'g'),
  ('green-grams', 'Green grams', array['ndengu', 'mung beans'], 'g'),
  ('kale', 'Kale', array['sukuma wiki'], 'bunch'),
  ('maize', 'Dry maize', array['mahindi'], 'g'),
  ('maize-flour', 'Maize flour', array['unga wa ugali'], 'g'),
  ('milk', 'Milk', array['maziwa'], 'ml'),
  ('onion', 'Onion', array['kitunguu'], 'piece'),
  ('peas', 'Peas', array['minji'], 'g'),
  ('potato', 'Potato', array['viazi'], 'g'),
  ('pumpkin', 'Pumpkin', array['malenge'], 'g'),
  ('red-lentils', 'Red lentils', array['dengu'], 'g'),
  ('rice', 'Rice', array['mchele'], 'g'),
  ('salt', 'Salt', array['chumvi'], 'g'),
  ('spinach', 'Spinach', array['mchicha'], 'bunch'),
  ('sweet-potato', 'Sweet potato', array['viazi vitamu'], 'g'),
  ('tea-leaves', 'Tea leaves', array['majani ya chai'], 'g'),
  ('tomato', 'Tomato', array['nyanya'], 'piece'),
  ('wheat-flour', 'Wheat flour', array['unga wa ngano'], 'g'),
  ('yoghurt', 'Plain yoghurt', array['yogurt'], 'ml');
