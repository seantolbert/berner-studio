-- Homepage CMS: single-row settings for homepage content

create table if not exists public.homepage_settings (
  id boolean primary key default true,
  updated_at timestamptz not null default now(),

  -- Promo banner
  promo_enabled boolean not null default false,
  promo_text text,

  -- Hero section
  hero_title text,
  hero_subtitle text,

  -- Boards section
  boards_title text,
  boards_description text,
  boards_placeholder_url text,

  -- Bottle openers section
  bottle_title text,
  bottle_description text,
  bottle_placeholder_url text,

  -- Testimonials
  testimonials_enabled boolean not null default false,
  testimonial_quote text,
  testimonial_author text
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists homepage_settings_set_updated_at on public.homepage_settings;
create trigger homepage_settings_set_updated_at before update on public.homepage_settings
for each row execute procedure public.set_updated_at();

-- RLS: public read, admin writes only (via service role)
alter table public.homepage_settings enable row level security;

drop policy if exists "Public read homepage settings" on public.homepage_settings;
create policy "Public read homepage settings" on public.homepage_settings
for select using (true);

-- No public insert/update/delete policies; writes require service role.

