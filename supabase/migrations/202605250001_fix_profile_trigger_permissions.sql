-- Ensure auth signup trigger can create a matching profile row under RLS.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, approval_status)
  values (new.id, new.email, 'user', 'pending')
  on conflict (id) do nothing;

  return new;
end;
$$;

alter function public.handle_new_user() owner to postgres;
