import type { AppUser, AssignedRole } from './auth.types'

type AnyUser = Record<string, unknown>

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map(v => v.trim()).filter(Boolean)
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return []
}

function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const str = String(value).trim()
  return str ? str : null
}

function toOptionalString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  const str = String(value).trim()
  return str ? str : undefined
}

function normalizeStatus(status: unknown, approved: unknown): AppUser['status'] {
  if (status === 'approved' || status === 'pending' || status === 'suspended') {
    return status
  }
  return approved === true ? 'approved' : 'pending'
}

function normalizeThemeMode(value: unknown): AppUser['theme_mode'] {
  return value === 'dark' ? 'dark' : 'light'
}

function normalizeAssignedRole(value: unknown): AssignedRole | null {
  if (!value || typeof value !== 'object') return null

  const role = value as Record<string, unknown>

  return {
    id: String(role.id ?? ''),
    key: String(role.key ?? ''),
    name: String(role.name ?? ''),
    description: toStringOrNull(role.description),
    permissions: Array.isArray(role.permissions) ? role.permissions.map(String).filter(Boolean) : [],
    is_active: role.is_active !== false,
  }
}

export function normalizeUser(input: AnyUser | null | undefined): AppUser | null {
  if (!input?.id) return null

  const name =
    input.name ??
    input.full_name ??
    input.fullname ??
    input.email ??
    ''

  const role = input.role ?? input.user_type ?? input.usertype ?? ''
  const userType = input.user_type ?? input.usertype ?? input.role ?? ''

  return {
    id: String(input.id),
    email: String(input.email ?? ''),
    name: String(name),
    role: String(role),
    user_type: String(userType),
    status: normalizeStatus(input.status, input.approved),
    theme_mode: normalizeThemeMode(input.theme_mode),
    allowed_stages: toArray(input.allowed_stages ?? input.allowedstages),
    allowed_grades: toArray(input.allowed_grades ?? input.allowedgrades),
    track: toStringOrNull(input.track),
    permissions: Array.isArray(input.permissions) ? input.permissions.map(String).filter(Boolean) : [],
    assigned_role_id: toStringOrNull(input.assigned_role_id ?? input.assignedroleid),
    assigned_role: normalizeAssignedRole(input.assigned_role ?? input.assignedrole),
    avatar_url: toStringOrNull(input.avatar_url ?? input.avatarurl),
    current_term_id: toStringOrNull(input.current_term_id ?? input.currenttermid),
    is_active: typeof input.is_active === 'boolean' ? input.is_active : undefined,
    approved: typeof input.approved === 'boolean' ? input.approved : null,
    created_at: toOptionalString(input.created_at ?? input.createdat),
    updated_at: toOptionalString(input.updated_at ?? input.updatedat),
    last_seen_at: toStringOrNull(input.last_seen_at ?? input.lastseenat),
  }
}