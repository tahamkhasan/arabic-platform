'use client'

import { useEffect, useMemo, useState } from 'react'
import type { RoleFormState, RoleItem } from '@/types/roles'
import { emptyRoleForm, formFromRole, normalizePermissions } from '@/types/roles'

type UseRolesPageArgs = {
  accessToken: string | null
}

export function useRolesPage({ accessToken }: UseRolesPageArgs) {
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null)
  const [form, setForm] = useState<RoleFormState>(emptyRoleForm)

  useEffect(() => {
    if (!accessToken) return
    loadRoles(accessToken)
  }, [accessToken])

  async function loadRoles(token = accessToken as string) {
    try {
      setLoading(true)
      const res = await fetch('/api/roles', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || 'تعذر تحميل الأدوار.')
      }

      setRoles(Array.isArray(data?.items) ? data.items : [])
    } catch (error: any) {
      setMsg(error?.message || 'حدث خطأ أثناء تحميل الأدوار.')
    } finally {
      setLoading(false)
    }
  }

  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return roles

    return roles.filter((role) =>
      [role.name, role.key, role.description, ...(role.permissions || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [roles, search])

  function openCreateModal() {
    setEditingRole(null)
    setForm(emptyRoleForm)
    setModalOpen(true)
  }

  function openEditModal(role: RoleItem) {
    setEditingRole(role)
    setForm(formFromRole(role))
    setModalOpen(true)
  }

  function closeModal() {
    if (saving || deleting) return
    setModalOpen(false)
    setEditingRole(null)
    setForm(emptyRoleForm)
  }

  function updateForm<K extends keyof RoleFormState>(key: K, value: RoleFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function submitRole() {
    if (!accessToken) return

    if (!form.key.trim() || !form.name.trim()) {
      setMsg('مفتاح الدور واسم الدور مطلوبان.')
      return
    }

    try {
      setSaving(true)
      setMsg('')

      const payload = {
        key: form.key.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        permissions: normalizePermissions(form.permissionsText),
        is_active: form.is_active,
      }

      const res = await fetch(editingRole ? `/api/roles/${editingRole.id}` : '/api/roles', {
        method: editingRole ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || (editingRole ? 'تعذر تعديل الدور.' : 'تعذر إنشاء الدور.'))
      }

      const item = data?.item as RoleItem | undefined

      if (item) {
        if (editingRole) {
          setRoles((prev) => prev.map((r) => (String(r.id) === String(item.id) ? item : r)))
          setMsg(`تم تحديث الدور ${item.name} بنجاح.`)
        } else {
          setRoles((prev) => [item, ...prev])
          setMsg(`تم إنشاء الدور ${item.name} بنجاح.`)
        }
      } else {
        await loadRoles(accessToken)
        setMsg(editingRole ? 'تم تعديل الدور بنجاح.' : 'تم إنشاء الدور بنجاح.')
      }

      closeModal()
      setTimeout(() => setMsg(''), 2500)
    } catch (error: any) {
      setMsg(error?.message || 'حدث خطأ أثناء حفظ الدور.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteRole(role: RoleItem) {
    if (!accessToken) return

    const ok = window.confirm(`هل تريد حذف الدور "${role.name}"؟`)
    if (!ok) return

    try {
      setDeleting(true)
      setMsg('')

      const res = await fetch(`/api/roles/${role.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || 'تعذر حذف الدور.')
      }

      setRoles((prev) => prev.filter((r) => String(r.id) !== String(role.id)))
      setMsg(`تم حذف الدور ${role.name} بنجاح.`)
      setTimeout(() => setMsg(''), 2500)
    } catch (error: any) {
      setMsg(error?.message || 'حدث خطأ أثناء حذف الدور.')
    } finally {
      setDeleting(false)
    }
  }

  return {
    roles,
    filteredRoles,
    loading,
    saving,
    deleting,
    msg,
    search,
    modalOpen,
    editingRole,
    form,
    setSearch,
    loadRoles,
    openCreateModal,
    openEditModal,
    closeModal,
    updateForm,
    submitRole,
    deleteRole,
  }
}