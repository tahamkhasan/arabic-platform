'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from './useCurrentUser'
import {
  type GuardMode,
  canAccessGuard,
  resolveRedirectForGuard,
} from '@/lib/auth/auth.routes'

export function useRouteGuard(mode: GuardMode) {
  const router = useRouter()
  const auth = useCurrentUser()

  const redirectTo = useMemo(() => {
    if (auth.loading) return null
    return resolveRedirectForGuard(auth.user, mode)
  }, [auth.loading, auth.user, mode])

  const authorized = useMemo(() => {
    if (auth.loading) return false
    return canAccessGuard(auth.user, mode)
  }, [auth.loading, auth.user, mode])

  useEffect(() => {
    if (auth.loading) return
    if (redirectTo) router.replace(redirectTo)
  }, [auth.loading, redirectTo, router])

  return {
    ...auth,
    authorized,
    redirectTo,
  }
}