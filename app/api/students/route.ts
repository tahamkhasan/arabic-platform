import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, requireUser } from '@/lib/server/auth'

type TeacherScope = {
  id: string
  stage: string | null
  grade: string | null
  track: string | null
}

type StudentRow = {
  id: string
  email: string | null
  full_name: string | null
  allowed_grades: string[] | null
  allowed_stages: string[] | null
  track: string | null
}

export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if (!auth.ok) return auth.response

  if (auth.user.role !== 'teacher' && auth.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'هذه النقطة مخصَّصة للمعلمين والأدمن فقط.' },
      { status: 403 },
    )
  }

  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim().toLowerCase() || ''

    if (auth.user.role === 'admin') {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, allowed_grades, allowed_stages')
        .eq('user_type', 'student')
        .eq('status', 'approved')
        .order('full_name', { ascending: true })

      if (error) {
        return NextResponse.json(
          { error: error.message || 'فشل جلب قائمة الطلاب.' },
          { status: 500 },
        )
      }

      let students = (data || []).map((row) => ({
        id: row.id,
        name: row.full_name || row.email || 'بدون اسم',
        email: row.email ?? null,
        allowed_grades: row.allowed_grades ?? [],
        allowed_stages: row.allowed_stages ?? [],
      }))

      if (search) {
        students = students.filter(
          (s) =>
            s.name.toLowerCase().includes(search) ||
            (s.email ?? '').toLowerCase().includes(search),
        )
      }

      return NextResponse.json({ students })
    }

    const teacherId = (auth.user as unknown as { id: string }).id
    const { data: scopes, error: scopesError } = await supabase
      .from('teacher_scopes')
      .select('id, stage, grade, track')
      .eq('teacher_id', teacherId)

    if (scopesError) {
      return NextResponse.json(
        { error: scopesError.message || 'فشل جلب نطاقات المعلم.' },
        { status: 500 },
      )
    }

    if (!scopes || scopes.length === 0) {
      return NextResponse.json({ students: [] })
    }

    const studentMap = new Map<
      string,
      {
        id: string
        name: string
        email: string | null
        allowed_grades: string[]
        allowed_stages: string[]
      }
    >()

    for (const scope of scopes as TeacherScope[]) {
      let studentsQuery = supabase
        .from('users')
        .select('id, email, full_name, allowed_grades, allowed_stages, track')
        .eq('user_type', 'student')
        .eq('status', 'approved')

      if (scope.stage) {
        studentsQuery = studentsQuery.contains('allowed_stages', [scope.stage])
      }

      if (scope.grade) {
        studentsQuery = studentsQuery.contains('allowed_grades', [scope.grade])
      }

      if (scope.track) {
        studentsQuery = studentsQuery.eq('track', scope.track)
      }

      const { data: matchedStudents, error: studentsError } = await studentsQuery

      if (studentsError) {
        return NextResponse.json(
          { error: studentsError.message || 'فشل جلب طلاب النطاق.' },
          { status: 500 },
        )
      }

      for (const row of (matchedStudents || []) as StudentRow[]) {
        studentMap.set(row.id, {
          id: row.id,
          name: row.full_name || row.email || 'بدون اسم',
          email: row.email ?? null,
          allowed_grades: row.allowed_grades ?? [],
          allowed_stages: row.allowed_stages ?? [],
        })
      }
    }

    let students = Array.from(studentMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'ar'),
    )

    if (search) {
      students = students.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          (s.email ?? '').toLowerCase().includes(search),
      )
    }

    return NextResponse.json({ students })
  } catch (err) {
    console.error('GET /api/students error:', err)
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع أثناء جلب الطلاب.' },
      { status: 500 },
    )
  }
}