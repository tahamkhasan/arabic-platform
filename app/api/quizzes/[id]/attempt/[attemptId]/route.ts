import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// ──────────────────────────────────────────────────────────────
// app/api/quizzes/[id]/attempts/[attemptId]/route.ts (جديد)
//
// GET: تفاصيل محاولة طالب واحدة كاملة — كل الأسئلة مع إجابة الطالب
// والتقييم الحالي (تلقائي أو يدوي). يُستخدَم في واجهة المعلم لمراجعة
// وتصحيح الأسئلة المقالية يدوياً.
// ──────────────────────────────────────────────────────────────

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; attemptId: string }> }
) {
  const { id: quizId, attemptId } = await params

  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const userData = await getUser(token)
  if (!userData) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  try {
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .select('id, teacher_id, title')
      .eq('id', quizId)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: 'الاختبار غير موجود' }, { status: 404 })
    }
    if (quiz.teacher_id !== userData.id && userData.role !== 'admin') {
      return NextResponse.json({ error: 'ليس اختبارك' }, { status: 403 })
    }

    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('quiz_attempts')
      .select('id, student_id, answers, evaluations, score, submitted_at, time_spent_seconds, users:student_id(full_name, email)')
      .eq('id', attemptId)
      .eq('quiz_id', quizId)
      .single()

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'المحاولة غير موجودة' }, { status: 404 })
    }

    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('sort_order', { ascending: true })

    if (questionsError) {
      return NextResponse.json({ error: 'فشل جلب الأسئلة' }, { status: 500 })
    }

    const answers = attempt.answers || {}
    const evaluations = attempt.evaluations || {}

    const items = (questions || []).map((q: any) => ({
      question_id: q.id,
      type: q.type,
      text: q.text,
      options: q.options,
      correct_answer: q.correct_answer,
      points: q.points || 1,
      explanation: q.explanation,
      student_answer: answers[q.id] ?? null,
      evaluation: evaluations[q.id] ?? null,
    }))

    return NextResponse.json({
      quiz_title: quiz.title,
      student_name: (attempt as any).users?.full_name || (attempt as any).users?.email || 'طالب',
      score: attempt.score,
      submitted_at: attempt.submitted_at,
      time_spent_seconds: attempt.time_spent_seconds,
      questions: items,
    })
  } catch (err) {
    console.error('GET attempt detail error:', err)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}