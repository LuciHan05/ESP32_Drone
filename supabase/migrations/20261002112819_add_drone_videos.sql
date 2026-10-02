-- Run in Esp32Drone > SQL Editor. Existing photos and content are unchanged.
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('drone-videos', 'drone-videos', true, 52428800, array['video/mp4', 'video/webm'])
on conflict (id) do update set public = true,
  file_size_limit = 52428800, allowed_mime_types = array['video/mp4', 'video/webm'];

drop policy if exists "Only allowlisted owner uploads drone videos" on storage.objects;
create policy "Only allowlisted owner uploads drone videos" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'drone-videos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and storage.extension(name) in ('mp4', 'webm')
    and exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  );
-- Public playback by URL; no listing, overwrite or deletion granted.
-- New objects always use a random filename. The app issues upload tokens only
-- after validating the session and admin membership; no service-role key needed.

commit;
