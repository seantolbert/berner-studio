-- About, FAQ, and Gallery CMS tables

-- About page: single row editable content
create table if not exists public.about_page (
  id boolean primary key default true,
  updated_at timestamptz not null default now(),
  title text,
  body_md text
);

-- FAQs
create table if not exists public.faq (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  question text not null,
  answer text not null,
  position integer not null default 0,
  published boolean not null default true
);

create index if not exists faq_published_idx on public.faq(published);
create index if not exists faq_position_idx on public.faq(position);

-- Gallery
create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  url text not null,
  alt text,
  caption text,
  position integer not null default 0,
  published boolean not null default true
);

create index if not exists gallery_published_idx on public.gallery(published);
create index if not exists gallery_position_idx on public.gallery(position);

-- updated_at trigger (reused)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists faq_set_updated_at on public.faq;
create trigger faq_set_updated_at
before update on public.faq
for each row execute procedure public.set_updated_at();

drop trigger if exists gallery_set_updated_at on public.gallery;
create trigger gallery_set_updated_at
before update on public.gallery
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.about_page enable row level security;
alter table public.faq enable row level security;
alter table public.gallery enable row level security;

-- Public read policies
drop policy if exists "Public read about" on public.about_page;
create policy "Public read about" on public.about_page
for select using (true);

drop policy if exists "Public read published FAQs" on public.faq;
create policy "Public read published FAQs" on public.faq
for select using (published = true);

drop policy if exists "Public read published gallery" on public.gallery;
create policy "Public read published gallery" on public.gallery
for select using (published = true);

-- No public writes; admin will use service role via APIs

