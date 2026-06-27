import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// ──────────────────────────────────────────────────────────────
// app/api/quizzes/available/route.ts (جديد)
//
// GET: قائمة الاختبارات المنشورة المتاحة للطالب الحالي — أي
// اختبار published=true ومرتبط بفصل (group) الطالب مسجَّل فيه عبر
// group_members، بالإضافة لحالة محاولته (لم يبدأ/جارية/مُسلَّمة).
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

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const userData = await getUser(token)
  if (!userData) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  if (userData.role !== 'student') {
    return NextResponse.json({ error: 'هذه النقطة للطلاب فقط' }, { status: 403 })
  }

  try {
    // 1. فصول الطالب (عبر group_members، البنية الفعلية المستخدَمة)
    const { data: memberships } = await supabaseAdmin
      .from('group_members')
      .select('group_id')
      .eq('student_id', userData.id)

    const groupIds = (memberships || []).map((m) => m.group_id)
    if (groupIds.length === 0) {
      return NextResponse.json({ quizzes: [] })
    }

    // 2. الاختبارات المنشورة لهذه الفصول
    const { data: quizzes, error: quizzesError } = await supabaseAdmin
      .from('quizzes')
      .select('id, title, description, time_limit_minutes, attempts_allowed, class_id, created_at, questions(count)')
      .in('class_id', groupIds)
      .eq('published', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (quizzesError) {
      console.error('GET /api/quizzes/available error:', quizzesError)
      return NextResponse.json({ quizzes: [] })
    }

    const quizIds = (quizzes || []).map((q) => q.id)

    // 3. محاولات الطالب على هذه الاختبارات (لمعرفة الحالة)
    let attemptsByQuiz: Record<string, { count: number; lastScore: number | null; hasActive: boolean }> = {}
    if (quizIds.length > 0) {
      const { data: attempts } = await supabaseAdmin
        .from('quiz_attempts')
        .select('quiz_id, score, submitted_at')
        .eq('student_id', userData.id)
        .in('quiz_id', quizIds)

      for (const a of attempts || []) {
        const entry = attemptsByQuiz[a.quiz_id] || { count: 0, lastScore: null, hasActive: false }
        entry.count += 1
        if (a.submitted_at) entry.lastScore = a.score
        else entry.hasActive = true
        attemptsByQuiz[a.quiz_id] = entry
      }
    }

    const result = (quizzes || []).map((q: any) => {
      const att = attemptsByQuiz[q.id]
      return {
        id: q.id,
        title: q.title,
        description: q.description,
        time_limit_minutes: q.time_limit_minutes,
        attempts_allowed: q.attempts_allowed || 1,
        questions_count: q.questions?.[0]?.count || 0,
        attempts_used: att?.count || 0,
        last_score: att?.lastScore ?? null,
        has_active_attempt: att?.hasActive || false,
        can_attempt: (att?.count || 0) < (q.attempts_allowed || 1) || att?.hasActive,
      }
    })

    return NextResponse.json({ quizzes: result })
  } catch (err) {
    console.error('GET /api/quizzes/available error:', err)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الاختبارات.' }, { status: 500 })
  }
}