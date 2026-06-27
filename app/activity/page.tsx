// app/activity/page.tsx
'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

const T = {
  bg: '#F5F0E8',
  card: '#FDFAF5',
  text: '#1A1221',
  sub: '#6B5050',
  line: 'rgba(192,57,43,0.15)',
  soft: 'rgba(192,57,43,0.05)',
  primary: '#C0392B',
  orange: '#E07020',
  gold: '#d63a0a',
  green: '#059669',
  blue: '#2563EB',
  shadow: '0 2px 12px rgba(192,57,43,0.08)',
  grad: 'linear-gradient(135deg,#C0392B,#E07020)',
}

type ActivityItem = {
  id: number
  user: string
  role: 'admin' | 'teacher' | 'student' | 'staff'
  action: string
  target: string
  status: 'success' | 'pending' | 'warning'
  time: string
  note?: string
}

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 1,
    user: 'admin@test.com',
    role: 'admin',
    action: 'اعتماد مستخدم جديد',
    target: 'teacher@test.com',
    status: 'success',
    time: 'منذ 5 دقائق',
    note: 'تم تحويله إلى معلم',
  },
  {
    id: 2,
    user: 'teacher@test.com',
    role: 'teacher',
    action: 'إضافة مادة تعليمية',
    target: 'درس الهمزة المتوسطة',
    status: 'success',
    time: 'منذ 18 دقيقة',
  },
  {
    id: 3,
    user: 'student@test.com',
    role: 'student',
    action: 'إرسال حل واجب',
    target: 'الواجب الأول',
    status: 'pending',
    time: 'منذ 32 دقيقة',
  },
  {
    id: 4,
    user: 'staff@test.com',
    role: 'staff',
    action: 'تحديث بيانات مستخدم',
    target: 'ملف الطالب الثاني عشر',
    status: 'warning',
    time: 'منذ ساعة',
    note: 'يحتاج مراجعة',
  },
  {
    id: 5,
    user: 'teacher2@test.com',
    role: 'teacher',
    action: 'إنشاء اختبار',
    target: 'اختبار النحو',
    status: 'success',
    time: 'منذ ساعتين',
  },
  {
    id: 6,
    user: 'student2@test.com',
    role: 'student',
    action: 'طلب الانضمام إلى مادة',
    target: 'القراءة',
    status: 'pending',
    time: 'اليوم',
  },
]

function getRoleLabel(role: ActivityItem['role']) {
  switch (role) {
    case 'admin':
      return 'مدير'
    case 'teacher':
      return 'معلم'
    case 'student':
      return 'طالب'
    case 'staff':
      return 'إداري'
    default:
      return 'مستخدم'
  }
}

function getRoleIcon(role: ActivityItem['role']) {
  switch (role) {
    case 'admin':
      return '👑'
    case 'teacher':
      return '🧑‍🏫'
    case 'student':
      return '🎓'
    case 'staff':
      return '🗂️'
    default:
      return '👤'
  }
}

function getStatusMeta(status: ActivityItem['status']) {
  switch (status) {
    case 'success':
      return {
        label: 'مكتمل',
        color: '#059669',
        bg: 'rgba(5,150,105,0.10)',
      }
    case 'pending':
      return {
        label: 'قيد المعالجة',
        color: '#D97706',
        bg: 'rgba(244,164,32,0.16)',
      }
    case 'warning':
      return {
        label: 'بحاجة مراجعة',
        color: '#C0392B',
        bg: 'rgba(192,57,43,0.10)',
      }
    default:
      return {
        label: 'غير محدد',
        color: '#6B5050',
        bg: 'rgba(107,80,80,0.10)',
      }
  }
}

export default function ActivityPage() {
  const router = useRouter()
  const [searchQ, setSearchQ] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | ActivityItem['role']>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | ActivityItem['status']>('all')

  const filtered = useMemo(() => {
    const q = searchQ.trim().toLowerCase()

    return MOCK_ACTIVITY.filter(item => {
      const haystack = `${item.user} ${item.action} ${item.target} ${item.note || ''}`.toLowerCase()

      const matchSearch = !q || haystack.includes(q)
      const matchRole = roleFilter === 'all' || item.role === roleFilter
      const matchStatus = statusFilter === 'all' || item.status === statusFilter

      return matchSearch && matchRole && matchStatus
    })
  }, [searchQ, roleFilter, statusFilter])

  const stats = [
    {
      label: 'إجمالي الأنشطة',
      value: MOCK_ACTIVITY.length,
      icon: '📋',
      color: T.primary,
    },
    {
      label: 'العمليات المكتملة',
      value: MOCK_ACTIVITY.filter(i => i.status === 'success').length,
      icon: '✅',
      color: T.green,
    },
    {
      label: 'قيد المعالجة',
      value: MOCK_ACTIVITY.filter(i => i.status === 'pending').length,
      icon: '⏳',
      color: T.gold,
    },
    {
      label: 'بحاجة مراجعة',
      value: MOCK_ACTIVITY.filter(i => i.status === 'warning').length,
      icon: '⚠️',
      color: T.blue,
    },
  ]

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: T.bg,
        color: T.text,
        fontFamily: 'Calibri, Segoe UI, Tahoma, Arial, sans-serif',
        paddingBottom: 30,
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }

        input:focus, select:focus {
          outline: none;
          border-color: rgba(192,57,43,0.4) !important;
        }

        @media (max-width: 900px) {
          .stats-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width: 700px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }

          .filters-row {
            flex-direction: column;
          }

          .activity-head {
            flex-direction: column;
            align-items: flex-start !important;
          }
        }
      `}</style>

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'rgba(245,240,232,0.97)',
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${T.line}`,
          padding: '14px 18px',
          boxShadow: T.shadow,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: T.grad,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 900,
                fontSize: 20,
              }}
            >
              م
            </div>

            <div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>سجل النشاط</div>
              <div style={{ fontSize: 12, color: T.sub }}>
                متابعة نشاط المنصة والعمليات الأخيرة
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/admin')} style={ghostBtn}>
              ← العودة إلى الأدمن
            </button>
            <button onClick={() => router.push('/dashboard')} style={primaryBtn}>
              لوحة المنصة
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px' }}>
        <section
          className="stats-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 14,
            marginBottom: 22,
          }}
        >
          {stats.map((item, index) => (
            <div
              key={index}
              style={{
                background: T.card,
                borderRadius: 18,
                border: `1px solid ${item.color}22`,
                boxShadow: T.shadow,
                padding: 20,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: item.color }}>{item.value}</div>
              <div style={{ fontSize: 13, color: T.sub, marginTop: 6 }}>{item.label}</div>
            </div>
          ))}
        </section>

        <section
          style={{
            background: T.card,
            borderRadius: 18,
            border: `1px solid ${T.line}`,
            boxShadow: T.shadow,
            padding: 18,
            marginBottom: 18,
          }}
        >
          <div className="filters-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="ابحث بالمستخدم أو النشاط أو الهدف..."
              style={{ ...inputStyle, flex: 1, minWidth: 220 }}
            />

            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as any)}
              style={{ ...inputStyle, minWidth: 150, cursor: 'pointer' }}
            >
              <option value="all">كل الأدوار</option>
              <option value="admin">مدير</option>
              <option value="teacher">معلم</option>
              <option value="student">طالب</option>
              <option value="staff">إداري</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              style={{ ...inputStyle, minWidth: 170, cursor: 'pointer' }}
            >
              <option value="all">كل الحالات</option>
              <option value="success">مكتمل</option>
              <option value="pending">قيد المعالجة</option>
              <option value="warning">بحاجة مراجعة</option>
            </select>
          </div>
        </section>

        <section
          style={{
            background: T.card,
            borderRadius: 18,
            border: `1px solid ${T.line}`,
            boxShadow: T.shadow,
            overflow: 'hidden',
          }}
        >
          <div
            className="activity-head"
            style={{
              padding: '18px 18px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              borderBottom: `1px solid ${T.line}`,
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: T.primary }}>
                الأنشطة الأخيرة
              </h2>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: T.sub }}>
                عدد النتائج الحالية: {filtered.length}
              </p>
            </div>

            <div
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                background: T.soft,
                color: T.sub,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              تحديث تجريبي
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: T.sub }}>
              لا توجد أنشطة مطابقة للفلاتر الحالية.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filtered.map(item => {
                const status = getStatusMeta(item.status)

                return (
                  <div
                    key={item.id}
                    style={{
                      padding: 18,
                      borderBottom: `1px solid ${T.line}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 22 }}>{getRoleIcon(item.role)}</span>
                        <span style={{ fontSize: 15, fontWeight: 900 }}>{item.user}</span>
                        <span
                          style={{
                            fontSize: 11,
                            padding: '4px 10px',
                            borderRadius: 999,
                            background: 'rgba(192,57,43,0.08)',
                            color: T.primary,
                            fontWeight: 800,
                          }}
                        >
                          {getRoleLabel(item.role)}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: 11,
                          padding: '5px 10px',
                          borderRadius: 10,
                          background: status.bg,
                          color: status.color,
                          fontWeight: 800,
                        }}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div style={{ fontSize: 15, color: T.text, lineHeight: 1.9 }}>
                      <span style={{ fontWeight: 900 }}>{item.action}</span>
                      {' — '}
                      <span style={{ color: T.primary }}>{item.target}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 13, color: T.sub }}>
                        {item.note || 'لا توجد ملاحظات إضافية.'}
                      </div>

                      <div style={{ fontSize: 12, color: T.sub, fontWeight: 700 }}>
                        {item.time}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 12,
  border: '1.5px solid rgba(192,57,43,0.15)',
  background: 'rgba(192,57,43,0.05)',
  color: '#1A1221',
  fontSize: 14,
  fontFamily: 'inherit',
}

const primaryBtn: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 12,
  fontSize: 13,
  fontWeight: 800,
  border: 'none',
  background: 'linear-gradient(135deg,#2563EB,#1D4ED8)',
  color: '#fff',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const ghostBtn: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 12,
  fontSize: 13,
  fontWeight: 800,
  border: '1.5px solid rgba(192,57,43,0.15)',
  background: 'transparent',
  color: '#6B5050',
  cursor: 'pointer',
  fontFamily: 'inherit',
}