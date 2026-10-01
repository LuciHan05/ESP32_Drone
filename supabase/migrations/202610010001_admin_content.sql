-- Run once in the SQL Editor of the separate ESP32_DRONE Supabase project.
begin;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;
drop policy if exists "Admins see only their membership" on public.admin_users;
create policy "Admins see only their membership" on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));
-- No INSERT / UPDATE / DELETE policy: signup can never enroll an administrator.

create table if not exists public.drone_content (
  id text primary key check (id = 'main'),
  content jsonb check (content is null or jsonb_typeof(content) = 'object'),
  revision integer not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
alter table public.drone_content enable row level security;
revoke all on public.drone_content from anon, authenticated;
grant select on public.drone_content to anon, authenticated;
grant update (content, revision, updated_at, updated_by) on public.drone_content to authenticated;
drop policy if exists "Public portfolio content" on public.drone_content;
create policy "Public portfolio content" on public.drone_content
  for select to anon, authenticated using (true);
drop policy if exists "Only allowlisted owner edits content" on public.drone_content;
create policy "Only allowlisted owner edits content" on public.drone_content
  for update to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid())))
  with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

-- No JSON duplicated in SQL: NULL reads the app's default content until first save.
insert into public.drone_content (id, content, revision) values ('main', null, 0)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('drone-images', 'drone-images', true, 3145728, array['image/webp'])
on conflict (id) do update set public = true, file_size_limit = 3145728, allowed_mime_types = array['image/webp'];

drop policy if exists "Only allowlisted owner uploads drone images" on storage.objects;
create policy "Only allowlisted owner uploads drone images" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'drone-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and storage.extension(name) = 'webp'
    and exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  );
-- Public buckets serve image bytes without a SELECT policy. No object listing,
-- overwrite or deletion is granted to site visitors or unrelated auth users.

commit;
