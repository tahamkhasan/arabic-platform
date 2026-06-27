import { NextRequest, NextResponse } from 'next/server'
import { requireUser, getServiceClient } from '@/lib/server/auth'
import type { LessonNotePayload } from '@/types/lesson-note'

// app/api/lessons/[id]/notes/route.ts
// [id] هنا هو lesson_id — ملاحظة واحدة قابلة للتحديث لكل (lesson_id, student_id)
// خاصة تماماً: لا يراها المعلم ولا المدير، فقط الطالب صاحبها

type Context = {
  params: Promise<{ id: string }>
}

function mapNote(row: {
  id: string
  lesson_id: string
  student_id: string
  content: string
  updated_at: string | null
}) {
  return {
    id: row.id,
    lesson_id: row.lesson_id,
    student_id: row.student_id,
    content: row.content,
    updated_at: row.updated_at ?? null,
  }
}

function validateContent(content: unknown): string | null {
  if (typeof content !== 'string') {
    return 'نص الملاحظة مطلوب.'
  }
  if (content.length > 5000) {
    return 'الملاحظة طويلة جداً (الحد الأقصى 5000 حرف).'
  }
  return null
}

// ══════════════════════════════════════════════════════════════
// GET — ملاحظة الطالب الخاصة لهذا الدرس
// خاصة تماماً — requireUser فقط، ومحدود بـ role === 'student'
// ══════════════════════════════════════════════════════════════
export async function GET(req: NextRequest, context: Context) {
  const auth = await requireUser(req)
  if (!auth.ok) return auth.response

  if (auth.user.role !== 'student') {
    return NextResponse.json(
      { error: 'الملاحظات الخاصة متاحة للطلاب فقط.' },
      { status: 403 }
    )
  }

  try {
    const { id: lessonId } = await context.params
    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from('lesson_notes')
      .select('id, lesson_id, student_id, content, updated_at')
      .eq('lesson_id', lessonId)
      .eq('student_id', auth.user.userId)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({ note: data ? mapNote(data) : null })
  } catch (error: any) {
    console.error('GET /api/lessons/[id]/notes error:', error)
    return NextResponse.json({ note: null })
  }
}

// ══════════════════════════════════════════════════════════════
// PUT — إنشاء أو تعديل الملاحظة الخاصة (Upsert)
// المفتاح المركّب lesson_id+student_id يضمن ملاحظة واحدة فقط لكل طالب لكل درس
// ══════════════════════════════════════════════════════════════
export async function PUT(req: NextRequest, context: Context) {
  const auth = await requireUser(req)
  if (!auth.ok) return auth.response

  if (auth.user.role !== 'student') {
    return NextResponse.json(
      { error: 'الملاحظات الخاصة متاحة للطلاب فقط.' },
      { status: 403 }
    )
  }

  try {
    const { id: lessonId } = await context.params
    const body = (await req.json()) as LessonNotePayload

    const validationError = validateContent(body.content)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const supabase = getServiceClient()

    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id')
      .eq('id', lessonId)
      .maybeSingle()

    if (lessonError) throw lessonError
    if (!lesson) {
      return NextResponse.json({ error: 'الدرس غير موجود.' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('lesson_notes')
      .upsert(
        {
          lesson_id: lessonId,
          student_id: auth.user.userId,
          content: body.content,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'lesson_id,student_id' }
      )
      .select('id, lesson_id, student_id, content, updated_at')
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'فشل حفظ الملاحظة.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ note: mapNote(data) })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء حفظ الملاحظة.' },
      { status: 500 }
    )
  }
}

// ══════════════════════════════════════════════════════════════
// DELETE — حذف الملاحظة الخاصة
// ══════════════════════════════════════════════════════════════
export async function DELETE(req: NextRequest, context: Context) {
  const auth = await requireUser(req)
  if (!auth.ok) return auth.response

  if (auth.user.role !== 'student') {
    return NextResponse.json(
      { error: 'الملاحظات الخاصة متاحة للطلاب فقط.' },
      { status: 403 }
    )
  }

  try {
    const { id: lessonId } = await context.params
    const supabase = getServiceClient()

    const { error } = await supabase
      .from('lesson_notes')
      .delete()
      .eq('lesson_id', lessonId)
      .eq('student_id', auth.user.userId)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'فشل حذف الملاحظة.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع أثناء حذف الملاحظة.' },
      { status: 500 }
    )
  }
}