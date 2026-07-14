import { getServiceClient } from '@/lib/server/auth'

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
  teacherName: string | null
  unitsCount: number
}

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
    query = query.or(`track.eq.${track},track.is.null`)
  } else {
    query = query.is('track', null)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return Array.from(new Set((data ?? []).map(r => r.subject_id as string)))
}

export async function getFinalSubjectsForStudent(studentId: string): Promise<FinalSubject[]> {
  const supabase = getServiceClient()
  const subscriptions = await getActiveSubscriptions(studentId)

  if (subscriptions.length === 0) return []

  const sourceMap = new Map<string, { via: 'subject' | 'package'; via_package_id?: string | null }>()

  for (const sub of subscriptions) {
    if (sub.subject_id) {
      if (!sourceMap.has(sub.subject_id)) {
        sourceMap.set(sub.subject_id, {
          via: sub.subscription_type === 'package' ? 'package' : 'subject',
          via_package_id: sub.package_id ?? null,
        })
      }
    }
  }

  for (const sub of subscriptions) {
    if (sub.subscription_type === 'package' && !sub.subject_id) {
      const subjectIds = await resolvePackageSubjectIds(sub.stage, sub.grade, sub.track)

      for (const subjectId of subjectIds) {
        if (!sourceMap.has(subjectId)) {
          sourceMap.set(subjectId, {
            via: 'package',
            via_package_id: sub.package_id ?? null,
          })
        }
      }
    }
  }

  const allSubjectIds = Array.from(sourceMap.keys())
  if (allSubjectIds.length === 0) return []

  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('id, name, icon')
    .in('id', allSubjectIds)
    .eq('is_active', true)

  if (subjectsError) throw new Error(subjectsError.message)
  if (!subjects || subjects.length === 0) return []

  const { data: teacherSubjects } = await supabase
    .from('teacher_subjects')
    .select('subject_id, teacher_id')
    .in('subject_id', allSubjectIds)

  const teacherIds = Array.from(
    new Set((teacherSubjects ?? []).map(ts => ts.teacher_id as string))
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

  const subjectTeacher = new Map<string, string | null>()
  for (const ts of teacherSubjects ?? []) {
    if (!subjectTeacher.has(ts.subject_id)) {
      subjectTeacher.set(ts.subject_id, teacherNameById.get(ts.teacher_id) ?? null)
    }
  }

  const unitsCountById = new Map<string, number>()
  await Promise.all(
    subjects.map(async s => {
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
    teacherName: subjectTeacher.get(s.id) ?? null,
    ...sourceMap.get(s.id)!,
  })) as FinalSubject[]
}

export async function isSubjectAlreadyCovered(studentId: string, subjectId: string): Promise<boolean> {
  const finalSubjects = await getFinalSubjectsForStudent(studentId)
  return finalSubjects.some(s => s.id === subjectId)
}