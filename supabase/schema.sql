-- Templates store the SSOT for starting configurations
create table if not exists public.templates (
  id text primary key,
  name text not null,
  size text not null check (size in ('small','regular','large')),
  strip3_enabled boolean not null default false,
  strips jsonb not null,
  "order" jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

-- Boards store a user’s working state snapshot
create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  name text,
  size text not null check (size in ('small','regular','large')),
  strip3_enabled boolean not null default false,
  data jsonb not null, -- { strips: string[][], order: {stripNo:number, reflected:boolean}[] }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists boards_user_id_idx on public.boards(user_id);

-- Trigger to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists boards_set_updated_at on public.boards;
create trigger boards_set_updated_at
before update on public.boards
for each row execute procedure public.set_updated_at();

-- Enable Row Level Security and add basic policies (after you enable Auth)
alter table public.boards enable row level security;
alter table public.templates enable row level security;

-- Allow read-only access to templates for all (optional)
drop policy if exists "Public read templates" on public.templates;
create policy "Public read templates" on public.templates
for select using (true);

-- Boards: users can CRUD their own
drop policy if exists "Users select own boards" on public.boards;
create policy "Users select own boards" on public.boards
for select using (auth.uid() = user_id);

drop policy if exists "Users insert own boards" on public.boards;
create policy "Users insert own boards" on public.boards
for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own boards" on public.boards;
create policy "Users update own boards" on public.boards
for update using (auth.uid() = user_id);

drop policy if exists "Users delete own boards" on public.boards;
create policy "Users delete own boards" on public.boards
for delete using (auth.uid() = user_id);

-- Note: run this file in Supabase SQL editor or via CLI.

