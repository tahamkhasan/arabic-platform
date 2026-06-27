-- ══════════════════════════════════════════════════════════════
-- supabase/migrations/005_subject_subscriptions.sql
-- نظام اشتراك الطالب في المواد: مادة مفردة أو باقة كاملة
-- يبني فوق فلترة stage/grade/track الحالية، لا يستبدلها.
-- القيم الحرفية لـstage/track تطابق lib/constants/stages.ts تماماً
-- (primary/middle/secondary، scientific/literary) — لا قيم عربية،
-- تجنّباً لتكرار خلل "ثانوي" الذي صحّحناه في المراحل السابقة.
-- ══════════════════════════════════════════════════════════════

-- ── ١) الباقات ──────────────────────────────────────────────
-- باقة = تجميعة مواد لصف/تشعيب محدَّد (مثال: "باقة الحادي عشر أدبي كاملة")
CREATE TABLE IF NOT EXISTS public.subject_packages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  stage       TEXT NOT NULL,
  grade       TEXT NOT NULL,
  track       TEXT,                              -- NULL إن لم يكن الصف 11/12
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_by  UUID REFERENCES public.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_packages_stage CHECK (stage IN ('primary','middle','secondary')),
  CONSTRAINT chk_packages_track CHECK (track IS NULL OR track IN ('scientific','literary')),
  -- التشعيب لا معنى له خارج الصفين 11/12 — يمنع إنشاء باقة متناقضة من جذرها
  CONSTRAINT chk_packages_track_grade CHECK (track IS NULL OR grade IN ('11','12'))
);

COMMENT ON TABLE public.subject_packages IS
  'باقة مواد جاهزة لصف/تشعيب محدَّد، تُسنَد للطالب دفعة واحدة بدل كل مادة منفردة.';

-- ── ٢) ربط الباقة بموادها (Many-to-Many) ────────────────────
CREATE TABLE IF NOT EXISTS public.subject_package_items (
  package_id UUID NOT NULL REFERENCES public.subject_packages(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (package_id, subject_id)
);

COMMENT ON TABLE public.subject_package_items IS
  'جدول ربط — أي مادة تنتمي لأي باقة. مفتاح مركّب يمنع تكرار المادة في الباقة نفسها تلقائياً.';

CREATE INDEX IF NOT EXISTS idx_package_items_subject
  ON public.subject_package_items(subject_id);

-- ── ٣) اشتراكات الطالب الفعلية ───────────────────────────────
-- صف واحد = اشتراك واحد، بنوع واحد فقط: مادة مفردة أو باقة (لا كلاهما معاً)
CREATE TABLE IF NOT EXISTS public.student_subscriptions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_type  TEXT NOT NULL CHECK (subscription_type IN ('subject','package')),
  subject_id         UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  package_id         UUID REFERENCES public.subject_packages(id) ON DELETE CASCADE,

  -- تُخزَّن صراحة لتسهيل الفلترة المباشرة بلا حاجة لـJOIN دائم،
  -- ولرصد أي تعارض مستقبلي بين اشتراك الطالب وصفّه الفعلي في users
  stage TEXT NOT NULL,
  grade TEXT NOT NULL,
  track TEXT,

  assigned_by UUID REFERENCES public.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active   BOOLEAN NOT NULL DEFAULT true,

  -- يمنع وجود subject_id وpackage_id معاً، أو غيابهما معاً
  CONSTRAINT chk_sub_type_matches_fk CHECK (
    (subscription_type = 'subject' AND subject_id IS NOT NULL AND package_id IS NULL)
    OR
    (subscription_type = 'package' AND package_id IS NOT NULL AND subject_id IS NULL)
  ),
  CONSTRAINT chk_subs_stage CHECK (stage IN ('primary','middle','secondary')),
  CONSTRAINT chk_subs_track CHECK (track IS NULL OR track IN ('scientific','literary')),
  CONSTRAINT chk_subs_track_grade CHECK (track IS NULL OR grade IN ('11','12'))
);

COMMENT ON TABLE public.student_subscriptions IS
  'اشتراك فعلي واحد لكل صف — مادة مفردة أو باقة. عدة صفوف نشطة لنفس الطالب مسموحة (مثال: باقة + مادة إضافية فوقها)، لكن لا تكرار لنفس المادة أو نفس الباقة (مفروض بالفهارس الفريدة أدناه).';

-- يمنع التكرار: نفس الطالب + نفس المادة، بشرط كونه نشطاً (يسمح بإعادة الاشتراك بعد الإلغاء)
CREATE UNIQUE INDEX IF NOT EXISTS uq_subs_active_subject
  ON public.student_subscriptions(student_id, subject_id)
  WHERE subscription_type = 'subject' AND is_active = true;

-- يمنع التكرار: نفس الطالب + نفس الباقة، بشرط كونه نشطاً
CREATE UNIQUE INDEX IF NOT EXISTS uq_subs_active_package
  ON public.student_subscriptions(student_id, package_id)
  WHERE subscription_type = 'package' AND is_active = true;

-- الاستعلام الأكثر تكراراً: "اشتراكات هذا الطالب النشطة" — فهرس مباشر له
CREATE INDEX IF NOT EXISTS idx_subs_student_active
  ON public.student_subscriptions(student_id)
  WHERE is_active = true;

-- ══════════════════════════════════════════════════════════════
-- ملخص القرارات (للمراجعة لا للتنفيذ):
-- • subject_packages: مصدر تعريف الباقة (الاسم + موادها عبر الجدول الثاني).
-- • subject_package_items: العلاقة الفعلية، مفتاحها المركّب يمنع تكرار
--   مادة داخل نفس الباقة تلقائياً دون الحاجة لقيد إضافي.
-- • student_subscriptions: سجل الأحداث الفعلي — كل إسناد/إزالة صفّ مستقل،
--   is_active=false عند "الإزالة" يحافظ على السجل التاريخي (Audit) بدل
--   حذفه فعلياً؛ "استبدال" يعني عملياً: تعطيل القديم + إنشاء جديد.
-- ══════════════════════════════════════════════════════════════
