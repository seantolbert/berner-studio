-- Add optional category to home_sections to auto-populate products

alter table public.home_sections
  add column if not exists category text check (category in ('bottle-openers','apparel','boards'));

