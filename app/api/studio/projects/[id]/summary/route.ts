import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params

  if (!projectId) {
    return NextResponse.json(
      { error: 'لم يتم تمرير معرّف المشروع.' },
      { status: 400 }
    )
  }

  try {
    const { data: summary, error } = await supabaseAdmin
      .from('studio_summaries')
      .select('id, project_id, content, created_at, updated_at')
      .eq('project_id', projectId)
      .single()

    if (error?.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'لا يوجد ملخص محفوظ لهذا المشروع بعد.' },
        { status: 404 }
      )
    }

    if (error) {
      console.error('Studio summary GET error:', error)

      return NextResponse.json(
        { error: 'تعذر جلب ملخص المشروع.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ summary }, { status: 200 })
  } catch (error) {
    console.error('Studio summary GET unexpected error:', error)

    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع أثناء جلب الملخص.' },
      { status: 500 }
    )
  }
}