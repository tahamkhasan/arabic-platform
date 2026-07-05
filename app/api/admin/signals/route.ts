// ============================================================
// API: إشارات الأدمن (المرحلة 4 — وضع الرصد والتدخل)
// GET  /api/admin/signals          → رصد كل الإشارات الحالية (يُحدِّث
//                                      أيضاً platform_signals تلقائياً)
// PATCH /api/admin/signals         → تحديث حالة إشارة (dismissed/action_taken)
//
// مبدأ التصميم: GET يُعيد حساب الإشارات من البيانات الحيّة (نفس منطق
// insights/route.ts للطلاب + دالة get_teacher_response_times للمعلمين)
// ويُحدِّث جدول platform_signals (upsert)، ثم يُرجع كل الإشارات pending
// الحالية. لا فعل تلقائي أبداً — الأدمن يقرر التدخل من واجهة المنصة.
// ============================================================

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { success, error } from '@/lib/api-response';

const MIN_STUDENTS_FOR_SIGNAL = 2; // نفس قرار المرحلة 2
const SLOW_RESPONSE_THRESHOLD_RATIO = 1.5; // 50٪ فوق المتوسط العام — قرار صريح من المستخدم

const BLOOM_LABELS: Record<string, string> = {
  remember: 'التذكّر', understand: 'الفهم', apply: 'التطبيق',
  analyze: 'التحليل', evaluate: 'التقييم', create: 'الإبداع',
};
const QTYPE_LABELS: Record<string, string> = {
  multiple_choice: 'الاختيار من متعدد', true_false: 'صح أو خطأ',
  fill_blank: 'ملء الفراغ', essay: 'الأسئلة المقالية',
  matching: 'المطابقة', ordering: 'الترتيب',
  syntax_analysis: 'التحليل النحوي', extraction: 'الاستخراج',
};

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

// ===== GET: رصد كل الإشارات (كل الفصول، كل المعلمين) =====
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const adminData = await getAdmin(token);
    if (!adminData) return error('هذه النقطة مخصَّصة للأدمن فقط', 403);

    const newOrUpdatedSignals: Array<{
      signal_type: 'student_struggling' | 'teacher_slow_response';
      subject_id: string;
      subject_type: 'class' | 'teacher';
      evidence: Record<string, any>;
    }> = [];

    // ── 1) إشارات الطلاب — نفس منطق insights/route.ts، لكن لكل
    // الفصول في المنصة، لا فصول معلم واحد فقط ───────────────────────
    const { data: allClasses } = await supabaseAdmin
      .from('groups')
      .select('id, name, teacher_id, subject_id, users:teacher_id(name, full_name)');

    for (const cls of allClasses || []) {
      const { data: members } = await supabaseAdmin
        .from('group_members')
        .select('student_id, users:student_id(id, name, full_name)')
        .eq('group_id', cls.id);

      const studentIds = (members || []).map((m: any) => m.student_id);
      if (studentIds.length === 0) continue;

      const studentNameMap = new Map<string, string>();
      for (const m of members || []) {
        const u = (m as any).users;
        const resolvedName = u?.name || u?.full_name;
        if (u && resolvedName) studentNameMap.set(u.id, resolvedName);
      }

      let stateQuery = supabaseAdmin
        .from('student_knowledge_state')
        .select('student_id, performance_by_question_type, performance_by_bloom_level')
        .in('student_id', studentIds);
      if (cls.subject_id) stateQuery = stateQuery.eq('subject_id', cls.subject_id);
      const { data: states } = await stateQuery;
      if (!states || states.length === 0) continue;

      const weakAreaMap = new Map<string, { studentIds: Set<string>; accuracies: number[] }>();
      for (const state of states) {
        const studentName = studentNameMap.get(state.student_id);
        if (!studentName) continue;

        const checkArea = (stats: Record<string, { correct: number; total: number }>, areaType: 'question_type' | 'bloom_level') => {
          for (const [key, val] of Object.entries(stats || {})) {
            if (!val || val.total < 2) continue;
            const accuracy = (val.correct / val.total) * 100;
            if (accuracy >= 60) continue;
            const mapKey = `${areaType}:${key}`;
            if (!weakAreaMap.has(mapKey)) weakAreaMap.set(mapKey, { studentIds: new Set(), accuracies: [] });
            const entry = weakAreaMap.get(mapKey)!;
            entry.studentIds.add(state.student_id);
            entry.accuracies.push(accuracy);
          }
        };
        checkArea(state.performance_by_question_type || {}, 'question_type');
        checkArea(state.performance_by_bloom_level || {}, 'bloom_level');
      }

      const signals: any[] = [];
      for (const [mapKey, entry] of weakAreaMap.entries()) {
        if (entry.studentIds.size < MIN_STUDENTS_FOR_SIGNAL) continue;
        const [areaType, areaKey] = mapKey.split(':') as ['question_type' | 'bloom_level', string];
        const label = areaType === 'bloom_level' ? BLOOM_LABELS[areaKey] : QTYPE_LABELS[areaKey];
        signals.push({
          area_type: areaType,
          area_label: label || areaKey,
          affected_count: entry.studentIds.size,
          affected_student_names: Array.from(entry.studentIds).map(id => studentNameMap.get(id)).filter(Boolean),
          avg_accuracy: Math.round((entry.accuracies.reduce((a, b) => a + b, 0) / entry.accuracies.length) * 10) / 10,
        });
      }

      if (signals.length > 0) {
        const teacherUser = (cls as any).users;
        newOrUpdatedSignals.push({
          signal_type: 'student_struggling',
          subject_id: cls.id,
          subject_type: 'class',
          evidence: {
            class_name: cls.name,
            teacher_name: teacherUser?.name || teacherUser?.full_name || 'غير معروف',
            teacher_id: cls.teacher_id,
            signals: signals.sort((a, b) => a.avg_accuracy - b.avg_accuracy),
          },
        });
      }
    }

    // ── 2) إشارات المعلمين — معدل استجابة أبطأ من المتوسط العام
    // بنسبة 50٪ (SLOW_RESPONSE_THRESHOLD_RATIO) ──────────────────────
    const { data: responseTimes } = await supabaseAdmin.rpc('get_teacher_response_times');

    if (responseTimes && responseTimes.length >= 2) {
      const overallAvg = responseTimes.reduce((sum: number, r: any) => sum + r.avg_response_hours, 0) / responseTimes.length;
      const threshold = overallAvg * SLOW_RESPONSE_THRESHOLD_RATIO;

      const teacherIds = responseTimes.map((r: any) => r.teacher_id);
      const { data: teacherUsers } = await supabaseAdmin
        .from('users')
        .select('id, name, full_name')
        .in('id', teacherIds);
      const teacherNameMap = new Map((teacherUsers || []).map(u => [u.id, u.name || u.full_name || 'غير معروف']));

      for (const r of responseTimes) {
        if (r.avg_response_hours > threshold) {
          newOrUpdatedSignals.push({
            signal_type: 'teacher_slow_response',
            subject_id: r.teacher_id,
            subject_type: 'teacher',
            evidence: {
              teacher_name: teacherNameMap.get(r.teacher_id) || 'غير معروف',
              avg_response_hours: r.avg_response_hours,
              overall_avg_hours: Math.round(overallAvg * 10) / 10,
              graded_count: r.graded_count,
              ratio: Math.round((r.avg_response_hours / overallAvg) * 10) / 10,
            },
          });
        }
      }
    }

    // ── 3) upsert كل الإشارات المُكتشَفة في platform_signals ─────────
    // (لا فعل تلقائي — فقط تحديث/إدراج سجل الإشارة نفسها لتظهر للأدمن)
    for (const sig of newOrUpdatedSignals) {
      const { data: existing } = await supabaseAdmin
        .from('platform_signals')
        .select('id')
        .eq('signal_type', sig.signal_type)
        .eq('subject_id', sig.subject_id)
        .eq('status', 'pending')
        .maybeSingle();

      if (existing) {
        await supabaseAdmin
          .from('platform_signals')
          .update({ evidence: sig.evidence, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabaseAdmin.from('platform_signals').insert({
          signal_type: sig.signal_type,
          subject_type: sig.subject_type,
          subject_id: sig.subject_id,
          evidence: sig.evidence,
          severity: 'warning',
        });
      }
    }

    // ── 4) أرجع كل الإشارات pending الحالية (المُحدَّثة للتو) ─────────
    const { data: pendingSignals } = await supabaseAdmin
      .from('platform_signals')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    return success({ signals: pendingSignals || [] });

  } catch (err: any) {
    console.error('Admin signals GET error:', err);
    return error('خطأ داخلي', 500);
  }
}

// ===== PATCH: تحديث حالة إشارة (الأدمن يقرر: تجاهل أو تم التدخل) =====
export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const adminData = await getAdmin(token);
    if (!adminData) return error('هذه النقطة مخصَّصة للأدمن فقط', 403);

    const body = await req.json();
    const { signal_id, status } = body;

    if (!signal_id || !['dismissed', 'action_taken'].includes(status)) {
      return error('signal_id و status (dismissed أو action_taken) مطلوبان', 400);
    }

    const { error: updateError } = await supabaseAdmin
      .from('platform_signals')
      .update({
        status,
        resolved_by: adminData.id,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', signal_id);

    if (updateError) {
      console.error('Error updating signal:', updateError);
      return error('فشل تحديث الإشارة', 500);
    }

    return success({ message: 'تم تحديث حالة الإشارة' });

  } catch (err: any) {
    console.error('Admin signals PATCH error:', err);
    return error('خطأ داخلي', 500);
  }
}