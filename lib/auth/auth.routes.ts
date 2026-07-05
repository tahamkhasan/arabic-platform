import type { AppUser } from './auth.types'

export type GuardMode =
  | 'guest'
  | 'pending-only'
  | 'admin'
  | 'teacher'
  | 'student'

export type AppRoute =
  | '/login'
  | '/pending-approval'
  | '/admin'
  | '/teacher'
  | '/student'
  | '/dashboard'

export function isPendingUser(user: AppUser | null): boolean {
  return !!user && user.status === 'pending'
}

export function isSuspendedUser(user: AppUser | null): boolean {
  return !!user && user.status === 'suspended'
}

export function isBlockedUser(user: AppUser | null): boolean {
  return isPendingUser(user) || isSuspendedUser(user)
}

export function isAdminUser(user: AppUser | null): boolean {
  return !!user && user.role === 'admin'
}

export function isTeacherUser(user: AppUser | null): boolean {
  return !!user && (user.user_type === 'teacher' || user.role === 'teacher')
}

export function isStudentUser(user: AppUser | null): boolean {
  return !!user && user.user_type === 'student'
}

export function resolveBlockedUserRoute(user: AppUser | null): AppRoute | null {
  if (!user) return null
  if (isBlockedUser(user)) return '/pending-approval'
  return null
}

export function resolveUserHome(user: AppUser | null): AppRoute {
  if (!user) return '/login'

  const blockedRoute = resolveBlockedUserRoute(user)
  if (blockedRoute) return blockedRoute

  if (isAdminUser(user)) return '/admin'
  if (isStudentUser(user)) return '/student'
  if (isTeacherUser(user)) return '/teacher'

  return '/dashboard'
}

export function canAccessGuard(user: AppUser | null, mode: GuardMode): boolean {
  if (mode === 'guest') return !user
  if (mode === 'pending-only') return !!user && isBlockedUser(user)

  if (!user) return false
  if (isBlockedUser(user)) return false

  if (mode === 'admin') return isAdminUser(user)
  if (mode === 'teacher') return isTeacherUser(user)
  if (mode === 'student') return isStudentUser(user)

  return false
}

export function resolveRedirectForGuard(
  user: AppUser | null,
  mode: GuardMode,
): AppRoute | null {
  if (mode === 'guest') {
    return user ? resolveUserHome(user) : null
  }

  if (mode === 'pending-only') {
    if (!user) return '/login'
    return isBlockedUser(user) ? null : resolveUserHome(user)
  }

  if (!user) return '/login'

  const blockedRoute = resolveBlockedUserRoute(user)
  if (blockedRoute) return blockedRoute

  if (mode === 'admin' && !isAdminUser(user)) {
    return resolveUserHome(user)
  }

  if (mode === 'teacher' && !isTeacherUser(user)) {
    return resolveUserHome(user)
  }

  if (mode === 'student' && !isStudentUser(user)) {
    return resolveUserHome(user)
  }

  return null
}