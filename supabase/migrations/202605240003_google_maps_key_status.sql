alter table public.profiles
add column if not exists google_maps_api_key_encrypted text,
add column if not exists google_maps_api_key_status text not null default 'not_connected',
add column if not exists google_maps_api_key_last_tested_at timestamptz;

update public.profiles
set google_maps_api_key_status = coalesce(google_maps_api_key_status, 'not_connected')
where google_maps_api_key_status is null;
