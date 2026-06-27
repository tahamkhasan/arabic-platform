import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'

// ──────────────────────────────────────────────────────────────
// app/api/quizzes/[id]/attempts/[attemptId]/grade/route.ts (جديد)
//
// PATCH: يسمح للمعلم بإدخال/تعديل درجة سؤال مقالي (أو أي سؤال
// بحالة needs_ai_review) داخل محاولة طالب معينة، بعد التسليم.
// يُعدِّل evaluations[questionId] في quiz_attempts، ويُعيد حساب
// score الإجمالي للمحاولة بناءً على كل الدرجات (المصحَّحة تلقائياً
// + المصحَّحة يدوياً الآن).
// ──────────────────────────────────────────────────────────────

const gradeSchema = z.object({
  question_id: z.string().uuid('معرّف السؤال غير صالح'),
  score: z.number().min(0, 'الدرجة لا يمكن أن تكون سالبة'),
  feedback: z.string().max(1000).optional(),
})

async function getUser(token: string) {
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return null
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('id, role, status')
    .eq('id', user.id)
    .single()
  if (!userData || userData.status !== 'approved') return null
  return userData
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; attemptId: string }> }
) {
  const { id: quizId, attemptId } = await params

  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const userData = await getUser(token)
  if (!userData) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  if (userData.role !== 'teacher' && userData.role !== 'admin') {
    return NextResponse.json({ error: 'فقط المعلمون يمكنهم تصحيح الإجابات' }, { status: 403 })
  }

  try {
    // تحقق من ملكية الاختبار
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .select('id, teacher_id')
      .eq('id', quizId)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: 'الاختبار غير موجود' }, { status: 404 })
    }
    if (quiz.teacher_id !== userData.id && userData.role !== 'admin') {
      return NextResponse.json({ error: 'ليس اختبارك' }, { status: 403 })
    }

    const body = await req.json()
    const validation = gradeSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'بيانات غير صالحة' },
        { status: 422 },
      )
    }
    const { question_id, score, feedback } = validation.data

    // جلب المحاولة الحالية + الأسئلة (لحساب الدرجة الإجمالية)
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('quiz_attempts')
      .select('id, quiz_id, evaluations')
      .eq('id', attemptId)
      .eq('quiz_id', quizId)
      .single()

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'المحاولة غير موجودة' }, { status: 404 })
    }

    const { data: question } = await supabaseAdmin
      .from('questions')
      .select('id, points')
      .eq('id', question_id)
      .eq('quiz_id', quizId)
      .single()

    if (!question) {
      return NextResponse.json({ error: 'السؤال غير موجود في هذا الاختبار' }, { status: 404 })
    }

    const maxPoints = question.points || 1
    const cappedScore = Math.min(score, maxPoints)

    const evaluations = { ...(attempt.evaluations || {}) }
    const existing = evaluations[question_id] || {}

    evaluations[question_id] = {
      ...existing,
      question_id,
      score: cappedScore,
      is_correct: cappedScore >= maxPoints,
      immediate_feedback: feedback?.trim() || existing.immediate_feedback || 'تم تصحيحها يدوياً من المعلم',
      needs_ai_review: false,
      manually_graded: true,
      graded_by: userData.id,
      graded_at: new Date().toISOString(),
    }

    // ── إعادة حساب الدرجة الإجمالية من جديد بناءً على كل التقييمات ──
    const { data: allQuestions } = await supabaseAdmin
      .from('questions')
      .select('id, points')
      .eq('quiz_id', quizId)

    let totalEarned = 0
    let totalPossible = 0
    let stillPending = 0

    for (const q of allQuestions || []) {
      totalPossible += q.points || 1
      const ev = evaluations[q.id]
      if (!ev) continue
      if (ev.needs_ai_review) {
        stillPending++
        continue
      }
      totalEarned += ev.score || 0
    }

    const newScore = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0

    const { error: updateError } = await supabaseAdmin
      .from('quiz_attempts')
      .update({ evaluations, score: newScore })
      .eq('id', attemptId)

    if (updateError) {
      console.error('PATCH grade error:', updateError)
      return NextResponse.json({ error: 'فشل حفظ التصحيح' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      score: newScore,
      pending_remaining: stillPending,
    })
  } catch (err) {
    console.error('PATCH grade error:', err)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}