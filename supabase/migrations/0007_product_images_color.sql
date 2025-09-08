-- Add optional color to product_images to support per-color galleries

alter table public.product_images
  add column if not exists color text;

-- Helpful index for filtering by product + color (case-insensitive on color)
create index if not exists product_images_product_color_idx
  on public.product_images (product_id, lower(color));

-- No RLS changes required; existing read policy depends on parent product status

