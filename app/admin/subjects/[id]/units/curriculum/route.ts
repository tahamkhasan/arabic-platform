import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// app/api/subjects/[id]/curriculum/route.ts
// عام (بلا حماية) — يطابق نمط قراءة subjects/units/lessons
// [id] هنا هو subject_id

type Context = {
  params: Promise<{ id: string }>
}

// ══════════════════════════════════════════════════════════════
// GET — شجرة المنهج كاملة لمادة واحدة: مادة + وحدات + دروس
// يفلتر is_active = true على الوحدات والدروس فقط
// (نسخة العرض للطالب/المعلم — لا تُظهر المسودات المعطّلة من لوحة الأدمن)
// ══════════════════════════════════════════════════════════════
export async function GET(_req: NextRequest, context: Context) {
  try {
    const { id: subjectId } = await context.params

    const { data: subject, error: subjectError } = await supabaseAdmin
      .from('subjects')
      .select('id, name, description, stage, grade, icon, is_active')
      .eq('id', subjectId)
      .maybeSingle()

    if (subjectError) throw subjectError
    if (!subject || !subject.is_active) {
      return NextResponse.json({ error: 'المادة غير موجودة.' }, { status: 404 })
    }

    const { data: units, error: unitsError } = await supabaseAdmin
      .from('units')
      .select('id, name, description, order_num, icon')
      .eq('subject_id', subjectId)
      .eq('is_active', true)
      .order('order_num', { ascending: true })

    if (unitsError) throw unitsError

    const unitIds = (units || []).map(u => u.id)

    const { data: lessons, error: lessonsError } = unitIds.length
      ? await supabaseAdmin
          .from('lessons')
          .select('id, unit_id, name, description, video_url, order_num')
          .in('unit_id', unitIds)
          .eq('is_active', true)
          .order('order_num', { ascending: true })
      : { data: [] as any[], error: null }

    if (lessonsError) throw lessonsError

    const lessonIds = (lessons || []).map(l => l.id)

    const { data: quizRows } = lessonIds.length
      ? await supabaseAdmin.from('lesson_quizzes').select('lesson_id').in('lesson_id', lessonIds)
      : { data: [] as { lesson_id: string }[] }

    const quizLessonIds = new Set((quizRows || []).map(q => q.lesson_id))

    const lessonsByUnit = new Map<string, any[]>()
    for (const lesson of lessons || []) {
      const list = lessonsByUnit.get(lesson.unit_id) || []
      list.push({
        id: lesson.id,
        name: lesson.name,
        description: lesson.description,
        video_url: lesson.video_url,
        order_num: lesson.order_num,
        has_quiz: quizLessonIds.has(lesson.id),
      })
      lessonsByUnit.set(lesson.unit_id, list)
    }

    const curriculumUnits = (units || []).map(unit => ({
      id: unit.id,
      name: unit.name,
      description: unit.description,
      order_num: unit.order_num,
      icon: unit.icon,
      lessons: lessonsByUnit.get(unit.id) || [],
    }))

    return NextResponse.json({ subject, units: curriculumUnits })
  } catch (error: any) {
    console.error('GET /api/subjects/[id]/curriculum error:', error)
    return NextResponse.json({ error: 'فشل تحميل المنهج.' }, { status: 500 })
  }
}