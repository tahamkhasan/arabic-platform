// ============================================================
// API: قائمة أبناء ولي الأمر
// GET: جلب الأبناء المرتبطين بحساب ولي الأمر
// POST: ربط ابن بحساب ولي الأمر
// DELETE: فك الربط
// ============================================================

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { success, error } from '@/lib/api-response';
import { z } from 'zod';

// ---- شكل ربط ابن ----
const linkChildSchema = z.object({
  child_id: z.string().uuid('معرّف الابن غير صالح'),
  relation: z.enum(['father', 'mother', 'guardian']).default('father'),
});

function getFirstErrorMessage(err: z.ZodError) {
  return err.issues?.[0]?.message || 'بيانات غير صحيحة';
}

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

// ===== GET: قائمة الأبناء =====
export async function GET(req: NextRequest) {
  try {
    // 1. تحقق من المستخدم
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    if (userData.role !== 'parent') {
      return error('هذا المسار لأولياء الأمور فقط', 403);
    }

    // 2. جلب الأبناء المرتبطين
    const { data: links, error: linksError } = await supabaseAdmin
      .from('parent_children')
      .select('child_id, relation')
      .eq('parent_id', userData.id);

    if (linksError) {
      console.error('Error fetching children:', linksError);
      return error('فشل جلب الأبناء', 500);
    }

    if (!links || links.length === 0) {
      return success({
        children_count: 0,
        children: [],
      });
    }

    // 3. جلب بيانات كل ابن
    const childIds = links.map((l: any) => l.child_id);

    const { data: children } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, grade, stage, status, created_at')
      .in('id', childIds);

    // 4. لبنِ خريطة الربط
    const relationMap: Record<string, string> = {};
    for (const l of links) {
      relationMap[l.child_id] = l.relation;
    }

    // 5. لكل ابن: احسب متوسط درجاته
    const childData: Array<any> = [];

    for (const child of (children || [])) {
      // متوسط درجات الاختبارات
      const { data: attempts } = await supabaseAdmin
        .from('quiz_attempts')
        .select('score')
        .eq('student_id', child.id)
        .not('score', 'is', null);

      const scores = (attempts || []).map((a: any) => a.score);
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((s: number, n: number) => s + n, 0) / scores.length)
        : null;

      // عدد المهام المُسلَّمة
      const { count: submittedCount } = await supabaseAdmin
        .from('assignment_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', child.id);

      // عدد المهام المُصحَّحة
      const { count: gradedCount } = await supabaseAdmin
        .from('assignment_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', child.id)
        .not('score', 'is', null);

      // آخر نشاط (آخر محاولة اختبار أو تسليم مهمة)
      let lastActivity: string | null = null;

      const { data: lastAttempt } = await supabaseAdmin
        .from('quiz_attempts')
        .select('started_at')
        .eq('student_id', child.id)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastAttempt) {
        lastActivity = lastAttempt.started_at;
      }

      // عدد الإنجازات
      const { count: achievementCount } = await supabaseAdmin
        .from('student_achievements')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', child.id);

      childData.push({
        id: child.id,
        full_name: child.full_name,
        grade: child.grade,
        stage: child.stage,
        status: child.status,
        relation: relationMap[child.id] || 'father',
        relation_label:
          relationMap[child.id] === 'father' ? 'الأب' :
          relationMap[child.id] === 'mother' ? 'الأم' : 'الوصي',
        avg_score: avgScore,
        quizzes_completed: scores.length,
        assignments_submitted: submittedCount || 0,
        assignments_graded: gradedCount || 0,
        achievements_count: achievementCount || 0,
        last_activity: lastActivity,
        joined_at: child.created_at,
      });
    }

    return success({
      children_count: childData.length,
      children: childData,
    });

  } catch (err: any) {
    console.error('Children list error:', err);
    return error('خطأ داخلي', 500);
  }
}

// ===== POST: ربط ابن =====
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    if (userData.role !== 'parent') {
      return error('فقط أولياء الأمور يمكنهم ربط أبناء', 403);
    }

    // تحقق من البيانات
    const body = await req.json();
    const validation = linkChildSchema.safeParse(body);
    if (!validation.success) {
      return error(getFirstErrorMessage(validation.error), 422);
    }

    const { child_id, relation } = validation.data;

    // تحقق أن الابن موجود وهو طالب
    const { data: child } = await supabaseAdmin
      .from('users')
      .select('id, role, status, full_name')
      .eq('id', child_id)
      .single();

    if (!child) {
      return error('الطالب غير موجود', 404);
    }

    if (child.role !== 'student') {
      return error('يمكن ربط طلاب فقط', 400);
    }

    if (child.status !== 'approved') {
      return error('حساب هذا الطالب غير معتمد بعد', 400);
    }

    // تحقق أنه غير مربوط مسبقاً
    const { data: existing } = await supabaseAdmin
      .from('parent_children')
      .select('id')
      .eq('parent_id', userData.id)
      .eq('child_id', child_id)
      .maybeSingle();

    if (existing) {
      return error('هذا الطالب مربوط بحسابك مسبقاً', 400, 'ALREADY_LINKED');
    }

    // أنشئ الربط
    const { error: insertError } = await supabaseAdmin
      .from('parent_children')
      .insert({
        parent_id: userData.id,
        child_id,
        relation,
      });

    if (insertError) {
      console.error('Error linking child:', insertError);
      return error('فشل ربط الطالب', 500);
    }

    // أرسل إشعار لولي الأمر
    await supabaseAdmin.from('notifications').insert({
      user_id: userData.id,
      type: 'system',
      title: 'تم ربط ابن',
      body: `تم ربط الطالب "${child.full_name}" بحسابك بنجاح`,
    });

    return success({
      message: `تم ربط "${child.full_name}" بحسابك`,
      child_id: child.id,
      relation,
    });

  } catch (err: any) {
    console.error('Link child error:', err);
    return error('خطأ داخلي', 500);
  }
}

// ===== DELETE: فك ربط ابن =====
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    if (userData.role !== 'parent') {
      return error('فقط أولياء الأمور يمكنهم فك الربط', 403);
    }

    const body = await req.json();
    const { child_id } = body;

    if (!child_id) {
      return error('معرّف الطالب مطلوب', 400);
    }

    const { error: deleteError } = await supabaseAdmin
      .from('parent_children')
      .delete()
      .eq('parent_id', userData.id)
      .eq('child_id', child_id);

    if (deleteError) {
      console.error('Error unlinking child:', deleteError);
      return error('فشل فك الربط', 500);
    }

    return success({ message: 'تم فك الربط' });

  } catch (err: any) {
    console.error('Unlink child error:', err);
    return error('خطأ داخلي', 500);
  }
}