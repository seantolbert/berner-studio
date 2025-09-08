-- Product variants for apparel (color/size matrix)

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  product_id uuid not null references public.products(id) on delete cascade,
  color text not null,
  size text not null,
  sku text,
  price_cents_override integer check (price_cents_override is null or price_cents_override >= 0),
  status text not null default 'draft' check (status in ('draft','published')),
  image_url text
);

-- One variant per color + size per product
create unique index if not exists product_variants_unique_variant_idx
  on public.product_variants (product_id, lower(color), size);

-- Optional unique sku when present
create unique index if not exists product_variants_sku_unique_idx
  on public.product_variants (sku)
  where sku is not null;

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists product_variants_set_updated_at on public.product_variants;
create trigger product_variants_set_updated_at
before update on public.product_variants
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.product_variants enable row level security;

-- Public can read variants of published products where variants are published
drop policy if exists "Public read published variants" on public.product_variants;
create policy "Public read published variants" on public.product_variants
for select using (
  status = 'published'
  and exists (
    select 1 from public.products p
    where p.id = product_variants.product_id
      and p.status = 'published'
      and p.deleted_at is null
  )
);

-- No public writes; admin uses service role

