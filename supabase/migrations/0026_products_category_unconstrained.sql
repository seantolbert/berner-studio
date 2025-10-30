-- Allow arbitrary product categories instead of the original fixed enum.
-- Drops the check constraint so new categories added via the admin UI succeed.

alter table public.products
  drop constraint if exists products_category_check;
