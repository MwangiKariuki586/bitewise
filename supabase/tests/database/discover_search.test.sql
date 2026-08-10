begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(12);

select has_function(
  'public',
  'search_public_recipes',
  array['text', 'integer', 'text[]', 'text[]', 'bigint', 'text', 'text', 'text', 'integer', 'integer'],
  'public recipe search function exists'
);
select has_index(
  'public',
  'recipes',
  'recipes_active_name_search_idx',
  'active recipe names have a search index'
);
select ok(
  has_function_privilege(
    'anon',
    'public.search_public_recipes(text,integer,text[],text[],bigint,text,text,text,integer,integer)',
    'execute'
  ),
  'anonymous visitors can search published recipes'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.search_public_recipes(text,integer,text[],text[],bigint,text,text,text,integer,integer)',
    'execute'
  ),
  'authenticated visitors can search published recipes'
);

set local role anon;

select cmp_ok(
  (
    select count(*)
    from public.search_public_recipes(p_limit => 12)
  ),
  '>',
  0::bigint,
  'anonymous search returns published recipes'
);
select cmp_ok(
  (
    select max(total_count)
    from public.search_public_recipes(p_limit => 1)
  ),
  '>',
  1::bigint,
  'search exposes a database-side total for pagination'
);
select cmp_ok(
  (
    select count(*)
    from public.search_public_recipes(p_query => 'chapati')
    where lower(name) like '%chapati%'
  ),
  '>',
  0::bigint,
  'name search finds matching recipes'
);
select is(
  (
    select count(*)
    from public.search_public_recipes(p_ingredient_query => 'sukuma')
    where slug = 'ugali-sukuma-wiki'
  ),
  1::bigint,
  'local ingredient aliases filter recipes'
);
select is(
  (
    select count(*)
    from public.search_public_recipes(p_max_minutes => 30)
    where total_minutes > 30
  ),
  0::bigint,
  'time filter is applied in the database'
);
select is(
  (
    select count(*)
    from public.search_public_recipes(p_dietary_tags => array['vegan'])
    where not array['vegan']::text[] <@ dietary_tags
  ),
  0::bigint,
  'dietary filter is applied in the database'
);
select is(
  (
    select count(*)
    from public.search_public_recipes(p_cuisine => 'swahili_coast')
    where cuisine <> 'swahili_coast'
  ),
  0::bigint,
  'cuisine filter is applied in the database'
);
select is(
  (
    select count(*)
    from public.search_public_recipes(p_limit => 1, p_offset => 1)
  ),
  1::bigint,
  'bounded pagination returns one requested row'
);

select * from finish();
rollback;
