// ============================================================
// API: لوحة تحليلات المعلم
// GET: نظرة عامة على أداء الفصول + نقاط الضعف المكتشفة
//
// ── مُصحَّح: subject_performance كانت محسوبة جزئياً (حلقة فاضية
// فعلياً، quiz_id لم يكن مطلوباً في select الأصلي) ولا تُرسَل في
// الناتج النهائي إطلاقاً. أصبحت الآن تُحسَب بربط quiz_attempts
// (عبر quiz_id) → quizzes.lesson_ids[0] → lessons.subject_id →
// subjects.name، وتُرسَل فعلياً في الاستجابة. ────────────────────
//
// المعلمات المقبولة في URL:
//   class_id: تحليل فصل محدد (اختياري)
//   period: 7 أو 30 أو 90 يوماً (افتراضي: 30)
// ============================================================

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { success, error } from '@/lib/api-response';

async function getUser(token: string) {
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return null;
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('id, role, status')
    .eq('id', user.id)
    .single();
  if (!userData || userData.status !== 'approved') return null;
  return userData;
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    if (userData.role !== 'teacher' && userData.role !== 'admin') {
      return error('هذا المسار للمعلمين فقط', 403);
    }

    const { searchParams } = new URL(req.url);
    const period = parseInt(searchParams.get('period') || '30', 10);

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - period);

    const { data: groups } = await supabaseAdmin
      .from('groups')
      .select('id, name')
      .eq('teacher_id', userData.id);

    const groupIds = (groups || []).map((g: any) => g.id);

    if (groupIds.length === 0) {
      return success({
        total_students: 0,
        total_classes: 0,
        total_quizzes_completed: 0,
        overall_avg_score: 0,
        period_days: period,
        classes: [],
        weak_points: [],
        subject_performance: [],
        trend: [],
        recommendation: 'لا توجد فصول بعد — أنشئ فصلاً وأضف طلاباً لرؤية التحليلات.',
      });
    }

    const { data: members } = await supabaseAdmin
      .from('group_members')
      .select('student_id')
      .in('group_id', groupIds);

    const studentIds = (members || []).map((m: any) => m.student_id);

    let totalStudents = studentIds.length;
    let totalQuizzes = 0;
    let totalScore = 0;
    let scoreCount = 0;

    const classPerformance: Array<{
      class_id: string;
      class_name: string;
      students_count: number;
      avg_score: number;
      quizzes_completed: number;
    }> = [];

    for (const g of groups || []) {
      const { data: gMembers } = await supabaseAdmin
        .from('group_members')
        .select('student_id')
        .eq('group_id', g.id);

      const gStudentIds = (gMembers || []).map((m: any) => m.student_id);

      const { data: attempts } = await supabaseAdmin
        .from('quiz_attempts')
        .select('student_id, score, quiz_id, started_at')
        .in('student_id', gStudentIds.length > 0 ? gStudentIds : ['00000000-0000-0000-0000-000000000000'])
        .gte('started_at', sinceDate.toISOString())
        .not('score', 'is', null);

      const gTotal = (attempts || []).reduce((sum: number, a: any) => sum + (a.score || 0), 0);
      const gCount = (attempts || []).length;

      classPerformance.push({
        class_id: g.id,
        class_name: g.name,
        students_count: gStudentIds.length,
        avg_score: gCount > 0 ? Math.round(gTotal / gCount) : 0,
        quizzes_completed: gCount,
      });

      totalQuizzes += gCount;
      totalScore += gTotal;
      scoreCount += gCount;
    }

    // ── مُصحَّح: نطلب quiz_id فعلياً (كان غائباً عن select السابق) ──
    const { data: periodAttempts } = await supabaseAdmin
      .from('quiz_attempts')
      .select('score, started_at, quiz_id, evaluations')
      .in('student_id', studentIds.length > 0 ? studentIds : ['00000000-0000-0000-0000-000000000000'])
      .gte('started_at', sinceDate.toISOString())
      .not('score', 'is', null)
      .order('started_at', { ascending: true });

    const trend: Array<{ label: string; avg_score: number }> = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - i * 7);

      const weekAttempts = (periodAttempts || []).filter((a: any) => {
        const d = new Date(a.started_at);
        return d >= weekStart && d < weekEnd;
      });

      const weekAvg = weekAttempts.length > 0
        ? Math.round(weekAttempts.reduce((s: number, a: any) => s + a.score, 0) / weekAttempts.length)
        : 0;

      const label = i === 0 ? 'هذا الأسبوع' : `منذ ${i} أسبوع`;
      trend.push({ label, avg_score: weekAvg });
    }

    // ── نقاط الضعف (بلا تغيير عن السابق) ────────────────────────
    const weakPoints: Array<{
      question_text: string;
      question_type: string;
      error_rate: number;
      total_attempts: number;
      wrong_attempts: number;
    }> = [];

    const questionStats: Record<string, { total: number; wrong: number; text: string; type: string }> = {};

    for (const attempt of (periodAttempts || [])) {
      const evals = (attempt as any).evaluations as Record<string, any> | null;
      if (!evals) continue;

      for (const [qId, ev] of Object.entries(evals)) {
        if (!questionStats[qId]) {
          questionStats[qId] = { total: 0, wrong: 0, text: ev.question_text || '', type: ev.question_type || '' };
        }
        questionStats[qId].total++;
        if (!ev.is_correct) {
          questionStats[qId].wrong++;
        }
      }
    }

    for (const [qId, stats] of Object.entries(questionStats)) {
      if (stats.total >= 3) {
        const errorRate = Math.round((stats.wrong / stats.total) * 100);
        if (errorRate >= 40) {
          weakPoints.push({
            question_text: stats.text.substring(0, 120),
            question_type: stats.type,
            error_rate: errorRate,
            total_attempts: stats.total,
            wrong_attempts: stats.wrong,
          });
        }
      }
    }

    weakPoints.sort((a, b) => b.error_rate - a.error_rate);
    weakPoints.splice(10);

    // ── مُصحَّح: أداء المواد — يُحسَب الآن فعلياً ويُرسَل في الناتج ──
    // مسار الربط: quiz_attempts.quiz_id → quizzes.lesson_ids[0] →
    // lessons.subject_id → subjects.name ──────────────────────────
    const subjectPerformance: Array<{
      subject_name: string;
      avg_score: number;
      attempts: number;
    }> = [];

    const quizIds = Array.from(new Set((periodAttempts || []).map((a: any) => a.quiz_id).filter(Boolean)));

    if (quizIds.length > 0) {
      const { data: teacherQuizzes } = await supabaseAdmin
        .from('quizzes')
        .select('id, lesson_ids')
        .in('id', quizIds);

      const quizIdToLessonId: Record<string, string> = {};
      for (const q of teacherQuizzes || []) {
        if (q.lesson_ids && q.lesson_ids.length > 0) {
          quizIdToLessonId[q.id] = q.lesson_ids[0];
        }
      }

      const lessonIds = Array.from(new Set(Object.values(quizIdToLessonId)));
      let lessonIdToSubjectId: Record<string, string> = {};

      if (lessonIds.length > 0) {
        const { data: lessons } = await supabaseAdmin
          .from('lessons')
          .select('id, subject_id')
          .in('id', lessonIds);

        for (const l of lessons || []) {
          lessonIdToSubjectId[l.id] = l.subject_id;
        }
      }

      const subjectIds = Array.from(new Set(Object.values(lessonIdToSubjectId)));
      let subjectNames: Record<string, string> = {};

      if (subjectIds.length > 0) {
        const { data: subjectsData } = await supabaseAdmin
          .from('subjects')
          .select('id, name')
          .in('id', subjectIds);

        for (const s of subjectsData || []) {
          subjectNames[s.id] = s.name;
        }
      }

      // اجمع درجات كل محاولة في مادتها
      const subjectScores: Record<string, { total: number; count: number }> = {};

      for (const attempt of (periodAttempts || [])) {
        const quizId = (attempt as any).quiz_id;
        const lessonId = quizIdToLessonId[quizId];
        const subjectId = lessonId ? lessonIdToSubjectId[lessonId] : null;
        if (!subjectId) continue;

        if (!subjectScores[subjectId]) {
          subjectScores[subjectId] = { total: 0, count: 0 };
        }
        subjectScores[subjectId].total += (attempt as any).score || 0;
        subjectScores[subjectId].count += 1;
      }

      for (const [subjectId, stats] of Object.entries(subjectScores)) {
        subjectPerformance.push({
          subject_name: subjectNames[subjectId] || 'مادة غير معروفة',
          avg_score: stats.count > 0 ? Math.round(stats.total / stats.count) : 0,
          attempts: stats.count,
        });
      }

      subjectPerformance.sort((a, b) => b.attempts - a.attempts);
    }

    return success({
      total_students: totalStudents,
      total_classes: groupIds.length,
      total_quizzes_completed: totalQuizzes,
      overall_avg_score: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
      period_days: period,
      classes: classPerformance,
      weak_points: weakPoints,
      subject_performance: subjectPerformance,
      trend,
      recommendation: weakPoints.length > 0
        ? `يُلاحظ أن ${weakPoints.length} موضوع${weakPoints.length > 2 ? '' : 'اً'} يحتاج${weakPoints.length > 2 ? '' : 'ة'} تركيزاً — أعلى نسبة خطأ: ${weakPoints[0]?.error_rate}% في "${weakPoints[0]?.question_text?.substring(0, 50)}..."`
        : 'أداء الطلاب جيد — استمر في المنهج الحالي',
    });

  } catch (err: any) {
    console.error('Analytics error:', err);
    return error('خطأ داخلي', 500);
  }
}