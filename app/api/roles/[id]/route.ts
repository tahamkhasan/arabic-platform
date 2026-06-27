import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getServiceClient } from '@/lib/server/auth'
import { mapRoleRow, normalizeRolePayload, validateRolePayload } from '@/lib/server/roles'
import type { RolePayload } from '@/types/roles-api'

type Context = {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, context: Context) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const body = (await req.json()) as RolePayload
    const payload = normalizeRolePayload(body, 'update')
    const validationError = validateRolePayload(payload, 'update')

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'No fields provided for update.' }, { status: 400 })
    }

    const supabase = getServiceClient()

    if (payload.key) {
      const { data: existing } = await supabase
        .from('roles')
        .select('id')
        .eq('key', payload.key)
        .neq('id', id)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ error: 'Role key already exists.' }, { status: 409 })
      }
    }

    const { data, error } = await supabase
      .from('roles')
      .update(payload)
      .eq('id', id)
      .select('id, key, name, description, permissions, is_active, created_at, updated_at')
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'Failed to update role.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      item: mapRoleRow(data),
    })
  } catch {
    return NextResponse.json({ error: 'Unexpected error while updating role.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: Context) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const supabase = getServiceClient()

    const { count, error: usageError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_role_id', id)

    if (usageError) {
      return NextResponse.json(
        { error: usageError.message || 'Failed to validate role usage.' },
        { status: 500 }
      )
    }

    if ((count || 0) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a role that is assigned to users.' },
        { status: 409 }
      )
    }

    const { error } = await supabase.from('roles').delete().eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to delete role.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Unexpected error while deleting role.' }, { status: 500 })
  }
}