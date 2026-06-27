-- ════════════════════════════════════════════════════════════
-- 1) جدول الربط بين المعلم والمواد المخصَّصة له
-- ════════════════════════════════════════════════════════════
create table if not exists teacher_subjects (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references users(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (teacher_id, subject_id)
);

create index if not exists idx_teacher_subjects_teacher_id on teacher_subjects(teacher_id);
create index if not exists idx_teacher_subjects_subject_id on teacher_subjects(subject_id);

-- ════════════════════════════════════════════════════════════
-- 2) صلاحية جديدة: create_teachers — لمن يحق له إضافة/إدارة المعلمين
-- تُضاف فقط إلى صلاحيات الأدوار الموجودة فعلياً (مثل "مدير" أو "مشرف")
-- التي يحددها الأدمن بنفسه من جدول roles — هذا الاستعلام لا يضيف
-- دوراً جديداً، فقط يوسّع صلاحيات دور موجود مسبقاً عند الحاجة.
-- مثال: لإعطاء دور بمفتاح 'supervisor' هذه الصلاحية:
-- ════════════════════════════════════════════════════════════

-- تحقق أولاً من الأدوار الموجودة فعلياً وصلاحياتها الحالية:
-- select id, key, name, permissions from roles;

-- ثم لإضافة create_teachers لدور معيّن (استبدل 'supervisor' بالمفتاح الفعلي):
-- update roles
-- set permissions = array_append(permissions, 'create_teachers')
-- where key = 'supervisor'
--   and not ('create_teachers' = any(permissions));
