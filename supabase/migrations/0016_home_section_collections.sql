-- Optional per-section collection buttons

create table if not exists public.home_section_collections (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.home_sections(id) on delete cascade,
  label text not null,
  href text,
  position integer not null default 0
);

create index if not exists home_section_collections_section_idx on public.home_section_collections(section_id);
create index if not exists home_section_collections_position_idx on public.home_section_collections(section_id, position);

-- RLS: public read
alter table public.home_section_collections enable row level security;

drop policy if exists "Public read home section collections" on public.home_section_collections;
create policy "Public read home section collections" on public.home_section_collections
for select using (true);

