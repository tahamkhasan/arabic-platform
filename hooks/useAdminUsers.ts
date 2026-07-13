'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { User, RoleItem } from '@/types/admin.types'

export function useAdminUsers(params: {
  authorized: boolean
  admin: any
  adminAccessToken: string | null
  tab: string
  router: any
  setActionMsg: (msg: string) => void
}) {
  const { authorized, admin, adminAccessToken, tab, router, setActionMsg } = params

  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [loading, setLoading] = useState(false)
  const [rolesLoading, setRolesLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending'>('all')
  const [searchQ, setSearchQ] = useState('')

  useEffect(() => {
    if (!authorized || !admin) return
    if (tab !== 'students' && tab !== 'teachers') return

    let mounted = true

    async function loadUsers() {
      try {
        setLoading(true)
        setActionMsg('')

        if (!adminAccessToken) {
          throw new Error('انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى.')
        }

        const response = await fetch('/api/users', {
          headers: { Authorization: `Bearer ${adminAccessToken}` },
        })

        const text = await response.text()
        let data: any = null

        try {
          data = text ? JSON.parse(text) : null
        } catch {
          throw new Error(text || 'استجابة غير صالحة من الخادم')
        }

        if (!response.ok) {
          if (response.status === 401) {
            router.replace('/login')
          }
          throw new Error(data?.error || 'فشل في جلب المستخدمين')
        }

        if (!mounted) return
        setUsers(data?.items ?? [])
      } catch (error: any) {
        if (!mounted) return
        setActionMsg(`❌ ${error?.message || 'حدث خطأ غير متوقع'}`)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadUsers()

    return () => {
      mounted = false
    }
  }, [authorized, admin, adminAccessToken, tab, router, setActionMsg])

  useEffect(() => {
    if (!authorized || !admin) return
    if (tab !== 'students' && tab !== 'teachers') return

    let mounted = true

    async function loadRoles() {
      try {
        setRolesLoading(true)

        if (!adminAccessToken) {
          throw new Error('انتهت الجلسة. سجل الدخول مرة أخرى.')
        }

        const res = await fetch('/api/roles', {
          headers: { Authorization: `Bearer ${adminAccessToken}` },
        })

        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.error || 'تعذر تحميل الأدوار.')
        if (!mounted) return

        setRoles((data?.items || []).filter((r: RoleItem) => r?.is_active !== false))
      } catch (error: any) {
        if (!mounted) return
        setActionMsg(`❌ ${error?.message || 'تعذر تحميل الأدوار.'}`)
      } finally {
        if (mounted) setRolesLoading(false)
      }
    }

    void loadRoles()

    return () => {
      mounted = false
    }
  }, [authorized, admin, adminAccessToken, tab, setActionMsg])

  const reloadUsers = useCallback(async () => {
    try {
      if (!adminAccessToken) return

      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${adminAccessToken}` },
      })

      const data = await response.json().catch(() => null)
      if (response.ok) setUsers(data?.items ?? [])
    } catch {}
  }, [adminAccessToken])

  const updateUser = useCallback(
    async (userId: string, updates: Record<string, any>) => {
      try {
        if (!adminAccessToken) {
          router.replace('/login')
          setActionMsg('انتهت الجلسة. يرجى تسجيل الدخول من جديد.')
          return
        }

        const res = await fetch('/api/users', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminAccessToken}`,
          },
          body: JSON.stringify({ userId, ...updates }),
        })

        const data = await res.json().catch(() => null)

        if (res.ok) {
          setActionMsg('تم تحديث المستخدم بنجاح.')
          setTimeout(() => setActionMsg(''), 2500)
          setUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...updates } : u)))
        } else {
          if (res.status === 401) {
            router.replace('/login')
            return
          }
          setActionMsg(data?.error || 'فشل تحديث المستخدم.')
        }
      } catch (error: any) {
        setActionMsg(error?.message || 'حدث خطأ أثناء تحديث المستخدم.')
      }
    },
    [adminAccessToken, router, setActionMsg],
  )

  const deleteUser = useCallback(
    async (userId: string) => {
      if (!adminAccessToken) {
        router.replace('/login')
        setActionMsg('انتهت الجلسة. يرجى تسجيل الدخول من جديد.')
        return
      }

      try {
        setLoading(true)
        setActionMsg('')

        const res = await fetch('/api/users', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminAccessToken}`,
          },
          body: JSON.stringify({ userId }),
        })

        const data = await res.json().catch(() => null)

        if (!res.ok) {
          if (res.status === 401) {
            router.replace('/login')
            return
          }
          setActionMsg(data?.error || 'فشل حذف المستخدم.')
          return
        }

        setUsers(prev => prev.filter(u => u.id !== userId))
        setActionMsg('✅ تم حذف المستخدم بنجاح.')
        setTimeout(() => setActionMsg(''), 2500)
      } catch (error: any) {
        setActionMsg(error?.message || 'حدث خطأ أثناء حذف المستخدم.')
      } finally {
        setLoading(false)
      }
    },
    [adminAccessToken, router, setActionMsg],
  )

  const studentUsers = useMemo(() => users.filter(u => u.user_type === 'student'), [users])
  const teacherUsers = useMemo(
    () => users.filter(u => u.user_type === 'teacher' || u.role === 'teacher'),
    [users],
  )

  function filterList(list: User[]) {
    return list.filter(u => {
      const displayName = u.full_name || u.name || u.email || ''
      const q = searchQ.trim().toLowerCase()
      const email = (u.email || '').toLowerCase()

      const matchSearch =
        !q ||
        displayName.toLowerCase().includes(q) ||
        email.includes(q) ||
        (u.assigned_role?.name || '').toLowerCase().includes(q) ||
        (u.assigned_role?.key || '').toLowerCase().includes(q)

      const matchFilter = statusFilter === 'all' ? true : u.status === 'pending'
      return matchSearch && matchFilter
    })
  }

  const filteredStudents = useMemo(() => filterList(studentUsers), [studentUsers, searchQ, statusFilter])
  const filteredTeachers = useMemo(() => filterList(teacherUsers), [teacherUsers, searchQ, statusFilter])

  const pendingCount = users.filter(u => u.status === 'pending').length
  const studentsCount = studentUsers.length
  const teachersCount = teacherUsers.length

  return {
    users,
    setUsers,
    roles,
    loading,
    rolesLoading,
    statusFilter,
    setStatusFilter,
    searchQ,
    setSearchQ,
    studentUsers,
    teacherUsers,
    filteredStudents,
    filteredTeachers,
    pendingCount,
    studentsCount,
    teachersCount,
    reloadUsers,
    updateUser,
    deleteUser,
  }
}