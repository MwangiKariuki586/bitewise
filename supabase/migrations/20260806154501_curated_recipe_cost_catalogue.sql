create table public.recipes (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null unique check (char_length(name) between 2 and 120),
  summary text not null check (char_length(summary) between 20 and 300),
  cuisine text not null check (
    cuisine in (
      'kenyan', 'swahili_coast', 'kikuyu', 'luo', 'luhya', 'kamba',
      'kisii', 'indian_kenyan', 'ethiopian', 'mediterranean'
    )
  ),
  meal_types text[] not null check (
    cardinality(meal_types) between 1 and 3
    and array_position(meal_types, null) is null
    and meal_types <@ array['breakfast', 'lunch', 'dinner', 'snack']::text[]
  ),
  base_servings smallint not null check (base_servings between 1 and 20),
  prep_minutes smallint not null check (prep_minutes between 0 and 240),
  cook_minutes smallint not null check (cook_minutes between 1 and 480),
  difficulty text not null check (difficulty in ('easy', 'moderate')),
  accepted_heat_sources text[] not null default '{}' check (
    array_position(accepted_heat_sources, null) is null
    and accepted_heat_sources <@ array['gas_cooker', 'electric_cooker', 'jiko']::text[]
  ),
  required_equipment text[] not null default '{}' check (
    array_position(required_equipment, null) is null
    and required_equipment <@ array[
      'oven', 'microwave', 'air_fryer', 'blender', 'pressure_cooker', 'refrigerator'
    ]::text[]
  ),
  dietary_tags text[] not null default '{}' check (
    array_position(dietary_tags, null) is null
    and dietary_tags <@ array[
      'vegetarian', 'vegan', 'pescatarian', 'halal', 'gluten_free',
      'dairy_free', 'nut_free'
    ]::text[]
  ),
  health_tags text[] not null default '{}' check (
    array_position(health_tags, null) is null
    and health_tags <@ array[
      'balanced_eating', 'weight_management', 'heart_health',
      'blood_sugar_support', 'high_protein', 'high_fibre', 'low_sodium'
    ]::text[]
  ),
  instructions text[] not null check (
    cardinality(instructions) between 2 and 30
    and array_position(instructions, null) is null
  ),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.recipes enable row level security;
revoke all on table public.recipes from public, anon, authenticated;
grant select on table public.recipes to anon, authenticated;
grant select, insert, update, delete on table public.recipes to service_role;
grant usage, select on sequence public.recipes_id_seq to service_role;

create policy "Active recipes are publicly readable"
on public.recipes for select
to anon, authenticated
using (is_active);

create trigger recipes_set_updated_at
before update on public.recipes
for each row execute function public.set_updated_at();

create index recipes_active_cuisine_idx
on public.recipes (cuisine, id)
where is_active;

create index recipes_active_total_time_idx
on public.recipes ((prep_minutes + cook_minutes), id)
where is_active;

create index recipes_meal_types_idx
on public.recipes using gin (meal_types)
where is_active;

create index recipes_dietary_tags_idx
on public.recipes using gin (dietary_tags)
where is_active;

create index recipes_health_tags_idx
on public.recipes using gin (health_tags)
where is_active;

alter table public.ingredients
  add constraint ingredients_id_default_unit_key unique (id, default_unit);

insert into public.ingredients (slug, name, aliases, default_unit)
values ('sugar', 'Sugar', array['sukari'], 'g');

create table public.recipe_ingredients (
  recipe_id bigint not null references public.recipes(id) on delete cascade,
  ingredient_id bigint not null,
  quantity numeric(12, 3) not null check (quantity > 0 and quantity <= 1000000000),
  unit text not null check (
    unit in ('g', 'kg', 'ml', 'l', 'piece', 'packet', 'bunch', 'cup', 'tbsp', 'tsp')
  ),
  is_optional boolean not null default false,
  preparation text check (preparation is null or char_length(preparation) <= 120),
  sort_order smallint not null check (sort_order between 1 and 100),
  primary key (recipe_id, ingredient_id),
  unique (recipe_id, sort_order),
  constraint recipe_ingredients_ingredient_fkey foreign key (ingredient_id, unit)
    references public.ingredients(id, default_unit) on delete restrict
);

alter table public.recipe_ingredients enable row level security;
revoke all on table public.recipe_ingredients from public, anon, authenticated;
grant select on table public.recipe_ingredients to anon, authenticated;
grant select, insert, update, delete on table public.recipe_ingredients to service_role;

create policy "Ingredients for active recipes are publicly readable"
on public.recipe_ingredients for select
to anon, authenticated
using (
  exists (
    select 1 from public.recipes
    where recipes.id = recipe_ingredients.recipe_id
      and recipes.is_active
  )
  and exists (
    select 1 from public.ingredients
    where ingredients.id = recipe_ingredients.ingredient_id
      and ingredients.is_active
  )
);

create index recipe_ingredients_ingredient_id_idx
on public.recipe_ingredients (ingredient_id, recipe_id);

create table public.ingredient_costs (
  id bigint generated always as identity primary key,
  ingredient_id bigint not null,
  quantity numeric(12, 3) not null check (quantity > 0 and quantity <= 1000000000),
  unit text not null check (
    unit in ('g', 'kg', 'ml', 'l', 'piece', 'packet', 'bunch', 'cup', 'tbsp', 'tsp')
  ),
  price_minor integer not null check (price_minor between 1 and 1000000000),
  location text not null check (char_length(location) between 2 and 80),
  source_label text not null check (char_length(source_label) between 2 and 120),
  source_url text not null check (source_url ~ '^https://'),
  captured_on date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint ingredient_costs_ingredient_fkey foreign key (ingredient_id, unit)
    references public.ingredients(id, default_unit) on delete restrict
);

alter table public.ingredient_costs enable row level security;
revoke all on table public.ingredient_costs from public, anon, authenticated;
grant select on table public.ingredient_costs to anon, authenticated;
grant select, insert, update, delete on table public.ingredient_costs to service_role;
grant usage, select on sequence public.ingredient_costs_id_seq to service_role;

create policy "Active ingredient costs are publicly readable"
on public.ingredient_costs for select
to anon, authenticated
using (
  is_active
  and exists (
    select 1 from public.ingredients
    where ingredients.id = ingredient_costs.ingredient_id
      and ingredients.is_active
  )
);

create trigger ingredient_costs_set_updated_at
before update on public.ingredient_costs
for each row execute function public.set_updated_at();

create unique index ingredient_costs_one_active_location_idx
on public.ingredient_costs (ingredient_id, location)
where is_active;

create index ingredient_costs_history_idx
on public.ingredient_costs (ingredient_id, location, captured_on desc, id desc);

create table public.ingredient_substitutions (
  id bigint generated always as identity primary key,
  source_ingredient_id bigint not null,
  source_quantity numeric(12, 3) not null check (source_quantity > 0),
  source_unit text not null check (
    source_unit in ('g', 'kg', 'ml', 'l', 'piece', 'packet', 'bunch', 'cup', 'tbsp', 'tsp')
  ),
  alternative_ingredient_id bigint not null,
  alternative_quantity numeric(12, 3) not null check (alternative_quantity > 0),
  alternative_unit text not null check (
    alternative_unit in ('g', 'kg', 'ml', 'l', 'piece', 'packet', 'bunch', 'cup', 'tbsp', 'tsp')
  ),
  note text not null check (char_length(note) between 10 and 240),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (source_ingredient_id <> alternative_ingredient_id),
  unique (source_ingredient_id, alternative_ingredient_id),
  constraint ingredient_substitutions_source_fkey
    foreign key (source_ingredient_id, source_unit)
    references public.ingredients(id, default_unit) on delete restrict,
  constraint ingredient_substitutions_alternative_fkey
    foreign key (alternative_ingredient_id, alternative_unit)
    references public.ingredients(id, default_unit) on delete restrict
);

alter table public.ingredient_substitutions enable row level security;
revoke all on table public.ingredient_substitutions from public, anon, authenticated;
grant select on table public.ingredient_substitutions to anon, authenticated;
grant select, insert, update, delete on table public.ingredient_substitutions to service_role;
grant usage, select on sequence public.ingredient_substitutions_id_seq to service_role;

create policy "Active ingredient substitutions are publicly readable"
on public.ingredient_substitutions for select
to anon, authenticated
using (
  is_active
  and exists (
    select 1 from public.ingredients
    where ingredients.id = ingredient_substitutions.source_ingredient_id
      and ingredients.is_active
  )
  and exists (
    select 1 from public.ingredients
    where ingredients.id = ingredient_substitutions.alternative_ingredient_id
      and ingredients.is_active
  )
);

create trigger ingredient_substitutions_set_updated_at
before update on public.ingredient_substitutions
for each row execute function public.set_updated_at();

create index ingredient_substitutions_alternative_id_idx
on public.ingredient_substitutions (alternative_ingredient_id, source_ingredient_id);

create table public.recipe_steps (
  recipe_id bigint not null references public.recipes(id) on delete cascade,
  step_number smallint not null check (step_number between 1 and 30),
  instruction text not null check (char_length(instruction) between 10 and 1000),
  primary key (recipe_id, step_number)
);

alter table public.recipe_steps enable row level security;
revoke all on table public.recipe_steps from public, anon, authenticated;
grant select on table public.recipe_steps to anon, authenticated;
grant select, insert, update, delete on table public.recipe_steps to service_role;

create policy "Steps for active recipes are publicly readable"
on public.recipe_steps for select
to anon, authenticated
using (
  exists (
    select 1 from public.recipes
    where recipes.id = recipe_steps.recipe_id
      and recipes.is_active
  )
);

create table public.recipe_images (
  id bigint generated always as identity primary key,
  recipe_id bigint not null references public.recipes(id) on delete cascade,
  local_path text not null check (local_path ~ '^/images/recipes/[a-z0-9-]+\.webp$'),
  alt_text text not null check (char_length(alt_text) between 10 and 180),
  width smallint not null check (width between 320 and 4096),
  height smallint not null check (height between 240 and 4096),
  attribution_name text not null check (char_length(attribution_name) between 2 and 160),
  attribution_url text not null check (attribution_url ~ '^https://'),
  license_name text not null check (char_length(license_name) between 2 and 80),
  license_url text not null check (license_url ~ '^https://'),
  is_primary boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  unique (recipe_id, local_path)
);

alter table public.recipe_images enable row level security;
revoke all on table public.recipe_images from public, anon, authenticated;
grant select on table public.recipe_images to anon, authenticated;
grant select, insert, update, delete on table public.recipe_images to service_role;
grant usage, select on sequence public.recipe_images_id_seq to service_role;

create policy "Images for active recipes are publicly readable"
on public.recipe_images for select
to anon, authenticated
using (
  exists (
    select 1 from public.recipes
    where recipes.id = recipe_images.recipe_id
      and recipes.is_active
  )
);

create unique index recipe_images_one_primary_idx
on public.recipe_images (recipe_id)
where is_primary;

alter table public.leftovers
  add constraint leftovers_recipe_id_fkey
  foreign key (recipe_id) references public.recipes(id) on delete set null;

create index leftovers_recipe_id_idx
on public.leftovers (recipe_id)
where recipe_id is not null;

insert into public.recipes (
  slug, name, summary, cuisine, meal_types, base_servings, prep_minutes,
  cook_minutes, difficulty, accepted_heat_sources, required_equipment,
  dietary_tags, health_tags, instructions
)
values
  (
    'ugali-sukuma-wiki', 'Ugali with Sukuma Wiki',
    'A dependable Kenyan staple of firm maize meal served with quickly braised greens and tomatoes.',
    'kenyan', array['lunch', 'dinner'], 4, 10, 30, 'easy',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'vegan', 'halal', 'gluten_free', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_fibre'],
    array[
      'Bring water to a boil, add the maize flour gradually, and stir until the ugali is firm and smooth.',
      'Warm the oil in a second pan and soften the onion before adding the tomatoes.',
      'Add the sliced sukuma wiki and salt, then cook until tender but still bright.',
      'Shape the ugali and serve it hot with the sukuma wiki.'
    ]
  ),
  (
    'classic-githeri', 'Classic Githeri',
    'A filling one-pot mix of maize and beans simmered with tomatoes, carrots, and onions.',
    'kenyan', array['lunch', 'dinner'], 4, 15, 55, 'easy',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'vegan', 'halal', 'gluten_free', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_fibre', 'high_protein'],
    array[
      'Soak the maize and beans ahead when possible, then boil them together until tender.',
      'Warm the oil and cook the onion, tomatoes, and carrots until softened.',
      'Stir in the cooked maize and beans with a little cooking liquid and salt.',
      'Simmer until the vegetables are tender and the sauce coats the githeri.'
    ]
  ),
  (
    'ndengu-with-rice', 'Ndengu with Rice',
    'Green gram stew with rice, tomatoes, carrots, and onions for an affordable everyday meal.',
    'kenyan', array['lunch', 'dinner'], 4, 15, 45, 'easy',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'vegan', 'halal', 'gluten_free', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_fibre', 'high_protein'],
    array[
      'Rinse the green grams and boil them until tender.',
      'Cook the rice separately until the grains are tender and the water is absorbed.',
      'Warm the oil and cook the onion, tomatoes, and carrots into a thick sauce.',
      'Fold in the green grams, season with salt, and simmer before serving with rice.'
    ]
  ),
  (
    'chapati-bean-stew', 'Chapati with Bean Stew',
    'Soft pan-cooked chapati paired with a tomato-rich bean stew for a generous family meal.',
    'kenyan', array['lunch', 'dinner'], 4, 30, 55, 'moderate',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'vegan', 'halal', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_fibre', 'high_protein'],
    array[
      'Mix the wheat flour with salt, some oil, and enough water to make a soft dough.',
      'Rest the dough, divide it, roll each portion thinly, and cook the chapati on a hot pan.',
      'Cook the onion, tomatoes, and carrots in oil until they form a sauce.',
      'Add the cooked beans and a little water, then simmer until thick and serve with the chapati.'
    ]
  ),
  (
    'vegetable-mukimo', 'Vegetable Mukimo',
    'Mashed potatoes, maize, peas, and greens combined into a comforting central Kenyan dish.',
    'kikuyu', array['lunch', 'dinner'], 4, 20, 45, 'easy',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'vegan', 'halal', 'gluten_free', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_fibre'],
    array[
      'Boil the maize until nearly tender, then add the potatoes and peas.',
      'Add the chopped kale near the end and cook until all the vegetables are tender.',
      'Drain most of the liquid, add salt, and mash everything together.',
      'Soften the onion in oil and fold it through the mukimo before serving.'
    ]
  ),
  (
    'matoke-beef-stew', 'Matoke Beef Stew',
    'Green bananas and beef cooked slowly with tomatoes, carrots, and onions in one satisfying pot.',
    'kisii', array['lunch', 'dinner'], 4, 20, 55, 'moderate',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['gluten_free', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_protein'],
    array[
      'Brown the beef in a little oil, then add the onion and cook until softened.',
      'Add the tomatoes and carrots and cook until the tomatoes break down.',
      'Add the peeled matoke with enough water to partly cover the ingredients.',
      'Cover and simmer until the beef is tender and the matoke is soft but holds its shape.'
    ]
  ),
  (
    'fish-ugali-spinach', 'Fish with Ugali and Spinach',
    'A simple fish and tomato stew served with ugali and sautéed spinach.',
    'luo', array['lunch', 'dinner'], 4, 15, 40, 'moderate',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['pescatarian', 'gluten_free', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_protein'],
    array[
      'Cook the maize flour in boiling water, stirring until the ugali is firm and smooth.',
      'Soften the onion and tomatoes in half of the oil, then add the fish and simmer gently.',
      'Cook the spinach in the remaining oil with a little salt until just tender.',
      'Serve the fish stew and spinach alongside the hot ugali.'
    ]
  ),
  (
    'chicken-vegetable-rice', 'Chicken and Vegetable Rice',
    'One-pot rice with chicken, peas, carrots, tomatoes, and onions for an easy shared dinner.',
    'kenyan', array['lunch', 'dinner'], 4, 20, 50, 'easy',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['gluten_free', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_protein'],
    array[
      'Brown the chicken in the oil, then set it aside briefly.',
      'Cook the onion, tomatoes, and carrots in the same pot until softened.',
      'Return the chicken, add the rice, peas, salt, and measured water, then cover.',
      'Cook on low heat until the rice is tender and the chicken is cooked through.'
    ]
  ),
  (
    'egg-potato-skillet', 'Egg and Potato Skillet',
    'Pan-cooked potatoes with eggs, tomatoes, and onions for a hearty breakfast or quick supper.',
    'kenyan', array['breakfast', 'dinner'], 4, 15, 35, 'easy',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'gluten_free', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_protein'],
    array[
      'Boil the potatoes until just tender, then cut them into bite-sized pieces.',
      'Cook the onion and tomatoes in oil until soft, then add the potatoes and salt.',
      'Beat the eggs, pour them over the potatoes, and cover the pan.',
      'Cook on low heat until the eggs are set, then slice and serve.'
    ]
  ),
  (
    'coconut-cowpea-rice', 'Coconut Cowpeas with Rice',
    'Creamy cowpeas simmered in coconut milk and tomatoes, served with plain rice.',
    'swahili_coast', array['lunch', 'dinner'], 4, 15, 50, 'easy',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'vegan', 'halal', 'gluten_free', 'dairy_free'],
    array['balanced_eating', 'high_fibre', 'high_protein'],
    array[
      'Boil the cowpeas until tender and drain them.',
      'Cook the rice separately until tender.',
      'Soften the onion and tomatoes in oil, then stir in the coconut milk.',
      'Add the cowpeas and salt, simmer until creamy, and serve with rice.'
    ]
  ),
  (
    'red-lentil-rice-stew', 'Red Lentil Stew with Rice',
    'Quick-cooking red lentils in a tomato and carrot sauce served over rice.',
    'indian_kenyan', array['lunch', 'dinner'], 4, 15, 35, 'easy',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'vegan', 'halal', 'gluten_free', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_fibre', 'high_protein'],
    array[
      'Rinse the red lentils and cook them in fresh water until soft.',
      'Cook the rice separately until tender.',
      'Soften the onion, tomatoes, and carrots in oil to make a sauce.',
      'Add the lentils and salt, simmer briefly, and serve over the rice.'
    ]
  ),
  (
    'pumpkin-stew-chapati', 'Pumpkin Stew with Chapati',
    'Soft pumpkin and tomato stew served with simple pan-cooked chapati.',
    'kamba', array['lunch', 'dinner'], 4, 30, 45, 'moderate',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'vegan', 'halal', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_fibre'],
    array[
      'Mix the flour with salt, some oil, and water to make a soft dough, then let it rest.',
      'Roll and cook the chapati one at a time on a hot pan.',
      'Cook the onion and tomatoes in the remaining oil, then add the pumpkin and a little water.',
      'Simmer until the pumpkin is tender and serve the thick stew with the chapati.'
    ]
  ),
  (
    'maize-porridge-milk', 'Maize Porridge with Milk',
    'A smooth breakfast porridge enriched with milk for a warm, inexpensive start to the day.',
    'kenyan', array['breakfast'], 4, 5, 15, 'easy',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'halal', 'gluten_free', 'nut_free'],
    array['balanced_eating'],
    array[
      'Mix the maize flour with a little cool water until no dry lumps remain.',
      'Bring the remaining water to a gentle boil and whisk in the flour mixture.',
      'Simmer while stirring until the porridge is smooth and fully cooked.',
      'Stir in the milk, warm through without boiling hard, and serve.'
    ]
  ),
  (
    'mandazi-milk-tea', 'Mandazi with Milk Tea',
    'Lightly sweetened fried dough served with Kenyan milk tea for an occasional shared breakfast.',
    'swahili_coast', array['breakfast', 'snack'], 6, 25, 25, 'moderate',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'halal', 'nut_free'],
    array['balanced_eating'],
    array[
      'Mix the flour with milk and enough water to make a soft, workable dough.',
      'Rest the dough, roll it out, and cut it into small triangles.',
      'Heat the oil and fry the pieces in batches until golden, then drain well.',
      'Simmer the tea leaves with water and milk, strain, and serve with the mandazi.'
    ]
  ),
  (
    'chapati-vegetable-omelette', 'Chapati Vegetable Omelette',
    'A soft chapati wrapped around eggs, tomatoes, onions, and greens for a filling morning meal.',
    'kenyan', array['breakfast', 'lunch'], 4, 20, 30, 'moderate',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'halal', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_protein'],
    array[
      'Mix the flour with water, salt, and a little oil, then rest the soft dough.',
      'Roll and cook four chapati on a hot pan until browned in spots.',
      'Soften the onion, tomato, and chopped spinach in a lightly oiled pan.',
      'Add the beaten eggs, cook until set, and fold the omelette into the chapati.'
    ]
  ),
  (
    'sweet-potato-boiled-eggs', 'Sweet Potato with Boiled Eggs',
    'Boiled sweet potatoes and eggs with fresh tomato and avocado for a practical breakfast plate.',
    'kenyan', array['breakfast'], 4, 10, 25, 'easy',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'halal', 'gluten_free', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_protein', 'high_fibre'],
    array[
      'Scrub and cut the sweet potatoes into even pieces.',
      'Boil the sweet potatoes in lightly salted water until tender.',
      'Boil the eggs until firm, cool them briefly, and remove the shells.',
      'Serve the sweet potatoes and eggs with sliced tomato and avocado.'
    ]
  ),
  (
    'githeri-avocado-bowl', 'Githeri Avocado Bowl',
    'Warm maize and beans finished with tomato and avocado for a quick use of cooked githeri.',
    'kenyan', array['breakfast', 'lunch'], 4, 10, 20, 'easy',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'vegan', 'halal', 'gluten_free', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_fibre', 'high_protein'],
    array[
      'Warm the cooked maize and beans with a small splash of water.',
      'Soften the onion and tomato in oil until they make a light sauce.',
      'Fold the githeri into the sauce, season, and heat through.',
      'Top each serving with avocado just before eating.'
    ]
  ),
  (
    'spinach-egg-rice', 'Spinach Egg Rice',
    'Leftover-friendly rice tossed with spinach, tomato, onion, and eggs for a fast one-pan meal.',
    'kenyan', array['breakfast', 'lunch'], 4, 10, 20, 'easy',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'halal', 'gluten_free', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_protein'],
    array[
      'Cook the rice ahead or use safely chilled cooked rice.',
      'Soften the onion and tomato in oil, then add the chopped spinach.',
      'Push the vegetables aside, scramble the eggs in the same pan, and season.',
      'Add the rice and toss over medium heat until piping hot throughout.'
    ]
  ),
  (
    'banana-egg-breakfast', 'Banana and Egg Breakfast Plate',
    'Pan-warmed bananas with softly cooked eggs and tomatoes for a simple, quick breakfast.',
    'kenyan', array['breakfast'], 4, 10, 15, 'easy',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'halal', 'gluten_free', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_protein'],
    array[
      'Peel and halve the bananas lengthwise.',
      'Warm the bananas in a lightly oiled pan until golden at the edges.',
      'Cook the onion and tomato briefly, then add the beaten eggs and salt.',
      'Serve the softly set eggs beside the warm bananas.'
    ]
  ),
  (
    'tomato-beans-rice', 'Tomato Beans with Rice',
    'Everyday beans simmered in a thick tomato sauce and served with fluffy rice.',
    'kenyan', array['lunch', 'dinner'], 4, 15, 40, 'easy',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'vegan', 'halal', 'gluten_free', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_fibre', 'high_protein'],
    array[
      'Cook the rice in measured water until tender and keep it covered.',
      'Soften the onion and carrot in oil, then add the tomatoes.',
      'Stir in the cooked beans with a little water and season with salt.',
      'Simmer until the sauce thickens and serve with the rice.'
    ]
  ),
  (
    'beef-ugali-kale', 'Beef Stew with Ugali and Kale',
    'Tender beef and tomato stew served with firm ugali and quickly cooked kale.',
    'kenyan', array['lunch', 'dinner'], 4, 20, 60, 'moderate',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['gluten_free', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_protein'],
    array[
      'Brown the beef, add onion and tomato, then simmer with water until tender.',
      'Cook the maize flour into boiling water until the ugali is firm and smooth.',
      'Cook the sliced kale in a little oil with salt until just tender.',
      'Serve the beef stew with the hot ugali and kale.'
    ]
  ),
  (
    'chicken-ugali-cabbage', 'Chicken with Ugali and Cabbage',
    'Tomato-braised chicken paired with ugali and lightly cooked cabbage for a family dinner.',
    'kenyan', array['lunch', 'dinner'], 4, 20, 50, 'easy',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['gluten_free', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_protein'],
    array[
      'Brown the chicken, then cook it with onion and tomato until fully done.',
      'Stir maize flour into boiling water until the ugali is smooth and firm.',
      'Cook the sliced cabbage and carrot briefly in a little oil.',
      'Season each component and serve together while hot.'
    ]
  ),
  (
    'kenyan-vegetable-pilau', 'Kenyan Vegetable Pilau',
    'Fragrant rice with peas, carrots, tomatoes, ginger, and garlic for a meat-free pilau-style meal.',
    'swahili_coast', array['lunch', 'dinner'], 4, 20, 35, 'moderate',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'vegan', 'halal', 'gluten_free', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_fibre'],
    array[
      'Rinse the rice until the water runs nearly clear and drain it.',
      'Cook the onion until deeply golden, then add tomato, ginger, and garlic.',
      'Add the carrots, peas, rice, salt, and measured water, then cover.',
      'Cook on low heat until tender, rest covered, and fluff before serving.'
    ]
  ),
  (
    'green-gram-chapati', 'Green Gram Stew with Chapati',
    'Tomato-rich green grams served with soft homemade chapati for an affordable shared meal.',
    'kenyan', array['lunch', 'dinner'], 4, 30, 55, 'moderate',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'vegan', 'halal', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_fibre', 'high_protein'],
    array[
      'Boil the green grams until tender and reserve a little cooking liquid.',
      'Mix and rest the chapati dough, then roll and cook each portion.',
      'Cook the onion, tomato, and carrot in oil until soft.',
      'Add the green grams, season, simmer until thick, and serve with chapati.'
    ]
  ),
  (
    'pea-potato-stew', 'Pea and Potato Stew',
    'A gentle tomato stew of potatoes, peas, and carrots that works with rice or on its own.',
    'kenyan', array['lunch', 'dinner'], 4, 15, 35, 'easy',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'vegan', 'halal', 'gluten_free', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_fibre'],
    array[
      'Soften the onion in oil, then add the tomato and cook until pulpy.',
      'Add the potatoes and carrots with enough water to mostly cover them.',
      'Simmer until nearly tender, then add the peas and salt.',
      'Cook uncovered until the vegetables are tender and the sauce has thickened.'
    ]
  ),
  (
    'black-bean-rice', 'Black Bean Rice Bowl',
    'Black beans, rice, tomatoes, and avocado combined into a colourful, satisfying bowl.',
    'kenyan', array['lunch', 'dinner'], 4, 15, 35, 'easy',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'vegan', 'halal', 'gluten_free', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_fibre', 'high_protein'],
    array[
      'Cook the rice until tender and keep it warm.',
      'Cook the onion and tomatoes in oil until they form a thick sauce.',
      'Add the cooked black beans, season, and simmer until hot.',
      'Spoon the beans over rice and finish with sliced avocado.'
    ]
  ),
  (
    'cowpea-stew-ugali', 'Cowpea Stew with Ugali',
    'Creamy cowpeas in a simple tomato sauce served with dependable maize ugali.',
    'luhya', array['lunch', 'dinner'], 4, 15, 50, 'easy',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'vegan', 'halal', 'gluten_free', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_fibre', 'high_protein'],
    array[
      'Boil the cowpeas until tender and drain most of the cooking water.',
      'Cook the onion and tomatoes in oil until soft, then add the cowpeas.',
      'Simmer the stew with salt while cooking the maize flour into firm ugali.',
      'Serve the thick cowpea stew with the hot ugali.'
    ]
  ),
  (
    'pumpkin-rice-bowl', 'Pumpkin Stew with Rice',
    'Soft pumpkin, tomatoes, and green peas served over rice for a colourful plant-based meal.',
    'kamba', array['lunch', 'dinner'], 4, 15, 35, 'easy',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'vegan', 'halal', 'gluten_free', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_fibre'],
    array[
      'Cook the rice in measured water until tender.',
      'Soften the onion and tomatoes in oil to make a sauce.',
      'Add the pumpkin and a little water, then simmer until almost tender.',
      'Add the peas and salt, cook until soft, and serve over rice.'
    ]
  ),
  (
    'fish-rice-greens', 'Fish Stew with Rice and Greens',
    'Gently simmered fish in tomato sauce with rice and leafy greens on the side.',
    'luo', array['lunch', 'dinner'], 4, 15, 40, 'moderate',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['pescatarian', 'gluten_free', 'dairy_free', 'nut_free'],
    array['balanced_eating', 'high_protein'],
    array[
      'Cook the rice until tender and keep it covered.',
      'Soften the onion and tomato in oil, add the fish, and simmer gently until done.',
      'Cook the spinach separately with a little salt until just tender.',
      'Serve the fish and sauce with the rice and spinach.'
    ]
  ),
  (
    'coconut-beans-chapati', 'Coconut Beans with Chapati',
    'Beans simmered in coconut milk and tomatoes, served with soft chapati for a coastal-style meal.',
    'swahili_coast', array['lunch', 'dinner'], 4, 30, 50, 'moderate',
    array['gas_cooker', 'electric_cooker', 'jiko'], array[]::text[],
    array['vegetarian', 'vegan', 'halal', 'dairy_free'],
    array['balanced_eating', 'high_fibre', 'high_protein'],
    array[
      'Mix the chapati dough with flour, water, salt, and oil, then let it rest.',
      'Roll and cook the chapati on a hot pan until browned and soft.',
      'Cook the onion and tomatoes, then add the cooked beans and coconut milk.',
      'Simmer until creamy, season with salt, and serve with chapati.'
    ]
  );

insert into public.recipe_steps (recipe_id, step_number, instruction)
select recipes.id, steps.ordinality::smallint, steps.instruction
from public.recipes
cross join lateral unnest(recipes.instructions) with ordinality
  as steps(instruction, ordinality);

with image_asset_seed (
  asset_name, local_path, attribution_name, attribution_url, license_name, license_url
) as (
  values
    ('ugali', '/images/recipes/ugali-sukuma-wiki.webp', 'Paresh Jai',
      'https://commons.wikimedia.org/wiki/File:Ugali_%26_Sukuma_Wiki.jpg',
      'CC BY 2.0', 'https://creativecommons.org/licenses/by/2.0/'),
    ('githeri', '/images/recipes/githeri.webp', 'safaritravelplus',
      'https://commons.wikimedia.org/wiki/File:Githeri_Meal.jpg',
      'CC0 1.0', 'https://creativecommons.org/publicdomain/zero/1.0/'),
    ('chapati', '/images/recipes/chapati.webp', 'safaritravelplus',
      'https://commons.wikimedia.org/wiki/File:Chapati_kenya.jpg',
      'CC0 1.0', 'https://creativecommons.org/publicdomain/zero/1.0/'),
    ('pilau', '/images/recipes/pilau.webp', 'Cmwaura',
      'https://commons.wikimedia.org/wiki/File:Food_Kenya_Pilau.jpg',
      'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/'),
    ('matoke', '/images/recipes/matoke-stew.webp', 'Jesse Mwangi',
      'https://wordpress.org/photos/photo/5166a23e44/',
      'CC0 1.0', 'https://creativecommons.org/publicdomain/zero/1.0/'),
    ('mandazi', '/images/recipes/mandazi.webp', 'ChildofMidnight',
      'https://commons.wikimedia.org/wiki/File:Bowl_of_mandazi.jpg',
      'CC BY 2.0', 'https://creativecommons.org/licenses/by/2.0/'),
    ('uji', '/images/recipes/uji.webp', 'Re-sendings',
      'https://commons.wikimedia.org/wiki/File:Traditional_porridge_in_a_calabash.jpg',
      'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/'),
    ('mukimo', '/images/recipes/mukimo.webp', 'Vmaina104',
      'https://commons.wikimedia.org/wiki/File:Mukimo_mix.jpg',
      'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/'),
    ('fish', '/images/recipes/fish-ugali.webp', 'Masssly',
      'https://commons.wikimedia.org/wiki/File:Ugali_and_Fish_source_dish.jpg',
      'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/'),
    ('coconut-beans', '/images/recipes/coconut-beans-rice.webp', 'Mmaua1',
      'https://commons.wikimedia.org/wiki/File:Coconut_beans_and_Rice_with_fresh_sliced_tomatoes.jpg',
      'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/'),
    ('egg-potato', '/images/recipes/egg-potato-skillet.webp', 'jeffreyw',
      'https://www.flickr.com/photos/7927684@N03/6334115819',
      'CC BY 2.0', 'https://creativecommons.org/licenses/by/2.0/')
),
recipe_image_seed (recipe_slug, asset_name, alt_text) as (
  values
    ('ugali-sukuma-wiki', 'ugali', 'Ugali served beside cooked sukuma wiki.'),
    ('classic-githeri', 'githeri', 'A bowl of cooked maize and beans githeri.'),
    ('ndengu-with-rice', 'coconut-beans', 'A bowl of legumes served with rice and tomatoes.'),
    ('chapati-bean-stew', 'chapati', 'Fresh Kenyan chapati stacked for serving.'),
    ('vegetable-mukimo', 'mukimo', 'Mashed vegetable mukimo ready to serve.'),
    ('matoke-beef-stew', 'matoke', 'Green banana matoke stew served with beef.'),
    ('fish-ugali-spinach', 'fish', 'Cooked fish served with ugali and vegetables.'),
    ('chicken-vegetable-rice', 'pilau', 'Seasoned Kenyan rice ready for a shared meal.'),
    ('egg-potato-skillet', 'egg-potato', 'Eggs and potatoes cooked together in a skillet.'),
    ('coconut-cowpea-rice', 'coconut-beans', 'Coconut beans and rice served with tomatoes.'),
    ('red-lentil-rice-stew', 'coconut-beans', 'A legume stew served with cooked rice.'),
    ('pumpkin-stew-chapati', 'chapati', 'Fresh Kenyan chapati ready to serve with stew.'),
    ('maize-porridge-milk', 'uji', 'Traditional porridge served in a calabash.'),
    ('mandazi-milk-tea', 'mandazi', 'A bowl filled with freshly cooked mandazi.'),
    ('chapati-vegetable-omelette', 'chapati', 'Fresh Kenyan chapati ready for a breakfast wrap.'),
    ('sweet-potato-boiled-eggs', 'egg-potato', 'Cooked eggs and potatoes arranged for breakfast.'),
    ('githeri-avocado-bowl', 'githeri', 'Cooked githeri ready to be topped with avocado.'),
    ('spinach-egg-rice', 'egg-potato', 'A warm egg and vegetable skillet meal.'),
    ('banana-egg-breakfast', 'egg-potato', 'A cooked egg breakfast served from a skillet.'),
    ('tomato-beans-rice', 'coconut-beans', 'Beans and rice served with fresh tomatoes.'),
    ('beef-ugali-kale', 'ugali', 'Ugali and leafy greens plated for a Kenyan meal.'),
    ('chicken-ugali-cabbage', 'ugali', 'Ugali and cooked vegetables plated together.'),
    ('kenyan-vegetable-pilau', 'pilau', 'A serving dish filled with Kenyan pilau rice.'),
    ('green-gram-chapati', 'chapati', 'Fresh Kenyan chapati ready to serve with green grams.'),
    ('pea-potato-stew', 'matoke', 'A thick vegetable stew ready for serving.'),
    ('black-bean-rice', 'coconut-beans', 'Beans and rice combined in a colourful bowl.'),
    ('cowpea-stew-ugali', 'ugali', 'Ugali and greens plated for a filling meal.'),
    ('pumpkin-rice-bowl', 'pilau', 'Cooked rice presented for a vegetable bowl.'),
    ('fish-rice-greens', 'fish', 'Cooked fish served with a staple and vegetables.'),
    ('coconut-beans-chapati', 'chapati', 'Fresh Kenyan chapati ready to serve with coconut beans.')
)
insert into public.recipe_images (
  recipe_id, local_path, alt_text, width, height,
  attribution_name, attribution_url, license_name, license_url
)
select recipes.id, assets.local_path, seed.alt_text, 960, 720,
  assets.attribution_name, assets.attribution_url, assets.license_name, assets.license_url
from recipe_image_seed seed
join public.recipes on recipes.slug = seed.recipe_slug
join image_asset_seed assets on assets.asset_name = seed.asset_name;

with recipe_ingredient_seed (
  recipe_slug, ingredient_slug, quantity, unit, is_optional, preparation, sort_order
) as (
  values
    ('ugali-sukuma-wiki', 'maize-flour', 400, 'g', false, null, 1),
    ('ugali-sukuma-wiki', 'kale', 2, 'bunch', false, 'thinly sliced', 2),
    ('ugali-sukuma-wiki', 'tomato', 3, 'piece', false, 'diced', 3),
    ('ugali-sukuma-wiki', 'onion', 1, 'piece', false, 'diced', 4),
    ('ugali-sukuma-wiki', 'cooking-oil', 30, 'ml', false, null, 5),
    ('ugali-sukuma-wiki', 'salt', 8, 'g', false, null, 6),
    ('classic-githeri', 'maize', 300, 'g', false, 'soaked when possible', 1),
    ('classic-githeri', 'dried-beans', 300, 'g', false, 'soaked when possible', 2),
    ('classic-githeri', 'tomato', 3, 'piece', false, 'diced', 3),
    ('classic-githeri', 'onion', 1, 'piece', false, 'diced', 4),
    ('classic-githeri', 'carrot', 200, 'g', false, 'diced', 5),
    ('classic-githeri', 'cooking-oil', 30, 'ml', false, null, 6),
    ('classic-githeri', 'salt', 8, 'g', false, null, 7),
    ('ndengu-with-rice', 'green-grams', 300, 'g', false, null, 1),
    ('ndengu-with-rice', 'rice', 300, 'g', false, null, 2),
    ('ndengu-with-rice', 'tomato', 3, 'piece', false, 'diced', 3),
    ('ndengu-with-rice', 'onion', 1, 'piece', false, 'diced', 4),
    ('ndengu-with-rice', 'carrot', 150, 'g', false, 'diced', 5),
    ('ndengu-with-rice', 'cooking-oil', 30, 'ml', false, null, 6),
    ('ndengu-with-rice', 'salt', 8, 'g', false, null, 7),
    ('chapati-bean-stew', 'wheat-flour', 500, 'g', false, null, 1),
    ('chapati-bean-stew', 'dried-beans', 300, 'g', false, 'cooked', 2),
    ('chapati-bean-stew', 'tomato', 3, 'piece', false, 'diced', 3),
    ('chapati-bean-stew', 'onion', 1, 'piece', false, 'diced', 4),
    ('chapati-bean-stew', 'carrot', 150, 'g', false, 'diced', 5),
    ('chapati-bean-stew', 'cooking-oil', 50, 'ml', false, null, 6),
    ('chapati-bean-stew', 'salt', 8, 'g', false, null, 7),
    ('vegetable-mukimo', 'potato', 800, 'g', false, 'peeled and chopped', 1),
    ('vegetable-mukimo', 'maize', 250, 'g', false, 'cooked', 2),
    ('vegetable-mukimo', 'peas', 200, 'g', false, null, 3),
    ('vegetable-mukimo', 'kale', 1, 'bunch', false, 'chopped', 4),
    ('vegetable-mukimo', 'onion', 1, 'piece', false, 'diced', 5),
    ('vegetable-mukimo', 'cooking-oil', 20, 'ml', false, null, 6),
    ('vegetable-mukimo', 'salt', 8, 'g', false, null, 7),
    ('matoke-beef-stew', 'banana', 8, 'piece', false, 'green, peeled', 1),
    ('matoke-beef-stew', 'beef', 500, 'g', false, 'cubed', 2),
    ('matoke-beef-stew', 'tomato', 4, 'piece', false, 'diced', 3),
    ('matoke-beef-stew', 'onion', 2, 'piece', false, 'diced', 4),
    ('matoke-beef-stew', 'carrot', 200, 'g', false, 'sliced', 5),
    ('matoke-beef-stew', 'cooking-oil', 30, 'ml', false, null, 6),
    ('matoke-beef-stew', 'salt', 8, 'g', false, null, 7),
    ('fish-ugali-spinach', 'fish', 600, 'g', false, 'portioned', 1),
    ('fish-ugali-spinach', 'maize-flour', 400, 'g', false, null, 2),
    ('fish-ugali-spinach', 'spinach', 2, 'bunch', false, 'chopped', 3),
    ('fish-ugali-spinach', 'tomato', 3, 'piece', false, 'diced', 4),
    ('fish-ugali-spinach', 'onion', 1, 'piece', false, 'diced', 5),
    ('fish-ugali-spinach', 'cooking-oil', 30, 'ml', false, null, 6),
    ('fish-ugali-spinach', 'salt', 8, 'g', false, null, 7),
    ('chicken-vegetable-rice', 'chicken', 600, 'g', false, 'portioned', 1),
    ('chicken-vegetable-rice', 'rice', 400, 'g', false, null, 2),
    ('chicken-vegetable-rice', 'peas', 150, 'g', false, null, 3),
    ('chicken-vegetable-rice', 'carrot', 200, 'g', false, 'diced', 4),
    ('chicken-vegetable-rice', 'tomato', 3, 'piece', false, 'diced', 5),
    ('chicken-vegetable-rice', 'onion', 2, 'piece', false, 'diced', 6),
    ('chicken-vegetable-rice', 'cooking-oil', 30, 'ml', false, null, 7),
    ('chicken-vegetable-rice', 'salt', 8, 'g', false, null, 8),
    ('egg-potato-skillet', 'eggs', 8, 'piece', false, 'beaten', 1),
    ('egg-potato-skillet', 'potato', 800, 'g', false, 'peeled and chopped', 2),
    ('egg-potato-skillet', 'tomato', 3, 'piece', false, 'diced', 3),
    ('egg-potato-skillet', 'onion', 1, 'piece', false, 'diced', 4),
    ('egg-potato-skillet', 'cooking-oil', 30, 'ml', false, null, 5),
    ('egg-potato-skillet', 'salt', 8, 'g', false, null, 6),
    ('coconut-cowpea-rice', 'cowpeas', 300, 'g', false, null, 1),
    ('coconut-cowpea-rice', 'rice', 300, 'g', false, null, 2),
    ('coconut-cowpea-rice', 'coconut-milk', 400, 'ml', false, null, 3),
    ('coconut-cowpea-rice', 'tomato', 3, 'piece', false, 'diced', 4),
    ('coconut-cowpea-rice', 'onion', 1, 'piece', false, 'diced', 5),
    ('coconut-cowpea-rice', 'cooking-oil', 20, 'ml', false, null, 6),
    ('coconut-cowpea-rice', 'salt', 8, 'g', false, null, 7),
    ('red-lentil-rice-stew', 'red-lentils', 300, 'g', false, null, 1),
    ('red-lentil-rice-stew', 'rice', 300, 'g', false, null, 2),
    ('red-lentil-rice-stew', 'tomato', 3, 'piece', false, 'diced', 3),
    ('red-lentil-rice-stew', 'onion', 1, 'piece', false, 'diced', 4),
    ('red-lentil-rice-stew', 'carrot', 150, 'g', false, 'diced', 5),
    ('red-lentil-rice-stew', 'cooking-oil', 20, 'ml', false, null, 6),
    ('red-lentil-rice-stew', 'salt', 8, 'g', false, null, 7),
    ('pumpkin-stew-chapati', 'pumpkin', 800, 'g', false, 'peeled and cubed', 1),
    ('pumpkin-stew-chapati', 'wheat-flour', 500, 'g', false, null, 2),
    ('pumpkin-stew-chapati', 'tomato', 3, 'piece', false, 'diced', 3),
    ('pumpkin-stew-chapati', 'onion', 1, 'piece', false, 'diced', 4),
    ('pumpkin-stew-chapati', 'cooking-oil', 50, 'ml', false, null, 5),
    ('pumpkin-stew-chapati', 'salt', 8, 'g', false, null, 6),
    ('maize-porridge-milk', 'maize-flour', 180, 'g', false, null, 1),
    ('maize-porridge-milk', 'milk', 500, 'ml', false, null, 2),
    ('maize-porridge-milk', 'salt', 2, 'g', false, null, 3),
    ('mandazi-milk-tea', 'wheat-flour', 500, 'g', false, null, 1),
    ('mandazi-milk-tea', 'milk', 500, 'ml', false, null, 2),
    ('mandazi-milk-tea', 'sugar', 100, 'g', false, null, 3),
    ('mandazi-milk-tea', 'cooking-oil', 300, 'ml', false, 'for frying', 4),
    ('mandazi-milk-tea', 'tea-leaves', 20, 'g', false, null, 5),
    ('mandazi-milk-tea', 'salt', 4, 'g', false, null, 6),
    ('chapati-vegetable-omelette', 'wheat-flour', 400, 'g', false, null, 1),
    ('chapati-vegetable-omelette', 'eggs', 6, 'piece', false, 'beaten', 2),
    ('chapati-vegetable-omelette', 'spinach', 1, 'bunch', false, 'chopped', 3),
    ('chapati-vegetable-omelette', 'tomato', 2, 'piece', false, 'diced', 4),
    ('chapati-vegetable-omelette', 'onion', 1, 'piece', false, 'diced', 5),
    ('chapati-vegetable-omelette', 'cooking-oil', 40, 'ml', false, null, 6),
    ('chapati-vegetable-omelette', 'salt', 6, 'g', false, null, 7),
    ('sweet-potato-boiled-eggs', 'sweet-potato', 800, 'g', false, 'scrubbed', 1),
    ('sweet-potato-boiled-eggs', 'eggs', 4, 'piece', false, null, 2),
    ('sweet-potato-boiled-eggs', 'tomato', 2, 'piece', false, 'sliced', 3),
    ('sweet-potato-boiled-eggs', 'avocado', 1, 'piece', false, 'sliced', 4),
    ('sweet-potato-boiled-eggs', 'salt', 4, 'g', false, null, 5),
    ('githeri-avocado-bowl', 'maize', 300, 'g', false, 'cooked', 1),
    ('githeri-avocado-bowl', 'dried-beans', 300, 'g', false, 'cooked', 2),
    ('githeri-avocado-bowl', 'tomato', 2, 'piece', false, 'diced', 3),
    ('githeri-avocado-bowl', 'onion', 1, 'piece', false, 'diced', 4),
    ('githeri-avocado-bowl', 'avocado', 1, 'piece', false, 'sliced', 5),
    ('githeri-avocado-bowl', 'cooking-oil', 20, 'ml', false, null, 6),
    ('githeri-avocado-bowl', 'salt', 6, 'g', false, null, 7),
    ('spinach-egg-rice', 'rice', 400, 'g', false, 'cooked and chilled safely', 1),
    ('spinach-egg-rice', 'eggs', 6, 'piece', false, 'beaten', 2),
    ('spinach-egg-rice', 'spinach', 1, 'bunch', false, 'chopped', 3),
    ('spinach-egg-rice', 'tomato', 2, 'piece', false, 'diced', 4),
    ('spinach-egg-rice', 'onion', 1, 'piece', false, 'diced', 5),
    ('spinach-egg-rice', 'cooking-oil', 25, 'ml', false, null, 6),
    ('spinach-egg-rice', 'salt', 6, 'g', false, null, 7),
    ('banana-egg-breakfast', 'banana', 8, 'piece', false, 'ripe and firm', 1),
    ('banana-egg-breakfast', 'eggs', 6, 'piece', false, 'beaten', 2),
    ('banana-egg-breakfast', 'tomato', 2, 'piece', false, 'diced', 3),
    ('banana-egg-breakfast', 'onion', 1, 'piece', false, 'diced', 4),
    ('banana-egg-breakfast', 'cooking-oil', 20, 'ml', false, null, 5),
    ('banana-egg-breakfast', 'salt', 5, 'g', false, null, 6),
    ('tomato-beans-rice', 'dried-beans', 350, 'g', false, 'cooked', 1),
    ('tomato-beans-rice', 'rice', 350, 'g', false, null, 2),
    ('tomato-beans-rice', 'tomato', 3, 'piece', false, 'diced', 3),
    ('tomato-beans-rice', 'onion', 1, 'piece', false, 'diced', 4),
    ('tomato-beans-rice', 'carrot', 150, 'g', false, 'diced', 5),
    ('tomato-beans-rice', 'cooking-oil', 25, 'ml', false, null, 6),
    ('tomato-beans-rice', 'salt', 7, 'g', false, null, 7),
    ('beef-ugali-kale', 'beef', 500, 'g', false, 'cubed', 1),
    ('beef-ugali-kale', 'maize-flour', 400, 'g', false, null, 2),
    ('beef-ugali-kale', 'kale', 2, 'bunch', false, 'sliced', 3),
    ('beef-ugali-kale', 'tomato', 3, 'piece', false, 'diced', 4),
    ('beef-ugali-kale', 'onion', 1, 'piece', false, 'diced', 5),
    ('beef-ugali-kale', 'cooking-oil', 30, 'ml', false, null, 6),
    ('beef-ugali-kale', 'salt', 8, 'g', false, null, 7),
    ('chicken-ugali-cabbage', 'chicken', 600, 'g', false, 'portioned', 1),
    ('chicken-ugali-cabbage', 'maize-flour', 400, 'g', false, null, 2),
    ('chicken-ugali-cabbage', 'cabbage', 600, 'g', false, 'sliced', 3),
    ('chicken-ugali-cabbage', 'carrot', 150, 'g', false, 'sliced', 4),
    ('chicken-ugali-cabbage', 'tomato', 3, 'piece', false, 'diced', 5),
    ('chicken-ugali-cabbage', 'onion', 1, 'piece', false, 'diced', 6),
    ('chicken-ugali-cabbage', 'cooking-oil', 30, 'ml', false, null, 7),
    ('chicken-ugali-cabbage', 'salt', 8, 'g', false, null, 8),
    ('kenyan-vegetable-pilau', 'rice', 400, 'g', false, null, 1),
    ('kenyan-vegetable-pilau', 'peas', 200, 'g', false, null, 2),
    ('kenyan-vegetable-pilau', 'carrot', 200, 'g', false, 'diced', 3),
    ('kenyan-vegetable-pilau', 'tomato', 2, 'piece', false, 'diced', 4),
    ('kenyan-vegetable-pilau', 'onion', 2, 'piece', false, 'thinly sliced', 5),
    ('kenyan-vegetable-pilau', 'garlic', 15, 'g', false, 'crushed', 6),
    ('kenyan-vegetable-pilau', 'ginger', 15, 'g', false, 'grated', 7),
    ('kenyan-vegetable-pilau', 'cooking-oil', 30, 'ml', false, null, 8),
    ('kenyan-vegetable-pilau', 'salt', 7, 'g', false, null, 9),
    ('green-gram-chapati', 'green-grams', 350, 'g', false, null, 1),
    ('green-gram-chapati', 'wheat-flour', 500, 'g', false, null, 2),
    ('green-gram-chapati', 'tomato', 3, 'piece', false, 'diced', 3),
    ('green-gram-chapati', 'onion', 1, 'piece', false, 'diced', 4),
    ('green-gram-chapati', 'carrot', 150, 'g', false, 'diced', 5),
    ('green-gram-chapati', 'cooking-oil', 50, 'ml', false, null, 6),
    ('green-gram-chapati', 'salt', 8, 'g', false, null, 7),
    ('pea-potato-stew', 'potato', 800, 'g', false, 'peeled and cubed', 1),
    ('pea-potato-stew', 'peas', 250, 'g', false, null, 2),
    ('pea-potato-stew', 'carrot', 200, 'g', false, 'sliced', 3),
    ('pea-potato-stew', 'tomato', 3, 'piece', false, 'diced', 4),
    ('pea-potato-stew', 'onion', 1, 'piece', false, 'diced', 5),
    ('pea-potato-stew', 'cooking-oil', 25, 'ml', false, null, 6),
    ('pea-potato-stew', 'salt', 7, 'g', false, null, 7),
    ('black-bean-rice', 'black-beans', 350, 'g', false, 'cooked', 1),
    ('black-bean-rice', 'rice', 350, 'g', false, null, 2),
    ('black-bean-rice', 'tomato', 3, 'piece', false, 'diced', 3),
    ('black-bean-rice', 'onion', 1, 'piece', false, 'diced', 4),
    ('black-bean-rice', 'avocado', 1, 'piece', false, 'sliced', 5),
    ('black-bean-rice', 'cooking-oil', 25, 'ml', false, null, 6),
    ('black-bean-rice', 'salt', 7, 'g', false, null, 7),
    ('cowpea-stew-ugali', 'cowpeas', 350, 'g', false, null, 1),
    ('cowpea-stew-ugali', 'maize-flour', 400, 'g', false, null, 2),
    ('cowpea-stew-ugali', 'tomato', 3, 'piece', false, 'diced', 3),
    ('cowpea-stew-ugali', 'onion', 1, 'piece', false, 'diced', 4),
    ('cowpea-stew-ugali', 'cooking-oil', 25, 'ml', false, null, 5),
    ('cowpea-stew-ugali', 'salt', 7, 'g', false, null, 6),
    ('pumpkin-rice-bowl', 'pumpkin', 800, 'g', false, 'peeled and cubed', 1),
    ('pumpkin-rice-bowl', 'rice', 350, 'g', false, null, 2),
    ('pumpkin-rice-bowl', 'peas', 150, 'g', false, null, 3),
    ('pumpkin-rice-bowl', 'tomato', 2, 'piece', false, 'diced', 4),
    ('pumpkin-rice-bowl', 'onion', 1, 'piece', false, 'diced', 5),
    ('pumpkin-rice-bowl', 'cooking-oil', 20, 'ml', false, null, 6),
    ('pumpkin-rice-bowl', 'salt', 7, 'g', false, null, 7),
    ('fish-rice-greens', 'fish', 600, 'g', false, 'portioned', 1),
    ('fish-rice-greens', 'rice', 350, 'g', false, null, 2),
    ('fish-rice-greens', 'spinach', 2, 'bunch', false, 'chopped', 3),
    ('fish-rice-greens', 'tomato', 3, 'piece', false, 'diced', 4),
    ('fish-rice-greens', 'onion', 1, 'piece', false, 'diced', 5),
    ('fish-rice-greens', 'cooking-oil', 30, 'ml', false, null, 6),
    ('fish-rice-greens', 'salt', 8, 'g', false, null, 7),
    ('coconut-beans-chapati', 'dried-beans', 350, 'g', false, 'cooked', 1),
    ('coconut-beans-chapati', 'coconut-milk', 400, 'ml', false, null, 2),
    ('coconut-beans-chapati', 'wheat-flour', 500, 'g', false, null, 3),
    ('coconut-beans-chapati', 'tomato', 3, 'piece', false, 'diced', 4),
    ('coconut-beans-chapati', 'onion', 1, 'piece', false, 'diced', 5),
    ('coconut-beans-chapati', 'cooking-oil', 50, 'ml', false, null, 6),
    ('coconut-beans-chapati', 'salt', 8, 'g', false, null, 7)
)
insert into public.recipe_ingredients (
  recipe_id, ingredient_id, quantity, unit, is_optional, preparation, sort_order
)
select recipes.id, ingredients.id, seed.quantity, seed.unit, seed.is_optional,
  seed.preparation, seed.sort_order
from recipe_ingredient_seed seed
join public.recipes on recipes.slug = seed.recipe_slug
join public.ingredients on ingredients.slug = seed.ingredient_slug;

with ingredient_cost_seed (
  ingredient_slug, quantity, unit, price_minor
) as (
  values
    ('avocado', 1, 'piece', 3000),
    ('banana', 1, 'piece', 2000),
    ('beef', 1000, 'g', 70000),
    ('bell-pepper', 1, 'piece', 3000),
    ('black-beans', 1000, 'g', 32000),
    ('cabbage', 1000, 'g', 10000),
    ('carrot', 1000, 'g', 18000),
    ('chicken', 1000, 'g', 65000),
    ('coconut-milk', 400, 'ml', 18000),
    ('cooking-oil', 1000, 'ml', 30000),
    ('coriander', 1, 'bunch', 2000),
    ('cowpeas', 1000, 'g', 30000),
    ('dried-beans', 1000, 'g', 28000),
    ('eggs', 1, 'piece', 2000),
    ('fish', 1000, 'g', 50000),
    ('garlic', 1000, 'g', 40000),
    ('ginger', 1000, 'g', 35000),
    ('green-grams', 1000, 'g', 30000),
    ('kale', 1, 'bunch', 3000),
    ('maize', 1000, 'g', 8000),
    ('maize-flour', 2000, 'g', 18000),
    ('milk', 500, 'ml', 6000),
    ('onion', 1, 'piece', 1000),
    ('peas', 1000, 'g', 25000),
    ('potato', 1000, 'g', 10000),
    ('pumpkin', 1000, 'g', 8000),
    ('red-lentils', 1000, 'g', 35000),
    ('rice', 2000, 'g', 35000),
    ('salt', 1000, 'g', 8000),
    ('spinach', 1, 'bunch', 3000),
    ('sugar', 1000, 'g', 18000),
    ('sweet-potato', 1000, 'g', 10000),
    ('tea-leaves', 250, 'g', 15000),
    ('tomato', 1, 'piece', 1000),
    ('wheat-flour', 2000, 'g', 19000),
    ('yoghurt', 500, 'ml', 12000)
)
insert into public.ingredient_costs (
  ingredient_id, quantity, unit, price_minor, location, source_label, source_url,
  captured_on
)
select ingredients.id, seed.quantity, seed.unit, seed.price_minor,
  'Nairobi', 'Carrefour Kenya indicative retail snapshot',
  'https://www.carrefour.ke/mafken/en/', date '2026-08-06'
from ingredient_cost_seed seed
join public.ingredients on ingredients.slug = seed.ingredient_slug;

with substitution_seed (
  source_slug, source_quantity, source_unit,
  alternative_slug, alternative_quantity, alternative_unit, note
) as (
  values
    ('beef', 500, 'g', 'dried-beans', 300, 'g',
      'Use cooked beans for a lower-cost stew with a similar filling role.'),
    ('chicken', 600, 'g', 'eggs', 8, 'piece',
      'Use eggs when a lower-cost protein is more important than matching the original texture.'),
    ('fish', 600, 'g', 'black-beans', 300, 'g',
      'Use cooked black beans for a lower-cost protein option in a tomato stew.'),
    ('spinach', 1, 'bunch', 'kale', 1, 'bunch',
      'Use the less expensive available leafy green and cook it only until tender.'),
    ('red-lentils', 300, 'g', 'green-grams', 300, 'g',
      'Use green grams when they cost less, allowing extra simmering time if needed.'),
    ('rice', 300, 'g', 'maize-flour', 400, 'g',
      'Serve the stew with ugali when maize flour gives a lower total meal cost.')
)
insert into public.ingredient_substitutions (
  source_ingredient_id, source_quantity, source_unit,
  alternative_ingredient_id, alternative_quantity, alternative_unit, note
)
select source_ingredient.id, seed.source_quantity, seed.source_unit,
  alternative_ingredient.id, seed.alternative_quantity, seed.alternative_unit, seed.note
from substitution_seed seed
join public.ingredients source_ingredient on source_ingredient.slug = seed.source_slug
join public.ingredients alternative_ingredient on alternative_ingredient.slug = seed.alternative_slug;
