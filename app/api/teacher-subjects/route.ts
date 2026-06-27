import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrPermission, getServiceClient } from '@/lib/server/auth'

// ──────────────────────────────────────────────────────────────
// app/api/teacher-subjects/route.ts
//
// GET ?teacherId=...  → قائمة subject_id المخصَّصة لمعلم معيّن
// PUT { teacherId, subjectIds: string[] } → استبدال كامل للقائمة
//   (أبسط من إضافة/حذف تراكمي — يطابق سلوك مودال اختيار متعدد)
// ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAdminOrPermission(req, 'create_teachers')
  if (!auth.ok) return auth.response

  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) {
      return NextResponse.json({ error: 'teacherId مطلوب.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('teacher_subjects')
      .select('subject_id')
      .eq('teacher_id', teacherId)

    if (error) {
      return NextResponse.json({ error: error.message || 'فشل جلب مواد المعلم.' }, { status: 500 })
    }

    return NextResponse.json({
      subjectIds: (data ?? []).map(r => r.subject_id),
    })
  } catch {
    return NextResponse.json({ error: 'خطأ غير متوقع.' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdminOrPermission(req, 'create_teachers')
  if (!auth.ok) return auth.response

  try {
    const supabase = getServiceClient()

    const body = (await req.json().catch(() => null)) as
      | { teacherId?: string; subjectIds?: string[] }
      | null

    if (!body?.teacherId || !Array.isArray(body.subjectIds)) {
      return NextResponse.json(
        { error: 'teacherId و subjectIds (مصفوفة) مطلوبان.' },
        { status: 400 },
      )
    }

    const { teacherId, subjectIds } = body

    // تحقق أن المستخدم المستهدف معلم فعلياً، لا أي مستخدم آخر
    const { data: teacherRow, error: teacherErr } = await supabase
      .from('users')
      .select('id, user_type, role')
      .eq('id', teacherId)
      .maybeSingle()

    if (teacherErr) {
      return NextResponse.json({ error: teacherErr.message }, { status: 500 })
    }
    if (!teacherRow || (teacherRow.user_type !== 'teacher' && teacherRow.role !== 'teacher')) {
      return NextResponse.json({ error: 'المستخدم المحدَّد ليس معلماً.' }, { status: 400 })
    }

    // استبدال كامل: حذف كل الصفوف الحالية، ثم إدراج الجديدة
    const { error: deleteErr } = await supabase
      .from('teacher_subjects')
      .delete()
      .eq('teacher_id', teacherId)

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message || 'فشل تحديث مواد المعلم.' }, { status: 500 })
    }

    if (subjectIds.length > 0) {
      const { error: insertErr } = await supabase.from('teacher_subjects').insert(
        subjectIds.map(subjectId => ({ teacher_id: teacherId, subject_id: subjectId })),
      )

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message || 'فشل حفظ المواد الجديدة.' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, subjectIds })
  } catch (err) {
    console.error('Teacher-subjects PUT error:', err)
    return NextResponse.json({ error: 'حدث خطأ أثناء حفظ مواد المعلم.' }, { status: 500 })
  }
}