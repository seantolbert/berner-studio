-- Home hero content managed via Admin, public readable

create table if not exists public.home_hero (
  id boolean primary key default true,
  updated_at timestamptz not null default now(),

  title text,
  subtitle text,
  image_url text,
  primary_label text,
  primary_href text,
  secondary_label text,
  secondary_href text
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists home_hero_set_updated_at on public.home_hero;
create trigger home_hero_set_updated_at before update on public.home_hero
for each row execute procedure public.set_updated_at();

-- RLS: public read, admin writes via service role
alter table public.home_hero enable row level security;

drop policy if exists "Public read home hero" on public.home_hero;
create policy "Public read home hero" on public.home_hero
for select using (true);

-- No public insert/update/delete policies; writes require service role.

