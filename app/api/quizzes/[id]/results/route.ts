import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// ──────────────────────────────────────────────────────────────
// app/api/quizzes/[id]/results/route.ts (جديد)
//
// GET: نتائج كل محاولات الطلاب على اختبار معيّن — للمعلم صاحب
// الاختبار فقط. يُستخدَم في صفحة تفاصيل الاختبار (app/teacher/
// quizzes/[id]/page.tsx) لعرض من حلّ، ومتى، وبأي نتيجة.
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: quizId } = await params

  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const userData = await getUser(token)
  if (!userData) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  try {
    // تحقق من ملكية الاختبار
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

    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from('quiz_attempts')
      .select('id, student_id, score, started_at, submitted_at, time_spent_seconds, users:student_id(full_name, email)')
      .eq('quiz_id', quizId)
      .order('submitted_at', { ascending: false, nullsFirst: false })

    if (attemptsError) {
      console.error('GET quiz results error:', attemptsError)
      return NextResponse.json({ error: 'فشل جلب النتائج' }, { status: 500 })
    }

    const results = (attempts || []).map((a: any) => ({
      attempt_id: a.id,
      student_id: a.student_id,
      student_name: a.users?.full_name || a.users?.email || 'طالب',
      score: a.score,
      started_at: a.started_at,
      submitted_at: a.submitted_at,
      time_spent_seconds: a.time_spent_seconds,
      status: a.submitted_at ? 'submitted' : 'in_progress',
    }))

    const submitted = results.filter((r) => r.status === 'submitted')
    const avgScore = submitted.length > 0
      ? Math.round(submitted.reduce((sum, r) => sum + (r.score || 0), 0) / submitted.length)
      : null

    return NextResponse.json({
      quiz_title: quiz.title,
      total_attempts: results.length,
      submitted_count: submitted.length,
      average_score: avgScore,
      results,
    })
  } catch (err) {
    console.error('GET quiz results error:', err)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}