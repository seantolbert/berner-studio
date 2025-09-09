-- Boards hero copy in homepage_settings

alter table public.homepage_settings
  add column if not exists boards_hero_title text,
  add column if not exists boards_hero_subtitle text;

