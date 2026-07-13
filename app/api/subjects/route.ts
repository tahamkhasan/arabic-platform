import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, getServiceClient } from '@/lib/server/auth'

type OfferingInput = { stage: string; grade: string; track?: string | null }

function validateOfferings(offerings: OfferingInput[]) {
  for (const o of offerings) {
    if (!o.stage || !o.grade) return 'كل عرض يجب أن يحتوي مرحلة وصفاً.'
    const needsTrack = o.grade === '11' || o.grade === '12'
    if (needsTrack && o.track !== 'scientific' && o.track !== 'literary')
      return 'الصفان ١١ و١٢ يتطلبان تحديد التشعيب (علمي/أدبي).'
    if (!needsTrack && o.track)
      return 'التشعيب يُسمح به فقط للصفين ١١ و١٢.'
  }
  return null
}

// ── إرفاق offerings[] لكل مادة ────────────────────────────────
async function attachOfferings<T extends { id: string }>(
  subjects: T[]
): Promise<(T & { offerings: OfferingInput[] })[]> {
  if (subjects.length === 0) return subjects as (T & { offerings: OfferingInput[] })[]
  const ids = subjects.map(s => s.id)
  const { data: offeringsRows } = await supabaseAdmin
    .from('subject_offerings')
    .select('subject_id, stage, grade, track')
    .in('subject_id', ids)
  const grouped: Record<string, OfferingInput[]> = {}
  for (const row of offeringsRows || []) {
    if (!grouped[row.subject_id]) grouped[row.subject_id] = []
    grouped[row.subject_id].push({ stage: row.stage, grade: row.grade, track: row.track })
  }
  return subjects.map(s => ({ ...s, offerings: grouped[s.id] || [] }))
}

// ── إرفاق اسم المعلم لكل مادة عبر teacher_subjects ────────────
// المعلم الأول المُعيَّن للمادة هو من يظهر في البطاقة.
async function attachTeachers<T extends { id: string }>(
  subjects: T[]
): Promise<(T & { teacherName: string | null })[]> {
  if (subjects.length === 0)
    return subjects.map(s => ({ ...s, teacherName: null }))

  const ids = subjects.map(s => s.id)

  const { data: teacherSubjects } = await supabaseAdmin
    .from('teacher_subjects')
    .select('subject_id, teacher_id')
    .in('subject_id', ids)

  if (!teacherSubjects || teacherSubjects.length === 0)
    return subjects.map(s => ({ ...s, teacherName: null }))

  const teacherIds = Array.from(new Set(teacherSubjects.map(ts => ts.teacher_id as string)))

  const { data: teachers } = await supabaseAdmin
    .from('users')
    .select('id, full_name, name')
    .in('id', teacherIds)

  const nameById = new Map<string, string>()
  for (const t of teachers ?? [])
    nameById.set(t.id, t.full_name ?? t.name ?? '')

  // subject_id → اسم أول معلم
  const subjectTeacher = new Map<string, string | null>()
  for (const ts of teacherSubjects) {
    if (!subjectTeacher.has(ts.subject_id))
      subjectTeacher.set(ts.subject_id, nameById.get(ts.teacher_id) ?? null)
  }

  return subjects.map(s => ({ ...s, teacherName: subjectTeacher.get(s.id) ?? null }))
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get('teacherId')
    const stages    = searchParams.get('stages')

    if (teacherId) {
      // ── مُعدَّل: المصدر الموحَّد الآن teacher_scopes (مرحلة+صف+مادة
      // محدَّدة من الأدمن)، بدل teacher_subjects القديم الذي لا يرتبط
      // بأي سياق مرحلة/صف — نفس المصدر المستخدَم في تبويب "إدارة
      // المادة" بصفحة المعلم، لضمان تطابق تام بين الصفحتين. ────────
      const { data: scopes, error: scopesError } = await supabaseAdmin
        .from('teacher_scopes')
        .select('subject_id')
        .eq('teacher_id', teacherId)
        .not('subject_id', 'is', null)

      if (scopesError)
        return NextResponse.json({ error: 'فشل جلب مواد المعلم.' }, { status: 500 })

      const subjectIds = Array.from(new Set((scopes || []).map(r => r.subject_id as string)))
      if (subjectIds.length === 0) return NextResponse.json({ subjects: [] })

      const { data: subjects, error: subjectsError } = await supabaseAdmin
        .from('subjects')
        .select('id, name, icon, grade, stage')
        .in('id', subjectIds)
        .order('name', { ascending: true })

      if (subjectsError)
        return NextResponse.json({ error: 'فشل جلب المواد.' }, { status: 500 })

      const withOfferings = await attachOfferings(subjects || [])
      const withTeachers  = await attachTeachers(withOfferings)
      return NextResponse.json({ subjects: withTeachers })
    }

    let query = supabaseAdmin
      .from('subjects')
      .select('id, name, icon, grade, stage')
      .order('name', { ascending: true })

    if (stages) {
      const stageList = stages.split(',').map(s => s.trim()).filter(Boolean)
      if (stageList.length > 0) query = query.in('stage', stageList)
    }

    const { data: subjects, error: subjectsError } = await query
    if (subjectsError)
      return NextResponse.json({ error: 'فشل جلب المواد.' }, { status: 500 })

    const withOfferings = await attachOfferings(subjects || [])
    const withTeachers  = await attachTeachers(withOfferings)
    return NextResponse.json({ subjects: withTeachers })
  } catch (err) {
    return NextResponse.json({ error: 'حدث خطأ غير متوقع.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const body = await req.json()
    const { name, description, content_overview, curriculum,
            teacher_intro_video_url, icon, is_active, offerings } = body as {
      name?: string; description?: string | null; content_overview?: string | null
      curriculum?: string | null; teacher_intro_video_url?: string | null
      icon?: string | null; is_active?: boolean; offerings?: OfferingInput[]
    }

    if (!name?.trim())
      return NextResponse.json({ error: 'اسم المادة مطلوب.' }, { status: 400 })
    if (!Array.isArray(offerings) || offerings.length === 0)
      return NextResponse.json({ error: 'أضف مرحلة وصفاً واحداً على الأقل.' }, { status: 400 })

    const validationError = validateOfferings(offerings)
    if (validationError)
      return NextResponse.json({ error: validationError }, { status: 400 })

    const supabase = getServiceClient()

    const { data: subject, error: insertError } = await supabase
      .from('subjects')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        content_overview: content_overview?.trim() || null,
        curriculum: curriculum?.trim() || null,
        teacher_intro_video_url: teacher_intro_video_url?.trim() || null,
        icon: icon || '📚',
        is_active: is_active !== false,
        stage: offerings[0].stage,
        grade: offerings[0].grade,
      })
      .select()
      .single()

    if (insertError || !subject)
      return NextResponse.json({ error: insertError?.message || 'فشل إنشاء المادة.' }, { status: 500 })

    const { error: offeringsError } = await supabase
      .from('subject_offerings')
      .insert(offerings.map(o => ({
        subject_id: subject.id,
        stage: o.stage,
        grade: o.grade,
        track: o.track || null,
      })))

    if (offeringsError)
      return NextResponse.json({ error: offeringsError.message }, { status: 500 })

    return NextResponse.json({ subject: { ...subject, offerings, teacherName: null } }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'حدث خطأ.' }, { status: 500 })
  }
}