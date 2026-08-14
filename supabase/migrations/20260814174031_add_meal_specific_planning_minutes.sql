alter table public.profiles
  add column eat_now_minutes smallint not null default 45,
  add column breakfast_minutes smallint not null default 45,
  add column lunch_minutes smallint not null default 45,
  add column dinner_minutes smallint not null default 45;

update public.profiles
set
  eat_now_minutes = available_minutes,
  breakfast_minutes = available_minutes,
  lunch_minutes = available_minutes,
  dinner_minutes = available_minutes;

alter table public.profiles
  add constraint profiles_eat_now_minutes_range
    check (eat_now_minutes between 5 and 480),
  add constraint profiles_breakfast_minutes_range
    check (breakfast_minutes between 5 and 480),
  add constraint profiles_lunch_minutes_range
    check (lunch_minutes between 5 and 480),
  add constraint profiles_dinner_minutes_range
    check (dinner_minutes between 5 and 480),
  add constraint profiles_available_minutes_covers_planning
    check (available_minutes >= greatest(breakfast_minutes, lunch_minutes, dinner_minutes));

create function public.enforce_meal_plan_item_time_limit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_limit integer;
  v_recipe_minutes integer;
begin
  select case new.meal_type
    when 'breakfast' then profiles.breakfast_minutes
    when 'lunch' then profiles.lunch_minutes
    when 'dinner' then profiles.dinner_minutes
  end
  into v_limit
  from public.profiles
  where profiles.user_id = new.user_id;

  select recipes.prep_minutes + recipes.cook_minutes
  into v_recipe_minutes
  from public.recipes
  where recipes.id = new.recipe_id
    and recipes.is_active;

  if v_limit is null or v_recipe_minutes is null or v_recipe_minutes > v_limit then
    raise exception 'The planned recipe exceeds the active meal-specific time limit.'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_meal_plan_item_time_limit()
from public, anon, authenticated;
grant execute on function public.enforce_meal_plan_item_time_limit()
to service_role;

create trigger meal_plan_items_enforce_time_limit
before insert or update of meal_type, recipe_id, user_id
on public.meal_plan_items
for each row execute function public.enforce_meal_plan_item_time_limit();
