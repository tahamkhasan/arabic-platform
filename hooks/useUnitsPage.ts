'use client'

import { useEffect, useMemo, useState } from 'react'
import type { UnitFormState, UnitItem } from '@/types/units'
import { emptyUnitForm, formFromUnit } from '@/types/units'

type UseUnitsPageArgs = {
  subjectId: string
  accessToken: string | null
}

export function useUnitsPage({ subjectId, accessToken }: UseUnitsPageArgs) {
  const [units, setUnits] = useState<UnitItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<UnitItem | null>(null)
  const [form, setForm] = useState<UnitFormState>(emptyUnitForm)

  useEffect(() => {
    if (subjectId) loadUnits()
  }, [subjectId])

  async function loadUnits() {
    try {
      setLoading(true)
      const res = await fetch(`/api/units?subjectId=${subjectId}`)
      const data = await res.json().catch(() => null)
      setUnits(Array.isArray(data?.units) ? data.units : [])
    } catch (error: any) {
      setMsg(error?.message || 'حدث خطأ أثناء تحميل الوحدات.')
    } finally {
      setLoading(false)
    }
  }

  const filteredUnits = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return units
    return units.filter((u) =>
      [u.name, u.description].filter(Boolean).join(' ').toLowerCase().includes(q)
    )
  }, [units, search])

  function openCreateModal() {
    setEditingUnit(null)
    setForm({ ...emptyUnitForm, order_num: units.length + 1 })
    setModalOpen(true)
  }

  function openEditModal(unit: UnitItem) {
    setEditingUnit(unit)
    setForm(formFromUnit(unit))
    setModalOpen(true)
  }

  function closeModal() {
    if (saving || deleting) return
    setModalOpen(false)
    setEditingUnit(null)
    setForm(emptyUnitForm)
  }

  function updateForm<K extends keyof UnitFormState>(key: K, value: UnitFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function submitUnit() {
    if (!accessToken) return
    if (!form.name.trim()) {
      setMsg('اسم الوحدة مطلوب.')
      return
    }

    try {
      setSaving(true)
      setMsg('')

      const payload = {
        subject_id: subjectId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        icon: form.icon,
        order_num: form.order_num,
        is_active: form.is_active,
      }

      const res = await fetch(editingUnit ? `/api/units/${editingUnit.id}` : '/api/units', {
        method: editingUnit ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(
          data?.error || (editingUnit ? 'تعذر تعديل الوحدة.' : 'تعذر إنشاء الوحدة.')
        )
      }

      await loadUnits()
      setMsg(editingUnit ? `تم تحديث وحدة ${form.name} بنجاح.` : `تم إنشاء وحدة ${form.name} بنجاح.`)
      closeModal()
      setTimeout(() => setMsg(''), 2500)
    } catch (error: any) {
      setMsg(error?.message || 'حدث خطأ أثناء حفظ الوحدة.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteUnit(unit: UnitItem) {
    if (!accessToken) return
    const ok = window.confirm(`هل تريد حذف وحدة "${unit.name}"؟`)
    if (!ok) return

    try {
      setDeleting(true)
      setMsg('')

      const res = await fetch(`/api/units/${unit.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || 'تعذر حذف الوحدة.')
      }

      setUnits((prev) => prev.filter((u) => u.id !== unit.id))
      setMsg(`تم حذف وحدة ${unit.name} بنجاح.`)
      setTimeout(() => setMsg(''), 2500)
    } catch (error: any) {
      setMsg(error?.message || 'حدث خطأ أثناء حذف الوحدة.')
    } finally {
      setDeleting(false)
    }
  }

  return {
    units,
    filteredUnits,
    loading,
    saving,
    deleting,
    msg,
    search,
    modalOpen,
    editingUnit,
    form,
    setSearch,
    loadUnits,
    openCreateModal,
    openEditModal,
    closeModal,
    updateForm,
    submitUnit,
    deleteUnit,
  }
}