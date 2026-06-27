export type AdminAssignedRole = {
  id: string
  key: string
  name: string
  description: string | null
  permissions: string[]
  is_active: boolean
}

export type AdminRoleOption = {
  id: string
  key: string
  name: string
  description: string | null
  permissions: string[]
  is_active: boolean
  created_at?: string | null
  updated_at?: string | null
}

export type AdminUserItem = {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
  user_type: string | null
  approved: boolean | null
  status: string | null
  created_at: string | null
  assigned_role_id: string | null
  assigned_role: AdminAssignedRole | null
}

export type AdminRoleRelation =
  | {
      id: string
      key: string
      name: string
      description?: string | null
      permissions?: string[] | null
      is_active?: boolean | null
    }
  | {
      id: string
      key: string
      name: string
      description?: string | null
      permissions?: string[] | null
      is_active?: boolean | null
    }[]
  | null

export type AdminUserRow = {
  id: string
  email: string | null
  full_name?: string | null
  role?: string | null
  user_type?: string | null
  approved?: boolean | null
  status?: string | null
  created_at?: string | null
  assigned_role_id?: string | null
  roles?: AdminRoleRelation
}

export function normalizeAdminRoleRelation(
  roleRelation: AdminRoleRelation
): AdminAssignedRole | null {
  if (!roleRelation) return null

  const role = Array.isArray(roleRelation) ? roleRelation[0] : roleRelation
  if (!role) return null

  return {
    id: String(role.id),
    key: String(role.key),
    name: String(role.name),
    description: role.description ?? null,
    permissions: Array.isArray(role.permissions) ? role.permissions : [],
    is_active: role.is_active !== false,
  }
}

export function mapAdminUserRow(row: AdminUserRow): AdminUserItem {
  return {
    id: String(row.id),
    email: row.email ?? null,
    full_name: row.full_name ?? null,
    role: row.role ?? null,
    user_type: row.user_type ?? null,
    approved: row.approved ?? null,
    status: row.status ?? null,
    created_at: row.created_at ?? null,
    assigned_role_id: row.assigned_role_id ?? null,
    assigned_role: normalizeAdminRoleRelation(row.roles ?? null),
  }
}

export function mapAdminRoleOption(input: Partial<AdminRoleOption>): AdminRoleOption {
  return {
    id: String(input.id ?? ''),
    key: String(input.key ?? ''),
    name: String(input.name ?? ''),
    description: input.description ?? null,
    permissions: Array.isArray(input.permissions) ? input.permissions : [],
    is_active: input.is_active !== false,
    created_at: input.created_at ?? null,
    updated_at: input.updated_at ?? null,
  }
}