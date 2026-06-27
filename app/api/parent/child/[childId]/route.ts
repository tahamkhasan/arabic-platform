// ============================================================
// API: أداء ابن واحد — ما يراه ولي الأمر
// GET: درجات الاختبارات + المهام + النشاط + التقدم
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

// ===== GET: أداء الابن =====
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    const { childId } = await params;

    // 1. تحقق من UUID
    try { requireValidId(childId, 'child_id'); } catch (e: any) {
      return error(e.message, 400);
    }

    // 2. تحقق من ولي الأمر
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    if (userData.role !== 'parent') {
      return error('هذا المسار لأولياء الأمور فقط', 403);
    }

    // 3. تحقق أن هذا الابن مربوط بولي الأمر
    const { data: link } = await supabaseAdmin
      .from('parent_children')
      .select('id, relation')
      .eq('parent_id', userData.id)
      .eq('child_id', childId)
      .maybeSingle();

    if (!link) {
      return error('هذا الطالب غير مربوط بحسابك', 403);
    }

    // 4. بيانات الطالب الأساسية
    const { data: child } = await supabaseAdmin
      .from('users')
      .select('id, full_name, grade, stage, status, created_at')
      .eq('id', childId)
      .single();

    if (!child) {
      return error('الطالب غير موجود', 404);
    }

    // 5. المعاملات من URL
    const { searchParams } = new URL(req.url);
    const period = parseInt(searchParams.get('period') || '30', 10);

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - period);

    // 6. درجات الاختبارات في الفترة المحددة
    const { data: attempts } = await supabaseAdmin
      .from('quiz_attempts')
      .select(`
        id,
        quiz_id,
        score,
        started_at,
        submitted_at,
        time_spent_seconds,
        quizzes(title)
      `)
      .eq('student_id', childId)
      .gte('started_at', sinceDate.toISOString())
      .not('score', 'is', null)
      .order('started_at', { ascending: false });

    const scores = (attempts || []).map((a: any) => a.score);
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((s: number, n: number) => s + n, 0) / scores.length)
      : null;

    // 7. اتجاه الدرجات (آخر 7 أسابيع)
    const trend: Array<{ week: string; avg_score: number; count: number }> = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - i * 7);

      const weekAttempts = (attempts || []).filter((a: any) => {
        const d = new Date(a.started_at);
        return d >= weekStart && d < weekEnd;
      });

      const weekAvg = weekAttempts.length > 0
        ? Math.round(weekAttempts.reduce((s: number, a: any) => s + a.score, 0) / weekAttempts.length)
        : 0;

      trend.push({
        week: `الأسبوع ${7 - i}`,
        avg_score: weekAvg,
        count: weekAttempts.length,
      });
    }

    // 8. المهام المُسلَّمة في الفترة المحددة
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
      .eq('student_id', childId)
      .gte('submitted_at', sinceDate.toISOString())
      .order('submitted_at', { ascending: false });

    const totalSubmitted = submissions?.length || 0;
    const totalGraded = submissions?.filter((s: any) => s.score !== null)?.length || 0;
    const avgAssignmentScore = (submissions?.filter((s: any) => s.score !== null)
      ?.reduce((s: number, sub: any) => s + sub.score, 0) ?? 0) / (totalGraded || 1);

    // المهام المتأخرة (لم تُسلَّم بعد)
    const { data: overdueAssignments } = await supabaseAdmin
      .from('assignments')
      .select('id, title, type, due_date')
      .eq('class_id', link.id) // قد لا يعمل لأن المهام لا ترتبط بـ parent_children مباشرة
      .lt('due_date', new Date().toISOString())
      .is('deleted_at', null)
      .order('due_date', { ascending: true })
      .limit(5);

    // 9. الإنجازات
    const { data: achievements } = await supabaseAdmin
      .from('student_achievements')
      .select(`
        earned_at,
        achievements(code, title_ar, description_ar, icon)
      `)
      .eq('student_id', childId)
      .order('earned_at', { ascending: false });

    // 10. السلسلة (أيام متتالية)
    let streak = 0;
    const activeDays = new Set<string>();

    // نجمع كل المحاولات (ليس فقط الفترة المحددة) لحساب السلسلة
    const { data: allAttempts } = await supabaseAdmin
      .from('quiz_attempts')
      .select('started_at')
      .eq('student_id', childId)
      .not('score', 'is', null);

    for (const a of (allAttempts || [])) {
      if (a.started_at) {
        activeDays.add(a.started_at.substring(0, 10));
      }
    }

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() - i);
      const dayStr = checkDate.toISOString().substring(0, 10);

      if (activeDays.has(dayStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // 11. نقاط الضعف (من ذاكرة السياق)
    const { data: memories } = await supabaseAdmin
      .from('context_memory')
      .select('interaction_type, content_summary, performance_signal, created_at')
      .eq('user_id', childId)
      .eq('interaction_type', 'mistake')
      .order('created_at', { ascending: false })
      .limit(5);

    // 12. أرجع كل شيء
    return success({
      // بيانات الطالب
      child: {
        id: child.id,
        full_name: child.full_name,
        grade: child.grade,
        stage: child.stage,
        relation: link.relation,
        relation_label:
          link.relation === 'father' ? 'الأب' :
          link.relation === 'mother' ? 'الأم' : 'الوصي',
      },

      // إحصائيات الفترة
      period_days: period,
      quiz_stats: {
        total_attempts: attempts?.length || 0,
        avg_score: avgScore,
        highest_score: scores.length > 0 ? Math.max(...scores) : 0,
        lowest_score: scores.length > 0 ? Math.min(...scores) : 0,
      },
      assignment_stats: {
        total_submitted: totalSubmitted,
        total_graded: totalGraded,
        avg_score: Math.round(avgAssignmentScore),
        pending_grading: totalSubmitted - totalGraded,
      },

      // الاتجاه
      trend,

      // آخر الاختبارات
      recent_quizzes: (attempts || []).slice(0, 10).map((a: any) => ({
        id: a.id,
        title: a.quizzes?.title || 'اختبار',
        score: a.score,
        date: a.submitted_at || a.started_at,
        time_spent: a.time_spent_seconds,
      })),

      // آخر المهام
      recent_assignments: (submissions || []).slice(0, 10).map((s: any) => ({
        id: s.id,
        title: s.assignments?.title || 'مهمة',
        type: s.assignments?.type,
        score: s.score,
        feedback: s.feedback,
        submitted_at: s.submitted_at,
        graded_at: s.graded_at,
        due_date: s.assignments?.due_date,
        is_late: s.assignments?.due_date && s.submitted_at
          ? new Date(s.submitted_at) > new Date(s.assignments.due_date)
          : false,
      })),

      // الإنجازات
      achievements: (achievements || []).map((a: any) => ({
        code: a.achievements?.code,
        title: a.achievements?.title_ar,
        icon: a.achievements?.icon,
        earned_at: a.earned_at,
      })),
      achievements_count: achievements?.length || 0,

      // السلسلة
      streak,

      // نقاط الضعف
      weak_points: (memories || []).map((m: any) => ({
        summary: m.content_summary.substring(0, 100),
        date: m.created_at,
      })),

      // نصيحة لولي الأمر
      recommendation: avgScore !== null
        ? avgScore >= 80
          ? 'أداء ابنك ممتاز — استمر في تشجيعه'
          : avgScore >= 60
            ? 'أداء جيد مع مساحة للتحسين — تابع متابعته باهتمام'
            : 'أداء ابنك يحتاج متابعة — يُنصح بالتواصل مع معلمه'
        : 'لم يخترِ ابنك أي اختبارات بعد — شجّعه على البدء',
    });

  } catch (err: any) {
    console.error('Child detail error:', err);
    return error('خطأ داخلي', 500);
  }
}