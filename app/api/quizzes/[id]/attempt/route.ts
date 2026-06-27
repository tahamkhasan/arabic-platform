// ============================================================
// API: بدء محاولة اختبار + جلب محاولة جارية
// POST: بدء محاولة جديدة (يتحقق من الصلاحيات والمحاولات)
// GET: جلب محاولة جارية (للمتابعة إن خرج الطالب وعاد)
//
// ── مُصحَّح: التحقق من ملكية الفصل يستخدم group_members بدل
// class_students (جدول كان فاضياً بالكامل، غير مُستخدَم من أي
// مكان فعلي في المنصة — "الفصول" هنا فعلياً صفوف groups، والطلاب
// المرتبطون بها مُسجَّلون في group_members، تماماً كما صُحِّح في
// app/api/classes/[id]/route.ts و .../students/route.ts سابقاً). ──
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { success, error, requireValidId } from '@/lib/api-response';

// ---- دالة مساعدة: تحقق من المستخدم ----
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

// ---- POST: بدء محاولة جديدة ----
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quizId } = await params;

    // 1. تحقق من UUID
    try { requireValidId(quizId, 'quiz_id'); } catch (e: any) { return error(e.message, 400); }

    // 2. تحقق من المستخدم
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح — يرجى تسجيل الدخول', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    // 3. يجب أن يكون الطالب
    if (userData.role !== 'student') {
      return error('هذا المسار للطلاب فقط', 403);
    }

    // 4. تحقق أن الاختبار موجود ومنشور
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .select('id, title, published, attempts_allowed, class_id, time_limit_minutes')
      .eq('id', quizId)
      .is('deleted_at', null)
      .single();

    if (quizError || !quiz) {
      return error('الاختبار غير موجود', 404);
    }

    if (!quiz.published) {
      return error('هذا الاختبار غير منشور بعد', 403);
    }

    // 5. تحقق من الفصل إن كان الاختبار مخصصاً لفصل معين
    // ── مُصحَّح: group_members بدل class_students ────────────────
    if (quiz.class_id) {
      const { data: enrollment } = await supabaseAdmin
        .from('group_members')
        .select('student_id')
        .eq('group_id', quiz.class_id)
        .eq('student_id', userData.id)
        .maybeSingle();

      if (!enrollment) {
        return error('هذا الاختبار غير مخصص لفصلك', 403);
      }
    }

    // 6. تحقق من عدد المحاولات السابقة
    const { count: attemptCount } = await supabaseAdmin
      .from('quiz_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('quiz_id', quizId)
      .eq('student_id', userData.id);

    if (attemptCount !== null && attemptCount >= (quiz.attempts_allowed || 1)) {
      return error(
        `استنفدت كل محاولاتك (${quiz.attempts_allowed || 1})`,
        429,
        'MAX_ATTEMPTS'
      );
    }

    // 7. تحقق أن لا توجد محاولة جارية غير مُسلَّمة
    const { data: activeAttempt } = await supabaseAdmin
      .from('quiz_attempts')
      .select('id, started_at')
      .eq('quiz_id', quizId)
      .eq('student_id', userData.id)
      .is('submitted_at', null)
      .maybeSingle();

    if (activeAttempt) {
      // أرجع المحاولة الجارية بدل إنشاء جديدة
      return success({
        attempt_id: activeAttempt.id,
        message: 'لديك محاولة جارية — أكملها',
        is_existing: true,
        started_at: activeAttempt.started_at,
      });
    }

    // 8. أنشئ محاولة جديدة
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        student_id: userData.id,
        answers: {},
        started_at: new Date().toISOString(),
      })
      .select('id, started_at')
      .single();

    if (attemptError || !attempt) {
      console.error('Error creating attempt:', attemptError);
      return error('فشل بدء المحاولة', 500);
    }

    // 9. سجّل في ذاكرة السياق
    try {
      await supabaseAdmin.from('context_memory').insert({
        user_id: userData.id,
        lesson_id: quizId, // سنربطه بالدرس لاحقاً
        interaction_type: 'quiz_attempt',
        content_summary: `بدأ اختبار: ${quiz.title}`,
        performance_signal: 0,
      });
    } catch {
      // لا نُفشل المحاولة إن فشلت ذاكرة السياق
    }

    // 10. أرجع المحاولة مع بيانات الاختبار الأساسية
    return success({
      attempt_id: attempt.id,
      started_at: attempt.started_at,
      quiz_title: quiz.title,
      time_limit_minutes: quiz.time_limit_minutes,
      is_existing: false,
    });

  } catch (err: any) {
    console.error('Attempt start error:', err);
    return error('خطأ داخلي', 500);
  }
}

// ---- GET: جلب محاولة جارية ----
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quizId } = await params;

    try { requireValidId(quizId, 'quiz_id'); } catch (e: any) { return error(e.message, 400); }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    // ابحث عن محاولة جارية لهذا الطالب في هذا الاختبار
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('quiz_attempts')
      .select('id, answers, started_at')
      .eq('quiz_id', quizId)
      .eq('student_id', userData.id)
      .is('submitted_at', null)
      .maybeSingle();

    if (attemptError) {
      console.error('Error fetching attempt:', attemptError);
      return error('فشل جلب المحاولة', 500);
    }

    if (!attempt) {
      return success({ has_active_attempt: false });
    }

    return success({
      has_active_attempt: true,
      attempt_id: attempt.id,
      answers: attempt.answers || {},
      started_at: attempt.started_at,
    });

  } catch (err: any) {
    console.error('Attempt fetch error:', err);
    return error('خطأ داخلي', 500);
  }
}