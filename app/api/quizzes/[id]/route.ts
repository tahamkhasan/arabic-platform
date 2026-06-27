// ============================================================
// API: تفاصيل اختبار واحد + إضافة أسئلة + تعديل + نشر + حذف
// GET: تفاصيل اختبار (مع الأسئلة أو بدونها حسب الدور)
// PATCH: تعديل اختبار أو إضافة أسئلة أو نشر
// DELETE: حذف اختبار (حذف ناعم)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { success, error, requireRole, requireValidId } from '@/lib/api-response';
import { z } from 'zod';

// ---- شكل السؤال للإضافة ----
const questionSchema = z.object({
  type: z.enum([
    'multiple_choice', 'true_false', 'fill_blank', 'matching',
    'ordering', 'syntax_analysis', 'extraction', 'essay'
  ]),
  text: z.string().min(1, 'نص السؤال مطلوب'),
  image_url: z.string().url().optional().nullable(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string().min(1),
    is_correct: z.boolean(),
  })).optional().nullable(),
  correct_answer: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  explanation: z.string().default(''),
  points: z.number().int().min(1).default(1),
  hint: z.string().optional().nullable(),
  bloom_level: z.enum(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']).optional().nullable(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().nullable(),
  lesson_id: z.string().uuid().optional().nullable(),
  syntax_target: z.string().optional().nullable(),
});

const addQuestionsSchema = z.object({
  action: z.literal('add_questions'),
  questions: z.array(questionSchema).min(1, 'أضف سؤالاً واحداً على الأقل').max(50, 'الحد الأقصى 50 سؤالاً'),
});

const publishSchema = z.object({
  action: z.literal('publish'),
  class_id: z.string().uuid().optional().nullable(),
});

const updateTitleSchema = z.object({
  action: z.literal('update'),
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  time_limit_minutes: z.number().int().min(1).max(180).optional().nullable(),
  shuffle_questions: z.boolean().optional(),
  shuffle_options: z.boolean().optional(),
  attempts_allowed: z.number().int().min(1).max(10).optional(),
});

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

// ---- GET: تفاصيل اختبار ----
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // تحقق من UUID
    try { requireValidId(id, 'quiz_id'); } catch (e: any) { return error(e.message, 400); }

    // تحقق من المستخدم
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    // جلب الاختبار
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (quizError || !quiz) {
      return error('الاختبار غير موجود', 404);
    }

    // جلب الأسئلة مرتبة
    const { data: questions, error: qError } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('quiz_id', id)
      .order('sort_order', { ascending: true });

    // للطالب: أخفِ الإجابات الصحيحة
    let finalQuestions = questions || [];
    if (userData.role === 'student') {
      finalQuestions = finalQuestions.map(q => ({
        ...q,
        correct_answer: undefined,
        options: q.options ? q.options.map((o: any) => ({
          id: o.id,
          text: o.text,
          is_correct: undefined,
        })) : undefined,
      }));
    }

    return success({
      ...quiz,
      questions: finalQuestions,
      questions_count: finalQuestions.length,
      total_points: finalQuestions.reduce((sum: number, q: any) => sum + (q.points || 1), 0),
    });

  } catch (err: any) {
    console.error('Quiz detail error:', err);
    return error('خطأ داخلي', 500);
  }
}

// ---- PATCH: تعديل / إضافة أسئلة / نشر ----
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    try { requireValidId(id, 'quiz_id'); } catch (e: any) { return error(e.message, 400); }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    try { requireRole(userData, 'teacher', 'admin'); } catch (e: any) { return error(e.message, 403); }

    // تحقق أن الاختبار موجود وللمعلم نفسه
    const { data: quiz } = await supabaseAdmin
      .from('quizzes')
      .select('id, teacher_id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (!quiz) return error('الاختبار غير موجود', 404);
    if (quiz.teacher_id !== userData.id) return error('ليس اختبارك', 403);

    // قراءة Body
    const body = await req.json();

    // ---- حالة 1: إضافة أسئلة ----
    const addValidation = addQuestionsSchema.safeParse(body);
    if (addValidation.success) {
      const { questions } = addValidation.data;

      // احسب ترتيب البداية
      const { count: existingCount } = await supabaseAdmin
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('quiz_id', id);

      const startOrder = (existingCount || 0) + 1;

      const questionsToInsert = questions.map((q, i) => ({
        quiz_id: id,
        type: q.type,
        text: q.text,
        image_url: q.image_url || null,
        options: q.options || null,
        correct_answer: q.correct_answer !== undefined ? q.correct_answer : null,
        explanation: q.explanation,
        points: q.points,
        hint: q.hint || null,
        bloom_level: q.bloom_level || null,
        difficulty: q.difficulty || null,
        lesson_id: q.lesson_id || null,
        syntax_target: q.syntax_target || null,
        source: 'manual',
        sort_order: startOrder + i,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('questions')
        .insert(questionsToInsert);

      if (insertError) {
        console.error('Error inserting questions:', insertError);
        return error('فشل إضافة الأسئلة', 500);
      }

      // حدّث تاريخ التعديل
      await supabaseAdmin
        .from('quizzes')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id);

      return success({
        message: `تمت إضافة ${questions.length} سؤال بنجاح`,
        added_count: questions.length,
      });
    }

    // ---- حالة 2: نشر الاختبار ----
    const publishValidation = publishSchema.safeParse(body);
    if (publishValidation.success) {
      const { class_id } = publishValidation.data;

      // تحقق أن هناك أسئلة
      const { count: qCount } = await supabaseAdmin
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('quiz_id', id);

      if (!qCount || qCount === 0) {
        return error('لا يمكن نشر اختبار بدون أسئلة — أضف أسئلة أولاً', 400);
      }

      // حدّث الفصل إن وُجد
      const updateData: Record<string, any> = {
        published: true,
        updated_at: new Date().toISOString(),
      };
      if (class_id) {
        updateData.class_id = class_id;
      }

      const { error: publishError } = await supabaseAdmin
        .from('quizzes')
        .update(updateData)
        .eq('id', id);

      if (publishError) {
        console.error('Error publishing quiz:', publishError);
        return error('فشل نشر الاختبار', 500);
      }

      return success({ message: 'تم نشر الاختبار بنجاح' });
    }

    // ---- حالة 3: تعديل بيانات الاختبار ----
    const updateValidation = updateTitleSchema.safeParse(body);
    if (updateValidation.success) {
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      const { action, ...fields } = updateValidation.data;
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) {
          updateData[key] = value;
        }
      }

      const { error: updateError } = await supabaseAdmin
        .from('quizzes')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        console.error('Error updating quiz:', updateError);
        return error('فشل تعديل الاختبار', 500);
      }

      return success({ message: 'تم تعديل الاختبار بنجاح' });
    }

    // لم يتطابق مع أي schema
    return error('الإجراء غير معروف — استخدم action: add_questions أو publish أو update', 400);

  } catch (err: any) {
    console.error('Quiz patch error:', err);
    return error('خطأ داخلي', 500);
  }
}

// ---- DELETE: حذف ناعم ----
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    try { requireValidId(id, 'quiz_id'); } catch (e: any) { return error(e.message, 400); }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    try { requireRole(userData, 'teacher', 'admin'); } catch (e: any) { return error(e.message, 403); }

    // تحقق من الملكية
    const { data: quiz } = await supabaseAdmin
      .from('quizzes')
      .select('id, teacher_id, published')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (!quiz) return error('الاختبار غير موجود', 404);
    if (quiz.teacher_id !== userData.id) return error('ليس اختبارك', 403);
    if (quiz.published) return error('لا يمكن حذف اختبار منشور — ألغِ النشر أولاً', 400);

    // حذف ناعم
    const { error: deleteError } = await supabaseAdmin
      .from('quizzes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting quiz:', deleteError);
      return error('فشل حذف الاختبار', 500);
    }

    return success({ message: 'تم حذف الاختبار' });

  } catch (err: any) {
    console.error('Quiz delete error:', err);
    return error('خطأ داخلي', 500);
  }
}