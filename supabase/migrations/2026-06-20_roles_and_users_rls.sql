begin;

-- =========================================================
-- 0) Extensions
-- =========================================================
create extension if not exists pgcrypto;

-- =========================================================
-- 1) Shared trigger helper
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- 2) roles table
-- =========================================================
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  name text not null,
  description text null,
  permissions text[] not null default '{}',
  is_active boolean not null default true,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint roles_key_unique unique (key),
  constraint roles_key_format check (key ~ '^[a-z0-9_-]+$'),
  constraint roles_name_not_blank check (length(btrim(name)) > 0)
);

create index if not exists roles_key_idx on public.roles (key);
create index if not exists roles_is_active_idx on public.roles (is_active);
create index if not exists roles_is_system_idx on public.roles (is_system);
create index if not exists roles_created_at_idx on public.roles (created_at desc);

drop trigger if exists set_roles_updated_at on public.roles;
create trigger set_roles_updated_at
before update on public.roles
for each row
execute function public.set_updated_at();

-- =========================================================
-- 3) users patching
--    Assumes public.users already exists.
-- =========================================================
alter table public.users
  add column if not exists assigned_role_id uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_assigned_role_id_fkey'
  ) then
    alter table public.users
      add constraint users_assigned_role_id_fkey
      foreign key (assigned_role_id)
      references public.roles(id)
      on delete set null;
  end if;
end $$;

create index if not exists users_assigned_role_id_idx
  on public.users (assigned_role_id);

-- لو جدول users فيه updated_at نفعّل له trigger أيضًا
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'updated_at'
  ) then
    execute 'drop trigger if exists set_users_updated_at on public.users';
    execute '
      create trigger set_users_updated_at
      before update on public.users
      for each row
      execute function public.set_updated_at()
    ';
  end if;
end $$;

-- =========================================================
-- 4) Seed system roles
--    Upsert keeps migration rerunnable.
-- =========================================================
insert into public.roles (
  key,
  name,
  description,
  permissions,
  is_active,
  is_system
)
values
  (
    'admin',
    'مدير النظام',
    'صلاحية كاملة لإدارة المستخدمين والأدوار والمحتوى والإعدادات.',
    array[
      'manage_roles',
      'manage_users',
      'assign_roles',
      'manage_subjects',
      'manage_content',
      'manage_requests',
      'view_reports',
      'manage_settings'
    ]::text[],
    true,
    true
  ),
  (
    'supervisor',
    'مشرف',
    'إدارة تشغيلية ومتابعة المحتوى والطلبات والتقارير.',
    array[
      'manage_users',
      'assign_roles',
      'manage_subjects',
      'manage_content',
      'manage_requests',
      'view_reports'
    ]::text[],
    true,
    true
  ),
  (
    'teacher',
    'معلم',
    'إدارة المواد والمحتوى التعليمي الخاص به ومتابعة طلابه.',
    array[
      'manage_own_subjects',
      'manage_own_content',
      'view_own_reports'
    ]::text[],
    true,
    true
  ),
  (
    'student',
    'طالب',
    'الوصول إلى المحتوى المخصص له ومتابعة تعلمه.',
    array[
      'view_assigned_content',
      'view_own_progress'
    ]::text[],
    true,
    true
  )
on conflict (key)
do update set
  name = excluded.name,
  description = excluded.description,
  permissions = excluded.permissions,
  is_active = excluded.is_active,
  is_system = excluded.is_system,
  updated_at = now();

-- =========================================================
-- 5) Optional migration from assigned_role_key -> assigned_role_id
--    Runs only if assigned_role_key exists.
-- =========================================================
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'assigned_role_key'
  ) then
    update public.users u
    set assigned_role_id = r.id
    from public.roles r
    where u.assigned_role_id is null
      and u.assigned_role_key is not null
      and lower(btrim(u.assigned_role_key)) = r.key;
  end if;
end $$;

-- =========================================================
-- 6) Keep assigned_role_key in sync if it still exists
--    Optional compatibility layer for legacy frontend/backend.
-- =========================================================
create or replace function public.sync_assigned_role_key_from_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
  has_old_column boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'assigned_role_key'
  ) into has_old_column;

  if not has_old_column then
    return new;
  end if;

  if new.assigned_role_id is null then
    new.assigned_role_key = null;
    return new;
  end if;

  select key into v_key
  from public.roles
  where id = new.assigned_role_id
  limit 1;

  new.assigned_role_key = v_key;
  return new;
end;
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'assigned_role_key'
  ) then
    execute 'drop trigger if exists trg_sync_assigned_role_key_from_id on public.users';
    execute '
      create trigger trg_sync_assigned_role_key_from_id
      before insert or update of assigned_role_id
      on public.users
      for each row
      execute function public.sync_assigned_role_key_from_id()
    ';
  end if;
end $$;

-- =========================================================
-- 7) Security helper functions for RLS
-- =========================================================
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
  limit 1
$$;

revoke all on function public.current_user_profile_role() from public;
grant execute on function public.current_user_profile_role() to anon, authenticated, service_role;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_profile_role() = 'admin', false)
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- =========================================================
-- 8) Hardening helpers for roles
-- =========================================================
create or replace function public.protect_system_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.is_system then
      raise exception 'System roles cannot be deleted.';
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    if old.is_system then
      if new.key is distinct from old.key then
        raise exception 'System role key cannot be changed.';
      end if;

      if new.is_system is distinct from old.is_system and new.is_system = false then
        raise exception 'System role flag cannot be removed.';
      end if;
    end if;

    if old.key = 'admin' and new.is_active = false then
      raise exception 'Admin role cannot be deactivated.';
    end if;

    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_system_roles on public.roles;
create trigger trg_protect_system_roles
before update or delete on public.roles
for each row
execute function public.protect_system_roles();

-- =========================================================
-- 9) Prevent privilege escalation for non-admin users
--    Protects role / assigned_role_id / assigned_role_key if present
-- =========================================================
create or replace function public.prevent_non_admin_user_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  has_old_column boolean;
begin
  if auth.uid() is null then
    raise exception 'Unauthenticated';
  end if;

  if public.is_admin() then
    return new;
  end if;

  if new.id is distinct from auth.uid() then
    raise exception 'You can only update your own user record.';
  end if;

  if new.role is distinct from old.role then
    raise exception 'You cannot change your role.';
  end if;

  if new.assigned_role_id is distinct from old.assigned_role_id then
    raise exception 'You cannot change your assigned role.';
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'assigned_role_key'
  ) into has_old_column;

  if has_old_column then
    if new.assigned_role_key is distinct from old.assigned_role_key then
      raise exception 'You cannot change your assigned role key.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_non_admin_user_escalation on public.users;
create trigger trg_prevent_non_admin_user_escalation
before update on public.users
for each row
execute function public.prevent_non_admin_user_escalation();

-- =========================================================
-- 10) Enable RLS
-- =========================================================
alter table public.roles enable row level security;
alter table public.users enable row level security;

-- =========================================================
-- 11) Drop old conflicting policies
-- =========================================================
drop policy if exists "roles_select_admin_only" on public.roles;
drop policy if exists "roles_insert_admin_only" on public.roles;
drop policy if exists "roles_update_admin_only" on public.roles;
drop policy if exists "roles_delete_admin_only" on public.roles;

drop policy if exists "users_select_own_or_admin" on public.users;
drop policy if exists "users_update_own_or_admin" on public.users;
drop policy if exists "users_insert_admin_only" on public.users;
drop policy if exists "users_delete_admin_only" on public.users;

-- =========================================================
-- 12) roles RLS policies
-- =========================================================
create policy "roles_select_admin_only"
on public.roles
for select
to authenticated
using (public.is_admin());

create policy "roles_insert_admin_only"
on public.roles
for insert
to authenticated
with check (public.is_admin());

create policy "roles_update_admin_only"
on public.roles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "roles_delete_admin_only"
on public.roles
for delete
to authenticated
using (public.is_admin());

-- =========================================================
-- 13) users RLS policies
-- =========================================================
create policy "users_select_own_or_admin"
on public.users
for select
to authenticated
using (
  id = auth.uid()
  or public.is_admin()
);

create policy "users_update_own_or_admin"
on public.users
for update
to authenticated
using (
  id = auth.uid()
  or public.is_admin()
)
with check (
  id = auth.uid()
  or public.is_admin()
);

create policy "users_insert_admin_only"
on public.users
for insert
to authenticated
with check (public.is_admin());

create policy "users_delete_admin_only"
on public.users
for delete
to authenticated
using (public.is_admin());

-- =========================================================
-- 14) Grants
-- =========================================================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.roles to authenticated;
grant select, insert, update, delete on public.users to authenticated;

grant all on public.roles to service_role;
grant all on public.users to service_role;

commit;