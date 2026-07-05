'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AppUser } from '@/lib/auth/auth.types'
import { apiFetch } from '@/lib/auth/auth.fetch'
import type {
  Assignment,
  AssignmentTarget,
  QuizOption,
  TeacherTab,
} from '@/lib/teacher/teacher.types'

interface Params {
  user: AppUser | null
  accessToken: string | null
  tab: TeacherTab
}

export function useTeacherAssignments({ user, accessToken, tab }: Params) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [quizzesList, setQuizzesList] = useState<QuizOption[]>([])

  const [aTitle, setATitle] = useState('')
  const [aDescription, setADescription] = useState('')
  const [aQuizId, setAQuizId] = useState('')
  const [aTarget, setATarget] = useState<AssignmentTarget>('all')
  const [aTargetIds, setATargetIds] = useState<string[]>([])
  const [aDeadline, setADeadline] = useState('')

  const [sendingA, setSendingA] = useState(false)
  const [aDone, setADone] = useState(false)
  const [aError, setAError] = useState('')

  const reloadAssignments = useCallback(async () => {
    if (!user || !accessToken) return

    const res = await apiFetch(`/api/assignments?teacherId=${user.id}`)
    const data = await res.json().catch(() => null)
    setAssignments(data?.assignments ?? [])
  }, [user, accessToken])

  const loadQuizzes = useCallback(async () => {
    if (!accessToken) return

    const res = await apiFetch('/api/quizzes?status=published&page_size=100')
    const data = await res.json().catch(() => null)
    setQuizzesList(data?.data?.items ?? data?.items ?? [])
  }, [accessToken])

  useEffect(() => {
    if (!accessToken || tab !== 'assignments') return

    loadQuizzes().catch(() => setQuizzesList([]))
    reloadAssignments().catch(() => setAssignments([]))
  }, [accessToken, tab, loadQuizzes, reloadAssignments])

  async function sendAssignment() {
    if (!user || !accessToken || !aTitle.trim() || !aQuizId) return

    if ((aTarget === 'class' || aTarget === 'student') && aTargetIds.length === 0) {
      setAError(aTarget === 'class' ? 'اختر فصلاً واحداً على الأقل.' : 'اختر طالباً واحداً على الأقل.')
      return
    }

    setSendingA(true)
    setAError('')

    try {
      const res = await apiFetch('/api/assignments', {
        method: 'POST',
        body: JSON.stringify({
          teacherId: user.id,
          quizId: aQuizId,
          title: aTitle.trim(),
          description: aDescription.trim() || undefined,
          targetType: aTarget,
          targetIds: aTargetIds,
          dueDate: aDeadline || null,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setAError(data?.error || 'فشل إرسال المهمة.')
        return
      }

      setADone(true)
      setATitle('')
      setADescription('')
      setAQuizId('')
      setATarget('all')
      setATargetIds([])
      setADeadline('')

      setTimeout(() => setADone(false), 3000)

      await reloadAssignments()
    } catch {
      setAError('تعذّر الاتصال بالخادم.')
    } finally {
      setSendingA(false)
    }
  }

  return {
    assignments,
    quizzesList,

    aTitle,
    setATitle,
    aDescription,
    setADescription,
    aQuizId,
    setAQuizId,
    aTarget,
    setATarget,
    aTargetIds,
    setATargetIds,
    aDeadline,
    setADeadline,

    sendingA,
    aDone,
    aError,

    reloadAssignments,
    sendAssignment,
  }
}