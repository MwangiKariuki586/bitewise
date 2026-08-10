drop index public.shopping_list_items_ingredient_id_idx;

create index shopping_list_items_ingredient_id_idx
on public.shopping_list_items (ingredient_id, unit, shopping_list_id)
where ingredient_id is not null;

create index shopping_list_items_user_id_idx
on public.shopping_list_items (user_id, shopping_list_id, is_checked, id);
