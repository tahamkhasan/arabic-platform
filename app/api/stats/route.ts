import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) return NextResponse.json({ error: 'teacherId مطلوب' }, { status: 400 })

    // ── مهام المعلم ───────────────────────────────────────────
    const { data: assignments } = await supabaseAdmin
      .from('assignments')
      .select('id, title, max_grade, created_at, target_type')
      .eq('teacher_id', teacherId)

    const assignmentIds = (assignments ?? []).map(a => a.id)

    // ── إجابات الطلاب ─────────────────────────────────────────
    const { data: submissions } = await supabaseAdmin
      .from('submissions')
      .select('id, assignment_id, student_id, teacher_grade, ai_grade, status, submitted_at')
      .in('assignment_id', assignmentIds.length ? assignmentIds : ['none'])

    // ── الطلاب ────────────────────────────────────────────────
    const { data: students } = await supabaseAdmin
      .from('users')
      .select('id, name, email, allowed_grades')
      .eq('user_type', 'student')
      .eq('status', 'approved')

    const subs     = submissions ?? []
    const studs    = students   ?? []
    const assigns  = assignments ?? []

    // ── إحصائيات عامة ─────────────────────────────────────────
    const totalAssignments = assigns.length
    const totalStudents    = studs.length
    const totalSubmissions = subs.length
    const reviewedSubs     = subs.filter(s => s.teacher_grade !== null)
    const avgGrade         = reviewedSubs.length
      ? Math.round(reviewedSubs.reduce((sum, s) => sum + (s.teacher_grade ?? 0), 0) / reviewedSubs.length * 10) / 10
      : 0
    const pendingReview    = subs.filter(s => s.status === 'submitted' && s.teacher_grade === null).length
    const responseRate     = totalAssignments > 0 && totalStudents > 0
      ? Math.round((totalSubmissions / (totalAssignments * totalStudents)) * 100)
      : 0

    // ── أداء كل طالب ──────────────────────────────────────────
    const studentStats = studs.map(s => {
      const mySubs      = subs.filter(sub => sub.student_id === s.id)
      const myGrades    = mySubs.filter(sub => sub.teacher_grade !== null).map(sub => sub.teacher_grade ?? 0)
      const avgStudGrade = myGrades.length
        ? Math.round(myGrades.reduce((a, b) => a + b, 0) / myGrades.length * 10) / 10
        : null
      return {
        id:            s.id,
        name:          s.name,
        email:         s.email,
        grades:        s.allowed_grades ?? [],
        submitted:     mySubs.length,
        graded:        myGrades.length,
        avgGrade:      avgStudGrade,
        pending:       mySubs.filter(sub => sub.status === 'submitted' && sub.teacher_grade === null).length,
        responseRate:  totalAssignments > 0 ? Math.round((mySubs.length / totalAssignments) * 100) : 0,
      }
    }).sort((a, b) => (b.avgGrade ?? -1) - (a.avgGrade ?? -1))

    // ── أداء كل مهمة ──────────────────────────────────────────
    const assignmentStats = assigns.map(a => {
      const aSubs    = subs.filter(s => s.assignment_id === a.id)
      const aGrades  = aSubs.filter(s => s.teacher_grade !== null).map(s => s.teacher_grade ?? 0)
      const avgA     = aGrades.length
        ? Math.round(aGrades.reduce((x, y) => x + y, 0) / aGrades.length * 10) / 10
        : null
      return {
        id:          a.id,
        title:       a.title,
        maxGrade:    a.max_grade,
        submitted:   aSubs.length,
        graded:      aGrades.length,
        avgGrade:    avgA,
        avgPercent:  avgA !== null ? Math.round((avgA / a.max_grade) * 100) : null,
        pending:     aSubs.filter(s => s.status === 'submitted' && s.teacher_grade === null).length,
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
        reviewedSubs: reviewedSubs.length,
      },
      studentStats,
      assignmentStats,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}