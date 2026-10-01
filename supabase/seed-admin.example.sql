-- Create your user first in Authentication > Users > Add user (auto-confirmed).
-- Replace the UUID below with YOUR user's ID, then run in SQL Editor.
-- Never put a password, database password or secret key into this repository.
insert into public.admin_users (user_id)
values ('REPLACE_WITH_AUTH_USER_UUID'::uuid)
on conflict (user_id) do nothing;
