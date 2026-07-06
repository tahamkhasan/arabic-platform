'use client'

import AddStudentModal from '@/components/admin/AddStudentModal'
import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRouteGuard } from '@/hooks/useRouteGuard'
import { signOutApp } from '@/lib/auth/auth.session'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'
import AdminSettingsPanel from '@/components/admin/AdminSettingsPanel'
import StudentSubscriptionsModal from '@/components/admin/StudentSubscriptionsModal'
import {
  AddTeacherModal,
  AssignSubjectsModal,
  AssignScopeModal,
} from '@/components/admin/TeacherManager'
import {
  STAGE_LABELS,
  GRADES_BY_STAGE,
  TRACK_LABELS,
  StageKey,
  TrackKey,
} from '@/lib/constants/stages'

import { AddParentModal } from '@/components/admin/ParentManager'

const T = {
  bg: BRAND.bg,
  cardBg: BRAND.bgSoft,
  textCol: BRAND.text,
  subCol: BRAND.sub,
  borderCol: BRAND.border,
  inputBg: 'rgba(140,20,40,0.04)',
  headerBg: 'rgba(247,242,234,0.92)',
  shadow: BRAND.shadow,
  gradMain: BRAND.gradMain,
  gradBlue: BRAND.gradBlue,
}

type AssignedRole = {
  id: string
  key: string
  name: string
  description?: string | null
  permissions?: string[]
  is_active?: boolean
} | null

interface User {
  id: string
  email: string
  role: string
  status: string
  user_type: string
  assigned_role_id?: string | null
  assigned_role?: AssignedRole
  is_active?: boolean
  allowed_grades?: string[]
  allowed_stages?: string[]
  track?: string | null
  avatar_url?: string | null
  current_term_id?: string | null
  created_at?: string
  created_by?: string | null
  last_seen_at?: string | null
  updated_at?: string | null
  permissions?: string[]
  approved?: boolean | null
  full_name?: string | null
  name?: string | null
}

interface RoleItem {
  id: string | number
  key: string
  name: string
  description?: string | null
  permissions?: string[]
  is_active?: boolean
}

type SubjectOffering = {
  stage: string
  grade: string
  track: 'scientific' | 'literary' | null
}

type Subject = {
  id: string
  name: string
  grade?: string
  icon?: string
  offerings?: SubjectOffering[]
}

interface SignalEvidenceStudent {
  class_name: string
  teacher_name: string
  teacher_id: string
  signals: {
    area_type: 'question_type' | 'bloom_level'
    area_label: string
    affected_count: number
    affected_student_names: string[]
    avg_accuracy: number
  }[]
}

interface SignalEvidenceTeacher {
  teacher_name: string
  avg_response_hours: number
  overall_avg_hours: number
  graded_count: number
  ratio: number
}

interface PlatformSignal {
  id: string
  signal_type: 'student_struggling' | 'teacher_slow_response'
  severity: 'info' | 'warning' | 'critical'
  subject_id: string
  subject_type: 'class' | 'teacher'
  evidence: SignalEvidenceStudent | SignalEvidenceTeacher
  status: 'pending' | 'dismissed' | 'action_taken'
  created_at: string
}

type Tab = 'students' | 'teachers' | 'stages' | 'signals' | 'stats' | 'settings'
type SubjectOccurrence = { subject: Subject; offering: SubjectOffering; isLegacy?: boolean }

function stageForLegacyGrade(grade?: string | null): StageKey | null {
  if (!grade) return null
  for (const stage of Object.keys(GRADES_BY_STAGE) as StageKey[]) {
    if (GRADES_BY_STAGE[stage].some(g => g.id === String(grade).trim())) return stage
  }
  return null
}

export default function AdminPage() {
  const router = useRouter()

  const {
    user: admin,
    accessToken: adminAccessToken,
    loading: authChecking,
    authorized,
  } = useRouteGuard('admin')

  const adminName =
    (admin as any)?.full_name ?? (admin as any)?.name ?? (admin as any)?.email ?? 'المدير'

  const [tab, setTab] = useState<Tab>('students')
  const [users, setUsers] = useState<User[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [roles, setRoles] = useState<RoleItem[]>([])

  const [loading, setLoading] = useState(false)
  const [rolesLoading, setRolesLoading] = useState(false)

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending'>('all')
  const [searchQ, setSearchQ] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  const [logoUrl, setLogoUrl] = useState('/logo-midad.png')

  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState('')

  const [stageModalOpen, setStageModalOpen] = useState(false)
  const [stageModalUser, setStageModalUser] = useState<User | null>(null)
  const [modalStage, setModalStage] = useState<StageKey | null>(null)
  const [modalGrade, setModalGrade] = useState<string | null>(null)
  const [modalTrack, setModalTrack] = useState<TrackKey | null>(null)
  const [savingStage, setSavingStage] = useState(false)
  const [assigningRole, setAssigningRole] = useState(false)

  const [subscriptionsModalUser, setSubscriptionsModalUser] = useState<User | null>(null)
  const [subscriptionsAccessToken, setSubscriptionsAccessToken] = useState('')

  const [showAddTeacher, setShowAddTeacher] = useState(false)
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showAddParent, setShowAddParent] = useState(false)
  const [assignSubjectsFor, setAssignSubjectsFor] = useState<User | null>(null)
  const [assignScopeFor, setAssignScopeFor] = useState<User | null>(null)
 
  const [signals, setSignals] = useState<PlatformSignal[]>([])
  const [signalsLoading, setSignalsLoading] = useState(false)
  const [resolvingSignalId, setResolvingSignalId] = useState<string | null>(null)

  const [activeStageTab, setActiveStageTab] = useState<StageKey>('primary')
  const [activeGrade, setActiveGrade] = useState<string | null>(null)
  const [activeTrack, setActiveTrack] = useState<TrackKey | null>(null)

  useEffect(() => {
    fetch('/api/platform-settings')
      .then(r => r.json())
      .then(d => {
        if (d.settings?.logo_url) setLogoUrl(d.settings.logo_url)
      })
      .catch(() => {})
  }, [])

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
  }, [authorized, admin, adminAccessToken, tab, router])

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
  }, [authorized, admin, adminAccessToken, tab])

  useEffect(() => {
    if (!authorized || !admin) return
    fetch('/api/subjects')
      .then(r => r.json())
      .then(d => setSubjects(d.subjects ?? []))
      .catch(() => {})
  }, [authorized, admin, tab])
  useEffect(() => {
    if (!authorized || !admin || tab !== 'signals') return

    let mounted = true

    async function loadSignals() {
      try {
        setSignalsLoading(true)

        if (!adminAccessToken) return

        const res = await fetch('/api/admin/signals', {
          headers: { Authorization: `Bearer ${adminAccessToken}` },
        })

        const data = await res.json().catch(() => null)
        if (!mounted) return

        if (res.ok) setSignals(data?.data?.signals ?? data?.signals ?? [])
        else setActionMsg(`❌ ${data?.error || 'تعذر تحميل الإشارات.'}`)
      } catch {
        if (mounted) setActionMsg('❌ تعذر الاتصال بالخادم لجلب الإشارات.')
      } finally {
        if (mounted) setSignalsLoading(false)
      }
    }

    void loadSignals()

    return () => {
      mounted = false
    }
  }, [authorized, admin, adminAccessToken, tab])

  async function resolveSignal(signalId: string, status: 'dismissed' | 'action_taken') {
    try {
      setResolvingSignalId(signalId)

      if (!adminAccessToken) return

      const res = await fetch('/api/admin/signals', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminAccessToken}`,
        },
        body: JSON.stringify({ signal_id: signalId, status }),
      })

      const data = await res.json().catch(() => null)

      if (res.ok) {
        setSignals(prev => prev.filter(s => s.id !== signalId))
        setActionMsg(status === 'dismissed' ? '✅ تم تجاهل الإشارة' : '✅ تم تسجيل التدخل')
        setTimeout(() => setActionMsg(''), 2500)
      } else {
        setActionMsg(`❌ ${data?.error || 'فشل تحديث الإشارة'}`)
      }
    } catch {
      setActionMsg('❌ حدث خطأ')
    } finally {
      setResolvingSignalId(null)
    }
  }

  async function reloadUsers() {
    try {
      if (!adminAccessToken) return

      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${adminAccessToken}` },
      })

      const data = await response.json().catch(() => null)
      if (response.ok) setUsers(data?.items ?? [])
    } catch {}
  }

  async function updateUser(userId: string, updates: Record<string, any>) {
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
}

  async function deleteUser(userId: string) {
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
  }

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

  async function openSubscriptionsModal(user: User) {
    if (!adminAccessToken) {
      router.replace('/login')
      return
    }

    setSubscriptionsAccessToken(adminAccessToken)
    setSubscriptionsModalUser(user)
  }

  function closeSubscriptionsModal() {
    setSubscriptionsModalUser(null)
    setSubscriptionsAccessToken('')
  }

  async function saveStageAssignment(approveAfterAssign: boolean) {
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
              allowedstages: [modalStage],
              allowedgrades: [modalGrade],
              track: needsTrack ? modalTrack : null,
              ...(approveAfterAssign ? { status: 'approved', approved: true } : {}),
            }
          : u
      )
    )

    setActionMsg('تم حفظ المرحلة والصف بنجاح.')
    setTimeout(() => setActionMsg(''), 2500)
    closeStageModal()
  } catch (error: any) {
    setActionMsg(error?.message || 'حدث خطأ أثناء الحفظ.')
  } finally {
    setSavingStage(false)
  }
}

  async function assignRoleToUser() {
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
        body: JSON.stringify({
          userId: selectedUser.id,
          roleId: selectedRoleId,
        }),
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
            : u
        )
      )

      setActionMsg(`✅ تم تعيين دور ${selectedRole?.name || 'محدد'} للمستخدم بنجاح.`)
      setTimeout(() => setActionMsg(''), 2500)
      closeRoleModal()
    } catch (error: any) {
      setActionMsg(`❌ ${error?.message || 'حدث خطأ أثناء تعيين الدور.'}`)
    } finally {
      setAssigningRole(false)
    }
  }

  async function removeAssignedRole() {
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
        prev.map(u =>
          u.id === selectedUser.id
            ? { ...u, ...updated, assigned_role_id: null, assigned_role: null }
            : u
        )
      )

      setActionMsg('✅ تمت إزالة الدور من المستخدم بنجاح.')
      setTimeout(() => setActionMsg(''), 2500)
      closeRoleModal()
    } catch (error: any) {
      setActionMsg(`❌ ${error?.message || 'حدث خطأ أثناء إزالة الدور.'}`)
    } finally {
      setAssigningRole(false)
    }
  }

  async function handleLogout() {
    await signOutApp()
    router.replace('/login')
  }

  const studentUsers = useMemo(() => users.filter(u => u.user_type === 'student'), [users])

  const teacherUsers = useMemo(
    () => users.filter(u => u.user_type === 'teacher' || u.role === 'teacher'),
    [users]
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

  const filteredStudents = useMemo(
    () => filterList(studentUsers),
    [studentUsers, searchQ, statusFilter]
  )

  const filteredTeachers = useMemo(
    () => filterList(teacherUsers),
    [teacherUsers, searchQ, statusFilter]
  )

  const pendingCount = users.filter(u => u.status === 'pending').length
  const studentsCount = studentUsers.length
  const teachersCount = teacherUsers.length

  const occurrencesByStage = useMemo(() => {
    const map: Record<StageKey, SubjectOccurrence[]> = { primary: [], middle: [], secondary: [] }

    for (const s of subjects) {
      const offerings = Array.isArray(s.offerings) ? s.offerings : []

      if (offerings.length > 0) {
        for (const o of offerings) {
          const stage = o.stage as StageKey
          if (map[stage]) map[stage].push({ subject: s, offering: o })
        }
      } else {
        const legacyStage = stageForLegacyGrade(s.grade)
        if (legacyStage && s.grade) {
          map[legacyStage].push({
            subject: s,
            offering: { stage: legacyStage, grade: String(s.grade).trim(), track: null },
            isLegacy: true,
          })
        }
      }
    }

    return map
  }, [subjects])

  const unassignedSubjects = useMemo(
    () =>
      subjects.filter(
        s => (!Array.isArray(s.offerings) || s.offerings.length === 0) && !stageForLegacyGrade(s.grade)
      ),
    [subjects]
  )

  const inputStyle: React.CSSProperties = {
    padding: '12px 14px',
    borderRadius: BRAND.radiusSm,
    border: `1.5px solid ${T.borderCol}`,
    background: T.inputBg,
    color: T.textCol,
    fontSize: 14,
    fontFamily: 'inherit',
  }

  const sectionCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.68)',
    border: `1px solid ${T.borderCol}`,
    borderRadius: BRAND.radiusXl,
    boxShadow: T.shadow,
    padding: 22,
    backdropFilter: 'blur(14px)',
  }

  const TABS: { id: Tab; icon: string; label: string; badge?: number; subtitle: string }[] = [
    { id: 'stages', icon: '🏫', label: 'المراحل', subtitle: 'عرض المراحل والصفوف والمواد' },
    { id: 'teachers', icon: '👨‍🏫', label: 'المعلمون', subtitle: 'إدارة حسابات المعلمين ونطاقاتهم' },
    {
      id: 'students',
      icon: '🎓',
      label: 'الطلاب',
      badge: studentUsers.filter(u => u.status === 'pending').length,
      subtitle: 'اعتماد الطلاب وتحديد الصفوف والاشتراكات',
    },
    { id: 'signals', icon: '🔔', label: 'الإشارات', badge: signals.length, subtitle: 'تنبيهات تحتاج مراجعة' },
    { id: 'stats', icon: '📊', label: 'الإحصائيات', subtitle: 'ملخص سريع لوضع المنصة' },
    { id: 'settings', icon: '⚙️', label: 'الإعدادات', subtitle: 'الشعار وبعض إعدادات المنصة' },
  ]

  const activeTabInfo = TABS.find(t => t.id === tab)

  function Logo({ h = 42 }: { h?: number }) {
    return (
      <img
        src={logoUrl}
        alt="مِداد"
        height={h}
        style={{ height: h, width: 'auto', objectFit: 'contain', display: 'block' }}
        onError={e => {
          ;(e.target as HTMLImageElement).src = '/logo-midad.png'
        }}
      />
    )
  }

  function renderUserCard(u: User) {
    const displayName = u.full_name || u.name || u.email || 'بدون بريد'
    const isTeacher = u.user_type === 'teacher' || u.role === 'teacher'

    return (
      <div
        key={u.id}
        style={{
          padding: '16px 18px',
          borderRadius: BRAND.radiusMd,
          background: 'rgba(255,255,255,0.72)',
          border: `1.5px solid ${u.status === 'pending' ? 'rgba(140,20,40,0.28)' : T.borderCol}`,
          boxShadow: T.shadow,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 240 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 6,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 18 }}>
                {u.user_type === 'student' ? '🎓' : u.role === 'admin' ? '👑' : '👨‍🏫'}
              </span>

              <span style={{ fontSize: 15, fontWeight: BRAND.weightBold, color: T.textCol }}>
                {displayName}
              </span>

              <span
                style={{
                  fontSize: 11,
                  padding: '3px 8px',
                  borderRadius: 999,
                  fontWeight: BRAND.weightBold,
                  background:
                    u.status === 'approved'
                      ? 'rgba(140,20,40,0.10)'
                      : u.status === 'pending'
                      ? 'rgba(220,100,40,0.15)'
                      : 'rgba(140,20,40,0.10)',
                  color:
                    u.status === 'approved'
                      ? BRAND.crimson
                      : u.status === 'pending'
                      ? BRAND.orange
                      : BRAND.crimson,
                }}
              >
                {u.status === 'approved' ? '✅ مفعّل' : u.status === 'pending' ? '⏳ انتظار' : '❌ موقوف'}
              </span>
            </div>

            <div style={{ fontSize: 13, color: T.subCol, marginBottom: 6 }}>{u.email}</div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: T.subCol }}>
                {u.user_type === 'student' ? 'طالب' : u.role === 'admin' ? 'مدير' : 'معلم'}
              </span>

              {u.assigned_role ? (
                <span style={{ fontSize: 11, color: BRAND.crimson, fontWeight: BRAND.weightBold }}>
                  الدور المعيّن: {u.assigned_role.name} ({u.assigned_role.key})
                </span>
              ) : null}

              {u.allowed_grades?.length ? (
                <span style={{ fontSize: 11, color: BRAND.crimson, fontWeight: BRAND.weightSemibold }}>
                  الصف {u.allowed_grades.join('، ')}
                </span>
              ) : null}

              {u.created_at ? (
                <span style={{ fontSize: 11, color: T.subCol }}>
                  {new Date(u.created_at).toLocaleDateString('ar-KW', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              ) : null}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {u.status === 'pending' && (
              <button
                onClick={() =>
                  u.user_type === 'student' ? openStageModal(u) : updateUser(u.id, { status: 'approved' })
                }
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'rgba(140,20,40,0.14)',
                  color: BRAND.crimson,
                  fontWeight: BRAND.weightBold,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {u.user_type === 'student' ? '✅ موافقة + تحديد الصف' : '✅ موافقة'}
              </button>
            )}

            {u.status === 'approved' && u.role !== 'admin' && (
              <button
                onClick={() => updateUser(u.id, { status: 'suspended' })}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'rgba(220,100,40,0.14)',
                  color: BRAND.orange,
                  fontWeight: BRAND.weightBold,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                🔒 تعليق
              </button>
            )}

            {u.status === 'suspended' && (
              <button
                onClick={() => updateUser(u.id, { status: 'approved' })}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'rgba(140,20,40,0.12)',
                  color: BRAND.crimson,
                  fontWeight: BRAND.weightBold,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                🔓 إعادة تفعيل
              </button>
            )}

            {u.user_type === 'student' && u.role !== 'admin' && (
              <button
                onClick={() => updateUser(u.id, { role: 'teacher', user_type: 'teacher' })}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: `1px solid ${T.borderCol}`,
                  background: 'transparent',
                  color: T.subCol,
                  fontWeight: BRAND.weightBold,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ترقية لمعلم
              </button>
            )}

            {u.user_type === 'student' && (
              <button
                onClick={() => openStageModal(u)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: `1px solid ${
                    u.allowed_stages?.length ? 'rgba(140,20,40,0.22)' : 'rgba(220,100,40,0.4)'
                  }`,
                  background: u.allowed_stages?.length
                    ? 'rgba(140,20,40,0.07)'
                    : 'rgba(220,100,40,0.12)',
                  color: u.allowed_stages?.length ? BRAND.crimson : BRAND.orange,
                  fontWeight: BRAND.weightBold,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {u.allowed_stages?.length
                  ? `📚 ${STAGE_LABELS[u.allowed_stages[0] as StageKey] ?? u.allowed_stages[0]} • ${
                      u.allowed_grades?.[0] ?? '؟'
                    }`
                  : '⚠️ لم يُحدَّد الصف'}
              </button>
            )}

            {u.user_type === 'student' && u.allowed_stages?.length ? (
              <button
                onClick={() => openSubscriptionsModal(u)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(140,20,40,0.35)',
                  background: 'rgba(140,20,40,0.10)',
                  color: BRAND.crimson,
                  fontWeight: BRAND.weightBold,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                📦 الاشتراكات
              </button>
            ) : null}

            {isTeacher && (
              <button
                onClick={() => setAssignSubjectsFor(u)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(140,20,40,0.22)',
                  background: 'rgba(140,20,40,0.07)',
                  color: BRAND.crimson,
                  fontWeight: BRAND.weightBold,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                📚 تخصيص المواد
              </button>
            )}

            {isTeacher && (
              <button
                onClick={() => setAssignScopeFor(u)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(140,20,40,0.22)',
                  background: 'rgba(140,20,40,0.07)',
                  color: BRAND.crimson,
                  fontWeight: BRAND.weightBold,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                🎓 نطاقات التدريس
              </button>
            )}

            {u.role !== 'admin' && (
              <button
                onClick={() => openRoleModal(u)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(140,20,40,0.22)',
                  background: 'rgba(140,20,40,0.07)',
                  color: BRAND.crimson,
                  fontWeight: BRAND.weightBold,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {u.assigned_role?.name || u.assigned_role?.key || 'تعيين دور'}
              </button>
            )}

            {u.role !== 'admin' && (
              <button
                onClick={() => deleteUser(u.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(140,20,40,0.3)',
                  background: 'rgba(140,20,40,0.06)',
                  color: BRAND.crimson,
                  fontWeight: BRAND.weightBold,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (authChecking) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: T.bg,
          color: T.subCol,
          fontFamily: BRAND.fontBody,
        }}
      >
        ⏳ جارٍ التحقق من الجلسة...
      </div>
    )
  }

  if (!authorized || !admin) return null

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: `
          radial-gradient(circle at 85% 10%, rgba(225,135,60,0.10), transparent 28%),
          radial-gradient(circle at 10% 80%, rgba(150,30,45,0.08), transparent 26%),
          ${T.bg}
        `,
        color: T.textCol,
        fontFamily: BRAND.fontBody,
        paddingBottom: 90,
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: ${T.bg}; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatSoft {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .fade-in { animation: fadeIn .32s ease; }
        input:focus, select:focus {
          outline: none;
          border-color: rgba(140,20,40,0.40) !important;
          box-shadow: 0 0 0 3px rgba(140,20,40,0.08);
        }
        select option {
          background: ${BRAND.bg} !important;
          color: ${BRAND.text} !important;
        }
        select { color-scheme: light; }
        .desktop-tabs { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
        .mobile-nav { display: none; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(140,20,40,0.20); border-radius: 999px; }
        @media (max-width: 980px) {
          .desktop-tabs { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 760px) {
          .admin-stats-grid { grid-template-columns: 1fr !important; }
          .admin-stats-grid-2 { grid-template-columns: 1fr !important; }
          .hero-grid-admin { grid-template-columns: 1fr !important; }
          .desktop-tabs { display: none !important; }
          .mobile-nav { display: flex; }
        }
      `}</style>

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 60,
          background: T.headerBg,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${T.borderCol}`,
          padding: '14px 20px',
          boxShadow: T.shadow,
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 260 }}>
            <div
              style={{
                padding: 10,
                borderRadius: BRAND.radiusMd,
                background: 'rgba(255,255,255,0.78)',
                border: `1px solid ${T.borderCol}`,
                boxShadow: T.shadow,
                animation: 'floatSoft 4s ease-in-out infinite',
              }}
            >
              <Logo h={40} />
            </div>

            <div>
              <div
                style={{
                  fontSize: 19,
                  fontWeight: BRAND.weightBlack,
                  fontFamily: BRAND.fontHeading,
                  color: T.textCol,
                  marginBottom: 4,
                }}
              >
                مِداد — لوحة الأدمن
              </div>
              <div style={{ fontSize: 12, color: T.subCol }}>
                {activeTabInfo?.icon} {activeTabInfo?.label} • {adminName}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {tab === 'teachers' ? (
              <Button variant="primary" size="sm" onClick={() => setShowAddTeacher(true)}>
                ➕ إضافة معلم
              </Button>
            ) : null}

            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/settings')}>
              ⚙️ الإعدادات
            </Button>

            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/subjects')}>
              📚 إدارة المواد
            </Button>

            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/generator')}>
              ✨ أدوات التوليد
            </Button>

            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/delegations')}>
              🗂️ التفويضات
            </Button>

            <Button variant="ghost" size="sm" onClick={() => setShowAddParent(true)}>
              👨‍👦 ولي أمر جديد
            </Button>

            <Button variant="danger" size="sm" onClick={handleLogout}>
              🚪 خروج
            </Button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '22px 16px' }}>
        <section className="fade-in" style={{ ...sectionCard, marginBottom: 18 }}>
          <div
            className="hero-grid-admin"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.15fr .85fr',
              gap: 18,
              alignItems: 'stretch',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: 'rgba(140,20,40,0.08)',
                  border: '1px solid rgba(140,20,40,0.16)',
                  color: BRAND.crimson,
                  fontSize: 13,
                  fontWeight: BRAND.weightBlack,
                  marginBottom: 16,
                }}
              >
                👑 مركز التحكم
              </div>

              <h1
                style={{
                  fontSize: 'clamp(28px,4vw,42px)',
                  fontWeight: BRAND.weightBlack,
                  fontFamily: BRAND.fontHeading,
                  color: T.textCol,
                  margin: '0 0 10px',
                  lineHeight: 1.2,
                }}
              >
                إدارة المنصة من مكان واحد
              </h1>

              <p
                style={{
                  fontSize: 15,
                  color: T.subCol,
                  lineHeight: 1.95,
                  margin: 0,
                  maxWidth: 620,
                }}
              >
                راقب الطلاب والمعلمين، اعتمد الحسابات، وزّع الصلاحيات، وتابع المراحل والمواد والإشارات بسرعة
                وبنفس الهوية البصرية الأصلية للمنصة.
              </p>
            </div>

            <div
  className="admin-stats-grid"
  style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, alignContent: 'start' }}
>
  {[
    { label: 'الطلاب', value: studentsCount, icon: '🎓', color: BRAND.crimson },
    { label: 'المعلمون', value: teachersCount, icon: '👨‍🏫', color: BRAND.orange },
    { label: 'انتظار الموافقة', value: pendingCount, icon: '⏳', color: BRAND.red },
    { label: 'المواد', value: subjects.length, icon: '📚', color: BRAND.deep },
  ].map(card => (
    <div
      key={card.label}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(255,255,255,0.76)',
        border: `1px solid ${T.borderCol}`,
        borderRadius: 999,
        padding: '8px 12px',
        boxShadow: T.shadow,
      }}
    >
      <span style={{ fontSize: 15, flexShrink: 0 }}>{card.icon}</span>
      <span style={{ fontSize: 15, fontWeight: BRAND.weightBlack, color: card.color, flexShrink: 0 }}>
        {card.value}
      </span>
      <span style={{ fontSize: 11, color: T.subCol, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {card.label}
      </span>
    </div>
  ))}
</div>
          </div>
        </section>

        <section className="desktop-tabs fade-in" style={{ marginBottom: 18 }}>
          {TABS.map(tb => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              style={{
                border: `1.5px solid ${tab === tb.id ? 'rgba(140,20,40,0.28)' : T.borderCol}`,
                background: tab === tb.id ? 'rgba(140,20,40,0.08)' : 'rgba(255,255,255,0.70)',
                borderRadius: BRAND.radiusMd,
                padding: '14px 12px',
                textAlign: 'right',
                cursor: 'pointer',
                boxShadow: T.shadow,
                color: tab === tb.id ? BRAND.crimson : T.textCol,
                position: 'relative',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 8 }}>{tb.icon}</div>
              <div style={{ fontSize: 14, fontWeight: BRAND.weightBlack, marginBottom: 4 }}>
                {tb.label}
              </div>
              <div style={{ fontSize: 11, color: tab === tb.id ? BRAND.crimson : T.subCol }}>
                {tb.subtitle}
              </div>

              {tb.badge && tb.badge > 0 ? (
                <span
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    minWidth: 18,
                    height: 18,
                    padding: '0 5px',
                    borderRadius: 999,
                    background: BRAND.orange,
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: BRAND.weightBlack,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {tb.badge}
                </span>
              ) : null}
            </button>
          ))}
        </section>

        {actionMsg && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: BRAND.radiusSm,
              marginBottom: 16,
              fontSize: 14,
              fontWeight: BRAND.weightBold,
              textAlign: 'center',
              background: 'rgba(140,20,40,0.10)',
              border: '1px solid rgba(140,20,40,0.3)',
              color: BRAND.crimson,
            }}
          >
            {actionMsg}
          </div>
        )}

        {tab === 'students' && (
          <div className="fade-in" style={sectionCard}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
                marginBottom: 20,
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 22,
                    fontWeight: BRAND.weightBlack,
                    fontFamily: BRAND.fontHeading,
                    color: BRAND.crimson,
                    margin: '0 0 6px',
                  }}
                >
                  🎓 إدارة الطلاب
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: T.subCol }}>
                  اعتماد الحسابات، تحديد الصف، وإدارة اشتراكات الطالب.
                </p>
              </div>
               <Button variant="primary" size="sm" onClick={() => setShowAddStudent(true)}>
                  ➕ إضافة طالب جديد مباشرة
                </Button>
            </div>

            <div
              className="admin-stats-grid"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 24 }}
            >
              {[
                { label: 'إجمالي الطلاب', value: studentsCount, color: BRAND.crimson, icon: '🎓' },
                {
                  label: 'بانتظار الموافقة',
                  value: studentUsers.filter(u => u.status === 'pending').length,
                  color: BRAND.red,
                  icon: '⏳',
                },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: '18px',
                    borderRadius: BRAND.radiusMd,
                    background: 'rgba(255,255,255,0.72)',
                    border: `1.5px solid ${s.color}20`,
                    boxShadow: T.shadow,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: BRAND.weightBlack, color: s.color, marginBottom: 4 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 13, color: T.subCol }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="🔍 بحث بالاسم أو البريد..."
                style={{ ...inputStyle, flex: 1, minWidth: 220 }}
              />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                style={{ ...inputStyle, cursor: 'pointer', minWidth: 180 }}
              >
                <option value="all">الكل ({studentsCount})</option>
                <option value="pending">
                  بانتظار الموافقة ({studentUsers.filter(u => u.status === 'pending').length})
                </option>
              </select>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: T.subCol }}>⏳ جارٍ التحميل...</div>
            ) : filteredStudents.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  background: 'rgba(255,255,255,0.72)',
                  borderRadius: BRAND.radiusMd,
                  border: `1px solid ${T.borderCol}`,
                  color: T.subCol,
                }}
              >
                لا يوجد طلاب
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredStudents.map(renderUserCard)}
              </div>
            )}
          </div>
        )}

        {tab === 'teachers' && (
          <div className="fade-in" style={sectionCard}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
                marginBottom: 20,
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 22,
                    fontWeight: BRAND.weightBlack,
                    fontFamily: BRAND.fontHeading,
                    color: BRAND.crimson,
                    margin: '0 0 6px',
                  }}
                >
                  👨‍🏫 إدارة المعلمين
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: T.subCol }}>
                  إضافة المعلمين، اعتماد الحسابات، وربط المواد ونطاقات التدريس.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button variant="primary" onClick={() => setShowAddTeacher(true)}>
                  ➕ إضافة معلم جديد مباشرة
                </Button>
              </div>
            </div>

            <div
              className="admin-stats-grid"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 24 }}
            >
              {[
                { label: 'إجمالي المعلمين', value: teachersCount, color: BRAND.crimson, icon: '👨‍🏫' },
                {
                  label: 'بانتظار الموافقة',
                  value: teacherUsers.filter(u => u.status === 'pending').length,
                  color: BRAND.red,
                  icon: '⏳',
                },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: '18px',
                    borderRadius: BRAND.radiusMd,
                    background: 'rgba(255,255,255,0.72)',
                    border: `1.5px solid ${s.color}20`,
                    boxShadow: T.shadow,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: BRAND.weightBlack, color: s.color, marginBottom: 4 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 13, color: T.subCol }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="🔍 بحث بالاسم أو البريد..."
                style={{ ...inputStyle, flex: 1, minWidth: 220 }}
              />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                style={{ ...inputStyle, cursor: 'pointer', minWidth: 180 }}
              >
                <option value="all">الكل ({teachersCount})</option>
                <option value="pending">
                  بانتظار الموافقة ({teacherUsers.filter(u => u.status === 'pending').length})
                </option>
              </select>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: T.subCol }}>⏳ جارٍ التحميل...</div>
            ) : filteredTeachers.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  background: 'rgba(255,255,255,0.72)',
                  borderRadius: BRAND.radiusMd,
                  border: `1px solid ${T.borderCol}`,
                  color: T.subCol,
                }}
              >
                لا يوجد معلمون
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredTeachers.map(renderUserCard)}
              </div>
            )}
          </div>
        )}

        {tab === 'stages' && (
          <div className="fade-in" style={sectionCard}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: BRAND.weightBlack,
                fontFamily: BRAND.fontHeading,
                color: BRAND.crimson,
                margin: '0 0 8px',
              }}
            >
              🏫 المراحل الدراسية
            </h2>

            <p style={{ fontSize: 13, color: T.subCol, margin: '0 0 18px' }}>
              تصفح المراحل ثم الصفوف، ثم التشعيب إن وجد، لعرض المواد المرتبطة فعلياً.
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              {(Object.keys(STAGE_LABELS) as StageKey[]).map(stage => {
                const count = new Set(occurrencesByStage[stage].map(o => o.subject.id)).size
                return (
                  <button
                    key={stage}
                    onClick={() => {
                      setActiveStageTab(stage)
                      setActiveGrade(null)
                      setActiveTrack(null)
                    }}
                    style={{
                      flex: 1,
                      minWidth: 180,
                      padding: '14px',
                      borderRadius: BRAND.radiusMd,
                      border: `2px solid ${activeStageTab === stage ? BRAND.crimson : T.borderCol}`,
                      background: activeStageTab === stage ? 'rgba(140,20,40,0.08)' : 'rgba(255,255,255,0.72)',
                      color: activeStageTab === stage ? BRAND.crimson : T.subCol,
                      fontWeight: BRAND.weightBlack,
                      fontSize: 14,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {STAGE_LABELS[stage]}
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: BRAND.weightSemibold,
                        marginRight: 6,
                        opacity: 0.7,
                      }}
                    >
                      ({count})
                    </span>
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              {GRADES_BY_STAGE[activeStageTab].map(g => {
                const count = occurrencesByStage[activeStageTab].filter(o => o.offering.grade === g.id).length
                const isActive = activeGrade === g.id
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      setActiveGrade(prev => (prev === g.id ? null : g.id))
                      setActiveTrack(null)
                    }}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 999,
                      border: `1.5px solid ${isActive ? BRAND.crimson : T.borderCol}`,
                      background: isActive ? 'rgba(140,20,40,0.10)' : 'rgba(255,255,255,0.72)',
                      color: isActive ? BRAND.crimson : T.textCol,
                      fontWeight: BRAND.weightBold,
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {g.label}
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: BRAND.weightSemibold,
                        marginRight: 5,
                        opacity: 0.7,
                      }}
                    >
                      ({count})
                    </span>
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              <Button variant="primary" onClick={() => router.push('/admin/subjects')}>
                🆕 الذهاب إلى لوحة إدارة المواد والوحدات
              </Button>
              <Button variant="secondary" onClick={() => router.push('/admin/packages')}>
                📦 إدارة الباقات
              </Button>
            </div>

            {activeGrade && (activeGrade === '11' || activeGrade === '12') && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
                {(Object.keys(TRACK_LABELS) as TrackKey[]).map(track => {
                  const count = occurrencesByStage[activeStageTab].filter(
                    o => o.offering.grade === activeGrade && (o.offering.track === track || o.offering.track === null)
                  ).length

                  const isActive = activeTrack === track
                  return (
                    <button
                      key={track}
                      onClick={() => setActiveTrack(prev => (prev === track ? null : track))}
                      style={{
                        flex: 1,
                        minWidth: 170,
                        padding: '12px',
                        borderRadius: BRAND.radiusMd,
                        border: `1.5px solid ${isActive ? BRAND.crimson : T.borderCol}`,
                        background: isActive ? 'rgba(140,20,40,0.10)' : 'rgba(255,255,255,0.72)',
                        color: isActive ? BRAND.crimson : T.textCol,
                        fontWeight: BRAND.weightBold,
                        fontSize: 13,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {TRACK_LABELS[track]}
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: BRAND.weightSemibold,
                          marginRight: 5,
                          opacity: 0.7,
                        }}
                      >
                        ({count})
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {!activeGrade ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  background: 'rgba(255,255,255,0.72)',
                  borderRadius: BRAND.radiusMd,
                  border: `1px dashed ${T.borderCol}`,
                  color: T.subCol,
                }}
              >
                اختر صفاً من {STAGE_LABELS[activeStageTab]} أعلاه لعرض مواده
              </div>
            ) : (activeGrade === '11' || activeGrade === '12') && !activeTrack ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  background: 'rgba(255,255,255,0.72)',
                  borderRadius: BRAND.radiusMd,
                  border: `1px dashed ${T.borderCol}`,
                  color: T.subCol,
                }}
              >
                اختر التشعيب (علمي/أدبي) أعلاه لعرض مواد هذا الصف
              </div>
            ) : (
              (() => {
                const needsTrack = activeGrade === '11' || activeGrade === '12'
                const gradeOccurrences = occurrencesByStage[activeStageTab].filter(o => {
                  if (o.offering.grade !== activeGrade) return false
                  if (!needsTrack) return true
                  return o.offering.track === activeTrack || o.offering.track === null
                })

                return gradeOccurrences.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '40px',
                      background: 'rgba(255,255,255,0.72)',
                      borderRadius: BRAND.radiusMd,
                      color: T.subCol,
                    }}
                  >
                    لا توجد مواد لهذا الصف بعد
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))',
                      gap: 14,
                    }}
                  >
                    {gradeOccurrences.map((o, i) => (
                      <div
                        key={`${o.subject.id}-${o.offering.track ?? 'shared'}-${i}`}
                        style={{
                          padding: '18px',
                          borderRadius: BRAND.radiusMd,
                          background: 'rgba(255,255,255,0.72)',
                          border: `1.5px solid ${
                            o.offering.track === null && needsTrack
                              ? o.isLegacy
                                ? 'rgba(140,20,40,0.35)'
                                : 'rgba(220,140,60,0.4)'
                              : T.borderCol
                          }`,
                          boxShadow: T.shadow,
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: 36, marginBottom: 8 }}>{o.subject.icon ?? '📚'}</div>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: BRAND.weightBold,
                            color: T.textCol,
                            marginBottom: 4,
                          }}
                        >
                          {o.subject.name}
                        </div>
                        <div style={{ fontSize: 12, color: BRAND.crimson, fontWeight: BRAND.weightBold }}>
                          الصف {o.offering.grade}
                          {o.offering.track
                            ? ` • ${TRACK_LABELS[o.offering.track]}`
                            : needsTrack
                            ? o.isLegacy
                              ? ' • ⚠️ تشعيب غير محدَّد'
                              : ' • مشتركة'
                            : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()
            )}

            {unassignedSubjects.length > 0 && (
              <>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: BRAND.weightBold,
                    color: T.subCol,
                    margin: '24px 0 12px',
                  }}
                >
                  مواد بلا صف محدَّد ({unassignedSubjects.length})
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))',
                    gap: 14,
                  }}
                >
                  {unassignedSubjects.map(s => (
                    <div
                      key={s.id}
                      style={{
                        padding: '18px',
                        borderRadius: BRAND.radiusMd,
                        background: 'rgba(255,255,255,0.72)',
                        border: `1.5px dashed ${T.borderCol}`,
                        boxShadow: T.shadow,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 36, marginBottom: 8 }}>{s.icon ?? '📚'}</div>
                      <div style={{ fontSize: 15, fontWeight: BRAND.weightBold, color: T.textCol }}>
                        {s.name}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'signals' && (
          <div className="fade-in" style={sectionCard}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: BRAND.weightBlack,
                fontFamily: BRAND.fontHeading,
                color: BRAND.crimson,
                margin: '0 0 8px',
              }}
            >
              🔔 إشارات تستحق المراجعة
            </h2>

            <p style={{ fontSize: 13, color: T.subCol, margin: '0 0 20px' }}>
              رصد آلي فقط — لا فعل تلقائي. اختر تجاهل أو تم التدخل بعد المراجعة.
            </p>

            {signalsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: T.subCol }}>⏳ جارٍ رصد الإشارات...</div>
            ) : signals.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  background: 'rgba(255,255,255,0.72)',
                  borderRadius: BRAND.radiusMd,
                  border: `1px solid ${T.borderCol}`,
                  color: T.subCol,
                }}
              >
                ✅ لا توجد إشارات حالياً — كل شيء يبدو طبيعياً
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {signals.map(sig => {
                  const isResolving = resolvingSignalId === sig.id
                  const isStudentSignal = sig.signal_type === 'student_struggling'
                  const ev = sig.evidence as any

                  return (
                    <div
                      key={sig.id}
                      style={{
                        padding: '16px 18px',
                        borderRadius: BRAND.radiusMd,
                        background: 'rgba(255,255,255,0.72)',
                        border: `1.5px solid ${
                          isStudentSignal ? 'rgba(220,100,40,0.3)' : 'rgba(140,20,40,0.3)'
                        }`,
                        boxShadow: T.shadow,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 12,
                          flexWrap: 'wrap',
                          gap: 8,
                        }}
                      >
                        <div style={{ fontSize: 14, fontWeight: BRAND.weightBold, color: T.textCol }}>
                          {isStudentSignal ? '⚠️ تعثّر طلابي' : '🐢 معدّل استجابة بطيء'}
                        </div>
                        <span style={{ fontSize: 11, color: T.subCol }}>
                          {new Date(sig.created_at).toLocaleDateString('ar-KW', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {isStudentSignal ? (
                        <div style={{ fontSize: 13, color: T.textCol, lineHeight: 1.8, marginBottom: 14 }}>
                          <div style={{ marginBottom: 6 }}>
                            🏫 الفصل: <strong>{(ev as SignalEvidenceStudent).class_name}</strong> • المعلم:{' '}
                            <strong>{(ev as SignalEvidenceStudent).teacher_name}</strong>
                          </div>

                          {(ev as SignalEvidenceStudent).signals.map((s, i) => (
                            <div key={i} style={{ fontSize: 13, color: T.subCol, marginTop: 4 }}>
                              — {s.affected_count} طلاب ({s.affected_student_names.join('، ')}) أخطؤوا مراراً في{' '}
                              <strong>{s.area_label}</strong>، متوسط دقتهم {s.avg_accuracy}٪
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, color: T.textCol, lineHeight: 1.8, marginBottom: 14 }}>
                          المعلم <strong>{(ev as SignalEvidenceTeacher).teacher_name}</strong> متوسط استجابته{' '}
                          <strong>{(ev as SignalEvidenceTeacher).avg_response_hours} ساعة</strong> (المتوسط العام:{' '}
                          {(ev as SignalEvidenceTeacher).overall_avg_hours} ساعة — أبطأ بـ
                          {(ev as SignalEvidenceTeacher).ratio}× تقريباً، بناءً على{' '}
                          {(ev as SignalEvidenceTeacher).graded_count} سؤالاً مصحَّحاً)
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          disabled={isResolving}
                          onClick={() => resolveSignal(sig.id, 'dismissed')}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 10,
                            border: `1px solid ${T.borderCol}`,
                            background: 'transparent',
                            color: T.subCol,
                            fontWeight: BRAND.weightBold,
                            fontSize: 12,
                            cursor: isResolving ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          تجاهل
                        </button>

                        <button
                          disabled={isResolving}
                          onClick={() => resolveSignal(sig.id, 'action_taken')}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 10,
                            border: 'none',
                            background: 'rgba(140,20,40,0.14)',
                            color: BRAND.crimson,
                            fontWeight: BRAND.weightBold,
                            fontSize: 12,
                            cursor: isResolving ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          {isResolving ? '...' : '✅ تم التدخل'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'stats' && (
          <div className="fade-in" style={sectionCard}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: BRAND.weightBlack,
                fontFamily: BRAND.fontHeading,
                color: BRAND.crimson,
                margin: '0 0 20px',
              }}
            >
              📊 إحصائيات النظام
            </h2>

            <div
              className="admin-stats-grid-2"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}
            >
              {[
                { label: 'إجمالي المستخدمين', value: users.length, color: BRAND.deep, icon: '👥' },
                { label: 'طلاب مسجلون', value: studentsCount, color: BRAND.red, icon: '🎓' },
                { label: 'معلمون', value: teachersCount, color: BRAND.crimson, icon: '👨‍🏫' },
                { label: 'بانتظار الموافقة', value: pendingCount, color: BRAND.orangeRed, icon: '⏳' },
                {
                  label: 'مستخدمون مفعّلون',
                  value: users.filter(u => u.status === 'approved').length,
                  color: BRAND.orange,
                  icon: '✅',
                },
                { label: 'مواد دراسية', value: subjects.length, color: BRAND.crimson, icon: '📚' },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: '20px',
                    borderRadius: BRAND.radiusMd,
                    background: 'rgba(255,255,255,0.72)',
                    border: `1.5px solid ${s.color}20`,
                    boxShadow: T.shadow,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, color: T.subCol, marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontSize: 32, fontWeight: BRAND.weightBlack, color: s.color }}>
                        {s.value}
                      </div>
                    </div>
                    <div style={{ fontSize: 36, opacity: 0.6 }}>{s.icon}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="fade-in" style={sectionCard}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: BRAND.weightBlack,
                fontFamily: BRAND.fontHeading,
                color: BRAND.crimson,
                margin: '0 0 24px',
              }}
            >
              ⚙️ إعدادات المنصة
            </h2>

            <AdminSettingsPanel initialLogoUrl={logoUrl} onLogoUpdated={url => setLogoUrl(url)} />
          </div>
        )}
      </main>

      {roleModalOpen && selectedUser ? (
        <div
          onClick={closeRoleModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(31,18,21,0.4)',
            backdropFilter: 'blur(6px)',
            zIndex: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="fade-in"
            style={{
              width: '100%',
              maxWidth: 520,
              background: T.cardBg,
              borderRadius: BRAND.radiusXl,
              border: `1.5px solid ${T.borderCol}`,
              boxShadow: BRAND.shadow,
              padding: 22,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
                marginBottom: 18,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: BRAND.weightBlack,
                    fontFamily: BRAND.fontHeading,
                    color: T.textCol,
                    marginBottom: 6,
                  }}
                >
                  تعيين دور للمستخدم
                </div>
                <div style={{ fontSize: 13, color: T.subCol }}>{selectedUser.email}</div>
              </div>

              <Button variant="ghost" size="sm" disabled={assigningRole} onClick={closeRoleModal}>
                إغلاق
              </Button>
            </div>

            <div
              style={{
                marginBottom: 14,
                padding: '12px 14px',
                borderRadius: BRAND.radiusMd,
                background: 'rgba(140,20,40,0.05)',
                border: `1px solid ${T.borderCol}`,
                fontSize: 13,
                color: T.subCol,
              }}
            >
              الدور الحالي:{' '}
              <span style={{ color: T.textCol, fontWeight: BRAND.weightBlack }}>
                {selectedUser.assigned_role?.name || selectedUser.assigned_role?.key || 'بدون دور معيّن'}
              </span>
            </div>

            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: BRAND.weightBlack,
                color: T.textCol,
                marginBottom: 8,
              }}
            >
              اختر الدور
            </label>

            <select
              value={selectedRoleId}
              onChange={e => setSelectedRoleId(e.target.value)}
              disabled={rolesLoading || assigningRole}
              style={{
                ...inputStyle,
                width: '100%',
                minWidth: '100%',
                cursor: rolesLoading || assigningRole ? 'not-allowed' : 'pointer',
                marginBottom: 14,
              }}
            >
              <option value="">اختر من قائمة الأدوار</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name} ({role.key})
                </option>
              ))}
            </select>

            {selectedRoleId ? (
              <div
                style={{
                  marginBottom: 18,
                  padding: '12px 14px',
                  borderRadius: BRAND.radiusMd,
                  background: T.inputBg,
                  border: `1px solid ${T.borderCol}`,
                }}
              >
                {roles
                  .filter(r => String(r.id) === String(selectedRoleId))
                  .map(role => (
                    <div key={role.id}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: BRAND.weightBlack,
                          color: T.textCol,
                          marginBottom: 6,
                        }}
                      >
                        {role.name}
                      </div>

                      {role.description ? (
                        <div style={{ fontSize: 12, color: T.subCol, marginBottom: 8 }}>
                          {role.description}
                        </div>
                      ) : null}

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {(role.permissions || []).length ? (
                          role.permissions!.map(perm => (
                            <span
                              key={perm}
                              style={{
                                fontSize: 11,
                                padding: '4px 8px',
                                borderRadius: 999,
                                background: 'rgba(140,20,40,0.08)',
                                color: BRAND.crimson,
                                fontWeight: BRAND.weightBold,
                              }}
                            >
                              {perm}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: 12, color: T.subCol }}>
                            لا توجد صلاحيات ظاهرة لهذا الدور.
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button variant="primary" disabled={!selectedRoleId || assigningRole} onClick={assignRoleToUser}>
                {assigningRole ? 'جارٍ الحفظ...' : 'حفظ الدور'}
              </Button>

              <Button
                variant="danger"
                disabled={!selectedUser.assigned_role_id || assigningRole}
                onClick={removeAssignedRole}
              >
                إزالة الدور
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {stageModalOpen && stageModalUser ? (
        <div
          onClick={closeStageModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(31,18,21,0.4)',
            backdropFilter: 'blur(6px)',
            zIndex: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="fade-in"
            style={{
              width: '100%',
              maxWidth: 560,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: T.cardBg,
              borderRadius: BRAND.radiusXl,
              border: `1.5px solid ${T.borderCol}`,
              boxShadow: BRAND.shadow,
              padding: 22,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
                marginBottom: 18,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: BRAND.weightBlack,
                    fontFamily: BRAND.fontHeading,
                    color: T.textCol,
                    marginBottom: 6,
                  }}
                >
                  تحديد المرحلة والصف
                </div>
                <div style={{ fontSize: 13, color: T.subCol }}>{stageModalUser.email}</div>
              </div>

              <Button variant="ghost" size="sm" disabled={savingStage} onClick={closeStageModal}>
                إغلاق
              </Button>
            </div>

            <div style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: T.subCol, marginBottom: 8 }}>
              المرحلة
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {(Object.keys(STAGE_LABELS) as StageKey[]).map(stage => (
                <button
                  key={stage}
                  onClick={() => {
                    setModalStage(stage)
                    setModalGrade(null)
                    setModalTrack(null)
                  }}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 999,
                    border: modalStage === stage ? `2px solid ${BRAND.crimson}` : `1px solid ${T.borderCol}`,
                    background: modalStage === stage ? 'rgba(140,20,40,0.08)' : 'transparent',
                    color: modalStage === stage ? BRAND.crimson : T.textCol,
                    fontWeight: BRAND.weightBold,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 13,
                  }}
                >
                  {STAGE_LABELS[stage]}
                </button>
              ))}
            </div>

            {modalStage && (
              <>
                <div style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: T.subCol, marginBottom: 8 }}>
                  الصف
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {GRADES_BY_STAGE[modalStage].map(g => (
                    <button
                      key={g.id}
                      onClick={() => {
                        setModalGrade(g.id)
                        setModalTrack(null)
                      }}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 999,
                        border: modalGrade === g.id ? `2px solid ${BRAND.crimson}` : `1px solid ${T.borderCol}`,
                        background: modalGrade === g.id ? 'rgba(140,20,40,0.08)' : 'transparent',
                        color: modalGrade === g.id ? BRAND.crimson : T.textCol,
                        fontWeight: BRAND.weightBold,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 13,
                      }}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {(modalGrade === '11' || modalGrade === '12') && (
              <>
                <div style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: T.subCol, marginBottom: 8 }}>
                  التشعيب
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                  {(Object.keys(TRACK_LABELS) as TrackKey[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setModalTrack(t)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 999,
                        border: modalTrack === t ? `2px solid ${BRAND.crimson}` : `1px solid ${T.borderCol}`,
                        background: modalTrack === t ? 'rgba(140,20,40,0.08)' : 'transparent',
                        color: modalTrack === t ? BRAND.crimson : T.textCol,
                        fontWeight: BRAND.weightBold,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 13,
                      }}
                    >
                      {TRACK_LABELS[t]}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
              <Button
                variant="primary"
                disabled={savingStage || !modalStage || !modalGrade}
                onClick={() => saveStageAssignment(stageModalUser.status === 'pending')}
              >
                {savingStage
                  ? 'جارٍ الحفظ...'
                  : stageModalUser.status === 'pending'
                  ? '✅ حفظ واعتماد الطالب'
                  : '💾 حفظ'}
              </Button>

              <Button variant="ghost" disabled={savingStage} onClick={closeStageModal}>
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {subscriptionsModalUser && subscriptionsAccessToken ? (
        <StudentSubscriptionsModal
          studentId={subscriptionsModalUser.id}
          studentEmail={subscriptionsModalUser.email}
          studentName={subscriptionsModalUser.full_name ?? null}
          stage={(subscriptionsModalUser.allowed_stages?.[0] as StageKey) ?? null}
          grade={subscriptionsModalUser.allowed_grades?.[0] ?? null}
          track={(subscriptionsModalUser.track as TrackKey) ?? null}
          accessToken={subscriptionsAccessToken}
          onClose={closeSubscriptionsModal}
        />
      ) : null}

      {showAddTeacher ? (
              <AddTeacherModal
                accessToken={adminAccessToken ?? ''}
                onClose={() => setShowAddTeacher(false)}
                onCreated={() => {
                  setShowAddTeacher(false)
                  void reloadUsers()
                  setActionMsg('✅ تمت إضافة المعلم.')
                  setTimeout(() => setActionMsg(''), 2500)
                }}
              />
            ) : null}

            {showAddParent ? (
              <AddParentModal
                accessToken={adminAccessToken ?? ''}
                onClose={() => setShowAddParent(false)}
                onCreated={() => {
                  setShowAddParent(false)
                  setActionMsg('✅ تم إنشاء حساب ولي الأمر.')
                  setTimeout(() => setActionMsg(''), 2500)
                }}
              />
            ) : null}

      {showAddStudent ? (
        <AddStudentModal
          open={showAddStudent}
          accessToken={adminAccessToken ?? ''}
          onClose={() => setShowAddStudent(false)}
          onCreated={() => {
            setShowAddStudent(false)
            void reloadUsers()
            setActionMsg('✅ تمت إضافة الطالب.')
            setTimeout(() => setActionMsg(''), 2500)
          }}
        />
      ) : null}

      {assignSubjectsFor ? (
        <AssignSubjectsModal
          teacherId={assignSubjectsFor.id}
          teacherEmail={assignSubjectsFor.email}
          accessToken={adminAccessToken ?? ''}
          onClose={() => {
            setAssignSubjectsFor(null)
            void reloadUsers()
          }}
        />
      ) : null}

      {assignScopeFor ? (
        <AssignScopeModal
          teacherId={assignScopeFor.id}
          teacherEmail={assignScopeFor.email}
          accessToken={adminAccessToken ?? ''}
          onClose={() => {
            setAssignScopeFor(null)
            void reloadUsers()
          }}
        />
      ) : null}

      <nav
        className="mobile-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: T.headerBg,
          backdropFilter: 'blur(20px)',
          borderTop: `1px solid ${T.borderCol}`,
          justifyContent: 'space-around',
          padding: '8px 0 14px',
          boxShadow: '0 -2px 10px rgba(140,20,40,0.06)',
        }}
      >
        {TABS.map(tb => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              padding: '4px 10px',
              borderRadius: 10,
              color: tab === tb.id ? BRAND.crimson : T.subCol,
              position: 'relative',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: 20 }}>{tb.icon}</span>
            <span style={{ fontSize: 11, fontWeight: tab === tb.id ? BRAND.weightBold : BRAND.weightSemibold }}>
              {tb.label}
            </span>

            {tb.badge && tb.badge > 0 ? (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 2,
                  background: BRAND.orange,
                  color: '#fff',
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                  borderRadius: '50%',
                  fontSize: 9,
                  fontWeight: BRAND.weightBlack,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {tb.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>
    </div>
  )
}