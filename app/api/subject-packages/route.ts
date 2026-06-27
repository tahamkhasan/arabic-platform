import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, requireAdminOrPermission } from '@/lib/server/auth'
import { resolvePackageSubjectIds } from '@/lib/server/subscriptions'

const VALID_STAGES = ['primary', 'middle', 'secondary']
const VALID_TRACKS = ['scientific', 'literary']

// GET /api/subject-packages?stage=&grade=&track=&includeInactive=true
// عام — يُستخدَم في واجهة الإدارة (لائحة الباقات) وفي اختيار باقة لطالب
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const stage = searchParams.get('stage')
    const grade = searchParams.get('grade')
    const track = searchParams.get('track')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const supabase = getServiceClient()
    let query = supabase.from('subject_packages').select('*').order('created_at', { ascending: false })

    if (!includeInactive) query = query.eq('is_active', true)
    if (stage) query = query.eq('stage', stage)
    if (grade) query = query.eq('grade', grade)
    if (track) query = query.eq('track', track)

    const { data: packages, error } = await query
    if (error) throw error

    if (!packages || packages.length === 0) {
      return NextResponse.json({ items: [] })
    }

    // محتوى كل باقة يُحسَب مباشرة من subject_offerings — حيّ دائماً،
    // لا قائمة مُجمَّدة وقت الإنشاء
    const items = await Promise.all(
      packages.map(async (pkg) => {
        const subjectIds = await resolvePackageSubjectIds(pkg.stage, pkg.grade, pkg.track)
        if (subjectIds.length === 0) return { ...pkg, subjects: [] }

        const { data: subjects } = await supabase
          .from('subjects')
          .select('id, name, icon')
          .in('id', subjectIds)
          .eq('is_active', true)

        return { ...pkg, subjects: subjects ?? [] }
      })
    )

    return NextResponse.json({ items })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/subject-packages — إنشاء باقة جديدة مع موادها دفعة واحدة
export async function POST(req: NextRequest) {
  const auth = await requireAdminOrPermission(req, 'manage_subscriptions')
  if (!auth.ok) return auth.response

  try {
    const body = await req.json()
    const { name, stage, grade, track, description } = body

    if (!name?.trim() || !stage || !grade) {
      return NextResponse.json({ error: 'الاسم والمرحلة والصف مطلوبة.' }, { status: 400 })
    }
    if (!VALID_STAGES.includes(stage)) {
      return NextResponse.json({ error: 'قيمة المرحلة غير صالحة.' }, { status: 400 })
    }
    if (track && !VALID_TRACKS.includes(track)) {
      return NextResponse.json({ error: 'قيمة التشعيب غير صالحة.' }, { status: 400 })
    }
    if (track && grade !== '11' && grade !== '12') {
      return NextResponse.json({ error: 'التشعيب لا يُسمح به إلا للصفين 11 و12.' }, { status: 400 })
    }

    const supabase = getServiceClient()

    const { data: pkg, error: pkgError } = await supabase
      .from('subject_packages')
      .insert({
        name: name.trim(),
        stage,
        grade,
        track: track ?? null,
        description: description?.trim() || null,
        created_by: auth.user.userId,
      })
      .select()
      .single()

    if (pkgError || !pkg) {
      return NextResponse.json({ error: pkgError?.message || 'فشل إنشاء الباقة.' }, { status: 500 })
    }

    // محتوى الباقة يُحسَب فوراً من subject_offerings — لا إدخال يدوي
    const subjectIds = await resolvePackageSubjectIds(stage, grade, track ?? null)

    return NextResponse.json({ item: { ...pkg, subjectsCount: subjectIds.length } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}