begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(28);

select has_table('public', 'recipes', 'recipes table exists');
select has_table('public', 'recipe_ingredients', 'recipe ingredients table exists');
select has_table('public', 'ingredient_costs', 'ingredient costs table exists');
select has_table('public', 'ingredient_substitutions', 'ingredient substitutions table exists');
select has_table('public', 'recipe_steps', 'recipe steps table exists');
select has_table('public', 'recipe_images', 'recipe images table exists');

select is(
  (select relrowsecurity from pg_class where oid = 'public.recipes'::regclass),
  true,
  'recipes has RLS enabled'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.recipe_ingredients'::regclass),
  true,
  'recipe ingredients has RLS enabled'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.ingredient_costs'::regclass),
  true,
  'ingredient costs has RLS enabled'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.ingredient_substitutions'::regclass),
  true,
  'ingredient substitutions has RLS enabled'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.recipe_steps'::regclass),
  true,
  'recipe steps has RLS enabled'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.recipe_images'::regclass),
  true,
  'recipe images has RLS enabled'
);

select policies_are(
  'public',
  'recipes',
  array['Active recipes are publicly readable'],
  'recipes exposes only its public read policy'
);
select policies_are(
  'public',
  'recipe_ingredients',
  array['Ingredients for active recipes are publicly readable'],
  'recipe ingredients exposes only its public read policy'
);
select policies_are(
  'public',
  'ingredient_costs',
  array['Active ingredient costs are publicly readable'],
  'ingredient costs exposes only its public read policy'
);
select policies_are(
  'public',
  'ingredient_substitutions',
  array['Active ingredient substitutions are publicly readable'],
  'ingredient substitutions exposes only its public read policy'
);
select policies_are(
  'public',
  'recipe_steps',
  array['Steps for active recipes are publicly readable'],
  'recipe steps exposes only its public read policy'
);
select policies_are(
  'public',
  'recipe_images',
  array['Images for active recipes are publicly readable'],
  'recipe images exposes only its public read policy'
);

select is(
  (select count(*) from public.recipes where is_active),
  30::bigint,
  'thirty curated recipes are active'
);
select is(
  (
    select count(*)
    from public.recipes
    where is_active
      and not exists (
        select 1
        from public.recipe_ingredients
        where recipe_ingredients.recipe_id = recipes.id
      )
  ),
  0::bigint,
  'every active recipe has ingredients'
);
select is(
  (
    select count(*)
    from public.ingredients
    where is_active
      and not exists (
        select 1
        from public.ingredient_costs
        where ingredient_costs.ingredient_id = ingredients.id
          and ingredient_costs.is_active
          and ingredient_costs.location = 'Nairobi'
      )
  ),
  0::bigint,
  'every active ingredient has a Nairobi cost reference'
);
select is(
  (select count(*) from public.ingredient_substitutions where is_active),
  6::bigint,
  'six curated substitutions are active'
);

select is(
  (
    select count(*)
    from public.recipes
    where is_active
      and not exists (
        select 1 from public.recipe_steps
        where recipe_steps.recipe_id = recipes.id
      )
  ),
  0::bigint,
  'every active recipe has ordered steps'
);
select is(
  (
    select count(*)
    from public.recipes
    where is_active
      and not exists (
        select 1 from public.recipe_images
        where recipe_images.recipe_id = recipes.id
          and recipe_images.is_primary
      )
  ),
  0::bigint,
  'every active recipe has a primary attributed image'
);
select cmp_ok(
  (select count(*) from public.recipes where is_active and meal_types @> array['breakfast']),
  '>=',
  7::bigint,
  'the catalogue has meaningful breakfast coverage'
);
select cmp_ok(
  (select count(*) from public.recipes where is_active and meal_types @> array['lunch']),
  '>=',
  20::bigint,
  'the catalogue has meaningful lunch coverage'
);
select cmp_ok(
  (select count(*) from public.recipes where is_active and meal_types @> array['dinner']),
  '>=',
  20::bigint,
  'the catalogue has meaningful dinner coverage'
);
select is(
  (
    select count(*)
    from public.ingredient_costs
    where is_active
      and (source_url !~ '^https://' or captured_on > current_date)
  ),
  0::bigint,
  'active cost references have valid dated HTTPS sources'
);

select * from finish();
rollback;
