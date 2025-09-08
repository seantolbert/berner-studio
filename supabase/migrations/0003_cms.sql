-- CMS schema: products, product images, SEO (global + per-product), legacy slugs
-- Run in Supabase SQL editor or via `supabase db push`.

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,

  slug text not null unique,
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  category text not null check (category in ('bottle-openers','apparel','boards')),
  status text not null default 'draft' check (status in ('draft','published','archived')),

  short_desc text,
  long_desc text,
  primary_image_url text,
  tags text[] not null default '{}'
);

create index if not exists products_status_idx on public.products(status);
create index if not exists products_category_idx on public.products(category);

-- Images per product
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text,
  is_primary boolean not null default false,
  position integer not null default 0
);

create index if not exists product_images_product_id_idx on public.product_images(product_id);

-- Per-product SEO overrides (one-to-one)
create table if not exists public.product_seo (
  product_id uuid primary key references public.products(id) on delete cascade,
  seo_title text,
  seo_description text,
  canonical_url text,
  og_image_url text,
  updated_at timestamptz not null default now()
);

-- Global SEO settings (single row)
create table if not exists public.seo_settings (
  id boolean primary key default true,
  site_title text,
  site_description text,
  default_og_image text,
  updated_at timestamptz not null default now()
);

-- Previous slugs for redirects
create table if not exists public.product_slugs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  product_id uuid not null references public.products(id) on delete cascade,
  slug text not null unique
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
for each row execute procedure public.set_updated_at();

drop trigger if exists product_seo_set_updated_at on public.product_seo;
create trigger product_seo_set_updated_at before update on public.product_seo
for each row execute procedure public.set_updated_at();

drop trigger if exists seo_settings_set_updated_at on public.seo_settings;
create trigger seo_settings_set_updated_at before update on public.seo_settings
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_seo enable row level security;
alter table public.seo_settings enable row level security;
alter table public.product_slugs enable row level security;

-- Public read policies for published products only
drop policy if exists "Public read published products" on public.products;
create policy "Public read published products" on public.products
for select using (status = 'published' and deleted_at is null);

drop policy if exists "Public read images of published products" on public.product_images;
create policy "Public read images of published products" on public.product_images
for select using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id
      and p.status = 'published' and p.deleted_at is null
  )
);

drop policy if exists "Public read SEO of published products" on public.product_seo;
create policy "Public read SEO of published products" on public.product_seo
for select using (
  exists (
    select 1 from public.products p
    where p.id = product_seo.product_id
      and p.status = 'published' and p.deleted_at is null
  )
);

drop policy if exists "Public read seo_settings" on public.seo_settings;
create policy "Public read seo_settings" on public.seo_settings
for select using (true);

drop policy if exists "Public read product_slugs" on public.product_slugs;
create policy "Public read product_slugs" on public.product_slugs
for select using (true);

-- No public insert/update/delete policies; writes require service role.

