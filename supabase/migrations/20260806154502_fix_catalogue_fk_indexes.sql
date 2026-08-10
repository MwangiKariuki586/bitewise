drop index public.recipe_ingredients_ingredient_id_idx;
create index recipe_ingredients_ingredient_id_idx
on public.recipe_ingredients (ingredient_id, unit, recipe_id);

create index ingredient_costs_ingredient_unit_idx
on public.ingredient_costs (ingredient_id, unit, id);

create index ingredient_substitutions_source_unit_idx
on public.ingredient_substitutions (
  source_ingredient_id,
  source_unit,
  alternative_ingredient_id
);

drop index public.ingredient_substitutions_alternative_id_idx;
create index ingredient_substitutions_alternative_id_idx
on public.ingredient_substitutions (
  alternative_ingredient_id,
  alternative_unit,
  source_ingredient_id
);
