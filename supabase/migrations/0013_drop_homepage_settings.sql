-- Remove legacy homepage_settings table and related objects

-- Drop RLS policy if it exists
drop policy if exists "Public read homepage settings" on public.homepage_settings;

-- Drop trigger if it exists
drop trigger if exists homepage_settings_set_updated_at on public.homepage_settings;

-- Finally, drop the table
drop table if exists public.homepage_settings cascade;

