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

type StudioSourceType = 'pdf' | 'text' | 'image' | 'video'

type StudioProject = {
  id: string
  title: string | null
  output_type: StudioOutputType | null
  source_type: StudioSourceType | null
  status: 'draft' | 'processing' | 'completed' | 'error' | null
  owner_id?: string | null
  created_at: string
  updated_at: string | null
}

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status })
}

// GET
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params

  try {
    const { data, error } = await supabaseAdmin
      .from('studio_projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) {
      console.error('Error fetching project:', error)
      return jsonResponse({ error: 'تعذر جلب بيانات المشروع.' }, 500)
    }

    if (!data) {
      return jsonResponse({ error: 'المشروع غير موجود.' }, 404)
    }

    return jsonResponse({ project: data }, 200)
  } catch (err) {
    console.error('Unexpected error in GET /studio/projects/[id]:', err)
    return jsonResponse(
      { error: 'حدث خطأ غير متوقع أثناء جلب المشروع.' },
      500
    )
  }
}

// PATCH
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params

  try {
    const body = await req.json().catch(() => null)

    if (!body) {
      return jsonResponse({ error: 'البيانات المرسلة غير صالحة.' }, 400)
    }

    const { title, status, output_type } = body as Partial<StudioProject>

    const updates: Partial<StudioProject> = {
      ...(title !== undefined ? { title } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(output_type !== undefined ? { output_type } : {}),
      updated_at: new Date().toISOString(),
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('studio_projects')
      .update(updates)
      .eq('id', projectId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating project:', updateError)
      return jsonResponse({ error: 'تعذر تعديل المشروع.' }, 500)
    }

    if (!data) {
      return jsonResponse({ error: 'المشروع غير موجود بعد التعديل.' }, 404)
    }

    return jsonResponse(
      { project: data, message: 'تم تعديل المشروع بنجاح.' },
      200
    )
  } catch (err) {
    console.error('Unexpected error in PATCH /studio/projects/[id]:', err)
    return jsonResponse(
      { error: 'حدث خطأ غير متوقع أثناء تعديل المشروع.' },
      500
    )
  }
}

// DELETE - مسموح للمسودات فقط
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params

  try {
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('studio_projects')
      .select('id, status')
      .eq('id', projectId)
      .single()

    if (fetchError) {
      console.error('Error fetching project before delete:', fetchError)
      return jsonResponse({ error: 'تعذر جلب المشروع قبل الحذف.' }, 500)
    }

    if (!existing) {
      return jsonResponse({ error: 'المشروع غير موجود.' }, 404)
    }

    if (existing.status !== 'draft') {
      return jsonResponse(
        { error: 'يمكن حذف المشاريع التي حالتها "مسودة" فقط.' },
        400
      )
    }

    const { error: deleteError } = await supabaseAdmin
      .from('studio_projects')
      .delete()
      .eq('id', projectId)

    if (deleteError) {
      console.error('Error deleting project:', deleteError)
      return jsonResponse({ error: 'تعذر حذف المشروع من القاعدة.' }, 500)
    }

    return jsonResponse({ message: 'تم حذف المشروع بنجاح.' }, 200)
  } catch (err) {
    console.error('Unexpected error in DELETE /studio/projects/[id]:', err)
    return jsonResponse(
      { error: 'حدث خطأ غير متوقع أثناء حذف المشروع.' },
      500
    )
  }
}