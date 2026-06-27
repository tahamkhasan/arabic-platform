'use client'

import { useEffect, useMemo, useState } from 'react'
import type { LessonFormState, LessonItem } from '@/types/lessons'
import { emptyLessonForm, formFromLesson } from '@/types/lessons'

type UseLessonsPageArgs = {
  unitId: string
  accessToken: string | null
}

export function useLessonsPage({ unitId, accessToken }: UseLessonsPageArgs) {
  const [lessons, setLessons] = useState<LessonItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<LessonItem | null>(null)
  const [form, setForm] = useState<LessonFormState>(emptyLessonForm)

  useEffect(() => {
    if (unitId) loadLessons()
  }, [unitId])

  async function loadLessons() {
    try {
      setLoading(true)
      const res = await fetch(`/api/lessons?unitId=${unitId}`)
      const data = await res.json().catch(() => null)
      setLessons(Array.isArray(data?.lessons) ? data.lessons : [])
    } catch (error: any) {
      setMsg(error?.message || 'حدث خطأ أثناء تحميل الدروس.')
    } finally {
      setLoading(false)
    }
  }

  const filteredLessons = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return lessons
    return lessons.filter((l) =>
      [l.name, l.description].filter(Boolean).join(' ').toLowerCase().includes(q)
    )
  }, [lessons, search])

  function openCreateModal() {
    setEditingLesson(null)
    setForm({ ...emptyLessonForm, order_num: lessons.length + 1 })
    setModalOpen(true)
  }

  function openEditModal(lesson: LessonItem) {
    setEditingLesson(lesson)
    setForm(formFromLesson(lesson))
    setModalOpen(true)
  }

  function closeModal() {
    if (saving || deleting) return
    setModalOpen(false)
    setEditingLesson(null)
    setForm(emptyLessonForm)
  }

  function updateForm<K extends keyof LessonFormState>(key: K, value: LessonFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function submitLesson() {
    if (!accessToken) return
    if (!form.name.trim()) {
      setMsg('اسم الدرس مطلوب.')
      return
    }

    try {
      setSaving(true)
      setMsg('')

      const fd = new FormData()
      fd.append('unitId', unitId)
      fd.append('name', form.name.trim())
      fd.append('description', form.description.trim())
      fd.append('content', form.content.trim())
      fd.append('order_num', String(form.order_num))
      fd.append('is_active', String(form.is_active))

      if (form.removeVideo) {
        fd.append('removeVideo', 'true')
      } else if (form.videoFile) {
        fd.append('videoFile', form.videoFile)
      } else if (form.videoLink.trim()) {
        fd.append('videoLink', form.videoLink.trim())
      }

      for (const file of form.newFiles) {
        fd.append('files', file)
      }
      fd.append('existingFileUrls', JSON.stringify(form.existingFileUrls))

      const res = await fetch(
        editingLesson ? `/api/lessons/${editingLesson.id}` : '/api/lessons',
        {
          method: editingLesson ? 'PATCH' : 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: fd,
        }
      )

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(
          data?.error || (editingLesson ? 'تعذر تعديل الدرس.' : 'تعذر إنشاء الدرس.')
        )
      }

      await loadLessons()
      setMsg(
        editingLesson ? `تم تحديث درس ${form.name} بنجاح.` : `تم إنشاء درس ${form.name} بنجاح.`
      )
      closeModal()
      setTimeout(() => setMsg(''), 2500)
    } catch (error: any) {
      setMsg(error?.message || 'حدث خطأ أثناء حفظ الدرس.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteLesson(lesson: LessonItem) {
    if (!accessToken) return
    const ok = window.confirm(`هل تريد حذف درس "${lesson.name}"؟`)
    if (!ok) return

    try {
      setDeleting(true)
      setMsg('')

      const res = await fetch(`/api/lessons/${lesson.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || 'تعذر حذف الدرس.')
      }

      setLessons((prev) => prev.filter((l) => l.id !== lesson.id))
      setMsg(`تم حذف درس ${lesson.name} بنجاح.`)
      setTimeout(() => setMsg(''), 2500)
    } catch (error: any) {
      setMsg(error?.message || 'حدث خطأ أثناء حذف الدرس.')
    } finally {
      setDeleting(false)
    }
  }

  return {
    lessons,
    filteredLessons,
    loading,
    saving,
    deleting,
    msg,
    search,
    modalOpen,
    editingLesson,
    form,
    setSearch,
    loadLessons,
    openCreateModal,
    openEditModal,
    closeModal,
    updateForm,
    submitLesson,
    deleteLesson,
  }
}