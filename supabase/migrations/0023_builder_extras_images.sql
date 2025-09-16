-- Builder extras gallery images

create table if not exists public.builder_extras_images (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  alt text,
  is_primary boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists builder_extras_images_position_idx on public.builder_extras_images (position, created_at);

alter table public.builder_extras_images enable row level security;

drop policy if exists "Public read builder extras images" on public.builder_extras_images;
create policy "Public read builder extras images" on public.builder_extras_images
for select using (true);

