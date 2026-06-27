create extension if not exists pgcrypto;

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists permissions (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  module text not null,
  created_at timestamptz not null default now()
);

create table if not exists role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_key text not null references roles(key) on delete cascade,
  permission_key text not null references permissions(key) on delete cascade,
  unique(role_key, permission_key)
);

create table if not exists user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  permission_key text not null references permissions(key) on delete cascade,
  allowed boolean not null default true,
  unique(user_id, permission_key)
);

alter table public.users
  add column if not exists avatar_url text,
  add column if not exists is_active boolean not null default true,
  add column if not exists assigned_role_key text,
  add column if not exists current_term_id uuid,
  add column if not exists last_seen_at timestamptz,
  add column if not exists created_by uuid,
  add column if not exists updated_at timestamptz default now();

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  stage text,
  is_active boolean not null default true,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists academic_terms (
  id uuid primary key default gen_random_uuid(),
  academic_year text not null,
  key text not null,
  name text not null,
  starts_on date,
  ends_on date,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(academic_year, key)
);

create table if not exists platform_settings (
  id uuid primary key default gen_random_uuid(),
  default_term_id uuid references academic_terms(id),
  allow_data_entry_create_users boolean not null default true,
  allow_data_entry_edit_users boolean not null default false,
  allow_supervisor_view_analytics boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists delegations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  delegated_by uuid not null references users(id),
  title text not null,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists delegation_permissions (
  id uuid primary key default gen_random_uuid(),
  delegation_id uuid not null references delegations(id) on delete cascade,
  permission_key text not null references permissions(key) on delete cascade,
  unique(delegation_id, permission_key)
);

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  user_name text,
  user_role text,
  action text not null,
  entity_type text not null,
  entity_id text,
  meta jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

insert into roles (key, name, description) values
('admin', 'أدمن', 'صلاحيات كاملة على المنصة'),
('manager', 'مدير', 'إدارة تشغيلية كاملة تقريباً'),
('supervisor', 'مشرف', 'متابعة المعلمين والطلاب والتقارير'),
('data_entry', 'مدخل بيانات', 'إدخال وتحديث بيانات ضمن حدود'),
('teacher', 'معلم', 'صلاحيات تعليمية تخص محتواه وطلابه'),
('student', 'طالب', 'استخدام المنصة والتعلّم')
on conflict (key) do nothing;

insert into permissions (key, name, module) values
('users.view', 'عرض المستخدمين', 'users'),
('users.create', 'إضافة مستخدم', 'users'),
('users.edit', 'تعديل مستخدم', 'users'),
('users.delete', 'حذف مستخدم', 'users'),
('users.assign_role', 'تعيين دور', 'users'),
('users.upload_avatar', 'رفع صورة المستخدم', 'users'),
('subjects.view', 'عرض المواد', 'subjects'),
('subjects.create', 'إضافة مادة', 'subjects'),
('subjects.edit', 'تعديل مادة', 'subjects'),
('subjects.delete', 'حذف مادة', 'subjects'),
('terms.view', 'عرض الفصول', 'terms'),
('terms.create', 'إضافة فصل', 'terms'),
('terms.edit', 'تعديل فصل', 'terms'),
('terms.set_default', 'تعيين الفصل الافتراضي', 'terms'),
('activity.view', 'عرض سجل الحركة', 'activity'),
('teachers.view', 'عرض المعلمين', 'teachers'),
('teachers.analytics', 'تحليلات المعلمين', 'teachers'),
('students.view', 'عرض الطلاب', 'students'),
('students.analytics', 'تحليلات الطلاب', 'students'),
('delegations.manage', 'إدارة التفويضات', 'delegations'),
('settings.manage', 'إدارة الإعدادات', 'settings')
on conflict (key) do nothing;

insert into role_permissions (role_key, permission_key)
select 'admin', key from permissions
on conflict do nothing;

insert into role_permissions (role_key, permission_key) values
('manager', 'users.view'),
('manager', 'users.create'),
('manager', 'users.edit'),
('manager', 'users.assign_role'),
('manager', 'subjects.view'),
('manager', 'subjects.create'),
('manager', 'subjects.edit'),
('manager', 'subjects.delete'),
('manager', 'terms.view'),
('manager', 'terms.create'),
('manager', 'terms.edit'),
('manager', 'terms.set_default'),
('manager', 'activity.view'),
('manager', 'teachers.view'),
('manager', 'teachers.analytics'),
('manager', 'students.view'),
('manager', 'students.analytics'),
('manager', 'delegations.manage'),
('manager', 'settings.manage'),

('supervisor', 'teachers.view'),
('supervisor', 'teachers.analytics'),
('supervisor', 'students.view'),
('supervisor', 'students.analytics'),
('supervisor', 'activity.view'),

('data_entry', 'users.view'),
('data_entry', 'users.create'),
('data_entry', 'users.edit'),
('data_entry', 'users.upload_avatar'),
('data_entry', 'subjects.view'),
('data_entry', 'subjects.create'),
('data_entry', 'subjects.edit'),

('teacher', 'students.view'),
('student', 'terms.view')
on conflict do nothing;