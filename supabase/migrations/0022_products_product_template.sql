-- Add product_template_id to products to associate a board template

alter table public.products
  add column if not exists product_template_id uuid references public.product_templates(id);

create index if not exists products_product_template_id_idx on public.products(product_template_id);

