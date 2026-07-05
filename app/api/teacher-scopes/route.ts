// ============================================================
// API: نطاقات تدريس المعلمين (teacher_scopes)
// GET    /api/teacher-scopes?teacherId=...  → جلب نطاقات معلم معيّن
// POST   /api/teacher-scopes                → إضافة نطاق جديد
// DELETE /api/teacher-scopes                → حذف نطاق (بمعرّفه)
//
// مقيَّدة بالأدمن فقط — الأدمن وحده يُخصِّص نطاقات التدريس.
// ============================================================

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { success, error } from '@/lib/api-response';

async function getAdmin(token: string) {
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return null;
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('id, role, status')
    .eq('id', user.id)
    .single();
  if (!userData || userData.status !== 'approved' || userData.role !== 'admin') return null;
  return userData;
}

// ===== GET: نطاقات معلم معيّن + عدد الطلاب الواقعين في كل نطاق =====
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const adminData = await getAdmin(token);
    if (!adminData) return error('هذه النقطة مخصَّصة للأدمن فقط', 403);

    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get('teacherId');
    if (!teacherId) return error('teacherId مطلوب', 400);

    const { data: scopes, error: scopesError } = await supabaseAdmin
      .from('teacher_scopes')
      .select('id, stage, grade, track, subject_id, created_at, subjects:subject_id(name)')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (scopesError) {
      console.error('Error fetching teacher scopes:', scopesError);
      return error('فشل جلب نطاقات التدريس', 500);
    }

    // ── لكل نطاق: عدد الطلاب الواقعين فيه فعلياً، للشفافية في الواجهة ──
    const items = [];
    for (const scope of scopes || []) {
      let countQuery = supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('user_type', 'student')
        .eq('status', 'approved')
        .contains('allowed_stages', [scope.stage])
        .contains('allowed_grades', [scope.grade]);

      if (scope.track) countQuery = countQuery.eq('track', scope.track);

      const { count } = await countQuery;
      items.push({ ...scope, students_count: count ?? 0 });
    }

    return success({ items });

  } catch (err: any) {
    console.error('Teacher scopes GET error:', err);
    return error('خطأ داخلي', 500);
  }
}

// ===== POST: إضافة نطاق تدريس جديد لمعلم =====
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const adminData = await getAdmin(token);
    if (!adminData) return error('هذه النقطة مخصَّصة للأدمن فقط', 403);

    const body = await req.json();
    const { teacher_id, stage, grade, track, subject_id } = body;

    if (!teacher_id || !stage || !grade) {
      return error('teacher_id و stage و grade مطلوبة', 400);
    }

    const needsTrack = grade === '11' || grade === '12';
    if (needsTrack && !track) {
      return error('هذا الصف يتطلب تحديد التشعيب (علمي/أدبي)', 400);
    }

    const { data: newScope, error: insertError } = await supabaseAdmin
      .from('teacher_scopes')
      .insert({
        teacher_id,
        stage,
        grade,
        track: needsTrack ? track : null,
        subject_id: subject_id || null,
        assigned_by: adminData.id,
      })
      .select('id')
      .single();

    if (insertError) {
      // خطأ تكرار (unique constraint) يعني هذا النطاق موجود بالفعل
      if (insertError.code === '23505') {
        return error('هذا النطاق مُخصَّص فعلياً لهذا المعلم', 409);
      }
      console.error('Error creating teacher scope:', insertError);
      return error('فشل إضافة نطاق التدريس', 500);
    }

    return success({ id: newScope.id, message: 'تم إضافة نطاق التدريس بنجاح' });

  } catch (err: any) {
    console.error('Teacher scopes POST error:', err);
    return error('خطأ داخلي', 500);
  }
}

// ===== DELETE: حذف نطاق تدريس =====
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const adminData = await getAdmin(token);
    if (!adminData) return error('هذه النقطة مخصَّصة للأدمن فقط', 403);

    const body = await req.json();
    const { scope_id } = body;
    if (!scope_id) return error('scope_id مطلوب', 400);

    const { error: deleteError } = await supabaseAdmin
      .from('teacher_scopes')
      .delete()
      .eq('id', scope_id);

    if (deleteError) {
      console.error('Error deleting teacher scope:', deleteError);
      return error('فشل حذف نطاق التدريس', 500);
    }

    return success({ message: 'تم حذف نطاق التدريس' });

  } catch (err: any) {
    console.error('Teacher scopes DELETE error:', err);
    return error('خطأ داخلي', 500);
  }
}