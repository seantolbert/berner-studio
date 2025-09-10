-- Extend homepage_settings with editable text labels used on the homepage

alter table public.homepage_settings
  add column if not exists hero_cta_primary_text text,
  add column if not exists hero_cta_secondary_text text,
  add column if not exists hero_feature_1 text,
  add column if not exists hero_feature_2 text,
  add column if not exists hero_feature_3 text,
  add column if not exists boards_view_all_text text,
  add column if not exists boards_cta_build_text text,
  add column if not exists boards_cta_purist_text text,
  add column if not exists boards_cta_classics_text text,
  add column if not exists apparel_title text,
  add column if not exists apparel_empty_text text,
  add column if not exists more_title text,
  add column if not exists more_body text;

