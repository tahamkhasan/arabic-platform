// ============================================================
// API: تفاصيل فصل واحد + تعديل + حذف
// GET: تفاصيل الفصل مع قائمة الطلاب
// PATCH: تعديل اسم الفصل
// DELETE: حذف الفصل
//
// ── مُصحَّح (نهائياً): جدول group_members يحتوي فقط على
// id, group_id, student_id — لا يوجد عمود joined_at إطلاقاً.
// كان طلب عمود غير موجود في select()/order() يُسقط الاستعلام
// بصمت، فترجع قائمة الطلاب فاضية رغم وجود الصفوف فعلياً.
// التصحيح السابق (allowed_grades بدل grade) كان صحيحاً أيضاً
// ومطلوباً، لكنه لم يكن كافياً بمفرده. ─────────────────────────
// ============================================================

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { success, error, requireValidId } from '@/lib/api-response';
import { z } from 'zod';

const updateClassSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  level: z.string().optional().nullable(),
  subject_id: z.string().uuid().optional().nullable(),
});

function getFirstError(err: z.ZodError<any>) {
  return (err.issues?.[0]?.message) || 'خطأ في البيانات';
}

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

// ===== GET: تفاصيل الفصل =====
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;

    try { requireValidId(groupId, 'class_id'); } catch (e: any) {
      return error(e.message, 400);
    }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return error('الفصل غير موجود', 404);
    }

    if (group.teacher_id !== userData.id && userData.role !== 'admin') {
      return error('ليس فصلك', 403);
    }

    let subjectName: string | null = null;
    if (group.subject_id) {
      const { data: subject } = await supabaseAdmin
        .from('subjects')
        .select('name')
        .eq('id', group.subject_id)
        .single();
      subjectName = subject?.name || null;
    }

    // ── مُصحَّح نهائياً: لا joined_at، لا allowed_grades (هما
    // الإصلاحان المتراكمان معاً) ──────────────────────────────
    const { data: members, error: membersError } = await supabaseAdmin
      .from('group_members')
      .select(`
        id,
        student_id,
        users:student_id(
          id,
          full_name,
          email,
          allowed_grades
        )
      `)
      .eq('group_id', groupId);

    if (membersError) {
      console.error('Error fetching class members:', membersError);
    }

    const { count: assignmentCount } = await supabaseAdmin
      .from('assignments')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', groupId)
      .is('deleted_at', null);

    return success({
      id: group.id,
      name: group.name,
      level: group.level,
      subject_id: group.subject_id,
      subject_name: subjectName,
      teacher_id: group.teacher_id,
      created_at: group.created_at,
      students_count: members?.length || 0,
      assignments_count: assignmentCount || 0,
      students: (members || []).map((m: any) => ({
        member_id: m.id,
        student_id: m.student_id,
        full_name: m.users?.full_name || 'غير معروف',
        email: m.users?.email || null,
        grade: m.users?.allowed_grades?.[0] || null,
      })),
    });

  } catch (err: any) {
    console.error('Class detail error:', err);
    return error('خطأ داخلي', 500);
  }
}

// ===== PATCH: تعديل الفصل =====
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;

    try { requireValidId(groupId, 'class_id'); } catch (e: any) {
      return error(e.message, 400);
    }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    const { data: group } = await supabaseAdmin
      .from('groups')
      .select('id, teacher_id')
      .eq('id', groupId)
      .single();

    if (!group) return error('الفصل غير موجود', 404);
    if (group.teacher_id !== userData.id && userData.role !== 'admin') {
      return error('ليس فصلك', 403);
    }

    const body = await req.json();
    const validation = updateClassSchema.safeParse(body);
    if (!validation.success) {
      return error(getFirstError(validation.error), 422);
    }

    const { name, level, subject_id } = validation.data;

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (level !== undefined) updateData.level = level;
    if (subject_id !== undefined) updateData.subject_id = subject_id;

    const { error: updateError } = await supabaseAdmin
      .from('groups')
      .update(updateData)
      .eq('id', groupId);

    if (updateError) {
      console.error('Error updating class:', updateError);
      return error('فشل تعديل الفصل', 500);
    }

    return success({ message: 'تم تعديل الفصل بنجاح' });

  } catch (err: any) {
    console.error('Class update error:', err);
    return error('خطأ داخلي', 500);
  }
}

// ===== DELETE: حذف الفصل =====
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;

    try { requireValidId(groupId, 'class_id'); } catch (e: any) {
      return error(e.message, 400);
    }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    const { data: group } = await supabaseAdmin
      .from('groups')
      .select('id, teacher_id')
      .eq('id', groupId)
      .single();

    if (!group) return error('الفصل غير موجود', 404);
    if (group.teacher_id !== userData.id && userData.role !== 'admin') {
      return error('ليس فصلك', 403);
    }

    const { count: assignmentCount } = await supabaseAdmin
      .from('assignments')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', groupId)
      .is('deleted_at', null);

    if (assignmentCount && assignmentCount > 0) {
      return error(
        `لا يمكن حذف فصل عليه ${assignmentCount} مهام — احذف المهام أولاً أو ألغِ إسنادها`,
        409,
        'HAS_ASSIGNMENTS'
      );
    }

    await supabaseAdmin
      .from('group_members')
      .delete()
      .eq('group_id', groupId);

    const { error: deleteError } = await supabaseAdmin
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (deleteError) {
      console.error('Error deleting class:', deleteError);
      return error('فشل حذف الفصل', 500);
    }

    return success({ message: 'تم حذف الفصل وكل طلابه' });

  } catch (err: any) {
    console.error('Class delete error:', err);
    return error('خطأ داخلي', 500);
  }
}