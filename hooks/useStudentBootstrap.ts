'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User, StageKey, TrackKey } from '@/types/student.types'

export function useStudentBootstrap() {
  const router = useRouter()
  const [booting, setBooting] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState('')
  const [selectedStage, setSelectedStage] = useState<StageKey | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null)
  const [selectedTrack, setSelectedTrack] = useState<TrackKey | null>(null)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const { data, error } = await supabase.auth.getSession()
        const session = data.session

        if (error || !session) {
          localStorage.removeItem('mosaed_user')
          localStorage.removeItem('mosaed_session')
          sessionStorage.clear()
          router.replace('/')
          return
        }

        const saved = localStorage.getItem('mosaed_user')

        if (!saved) {
          try {
            await supabase.auth.signOut()
          } catch {}
          localStorage.removeItem('mosaed_user')
          localStorage.removeItem('mosaed_session')
          sessionStorage.clear()
          router.replace('/')
          return
        }

        const u = JSON.parse(saved) as User

        if (u.role === 'admin') {
          router.replace('/admin')
          return
        }

        if (u.user_type !== 'student') {
          router.replace('/dashboard')
          return
        }

        if (u.status === 'pending' || u.status === 'suspended') {
          router.replace('/pending-approval')
          return
        }

        if (cancelled) return

        setUser(u)
        setAccessToken(session.access_token)

        const stage = (u.allowed_stages && u.allowed_stages[0]) as StageKey | undefined
        const grade = u.allowed_grades && u.allowed_grades[0]

        if (stage) setSelectedStage(stage)
        if (grade) setSelectedGrade(grade)
        if (stage === 'secondary' && (u.track === 'scientific' || u.track === 'literary')) {
          setSelectedTrack(u.track as TrackKey)
        }
      } catch {
        try {
          await supabase.auth.signOut()
        } catch {}

        localStorage.removeItem('mosaed_user')
        localStorage.removeItem('mosaed_session')
        sessionStorage.clear()
        router.replace('/')
      } finally {
        if (!cancelled) setBooting(false)
      }
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    if (!user) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) setAccessToken(data.session.access_token)
    })
  }, [user])

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
    } catch {}

    localStorage.removeItem('mosaed_user')
    localStorage.removeItem('mosaed_session')
    sessionStorage.clear()
    router.replace('/')
  }

  return {
    booting,
    user,
    accessToken,
    selectedStage,
    selectedGrade,
    selectedTrack,
    handleLogout,
  }
}