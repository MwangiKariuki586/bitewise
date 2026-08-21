create index recommendation_events_run_owner_recipe_idx
  on public.recommendation_events (run_id, user_id, recipe_id);
