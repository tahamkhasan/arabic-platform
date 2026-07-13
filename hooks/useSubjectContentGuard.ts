'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { MeUser } from '@/types/roles'

export function useSubjectContentGuard(subjectId: string | null) {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [guardError, setGuardError] = useState('')

  useEffect(() => {
    let mounted = true

    async function run() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session?.access_token) {
          router.replace('/login')
          return
        }

        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const data = await res.json().catch(() => null)
        const me = data?.user as MeUser | undefined

        if (!res.ok || !me) {
          router.replace('/dashboard')
          return
        }

        if (me.role === 'admin') {
          if (!mounted) return
          setAccessToken(session.access_token)
          setReady(true)
          return
        }

        const isTeacher = me.role === 'teacher' || (me as any).user_type === 'teacher'
        if (!isTeacher || !subjectId) {
          router.replace('/dashboard')
          return
        }

        const scopeRes = await fetch('/api/teacher-scopes/mine', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const scopeData = await scopeRes.json().catch(() => null)
        const allowed = (scopeData?.items ?? []).some((s: any) => s.subject_id === subjectId)

        if (!allowed) {
          router.replace('/teacher')
          return
        }

        if (!mounted) return
        setAccessToken(session.access_token)
        setReady(true)
      } catch (error: any) {
        if (!mounted) return
        setGuardError(error?.message || 'تعذر التحقق من الصلاحيات.')
      }
    }

    run()
    return () => {
      mounted = false
    }
  }, [router, subjectId])

  return { ready, accessToken, guardError, router }
}