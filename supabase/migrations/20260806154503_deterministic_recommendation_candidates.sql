create function public.get_recommendation_candidates(
  p_dietary text[],
  p_equipment text[],
  p_max_minutes integer,
  p_budget_minor integer,
  p_servings integer,
  p_meal_type text default null
)
returns table (
  recipe_id bigint,
  estimated_cost_minor bigint,
  affordable_cost_minor bigint,
  uses_substitution boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  with active_costs as (
    select ingredient_id, quantity, unit, price_minor
    from public.ingredient_costs
    where is_active and location = 'Nairobi'
  ),
  component_costs as (
    select
      recipe_ingredients.recipe_id,
      (recipe_ingredients.quantity / base_cost.quantity) * base_cost.price_minor
        as base_cost_minor,
      least(
        (recipe_ingredients.quantity / base_cost.quantity) * base_cost.price_minor,
        coalesce(
          substitution.substitution_cost_minor,
          (recipe_ingredients.quantity / base_cost.quantity) * base_cost.price_minor
        )
      ) as affordable_cost_minor
    from public.recipe_ingredients
    left join active_costs base_cost
      on base_cost.ingredient_id = recipe_ingredients.ingredient_id
      and base_cost.unit = recipe_ingredients.unit
    left join lateral (
      select min(
        (recipe_ingredients.quantity / ingredient_substitutions.source_quantity)
        * ingredient_substitutions.alternative_quantity
        / alternative_cost.quantity
        * alternative_cost.price_minor
      ) as substitution_cost_minor
      from public.ingredient_substitutions
      join active_costs alternative_cost
        on alternative_cost.ingredient_id = ingredient_substitutions.alternative_ingredient_id
        and alternative_cost.unit = ingredient_substitutions.alternative_unit
      where ingredient_substitutions.source_ingredient_id = recipe_ingredients.ingredient_id
        and ingredient_substitutions.source_unit = recipe_ingredients.unit
        and ingredient_substitutions.is_active
    ) substitution on true
    where not recipe_ingredients.is_optional
  ),
  recipe_costs as (
    select
      recipe_id,
      ceil(sum(base_cost_minor))::bigint as base_cost_minor,
      ceil(sum(affordable_cost_minor))::bigint as affordable_cost_minor,
      bool_and(base_cost_minor is not null) as is_fully_priced,
      bool_or(affordable_cost_minor < base_cost_minor) as uses_substitution
    from component_costs
    group by recipe_id
  ),
  scaled as (
    select
      recipes.id as recipe_id,
      ceil(recipe_costs.base_cost_minor * p_servings::numeric / recipes.base_servings)::bigint
        as estimated_cost_minor,
      ceil(recipe_costs.affordable_cost_minor * p_servings::numeric / recipes.base_servings)::bigint
        as affordable_cost_minor,
      recipe_costs.uses_substitution,
      recipes.prep_minutes + recipes.cook_minutes as total_minutes,
      recipes.name
    from public.recipes
    join recipe_costs on recipe_costs.recipe_id = recipes.id
    where recipes.is_active
      and recipe_costs.is_fully_priced
      and recipes.dietary_tags @> coalesce(p_dietary, '{}'::text[])
      and recipes.required_equipment <@ coalesce(p_equipment, '{}'::text[])
      and (
        cardinality(recipes.accepted_heat_sources) = 0
        or recipes.accepted_heat_sources && coalesce(p_equipment, '{}'::text[])
      )
      and recipes.prep_minutes + recipes.cook_minutes <= p_max_minutes
      and (p_meal_type is null or p_meal_type = any(recipes.meal_types))
      and p_max_minutes between 5 and 480
      and p_budget_minor between 10000 and 100000000
      and p_servings between 1 and 30
      and (p_meal_type is null or p_meal_type in ('breakfast', 'lunch', 'dinner', 'snack'))
  )
  select
    scaled.recipe_id,
    scaled.estimated_cost_minor,
    scaled.affordable_cost_minor,
    scaled.uses_substitution
  from scaled
  where scaled.affordable_cost_minor <= p_budget_minor
  order by scaled.affordable_cost_minor, scaled.total_minutes, scaled.name
  limit 50;
$$;

revoke all on function public.get_recommendation_candidates(
  text[], text[], integer, integer, integer, text
) from public, anon;
grant execute on function public.get_recommendation_candidates(
  text[], text[], integer, integer, integer, text
) to authenticated, service_role;
