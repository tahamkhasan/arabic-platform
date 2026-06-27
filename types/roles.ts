export type RoleItem = {
  id: string | number
  key: string
  name: string
  description?: string | null
  permissions?: string[] | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export type MeUser = {
  role?: string
  user_type?: string
  email?: string
}

export type RoleFormState = {
  key: string
  name: string
  description: string
  permissionsText: string
  is_active: boolean
}

export const emptyRoleForm: RoleFormState = {
  key: '',
  name: '',
  description: '',
  permissionsText: '',
  is_active: true,
}

export function normalizePermissions(text: string) {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function formFromRole(role: RoleItem): RoleFormState {
  return {
    key: role.key || '',
    name: role.name || '',
    description: role.description || '',
    permissionsText: (role.permissions || []).join('\n'),
    is_active: role.is_active !== false,
  }
}