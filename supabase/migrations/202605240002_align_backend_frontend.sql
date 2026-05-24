create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  company text,
  role text not null default 'user' check (role in ('user', 'admin')),
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'denied')),
  default_comp_radius_miles numeric not null default 1,
  google_maps_api_key_encrypted text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  address text not null,
  city text,
  county text,
  state text,
  zip text,
  latitude numeric,
  longitude numeric,
  main_image_url text,
  property_images jsonb not null default '[]'::jsonb,
  zillow_estimate numeric,
  realtor_estimate numeric,
  estimated_arv numeric,
  upset_price numeric,
  star_rating integer,
  report_data jsonb not null default '{}'::jsonb,
  lien_data jsonb default '{}'::jsonb,
  tax_data jsonb default '{}'::jsonb,
  mortgage_data jsonb default '{}'::jsonb,
  foreclosure_data jsonb default '{}'::jsonb,
  water_sewer_data jsonb default '{}'::jsonb,
  custom_fields jsonb default '[]'::jsonb,
  share_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comps (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  address text not null,
  distance_miles numeric,
  beds numeric,
  baths numeric,
  square_feet numeric,
  sold_price numeric,
  sold_date date,
  year_built integer,
  image_url text,
  source text,
  adjustments jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  target_user_id uuid references auth.users(id),
  target_report_id uuid references public.reports(id),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.comps enable row level security;
alter table public.admin_audit_log enable row level security;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.role = 'admin'
      and p.approval_status = 'approved'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, approval_status)
  values (new.id, new.email, 'user', 'pending')
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

do $$
begin
  drop policy if exists profile_select_self_or_admin on public.profiles;
  drop policy if exists profile_insert_self on public.profiles;
  drop policy if exists profile_update_self on public.profiles;
  drop policy if exists profile_update_self_restricted on public.profiles;
  drop policy if exists profile_admin_manage on public.profiles;

  create policy profile_select_self_or_admin on public.profiles
    for select using (auth.uid() = id or public.is_admin(auth.uid()));

  create policy profile_insert_self on public.profiles
    for insert with check (auth.uid() = id);

  create policy profile_update_self on public.profiles
    for update using (auth.uid() = id)
    with check (
      auth.uid() = id
      and role = (select p.role from public.profiles p where p.id = auth.uid())
      and approval_status = (select p.approval_status from public.profiles p where p.id = auth.uid())
    );

  create policy profile_admin_manage on public.profiles
    for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

  drop policy if exists reports_owner_or_admin on public.reports;
  create policy reports_owner_or_admin on public.reports
    for all using (auth.uid() = user_id or public.is_admin(auth.uid()))
    with check (auth.uid() = user_id or public.is_admin(auth.uid()));

  drop policy if exists comps_owner_or_admin on public.comps;
  create policy comps_owner_or_admin on public.comps
    for all using (
      exists (
        select 1 from public.reports r
        where r.id = report_id
          and (r.user_id = auth.uid() or public.is_admin(auth.uid()))
      )
    )
    with check (
      exists (
        select 1 from public.reports r
        where r.id = report_id
          and (r.user_id = auth.uid() or public.is_admin(auth.uid()))
      )
    );

  drop policy if exists audit_admin_only on public.admin_audit_log;
  create policy audit_admin_only on public.admin_audit_log
    for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
end
$$;

create index if not exists idx_profiles_role_approval on public.profiles(role, approval_status);
create index if not exists idx_reports_user_id_created_at on public.reports(user_id, created_at desc);
create index if not exists idx_reports_city_county_state on public.reports(city, county, state);
create index if not exists idx_reports_share_token on public.reports(share_token);
create index if not exists idx_comps_report_id on public.comps(report_id);
create index if not exists idx_admin_audit_log_created_at on public.admin_audit_log(created_at desc);
create index if not exists idx_admin_audit_log_target_user on public.admin_audit_log(target_user_id);
