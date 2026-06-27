'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BRAND } from '@/lib/constants/theme'

type DelegationItem = {
  id: string
  user_id: string
  delegated_by: string
  title: string
  notes: string | null
  is_active: boolean
  created_at: string
}

type UserItem = {
  id: string
  email: string
  role?: string | null
  status?: string | null
}

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
  gradWarm: BRAND.gradWarm,
  green: BRAND.gold, // لا أخضر خارج سياق تصحيح الاختبارات
  orange: BRAND.orange,
  red: BRAND.crimson,
}

export default function DelegationsPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [delegations, setDelegations] = useState<DelegationItem[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [search, setSearch] = useState('')
  const [activeOnly, setActiveOnly] = useState<'all' | 'true' | 'false'>('all')

  const [selectedUserId, setSelectedUserId] = useState('')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [isActive, setIsActive] = useState(true)

  const [editingId, setEditingId] = useState<string | null>(null)

  const inputStyle: React.CSSProperties = {
    padding: '11px 14px',
    borderRadius: BRAND.radiusSm,
    border: `1.5px solid ${T.borderCol}`,
    background: T.inputBg,
    color: T.textCol,
    fontSize: 14,
    fontFamily: 'inherit',
    width: '100%',
  }

  const cardStyle: React.CSSProperties = {
    background: T.cardBg,
    borderRadius: BRAND.radiusLg,
    border: `1px solid ${T.borderCol}`,
    boxShadow: T.shadow,
  }

  const getAccessToken = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error || !data.session?.access_token) {
      localStorage.removeItem('mosaeduser')
      router.replace('/login')
      throw new Error('انتهت جلسة تسجيل الدخول.')
    }
    return data.session.access_token
  }, [router])

  const fetchDelegations = useCallback(async () => {
    const token = await getAccessToken()

    const query =
      activeOnly === 'all' ? '' : `?is_active=${encodeURIComponent(activeOnly)}`

    const res = await fetch(`/api/delegations${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      throw new Error(data?.error?.message || 'فشل في جلب التفويضات.')
    }

    setDelegations(data?.items ?? [])
  }, [activeOnly, getAccessToken])

  const fetchUsers = useCallback(async () => {
    const token = await getAccessToken()

    const res = await fetch('/api/users', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      throw new Error(data?.error?.message || 'فشل في جلب المستخدمين.')
    }

    const items = data?.items ?? data?.users ?? []
    setUsers(items)
  }, [getAccessToken])

  const loadAll = useCallback(async () => {
    try {
      setLoading(true)
      setMessage('')
      await Promise.all([fetchDelegations(), fetchUsers()])
    } catch (error: any) {
      setMessage(error?.message || 'تعذر تحميل البيانات.')
    } finally {
      setLoading(false)
    }
  }, [fetchDelegations, fetchUsers])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const resetForm = () => {
    setSelectedUserId('')
    setTitle('')
    setNotes('')
    setIsActive(true)
    setEditingId(null)
  }

  const handleSubmit = async () => {
    try {
      if (!selectedUserId) {
        setMessage('يرجى اختيار المستخدم.')
        return
      }

      if (!title.trim()) {
        setMessage('يرجى إدخال عنوان التفويض.')
        return
      }

      setSaving(true)
      setMessage('')

      const token = await getAccessToken()

      const payload = {
        user_id: selectedUserId,
        title: title.trim(),
        notes: notes.trim() || null,
        is_active: isActive,
      }

      const res = await fetch('/api/delegations', {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          editingId
            ? {
                id: editingId,
                ...payload,
              }
            : payload
        ),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error?.message || 'فشل في حفظ التفويض.')
      }

      setMessage(editingId ? 'تم تحديث التفويض بنجاح.' : 'تم إنشاء التفويض بنجاح.')
      resetForm()
      await fetchDelegations()
    } catch (error: any) {
      setMessage(error?.message || 'حدث خطأ أثناء الحفظ.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item: DelegationItem) => {
    setEditingId(item.id)
    setSelectedUserId(item.user_id)
    setTitle(item.title)
    setNotes(item.notes || '')
    setIsActive(item.is_active)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    const okDelete = window.confirm('هل أنت متأكد من حذف هذا التفويض؟')
    if (!okDelete) return

    try {
      setMessage('')
      const token = await getAccessToken()

      const res = await fetch('/api/delegations', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error?.message || 'فشل في حذف التفويض.')
      }

      setMessage('تم حذف التفويض بنجاح.')
      if (editingId === id) resetForm()
      await fetchDelegations()
    } catch (error: any) {
      setMessage(error?.message || 'حدث خطأ أثناء الحذف.')
    }
  }

  const filteredDelegations = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return delegations

    return delegations.filter((item) => {
      const user = users.find((u) => u.id === item.user_id)
      const email = user?.email?.toLowerCase() || ''
      return (
        item.title.toLowerCase().includes(q) ||
        (item.notes || '').toLowerCase().includes(q) ||
        email.includes(q)
      )
    })
  }, [delegations, search, users])

  const getUserLabel = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (!user) return userId
    return user.email || user.id
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: T.bg,
        color: T.textCol,
        fontFamily: BRAND.fontBody,
        padding: '24px 16px 60px',
      }}
    >
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div
          style={{
            ...cardStyle,
            padding: 20,
            marginBottom: 18,
            background: T.headerBg,
            position: 'sticky',
            top: 16,
            zIndex: 20,
            backdropFilter: 'blur(20px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: 24, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: T.red }}>
                إدارة التفويضات
              </div>
              <div style={{ fontSize: 13, color: T.subCol, marginTop: 6 }}>
                إنشاء وتعديل وحذف تفويضات المستخدمين
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => router.push('/admin')}
                style={{
                  padding: '10px 14px',
                  borderRadius: BRAND.radiusSm,
                  border: `1px solid ${T.borderCol}`,
                  background: 'transparent',
                  color: T.subCol,
                  cursor: 'pointer',
                  fontWeight: BRAND.weightBold,
                  fontFamily: 'inherit',
                }}
              >
                رجوع للإدارة
              </button>

              <button
                onClick={loadAll}
                style={{
                  padding: '10px 14px',
                  borderRadius: BRAND.radiusSm,
                  border: 'none',
                  background: T.gradMain,
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: BRAND.weightBlack,
                  fontFamily: 'inherit',
                }}
              >
                تحديث
              </button>
            </div>
          </div>
        </div>

        {message ? (
          <div
            style={{
              ...cardStyle,
              padding: '12px 14px',
              marginBottom: 16,
              fontSize: 14,
              fontWeight: BRAND.weightBold,
              color: message.startsWith('تم') ? T.green : T.red,
              border: `1px solid ${
                message.startsWith('تم')
                  ? 'rgba(220,140,60,0.3)'
                  : 'rgba(140,20,40,0.25)'
              }`,
              background: message.startsWith('تم')
                ? 'rgba(220,140,60,0.08)'
                : 'rgba(140,20,40,0.06)',
            }}
          >
            {message}
          </div>
        ) : null}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1.4fr',
            gap: 18,
          }}
        >
          <div style={{ ...cardStyle, padding: 18 }}>
            <div style={{ fontSize: 18, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: T.red, marginBottom: 16 }}>
              {editingId ? 'تعديل التفويض' : 'إضافة تفويض'}
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: T.subCol }}>
                  المستخدم
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">اختر مستخدمًا</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: T.subCol }}>
                  عنوان التفويض
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: مشرف منطقة أو مسؤول متابعة"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: T.subCol }}>
                  ملاحظات
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات إضافية حول التفويض"
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 14,
                  color: T.textCol,
                  fontWeight: BRAND.weightBold,
                }}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                التفويض نشط
              </label>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  style={{
                    padding: '12px 18px',
                    borderRadius: BRAND.radiusMd,
                    border: 'none',
                    background: editingId ? T.gradWarm : T.gradMain,
                    color: '#fff',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: BRAND.weightBlack,
                    opacity: saving ? 0.7 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  {saving ? 'جارٍ الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة التفويض'}
                </button>

                <button
                  onClick={resetForm}
                  style={{
                    padding: '12px 18px',
                    borderRadius: BRAND.radiusMd,
                    border: `1px solid ${T.borderCol}`,
                    background: 'transparent',
                    color: T.subCol,
                    cursor: 'pointer',
                    fontWeight: BRAND.weightBlack,
                    fontFamily: 'inherit',
                  }}
                >
                  مسح النموذج
                </button>
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle, padding: 18 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
                marginBottom: 14,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: T.red }}>
                قائمة التفويضات
              </div>

              <div style={{ fontSize: 13, color: T.subCol }}>
                العدد: {filteredDelegations.length}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 180px',
                gap: 10,
                marginBottom: 14,
              }}
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالعنوان أو الملاحظات أو بريد المستخدم"
                style={inputStyle}
              />

              <select
                value={activeOnly}
                onChange={(e) => setActiveOnly(e.target.value as 'all' | 'true' | 'false')}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="all">كل الحالات</option>
                <option value="true">النشطة فقط</option>
                <option value="false">غير النشطة فقط</option>
              </select>
            </div>

            {loading ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: T.subCol }}>
                جارٍ تحميل البيانات...
              </div>
            ) : filteredDelegations.length === 0 ? (
              <div
                style={{
                  padding: '30px 16px',
                  textAlign: 'center',
                  borderRadius: BRAND.radiusMd,
                  background: T.inputBg,
                  color: T.subCol,
                }}
              >
                لا توجد تفويضات مطابقة.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {filteredDelegations.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: `1px solid ${item.is_active ? T.borderCol : 'rgba(220,100,40,0.25)'}`,
                      background: '#fff',
                      borderRadius: BRAND.radiusMd,
                      padding: 14,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 10,
                        flexWrap: 'wrap',
                        marginBottom: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 16, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: T.textCol }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: 13, color: T.subCol, marginTop: 4 }}>
                          المستخدم: {getUserLabel(item.user_id)}
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          padding: '4px 8px',
                          borderRadius: 999,
                          background: item.is_active
                            ? 'rgba(220,140,60,0.10)'
                            : 'rgba(220,100,40,0.12)',
                          color: item.is_active ? T.green : T.orange,
                          fontWeight: BRAND.weightBlack,
                          height: 'fit-content',
                        }}
                      >
                        {item.is_active ? 'نشط' : 'غير نشط'}
                      </div>
                    </div>

                    <div style={{ fontSize: 13, color: T.subCol, marginBottom: 8 }}>
                      فوض بواسطة: {getUserLabel(item.delegated_by)}
                    </div>

                    <div style={{ fontSize: 13, color: T.subCol, marginBottom: 8 }}>
                      تاريخ الإنشاء:{' '}
                      {new Date(item.created_at).toLocaleDateString('ar-KW', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>

                    {item.notes ? (
                      <div
                        style={{
                          marginBottom: 10,
                          padding: 10,
                          borderRadius: BRAND.radiusSm,
                          background: T.inputBg,
                          fontSize: 13,
                          color: T.textCol,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {item.notes}
                      </div>
                    ) : null}

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleEdit(item)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: BRAND.radiusSm,
                          border: 'none',
                          background: 'rgba(140,20,40,0.07)',
                          color: T.red,
                          cursor: 'pointer',
                          fontWeight: BRAND.weightBlack,
                          fontFamily: 'inherit',
                        }}
                      >
                        تعديل
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: BRAND.radiusSm,
                          border: 'none',
                          background: 'rgba(140,20,40,0.10)',
                          color: T.red,
                          cursor: 'pointer',
                          fontWeight: BRAND.weightBlack,
                          fontFamily: 'inherit',
                        }}
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
