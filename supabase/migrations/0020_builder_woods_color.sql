-- Add color to builder_woods

alter table public.builder_woods
  add column if not exists color text;

