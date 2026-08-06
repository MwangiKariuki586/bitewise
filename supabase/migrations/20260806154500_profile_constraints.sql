alter table public.profiles
  add column preferred_dishes text[] not null default '{}';

alter table public.profiles
  drop constraint profiles_budget_minor_check,
  add constraint profiles_budget_minor_check
    check (budget_minor is null or budget_minor between 10000 and 100000000),
  add constraint profiles_equipment_values_check
    check (
      array_position(equipment, null) is null
      and equipment <@ array[
        'gas_cooker', 'electric_cooker', 'jiko', 'oven', 'microwave',
        'air_fryer', 'blender', 'pressure_cooker', 'refrigerator'
      ]::text[]
    ),
  add constraint profiles_dietary_values_check
    check (
      array_position(dietary_preferences, null) is null
      and dietary_preferences <@ array[
        'vegetarian', 'vegan', 'pescatarian', 'halal', 'gluten_free',
        'dairy_free', 'nut_free'
      ]::text[]
    ),
  add constraint profiles_health_values_check
    check (
      array_position(health_goals, null) is null
      and health_goals <@ array[
        'balanced_eating', 'weight_management', 'heart_health',
        'blood_sugar_support', 'high_protein', 'high_fibre', 'low_sodium'
      ]::text[]
    ),
  add constraint profiles_cuisine_values_check
    check (
      array_position(preferred_cuisines, null) is null
      and preferred_cuisines <@ array[
        'kenyan', 'swahili_coast', 'kikuyu', 'luo', 'luhya', 'kamba',
        'kisii', 'indian_kenyan', 'ethiopian', 'mediterranean'
      ]::text[]
    ),
  add constraint profiles_preferred_dishes_check
    check (
      cardinality(preferred_dishes) <= 12
      and array_position(preferred_dishes, null) is null
    );
