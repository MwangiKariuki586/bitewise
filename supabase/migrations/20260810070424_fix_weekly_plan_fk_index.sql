create index meal_plan_items_plan_owner_idx
on public.meal_plan_items (meal_plan_id, user_id);
