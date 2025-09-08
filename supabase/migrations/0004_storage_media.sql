-- Create a public media bucket for product images
do $$
begin
  perform storage.create_bucket('media', public => true);
exception when others then
  -- ignore if bucket already exists
  null;
end $$;

-- Allow public read from media bucket
drop policy if exists "Public read media" on storage.objects;
create policy "Public read media" on storage.objects
  for select
  using (bucket_id = 'media');

-- Do not grant public write. Admin uploads will use the service role via server APIs.

