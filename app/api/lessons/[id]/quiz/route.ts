import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, getServiceClient } from '@/lib/server/auth'
import type { LessonQuizPayload, QuizQuestion } from '@/types/lesson-quiz'

// app/api/lessons/[id]/quiz/route.ts
// اختبار واحد لكل درس — [id] هنا هو lesson_id

type Context = {
  params: Promise<{ id: string }>
}

type LessonQuizRow = {
  id: string
  lesson_id: string
  title: string | null
  questions: unknown
  created_at: string | null
  updated_at: string | null
}

function mapQuiz(row: LessonQuizRow) {
  return {
    id: row.id,
    lesson_id: row.lesson_id,
    title: row.title ?? null,
    questions: Array.isArray(row.questions) ? (row.questions as QuizQuestion[]) : [],
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  }
}

// ── تحقق صارم من بنية الأسئلة قبل أي كتابة في القاعدة ───────────
function validateQuestions(questions: unknown): string | null {
  if (!Array.isArray(questions) || questions.length === 0) {
    return 'يجب أن يحتوي الاختبار على سؤال واحد على الأقل.'
  }

  for (let i = 0; i < questions.length; i++) {
    const item = questions[i] as Partial<QuizQuestion>
    const label = `السؤال رقم ${i + 1}`

    if (typeof item.id !== 'number') {
      return `${label}: حقل id مطلوب ويجب أن يكون رقماً.`
    }
    if (item.type !== 'multiple' && item.type !== 'truefalse' && item.type !== 'fill') {
      return `${label}: نوع السؤال غير صالح (multiple | truefalse | fill).`
    }
    if (!item.question?.trim()) {
      return `${label}: نص السؤال مطلوب.`
    }
    if (!item.explanation?.trim()) {
      return `${label}: شرح الإجابة مطلوب.`
    }

    if (item.type === 'multiple') {
      if (!Array.isArray(item.options) || item.options.length < 2) {
        return `${label}: الاختيار المتعدد يتطلب خيارين على الأقل.`
      }
      if (
        typeof item.correct !== 'number' ||
        item.correct < 0 ||
        item.correct >= item.options.length
      ) {
        return `${label}: قيمة الإجابة الصحيحة (correct) غير صالحة لهذا السؤال.`
      }
    }

    if (item.type === 'truefalse' && typeof item.correct !== 'boolean') {
      return `${label}: صح/خطأ يتطلب correct بقيمة true أو false.`
    }

    if (
      item.type === 'fill' &&
      (typeof item.correct !== 'string' || !item.correct.trim())
    ) {
      return `${label}: التكملة تتطلب correct نصياً غير فارغ.`
    }
  }

  return null
}

// ══════════════════════════════════════════════════════════════
// GET — جلب اختبار الدرس (عام، بلا حماية — يقرأه الطالب والمعلم)
// يُرجع { quiz: null } إن لم يُنشأ اختبار لهذا الدرس بعد
// ══════════════════════════════════════════════════════════════
export async function GET(_req: NextRequest, context: Context) {
  try {
    const { id: lessonId } = await context.params

    const { data, error } = await supabaseAdmin
      .from('lesson_quizzes')
      .select('id, lesson_id, title, questions, created_at, updated_at')
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({ quiz: data ? mapQuiz(data) : null })
  } catch (error: any) {
    console.error('GET /api/lessons/[id]/quiz error:', error)
    return NextResponse.json({ quiz: null })
  }
}

// ══════════════════════════════════════════════════════════════
// PUT — إنشاء أو تعديل اختبار الدرس (Upsert — محمي بـ requireAdmin)
// يطابق قيد UNIQUE(lesson_id) في القاعدة: اختبار واحد لكل درس
// ══════════════════════════════════════════════════════════════
export async function PUT(req: NextRequest, context: Context) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const { id: lessonId } = await context.params
    const body = (await req.json()) as LessonQuizPayload

    const validationError = validateQuestions(body.questions)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const supabase = getServiceClient()

    // تأكيد وجود الدرس قبل ربط اختبار به
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
      .from('lesson_quizzes')
      .upsert(
        {
          lesson_id: lessonId,
          title: body.title?.trim() || null,
          questions: body.questions,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'lesson_id' }
      )
      .select('id, lesson_id, title, questions, created_at, updated_at')
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'فشل حفظ اختبار الدرس.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ quiz: mapQuiz(data) })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء حفظ اختبار الدرس.' },
      { status: 500 }
    )
  }
}

// ══════════════════════════════════════════════════════════════
// DELETE — حذف اختبار الدرس (محمي بـ requireAdmin)
// ══════════════════════════════════════════════════════════════
export async function DELETE(req: NextRequest, context: Context) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const { id: lessonId } = await context.params
    const supabase = getServiceClient()

    const { error } = await supabase
      .from('lesson_quizzes')
      .delete()
      .eq('lesson_id', lessonId)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'فشل حذف اختبار الدرس.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع أثناء حذف اختبار الدرس.' },
      { status: 500 }
    )
  }
}