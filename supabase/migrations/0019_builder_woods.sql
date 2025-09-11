-- Builder woods catalog for pricing and availability

create table if not exists public.builder_woods (
  key text primary key,
  name text not null,
  price_per_stick numeric not null default 0,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists builder_woods_set_updated_at on public.builder_woods;
create trigger builder_woods_set_updated_at before update on public.builder_woods
for each row execute procedure public.set_updated_at();

alter table public.builder_woods enable row level security;

drop policy if exists "Public read builder woods" on public.builder_woods;
create policy "Public read builder woods" on public.builder_woods
for select using (true);

