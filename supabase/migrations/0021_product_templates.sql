-- Product-specific templates that can be associated with board products

create table if not exists public.product_templates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null,
  size text not null check (size in ('small','regular','large')),
  strip3_enabled boolean not null default false,
  strips jsonb not null,
  "order" jsonb not null,

  -- Optional association to a product; when set, this is the canonical template for that product
  product_id uuid references public.products(id),
  created_by uuid references auth.users(id)
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists product_templates_set_updated_at on public.product_templates;
create trigger product_templates_set_updated_at before update on public.product_templates
for each row execute procedure public.set_updated_at();

alter table public.product_templates enable row level security;

-- Public can read templates (used to render product pages)
drop policy if exists "Public read product templates" on public.product_templates;
create policy "Public read product templates" on public.product_templates
for select using (true);

-- Authenticated users can insert (UI restricts to admins)
drop policy if exists "Authenticated insert product templates" on public.product_templates;
create policy "Authenticated insert product templates" on public.product_templates
for insert with check (auth.uid() is not null);

-- Allow owners to update/delete their rows (optional)
drop policy if exists "Owners update product templates" on public.product_templates;
create policy "Owners update product templates" on public.product_templates
for update using (created_by = auth.uid());

drop policy if exists "Owners delete product templates" on public.product_templates;
create policy "Owners delete product templates" on public.product_templates
for delete using (created_by = auth.uid());

