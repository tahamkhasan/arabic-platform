import { NextRequest, NextResponse } from 'next/server'
import { requireUser, getServiceClient } from '@/lib/server/auth'
import type { LessonCommentPayload } from '@/types/lesson-comment'

// app/api/lessons/[id]/comments/route.ts
// [id] هنا هو lesson_id

type Context = {
  params: Promise<{ id: string }>
}

function mapComment(row: any) {
  return {
    id: row.id,
    lesson_id: row.lesson_id,
    student_id: row.student_id,
    student_name: row.student?.name ?? null,
    content: row.content,
    created_at: row.created_at ?? null,
  }
}

function validateContent(content: unknown): string | null {
  if (typeof content !== 'string' || !content.trim()) {
    return 'نص التعليق مطلوب.'
  }
  if (content.trim().length > 2000) {
    return 'التعليق طويل جداً (الحد الأقصى 2000 حرف).'
  }
  return null
}

// ══════════════════════════════════════════════════════════════
// GET — جلب تعليقات الدرس
// المعلم/المدير: كل التعليقات + اسم الطالب
// الطالب: تعليقاته الخاصة فقط (لا يرى تعليقات زملائه)
// ══════════════════════════════════════════════════════════════
export async function GET(req: NextRequest, context: Context) {
  const auth = await requireUser(req)
  if (!auth.ok) return auth.response

  try {
    const { id: lessonId } = await context.params
    const supabase = getServiceClient()
    const isStaff = auth.user.role === 'admin' || auth.user.role === 'teacher'

    let query = supabase
      .from('lesson_comments')
      .select('id, lesson_id, student_id, content, created_at, student:users(name)')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: true })

    if (!isStaff) {
      query = query.eq('student_id', auth.user.userId)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ items: (data || []).map(mapComment) })
  } catch (error: any) {
    console.error('GET /api/lessons/[id]/comments error:', error)
    return NextResponse.json({ items: [] })
  }
}

// ══════════════════════════════════════════════════════════════
// POST — إضافة تعليق (الطالب فقط — student_id من التوكن لا من body)
// ══════════════════════════════════════════════════════════════
export async function POST(req: NextRequest, context: Context) {
  const auth = await requireUser(req)
  if (!auth.ok) return auth.response

  if (auth.user.role !== 'student') {
    return NextResponse.json(
      { error: 'إضافة التعليقات متاحة للطلاب فقط.' },
      { status: 403 }
    )
  }

  try {
    const { id: lessonId } = await context.params
    const body = (await req.json()) as LessonCommentPayload

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
      .from('lesson_comments')
      .insert({
        lesson_id: lessonId,
        student_id: auth.user.userId,
        content: body.content.trim(),
      })
      .select('id, lesson_id, student_id, content, created_at, student:users(name)')
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'فشل إضافة التعليق.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ item: mapComment(data) }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء إضافة التعليق.' },
      { status: 500 }
    )
  }
}