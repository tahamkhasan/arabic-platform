export type DbRoleRow = {
  id: string | number
  key: string
  name: string
  description: string | null
  permissions: string[] | null
  is_active: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export type RolePayload = {
  key?: string
  name?: string
  description?: string | null
  permissions?: string[] | null
  is_active?: boolean
}

export type AuthenticatedAdmin = {
  userId: string
  email: string | null
  role: string
}