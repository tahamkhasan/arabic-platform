import type { AppUser } from './auth.types'

export const AUTH_USER_KEY = 'mosaed_user'
export const AUTH_SESSION_KEY = 'mosaed_session'

export interface StoredSession {
  access_token?: string | null
  refresh_token?: string | null
  expires_at?: number | null
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function readStoredUser(): AppUser | null {
  if (typeof window === 'undefined') return null

  const user = safeParse<AppUser>(localStorage.getItem(AUTH_USER_KEY))
  if (!user) {
    localStorage.removeItem(AUTH_USER_KEY)
    return null
  }

  return user
}

export function writeStoredUser(user: AppUser | null) {
  if (typeof window === 'undefined') return

  if (!user) {
    localStorage.removeItem(AUTH_USER_KEY)
    return
  }

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export function readStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') return null

  const session = safeParse<StoredSession>(localStorage.getItem(AUTH_SESSION_KEY))
  if (!session) {
    localStorage.removeItem(AUTH_SESSION_KEY)
    return null
  }

  return session
}

export function writeStoredSession(session: StoredSession | null) {
  if (typeof window === 'undefined') return

  if (!session) {
    localStorage.removeItem(AUTH_SESSION_KEY)
    return
  }

  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
}

export function clearStoredAuth() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_USER_KEY)
  localStorage.removeItem(AUTH_SESSION_KEY)
}