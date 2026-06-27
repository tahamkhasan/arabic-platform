// ============================================================
// app/api/assignments/route.ts — مُعاد بناؤه بالكامل
//
// ── جديد: الجدول الفعلي assignments تبدّل بنيوياً في جلسة مستقلة
// (id, teacher_id, class_id, title, description, type, content_ref
// jsonb, due_date, deleted_at, created_at) — لا subject_id ولا
// content (نص) ولا target_type/target_id ولا max_grade كما كان
// الكود السابق يفترض. التصميم الجديد:
//
// - "المهمة" أصبحت غلافاً حول اختبار موجود فعلياً في quizzes —
//   لا نص حر، بل content_ref = { quiz_id: "..." } يشير لاختبار
//   حقيقي بأسئلته الكاملة (يُعاد استخدام كل نظام الاختبارات).
// - الاستهداف (الكل/فصل/طالب/فصول متعددة) لا يمكن أن يعتمد على
//   عمود class_id المفرد وحده، فأصبح يُخزَّن داخل content_ref
//   نفسه: { quiz_id, target_type: 'all'|'class'|'student',
//   target_ids: [...] }. عمود class_id يبقى null دائماً.
// - type: 'quiz' دائماً حالياً (يمكن توسيعه لاحقاً لأنواع أخرى).
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'

const VALID_TARGET_TYPES = ['all', 'class', 'student'] as const
type TargetType = (typeof VALID_TARGET_TYPES)[number]

interface ContentRef {
  quiz_id: string
  target_type: TargetType
  target_ids: string[] // فصل واحد أو أكثر، أو طالب واحد أو أكثر؛ فاضية لـ'all'
}

async function notify(userId: string, type: string, title: string, body?: string, link?: string) {
  try {
    await supabaseAdmin.from('notifications').insert({ user_id: userId, type, title, body: body ?? null, link: link ?? null, is_read: false })
  } catch {}
}

async function notifyMany(userIds: string[], type: string, title: string, body?: string, link?: string) {
  if (!userIds.length) return
  try {
    await supabaseAdmin.from('notifications').insert(
      userIds.map((uid) => ({ user_id: uid, type, title, body: body ?? null, link: link ?? null, is_read: false }))
    )
  } catch {}
}

// ── جلب كل معرّفات الطلاب الفعليين المستهدفين بمهمة معيّنة ──────
async function resolveTargetStudentIds(ref: ContentRef, teacherId: string): Promise<string[]> {
  if (ref.target_type === 'student') {
    return ref.target_ids
  }

  if (ref.target_type === 'class') {
    if (ref.target_ids.length === 0) return []
    const { data: members } = await supabaseAdmin
      .from('group_members')
      .select('student_id')
      .in('group_id', ref.target_ids)
    return Array.from(new Set((members || []).map((m) => m.student_id)))
  }

  // 'all': كل طلاب فصول هذا المعلم
  const { data: teacherGroups } = await supabaseAdmin
    .from('groups')
    .select('id')
    .eq('teacher_id', teacherId)

  const groupIds = (teacherGroups || []).map((g) => g.id)
  if (groupIds.length === 0) return []

  const { data: members } = await supabaseAdmin
    .from('group_members')
    .select('student_id')
    .in('group_id', groupIds)

  return Array.from(new Set((members || []).map((m) => m.student_id)))
}

const createSchema = z.object({
  teacherId: z.string().uuid('معرّف المعلم غير صالح'),
  quizId: z.string().uuid('معرّف الاختبار غير صالح'),
  title: z.string().min(3, 'العنوان قصير جداً'),
  description: z.string().optional(),
  targetType: z.enum(VALID_TARGET_TYPES),
  targetIds: z.array(z.string().uuid()).optional().default([]),
  dueDate: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const teacherId = searchParams.get('teacherId')

    if (teacherId) {
      const { data, error } = await supabaseAdmin
        .from('assignments')
        .select('id, title, description, type, content_ref, due_date, created_at')
        .eq('teacher_id', teacherId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('GET /api/assignments (teacherId) error:', error)
        return NextResponse.json({ error: error.message || 'فشل جلب المهام.' }, { status: 500 })
      }

      // ── أغنِ كل مهمة بعنوان الاختبار وعدد أسئلته للعرض السريع ──
      const quizIds = Array.from(
        new Set((data || []).map((a) => (a.content_ref as ContentRef)?.quiz_id).filter(Boolean))
      )

      let quizzesById: Record<string, { title: string; questions_count: number }> = {}
      if (quizIds.length > 0) {
        const { data: quizzes } = await supabaseAdmin
          .from('quizzes')
          .select('id, title, questions(count)')
          .in('id', quizIds)

        for (const q of quizzes || []) {
          quizzesById[q.id] = {
            title: q.title,
            questions_count: (q as any).questions?.[0]?.count || 0,
          }
        }
      }

      const enriched = (data || []).map((a) => {
        const ref = a.content_ref as ContentRef
        return {
          ...a,
          quiz_title: ref?.quiz_id ? quizzesById[ref.quiz_id]?.title ?? null : null,
          questions_count: ref?.quiz_id ? quizzesById[ref.quiz_id]?.questions_count ?? 0 : 0,
          target_type: ref?.target_type ?? 'all',
        }
      })

      return NextResponse.json({ assignments: enriched })
    }

    if (studentId) {
      // فصول الطالب (لمطابقة استهداف 'class')
      const { data: memberOf } = await supabaseAdmin
        .from('group_members')
        .select('group_id')
        .eq('student_id', studentId)

      const myGroupIds = new Set((memberOf || []).map((m) => m.group_id))

      const { data: assigns, error } = await supabaseAdmin
        .from('assignments')
        .select('id, title, description, type, content_ref, due_date, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('GET /api/assignments (studentId) error:', error)
        return NextResponse.json({ error: error.message || 'فشل جلب المهام.' }, { status: 500 })
      }

      const relevant = (assigns || []).filter((a) => {
        const ref = a.content_ref as ContentRef
        if (!ref) return false
        if (ref.target_type === 'all') return true
        if (ref.target_type === 'student') return ref.target_ids.includes(studentId)
        if (ref.target_type === 'class') return ref.target_ids.some((id) => myGroupIds.has(id))
        return false
      })

      // حالة تسليم الطالب لكل اختبار مرتبط
      const quizIds = relevant.map((a) => (a.content_ref as ContentRef)?.quiz_id).filter(Boolean)
      let attemptsByQuiz: Record<string, { submitted: boolean; score: number | null }> = {}
      if (quizIds.length > 0) {
        const { data: attempts } = await supabaseAdmin
          .from('quiz_attempts')
          .select('quiz_id, score, submitted_at')
          .eq('student_id', studentId)
          .in('quiz_id', quizIds)

        for (const at of attempts || []) {
          if (at.submitted_at) {
            attemptsByQuiz[at.quiz_id] = { submitted: true, score: at.score }
          }
        }
      }

      const result = relevant.map((a) => {
        const ref = a.content_ref as ContentRef
        const att = attemptsByQuiz[ref.quiz_id]
        return {
          id: a.id,
          title: a.title,
          description: a.description,
          quiz_id: ref.quiz_id,
          due_date: a.due_date,
          created_at: a.created_at,
          submitted: att?.submitted ?? false,
          score: att?.score ?? null,
        }
      })

      return NextResponse.json({ assignments: result })
    }

    return NextResponse.json({ assignments: [] })
  } catch (err) {
    console.error('GET /api/assignments error:', err)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = createSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'بيانات غير صالحة' },
        { status: 422 },
      )
    }

    const { teacherId, quizId, title, description, targetType, targetIds, dueDate } = validation.data

    if ((targetType === 'class' || targetType === 'student') && targetIds.length === 0) {
      return NextResponse.json(
        { error: targetType === 'class' ? 'يجب اختيار فصل واحد على الأقل.' : 'يجب اختيار طالب واحد على الأقل.' },
        { status: 400 },
      )
    }

    // تحقق أن الاختبار موجود فعلياً ويملكه هذا المعلم
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .select('id, teacher_id, title')
      .eq('id', quizId)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: 'الاختبار المحدَّد غير موجود.' }, { status: 404 })
    }
    if (quiz.teacher_id !== teacherId) {
      return NextResponse.json({ error: 'لا يمكنك إرسال اختبار لا تملكه.' }, { status: 403 })
    }

    // تحقق ملكية الفصول إن استُهدِفت فصول
    if (targetType === 'class') {
      const { data: groups } = await supabaseAdmin
        .from('groups')
        .select('id')
        .in('id', targetIds)
        .eq('teacher_id', teacherId)

      if (!groups || groups.length !== targetIds.length) {
        return NextResponse.json({ error: 'أحد الفصول المحدَّدة لا تملكه أو غير موجود.' }, { status: 403 })
      }
    }

    const contentRef: ContentRef = {
      quiz_id: quizId,
      target_type: targetType,
      target_ids: targetIds,
    }

    const { data: assignment, error: insertError } = await supabaseAdmin
      .from('assignments')
      .insert({
        teacher_id: teacherId,
        class_id: null, // الاستهداف الفعلي مُخزَّن في content_ref دوماً
        title,
        description: description ?? null,
        type: 'quiz',
        content_ref: contentRef,
        due_date: dueDate ?? null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('POST /api/assignments insert error:', insertError)
      return NextResponse.json({ error: insertError.message || 'فشل إنشاء المهمة.' }, { status: 500 })
    }

    // إشعارات للطلاب المستهدفين
    const studentIds = await resolveTargetStudentIds(contentRef, teacherId)
    await notifyMany(
      studentIds,
      'new_assignment',
      '📝 مهمة جديدة من معلمك',
      `مهمة جديدة: ${title} (اختبار: ${quiz.title})`,
      `/student/quizzes/${quizId}`,
    )

    return NextResponse.json({ assignment })
  } catch (err) {
    console.error('POST /api/assignments error:', err)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع.' }, { status: 500 })
  }
}

// ── حذف ناعم (deleted_at) — لا حذف فعلي، يحافظ على سجل المهام ───
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const teacherId = searchParams.get('teacherId')

    if (!id || !teacherId) {
      return NextResponse.json({ error: 'معرّف المهمة والمعلم مطلوبان.' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from('assignments')
      .select('id, teacher_id')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'المهمة غير موجودة.' }, { status: 404 })
    }
    if (existing.teacher_id !== teacherId) {
      return NextResponse.json({ error: 'لا يمكنك حذف مهمة لا تملكها.' }, { status: 403 })
    }

    const { error } = await supabaseAdmin
      .from('assignments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message || 'فشل حذف المهمة.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/assignments error:', err)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع.' }, { status: 500 })
  }
}