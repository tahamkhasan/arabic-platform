'use client'
import { useCallback, useState } from 'react'
import type { User, RoleItem } from '@/types/admin.types'
import type { StageKey, TrackKey } from '@/lib/constants/stages'

export function useAdminModals(params: {
  adminAccessToken: string | null
  users: User[]
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
  roles: RoleItem[]
  router: any
  setActionMsg: (msg: string) => void
  reloadUsers: () => Promise<void>
}) {
  const { adminAccessToken, users, setUsers, roles, router, setActionMsg, reloadUsers } = params

  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [assigningRole, setAssigningRole] = useState(false)

  const [stageModalOpen, setStageModalOpen] = useState(false)
  const [stageModalUser, setStageModalUser] = useState<User | null>(null)
  const [modalStage, setModalStage] = useState<StageKey | null>(null)
  const [modalGrade, setModalGrade] = useState<string | null>(null)
  const [modalTrack, setModalTrack] = useState<TrackKey | null>(null)
  const [savingStage, setSavingStage] = useState(false)

  const [subscriptionsModalUser, setSubscriptionsModalUser] = useState<User | null>(null)
  const [subscriptionsAccessToken, setSubscriptionsAccessToken] = useState('')

  const [showAddTeacher, setShowAddTeacher] = useState(false)
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showAddParent, setShowAddParent] = useState(false)
  const [assignSubjectsFor, setAssignSubjectsFor] = useState<User | null>(null)
  const [assignScopeFor, setAssignScopeFor] = useState<User | null>(null)

  function openRoleModal(user: User) {
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

  function openStageModal(user: User) {
    setStageModalUser(user)
    setModalStage((user.allowed_stages?.[0] as StageKey) || null)
    setModalGrade(user.allowed_grades?.[0] || null)
    setModalTrack((user.track as TrackKey) || null)
    setStageModalOpen(true)
  }

  function closeStageModal() {
    if (savingStage) return
    setStageModalOpen(false)
    setStageModalUser(null)
    setModalStage(null)
    setModalGrade(null)
    setModalTrack(null)
  }

  const openSubscriptionsModal = useCallback(
    async (user: User) => {
      if (!adminAccessToken) {
        router.replace('/login')
        return
      }
      setSubscriptionsAccessToken(adminAccessToken)
      setSubscriptionsModalUser(user)
    },
    [adminAccessToken, router],
  )

  function closeSubscriptionsModal() {
    setSubscriptionsModalUser(null)
    setSubscriptionsAccessToken('')
  }

  const saveStageAssignment = useCallback(
    async (approveAfterAssign: boolean) => {
      if (!stageModalUser || !modalStage || !modalGrade) {
        setActionMsg('يرجى اختيار المرحلة والصف.')
        return
      }

      const needsTrack = modalGrade === '11' || modalGrade === '12'
      if (needsTrack && !modalTrack) {
        setActionMsg('يرجى اختيار التشعيب للصف 11 أو 12.')
        return
      }

      try {
        setSavingStage(true)
        setActionMsg('')

        if (!adminAccessToken) {
          router.replace('/login')
          return
        }

        const updates: Record<string, any> = {
          userId: stageModalUser.id,
          allowed_stages: [modalStage],
          allowed_grades: [modalGrade],
          track: needsTrack ? modalTrack : null,
        }

        if (approveAfterAssign) {
          updates.status = 'approved'
          updates.approved = true
        }

        const res = await fetch('/api/users', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminAccessToken}`,
          },
          body: JSON.stringify(updates),
        })

        const data = await res.json().catch(() => null)

        if (!res.ok) {
          if (res.status === 401) {
            router.replace('/login')
            return
          }
          throw new Error(data?.error || 'فشل حفظ المرحلة والصف.')
        }

        setUsers(prev =>
          prev.map(u =>
            u.id === stageModalUser.id
              ? {
                  ...u,
                  allowed_stages: [modalStage],
                  allowed_grades: [modalGrade],
                  track: needsTrack ? modalTrack : null,
                  ...(approveAfterAssign ? { status: 'approved', approved: true } : {}),
                }
              : u,
          ),
        )

        setActionMsg('تم حفظ المرحلة والصف بنجاح.')
        setTimeout(() => setActionMsg(''), 2500)
        closeStageModal()
      } catch (error: any) {
        setActionMsg(error?.message || 'حدث خطأ أثناء الحفظ.')
      } finally {
        setSavingStage(false)
      }
    },
    [adminAccessToken, modalGrade, modalStage, modalTrack, router, setActionMsg, setUsers, stageModalUser],
  )

  const assignRoleToUser = useCallback(async () => {
    if (!selectedUser) return
    if (!selectedRoleId) {
      setActionMsg('❌ اختر دورًا أولًا.')
      return
    }

    try {
      setAssigningRole(true)
      setActionMsg('')

      if (!adminAccessToken) {
        router.replace('/login')
        return
      }

      const res = await fetch('/api/users/assign-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminAccessToken}`,
        },
        body: JSON.stringify({ userId: selectedUser.id, roleId: selectedRoleId }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        if (res.status === 401) {
          router.replace('/login')
          return
        }
        throw new Error(data?.error || 'تعذر تعيين الدور.')
      }

      const updated = data?.item
      const selectedRole = roles.find(r => String(r.id) === String(selectedRoleId))

      setUsers(prev =>
        prev.map(u =>
          u.id === selectedUser.id
            ? {
                ...u,
                ...updated,
                assigned_role_id: updated?.assigned_role_id ?? selectedRoleId,
                assigned_role:
                  updated?.assigned_role ??
                  (selectedRole
                    ? {
                        id: String(selectedRole.id),
                        key: selectedRole.key,
                        name: selectedRole.name,
                        description: selectedRole.description ?? null,
                        permissions: selectedRole.permissions ?? [],
                        is_active: selectedRole.is_active !== false,
                      }
                    : null),
              }
            : u,
        ),
      )

      setActionMsg(`✅ تم تعيين دور ${selectedRole?.name || 'محدد'} للمستخدم بنجاح.`)
      setTimeout(() => setActionMsg(''), 2500)
      closeRoleModal()
    } catch (error: any) {
      setActionMsg(`❌ ${error?.message || 'حدث خطأ أثناء تعيين الدور.'}`)
    } finally {
      setAssigningRole(false)
    }
  }, [adminAccessToken, roles, router, selectedRoleId, selectedUser, setActionMsg, setUsers])

  const removeAssignedRole = useCallback(async () => {
    if (!selectedUser) return

    try {
      setAssigningRole(true)
      setActionMsg('')

      if (!adminAccessToken) {
        router.replace('/login')
        return
      }

      const res = await fetch('/api/users/assign-role', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminAccessToken}`,
        },
        body: JSON.stringify({ userId: selectedUser.id }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        if (res.status === 401) {
          router.replace('/login')
          return
        }
        throw new Error(data?.error || 'تعذر إزالة الدور.')
      }

      const updated = data?.item

      setUsers(prev =>
        prev.map(u => (u.id === selectedUser.id ? { ...u, ...updated, assigned_role_id: null, assigned_role: null } : u)),
      )

      setActionMsg('✅ تمت إزالة الدور من المستخدم بنجاح.')
      setTimeout(() => setActionMsg(''), 2500)
      closeRoleModal()
    } catch (error: any) {
      setActionMsg(`❌ ${error?.message || 'حدث خطأ أثناء إزالة الدور.'}`)
    } finally {
      setAssigningRole(false)
    }
  }, [adminAccessToken, router, selectedUser, setActionMsg, setUsers])

  return {
    roleModalOpen,
    selectedUser,
    selectedRoleId,
    setSelectedRoleId,
    assigningRole,
    openRoleModal,
    closeRoleModal,
    assignRoleToUser,
    removeAssignedRole,

    stageModalOpen,
    stageModalUser,
    modalStage,
    setModalStage,
    modalGrade,
    setModalGrade,
    modalTrack,
    setModalTrack,
    savingStage,
    openStageModal,
    closeStageModal,
    saveStageAssignment,

    subscriptionsModalUser,
    subscriptionsAccessToken,
    openSubscriptionsModal,
    closeSubscriptionsModal,

    showAddTeacher,
    setShowAddTeacher,
    showAddStudent,
    setShowAddStudent,
    showAddParent,
    setShowAddParent,
    assignSubjectsFor,
    setAssignSubjectsFor,
    assignScopeFor,
    setAssignScopeFor,
  }
}