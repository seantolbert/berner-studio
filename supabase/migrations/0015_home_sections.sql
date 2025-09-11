-- Configurable homepage sections and their product selections

create table if not exists public.home_sections (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  position integer not null default 0,

  title text not null,
  subtext text,
  view_all_label text,
  view_all_href text,
  max_items integer not null default 3 check (max_items >= 3)
);

create index if not exists home_sections_position_idx on public.home_sections(position);

create table if not exists public.home_section_products (
  section_id uuid not null references public.home_sections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  position integer not null default 0,
  primary key (section_id, product_id)
);

create index if not exists home_section_products_section_idx on public.home_section_products(section_id);
create index if not exists home_section_products_position_idx on public.home_section_products(section_id, position);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists home_sections_set_updated_at on public.home_sections;
create trigger home_sections_set_updated_at before update on public.home_sections
for each row execute procedure public.set_updated_at();

-- RLS: public can read sections and selections, writes via service role
alter table public.home_sections enable row level security;
alter table public.home_section_products enable row level security;

drop policy if exists "Public read home sections" on public.home_sections;
create policy "Public read home sections" on public.home_sections
for select using (true);

drop policy if exists "Public read home section products" on public.home_section_products;
create policy "Public read home section products" on public.home_section_products
for select using (true);

