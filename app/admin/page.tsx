'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'
import StudentSubscriptionsModal from '@/components/admin/StudentSubscriptionsModal'
import { AddTeacherModal, AssignSubjectsModal } from '@/components/admin/TeacherManager'
import {
  STAGE_LABELS,
  GRADES_BY_STAGE,
  TRACK_LABELS,
  StageKey,
  TrackKey,
} from '@/lib/constants/stages'

const T = {
  bg: BRAND.bg,
  cardBg: BRAND.bgSoft,
  textCol: BRAND.text,
  subCol: BRAND.sub,
  borderCol: BRAND.border,
  inputBg: 'rgba(140,20,40,0.04)',
  headerBg: 'rgba(247,242,234,0.97)',
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
}

interface RoleItem {
  id: string | number
  key: string
  name: string
  description?: string | null
  permissions?: string[]
  is_active?: boolean
}

type Subject = {
  id: string
  name: string
  grade?: string
  icon?: string
}

type Tab = 'users' | 'subjects' | 'stats' | 'settings'

export default function AdminPage() {
  const router = useRouter()

  const [admin, setAdmin] = useState<User | null>(null)
  const [tab, setTab] = useState<Tab>('users')
  const [users, setUsers] = useState<User[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [roles, setRoles] = useState<RoleItem[]>([])

  const [loading, setLoading] = useState(false)
  const [rolesLoading, setRolesLoading] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)

  const [filter, setFilter] = useState<'all' | 'pending' | 'student' | 'teacher'>('all')
  const [searchQ, setSearchQ] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  const [logoUrl, setLogoUrl] = useState('/logo-midad.png')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')

  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState('')

  // ── جديد: تعيين المرحلة/الصف/التشعيب (الميزة المفقودة فعلياً) ──
  const [stageModalOpen, setStageModalOpen] = useState(false)
  const [stageModalUser, setStageModalUser] = useState<User | null>(null)
  const [modalStage, setModalStage] = useState<StageKey | null>(null)
  const [modalGrade, setModalGrade] = useState<string | null>(null)
  const [modalTrack, setModalTrack] = useState<TrackKey | null>(null)
  const [savingStage, setSavingStage] = useState(false)
  const [assigningRole, setAssigningRole] = useState(false)

  // ── جديد: مودال اشتراكات الطالب (مادة مفردة/باقة) ──────────────
  const [subscriptionsModalUser, setSubscriptionsModalUser] = useState<User | null>(null)
  const [subscriptionsAccessToken, setSubscriptionsAccessToken] = useState('')

  // ── جديد: إنشاء معلم مباشرة + تخصيص مواده ──────────────────────
  // كلا المودالين يحتاجان accessToken (Supabase session) لأن نقطتي
  // الـAPI الخلفيتين (/api/teachers و /api/teacher-subjects) محميتان
  // بصلاحية create_teachers (أدمن دائماً، أو موظف مخوَّل بهذا المفتاح).
  const [showAddTeacher, setShowAddTeacher] = useState(false)
  const [assignSubjectsFor, setAssignSubjectsFor] = useState<User | null>(null)
  const [adminAccessToken, setAdminAccessToken] = useState('')

  const logoInputRef = useRef<HTMLInputElement | null>(null)

  // ── التحقق من الجلسة وصلاحية المدير ────────────────────────
  useEffect(() => {
    let mounted = true

    async function checkAuth() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError || !session?.access_token) {
          localStorage.removeItem('mosaed_user')
          router.replace('/login')
          return
        }

        const meRes = await fetch('/api/auth/me', {
          method: 'GET',
          headers: { Authorization: `Bearer ${session.access_token}` },
        })

        const meData = await meRes.json().catch(() => null)

        if (!meRes.ok || !meData?.user) {
          localStorage.removeItem('mosaed_user')
          router.replace('/login')
          return
        }

        const appUser = meData.user as User

        if (appUser.role !== 'admin') {
          if (appUser.user_type === 'student') router.replace('/student')
          else router.replace('/dashboard')
          return
        }

        localStorage.setItem('mosaed_user', JSON.stringify(appUser))

        if (!mounted) return
        setAdmin(appUser)
        // ── جديد: حفظ التوكن لاستخدامه في مودالات المعلمين ──────
        setAdminAccessToken(session.access_token)
      } catch {
        localStorage.removeItem('mosaed_user')
        router.replace('/login')
      } finally {
        if (mounted) setAuthChecking(false)
      }
    }

    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('mosaed_user')
        router.replace('/login')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  // ── جلب شعار المنصة ─────────────────────────────────────────
  useEffect(() => {
    fetch('/api/platform-settings')
      .then(r => r.json())
      .then(d => {
        if (d.settings?.logo_url) setLogoUrl(d.settings.logo_url)
      })
      .catch(() => {})
  }, [])

  // ── جلب المستخدمين ──────────────────────────────────────────
  useEffect(() => {
    if (!admin || tab !== 'users') return

    let mounted = true

    async function loadUsers() {
      try {
        setLoading(true)
        setActionMsg('')

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw new Error('تعذر قراءة جلسة المستخدم.')
        }

        const accessToken = session?.access_token

        if (!accessToken) {
          localStorage.removeItem('mosaed_user')
          router.replace('/login')
          throw new Error('انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى.')
        }

        const response = await fetch('/api/users', {
          headers: { Authorization: `Bearer ${accessToken}` },
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
            localStorage.removeItem('mosaed_user')
            router.replace('/login')
          }
          throw new Error(data?.error || 'فشل في جلب المستخدمين')
        }

        if (!mounted) return
        setUsers(data?.items ?? [])
      } catch (error: any) {
        console.error('admin users fetch error:', error)
        if (!mounted) return
        setActionMsg(`❌ ${error?.message || 'حدث خطأ غير متوقع'}`)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadUsers()

    return () => {
      mounted = false
    }
  }, [admin, tab, router])

  // ── جلب الأدوار المتاحة ─────────────────────────────────────
  useEffect(() => {
    if (!admin || tab !== 'users') return
    let mounted = true

    async function loadRoles() {
      try {
        setRolesLoading(true)

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw new Error('تعذر قراءة الجلسة.')
        const accessToken = session?.access_token
        if (!accessToken) throw new Error('انتهت الجلسة. سجل الدخول مرة أخرى.')

        const res = await fetch('/api/roles', {
          headers: { Authorization: `Bearer ${accessToken}` },
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

    loadRoles()

    return () => {
      mounted = false
    }
  }, [admin, tab])

  // ── جلب المواد ───────────────────────────────────────────────
  useEffect(() => {
    if (!admin || tab !== 'subjects') return

    fetch('/api/subjects')
      .then(r => r.json())
      .then(d => setSubjects(d.subjects ?? []))
      .catch(console.error)
  }, [admin, tab])

  // ── إعادة جلب المستخدمين (تُستخدَم بعد إنشاء معلم جديد) ───────
  async function reloadUsers() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) return

      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await response.json().catch(() => null)
      if (response.ok) setUsers(data?.items ?? [])
    } catch {
      // فشل إعادة الجلب لا يُسقط أي شيء — القائمة ستتحدّث عند فتح
      // التبويب من جديد على أي حال
    }
  }

  // ── تحديث مستخدم (موافقة/تعليق/ترقية) ──────────────────────
  async function updateUser(userId: string, updates: Record<string, string>) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token

      if (!accessToken) {
        localStorage.removeItem('mosaed_user')
        router.replace('/login')
        setActionMsg('❌ لم يتم العثور على جلسة تسجيل دخول صالحة.')
        return
      }

      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId, ...updates }),
      })

      const data = await res.json().catch(() => null)

      if (res.ok) {
        setActionMsg('✅ تم التحديث')
        setTimeout(() => setActionMsg(''), 2500)
        setUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...updates } : u)))
      } else {
        if (res.status === 401) {
          localStorage.removeItem('mosaed_user')
          router.replace('/login')
        }
        setActionMsg(`❌ ${data?.error || 'فشل التحديث'}`)
      }
    } catch {
      setActionMsg('❌ حدث خطأ')
    }
  }

  // ── حذف مستخدم ───────────────────────────────────────────────
  async function deleteUser(userId: string) {
    if (!confirm('هل تريد حذف هذا المستخدم؟')) return

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token

      if (!accessToken) {
        localStorage.removeItem('mosaed_user')
        router.replace('/login')
        setActionMsg('❌ لم يتم العثور على جلسة تسجيل دخول صالحة.')
        return
      }

      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId }),
      })

      const data = await res.json().catch(() => null)

      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId))
        setActionMsg('✅ تم الحذف')
        setTimeout(() => setActionMsg(''), 2500)
      } else {
        if (res.status === 401) {
          localStorage.removeItem('mosaed_user')
          router.replace('/login')
        }
        setActionMsg(`❌ ${data?.error || 'فشل الحذف'}`)
      }
    } catch {
      setActionMsg('❌ حدث خطأ')
    }
  }

  // ── رفع شعار المنصة ──────────────────────────────────────────
  async function uploadLogo() {
    if (!logoFile) return

    setUploading(true)
    setUploadMsg('')

    try {
      const form = new FormData()
      form.append('logo', logoFile)

      const res = await fetch('/api/platform-settings/logo', {
        method: 'POST',
        body: form,
      })

      const data = await res.json().catch(() => null)

      if (res.ok) {
        setLogoUrl(data?.url || logoUrl)
        setUploadMsg('✅ تم رفع الشعار بنجاح!')
        setLogoFile(null)
        if (logoInputRef.current) logoInputRef.current.value = ''
      } else {
        setUploadMsg(`❌ ${data?.error || 'فشل رفع الشعار'}`)
      }
    } catch {
      setUploadMsg('❌ فشل الاتصال')
    } finally {
      setUploading(false)
    }
  }

  // ── مودال تعيين الدور ────────────────────────────────────────
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

  // ── جديد: مودال تعيين المرحلة/الصف/التشعيب ─────────────────────
  // الميزة المفقودة فعلياً — لا التسجيل ولا الموافقة كانا يطلبانها
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

  // ── جديد: فتح مودال الاشتراكات — يجلب توكناً طازجاً عند كل فتح،
  // بنفس نمط بقية الإجراءات في هذا الملف (لا تخزين دائم للتوكن) ──
  async function openSubscriptionsModal(user: User) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const accessToken = session?.access_token
    if (!accessToken) {
      localStorage.removeItem('mosaed_user')
      router.replace('/login')
      return
    }
    setSubscriptionsAccessToken(accessToken)
    setSubscriptionsModalUser(user)
  }

  function closeSubscriptionsModal() {
    setSubscriptionsModalUser(null)
    setSubscriptionsAccessToken('')
  }

  // approveAfterAssign: عند true، يُعتمَد الطالب (status=approved) في نفس الاستدعاء
  async function saveStageAssignment(approveAfterAssign: boolean) {
    if (!stageModalUser || !modalStage || !modalGrade) {
      setActionMsg('❌ اختر المرحلة والصف على الأقل.')
      return
    }

    const needsTrack = modalGrade === '11' || modalGrade === '12'
    if (needsTrack && !modalTrack) {
      setActionMsg('❌ هذا الصف يتطلب تحديد التشعيب (علمي/أدبي).')
      return
    }

    try {
      setSavingStage(true)
      setActionMsg('')

      const {
        data: { session },
      } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) {
        localStorage.removeItem('mosaed_user')
        router.replace('/login')
        return
      }

      const updates: Record<string, any> = {
        userId: stageModalUser.id,
        allowed_stages: [modalStage],
        allowed_grades: [modalGrade],
        track: needsTrack ? modalTrack : null,
      }
      if (approveAfterAssign) updates.status = 'approved'

      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updates),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('mosaed_user')
          router.replace('/login')
          return
        }
        throw new Error(data?.error || 'تعذر حفظ المرحلة والصف.')
      }

      setUsers(prev =>
        prev.map(u =>
          u.id === stageModalUser.id
            ? {
                ...u,
                allowed_stages: [modalStage],
                allowed_grades: [modalGrade],
                track: needsTrack ? modalTrack : null,
                ...(approveAfterAssign ? { status: 'approved' } : {}),
              }
            : u
        )
      )

      setActionMsg('✅ تم حفظ المرحلة والصف بنجاح.')
      setTimeout(() => setActionMsg(''), 2500)
      closeStageModal()
    } catch (error: any) {
      setActionMsg(`❌ ${error?.message || 'حدث خطأ أثناء الحفظ.'}`)
    } finally {
      setSavingStage(false)
    }
  }

  // ── تعيين دور للمستخدم (roleId — لا roleKey) ──────────────────
  async function assignRoleToUser() {
    if (!selectedUser) return
    if (!selectedRoleId) {
      setActionMsg('❌ اختر دورًا أولًا.')
      return
    }

    try {
      setAssigningRole(true)
      setActionMsg('')

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) throw new Error('تعذر قراءة الجلسة.')

      const accessToken = session?.access_token
      if (!accessToken) {
        localStorage.removeItem('mosaed_user')
        router.replace('/login')
        return
      }

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
        if (res.status === 401) {
          localStorage.removeItem('mosaed_user')
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

  // ── إزالة الدور المعيّن ─────────────────────────────────────
  async function removeAssignedRole() {
    if (!selectedUser) return

    try {
      setAssigningRole(true)
      setActionMsg('')

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) throw new Error('تعذر قراءة الجلسة.')

      const accessToken = session?.access_token
      if (!accessToken) {
        localStorage.removeItem('mosaed_user')
        router.replace('/login')
        return
      }

      const res = await fetch('/api/users/assign-role', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId: selectedUser.id }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('mosaed_user')
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

  // ── تسجيل الخروج ─────────────────────────────────────────────
  async function handleLogout() {
    localStorage.removeItem('mosaed_user')
    localStorage.removeItem('mosaed_session')
    await supabase.auth.signOut()
    router.replace('/login')
  }

  // ── فلترة المستخدمين ─────────────────────────────────────────
  const filtered = useMemo(() => {
    return users.filter(u => {
      const displayName = u.email || ''
      const q = searchQ.trim().toLowerCase()
      const email = (u.email || '').toLowerCase()

      const matchSearch =
        !q ||
        displayName.toLowerCase().includes(q) ||
        email.includes(q) ||
        (u.assigned_role?.name || '').toLowerCase().includes(q) ||
        (u.assigned_role?.key || '').toLowerCase().includes(q)

      const matchFilter =
        filter === 'all'
          ? true
          : filter === 'pending'
          ? u.status === 'pending'
          : filter === 'student'
          ? u.user_type === 'student'
          : filter === 'teacher'
          ? u.user_type === 'teacher' || u.role === 'teacher'
          : true

      return matchSearch && matchFilter
    })
  }, [users, searchQ, filter])

  const pendingCount = users.filter(u => u.status === 'pending').length
  const studentsCount = users.filter(u => u.user_type === 'student').length
  const teachersCount = users.filter(
    u => u.user_type === 'teacher' || u.role === 'teacher'
  ).length

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: BRAND.radiusSm,
    border: `1.5px solid ${T.borderCol}`,
    background: T.inputBg,
    color: T.textCol,
    fontSize: 14,
    fontFamily: 'inherit',
  }

  const TABS: { id: Tab; icon: string; label: string; badge?: number }[] = [
    { id: 'users', icon: '👥', label: 'المستخدمون', badge: pendingCount },
    { id: 'subjects', icon: '📚', label: 'المواد' },
    { id: 'stats', icon: '📊', label: 'الإحصائيات' },
    { id: 'settings', icon: '⚙️', label: 'إعدادات المنصة' },
  ]

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

  if (!admin) return null

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: T.bg,
        color: T.textCol,
        fontFamily: BRAND.fontBody,
        paddingBottom: 80,
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .fade-in { animation: fadeIn 0.3s ease; }
        input:focus, select:focus {
          outline: none;
          border-color: rgba(140,20,40,0.4) !important;
        }
        select option {
          background: ${BRAND.bg} !important;
          color: ${BRAND.text} !important;
        }
        select { color-scheme: light; }
        @media (max-width: 760px) {
          .admin-stats-grid { grid-template-columns: 1fr !important; }
          .admin-stats-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ══ الرأس ══ */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: T.headerBg,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${T.borderCol}`,
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: T.shadow,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: BRAND.radiusSm,
              background: T.gradMain,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: BRAND.weightBlack,
              color: '#fff',
            }}
          >
            م
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: T.textCol }}>
              مِداد
            </div>
            <div style={{ fontSize: 12, color: T.subCol }}>
              👑 {admin.email || 'المدير'} • مدير
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {/* ── جديد: زر إضافة معلم — ظاهر دائماً في الهيدر، لا فقط
              داخل تبويب المستخدمين، لسهولة الوصول إليه ── */}
          <Button variant="primary" size="sm" onClick={() => setShowAddTeacher(true)}>
            ➕ إضافة معلم
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            ✨ أدوات التوليد
          </Button>
          <Button variant="danger" size="sm" onClick={handleLogout}>
            🚪 خروج
          </Button>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>

        {actionMsg && (
          <div
            style={{
              padding: '11px 16px',
              borderRadius: BRAND.radiusSm,
              marginBottom: 16,
              fontSize: 14,
              fontWeight: BRAND.weightBold,
              textAlign: 'center',
              background: actionMsg.startsWith('✅')
                ? 'rgba(140,20,40,0.10)'
                : 'rgba(140,20,40,0.10)',
              border: `1px solid ${
                actionMsg.startsWith('✅')
                  ? 'rgba(140,20,40,0.3)'
                  : 'rgba(140,20,40,0.3)'
              }`,
              color: actionMsg.startsWith('✅') ? BRAND.crimson : BRAND.crimson,
            }}
          >
            {actionMsg}
          </div>
        )}

        {/* ══ تبويب المستخدمين ══ */}
        {tab === 'users' && (
          <div className="fade-in">
            <div
              className="admin-stats-grid"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}
            >
              {[
                { label: 'إجمالي المستخدمين', value: users.length, color: BRAND.crimson, icon: '👥' },
                { label: 'طلاب مسجلون', value: studentsCount, color: BRAND.orange, icon: '👨‍' },
                { label: 'بانتظار الموافقة', value: pendingCount, color: BRAND.red, icon: '⏳' },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: '18px',
                    borderRadius: BRAND.radiusMd,
                    background: T.cardBg,
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

            {/* ── جديد: زر إضافة معلم مكرّر هنا أيضاً، أعلى قائمة
                المستخدمين تحديداً — أكثر وضوحاً لمن يدير الفريق ── */}
            <Button
              variant="primary"
              fullWidth
              onClick={() => setShowAddTeacher(true)}
            >
              ➕ إضافة معلم جديد مباشرة
            </Button>
            <div style={{ height: 14 }} />

            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="🔍 بحث بالبريد..."
                style={{ ...inputStyle, flex: 1, minWidth: 200 }}
              />
              <select
                value={filter}
                onChange={e => setFilter(e.target.value as typeof filter)}
                style={{ ...inputStyle, cursor: 'pointer', minWidth: 160 }}
              >
                <option value="all">الكل ({users.length})</option>
                <option value="pending">بانتظار الموافقة ({pendingCount})</option>
                <option value="student">طلاب ({studentsCount})</option>
                <option value="teacher">معلمون ({teachersCount})</option>
              </select>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: T.subCol }}>
                ⏳ جارٍ التحميل...
              </div>
            ) : filtered.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  background: T.cardBg,
                  borderRadius: BRAND.radiusMd,
                  border: `1px solid ${T.borderCol}`,
                  color: T.subCol,
                }}
              >
                لا يوجد مستخدمون
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map(u => {
                  const displayName = u.email || 'بدون بريد'
                  const isTeacher = u.user_type === 'teacher' || u.role === 'teacher'

                  return (
                    <div
                      key={u.id}
                      style={{
                        padding: '14px 18px',
                        borderRadius: BRAND.radiusMd,
                        background: T.cardBg,
                        border: `1.5px solid ${
                          u.status === 'pending' ? 'rgba(140,20,40,0.3)' : T.borderCol
                        }`,
                        boxShadow: T.shadow,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: 10,
                        }}
                      >
                        {/* معلومات المستخدم */}
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              marginBottom: 4,
                              flexWrap: 'wrap',
                            }}
                          >
                            <span style={{ fontSize: 18 }}>
                              {u.user_type === 'student' ? '👨‍' : u.role === 'admin' ? '👑' : '👨‍'}
                            </span>

                            <span style={{ fontSize: 15, fontWeight: BRAND.weightBold, color: T.textCol }}>
                              {displayName}
                            </span>

                            <span
                              style={{
                                fontSize: 11,
                                padding: '2px 8px',
                                borderRadius: 6,
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

                          <div style={{ fontSize: 13, color: T.subCol, marginBottom: 4 }}>
                            {u.email}
                          </div>

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

                        {/* أزرار الإجراءات */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {u.status === 'pending' && (
                            <button
                              onClick={() =>
                                u.user_type === 'student'
                                  ? openStageModal(u)
                                  : updateUser(u.id, { status: 'approved' })
                              }
                              style={{
                                padding: '7px 14px',
                                borderRadius: 8,
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
                                padding: '7px 14px',
                                borderRadius: 8,
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
                                padding: '7px 14px',
                                borderRadius: 8,
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
                                padding: '7px 14px',
                                borderRadius: 8,
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
                                padding: '7px 14px',
                                borderRadius: 8,
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
                                ? `📚 ${STAGE_LABELS[u.allowed_stages[0] as StageKey] ?? u.allowed_stages[0]} • ${u.allowed_grades?.[0] ?? '؟'}`
                                : '⚠️ لم تُحدَّد الصف'}
                            </button>
                          )}

                          {u.user_type === 'student' && u.allowed_stages?.length ? (
                            <button
                              onClick={() => openSubscriptionsModal(u)}
                              style={{
                                padding: '7px 14px',
                                borderRadius: 8,
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

                          {/* ── جديد: تخصيص المواد — يظهر فقط لمن
                              user_type/role = teacher ── */}
                          {isTeacher && (
                            <button
                              onClick={() => setAssignSubjectsFor(u)}
                              style={{
                                padding: '7px 14px',
                                borderRadius: 8,
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

                          {u.role !== 'admin' && (
                            <button
                              onClick={() => openRoleModal(u)}
                              style={{
                                padding: '7px 14px',
                                borderRadius: 8,
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
                                padding: '7px 12px',
                                borderRadius: 8,
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
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ تبويب المواد ══ */}
        {tab === 'subjects' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: BRAND.crimson, marginBottom: 16 }}>
              📚 المواد الدراسية
            </h2>

            {/* زر الانتقال لإدارة المواد والوحدات الكاملة (مرحلة الإضافة/التعديل/التشعيب) */}
            <Button
              variant="primary"
              fullWidth
              onClick={() => router.push('/admin/subjects')}
            >
              🆕 الذهاب إلى لوحة إدارة المواد والوحدات الكاملة ←
            </Button>
            <div style={{ height: 10 }} />

            {/* جديد — زر الانتقال لإدارة الباقات، لم يكن له مدخل ظاهر سابقاً */}
            <Button
              variant="secondary"
              fullWidth
              onClick={() => router.push('/admin/packages')}
            >
              📦 إدارة الباقات ←
            </Button>
            <div style={{ height: 20 }} />

            {subjects.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  background: T.cardBg,
                  borderRadius: BRAND.radiusMd,
                  color: T.subCol,
                }}
              >
                لا توجد مواد
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
                  gap: 14,
                }}
              >
                {subjects.map(s => (
                  <div
                    key={s.id}
                    style={{
                      padding: '18px',
                      borderRadius: BRAND.radiusMd,
                      background: T.cardBg,
                      border: `1.5px solid ${T.borderCol}`,
                      boxShadow: T.shadow,
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 8 }}>{s.icon ?? '📚'}</div>
                    <div style={{ fontSize: 15, fontWeight: BRAND.weightBold, color: T.textCol, marginBottom: 4 }}>
                      {s.name}
                    </div>
                    {s.grade && (
                      <div style={{ fontSize: 12, color: BRAND.crimson, fontWeight: BRAND.weightBold }}>
                        الصف {s.grade}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ تبويب الإحصائيات ══ */}
        {tab === 'stats' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: BRAND.crimson, marginBottom: 20 }}>
              📊 إحصائيات النظام
            </h2>

            <div
              className="admin-stats-grid-2"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}
            >
              {[
                { label: 'إجمالي المستخدمين', value: users.length, color: BRAND.deep, icon: '👥' },
                { label: 'طلاب مسجلون', value: studentsCount, color: BRAND.red, icon: '👨‍' },
                { label: 'معلمون', value: teachersCount, color: BRAND.crimson, icon: '👨‍' },
                { label: 'بانتظار الموافقة', value: pendingCount, color: BRAND.orangeRed, icon: '⏳' },
                {
                  label: 'مستخدمون مفعلون',
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
                    background: T.cardBg,
                    border: `1.5px solid ${s.color}20`,
                    boxShadow: T.shadow,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, color: T.subCol, marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontSize: 32, fontWeight: BRAND.weightBlack, color: s.color }}>{s.value}</div>
                    </div>
                    <div style={{ fontSize: 36, opacity: 0.6 }}>{s.icon}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ تبويب إعدادات المنصة ══ */}
        {tab === 'settings' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: BRAND.crimson, marginBottom: 24 }}>
              ⚙️ إعدادات المنصة
            </h2>

            <div
              style={{
                background: T.cardBg,
                borderRadius: BRAND.radiusXl,
                border: `1px solid ${T.borderCol}`,
                padding: 28,
                maxWidth: 520,
                boxShadow: T.shadow,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: T.textCol, marginBottom: 20 }}>
                🖼️ شعار المنصة
              </h3>

              <div
                style={{
                  textAlign: 'center',
                  marginBottom: 22,
                  padding: 22,
                  borderRadius: BRAND.radiusMd,
                  background: T.inputBg,
                  border: `1px dashed ${T.borderCol}`,
                }}
              >
                <img
                  src={logoUrl}
                  alt="الشعار الحالي"
                  style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain' }}
                  onError={e => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                <p style={{ fontSize: 12, color: T.subCol, marginTop: 8 }}>الشعار الحالي</p>
              </div>

              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                style={{ display: 'none' }}
                onChange={e => {
                  setLogoFile(e.target.files?.[0] ?? null)
                  setUploadMsg('')
                }}
              />

              <button
                onClick={() => logoInputRef.current?.click()}
                style={{
                  width: '100%',
                  padding: 16,
                  borderRadius: BRAND.radiusMd,
                  border: `2px dashed ${logoFile ? BRAND.crimson : T.borderCol}`,
                  background: logoFile ? 'rgba(140,20,40,0.06)' : 'transparent',
                  color: logoFile ? BRAND.crimson : T.subCol,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: BRAND.weightBold,
                  fontFamily: 'inherit',
                  marginBottom: 14,
                }}
              >
                {logoFile ? `✅ ${logoFile.name}` : '📁 اختر صورة الشعار (PNG أو JPG)'}
              </button>

              {logoFile && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: '12px 14px',
                    borderRadius: BRAND.radiusSm,
                    background: 'rgba(140,20,40,0.05)',
                    border: `1px solid ${T.borderCol}`,
                    fontSize: 13,
                    color: T.subCol,
                  }}
                >
                  <div style={{ marginBottom: 8 }}>📦 {(logoFile.size / 1024).toFixed(1)} KB</div>
                  <img
                    src={URL.createObjectURL(logoFile)}
                    alt="معاينة"
                    style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain', borderRadius: 8 }}
                  />
                </div>
              )}

              {uploadMsg && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: BRAND.radiusSm,
                    marginBottom: 14,
                    fontSize: 14,
                    fontWeight: BRAND.weightBold,
                    background: uploadMsg.startsWith('✅') ? 'rgba(140,20,40,0.10)' : 'rgba(140,20,40,0.08)',
                    border: `1px solid ${
                      uploadMsg.startsWith('✅') ? 'rgba(140,20,40,0.3)' : 'rgba(140,20,40,0.3)'
                    }`,
                    color: uploadMsg.startsWith('✅') ? BRAND.crimson : BRAND.crimson,
                  }}
                >
                  {uploadMsg}
                </div>
              )}

              <Button
                variant="primary"
                fullWidth
                disabled={uploading || !logoFile}
                onClick={uploadLogo}
              >
                {uploading ? (
                  <>
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        border: '2.5px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    {' '}جارٍ الرفع...
                  </>
                ) : (
                  '🚀 رفع الشعار الجديد'
                )}
              </Button>

              <p style={{ fontSize: 12, color: T.subCol, marginTop: 12, textAlign: 'center' }}>
                PNG شفاف • أبعاد مثالية 300×150 • أقل من 2MB
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ══ مودال تعيين الدور ══ */}
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
                <div style={{ fontSize: 18, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: T.textCol, marginBottom: 6 }}>
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

            <label style={{ display: 'block', fontSize: 13, fontWeight: BRAND.weightBlack, color: T.textCol, marginBottom: 8 }}>
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
                      <div style={{ fontSize: 14, fontWeight: BRAND.weightBlack, color: T.textCol, marginBottom: 6 }}>
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
              <Button
                variant="primary"
                disabled={!selectedRoleId || assigningRole}
                onClick={assignRoleToUser}
              >
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

      {/* ══ جديد: مودال تعيين المرحلة/الصف/التشعيب ══ */}
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
                <div style={{ fontSize: 18, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: T.textCol, marginBottom: 6 }}>
                  تحديد المرحلة والصف
                </div>
                <div style={{ fontSize: 13, color: T.subCol }}>{stageModalUser.email}</div>
              </div>
              <Button variant="ghost" size="sm" disabled={savingStage} onClick={closeStageModal}>
                إغلاق
              </Button>
            </div>

            {/* المرحلة */}
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

            {/* الصف */}
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

            {/* التشعيب — فقط للصفين 11/12 */}
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

      {/* ══ جديد: مودال اشتراكات الطالب ══ */}
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

      {/* ══ جديد: مودال إضافة معلم ══ */}
      {showAddTeacher && (
        <AddTeacherModal
          accessToken={adminAccessToken}
          onClose={() => setShowAddTeacher(false)}
          onCreated={reloadUsers}
        />
      )}

      {/* ══ جديد: مودال تخصيص المواد لمعلم ══ */}
      {assignSubjectsFor && (
        <AssignSubjectsModal
          teacherId={assignSubjectsFor.id}
          teacherEmail={assignSubjectsFor.email}
          accessToken={adminAccessToken}
          onClose={() => setAssignSubjectsFor(null)}
        />
      )}

      {/* ══ شريط التنقل ══ */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: T.headerBg,
          backdropFilter: 'blur(20px)',
          borderTop: `1px solid ${T.borderCol}`,
          display: 'flex',
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
              padding: '4px 12px',
              borderRadius: 10,
              color: tab === tb.id ? BRAND.crimson : T.subCol,
              position: 'relative',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: 20 }}>{tb.icon}</span>
            <span style={{ fontSize: 11, fontWeight: tab === tb.id ? BRAND.weightBold : BRAND.weightSemibold }}>{tb.label}</span>

            {tb.badge && tb.badge > 0 ? (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 2,
                  background: BRAND.orange,
                  color: '#fff',
                  width: 16,
                  height: 16,
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
