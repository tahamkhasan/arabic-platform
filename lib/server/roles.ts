import type { DbRoleRow, RolePayload } from '@/types/roles-api'

export function normalizeRolePayload(input: RolePayload, mode: 'create' | 'update') {
  const key = typeof input.key === 'string' ? input.key.trim() : ''
  const name = typeof input.name === 'string' ? input.name.trim() : ''
  const description =
    typeof input.description === 'string'
      ? input.description.trim() || null
      : input.description === null
      ? null
      : undefined

  const permissions = Array.isArray(input.permissions)
    ? input.permissions
        .map((item) => String(item).trim())
        .filter(Boolean)
    : undefined

  const normalized: Record<string, any> = {}

  if (mode === 'create' || input.key !== undefined) {
    normalized.key = key.toLowerCase()
  }

  if (mode === 'create' || input.name !== undefined) {
    normalized.name = name
  }

  if (mode === 'create' || input.description !== undefined) {
    normalized.description = description ?? null
  }

  if (mode === 'create' || input.permissions !== undefined) {
    normalized.permissions = permissions ?? []
  }

  if (mode === 'create' || input.is_active !== undefined) {
    normalized.is_active = Boolean(input.is_active)
  }

  return normalized
}

export function validateRolePayload(
  payload: Record<string, any>,
  mode: 'create' | 'update'
) {
  if (mode === 'create') {
    if (!payload.key) return 'Role key is required.'
    if (!payload.name) return 'Role name is required.'
  }

  if ('key' in payload) {
    if (!payload.key) return 'Role key is required.'
    if (!/^[a-z0-9_-]+$/.test(payload.key)) {
      return 'Role key must contain only lowercase letters, numbers, underscore, or dash.'
    }
  }

  if ('name' in payload && !payload.name) {
    return 'Role name is required.'
  }

  if ('permissions' in payload && !Array.isArray(payload.permissions)) {
    return 'Permissions must be an array.'
  }

  return null
}

export function mapRoleRow(row: DbRoleRow) {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    permissions: row.permissions || [],
    is_active: row.is_active !== false,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  }
}