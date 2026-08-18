begin;

create or replace function public.current_user_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.role
  from public.users u
  where u.id = auth.uid()
  limit 1;
$$;

revoke all on function public.current_user_profile_role() from public;
grant execute on function public.current_user_profile_role()
to anon, authenticated, service_role;

create or replace function public.isadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_profile_role() = 'admin', false);
$$;

revoke all on function public.isadmin() from public;
grant execute on function public.isadmin()
to anon, authenticated, service_role;

commit;