import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type StudioOutputType =
  | 'lesson_summary'
  | 'mcq_quiz'
  | 'short_explainer_video'

type StudioProject = {
  id: string
  title: string | null
  output_type: StudioOutputType | null
  status: 'draft' | 'processing' | 'completed' | 'error' | null
  source_type: 'pdf' | 'text' | 'image' | 'video' | null
  created_at: string
  updated_at: string | null
}

export async function POST(req: NextRequest) {
  // نقرأ id من آخر جزء في المسار كما فعلنا في DELETE
  const url = new URL(req.url)
  const segments = url.pathname.split('/')
  const projectId = segments[segments.length - 2] // .../[id]/generate-summary

  if (!projectId) {
    return NextResponse.json(
      { error: 'لم يتم تمرير معرف المشروع في المسار.' },
      { status: 400 }
    )
  }

  try {
    // 1) جلب المشروع للتأكد من نوع المخرج وحالته
    const { data: project, error: fetchError } = await supabaseAdmin
      .from('studio_projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (fetchError) {
      console.error('Error fetching project for summary:', fetchError)
      return NextResponse.json(
        { error: 'تعذر جلب المشروع قبل توليد الملخص.' },
        { status: 500 }
      )
    }

    if (!project) {
      return NextResponse.json(
        { error: 'المشروع غير موجود.' },
        { status: 404 }
      )
    }

    // يمكن أن تشترط أن نوع المخرج هو lesson_summary
    if (project.output_type !== 'lesson_summary') {
      return NextResponse.json(
        {
          error:
            'نوع المخرج لهذا المشروع ليس "ملخص درس". عدّل نوع المخرج أولاً ثم أعد المحاولة.',
        },
        { status: 400 }
      )
    }

    // 2) تحديث حالة المشروع إلى "قيد المعالجة"
    await supabaseAdmin
      .from('studio_projects')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)

    // 3) هنا منطق التوليد الفعلي للملخص:
    // - يمكنك قراءة المادة المصدرية من جدول آخر (مثلاً studio_sources)
    // - إرسالها إلى خدمة الملخصات (مداد / OpenAI / خدمة داخلية)
    // - حفظ الملخص الناتج في جدول آخر (مثلاً studio_summaries)
    // في هذا المثال نضع ملخصًا تجريبيًا ونعتبر أنه تم التوليد بنجاح.

    const fakeSummary =
      'هذا ملخص تجريبي لدرس التورية. هنا سيظهر الملخص الحقيقي بعد ربط الخدمة الفعلية.'

    const { error: summaryError } = await supabaseAdmin
      .from('studio_summaries')
      .insert({
        project_id: projectId,
        content: fakeSummary,
        created_at: new Date().toISOString(),
      })

    if (summaryError) {
      console.error('Error saving summary:', summaryError)
      // نرجع حالة المشروع إلى "error"
      await supabaseAdmin
        .from('studio_projects')
        .update({
          status: 'error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)

      return NextResponse.json(
        { error: 'تم توليد الملخص لكن تعذر حفظه في القاعدة.' },
        { status: 500 }
      )
    }

    // 4) تحديث حالة المشروع إلى "منجز"
    await supabaseAdmin
      .from('studio_projects')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)

    return NextResponse.json(
      {
        message: 'تم توليد ملخص الدرس بنجاح.',
        projectId,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error(
      'Unexpected error in POST /studio/projects/[id]/generate-summary:',
      err
    )
    // حالة خطأ عامة
    await supabaseAdmin
      .from('studio_projects')
      .update({
        status: 'error',
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)

    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع أثناء توليد الملخص.' },
      { status: 500 }
    )
  }
}