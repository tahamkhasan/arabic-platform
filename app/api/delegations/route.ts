import { NextRequest, NextResponse } from 'next/server'
import getCurrentAdminContext from '@/lib/admin-helpers'
import { hasPermission } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

type DelegationRow = {
  id: string
  user_id: string
  delegated_by: string
  title: string
  notes: string | null
  is_active: boolean
  created_at: string
}

type CreateDelegationBody = {
  user_id?: string
  title?: string
  notes?: string | null
  is_active?: boolean
}

type UpdateDelegationBody = {
  id?: string
  user_id?: string
  title?: string
  notes?: string | null
  is_active?: boolean
}

type DeleteDelegationBody = {
  id?: string
}

const DELEGATION_SELECT = `
  id,
  user_id,
  delegated_by,
  title,
  notes,
  is_active,
  created_at
`

function success(data: Record<string, any>, status = 200) {
  return NextResponse.json(data, { status })
}

function failure(message: string, status = 400, code = 'BAD_REQUEST') {
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

function normalizeRequiredString(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeOptionalString(value: unknown) {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeOptionalBoolean(value: unknown) {
  if (value === undefined) return undefined
  if (typeof value === 'boolean') return value
  return null
}

async function requireDelegationsAccess() {
  const ctx = await getCurrentAdminContext()

  if (!ctx.ok) {
    return {
      ok: false as const,
      response: failure(ctx.error, ctx.status, 'UNAUTHORIZED'),
    }
  }

  const canManageDelegations =
    ctx.profile.role === 'admin' ||
    hasPermission(ctx.permissions, 'delegations.manage')

  if (!canManageDelegations) {
    return {
      ok: false as const,
      response: failure('غير مصرح لك بإدارة التفويضات.', 403, 'FORBIDDEN'),
    }
  }

  return {
    ok: true as const,
    ctx,
  }
}

async function ensureUserExists(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    return { ok: false as const, type: 'query' as const }
  }

  if (!data) {
    return { ok: false as const, type: 'missing' as const }
  }

  return { ok: true as const }
}

// جلب التفويضات
export async function GET(req: NextRequest) {
  try {
    const accessCheck = await requireDelegationsAccess()
    if (!accessCheck.ok) return accessCheck.response

    const { supabase } = accessCheck.ctx
    const { searchParams } = new URL(req.url)

    const userId = searchParams.get('user_id')?.trim()
    const delegatedBy = searchParams.get('delegated_by')?.trim()
    const title = searchParams.get('title')?.trim()
    const isActiveParam = searchParams.get('is_active')?.trim()

    let query = supabase
      .from('delegations')
      .select(DELEGATION_SELECT)
      .order('created_at', { ascending: false })

    if (userId) query = query.eq('user_id', userId)
    if (delegatedBy) query = query.eq('delegated_by', delegatedBy)
    if (title) query = query.eq('title', title)
    if (isActiveParam === 'true') query = query.eq('is_active', true)
    if (isActiveParam === 'false') query = query.eq('is_active', false)

    const { data, error } = await query

    if (error) {
      return failure('فشل في جلب التفويضات.', 500, 'DELEGATIONS_FETCH_FAILED')
    }

    return success({
      items: (data ?? []) as DelegationRow[],
    })
  } catch (error: any) {
    return failure(
      error?.message || 'حدث خطأ أثناء جلب التفويضات.',
      500,
      'INTERNAL_ERROR'
    )
  }
}

// إضافة تفويض
export async function POST(req: NextRequest) {
  try {
    const accessCheck = await requireDelegationsAccess()
    if (!accessCheck.ok) return accessCheck.response

    const { supabase, authUser } = accessCheck.ctx

    const body = (await req.json().catch(() => null)) as CreateDelegationBody | null
    if (!body || typeof body !== 'object') {
      return failure('بيانات الطلب غير صالحة.', 400, 'INVALID_JSON')
    }

    const userId = normalizeRequiredString(body.user_id)
    const title = normalizeRequiredString(body.title)
    const notes = normalizeOptionalString(body.notes)
    const isActive = normalizeOptionalBoolean(body.is_active)

    if (!userId) {
      return failure('معرف المستخدم مطلوب.', 400, 'USER_ID_REQUIRED')
    }

    if (!title) {
      return failure('عنوان التفويض مطلوب.', 400, 'TITLE_REQUIRED')
    }

    if (body.notes !== undefined && notes === null && body.notes !== null) {
      return failure('الملاحظات غير صالحة.', 400, 'INVALID_NOTES')
    }

    if (body.is_active !== undefined && isActive === null) {
      return failure('قيمة is_active غير صالحة.', 400, 'INVALID_IS_ACTIVE')
    }

    const userCheck = await ensureUserExists(supabase, userId)
    if (!userCheck.ok) {
      if (userCheck.type === 'query') {
        return failure('فشل في التحقق من المستخدم.', 500, 'USER_CHECK_FAILED')
      }

      return failure('المستخدم المحدد غير موجود.', 404, 'USER_NOT_FOUND')
    }

    const insertPayload = {
      user_id: userId,
      delegated_by: authUser.id,
      title,
      notes: notes === undefined ? null : notes,
      is_active: isActive === undefined ? true : isActive,
    }

    const { data, error } = await supabase
      .from('delegations')
      .insert(insertPayload)
      .select(DELEGATION_SELECT)
      .single()

    if (error) {
      return failure('فشل في إنشاء التفويض.', 500, 'DELEGATION_CREATE_FAILED')
    }

    return success(
      {
        item: data as DelegationRow,
        message: 'تم إنشاء التفويض بنجاح.',
      },
      201
    )
  } catch (error: any) {
    return failure(
      error?.message || 'حدث خطأ أثناء إنشاء التفويض.',
      500,
      'INTERNAL_ERROR'
    )
  }
}

// تعديل تفويض
export async function PUT(req: NextRequest) {
  try {
    const accessCheck = await requireDelegationsAccess()
    if (!accessCheck.ok) return accessCheck.response

    const { supabase } = accessCheck.ctx

    const body = (await req.json().catch(() => null)) as UpdateDelegationBody | null
    if (!body || typeof body !== 'object') {
      return failure('بيانات الطلب غير صالحة.', 400, 'INVALID_JSON')
    }

    const id = normalizeRequiredString(body.id)
    if (!id) {
      return failure('معرف التفويض مطلوب.', 400, 'DELEGATION_ID_REQUIRED')
    }

    const updates: Record<string, any> = {}

    if (body.user_id !== undefined) {
      const userId = normalizeRequiredString(body.user_id)
      if (!userId) {
        return failure('معرف المستخدم غير صالح.', 400, 'INVALID_USER_ID')
      }

      const userCheck = await ensureUserExists(supabase, userId)
      if (!userCheck.ok) {
        if (userCheck.type === 'query') {
          return failure('فشل في التحقق من المستخدم.', 500, 'USER_CHECK_FAILED')
        }

        return failure('المستخدم المحدد غير موجود.', 404, 'USER_NOT_FOUND')
      }

      updates.user_id = userId
    }

    if (body.title !== undefined) {
      const title = normalizeRequiredString(body.title)
      if (!title) {
        return failure('عنوان التفويض غير صالح.', 400, 'INVALID_TITLE')
      }
      updates.title = title
    }

    if (body.notes !== undefined) {
      const notes = normalizeOptionalString(body.notes)
      if (notes === null && body.notes !== null) {
        return failure('الملاحظات غير صالحة.', 400, 'INVALID_NOTES')
      }
      updates.notes = notes
    }

    if (body.is_active !== undefined) {
      const isActive = normalizeOptionalBoolean(body.is_active)
      if (isActive === null) {
        return failure('قيمة is_active غير صالحة.', 400, 'INVALID_IS_ACTIVE')
      }
      updates.is_active = isActive
    }

    if (Object.keys(updates).length === 0) {
      return failure('لا توجد بيانات صالحة للتحديث.', 400, 'NO_UPDATES')
    }

    const { data: existing, error: existingError } = await supabase
      .from('delegations')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (existingError) {
      return failure('فشل في التحقق من التفويض.', 500, 'DELEGATION_CHECK_FAILED')
    }

    if (!existing) {
      return failure('التفويض غير موجود.', 404, 'DELEGATION_NOT_FOUND')
    }

    const { data, error } = await supabase
      .from('delegations')
      .update(updates)
      .eq('id', id)
      .select(DELEGATION_SELECT)
      .single()

    if (error) {
      return failure('فشل في تحديث التفويض.', 500, 'DELEGATION_UPDATE_FAILED')
    }

    return success({
      item: data as DelegationRow,
      message: 'تم تحديث التفويض بنجاح.',
    })
  } catch (error: any) {
    return failure(
      error?.message || 'حدث خطأ أثناء تحديث التفويض.',
      500,
      'INTERNAL_ERROR'
    )
  }
}

// حذف تفويض
export async function DELETE(req: NextRequest) {
  try {
    const accessCheck = await requireDelegationsAccess()
    if (!accessCheck.ok) return accessCheck.response

    const { supabase } = accessCheck.ctx

    const body = (await req.json().catch(() => null)) as DeleteDelegationBody | null
    if (!body || typeof body !== 'object') {
      return failure('بيانات الطلب غير صالحة.', 400, 'INVALID_JSON')
    }

    const id = normalizeRequiredString(body.id)
    if (!id) {
      return failure('معرف التفويض مطلوب.', 400, 'DELEGATION_ID_REQUIRED')
    }

    const { data: existing, error: existingError } = await supabase
      .from('delegations')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (existingError) {
      return failure('فشل في التحقق من التفويض.', 500, 'DELEGATION_CHECK_FAILED')
    }

    if (!existing) {
      return failure('التفويض غير موجود.', 404, 'DELEGATION_NOT_FOUND')
    }

    const { error } = await supabase
      .from('delegations')
      .delete()
      .eq('id', id)

    if (error) {
      return failure('فشل في حذف التفويض.', 500, 'DELEGATION_DELETE_FAILED')
    }

    return success({
      success: true,
      message: 'تم حذف التفويض بنجاح.',
    })
  } catch (error: any) {
    return failure(
      error?.message || 'حدث خطأ أثناء حذف التفويض.',
      500,
      'INTERNAL_ERROR'
    )
  }
}