'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { AdminUserItem } from '@/types/users-admin'

type RoleOption = {
  id: string
  name: string
  key?: string
  is_active?: boolean
  [key: string]: unknown
}

type UseAdminUsersArgs = {
  enabled?: boolean
}

export function useAdminUsers({ enabled = true }: UseAdminUsersArgs = {}) {
  const router = useRouter()

  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [roles, setRoles] = useState<RoleOption[]>([])

  const [usersLoading, setUsersLoading] = useState(true)
  const [rolesLoading, setRolesLoading] = useState(false)
  const [assigningRole, setAssigningRole] = useState(false)

  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')

  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState('')

  async function getAccessToken() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session?.access_token) {
      router.replace('/login')
      return null
    }

    return session.access_token
  }

  async function loadUsers(token?: string) {
    try {
      setUsersLoading(true)
      const accessToken = token || (await getAccessToken())
      if (!accessToken) return

      const res = await fetch('/api/users', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || 'تعذر تحميل المستخدمين.')
      }

      setUsers(Array.isArray(data?.items) ? data.items : [])
    } catch (error: any) {
      setMsg(error?.message || 'حدث خطأ أثناء تحميل المستخدمين.')
    } finally {
      setUsersLoading(false)
    }
  }

  async function loadRoles(token?: string) {
    try {
      setRolesLoading(true)
      const accessToken = token || (await getAccessToken())
      if (!accessToken) return

      const res = await fetch('/api/roles', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || 'تعذر تحميل الأدوار.')
      }

      const items = Array.isArray(data?.items) ? data.items : []
      setRoles(items.filter((role: RoleOption) => role.is_active !== false))
    } catch (error: any) {
      setMsg(error?.message || 'حدث خطأ أثناء تحميل الأدوار.')
    } finally {
      setRolesLoading(false)
    }
  }

  useEffect(() => {
    if (!enabled) return
    let mounted = true

    async function boot() {
      const accessToken = await getAccessToken()
      if (!accessToken || !mounted) return

      await Promise.all([loadUsers(accessToken), loadRoles(accessToken)])
    }

    boot()

    return () => {
      mounted = false
    }
  }, [enabled])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users

    return users.filter((user) =>
      [
        user.email,
        user.full_name,
        user.role,
        user.user_type,
        user.assigned_role?.name,
        user.assigned_role?.key,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [users, search])

  function openRoleModal(user: AdminUserItem) {
    setSelectedUser(user)
    setSelectedRoleId(user.assigned_role_id || '')
    setRoleModalOpen(true)
  }

  function closeRoleModal() {
    if (assigningRole) return
    setRoleModalOpen(false)
    setSelectedUser(null)
    setSelectedRoleId('')
  }

  async function assignRoleToUser() {
    if (!selectedUser) return

    if (!selectedRoleId) {
      setMsg('اختر دورًا أولًا.')
      return
    }

    try {
      setAssigningRole(true)
      setMsg('')

      const accessToken = await getAccessToken()
      if (!accessToken) return

      const res = await fetch('/api/users/assign-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          roleId: selectedRoleId,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || 'تعذر تعيين الدور.')
      }

      const updatedUser = data?.item as AdminUserItem | undefined

      if (updatedUser) {
        setUsers((prev) =>
          prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
        )
      } else {
        await loadUsers(accessToken)
      }

      setMsg('تم تعيين الدور للمستخدم بنجاح.')
      closeRoleModal()
      setTimeout(() => setMsg(''), 2500)
    } catch (error: any) {
      setMsg(error?.message || 'حدث خطأ أثناء تعيين الدور.')
    } finally {
      setAssigningRole(false)
    }
  }

  async function removeAssignedRole() {
    if (!selectedUser) return

    try {
      setAssigningRole(true)
      setMsg('')

      const accessToken = await getAccessToken()
      if (!accessToken) return

      const res = await fetch('/api/users/assign-role', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || 'تعذر إزالة الدور.')
      }

      const updatedUser = data?.item as AdminUserItem | undefined

      if (updatedUser) {
        setUsers((prev) =>
          prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
        )
      } else {
        await loadUsers(accessToken)
      }

      setMsg('تمت إزالة الدور من المستخدم بنجاح.')
      closeRoleModal()
      setTimeout(() => setMsg(''), 2500)
    } catch (error: any) {
      setMsg(error?.message || 'حدث خطأ أثناء إزالة الدور.')
    } finally {
      setAssigningRole(false)
    }
  }

  return {
    users,
    roles,
    usersLoading,
    rolesLoading,
    assigningRole,
    msg,
    search,
    setSearch,
    filteredUsers,

    roleModalOpen,
    selectedUser,
    selectedRoleId,
    setSelectedRoleId,

    loadUsers,
    loadRoles,
    openRoleModal,
    closeRoleModal,
    assignRoleToUser,
    removeAssignedRole,
  }
}