import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

type StudioProjectStatus =
  | 'draft'
  | 'processing'
  | 'completed'
  | 'error'

type StudioOutputType =
  | 'lesson_summary'
  | 'mcq_quiz'
  | 'short_explainer_video'

type StudioSourceType = 'pdf' | 'text' | 'image' | 'video'

type CreateProjectBody = {
  title?: unknown
  outputType?: unknown
  sourceType?: unknown
  materialIds?: unknown

  // دعم البيانات التي قد ترسلها واجهات سابقة
  output_type?: unknown
  source_type?: unknown
  material_ids?: unknown
}

type StudioProjectRow = {
  id: string
  title: string | null
  output_type: StudioOutputType | null
  source_type: StudioSourceType | null
  status: StudioProjectStatus | null
  created_at: string | null
  updated_at: string | null
}

type StudioProjectResponse = {
  id: string
  title: string
  outputType: StudioOutputType | null
  sourceType: StudioSourceType | null
  status: StudioProjectStatus
  createdAt: string
  updatedAt: string | null
  materialIds: string[]
}

const OUTPUT_TYPES: StudioOutputType[] = [
  'lesson_summary',
  'mcq_quiz',
  'short_explainer_video',
]

const SOURCE_TYPES: StudioSourceType[] = ['pdf', 'text', 'image', 'video']

function isOutputType(value: unknown): value is StudioOutputType {
  return typeof value === 'string' && OUTPUT_TYPES.includes(value as StudioOutputType)
}

function normalizeSourceType(value: unknown): StudioSourceType | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toLowerCase()

  if (normalized === 'pdf_word' || normalized === 'word' || normalized === 'docx') {
    return 'pdf'
  }

  if (SOURCE_TYPES.includes(normalized as StudioSourceType)) {
    return normalized as StudioSourceType
  }

  return null
}

function normalizeMaterialIds(value: unknown): string[] {
  const rawValues = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : []

  return Array.from(
    new Set(
      rawValues
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )
}

function mapRowToProject(
  row: StudioProjectRow,
  materialIds: string[] = []
): StudioProjectResponse {
  return {
    id: row.id,
    title: row.title ?? 'مشروع بدون عنوان',
    outputType: row.output_type ?? null,
    sourceType: row.source_type ?? null,
    status: row.status ?? 'draft',
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? null,
    materialIds,
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export async function GET() {
  try {
    const { data: projectRows, error: projectsError } = await supabaseAdmin
      .from('studio_projects')
      .select(
        `
          id,
          title,
          output_type,
          source_type,
          status,
          created_at,
          updated_at
        `
      )
      .order('created_at', { ascending: false })

    if (projectsError) {
      console.error('studio_projects GET error:', projectsError)

      return NextResponse.json(
        { error: 'تعذر جلب مشاريع الاستديو.' },
        { status: 500 }
      )
    }

    const projectIds = (projectRows || []).map((project) => project.id)

    let materialLinks: Array<{ project_id: string; material_id: string }> = []

    if (projectIds.length > 0) {
      const { data: links, error: linksError } = await supabaseAdmin
        .from('studio_project_materials')
        .select('project_id, material_id')
        .in('project_id', projectIds)

      if (linksError) {
        console.error('studio_project_materials GET error:', linksError)

        return NextResponse.json(
          { error: 'تعذر جلب الملفات المرتبطة بمشاريع الاستديو.' },
          { status: 500 }
        )
      }

      materialLinks = links || []
    }

    const materialIdsByProject = new Map<string, string[]>()

    for (const link of materialLinks) {
      const currentIds = materialIdsByProject.get(link.project_id) || []
      currentIds.push(link.material_id)
      materialIdsByProject.set(link.project_id, currentIds)
    }

    const projects = (projectRows || []).map((row) =>
      mapRowToProject(
        row as StudioProjectRow,
        materialIdsByProject.get(row.id) || []
      )
    )

    return NextResponse.json({ projects }, { status: 200 })
  } catch (error) {
    console.error('studio_projects GET unexpected error:', error)

    return NextResponse.json(
      {
        error: getErrorMessage(
          error,
          'حدث خطأ غير متوقع أثناء جلب مشاريع الاستديو.'
        ),
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  let createdProjectId: string | null = null

  try {
    const body = (await req.json().catch(() => null)) as CreateProjectBody | null

    if (!body) {
      return NextResponse.json(
        { error: 'بيانات غير صالحة في الطلب.' },
        { status: 400 }
      )
    }

    const title = typeof body.title === 'string' ? body.title.trim() : ''

    const outputTypeValue = body.outputType ?? body.output_type
    const sourceTypeValue = body.sourceType ?? body.source_type
    const materialIdsValue = body.materialIds ?? body.material_ids

    if (!isOutputType(outputTypeValue)) {
      return NextResponse.json(
        { error: 'نوع الناتج المحدد غير صالح.' },
        { status: 400 }
      )
    }

    const outputType = outputTypeValue
    const sourceType = normalizeSourceType(sourceTypeValue)
    const materialIds = normalizeMaterialIds(materialIdsValue)

    if (!sourceType) {
      return NextResponse.json(
        { error: 'نوع المادة المرفوعة غير صالح.' },
        { status: 400 }
      )
    }

    if (materialIds.length === 0) {
      return NextResponse.json(
        {
          error:
            'يجب اختيار ملف مصدر واحد على الأقل من صفحة المحتوى قبل إنشاء المشروع.',
        },
        { status: 400 }
      )
    }

    const { data: existingMaterials, error: materialsError } =
      await supabaseAdmin
        .from('subject_material_files')
        .select('id')
        .in('id', materialIds)

    if (materialsError) {
      console.error(
        'studio_projects POST material validation error:',
        materialsError
      )

      return NextResponse.json(
        { error: 'تعذر التحقق من ملفات المادة المختارة.' },
        { status: 500 }
      )
    }

    const existingMaterialIds = new Set(
      (existingMaterials || []).map((material) => material.id)
    )

    const missingMaterialIds = materialIds.filter(
      (materialId) => !existingMaterialIds.has(materialId)
    )

    if (missingMaterialIds.length > 0) {
      return NextResponse.json(
        {
          error:
            'يوجد ملف مصدر غير صالح أو محذوف. عد إلى صفحة المحتوى واختر الملفات مرة أخرى.',
        },
        { status: 400 }
      )
    }

    const safeTitle = title || 'مشروع استديو جديد'

    const { data: createdProject, error: projectInsertError } =
      await supabaseAdmin
        .from('studio_projects')
        .insert({
          user_id: null,
          title: safeTitle,
          output_type: outputType,
          source_type: sourceType,
          status: 'draft',
          updated_at: new Date().toISOString(),
        })
        .select(
          `
            id,
            title,
            output_type,
            source_type,
            status,
            created_at,
            updated_at
          `
        )
        .single()

    if (projectInsertError || !createdProject) {
      console.error(
        'studio_projects POST project insert error:',
        projectInsertError
      )

      return NextResponse.json(
        { error: 'تعذر إنشاء مشروع الاستديو.' },
        { status: 500 }
      )
    }

    createdProjectId = createdProject.id

    const linksToInsert = materialIds.map((materialId) => ({
      project_id: createdProject.id,
      material_id: materialId,
    }))

    const { error: linksInsertError } = await supabaseAdmin
      .from('studio_project_materials')
      .insert(linksToInsert)

    if (linksInsertError) {
      console.error(
        'studio_projects POST material links insert error:',
        linksInsertError
      )

      const { error: rollbackError } = await supabaseAdmin
        .from('studio_projects')
        .delete()
        .eq('id', createdProject.id)

      if (rollbackError) {
        console.error(
          'studio_projects POST rollback error:',
          rollbackError
        )
      }

      return NextResponse.json(
        {
          error:
            'تعذر ربط ملفات المادة بالمشروع، لذلك لم يتم إنشاء المشروع.',
        },
        { status: 500 }
      )
    }

    const project = mapRowToProject(
      createdProject as StudioProjectRow,
      materialIds
    )

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('studio_projects POST unexpected error:', error)

    if (createdProjectId) {
      const { error: rollbackError } = await supabaseAdmin
        .from('studio_projects')
        .delete()
        .eq('id', createdProjectId)

      if (rollbackError) {
        console.error(
          'studio_projects POST unexpected rollback error:',
          rollbackError
        )
      }
    }

    return NextResponse.json(
      {
        error: getErrorMessage(
          error,
          'حدث خطأ غير متوقع أثناء إنشاء مشروع الاستديو.'
        ),
      },
      { status: 500 }
    )
  }
}