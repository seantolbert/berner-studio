-- Add optional card label shown on storefront product cards
alter table public.products
  add column if not exists card_label text;

comment on column public.products.card_label is 'Optional badge text displayed on product cards.';
