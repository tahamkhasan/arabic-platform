export type UserStatus = 'approved' | 'pending' | 'suspended'
export type UserType = 'admin' | 'teacher' | 'student'
export type ThemeMode = 'light' | 'dark'

export interface AssignedRole {
  id: string
  key: string
  name: string
  description?: string | null
  permissions?: string[]
  is_active?: boolean
}

export interface AppUser {
  id: string
  email: string
  name: string
  role: string
  user_type: UserType | string
  status: UserStatus | string
  theme_mode: ThemeMode
  allowed_stages: string[]
  allowed_grades: string[]
  track?: string | null
  permissions: string[]
  assigned_role_id?: string | null
  assigned_role?: AssignedRole | null
  avatar_url?: string | null
  current_term_id?: string | null
  is_active?: boolean
  approved?: boolean | null
  created_at?: string
  updated_at?: string
  last_seen_at?: string | null
}