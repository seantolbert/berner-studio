-- Product categories management table

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  slug text not null
);

create unique index if not exists product_categories_slug_unique_idx
  on public.product_categories (lower(slug));

create unique index if not exists product_categories_name_unique_idx
  on public.product_categories (lower(name));

drop trigger if exists product_categories_set_updated_at on public.product_categories;
create trigger product_categories_set_updated_at
before update on public.product_categories
for each row execute procedure public.set_updated_at();

alter table public.product_categories enable row level security;

drop policy if exists "Public read product categories" on public.product_categories;
create policy "Public read product categories" on public.product_categories
for select using (true);

insert into public.product_categories (name, slug)
values
  ('Boards', 'boards'),
  ('Bottle Openers', 'bottle-openers'),
  ('Apparel', 'apparel')
on conflict (lower(slug)) do nothing;

alter table public.home_sections
  drop constraint if exists home_sections_category_check;
