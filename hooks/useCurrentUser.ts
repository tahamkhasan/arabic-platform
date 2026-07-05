'use client'

import { useCallback, useEffect, useState } from 'react'
import { getCurrentSession } from '@/lib/auth/auth.session'
import type { AppUser } from '@/lib/auth/auth.types'

export function useCurrentUser() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getCurrentSession()
      setUser(result.user)
      setAccessToken(result.accessToken)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    user,
    accessToken,
    loading,
    refresh,
    setUser,
  }
}