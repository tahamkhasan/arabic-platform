import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, requireAdmin, requireAdminOrPermission } from '@/lib/server/auth'

type AssignRoleBody = {
  userId?: string
  roleId?: string | null
}

type UserWithRoleRow = {
  id: string
  email: string | null
  full_name?: string | null
  role?: string | null
  user_type?: string | null
  assigned_role_id?: string | null
  roles?: {
    id: string
    key: string
    name: string
    description?: string | null
    permissions?: string[] | null
    is_active?: boolean | null
  }[] | null
}

function mapUserRow(row: UserWithRoleRow) {
  const assignedRole = row.roles && row.roles.length > 0 ? row.roles[0] : null

  return {
    id: row.id,
    email: row.email ?? null,
    full_name: row.full_name ?? null,
    role: row.role ?? null,
    user_type: row.user_type ?? null,
    assigned_role_id: row.assigned_role_id ?? null,
    assigned_role: assignedRole
      ? {
          id: assignedRole.id,
          key: assignedRole.key,
          name: assignedRole.name,
          description: assignedRole.description ?? null,
          permissions: assignedRole.permissions ?? [],
          is_active: assignedRole.is_active !== false,
        }
      : null,
  }
}

async function loadUserWithAssignedRole(userId: string) {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      full_name,
      role,
      user_type,
      assigned_role_id,
      roles:assigned_role_id (
        id,
        key,
        name,
        description,
        permissions,
        is_active
      )
    `)
    .eq('id', userId)
    .single()

  if (error || !data) {
    return { item: null, error: error?.message || 'User not found after update.' }
  }

  return { item: mapUserRow(data as UserWithRoleRow), error: null }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json()) as AssignRoleBody
    const userId = String(body.userId || '').trim()
    const roleId = body.roleId === null ? null : String(body.roleId || '').trim()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 })
    }

    if (!roleId) {
      return NextResponse.json({ error: 'roleId is required.' }, { status: 400 })
    }

    const supabase = getServiceClient()

    const { data: userExists, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (userError) {
      return NextResponse.json(
        { error: userError.message || 'Failed to validate user.' },
        { status: 500 }
      )
    }

    if (!userExists) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    const { data: roleExists, error: roleError } = await supabase
      .from('roles')
      .select('id, is_active')
      .eq('id', roleId)
      .maybeSingle()

    if (roleError) {
      return NextResponse.json(
        { error: roleError.message || 'Failed to validate role.' },
        { status: 500 }
      )
    }

    if (!roleExists) {
      return NextResponse.json({ error: 'Role not found.' }, { status: 404 })
    }

    if (roleExists.is_active === false) {
      return NextResponse.json(
        { error: 'Cannot assign an inactive role.' },
        { status: 409 }
      )
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        assigned_role_id: roleId,
      })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'Failed to assign role.' },
        { status: 500 }
      )
    }

    const { item, error } = await loadUserWithAssignedRole(userId)

    if (error || !item) {
      return NextResponse.json(
        { error: error || 'Role assigned but failed to load updated user.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      item,
    })
  } catch {
    return NextResponse.json(
      { error: 'Unexpected error while assigning role.' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminOrPermission(req, 'assign_roles')
if (!auth.ok) return auth.response

  try {
    const body = (await req.json()) as AssignRoleBody
    const userId = String(body.userId || '').trim()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 })
    }

    const supabase = getServiceClient()

    const { data: userExists, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (userError) {
      return NextResponse.json(
        { error: userError.message || 'Failed to validate user.' },
        { status: 500 }
      )
    }

    if (!userExists) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        assigned_role_id: null,
      })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'Failed to remove assigned role.' },
        { status: 500 }
      )
    }

    const { item, error } = await loadUserWithAssignedRole(userId)

    if (error || !item) {
      return NextResponse.json(
        { error: error || 'Role removed but failed to load updated user.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      item,
    })
  } catch {
    return NextResponse.json(
      { error: 'Unexpected error while removing assigned role.' },
      { status: 500 }
    )
  }
}