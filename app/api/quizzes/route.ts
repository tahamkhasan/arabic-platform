// ============================================================
// API: إنشاء وقائمة الاختبارات
// POST: إنشاء اختبار جديد وحفظه في قاعدة البيانات
// GET: قائمة اختبارات المعلم
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { success, error, paginated, requireRole } from '@/lib/api-response';
import { createQuizSchema, paginationSchema } from '@/lib/validators';

// ---- إنشاء اختبار جديد ----
export async function POST(req: NextRequest) {
  try {
    // 1. تحقق من المستخدم
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      return error('غير مصرح — يرجى تسجيل الدخول', 401);
    }

    // 2. تحقق من هوية المستخدم
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return error('جلسة غير صالحة', 401);
    }

    // 3. تحقق من الدور
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, role, status')
      .eq('id', user.id)
      .single();

    if (!userData || userData.status !== 'approved') {
      return error('الحساب غير معتمد', 403);
    }

    try {
      requireRole(userData, 'teacher', 'admin');
    } catch (e: any) {
      return error(e.message, 403);
    }

    // 4. تحقق من البيانات
    const body = await req.json();
    const validation = createQuizSchema.safeParse(body);
    if (!validation.success) {
      const firstErrorMessage = validation.error.issues[0]?.message || 'بيانات غير صحيحة';
      return error(firstErrorMessage, 422);
    }

    const { title, description, lesson_ids, config, time_limit_minutes, shuffle_questions, shuffle_options, class_id, attempts_allowed } = validation.data;

    // 5. أنشئ الاختبار
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .insert({
        teacher_id: userData.id,
        class_id: class_id || null,
        title,
        description: description || null,
        lesson_ids,
        config,
        time_limit_minutes: time_limit_minutes || null,
        shuffle_questions: shuffle_questions !== false,
        shuffle_options: shuffle_options !== false,
        published: false,
        attempts_allowed: attempts_allowed || 1,
      })
      .select()
      .single();

    if (quizError || !quiz) {
      console.error('Error creating quiz:', quizError);
      return error('فشل إنشاء الاختبار', 500);
    }

    // 6. أرجع الاختبار الفارغ (الأسئلة تُضاف لاحقاً)
    return success({
      id: quiz.id,
      title: quiz.title,
      message: 'تم إنشاء الاختبار — الآن أضف الأسئلة',
    });

  } catch (err: any) {
    console.error('Quiz creation error:', err);
    return error('خطأ داخلي في الخادم', 500);
  }
}

// ---- قائمة اختبارات المعلم ----
export async function GET(req: NextRequest) {
  try {
    // 1. تحقق من المستخدم
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      return error('غير مصرح', 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return error('جلسة غير صالحة', 401);
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, role, status')
      .eq('id', user.id)
      .single();

    if (!userData || userData.status !== 'approved') {
      return error('الحساب غير معتمد', 403);
    }

    // 2. استخرج معاملات التصفح
    const { searchParams } = new URL(req.url);
    const pagination = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      page_size: searchParams.get('page_size') || '20',
    });

    const status = searchParams.get('status'); // draft, published, all

    // 3. ابني الاستعلام
    let query = supabaseAdmin
      .from('quizzes')
      .select(`
        id,
        title,
        published,
        created_at,
        updated_at,
        questions(count)
      `, { count: 'exact' })
      .eq('teacher_id', userData.id)
      .order('created_at', { ascending: false });

    // فلتر الحالة
    if (status === 'draft') {
      query = query.eq('published', false);
    } else if (status === 'published') {
      query = query.eq('published', true);
    }

    // فلتر الحذف الناعم
    query = query.is('deleted_at', null);

    // التصفح
    const from = (pagination.page - 1) * pagination.page_size;
    const to = from + pagination.page_size - 1;
    query = query.range(from, to);

    const { data: quizzes, count, error: queryError } = await query;

    if (queryError) {
      console.error('Error fetching quizzes:', queryError);
      return error('فشل جلب الاختبارات', 500);
    }

    // 4. أعد النتائج
    return paginated(
      (quizzes || []).map(q => ({
        id: q.id,
        title: q.title,
        published: q.published,
        questions_count: q.questions?.[0]?.count || 0,
        created_at: q.created_at,
        updated_at: q.updated_at,
      })),
      count || 0,
      pagination.page,
      pagination.page_size
    );

  } catch (err: any) {
    console.error('Quizzes list error:', err);
    return error('خطأ داخلي في الخادم', 500);
  }
}