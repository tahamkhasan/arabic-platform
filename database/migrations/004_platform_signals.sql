-- ============================================================================
-- المرحلة 4 من خطة "منصة فائقة الذكاء": وضع التدخل للأدمن
-- ============================================================================
-- جدول واحد يخزّن إشارات مرصودة تلقائياً، بانتظار قرار الأدمن. لا فعل
-- تلقائي أبداً — فقط "حدث → تصنيف → قرار بشري". الأدمن يقرأ، يفهم
-- السياق، يختار: تجاهل (dismissed) أو تدخّل (action_taken بعد مراجعة
-- مسوّدة جاهزة في واجهة المنصة، لا في هذا الجدول نفسه).
--
-- لا نُعيد تعريف أي امتداد أو دالة موجودة فعلياً (pg_trgm، إلخ).
-- ============================================================================

create table if not exists platform_signals (
  id uuid primary key default gen_random_uuid(),

  signal_type text not null check (signal_type in (
    'student_struggling',      -- طالبان+ بنفس الخلل في فصل (موروث من insights)
    'teacher_slow_response'    -- معلم بمعدل استجابة أبطأ من المتوسط العام
  )),
  severity text not null default 'warning' check (severity in ('info', 'warning', 'critical')),

  -- الكيان المتعلق بالإشارة — قد يكون فصلاً (student_struggling) أو
  -- معلماً (teacher_slow_response). subject_type يحدد كيف نقرأ subject_id
  subject_id uuid not null,
  subject_type text not null check (subject_type in ('class', 'teacher')),

  -- بيانات داعمة كاملة بصيغة jsonb — تختلف بنيتها حسب signal_type،
  -- تُقرَأ وتُعرَض في واجهة الأدمن دون استعلامات إضافية معقَّدة
  evidence jsonb not null default '{}'::jsonb,

  status text not null default 'pending' check (status in ('pending', 'dismissed', 'action_taken')),
  resolved_by uuid references users(id) on delete set null,
  resolved_at timestamptz,

  -- منع تكرار نفس الإشارة بالضبط (نفس النوع + نفس الكيان) إن كانت
  -- لا تزال pending — يُحدَّث evidence فقط بدل صف جديد كل مرة
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_platform_signals_status
  on platform_signals(status)
  where status = 'pending';

create index if not exists idx_platform_signals_subject
  on platform_signals(subject_type, subject_id);

comment on table platform_signals is
  'إشارات مرصودة تلقائياً (طلابية أو على مستوى معلم) بانتظار قرار الأدمن — لا فعل تلقائي، فقط رصد ثم قرار بشري عبر واجهة الأدمن.';

-- ----------------------------------------------------------------------------
-- دالة: حساب متوسط زمن استجابة كل معلم (بالساعات) لتصحيح الأسئلة
-- المقالية (essay) المُصحَّحة يدوياً فعلياً (graded_at موجود)
-- ----------------------------------------------------------------------------
create or replace function get_teacher_response_times()
returns table (
  teacher_id uuid,
  avg_response_hours numeric,
  graded_count integer
) as $$
begin
  return query
  select
    qz.teacher_id,
    round(avg(
      extract(epoch from (
        (ev.value->>'graded_at')::timestamptz - qa.submitted_at
      )) / 3600.0
    )::numeric, 2) as avg_response_hours,
    count(*)::integer as graded_count
  from quiz_attempts qa
  join quizzes qz on qz.id = qa.quiz_id
  cross join lateral jsonb_each(qa.evaluations) as ev(key, value)
  where qa.submitted_at is not null
    and ev.value->>'graded_at' is not null
    and ev.value->>'graded_by' is not null
    and (ev.value->>'manually_graded')::boolean is true -- استثناء صريح لأي تصحيح تلقائي قد يحمل الحقول بالخطأ
  group by qz.teacher_id
  having count(*) >= 2; -- عيّنة كافية فقط، لا حكم على معلم بسؤال واحد
end;
$$ language plpgsql stable;

comment on function get_teacher_response_times() is
  'متوسط زمن استجابة كل معلم (بالساعات) لتصحيح الأسئلة المقالية المصحَّحة يدوياً فعلياً، بعيّنة 2 أسئلة على الأقل.';
