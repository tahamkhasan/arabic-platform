'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AppUser } from '@/lib/auth/auth.types'
import { apiFetch } from '@/lib/auth/auth.fetch'
import type {
  Stats,
  TeacherTab,
} from '@/lib/teacher/teacher.types'

interface Params {
  user: AppUser | null
  accessToken: string | null
  tab: TeacherTab
}

export function useTeacherStats({ user, accessToken, tab }: Params) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  const reloadStats = useCallback(async () => {
    if (!user || !accessToken) return

    setStatsLoading(true)
    try {
      const res = await apiFetch(`/api/stats?teacherId=${user.id}`)
      const data = await res.json().catch(() => null)
      setStats(data)
    } catch {
      setStats(null)
    } finally {
      setStatsLoading(false)
    }
  }, [user, accessToken])

  useEffect(() => {
    if (!user || !accessToken || tab !== 'stats') return
    reloadStats()
  }, [user, accessToken, tab, reloadStats])

  return {
    stats,
    statsLoading,
    reloadStats,
  }
}