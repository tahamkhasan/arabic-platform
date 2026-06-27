// ============================================================
// API: إدارة طلاب الفصل (يستخدم جدول group_members)
// GET: قائمة طلاب الفصل مع متوسط أدائهم
// POST: إضافة طالب واحد
// DELETE: إزالة طالب
//
// ── مُصحَّح (نهائياً): group_members له فقط id, group_id,
// student_id — حذفنا كل إشارة لـ joined_at (غير موجود) ──────────
// ============================================================

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { success, error, requireValidId } from '@/lib/api-response';
import { z } from 'zod';

const addStudentSchema = z.object({
  student_id: z.string().uuid('معرّف الطالب غير صالح'),
});

const bulkAddSchema = z.object({
  student_ids: z.array(z.string().uuid('معرّف طالب غير صالح'))
    .min(1, 'اختر طالباً واحداً على الأقل')
    .max(50, 'الحد الأقصى 50 طالباً'),
});

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

// ===== GET: قائمة طلاب الفصل =====
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

    const { data: group } = await supabaseAdmin
      .from('groups')
      .select('id, teacher_id')
      .eq('id', groupId)
      .single();

    if (!group) return error('الفصل غير موجود', 404);
    if (group.teacher_id !== userData.id && userData.role !== 'admin') {
      return error('ليس فصلك', 403);
    }

    // ── مُصحَّح نهائياً: لا joined_at ──────────────────────────
    const { data: members, error: membersError } = await supabaseAdmin
      .from('group_members')
      .select(`
        id,
        student_id,
        users:student_id(
          id,
          full_name,
          email,
          allowed_grades,
          status
        )
      `)
      .eq('group_id', groupId);

    if (membersError) {
      console.error('Error fetching students:', membersError);
      return error('فشل جلب الطلاب', 500);
    }

    const studentIds = (members || []).map((m: any) => m.student_id).filter(Boolean);

    let avgScores: Record<string, number | null> = {};
    let lastActivity: Record<string, string | null> = {};

    if (studentIds.length > 0) {
      const { data: attempts } = await supabaseAdmin
        .from('quiz_attempts')
        .select('student_id, score')
        .in('student_id', studentIds)
        .not('score', 'is', null);

      if (attempts && attempts.length > 0) {
        const scoreSums: Record<string, { total: number; count: number }> = {};
        for (const a of attempts) {
          if (!scoreSums[a.student_id]) {
            scoreSums[a.student_id] = { total: 0, count: 0 };
          }
          scoreSums[a.student_id].total += a.score;
          scoreSums[a.student_id].count += 1;
        }
        for (const [sid, sums] of Object.entries(scoreSums)) {
          avgScores[sid] = Math.round(sums.total / sums.count);
        }
      }

      const { data: recentActivity } = await supabaseAdmin
        .from('quiz_attempts')
        .select('student_id, started_at')
        .in('student_id', studentIds)
        .order('started_at', { ascending: false })
        .limit(studentIds.length);

      if (recentActivity) {
        const seen = new Set<string>();
        for (const r of recentActivity) {
          if (!seen.has(r.student_id)) {
            lastActivity[r.student_id] = r.started_at;
            seen.add(r.student_id);
          }
        }
      }
    }

    const students = (members || []).map((m: any) => ({
      member_id: m.id,
      student_id: m.student_id,
      full_name: m.users?.full_name || 'غير معروف',
      email: m.users?.email || null,
      grade: m.users?.allowed_grades?.[0] || null,
      status: m.users?.status || null,
      avg_score: avgScores[m.student_id] ?? null,
      last_activity: lastActivity[m.student_id] || null,
    }));

    return success({
      class_id: groupId,
      students_count: students.length,
      students,
    });

  } catch (err: any) {
    console.error('Students list error:', err);
    return error('خطأ داخلي', 500);
  }
}

// ===== POST: إضافة طالب (واحد أو عدة) =====
export async function POST(
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

    if (userData.role !== 'teacher' && userData.role !== 'admin') {
      return error('فقط المعلمون يمكنهم إضافة طلاب', 403);
    }

    const { data: group } = await supabaseAdmin
      .from('groups')
      .select('id, teacher_id, name')
      .eq('id', groupId)
      .single();

    if (!group) return error('الفصل غير موجود', 404);
    if (group.teacher_id !== userData.id && userData.role !== 'admin') {
      return error('ليس فصلك', 403);
    }

    const body = await req.json();

    let studentIdsToAdd: string[] = [];

    const bulkValidation = bulkAddSchema.safeParse(body);
    if (bulkValidation.success) {
      studentIdsToAdd = bulkValidation.data.student_ids;
    } else {
      const singleValidation = addStudentSchema.safeParse(body);
      if (singleValidation.success) {
        studentIdsToAdd = [singleValidation.data.student_id];
      } else {
        return error(bulkValidation.error.issues[0]?.message || 'بيانات غير صحيحة', 422);
      }
    }

    const { data: students, error: studentsError } = await supabaseAdmin
      .from('users')
      .select('id, role, status, full_name')
      .in('id', studentIdsToAdd);

    if (studentsError) {
      console.error('Error validating students:', studentsError);
      return error('فشل التحقق من الطلاب', 500);
    }

    const validStudents = (students || []).filter(
      (s: any) => s.role === 'student' && s.status === 'approved'
    );

    const invalidCount = studentIdsToAdd.length - validStudents.length;

    const { data: existingMembers } = await supabaseAdmin
      .from('group_members')
      .select('student_id')
      .eq('group_id', groupId);

    const existingIds = new Set((existingMembers || []).map((m: any) => m.student_id));

    const toAdd = validStudents
      .filter((s: any) => !existingIds.has(s.id))
      .map((s: any) => s.id);

    if (toAdd.length === 0) {
      return error(
        invalidCount > 0
          ? `لم يُضاف أي طالب — ${invalidCount} غير صالحين والباقي مُضافون مسبقاً`
          : 'جميع الطلاب مُضافون في هذا الفصل مسبقاً',
        400
      );
    }

    const membersToInsert = toAdd.map((studentId: string) => ({
      group_id: groupId,
      student_id: studentId,
    }));

    const { error: insertError } = await supabaseAdmin
      .from('group_members')
      .insert(membersToInsert);

    if (insertError) {
      console.error('Error adding students:', insertError);
      return error('فشل إضافة الطلاب', 500);
    }

    for (const studentId of toAdd) {
      try {
        await supabaseAdmin.from('notifications').insert({
          user_id: studentId,
          type: 'system',
          title: 'تمت إضافتك لفصل جديد',
          body: `تمت إضافتك لفصل "${group.name || 'بدون اسم'}"`,
        });
      } catch {
        // لا نُفشل إن فشلت الإشعار
      }
    }

    return success({
      message: `تمت إضافة ${toAdd.length} طالب بنجاح`,
      added_count: toAdd.length,
      skipped_existing: existingIds.size > 0 ? studentIdsToAdd.filter(id => existingIds.has(id)).length : 0,
      skipped_invalid: invalidCount,
    });

  } catch (err: any) {
    console.error('Add students error:', err);
    return error('خطأ داخلي', 500);
  }
}

// ===== DELETE: إزالة طالب من الفصل =====
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

    if (userData.role !== 'teacher' && userData.role !== 'admin') {
      return error('فقط المعلمون يمكنهم إزالة طلاب', 403);
    }

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
    const { student_id } = body;

    if (!student_id) {
      return error('معرّف الطالب مطلوب', 400);
    }

    const { data: member } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('student_id', student_id)
      .maybeSingle();

    if (!member) {
      return error('هذا الطالب ليس في هذا الفصل', 404);
    }

    const { error: deleteError } = await supabaseAdmin
      .from('group_members')
      .delete()
      .eq('id', member.id);

    if (deleteError) {
      console.error('Error removing student:', deleteError);
      return error('فشل إزالة الطالب', 500);
    }

    return success({ message: 'تمت إزالة الطالب من الفصل' });

  } catch (err: any) {
    console.error('Remove student error:', err);
    return error('خطأ داخلي', 500);
  }
}