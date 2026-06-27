// ============================================================
// API: تحليل طالب واحد — تفصيلي
// GET: أداء الطالب في الاختبارات + نقاط ضعفه + سلسلته + إنجازاته
// ============================================================

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { success, error, requireValidId } from '@/lib/api-response';

// ---- دالة مساعدة ----
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

// ===== GET: تحليل طالب =====
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;

    // 1. تحقق من UUID
    try { requireValidId(studentId, 'student_id'); } catch (e: any) {
      return error(e.message, 400);
    }

    // 2. تحقق من المستخدم (المعلم)
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    if (userData.role !== 'teacher' && userData.role !== 'admin') {
      return error('هذا المسار للمعلمين فقط', 403);
    }

    // 3. تحقق أن الطالب موجود
    const { data: student, error: studentError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, grade, stage, created_at')
      .eq('id', studentId)
      .eq('role', 'student')
      .single();

    if (studentError || !student) {
      return error('الطالب غير موجود', 404);
    }

    // 4. تحقق أن الطالب في أحد فصول هذا المعلم
    const { data: teacherGroups } = await supabaseAdmin
      .from('groups')
      .select('id')
      .eq('teacher_id', userData.id);

    const teacherGroupIds = (teacherGroups || []).map((g: any) => g.id);

    if (teacherGroupIds.length > 0) {
      const { data: membership } = await supabaseAdmin
        .from('group_members')
        .select('id')
        .eq('student_id', studentId)
        .in('group_id', teacherGroupIds)
        .maybeSingle();

      if (!membership && userData.role !== 'admin') {
        return error('هذا الطالب ليس في أي من فصلك', 403);
      }
    }

    // 5. جلب كل محاولات الطالب
    const { data: attempts } = await supabaseAdmin
      .from('quiz_attempts')
      .select(`
        id,
        quiz_id,
        score,
        started_at,
        submitted_at,
        time_spent_seconds,
        quizzes(title, lesson_ids)
      `)
      .eq('student_id', studentId)
      .not('score', 'is', null)
      .order('started_at', { ascending: false });

    // 6. إحصائيات عامة
    const totalAttempts = attempts?.length || 0;
    const scores = (attempts || []).map((a: any) => a.score);
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((s: number, n: number) => s + n, 0) / scores.length)
      : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
    const perfectQuizzes = scores.filter((s: number) => s === 100).length;
    const timedAttempts = (attempts || []).filter((a: any) => a.time_spent_seconds);
    const avgTime = timedAttempts.length > 0
      ? timedAttempts.reduce((s: number, a: any) => s + a.time_spent_seconds, 0) / timedAttempts.length
      : 0;

    // 7. اتجاه الأداء (آخر 10 اختبارات)
    const recentAttempts = (attempts || []).slice(0, 10).reverse();
    const scoreTrend = recentAttempts.map((a: any) => ({
      quiz_title: a.quizzes?.title || 'اختبار',
      score: a.score,
      date: a.started_at,
    }));

    // 8. نقاط الضعف الشخصية
    const weakPoints: Array<{
      topic: string;
      error_count: number;
      last_error_date: string;
    }> = [];

    // من تقييمات الأسئلة
    const { data: attemptsWithEval } = await supabaseAdmin
      .from('quiz_attempts')
      .select('evaluations, started_at')
      .eq('student_id', studentId)
      .not('evaluations', 'is', null);

    const topicErrors: Record<string, { count: number; lastDate: string; text: string }> = {};

    for (const attempt of (attemptsWithEval || [])) {
      const evals = attempt.evaluations as Record<string, any> | null;
      if (!evals) continue;

      for (const [qId, ev] of Object.entries(evals)) {
        if (ev.is_correct === false && ev.immediate_feedback) {
          // نستخدم أول 60 حرفاً من السؤال كمفتاح
          const key = (ev.immediate_feedback || '').substring(0, 60);
          if (!topicErrors[key]) {
            topicErrors[key] = { count: 0, lastDate: '', text: ev.immediate_feedback };
          }
          topicErrors[key].count++;
          if (!topicErrors[key].lastDate || attempt.started_at > topicErrors[key].lastDate) {
            topicErrors[key].lastDate = attempt.started_at;
          }
        }
      }
    }

    for (const [key, data] of Object.entries(topicErrors)) {
      if (data.count >= 2) {
        weakPoints.push({
          topic: data.text.substring(0, 100),
          error_count: data.count,
          last_error_date: data.lastDate,
        });
      }
    }

    weakPoints.sort((a, b) => b.error_count - a.error_count);
    weakPoints.splice(5); // أبقي أعلى 5 فقط

    // 9. ذاكرة السياق (آخر التفاعلات)
    const { data: memories } = await supabaseAdmin
      .from('context_memory')
      .select('interaction_type, content_summary, performance_signal, created_at')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false })
      .limit(10);

    // 10. الإنجازات
    const { data: achievements } = await supabaseAdmin
      .from('student_achievements')
      .select(`
        earned_at,
        achievements(code, title_ar, description_ar, icon)
      `)
      .eq('student_id', studentId)
      .order('earned_at', { ascending: false });

    // 11. سلسلة النشاط (أيام متتالية)
    // نحسب من محاولات الاختبارات
    let streak = 0;
    const activeDays = new Set<string>();

    for (const a of (attempts || [])) {
      if (a.started_at) {
        const day = a.started_at.substring(0, 10); // YYYY-MM-DD
        activeDays.add(day);
      }
    }

    // حساب السلسلة من اليوم للخلف
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dayStr = checkDate.toISOString().substring(0, 10);

      if (activeDays.has(dayStr)) {
        streak++;
      } else if (i > 0) {
        break; // كسرت السلسلة
      }
    }

    // 12. المهام المُسلَّمة
    const { data: submissions } = await supabaseAdmin
      .from('assignment_submissions')
      .select(`
        id,
        score,
        feedback,
        submitted_at,
        graded_at,
        assignments(title, type, due_date)
      `)
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false })
      .limit(10);

    const submittedCount = submissions?.length || 0;
    const gradedSubs = submissions?.filter((s: any) => s.score !== null) ?? [];
    const gradedCount = gradedSubs.length;
    const avgAssignmentScore = gradedCount > 0
      ? gradedSubs.reduce((acc: number, sub: any) => acc + (sub.score ?? 0), 0) / gradedCount
      : 0;

    // 13. أرجع كل شيء
    return success({
      // بيانات الطالب
      student: {
        id: student.id,
        full_name: student.full_name,
        grade: student.grade,
        stage: student.stage,
        joined_at: student.created_at,
      },

      // إحصائيات الاختبارات
      quiz_stats: {
        total_attempts: totalAttempts,
        avg_score: avgScore,
        highest_score: highestScore,
        lowest_score: lowestScore,
        perfect_quizzes: perfectQuizzes,
        avg_time_seconds: Math.round(avgTime),
      },

      // إحصائيات المهام
      assignment_stats: {
        total_submitted: submittedCount,
        total_graded: gradedCount,
        avg_score: Math.round(avgAssignmentScore),
      },

      // اتجاه الدرجات
      score_trend: scoreTrend,

      // نقاط الضعف
      weak_points: weakPoints,

      // السلسلة
      streak,

      // الإنجازات
      achievements: (achievements || []).map((a: any) => ({
        code: a.achievements?.code,
        title: a.achievements?.title_ar,
        icon: a.achievements?.icon,
        earned_at: a.earned_at,
      })),

      // آخر التفاعلات
      recent_activity: (memories || []).map((m: any) => ({
        type: m.interaction_type,
        summary: m.content_summary.substring(0, 100),
        signal: m.performance_signal,
        date: m.created_at,
      })),

      // نصيحة
      recommendation: weakPoints.length > 0
        ? `الطالب يحتاج تركيزاً على: ${weakPoints[0]?.topic?.substring(0, 50)}...`
        : avgScore >= 80
          ? 'أداء الطالب ممتاز — يمكن تقديم تحديات إضافية'
          : avgScore >= 60
            ? 'أداء جيد مع مساحة للتحسين'
            : 'أداء يحتاج متابعة مكثفة — يُنصح بالتواصل مع ولي الأمر',
    });

  } catch (err: any) {
    console.error('Student analytics error:', err);
    return error('خطأ داخلي', 500);
  }
}