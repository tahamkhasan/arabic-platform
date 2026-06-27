// ============================================================
// API: نظام الفصول (يستخدم جدول groups الموجود)
// GET: قائمة فصول المعلم مع عدد الطلاب في كل فصل
// POST: إنشاء فصل جديد
// ============================================================

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { success, error, paginated } from '@/lib/api-response';
import { paginationSchema } from '@/lib/validators';
import { z } from 'zod';

// ---- شكل إنشاء فصل ----
const createClassSchema = z.object({
  name: z.string().min(2, 'اسم الفصل قصير جداً').max(100, 'اسم الفصل طويل جداً'),
  level: z.string().min(1, 'اختر المرحلة').optional(),
  subject_id: z.string().uuid('معرّف المادة غير صالح').optional().nullable(),
});

// ---- بديل محلي لدالة getFirstError (موجودة محلياً بدل الاستيراد) ----
function getFirstError(err: z.ZodError) {
  // ZodError uses `issues` to list validation problems
  return (err?.issues?.[0]?.message) || 'بيانات غير صالحة';
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

// ===== GET: قائمة فصول المعلم =====
export async function GET(req: NextRequest) {
  try {
    // 1. تحقق من المستخدم
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    // 2. استخرج معاملات التصفح
    const { searchParams } = new URL(req.url);
    const pagination = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      page_size: searchParams.get('page_size') || '50',
    });

    // 3. جلب الفصول مع عدد الأعضاء
    const from = (pagination.page - 1) * pagination.page_size;
    const to = from + pagination.page_size - 1;

    const { data: groups, count, error: queryError } = await supabaseAdmin
      .from('groups')
      .select(`
        id,
        name,
        level,
        subject_id,
        created_at,
        group_members(count)
      `)
      .eq('teacher_id', userData.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (queryError) {
      console.error('Error fetching classes:', queryError);
      return error('فشل جلب الفصول', 500);
    }

    // 4. جلب أسماء المواد إن وُجدت
    const subjectIds = (groups || [])
      .filter((g: any) => g.subject_id)
      .map((g: any) => g.subject_id);

    let subjectNames: Record<string, string> = {};
    if (subjectIds.length > 0) {
      const { data: subjects } = await supabaseAdmin
        .from('subjects')
        .select('id, name')
        .in('id', subjectIds);

      if (subjects) {
        for (const s of subjects) {
          subjectNames[s.id] = s.name;
        }
      }
    }

    // 5. جلب عدد المهام المفتوحة لكل فصل
    const groupIds = (groups || []).map((g: any) => g.id);
    let openAssignments: Record<string, number> = {};

    if (groupIds.length > 0) {
      const { data: assignments } = await supabaseAdmin
        .from('assignments')
        .select('class_id')
        .in('class_id', groupIds)
        .is('deleted_at', null);

      if (assignments) {
        for (const a of assignments) {
          if (a.class_id) {
            openAssignments[a.class_id] = (openAssignments[a.class_id] || 0) + 1;
          }
        }
      }
    }

    // 6. أعد النتائج
    const items = (groups || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      level: g.level,
      subject_id: g.subject_id,
      subject_name: g.subject_id ? subjectNames[g.subject_id] || null : null,
      students_count: g.group_members?.[0]?.count || 0,
      open_assignments: openAssignments[g.id] || 0,
      created_at: g.created_at,
    }));

    return paginated(items, count || 0, pagination.page, pagination.page_size);

  } catch (err: any) {
    console.error('Classes list error:', err);
    return error('خطأ داخلي', 500);
  }
}

// ===== POST: إنشاء فصل جديد =====
export async function POST(req: NextRequest) {
  try {
    // 1. تحقق من المستخدم
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    if (userData.role !== 'teacher' && userData.role !== 'admin') {
      return error('فقط المعلمون يمكنهم إنشاء فصول', 403);
    }

    // 2. تحقق من البيانات
    const body = await req.json();
    const validation = createClassSchema.safeParse(body);
    if (!validation.success) {
      return error(getFirstError(validation.error), 422);
    }

    const { name, level, subject_id } = validation.data;

    // 3. أنشئ الفصل في جدول groups
    const { data: newGroup, error: insertError } = await supabaseAdmin
      .from('groups')
      .insert({
        teacher_id: userData.id,
        name,
        level: level || null,
        subject_id: subject_id || null,
      })
      .select('id, name, level, subject_id, created_at')
      .single();

    if (insertError || !newGroup) {
      console.error('Error creating class:', insertError);
      return error('فشل إنشاء الفصل', 500);
    }

    return success({
      id: newGroup.id,
      name: newGroup.name,
      message: 'تم إنشاء الفصل بنجاح — الآن أضف الطلاب',
    });

  } catch (err: any) {
    console.error('Class creation error:', err);
    return error('خطأ داخلي', 500);
  }
}