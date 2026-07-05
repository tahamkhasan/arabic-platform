'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AppUser } from '@/lib/auth/auth.types'
import { apiFetch } from '@/lib/auth/auth.fetch'
import type {
  Submission,
  TeacherTab,
} from '@/lib/teacher/teacher.types'

interface Params {
  user: AppUser | null
  accessToken: string | null
  tab: TeacherTab
}

export function useTeacherSubmissions({ user, accessToken, tab }: Params) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [openSub, setOpenSub] = useState<Submission | null>(null)

  const [tGrade, setTGrade] = useState('')
  const [tFeedback, setTFeedback] = useState('')

  const [reviewing, setReviewing] = useState(false)
  const [reviewDone, setReviewDone] = useState(false)

  const reloadSubmissions = useCallback(async () => {
    if (!user || !accessToken) return

    const res = await apiFetch(`/api/submissions?teacherId=${user.id}`)
    const data = await res.json().catch(() => null)
    setSubmissions(data?.submissions ?? [])
  }, [user, accessToken])

  useEffect(() => {
    if (!user || !accessToken || tab !== 'submissions') return
    reloadSubmissions().catch(() => setSubmissions([]))
  }, [user, accessToken, tab, reloadSubmissions])

  const pendingReviews = useMemo(() => {
    return submissions.filter(
      s => s.status === 'submitted' && (s.teacher_grade === null || s.teacher_grade === undefined),
    ).length
  }, [submissions])

  async function submitReview() {
    if (!openSub) return

    setReviewing(true)
    try {
      const res = await apiFetch('/api/submissions', {
        method: 'PATCH',
        body: JSON.stringify({
          id: openSub.id,
          teacherGrade: Number(tGrade),
          teacherFeedback: tFeedback,
        }),
      })

      if (res.ok) {
        setReviewDone(true)
        setTGrade('')
        setTFeedback('')

        setTimeout(() => {
          setReviewDone(false)
          setOpenSub(null)
        }, 2000)

        await reloadSubmissions()
      }
    } finally {
      setReviewing(false)
    }
  }

  return {
    submissions,
    openSub,
    setOpenSub,

    tGrade,
    setTGrade,
    tFeedback,
    setTFeedback,

    reviewing,
    reviewDone,
    pendingReviews,

    reloadSubmissions,
    submitReview,
  }
}