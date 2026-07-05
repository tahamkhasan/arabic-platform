// ============================================================
// API: طلاب المعلم التلقائيون من نطاقات تدريسه (teacher_scopes)
// GET /api/teacher-scopes/students
//
// يُرجع كل طلاب المعلم الحالي، مُجمَّعين حسب نطاق التدريس الذي
// يطابقهم (مرحلة+صف+تشعيب) — لا اعتماد على group_members اليدوي.
// مختلف تماماً عن /api/teacher-scopes (الذي يخدم الأدمن لإدارة
// النطاقات نفسها) — هذا المسار يخدم المعلم نفسه لعرض نتيجة تلك
// النطاقات: من هم طلابه فعلياً.
// ============================================================

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { success, error } from '@/lib/api-response';

const STAGE_LABELS: Record<string, string> = {
  primary: 'الابتدائية', middle: 'المتوسطة', secondary: 'الثانوية',
};
const TRACK_LABELS: Record<string, string> = {
  scientific: 'علمي', literary: 'أدبي',
};

async function getTeacher(token: string) {
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return null;
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('id, role, status')
    .eq('id', user.id)
    .single();
  if (!userData || userData.status !== 'approved') return null;
  if (userData.role !== 'teacher' && userData.role !== 'admin') return null;
  return userData;
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const teacherData = await getTeacher(token);
    if (!teacherData) return error('غير مصرح', 401);

    // 1. نطاقات هذا المعلم
    const { data: scopes, error: scopesError } = await supabaseAdmin
      .from('teacher_scopes')
      .select('id, stage, grade, track, subject_id, subjects:subject_id(name)')
      .eq('teacher_id', teacherData.id);

    if (scopesError) {
      console.error('Error fetching teacher scopes:', scopesError);
      return error('فشل جلب نطاقات التدريس', 500);
    }

    if (!scopes || scopes.length === 0) {
      return success({ scopes: [] });
    }

    // 2. لكل نطاق: اجلب الطلاب المطابقين فعلياً (نفس منطق المطابقة
    // المستخدَم في دالة get_students_in_teacher_scope، لكن مُنفَّذ
    // هنا مباشرة لكل نطاق على حدة، للحصول على تفاصيل كل طالب
    // (الاسم) لا فقط المعرّف) ─────────────────────────────────────
    const result = [];
    for (const scope of scopes) {
      let studentsQuery = supabaseAdmin
        .from('users')
        .select('id, full_name, email')
        .eq('user_type', 'student')
        .eq('status', 'approved')
        .contains('allowed_stages', [scope.stage])
        .contains('allowed_grades', [scope.grade]);

      if (scope.track) studentsQuery = studentsQuery.eq('track', scope.track);

      const { data: students, error: studentsError } = await studentsQuery;
      if (studentsError) {
        console.error('Error fetching students for scope:', studentsError);
        continue;
      }

      const needsTrackLabel = scope.grade === '11' || scope.grade === '12';
      const subjectName = (scope as any).subjects?.name;

      result.push({
        scope_id: scope.id,
        stage: scope.stage,
        stage_label: STAGE_LABELS[scope.stage] || scope.stage,
        grade: scope.grade,
        track: scope.track,
        track_label: scope.track && needsTrackLabel ? TRACK_LABELS[scope.track] : null,
        subject_name: subjectName || null,
        students: (students || []).map(s => ({
          id: s.id,
          name: s.full_name || 'بلا اسم',
          email: s.email,
        })),
      });
    }

    return success({ scopes: result });

  } catch (err: any) {
    console.error('Teacher scope students error:', err);
    return error('خطأ داخلي', 500);
  }
}