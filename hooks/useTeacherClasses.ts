'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AppUser } from '@/lib/auth/auth.types'
import { apiFetch } from '@/lib/auth/auth.fetch'
import type {
  ClassDetail,
  ClassItem,
  TeacherTab,
} from '@/lib/teacher/teacher.types'

interface Params {
  user: AppUser | null
  accessToken: string | null
  tab: TeacherTab
}

export function useTeacherClasses({ user, accessToken, tab }: Params) {
  const [classes, setClasses] = useState<ClassItem[]>([])

  const [gName, setGName] = useState('')
  const [gSubject, setGSubject] = useState('')
  const [gLevel, setGLevel] = useState('')
  const [creatingG, setCreatingG] = useState(false)
  const [gDone, setGDone] = useState(false)
  const [showNewG, setShowNewG] = useState(false)

  const [openClass, setOpenClass] = useState<ClassDetail | null>(null)
  const [loadingClassDetail, setLoadingClassDetail] = useState(false)
  const [addingMember, setAddingMember] = useState(false)
  const [classError, setClassError] = useState('')

  const loadClasses = useCallback(async () => {
    if (!accessToken) return
    const res = await apiFetch('/api/classes')
    const data = await res.json().catch(() => null)
    setClasses(data?.items ?? data?.data?.items ?? [])
  }, [accessToken])

  useEffect(() => {
    if (!accessToken) return
    if (tab !== 'assignments' && tab !== 'classes') return

    loadClasses().catch(() => setClasses([]))
  }, [accessToken, tab, loadClasses])

  async function createClass() {
    if (!user || !accessToken || !gName.trim()) return

    setCreatingG(true)
    setClassError('')

    try {
      const res = await apiFetch('/api/classes', {
        method: 'POST',
        body: JSON.stringify({
          name: gName,
          level: gLevel || undefined,
          subject_id: gSubject || undefined,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setClassError(data?.error || 'فشل إنشاء الفصل.')
        return
      }

      setGDone(true)
      setGName('')
      setGSubject('')
      setGLevel('')

      setTimeout(() => {
        setGDone(false)
        setShowNewG(false)
      }, 1500)

      await loadClasses()
    } catch {
      setClassError('تعذّر الاتصال بالخادم.')
    } finally {
      setCreatingG(false)
    }
  }

  async function openClassDetail(classId: string) {
    if (!accessToken) return

    setLoadingClassDetail(true)
    try {
      const res = await apiFetch(`/api/classes/${classId}`)
      const data = await res.json().catch(() => null)
      if (res.ok) setOpenClass(data?.data ?? data)
    } finally {
      setLoadingClassDetail(false)
    }
  }

  async function addToClass(classId: string, studentId: string) {
    if (!accessToken) return

    setAddingMember(true)
    try {
      await apiFetch(`/api/classes/${classId}/students`, {
        method: 'POST',
        body: JSON.stringify({ student_id: studentId }),
      })

      await openClassDetail(classId)
      await loadClasses()
    } finally {
      setAddingMember(false)
    }
  }

  async function removeFromClass(classId: string, studentId: string) {
    if (!accessToken) return

    await apiFetch(`/api/classes/${classId}/students`, {
      method: 'DELETE',
      body: JSON.stringify({ student_id: studentId }),
    })

    await openClassDetail(classId)
    await loadClasses()
  }

  async function deleteClass(classId: string) {
    if (!accessToken) return
    if (!confirm('هل تريد حذف هذا الفصل؟')) return

    const res = await apiFetch(`/api/classes/${classId}`, {
      method: 'DELETE',
    })

    const data = await res.json().catch(() => null)
    if (!res.ok) {
      alert(data?.error || 'فشل حذف الفصل.')
      return
    }

    setOpenClass(null)
    await loadClasses()
  }

  return {
    classes,

    gName,
    setGName,
    gSubject,
    setGSubject,
    gLevel,
    setGLevel,
    creatingG,
    gDone,
    showNewG,
    setShowNewG,

    openClass,
    setOpenClass,
    loadingClassDetail,
    addingMember,
    classError,
    setClassError,

    loadClasses,
    createClass,
    openClassDetail,
    addToClass,
    removeFromClass,
    deleteClass,
  }
}