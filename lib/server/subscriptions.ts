import { getServiceClient } from '@/lib/server/auth'

// lib/server/subscriptions.ts
// قلب نظام الاشتراك: حساب "المواد النهائية الفعلية" لطالب واحد.
//
// تعريف "الباقة" (مُصحَّح بناءً على توضيح فعلي): ليست قائمة مواد
// مُنتقاة يدوياً، بل تركيبة (stage, grade, track) محسوبة دائماً
// مباشرة من subject_offerings:
//   - بلا تشعيب (track=NULL على مستوى الباقة): كل مادة بنفس stage+grade
//   - بتشعيب: كل مادة بنفس stage+grade+نفس التشعيب، + كل مادة مشتركة
//     (offerings.track IS NULL) بنفس stage+grade
// أي مادة جديدة يضيفها المدير بهذه التركيبة تدخل الباقة فوراً تلقائياً.

export type SubscriptionRow = {
  id: string
  subscription_type: 'subject' | 'package'
  subject_id: string | null
  package_id: string | null
  stage: string
  grade: string
  track: string | null
  assigned_by: string | null
  assigned_at: string
  is_active: boolean
}

export type FinalSubject = {
  id: string
  name: string
  icon?: string | null
  via: 'subject' | 'package'
  via_package_id?: string | null
  // جديد — للبطاقات في واجهة الطالب
  teacherName: string | null
  unitsCount: number
}

/** يجلب اشتراكات الطالب النشطة فقط (is_active = true). */
export async function getActiveSubscriptions(studentId: string): Promise<SubscriptionRow[]> {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from('student_subscriptions')
    .select('*')
    .eq('student_id', studentId)
    .eq('is_active', true)

  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * يفكّ باقة واحدة (stage+grade+track) إلى معرّفات موادها الفعلية،
 * مباشرة من subject_offerings — لا جدول ربط ثابت. مُصدَّرة لإعادة
 * استخدامها في app/api/subject-packages (عرض محتوى الباقة للإدارة).
 */
export async function resolvePackageSubjectIds(
  stage: string,
  grade: string,
  track: string | null
): Promise<string[]> {
  const supabase = getServiceClient()

  let query = supabase
    .from('subject_offerings')
    .select('subject_id')
    .eq('stage', stage)
    .eq('grade', grade)

  if (track) {
    // بتشعيب: مواد هذا التشعيب + المواد المشتركة (track IS NULL) معاً
    query = query.or(`track.eq.${track},track.is.null`)
  } else {
    // بلا تشعيب: كل عروض هذا الصف (لن يوجد فيها أصلاً أي قيمة تشعيب)
    query = query.is('track', null)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return Array.from(new Set((data ?? []).map(r => r.subject_id as string)))
}

/**
 * الدالة الجوهرية: تحوّل اشتراكات الطالب (مواد مفردة + باقات) إلى
 * قائمة مواد نهائية فعلية، بلا أي تكرار — حتى لو كانت المادة مشمولة
 * في الباقة وأيضاً مُسنَدة منفردة في نفس الوقت.
 *
 * منطق إزالة التكرار: نبني Map بمفتاح subject_id؛ أول ظهور يُحدِّد
 * "via" المعروض في الإدارة، الظهورات اللاحقة لنفس المادة تُتجاهل.
 */
export async function getFinalSubjectsForStudent(studentId: string): Promise<FinalSubject[]> {
  const supabase = getServiceClient()
  const subscriptions = await getActiveSubscriptions(studentId)

  if (subscriptions.length === 0) return []

  const sourceMap = new Map<string, { via: 'subject' | 'package'; via_package_id?: string | null }>()

  // مواد مفردة أولاً
  for (const sub of subscriptions) {
    if (sub.subscription_type === 'subject' && sub.subject_id) {
      if (!sourceMap.has(sub.subject_id)) {
        sourceMap.set(sub.subject_id, { via: 'subject' })
      }
    }
  }

  // ثم الباقات — كل باقة تُفكّ مباشرة من subject_offerings
  for (const sub of subscriptions) {
    if (sub.subscription_type === 'package' && sub.package_id) {
      const subjectIds = await resolvePackageSubjectIds(sub.stage, sub.grade, sub.track)
      for (const subjectId of subjectIds) {
        if (!sourceMap.has(subjectId)) {
          sourceMap.set(subjectId, { via: 'package', via_package_id: sub.package_id })
        }
      }
    }
  }

  const allSubjectIds = Array.from(sourceMap.keys())
  if (allSubjectIds.length === 0) return []

  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('id, name, icon, created_by')
    .in('id', allSubjectIds)
    .eq('is_active', true)

  if (subjectsError) throw new Error(subjectsError.message)
  if (!subjects || subjects.length === 0) return []

  // اسم المعلم — مُستخرَج من subjects.created_by (الأقل كلفة، لا علاقة
  // معلم↔مادة منفصلة موجودة فعلياً في المشروع حتى الآن)
  const teacherIds = Array.from(
    new Set(subjects.map(s => s.created_by).filter((id): id is string => Boolean(id)))
  )
  const teacherNameById = new Map<string, string>()
  if (teacherIds.length > 0) {
    const { data: teachers } = await supabase
      .from('users')
      .select('id, full_name, name')
      .in('id', teacherIds)
    for (const t of teachers ?? []) {
      teacherNameById.set(t.id, t.full_name ?? t.name ?? '')
    }
  }

  // عدد الوحدات لكل مادة — استعلام منفصل لكل مادة (مقبول لعدد مواد طالب
  // محدود؛ يمكن تحويله لاستعلام group-by واحد لاحقاً إن لزم الأداء)
  const unitsCountById = new Map<string, number>()
  await Promise.all(
    subjects.map(async (s) => {
      const { count } = await supabase
        .from('units')
        .select('id', { count: 'exact', head: true })
        .eq('subject_id', s.id)
        .eq('is_active', true)
      unitsCountById.set(s.id, count ?? 0)
    })
  )

  return subjects.map(s => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    unitsCount: unitsCountById.get(s.id) ?? 0,
    teacherName: (s.created_by && teacherNameById.get(s.created_by)) || null,
    ...sourceMap.get(s.id)!,
  })) as FinalSubject[]
}

/**
 * هل هذه المادة بعينها متاحة للطالب فعلاً (مباشرة أو عبر باقة)؟
 * تُستخدَم قبل إسناد مادة مفردة، لتفادي صفّ مكرَّر بلا فائدة حقيقية.
 */
export async function isSubjectAlreadyCovered(studentId: string, subjectId: string): Promise<boolean> {
  const finalSubjects = await getFinalSubjectsForStudent(studentId)
  return finalSubjects.some(s => s.id === subjectId)
}