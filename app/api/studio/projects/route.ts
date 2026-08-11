import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

type StudioProjectStatus =
  | 'draft'
  | 'uploaded'
  | 'processing'
  | 'completed'
  | 'failed'

type StudioOutputType =
  | 'lesson_summary'
  | 'mcq_quiz'
  | 'short_explainer_video'

type StudioProjectResponse = {
  id: string
  title: string
  outputType: StudioOutputType
  status: StudioProjectStatus
  createdAt: string
}

function mapRowToProject(row: any): StudioProjectResponse {
  return {
    id: row.id,
    title: row.title ?? 'مشروع بدون عنوان',
    outputType: row.output_type as StudioOutputType,
    status: (row.status ?? 'draft') as StudioProjectStatus,
    createdAt: row.created_at ?? '',
  }
}

// GET /api/studio/projects
export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('studio_projects')
      .select('id, title, output_type, status, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('studio_projects GET error:', error)
      return NextResponse.json(
        { error: 'تعذر جلب مشاريع الاستديو.' },
        { status: 500 },
      )
    }

    const projects = (data ?? []).map(mapRowToProject)

    return NextResponse.json(
      {
        projects,
      },
      { status: 200 },
    )
  } catch (err: any) {
    console.error('studio_projects GET unexpected error:', err)
    return NextResponse.json(
      {
        error:
          err?.message ||
          'حدث خطأ غير متوقع أثناء جلب مشاريع الاستديو.',
      },
      { status: 500 },
    )
  }
}

// POST /api/studio/projects
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | {
          title?: string
          outputType?: StudioOutputType
          sourceType?: 'pdf' | 'text' | 'image' | 'video'
        }
      | null

    if (!body) {
      return NextResponse.json(
        { error: 'بيانات غير صالحة في الطلب.' },
        { status: 400 },
      )
    }

    const title = (body.title ?? '').trim()
    const outputType = body.outputType
    const sourceType = body.sourceType

    if (!outputType || !sourceType) {
      return NextResponse.json(
        {
          error:
            'يجب تحديد نوع الناتج ونوع المادة المرفوعة لإنشاء مشروع استديو.',
        },
        { status: 400 },
      )
    }

    const safeTitle = title || 'مشروع استديو جديد'

    const { data, error } = await supabaseAdmin
      .from('studio_projects')
      .insert({
        user_id: null,
        title: safeTitle,
        output_type: outputType,
        source_type: sourceType,
        status: 'draft',
      })
      .select('id, title, output_type, status, created_at')
      .single()

    if (error || !data) {
      console.error('studio_projects POST error:', error)
      return NextResponse.json(
        { error: 'تعذر إنشاء مشروع الاستديو.' },
        { status: 500 },
      )
    }

    const project = mapRowToProject(data)

    return NextResponse.json(
      {
        project,
      },
      { status: 201 },
    )
  } catch (err: any) {
    console.error('studio_projects POST unexpected error:', err)
    return NextResponse.json(
      {
        error:
          err?.message ||
          'حدث خطأ غير متوقع أثناء إنشاء مشروع الاستديو.',
      },
      { status: 500 },
    )
  }
}