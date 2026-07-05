// ============================================================
// API: تنبيهات المعلم الاستباقية (المرحلة 2)
// GET /api/teacher/insights
//
// يجمع نقاط الضعف المشتركة بين طلاب كل فصل للمعلم، بناءً على
// student_knowledge_state (المرحلة 1). إشارة واحدة تُصدَر فقط إذا
// تكرّر نفس نوع الخلل (نفس area_type + area_key) عند طالبَين أو
// أكثر في الفصل نفسه — حد أدنى صريح بقرار من المستخدم.
//
// لا يُعدِّل أي بيانات — قراءة فقط، آمن تماماً.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { success, error } from '@/lib/api-response';

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

const MIN_STUDENTS_FOR_SIGNAL = 2; // ── حد أدنى صريح بقرار المستخدم ──

interface ClassInsight {
  class_id: string;
  class_name: string;
  signals: {
    area_type: 'question_type' | 'bloom_level';
    area_key: string;
    area_label: string;
    affected_count: number;
    affected_student_names: string[];
    avg_accuracy: number;
  }[];
  struggling_students: { id: string; name: string; overall_accuracy: number | null }[];
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

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);
    if (userData.role !== 'teacher' && userData.role !== 'admin') {
      return error('هذه النقطة مخصَّصة للمعلمين فقط', 403);
    }

    // ── فصول المعلم (groups) — نقرأ subject_id أيضاً لتصفية حالة
    // المعرفة على مادة الفصل بالتحديد، لا كل مواد الطالب ─────────
    const { data: classes } = await supabaseAdmin
      .from('groups')
      .select('id, name, subject_id')
      .eq('teacher_id', userData.id);

    if (!classes || classes.length === 0) {
      return success({ classes: [] });
    }

    const insights: ClassInsight[] = [];

    for (const cls of classes) {
      // طلاب هذا الفصل — نقرأ name وfull_name معاً، لأن نظام
      // المستخدمين الحالي يخزّن الاسم في أحدهما حسب طريقة إنشاء
      // الحساب (تسجيل ذاتي يضع name، إنشاء يدوي يضع full_name) —
      // الاعتماد على عمود واحد فقط كان يُسقط طلاباً بصمت من التجميع
      const { data: members } = await supabaseAdmin
        .from('group_members')
        .select('student_id, users:student_id(id, full_name)')
        .eq('group_id', cls.id);

      const studentIds = (members || []).map((m: any) => m.student_id);
      if (studentIds.length === 0) continue;

      const studentNameMap = new Map<string, string>();
      for (const m of members || []) {
        const u = (m as any).users;
        const resolvedName = u?.full_name;
        if (u && resolvedName) studentNameMap.set(u.id, resolvedName);
      }

      // حالة معرفة كل طالب في هذا الفصل — مُصفّاة بمادة الفصل
      // بالتحديد (groups.subject_id) إن وُجدت، لأن التنبيه يجب أن
      // يخص مادة هذا الفصل لا أي مادة أخرى يدرسها الطالب عرضاً ──
      let stateQuery = supabaseAdmin
        .from('student_knowledge_state')
        .select('student_id, subject_id, performance_by_question_type, performance_by_bloom_level, overall_accuracy, is_struggling')
        .in('student_id', studentIds);

      if (cls.subject_id) {
        stateQuery = stateQuery.eq('subject_id', cls.subject_id);
      }

      const { data: states } = await stateQuery;

      if (!states || states.length === 0) continue;

      // ── تجميع نقاط الضعف المشتركة عبر الطلاب ──────────────────
      // مفتاح التجميع: area_type:area_key (مثال: "question_type:fill_blank")
      const weakAreaMap = new Map<string, { studentIds: Set<string>; accuracies: number[] }>();

      for (const state of states) {
        const studentName = studentNameMap.get(state.student_id);
        if (!studentName) continue;

        const checkArea = (
          stats: Record<string, { correct: number; total: number }>,
          areaType: 'question_type' | 'bloom_level'
        ) => {
          for (const [key, val] of Object.entries(stats || {})) {
            // ── الحد الأدنى للعيّنة: 2 مؤقتاً (بدل 3) — المنصة في
            // مرحلة تجميع بيانات أولى، وأغلب الطلاب لم يخوضوا إلا
            // محاولة أو محاولتين فعلياً حتى الآن. يُنصَح برفعه إلى 3
            // فأكثر تلقائياً بعد تراكم بيانات كافية (راجع لاحقاً) ──
            if (!val || val.total < 2) continue;
            const accuracy = (val.correct / val.total) * 100;
            if (accuracy >= 60) continue; // ضعف حقيقي فقط

            const mapKey = `${areaType}:${key}`;
            if (!weakAreaMap.has(mapKey)) {
              weakAreaMap.set(mapKey, { studentIds: new Set(), accuracies: [] });
            }
            const entry = weakAreaMap.get(mapKey)!;
            entry.studentIds.add(state.student_id);
            entry.accuracies.push(accuracy);
          }
        };

        checkArea(state.performance_by_question_type || {}, 'question_type');
        checkArea(state.performance_by_bloom_level || {}, 'bloom_level');
      }

      // ── تحويل إلى إشارات فعلية، فقط ما تجاوز الحد الأدنى ───────
      const signals: ClassInsight['signals'] = [];
      for (const [mapKey, entry] of weakAreaMap.entries()) {
        if (entry.studentIds.size < MIN_STUDENTS_FOR_SIGNAL) continue;

        const [areaType, areaKey] = mapKey.split(':') as ['question_type' | 'bloom_level', string];
        const label = areaType === 'bloom_level' ? BLOOM_LABELS[areaKey] : QTYPE_LABELS[areaKey];

        signals.push({
          area_type: areaType,
          area_key: areaKey,
          area_label: label || areaKey,
          affected_count: entry.studentIds.size,
          affected_student_names: Array.from(entry.studentIds)
            .map(id => studentNameMap.get(id))
            .filter((n): n is string => !!n),
          avg_accuracy: Math.round(
            (entry.accuracies.reduce((a, b) => a + b, 0) / entry.accuracies.length) * 10
          ) / 10,
        });
      }

      // ── الطلاب المتعثرون فعلياً في هذا الفصل (من is_struggling) ──
      const strugglingStudents = states
        .filter(s => s.is_struggling)
        .map(s => ({
          id: s.student_id,
          name: studentNameMap.get(s.student_id) || 'طالب',
          overall_accuracy: s.overall_accuracy,
        }));

      if (signals.length > 0 || strugglingStudents.length > 0) {
        // الأضعف أولاً
        signals.sort((a, b) => a.avg_accuracy - b.avg_accuracy);
        insights.push({
          class_id: cls.id,
          class_name: cls.name,
          signals,
          struggling_students: strugglingStudents,
        });
      }
    }

    return success({ classes: insights });

  } catch (err: any) {
    console.error('Teacher insights error:', err);
    return error('خطأ داخلي', 500);
  }
}