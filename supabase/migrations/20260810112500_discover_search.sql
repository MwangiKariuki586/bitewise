create index recipes_active_name_search_idx
on public.recipes using gin (lower(name) extensions.gin_trgm_ops)
where is_active;

create or replace function public.search_public_recipes(
  p_query text default null,
  p_max_minutes integer default null,
  p_equipment text[] default '{}',
  p_dietary_tags text[] default '{}',
  p_max_cost_minor bigint default null,
  p_ingredient_query text default null,
  p_cuisine text default null,
  p_difficulty text default null,
  p_limit integer default 12,
  p_offset integer default 0
)
returns table (
  recipe_id bigint,
  slug text,
  name text,
  summary text,
  cuisine text,
  meal_types text[],
  base_servings smallint,
  total_minutes integer,
  difficulty text,
  required_equipment text[],
  dietary_tags text[],
  estimated_cost_minor bigint,
  estimated_cost_per_serving_minor bigint,
  cost_captured_on date,
  image_path text,
  image_alt text,
  image_width integer,
  image_height integer,
  total_count bigint
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with priced_recipes as (
    select
      r.id,
      r.slug,
      r.name,
      r.summary,
      r.cuisine,
      r.meal_types,
      r.base_servings,
      (r.prep_minutes + r.cook_minutes)::integer as total_minutes,
      r.difficulty,
      r.accepted_heat_sources,
      r.required_equipment,
      r.dietary_tags,
      costs.estimated_cost_minor,
      costs.cost_captured_on,
      image.local_path as image_path,
      image.alt_text as image_alt,
      image.width as image_width,
      image.height as image_height
    from public.recipes r
    left join lateral (
      select
        case
          when bool_and(latest_cost.price_minor is not null)
            then round(sum(
              (ri.quantity / latest_cost.quantity) * latest_cost.price_minor
            ))::bigint
          else null
        end as estimated_cost_minor,
        min(latest_cost.captured_on) as cost_captured_on
      from public.recipe_ingredients ri
      left join lateral (
        select ic.quantity, ic.price_minor, ic.captured_on
        from public.ingredient_costs ic
        where ic.ingredient_id = ri.ingredient_id
          and ic.is_active
          and ic.location = 'Nairobi'
        order by ic.captured_on desc, ic.id desc
        limit 1
      ) latest_cost on true
      where ri.recipe_id = r.id
        and not ri.is_optional
    ) costs on true
    left join lateral (
      select rim.local_path, rim.alt_text, rim.width, rim.height
      from public.recipe_images rim
      where rim.recipe_id = r.id
        and rim.is_primary
      limit 1
    ) image on true
    where r.is_active
  ),
  filtered as (
    select priced_recipes.*
    from priced_recipes
    where (
      nullif(btrim(p_query), '') is null
      or lower(priced_recipes.name) like '%' || lower(btrim(p_query)) || '%'
      or lower(priced_recipes.summary) like '%' || lower(btrim(p_query)) || '%'
      or exists (
        select 1
        from public.recipe_ingredients search_ri
        join public.ingredients search_i on search_i.id = search_ri.ingredient_id
        where search_ri.recipe_id = priced_recipes.id
          and (
            lower(search_i.name) like '%' || lower(btrim(p_query)) || '%'
            or exists (
              select 1
              from unnest(search_i.aliases) alias
              where lower(alias) like '%' || lower(btrim(p_query)) || '%'
            )
          )
      )
    )
      and (p_max_minutes is null or priced_recipes.total_minutes <= p_max_minutes)
      and (
        coalesce(cardinality(p_equipment), 0) = 0
        or (
          priced_recipes.required_equipment <@ p_equipment
          and (
            cardinality(priced_recipes.accepted_heat_sources) = 0
            or priced_recipes.accepted_heat_sources && p_equipment
          )
        )
      )
      and (
        coalesce(cardinality(p_dietary_tags), 0) = 0
        or p_dietary_tags <@ priced_recipes.dietary_tags
      )
      and (
        p_max_cost_minor is null
        or ceil(
          priced_recipes.estimated_cost_minor::numeric / priced_recipes.base_servings
        ) <= p_max_cost_minor
      )
      and (
        nullif(btrim(p_ingredient_query), '') is null
        or exists (
          select 1
          from public.recipe_ingredients local_ri
          join public.ingredients local_i on local_i.id = local_ri.ingredient_id
          where local_ri.recipe_id = priced_recipes.id
            and (
              lower(local_i.name) like '%' || lower(btrim(p_ingredient_query)) || '%'
              or exists (
                select 1
                from unnest(local_i.aliases) alias
                where lower(alias) like '%' || lower(btrim(p_ingredient_query)) || '%'
              )
            )
        )
      )
      and (p_cuisine is null or priced_recipes.cuisine = p_cuisine)
      and (p_difficulty is null or priced_recipes.difficulty = p_difficulty)
  )
  select
    filtered.id,
    filtered.slug,
    filtered.name,
    filtered.summary,
    filtered.cuisine,
    filtered.meal_types,
    filtered.base_servings,
    filtered.total_minutes,
    filtered.difficulty,
    filtered.required_equipment,
    filtered.dietary_tags,
    filtered.estimated_cost_minor,
    case
      when filtered.estimated_cost_minor is null then null
      else ceil(
        filtered.estimated_cost_minor::numeric / filtered.base_servings
      )::bigint
    end,
    filtered.cost_captured_on,
    filtered.image_path,
    filtered.image_alt,
    filtered.image_width,
    filtered.image_height,
    count(*) over ()
  from filtered
  order by
    case
      when nullif(btrim(p_query), '') is not null
        and lower(filtered.name) = lower(btrim(p_query)) then 0
      when nullif(btrim(p_query), '') is not null
        and lower(filtered.name) like lower(btrim(p_query)) || '%' then 1
      else 2
    end,
    filtered.total_minutes,
    filtered.estimated_cost_minor nulls last,
    filtered.name,
    filtered.id
  limit least(greatest(coalesce(p_limit, 12), 1), 24)
  offset least(greatest(coalesce(p_offset, 0), 0), 2400);
$$;

revoke all on function public.search_public_recipes(
  text, integer, text[], text[], bigint, text, text, text, integer, integer
) from public;
grant execute on function public.search_public_recipes(
  text, integer, text[], text[], bigint, text, text, text, integer, integer
) to anon, authenticated, service_role;
