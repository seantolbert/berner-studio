-- Single-row builder pricing configuration

create table if not exists public.builder_pricing (
  id boolean primary key default true,
  updated_at timestamptz not null default now(),
  currency text not null default 'USD',
  cell_price numeric not null default 1, -- dollars per filled cell
  base_small numeric not null default 150,
  base_regular numeric not null default 200,
  base_large numeric not null default 300,
  extra_third_strip numeric not null default 0,
  extra_juice_groove numeric not null default 20,
  extra_brass_feet numeric not null default 0
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists builder_pricing_set_updated_at on public.builder_pricing;
create trigger builder_pricing_set_updated_at before update on public.builder_pricing
for each row execute procedure public.set_updated_at();

alter table public.builder_pricing enable row level security;

drop policy if exists "Public read builder pricing" on public.builder_pricing;
create policy "Public read builder pricing" on public.builder_pricing
for select using (true);

