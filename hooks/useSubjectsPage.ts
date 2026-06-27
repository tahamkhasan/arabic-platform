'use client'

import { useEffect, useMemo, useState } from 'react'
import type { SubjectFormState, SubjectItem } from '@/types/subjects'
import { emptySubjectForm, formFromSubject } from '@/types/subjects'

type UseSubjectsPageArgs = {
  accessToken: string | null
}

export function useSubjectsPage({ accessToken }: UseSubjectsPageArgs) {
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null)
  const [form, setForm] = useState<SubjectFormState>(emptySubjectForm)

  useEffect(() => {
    loadSubjects()
  }, [])

  async function loadSubjects() {
    try {
      setLoading(true)
      const res = await fetch('/api/subjects')
      const data = await res.json().catch(() => null)
      setSubjects(Array.isArray(data?.subjects) ? data.subjects : [])
    } catch (error: any) {
      setMsg(error?.message || 'حدث خطأ أثناء تحميل المواد.')
    } finally {
      setLoading(false)
    }
  }

  const filteredSubjects = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return subjects
    return subjects.filter((s) =>
      [s.name, s.description].filter(Boolean).join(' ').toLowerCase().includes(q)
    )
  }, [subjects, search])

  function openCreateModal() {
    setEditingSubject(null)
    setForm(emptySubjectForm)
    setModalOpen(true)
  }

  function openEditModal(subject: SubjectItem) {
    setEditingSubject(subject)
    setForm(formFromSubject(subject))
    setModalOpen(true)
  }

  function closeModal() {
    if (saving || deleting) return
    setModalOpen(false)
    setEditingSubject(null)
    setForm(emptySubjectForm)
  }

  function updateForm<K extends keyof SubjectFormState>(key: K, value: SubjectFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function submitSubject() {
    if (!accessToken) return

    if (!form.name.trim()) {
      setMsg('اسم المادة مطلوب.')
      return
    }
    if (form.offerings.length === 0) {
      setMsg('أضف مرحلة وصفاً واحداً على الأقل للمادة.')
      return
    }

    try {
      setSaving(true)
      setMsg('')

      const payload = {
        name: form.name.trim(),
        icon: form.icon,
        description: form.description.trim() || null,
        content_overview: form.content_overview.trim() || null,
        curriculum: form.curriculum.trim() || null,
        teacher_intro_video_url: form.teacher_intro_video_url.trim() || null,
        is_active: form.is_active,
        offerings: form.offerings,
      }

      const res = await fetch(
        editingSubject ? `/api/subjects/${editingSubject.id}` : '/api/subjects',
        {
          method: editingSubject ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      )

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(
          data?.error || (editingSubject ? 'تعذر تعديل المادة.' : 'تعذر إنشاء المادة.')
        )
      }

      await loadSubjects()
      setMsg(
        editingSubject ? `تم تحديث مادة ${form.name} بنجاح.` : `تم إنشاء مادة ${form.name} بنجاح.`
      )
      closeModal()
      setTimeout(() => setMsg(''), 2500)
    } catch (error: any) {
      setMsg(error?.message || 'حدث خطأ أثناء حفظ المادة.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSubject(subject: SubjectItem) {
    if (!accessToken) return

    const ok = window.confirm(`هل تريد حذف مادة "${subject.name}"؟`)
    if (!ok) return

    try {
      setDeleting(true)
      setMsg('')

      const res = await fetch(`/api/subjects/${subject.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || 'تعذر حذف المادة.')
      }

      setSubjects((prev) => prev.filter((s) => s.id !== subject.id))
      setMsg(`تم حذف مادة ${subject.name} بنجاح.`)
      setTimeout(() => setMsg(''), 2500)
    } catch (error: any) {
      setMsg(error?.message || 'حدث خطأ أثناء حذف المادة.')
    } finally {
      setDeleting(false)
    }
  }

  return {
    subjects,
    filteredSubjects,
    loading,
    saving,
    deleting,
    msg,
    search,
    modalOpen,
    editingSubject,
    form,
    setSearch,
    loadSubjects,
    openCreateModal,
    openEditModal,
    closeModal,
    updateForm,
    submitSubject,
    deleteSubject,
  }
}