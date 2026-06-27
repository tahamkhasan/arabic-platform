// ============================================================
// app/api/stats/route.ts — مُصحَّح ليطابق البنية الفعلية للجداول
//
// ── مُصحَّح: كانت تستعلم من assignments.max_grade و
// assignments.target_type (غير موجودين بعد إعادة بناء الجدول —
// انظر app/api/assignments/route.ts) و users.name (العمود الفعلي
// full_name، لا name). كل مهمة الآن تشير لاختبار في quizzes (لا
// max_grade خاص بها)، فالدرجة القصوى الفعلية = 100 (نسبة مئوية،
// من quiz_attempts.score)، لا درجة خام مرتبطة بالمهمة نفسها.
// التقييم أصبح مرتبطاً بـquiz_attempts بدل submissions القديمة. ───
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface ContentRef {
  quiz_id: string
  target_type: 'all' | 'class' | 'student'
  target_ids: string[]
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) return NextResponse.json({ error: 'teacherId مطلوب' }, { status: 400 })

    // ── مهام المعلم (البنية الجديدة: content_ref بدل max_grade) ──
    const { data: assignments } = await supabaseAdmin
      .from('assignments')
      .select('id, title, content_ref, created_at')
      .eq('teacher_id', teacherId)
      .is('deleted_at', null)

    const assigns = assignments ?? []

    // فصول المعلم (لحساب عدد طلابه الفعليين)
    const { data: groups } = await supabaseAdmin
      .from('groups')
      .select('id')
      .eq('teacher_id', teacherId)

    const groupIds = (groups ?? []).map((g) => g.id)

    const { data: members } = await supabaseAdmin
      .from('group_members')
      .select('student_id')
      .in('group_id', groupIds.length ? groupIds : ['00000000-0000-0000-0000-000000000000'])

    const studentIds = Array.from(new Set((members ?? []).map((m) => m.student_id)))

    const { data: students } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, allowed_grades')
      .in('id', studentIds.length ? studentIds : ['00000000-0000-0000-0000-000000000000'])

    const studs = students ?? []

    // ── محاولات الاختبارات المرتبطة بمهام هذا المعلم ─────────────
    const quizIds = Array.from(
      new Set(assigns.map((a) => (a.content_ref as ContentRef)?.quiz_id).filter(Boolean))
    )

    const { data: attempts } = await supabaseAdmin
      .from('quiz_attempts')
      .select('id, quiz_id, student_id, score, submitted_at')
      .in('quiz_id', quizIds.length ? quizIds : ['00000000-0000-0000-0000-000000000000'])

    const atts = (attempts ?? []).filter((a) => a.submitted_at !== null)

    const totalAssignments = assigns.length
    const totalStudents = studs.length
    const totalSubmissions = atts.length
    const avgGrade = atts.length
      ? Math.round((atts.reduce((sum, a) => sum + (a.score ?? 0), 0) / atts.length) * 10) / 10
      : 0
    const pendingReview = 0 // الأسئلة المقالية بانتظار تصحيح المعلم — تُحسب من evaluations لاحقاً إن لزم
    const responseRate = totalAssignments > 0 && totalStudents > 0
      ? Math.round((totalSubmissions / (totalAssignments * totalStudents)) * 100)
      : 0

    // ── أداء كل طالب (الدرجة هنا نسبة مئوية من 100، لا من max_grade) ──
    const studentStats = studs.map((s) => {
      const mySubs = atts.filter((a) => a.student_id === s.id)
      const myGrades = mySubs.map((a) => a.score ?? 0)
      const avgStudGrade = myGrades.length
        ? Math.round((myGrades.reduce((a, b) => a + b, 0) / myGrades.length) * 10) / 10
        : null
      return {
        id: s.id,
        name: s.full_name ?? s.email ?? 'بدون اسم',
        email: s.email,
        grades: s.allowed_grades ?? [],
        submitted: mySubs.length,
        graded: myGrades.length,
        avgGrade: avgStudGrade,
        pending: 0,
        responseRate: totalAssignments > 0 ? Math.round((mySubs.length / totalAssignments) * 100) : 0,
      }
    }).sort((a, b) => (b.avgGrade ?? -1) - (a.avgGrade ?? -1))

    // ── أداء كل مهمة (نسبة مئوية مباشرة، maxGrade ثابتة = 100) ────
    const assignmentStats = assigns.map((a) => {
      const ref = a.content_ref as ContentRef
      const aAttempts = atts.filter((at) => at.quiz_id === ref?.quiz_id)
      const aGrades = aAttempts.map((at) => at.score ?? 0)
      const avgA = aGrades.length
        ? Math.round((aGrades.reduce((x, y) => x + y, 0) / aGrades.length) * 10) / 10
        : null
      return {
        id: a.id,
        title: a.title,
        maxGrade: 100,
        submitted: aAttempts.length,
        graded: aGrades.length,
        avgGrade: avgA,
        avgPercent: avgA,
        pending: 0,
      }
    }).sort((a, b) => (a.avgPercent ?? 101) - (b.avgPercent ?? 101))

    return NextResponse.json({
      summary: {
        totalAssignments,
        totalStudents,
        totalSubmissions,
        avgGrade,
        pendingReview,
        responseRate,
        reviewedSubs: atts.length,
      },
      studentStats,
      assignmentStats,
    })
  } catch (error: unknown) {
    console.error('GET /api/stats error:', error)
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}