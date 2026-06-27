'use client'
import { useState, useCallback, useMemo, useEffect } from 'react'
import type { PackageItem, PackageFormState } from '@/types/packages'

// hooks/usePackagesPage.ts — يطابق بنية useSubjectsPage/useUnitsPage تماماً

const EMPTY_FORM: PackageFormState = {
  name: '',
  stage: 'secondary',
  grade: '',
  track: null,
  description: '',
  is_active: true,
}

export function usePackagesPage({ accessToken }: { accessToken: string }) {
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(null)
  const [form, setForm] = useState<PackageFormState>(EMPTY_FORM)

  const loadPackages = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/subject-packages?includeInactive=true')
      const data = await res.json()
      setPackages(data.items ?? [])
    } catch {
      setMsg('❌ تعذر تحميل الباقات.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPackages()
  }, [loadPackages])

  const filteredPackages = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return packages
    return packages.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
    )
  }, [packages, search])

  function openCreateModal() {
    setEditingPackage(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEditModal(pkg: PackageItem) {
    setEditingPackage(pkg)
    setForm({
      name: pkg.name,
      stage: pkg.stage,
      grade: pkg.grade,
      track: pkg.track,
      description: pkg.description ?? '',
      is_active: pkg.is_active,
    })
    setModalOpen(true)
  }

  function closeModal() {
    if (saving) return
    setModalOpen(false)
    setEditingPackage(null)
  }

  function updateForm<K extends keyof PackageFormState>(key: K, value: PackageFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function submitPackage() {
    setSaving(true)
    setMsg('')
    try {
      const isEdit = Boolean(editingPackage)
      const url = isEdit ? `/api/subject-packages/${editingPackage!.id}` : '/api/subject-packages'
      const method = isEdit ? 'PATCH' : 'POST'

      // ملاحظة: stage/grade/track تُرسَل فقط عند الإنشاء — PATCH لا يقبلها
      // أصلاً (قرار مُتعمَّد في الـAPI نفسه، انظر تعليق الملف هناك)
      const body = isEdit
        ? { name: form.name, description: form.description, is_active: form.is_active }
        : {
            name: form.name,
            stage: form.stage,
            grade: form.grade,
            track: form.track,
            description: form.description,
          }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setMsg(`❌ ${data?.error || 'فشل الحفظ.'}`)
        return
      }

      setMsg(isEdit ? '✅ تم تحديث الباقة بنجاح.' : '✅ تم إنشاء الباقة بنجاح.')
      setTimeout(() => setMsg(''), 2500)
      closeModal()
      await loadPackages()
    } catch {
      setMsg('❌ تعذر الاتصال.')
    } finally {
      setSaving(false)
    }
  }

  async function deletePackage(pkg: PackageItem) {
    if (!confirm(`حذف باقة "${pkg.name}"؟`)) return
    setDeleting(true)
    setMsg('')
    try {
      const res = await fetch(`/api/subject-packages/${pkg.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setMsg(`❌ ${data?.error || 'فشل الحذف.'}`)
        return
      }

      setMsg('✅ تم حذف الباقة بنجاح.')
      setTimeout(() => setMsg(''), 2500)
      await loadPackages()
    } catch {
      setMsg('❌ تعذر الاتصال.')
    } finally {
      setDeleting(false)
    }
  }

  return {
    packages,
    filteredPackages,
    loading,
    saving,
    deleting,
    msg,
    search,
    modalOpen,
    editingPackage,
    form,
    setSearch,
    loadPackages,
    openCreateModal,
    openEditModal,
    closeModal,
    updateForm,
    submitPackage,
    deletePackage,
  }
}