-- Add href targets for hero CTAs

alter table public.homepage_settings
  add column if not exists hero_cta_primary_href text,
  add column if not exists hero_cta_secondary_href text;

