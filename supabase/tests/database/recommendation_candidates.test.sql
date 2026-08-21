begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(12);

select has_function(
  'public',
  'get_recommendation_candidates',
  array['text[]', 'text[]', 'integer', 'integer', 'integer', 'text'],
  'recommendation candidate function exists'
);
select is(
  has_function_privilege(
    'authenticated',
    'public.get_recommendation_candidates(text[],text[],integer,integer,integer,text)',
    'execute'
  ),
  true,
  'authenticated users can generate candidates'
);
select is(
  has_function_privilege(
    'anon',
    'public.get_recommendation_candidates(text[],text[],integer,integer,integer,text)',
    'execute'
  ),
  false,
  'anonymous users cannot generate candidates'
);

create temporary table candidate_fixture on commit drop as
select *
from public.get_recommendation_candidates(
  array['vegan'],
  array['gas_cooker'],
  90,
  100000,
  4,
  'dinner'
);

select cmp_ok(
  (select count(*) from candidate_fixture),
  '>',
  0::bigint,
  'valid hard constraints return candidates'
);
select cmp_ok(
  (select count(*) from candidate_fixture),
  '<=',
  50::bigint,
  'candidate query is capped at fifty rows'
);
select cmp_ok(
  (
    select count(*)
    from public.get_recommendation_candidates(
      array['vegan'], array['gas_cooker'], 90, 10000, 4, 'dinner'
    )
  ),
  '>',
  0::bigint,
  'valid low budgets still return candidates for pantry-aware application filtering'
);
select cmp_ok(
  (
    select count(*)
    from public.get_recommendation_candidates(
      array['vegan'], array['gas_cooker'], 90, 0, 4, 'dinner'
    )
  ),
  '>',
  0::bigint,
  'a zero budget still returns candidates for pantry-aware application filtering'
);
select is(
  (
    select count(*)
    from candidate_fixture
    join public.recipes on recipes.id = candidate_fixture.recipe_id
    where not (recipes.dietary_tags @> array['vegan'])
  ),
  0::bigint,
  'dietary requirements are never relaxed'
);
select is(
  (
    select count(*)
    from candidate_fixture
    join public.recipes on recipes.id = candidate_fixture.recipe_id
    where recipes.prep_minutes + recipes.cook_minutes > 90
  ),
  0::bigint,
  'time remains a hard constraint'
);
select is(
  (
    select count(*)
    from candidate_fixture
    join public.recipes on recipes.id = candidate_fixture.recipe_id
    where not ('dinner' = any(recipes.meal_types))
  ),
  0::bigint,
  'meal type remains a hard constraint'
);
select is(
  (
    select count(*)
    from public.get_recommendation_candidates(
      array[]::text[], array[]::text[], 90, 100000, 4, null
    )
  ),
  0::bigint,
  'a missing heat source does not silently relax equipment'
);
select is(
  (
    select count(*)
    from public.get_recommendation_candidates(
      array[]::text[], array['gas_cooker'], 90, -1, 4, null
    )
  ),
  0::bigint,
  'invalid budget bounds return no candidates'
);

select * from finish();
rollback;
