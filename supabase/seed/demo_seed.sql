-- Demo seed data for local development.

-- Create a local admin user for development/testing.
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@propertyintel.app',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
)
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  updated_at = now();

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  jsonb_build_object('sub', '22222222-2222-2222-2222-222222222222', 'email', 'admin@propertyintel.app'),
  'email',
  '22222222-2222-2222-2222-222222222222',
  now(),
  now(),
  now()
)
on conflict (id) do nothing;

insert into public.profiles (id, email, role, approval_status)
values ('22222222-2222-2222-2222-222222222222', 'admin@propertyintel.app', 'admin', 'approved')
on conflict (id) do update
set role = 'admin', approval_status = 'approved', email = excluded.email;

insert into public.reports (id,user_id,address,city,county,state,zip,estimated_arv,upset_price,star_rating,report_data)
values ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','123 Demo Ave','Austin','Travis','TX','78701',420000,285000,4,'{"summary":"Promising cash-flow candidate."}')
on conflict do nothing;
