import { NextRequest, NextResponse } from 'next/server'
import getCurrentAdminContext from '@/lib/admin-helpers'

export const dynamic = 'force-dynamic'

type ExamPayload = {
  id?: string
  name?: string
  exam_type?: string
  subject_id?: string
  stage?: string
  grade?: string
  lesson_ids?: string[]
  description?: string | null
}

type SanitizedExamResult =
  | { ok: true; payload: Record<string, any> }
  | { ok: false; error: string }

const EXAM_SELECT = `
  *,
  subjects(name)
`

function ok(data: Record<string, any>, status = 200) {
  return NextResponse.json(data, { status })
}

function fail(message: string, status = 400, code = 'BAD_REQUEST') {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status }
  )
}

function normalizeNullableString(value: unknown) {
  if (value === undefined) return undefined
  if (value === null) return null
  const str = String(value).trim()
  return str ? str : null
}

function normalizeRequiredString(value: unknown) {
  const str = normalizeNullableString(value)
  return typeof str === 'string' ? str : null
}

function normalizeLessonIds(value: unknown) {
  if (value === undefined) return undefined
  if (value === null) return []
  if (!Array.isArray(value)) return null

  const normalized = value
    .map(item => String(item).trim())
    .filter(Boolean)

  return normalized
}

function sanitizeExamPayload(
  body: ExamPayload,
  mode: 'create' | 'update'
): SanitizedExamResult {
  const payload: Record<string, any> = {}

  const name = normalizeRequiredString(body.name)
  const examType = normalizeRequiredString(body.exam_type)
  const subjectId = normalizeRequiredString(body.subject_id)
  const stage = normalizeNullableString(body.stage)
  const grade = normalizeNullableString(body.grade)
  const description = normalizeNullableString(body.description)
  const lessonIds = normalizeLessonIds(body.lesson_ids)

  if (mode === 'create') {
    if (!name) return { ok: false, error: 'اسم الاختبار مطلوب.' }
    if (!examType) return { ok: false, error: 'نوع الاختبار مطلوب.' }
    if (!subjectId) return { ok: false, error: 'المادة مطلوبة.' }
  }

  if (body.name !== undefined) {
    if (!name) return { ok: false, error: 'اسم الاختبار غير صالح.' }
    payload.name = name
  }

  if (body.exam_type !== undefined) {
    if (!examType) return { ok: false, error: 'نوع الاختبار غير صالح.' }
    payload.exam_type = examType
  }

  if (body.subject_id !== undefined) {
    if (!subjectId) return { ok: false, error: 'معرف المادة غير صالح.' }
    payload.subject_id = subjectId
  }

  if (body.stage !== undefined) payload.stage = stage
  if (body.grade !== undefined) payload.grade = grade
  if (body.description !== undefined) payload.description = description

  if (body.lesson_ids !== undefined) {
    if (lessonIds === null) return { ok: false, error: 'قائمة الدروس غير صالحة.' }
    payload.lesson_ids = lessonIds
  }

  payload.updated_at = new Date().toISOString()

  return { ok: true, payload }
}

async function requireAdmin() {
  const ctx = await getCurrentAdminContext()

  if (!ctx.ok) {
    return {
      ok: false as const,
      response: fail(ctx.error, ctx.status, 'UNAUTHORIZED'),
    }
  }

  if (ctx.profile.role !== 'admin') {
    return {
      ok: false as const,
      response: fail('غير مصرح لك بإدارة الاختبارات.', 403, 'FORBIDDEN'),
    }
  }

  return { ok: true as const, ctx }
}

// جلب الاختبارات
export async function GET(req: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) return adminCheck.response

    const { supabase } = adminCheck.ctx
    const { searchParams } = new URL(req.url)

    const subjectId = searchParams.get('subject_id')?.trim()
    const examType = searchParams.get('exam_type')?.trim()
    const stage = searchParams.get('stage')?.trim()
    const grade = searchParams.get('grade')?.trim()

    let query = supabase
      .from('exams')
      .select(EXAM_SELECT)
      .order('created_at', { ascending: false })

    if (subjectId) query = query.eq('subject_id', subjectId)
    if (examType) query = query.eq('exam_type', examType)
    if (stage) query = query.eq('stage', stage)
    if (grade) query = query.eq('grade', grade)

    const { data, error } = await query

    if (error) {
      return fail('فشل في جلب الاختبارات.', 500, 'EXAMS_FETCH_FAILED')
    }

    return ok({ exams: data ?? [] })
  } catch {
    return fail('حدث خطأ أثناء جلب الاختبارات.', 500, 'INTERNAL_ERROR')
  }
}

// إضافة اختبار
export async function POST(req: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) return adminCheck.response

    const { supabase, authUser } = adminCheck.ctx

    const body = (await req.json().catch(() => null)) as ExamPayload | null
    if (!body || typeof body !== 'object') {
      return fail('بيانات الطلب غير صالحة.', 400, 'INVALID_JSON')
    }

    const sanitizationResult = sanitizeExamPayload(body, 'create')
    if (!sanitizationResult.ok) {
      return fail(sanitizationResult.error, 400, 'VALIDATION_ERROR')
    }

    const payload = sanitizationResult.payload

    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('id')
      .eq('id', payload.subject_id)
      .maybeSingle()

    if (subjectError) {
      return fail('فشل في التحقق من المادة.', 500, 'SUBJECT_CHECK_FAILED')
    }

    if (!subject) {
      return fail('المادة المحددة غير موجودة.', 404, 'SUBJECT_NOT_FOUND')
    }

    const insertPayload = {
      ...payload,
      created_by: authUser.id,
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('exams')
      .insert(insertPayload)
      .select(EXAM_SELECT)
      .single()

    if (error) {
      return fail('فشل في إضافة الاختبار.', 500, 'EXAM_CREATE_FAILED')
    }

    return ok(
      {
        exam: data,
        message: 'تم إنشاء الاختبار بنجاح.',
      },
      201
    )
  } catch {
    return fail('حدث خطأ أثناء إضافة الاختبار.', 500, 'INTERNAL_ERROR')
  }
}

// تعديل اختبار
export async function PUT(req: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) return adminCheck.response

    const { supabase } = adminCheck.ctx

    const body = (await req.json().catch(() => null)) as ExamPayload | null
    if (!body || typeof body !== 'object') {
      return fail('بيانات الطلب غير صالحة.', 400, 'INVALID_JSON')
    }

    const id = normalizeRequiredString(body.id)
    if (!id) {
      return fail('معرف الاختبار مطلوب.', 400, 'EXAM_ID_REQUIRED')
    }

    const sanitizationResult = sanitizeExamPayload(body, 'update')
    if (!sanitizationResult.ok) {
      return fail(sanitizationResult.error, 400, 'VALIDATION_ERROR')
    }

    const payload = sanitizationResult.payload
    const updatableKeys = Object.keys(payload).filter(key => key !== 'updated_at')

    if (updatableKeys.length === 0) {
      return fail('لا توجد بيانات صالحة للتحديث.', 400, 'NO_UPDATES')
    }

    const { data: existingExam, error: existingExamError } = await supabase
      .from('exams')
      .select('id, subject_id')
      .eq('id', id)
      .maybeSingle()

    if (existingExamError) {
      return fail('فشل في التحقق من الاختبار.', 500, 'EXAM_CHECK_FAILED')
    }

    if (!existingExam) {
      return fail('الاختبار غير موجود.', 404, 'EXAM_NOT_FOUND')
    }

    if (payload.subject_id) {
      const { data: subject, error: subjectError } = await supabase
        .from('subjects')
        .select('id')
        .eq('id', payload.subject_id)
        .maybeSingle()

      if (subjectError) {
        return fail('فشل في التحقق من المادة.', 500, 'SUBJECT_CHECK_FAILED')
      }

      if (!subject) {
        return fail('المادة المحددة غير موجودة.', 404, 'SUBJECT_NOT_FOUND')
      }
    }

    const { data, error } = await supabase
      .from('exams')
      .update(payload)
      .eq('id', id)
      .select(EXAM_SELECT)
      .single()

    if (error) {
      return fail('فشل في تحديث الاختبار.', 500, 'EXAM_UPDATE_FAILED')
    }

    return ok({
      exam: data,
      message: 'تم تحديث الاختبار بنجاح.',
    })
  } catch {
    return fail('حدث خطأ أثناء تعديل الاختبار.', 500, 'INTERNAL_ERROR')
  }
}

// حذف اختبار
export async function DELETE(req: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.ok) return adminCheck.response

    const { supabase } = adminCheck.ctx

    const body = (await req.json().catch(() => null)) as { id?: string } | null
    const id = normalizeRequiredString(body?.id)

    if (!id) {
      return fail('معرف الاختبار مطلوب.', 400, 'EXAM_ID_REQUIRED')
    }

    const { data: existingExam, error: existingExamError } = await supabase
      .from('exams')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (existingExamError) {
      return fail('فشل في التحقق من الاختبار.', 500, 'EXAM_CHECK_FAILED')
    }

    if (!existingExam) {
      return fail('الاختبار غير موجود.', 404, 'EXAM_NOT_FOUND')
    }

    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id)

    if (error) {
      return fail('فشل في حذف الاختبار.', 500, 'EXAM_DELETE_FAILED')
    }

    return ok({
      success: true,
      message: 'تم حذف الاختبار بنجاح.',
    })
  } catch {
    return fail('حدث خطأ أثناء حذف الاختبار.', 500, 'INTERNAL_ERROR')
  }
}