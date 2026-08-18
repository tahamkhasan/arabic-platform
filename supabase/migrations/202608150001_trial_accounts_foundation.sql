begin;

create extension if not exists pgcrypto;

-- 1) توسيع حساب المستخدم دون تعديل مسار الطالب الحالي
alter table public.users
  add column if not exists account_mode text not null default 'independent',
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz;

alter table public.users
  drop constraint if exists chk_users_account_mode;

alter table public.users
  add constraint chk_users_account_mode
  check (account_mode in ('independent', 'school'));

comment on column public.users.account_mode is
  'نمط الحساب: مستقل أو مرتبط بمدرسة';

comment on column public.users.trial_started_at is
  'بداية فترة الحساب التجريبي عند وجودها';

comment on column public.users.trial_ends_at is
  'نهاية فترة الحساب التجريبي عند وجودها';

create index if not exists idx_users_account_mode
  on public.users (account_mode);

create index if not exists idx_users_trial_ends_at
  on public.users (trial_ends_at)
  where trial_ends_at is not null;

-- 2) خطط المنصة العامة
create table if not exists public.account_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  target_type text not null,
  billing_period text not null default 'monthly',
  price numeric(10, 3) not null default 0,
  currency text not null default 'KWD',
  limits jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_account_plans_target_type
    check (target_type in ('teacher', 'student', 'school')),
  constraint chk_account_plans_billing_period
    check (billing_period in ('trial', 'monthly', 'yearly', 'custom')),
  constraint chk_account_plans_price
    check (price >= 0)
);

create unique index if not exists uq_account_plans_code_lower
  on public.account_plans (lower(code));

-- 3) الاشتراكات العامة للحسابات والمدارس
create table if not exists public.account_subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null,
  owner_user_id uuid references public.users(id) on delete cascade,
  owner_school_id uuid,
  plan_id uuid not null references public.account_plans(id),
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  approved_by uuid references public.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_account_subscriptions_owner_type
    check (owner_type in ('user', 'school')),
  constraint chk_account_subscriptions_status
    check (status in ('active', 'expired', 'cancelled', 'suspended')),
  constraint chk_account_subscriptions_owner
    check (
      (owner_type = 'user' and owner_user_id is not null and owner_school_id is null)
      or
      (owner_type = 'school' and owner_school_id is not null and owner_user_id is null)
    ),
  constraint chk_account_subscriptions_dates
    check (ends_at is null or ends_at > starts_at)
);

create index if not exists idx_account_subscriptions_user_active
  on public.account_subscriptions (owner_user_id, status, ends_at)
  where owner_user_id is not null;

-- ملاحظة: owner_school_id جاهز للمستقبل، ويرتبط بجدول schools عند إنشاء طبقة المدرسة.
-- لذلك لا يوضع foreign key له في هذه المرحلة.

-- 4) سجل الاستهلاك لكل ميزة
create table if not exists public.account_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  subscription_id uuid references public.account_subscriptions(id) on delete set null,
  feature_key text not null,
  quantity integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint chk_account_usage_quantity check (quantity > 0)
);

create index if not exists idx_account_usage_user_feature_created
  on public.account_usage (user_id, feature_key, created_at desc);

-- 5) طلبات ترقية الحساب
create table if not exists public.upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  requested_plan_id uuid references public.account_plans(id) on delete set null,
  status text not null default 'pending',
  message text,
  admin_note text,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_upgrade_requests_status
    check (status in ('pending', 'approved', 'rejected', 'cancelled'))
);

create index if not exists idx_upgrade_requests_user_status
  on public.upgrade_requests (user_id, status, created_at desc);

create unique index if not exists uq_upgrade_requests_open_per_user
  on public.upgrade_requests (user_id)
  where status = 'pending';

-- 6) تحديث updated_at تلقائيًا
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_account_plans_updated_at on public.account_plans;
create trigger trg_account_plans_updated_at
before update on public.account_plans
for each row execute function public.set_updated_at();

drop trigger if exists trg_account_subscriptions_updated_at on public.account_subscriptions;
create trigger trg_account_subscriptions_updated_at
before update on public.account_subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists trg_upgrade_requests_updated_at on public.upgrade_requests;
create trigger trg_upgrade_requests_updated_at
before update on public.upgrade_requests
for each row execute function public.set_updated_at();

-- 7) خطة تجربة المعلم الافتراضية
insert into public.account_plans (
  code,
  name,
  description,
  target_type,
  billing_period,
  price,
  currency,
  limits,
  is_active
)
values (
  'teacher_trial',
  'تجربة المعلم',
  'تجربة محدودة للمعلم المستقل: رفع درس وتجربة مخرجات محددة.',
  'teacher',
  'trial',
  0,
  'KWD',
  jsonb_build_object(
    'trial_days', 7,
    'max_materials', 1,
    'max_generations', 3,
    'allowed_output_types',
    jsonb_build_array('lesson_plan', 'short_quiz', 'class_activity')
  ),
  true
)
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  target_type = excluded.target_type,
  billing_period = excluded.billing_period,
  price = excluded.price,
  currency = excluded.currency,
  limits = excluded.limits,
  is_active = excluded.is_active,
  updated_at = now();

-- 8) سياسات RLS
alter table public.account_plans enable row level security;
alter table public.account_subscriptions enable row level security;
alter table public.account_usage enable row level security;
alter table public.upgrade_requests enable row level security;

drop policy if exists account_plans_read_active on public.account_plans;
create policy account_plans_read_active
on public.account_plans
for select
to authenticated
using (is_active = true or public.isadmin());

drop policy if exists account_plans_admin_write on public.account_plans;
create policy account_plans_admin_write
on public.account_plans
for all
to authenticated
using (public.isadmin())
with check (public.isadmin());

drop policy if exists account_subscriptions_read_own_or_admin on public.account_subscriptions;
create policy account_subscriptions_read_own_or_admin
on public.account_subscriptions
for select
to authenticated
using (owner_user_id = auth.uid() or public.isadmin());

drop policy if exists account_subscriptions_admin_write on public.account_subscriptions;
create policy account_subscriptions_admin_write
on public.account_subscriptions
for all
to authenticated
using (public.isadmin())
with check (public.isadmin());

drop policy if exists account_usage_read_own_or_admin on public.account_usage;
create policy account_usage_read_own_or_admin
on public.account_usage
for select
to authenticated
using (user_id = auth.uid() or public.isadmin());

drop policy if exists account_usage_admin_write on public.account_usage;
create policy account_usage_admin_write
on public.account_usage
for all
to authenticated
using (public.isadmin())
with check (public.isadmin());

drop policy if exists upgrade_requests_read_own_or_admin on public.upgrade_requests;
create policy upgrade_requests_read_own_or_admin
on public.upgrade_requests
for select
to authenticated
using (user_id = auth.uid() or public.isadmin());

drop policy if exists upgrade_requests_insert_own on public.upgrade_requests;
create policy upgrade_requests_insert_own
on public.upgrade_requests
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists upgrade_requests_update_admin_only on public.upgrade_requests;
create policy upgrade_requests_update_admin_only
on public.upgrade_requests
for update
to authenticated
using (public.isadmin())
with check (public.isadmin());

commit;