'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { BRAND } from '@/lib/constants/theme'

// ---- أنواع البيانات ----
interface ChildSummary {
  id: string
  full_name: string
  grade: string
  relation: string
  relation_label: string
  avg_score: number | null
  quizzes_completed: number
  assignments_submitted: number
  assignments_graded: number
  achievements_count: number
  last_activity: string | null
  status: string
  streak: number
}

interface ChildDetail {
  child: ChildSummary
  period_days: number
  quiz_stats: {
    total_attempts: number
    avg_score: number
    highest_score: number
    lowest_score: number
  }
  assignment_stats: {
    total_submitted: number
    total_graded: number
    avg_score: number
    pending_grading: number
  }
  recent_quizzes: Array<{
    id: string
    title: string
    score: number
    date: string
    time_spent: number | null
  }>
  recent_assignments: Array<{
    id: string
    title: string
    type: string
    score: number | null
    feedback: string | null
    submitted_at: string
    graded_at: string | null
    due_date: string | null
    is_late: boolean
  }>
  achievements: Array<{
    code: string
    title: string
    icon: string
    earned_at: string
  }>
  achievements_count: number
  streak: number
  weak_points: Array<{ summary: string; date: string; question_type?: string; total_attempts?: number }>
  recommendation: string
}

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  is_for_child: boolean
  child_name: string | null
  child_id: string | null
  read: boolean
  created_at: string
}

// ---- ثيم الألوان ----
const T = {
  bg: '#F7F2EA',
  cardBg: '#FFFFFF',
  headerBg: 'rgba(247,242,234,0.95)',
  textCol: '#1a1a1a',
  subCol: '#6B2800',
  mutedCol: '#9CA3AF',
  borderCol: '#E5E5E5',
  primary: '#C32D2D',
  primarySoft: 'rgba(140, 20, 40, 0.06)',
  primaryDeep: '#780F1E',
  green: '#059669',
  greenSoft: 'rgba(5, 150, 105, 8%)',
  red: '#DC2626',
  redSoft: 'rgba(220, 38, 38, 8%)',
  yellow: '#D97706',
  yellowSoft: 'rgba(217, 119, 6, 8%)',
  blue: '#2563EB',
  blueSoft: 'rgba(37, 99, 235, 6%)',
  purple: '#7C3AED',
  purpleSoft: 'rgba(124, 58, 237, 6%)',
  orange: '#EA580C',
  orangeSoft: 'rgba(234, 88, 12, 8%)',
  inputBg: '#F9FAFB',
  inputBorder: '#D1D5DB',
}

// ---- دالة النسبة ----
function ScoreBar({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const height = size === 'sm' ? 6 : size === 'md' ? 10 : 14
  const color =
    score >= 80 ? T.green : score >= 60 ? T.blue : score >= 40 ? T.yellow : T.red

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1,
        height,
        background: '#F3F4F6',
        borderRadius: height / 2,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.max(score, 0)}%`,
          background: color,
          borderRadius: height / 2,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <span style={{
        fontSize: size === 'sm' ? 12 : 14,
        fontWeight: 700,
        color,
        minWidth: size === 'sm' ? 28 : 36,
        textAlign: 'center',
      }}>
        {score !== null ? `${score}%` : '—'}
      </span>
    </div>
  )
}

// ---- بطاقة إحصائية ----
function StatCard({ icon, label, value, color, bgColor }: {
  icon: string
  label: string
  value: string | number
  color: string
  bgColor?: string
}) {
  return (
    <div style={{
      background: bgColor || 'transparent',
      border: bgColor ? 'none' : '1px solid #E5E5E5',
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
      </div>
    </div>
  )
}

// ---- بطاقة طالب ----
function ChildCard({ child, isSelected, onClick }: {
  child: ChildSummary
  isSelected: boolean
  onClick: (id: string) => void
}) {
  const scoreColor = child.avg_score === null ? T.mutedCol
    : child.avg_score >= 80 ? T.green
    : child.avg_score >= 60 ? T.blue
    : child.avg_score >= 40 ? T.yellow
    : T.red

  return (
    <button
      onClick={() => onClick(child.id)}
      style={{
        width: '100%',
        background: isSelected ? T.blueSoft : T.cardBg,
        border: isSelected
          ? '2px solid ' + T.blue
          : '1px solid ' + T.borderCol,
        borderRadius: 12,
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        textAlign: 'right',
        fontFamily: 'Cairo, sans-serif',
        color: T.textCol,
      }}
    >
      {/* الهيدر */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: scoreColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 18,
          fontWeight: 700,
        }}>
            {child.full_name.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 700,
              fontSize: 15,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {child.full_name}
            </div>
            <div style={{
              fontSize: 12,
              color: T.mutedCol,
              display: 'flex',
              gap: 8,
            }}>
              {child.grade && <span>{child.grade} •</span>}
              {child.relation_label && <span>{child.relation_label} •</span>}
              {child.status === 'pending' && (
                <span style={{
                background: T.yellowSoft,
                color: T.yellow,
                padding: '1px 8px',
                borderRadius: 4,
                fontSize: 11,
              }}>
                بانتظار الموافقة
              </span>
            )}
            </div>
          </div>
        </div>

      {/* الإحصائيات */}
      <div style={{
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        marginTop: 4,
      }}>
        {child.avg_score !== null && (
          <div style={{
            background: `${scoreColor}15`,
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: 12,
            fontWeight: 600,
            color: scoreColor,
          }}>
            {child.avg_score}%
          </div>
        )}
        {child.quizzes_completed > 0 && (
          <div style={{
            background: T.blueSoft,
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: 12,
            fontWeight: 600,
            color: T.blue,
          }}>
            📝 {child.quizzes_completed} اختبار
          </div>
        )}
        {child.achievements_count > 0 && (
          <div style={{
            background: T.purpleSoft,
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: 12,
            fontWeight: 600,
            color: T.purple,
          }}>
            🏆 {child.achievements_count} إنجاز
          </div>
        )}
        {child.streak > 0 && (
          <div style={{
            background: T.orangeSoft,
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: 12,
            fontWeight: 600,
            color: T.orange,
          }}>
            🔥 {child.streak} أيام متتالية
          </div>
        )}
      </div>

      {/* آخر نشاط */}
      {child.last_activity && (
        <div style={{
          fontSize: 12,
          color: T.mutedCol,
          marginTop: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
        <span>آخر نشاط: {new Date(child.last_activity).toLocaleDateString('ar-KW', { day: 'numeric', month: 'long' })}</span>
        </div>
      )}
    </button>
  )
}

// ---- بطاقة إنجاز ----
function AchievementBadge({ achievement }: { achievement: { code: string; title: string; icon: string; earned_at: string } }) {
  return (
    <div style={{
    background: T.purpleSoft,
    border: '1px solid ' + T.purple,
    borderRadius: 8,
    padding: '6px 10px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  }}>
      <span style={{ fontSize: 16 }}>{achievement.icon}</span>
      <div>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: T.purple,
          lineHeight: 1.3,
        }}>
          {achievement.title}
        </div>
        <div style={{
          fontSize: 11,
          color: T.mutedCol,
        }}>
          {new Date(achievement.earned_at).toLocaleDateString('ar-KW', { day: 'numeric', month: 'short' })}
        </div>
      </div>
    </div>
  )
}

// ---- سطر إشعار ----
function NotificationItem({ notif, onSelect }: {
  notif: Notification
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        width: '100%',
        background: notif.read ? 'transparent' : T.cardBg,
        border: '1px solid ' + (notif.is_for_child && notif.child_name
          ? (notif.is_for_child ? T.blueSoft : T.greenSoft) : 'transparent'),
        borderRadius: 10,
        padding: '12px 16px',
        cursor: 'pointer',
        fontFamily: 'Cairo, sans-serif',
        color: T.textCol,
        textAlign: 'right',
        transition: 'background 0.15s',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: notif.body ? 4 : 0,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 600,
            fontSize: 14,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {notif.title}
          </div>
          {notif.is_for_child && notif.child_name && (
            <span style={{
              fontSize: 11,
              background: T.blueSoft,
              color: T.blue,
              padding: '1px 8px',
              borderRadius: 4,
              flexShrink: 0,
            }}>
              {notif.child_name}
            </span>
          )}
        </div>
        {!notif.read && (
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: T.blue,
            flexShrink: 0,
          }} />
        )}
      </div>
      {notif.body && (
        <div style={{
          fontSize: 13,
          color: T.subCol,
          lineHeight: 1.6,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          margin: '0 0 0 32px',
        }}>
          {notif.body}
        </div>
      )}
      <div style={{
        fontSize: 11,
        color: T.mutedCol,
        marginTop: 4,
      }}>
        {new Date(notif.created_at).toLocaleDateString('ar-KW', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </button>
  )
}

// ===== المحتوى الرئيسي =====
function ParentContent() {
  const router = useRouter()
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [children, setChildren] = useState<ChildSummary[]>([])
  const [childDetail, setChildDetail] = useState<ChildDetail | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'detail' | 'notifications'>('overview')
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkChildId, setLinkChildId] = useState('')
  const [linkRelation, setLinkRelation] = useState<'father' | 'mother' | 'guarder'>('father')
  const [linkError, setLinkError] = useState('')

  const getToken = () => {
    try {
      const u = localStorage.getItem('user')
      if (!u) return null
      return JSON.parse(u)?.token || null
    } catch { return null }
  }

  // جلب الأبناء
  useEffect(() => {
    const token = getToken()
    if (!token) return

    fetch('/api/parent/children', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setChildren(data.data.children || [])
        }
      })
      .catch(err => console.error('Error fetching children:', err))
  }, [getToken])

  // جلب تفاصيل الطالب عند اختياره
  useEffect(() => {
    if (!selectedChildId || !getToken()) {
      setChildDetail(null)
      return
    }

    fetch(`/api/parent/child/${selectedChildId}?period=30`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) setChildDetail(data.data)
      })
      .catch(err => console.error('Error fetching child detail:', err))
  }, [selectedChildId, getToken])

  // جلب الإشعارات
  useEffect(() => {
    const token = getToken()
    if (!token) return

    fetch('/api/parent/notifications', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setNotifications(data.data.items || [])
        }
      })
      .catch(err => console.error('Error fetching notifications:', err))
  }, [getToken])

  // اختيار طالب
  const selectChild = (id: string) => {
    setSelectedChildId(id)
    setActiveTab('detail')
  }

  // ربط ابن جديد
  const handleLinkSubmit = async () => {
    const token = getToken()
    if (!token || !linkChildId) return

    setLinkError('')

    try {
      const res = await fetch('/api/parent/children', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          child_id: linkChildId,
          relation: linkRelation,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'فشل الربط')

      if (data.success) {
        setLinkError('')
        setShowLinkModal(false)
        // أعد جلب الأبناء
        const listRes = await fetch('/api/parent/children', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const listData = await listRes.json()
        if (listData.success) {
          setChildren(listData.data.children || [])
        }
      } else {
        setLinkError(data.error || 'فشل الربط')
      }
    } catch (err: any) {
      setLinkError(err.message || 'حدث خطأ غير متوقع')
    }
  }

  // تعليم الكل كمقروءة
  const markAllRead = async () => {
    const token = getToken()
    if (!token) return

    const body = selectedChildId
      ? { mark_all_read: true, child_id: selectedChildId }
      : { mark_all_read: true }

    await fetch('/api/parent/notifications', {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  // تعليم إشعار واحد
  const markOneRead = async (notifId: string) => {
    const token = getToken()
    if (!token) return

    await fetch('/api/parent/notifications', {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notification_id: notifId }),
    })
  }

  // حالة: لا يوجد أبناء
  const hasChildren = children.length > 0

  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      fontFamily: 'Cairo, sans-serif',
      color: T.textCol,
      direction: 'rtl',
    }}>
      {/* الهيدر */}
      <div style={{
        background: T.headerBg,
        borderBottom: '1px solid ' + T.borderCol,
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{
            fontSize: 20,
          }}>
            👨
          </span>
          <h1 style={{
            fontSize: 18,
            fontWeight:  700,
            color: T.primaryDeep,
            margin: 0,
          }}>
            بوابة ولي الأمر
          </h1>
        </div>
        <button
          onClick={() => setShowLinkModal(true)}
          style={{
            background: T.primary,
            'color': '#fff',
            'border': 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontFamily: 'Cairo, sans-serif',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + ربط ابن
        </button>
      </div>

      <div style={{
        display: 'flex',
        flex: 1,
        minHeight: 'calc(100vh - 57px)',
      }}>
        {/* ===== الشريط الجانبي (سطح المكتب) ===== */}
        <div style={{
          width: 320,
          background: T.cardBg,
          borderLeft: '1px solid ' + T.borderCol,
          overflowY: 'auto',
          height: 'calc(100vh - 57px)',
          flexShrink: 0,
        }}>
          {/* تابوع الأبناء */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid ' + T.borderCol,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontWeight: 700, color: T.textCol }}>
              أبنائي ({children.length})
            </span>
            <span style={{
              fontSize: 13,
              color: T.mutedCol,
            }}>
              {children.reduce((c, ch) => c + (ch.achievements_count || 0), 0)} إنجاز
            </span>
          </div>

          {/* قائمة الأبناء */}
          <div style={{ padding: '8px' }}>
            {hasChildren ? (
              children.map(child => (
                <ChildCard
                  key={child.id}
                  child={child}
                  isSelected={selectedChildId === child.id}
                  onClick={selectChild}
                />
              ))
            ) : (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: T.mutedCol,
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍👦</div>
                <p style={{ fontSize: 15 }}>لا يوجد أبناء مربوطين بعد</p>
                <p style={{ fontSize: 13, color: T.mutedCol }}>
                  اضغط "ربط ابن" لإضافة طالب
                </p>
              </div>)}
          </div>

          {/* تبويبات الشريط الجانبي */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid ' + T.borderCol,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}>
            {[
              { id: 'overview', label: 'نظرة عامة', icon: '📊' },
              { id: 'detail', label: 'تفاصيل الابن', icon: '📋' },
              { id: 'notifications', label: 'الإشعارات', icon: '🔔' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any)
                  if (tab.id === 'detail' && !selectedChildId) {
                    setActiveTab('overview')
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: activeTab === tab.id ? T.primarySoft : 'transparent',
                  color: activeTab === tab.id ? T.primaryDeep : T.mutedCol,
                  fontFamily: 'Cairo, sans-serif',
                  fontSize: 14,
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  flex: 1,
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'notifications' && notifications.filter(n => !n.read).length > 0 && (
                  <span style={{
                    background: T.red,
                    color: '#fff',
                    borderRadius: '50%',
                    width: 18,
                    height: 18,
                    fontSize: 11,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ===== منطقة المحتوى ===== */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 24,
          minWidth: 0,
        }}>
          {/* ===== تبويب "نظرة عامة" ===== */}
          {activeTab === 'overview' && (
            <>
              {/* بطاقات الإحصائيات */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
                marginBottom: 32,
              }}>
                {children.map(child => (
                  <div
                    key={child.id}
                    onClick={() => selectChild(child.id)}
                    style={{
                      background: selectedChildId === child.id ? T.blueSoft : T.cardBg,
                      border: '1px solid ' + (selectedChildId === child.id ? T.blue : T.borderCol),
                      borderRadius: 12,
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'Cairo, sans-serif',
                      color: T.textCol,
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 12,
                    }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: child.avg_score === null
                          ? T.mutedCol
                          : child.avg_score >= 80 ? T.green
                          : child.avg_score >= 60 ? T.blue
                          : child.avg_score >= 40 ? T.yellow
                          : T.red,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 16,
                        fontWeight: 700,
                      }}>
                        {child.full_name.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 700,
                          fontSize: 15,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {child.full_name}
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: T.mutedCol,
                          display: 'flex',
                          gap: 8,
                        }}>
                          {child.grade && <span>{child.grade} • </span>}
                          {child.relation_label && <span>{child.relation_label} • </span>}
                        </div>
                      </div>
                    </div>

                    {/* إحصائيات سريعة */}
                    <div style={{
                      display: 'flex',
                      gap: 6,
                      flexWrap: 'wrap',
                      marginTop: 4,
                    }}>
                      {child.avg_score !== null && (
                        <div style={{
                          background: `${child.avg_score >= 80 ? T.greenSoft : child.avg_score >= 60 ? T.blueSoft : child.avg_score >= 40 ? T.yellowSoft : T.redSoft}`,
                            borderRadius: 6,
                          padding: '2px 8px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: child.avg_score >= 80 ? T.green : child.avg_score >= 60 ? T.blue : child.avg_score >= 40 ? T.yellow : T.red,
                        }}>
                          {child.avg_score}%
                        </div>
                      )}
                      {child.quizzes_completed > 0 && (
                        <div style={{
                          background: T.blueSoft,
                          borderRadius: 6,
                          padding: '2px 8px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: T.blue,
                        }}>
                          📝 {child.quizzes_completed} اختبار
                        </div>
                      )}
                      {child.achievements_count > 0 && (
                        <div style={{
                          background: T.purpleSoft,
                          borderRadius: 6,
                          padding: '2px 8px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: T.purple,
                        }}>
                          🏆 {child.achievements_count}
                        </div>
                      )}
                      {child.streak > 0 && (
                        <div style={{
                          background: T.orangeSoft,
                          borderRadius: 6,
                          padding: '2px 8px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: T.orange,
                        }}>
                          🔥 {child.streak} يوم
                        </div>
                      )}
                    </div>

                    {/* آخر نشاط */}
                    {child.last_activity && (
                      <div style={{
                        fontSize: 12,
                        color: T.mutedCol,
                        marginTop: 8,
                      }}>
                        آخر نشاط: {new Date(child.last_activity).toLocaleDateString('ar-KW', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {/* رسالة تحذكير إن لم يوجد أبناء */}
                {!hasChildren && (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                  }}>
                    <div style={{
                      fontSize: 64,
                      marginBottom: 16,
                    }}>👨‍👦</div>
                    <p style={{ fontSize: 16, color: T.subCol, margin: 0 }}>
                      لا يوجد أبناء مربوطين بعد
                    </p>
                    <p style={{ fontSize: 14, color: T.mutedCol, marginTop: 8 }}>
                      اضغط "ربط ابن" لإضافة طالب بحساب اسمه أو برقم هويته
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ===== تبويب "تفصيل الابن" ===== */}
          {activeTab === 'detail' && childDetail && (
            <>
              {/* زر "رجوع لقائمة الأبناء" */}
              <button
                onClick={() => {
                  setSelectedChildId(null)
                  setActiveTab('overview')
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: T.blue,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontFamily: 'Cairo, sans-serif',
                  marginBottom: 20,
                }}>
                ← رجوع لقائمة الأبناء
              </button>

              {/* بطاقة الابن */}
              <div style={{
                background: T.cardBg,
                border: '1px solid ' + T.borderCol,
                borderRadius: 16,
                padding: '24px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                marginBottom: 24,
              }}>
                {/* هيدر الطالب */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  marginBottom: 24,
                  paddingBottom: 20,
                  borderBottom: '1px solid ' + T.borderCol,
                }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: childDetail.child.avg_score === null
                      ? T.mutedCol
                      : childDetail.child.avg_score >= 80 ? T.green
                      : childDetail.child.avg_score >= 60 ? T.blue
                      : childDetail.child.avg_score >= 40 ? T.yellow
                      : T.red,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 24,
                    fontWeight: 700,
                  }}>
                    {childDetail.child.full_name.charAt(0)}
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: T.textCol,
                      margin: 0,
                      lineHeight: 1.3,
                    }}>
                      {childDetail.child.full_name}
                    </h2>
                    <div style={{
                      fontSize: 14,
                      color: T.subCol,
                      marginTop: 4,
                      display: 'flex',
                      gap: 12,
                    }}>
                      {childDetail.child.grade && (
                        <span>{childDetail.child.grade} •</span>
                      )}
                      {childDetail.child.relation_label && (
                        <span>{childDetail.child.relation_label} •</span>
                      )}
                      {childDetail.child.status === 'pending' && (
                        <span style={{
                          background: T.yellowSoft,
                          color: T.yellow,
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                        }}>
                          ⏳ بانتظار موافقة
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* الإحصائيات الاختبارات */}
                <div style={{
                  background: T.cardBg,
                }}>
                  <h3 style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: T.textCol,
                    marginBottom: 16,
                    paddingBottom: 12,
                    borderBottom: '1px solid ' + T.borderCol,
                  }}>
                    📝 أداء الاختبارات
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 12,
                    marginBottom: 24,
                  }}>
                    <StatCard
                      icon="📊"
                      label="المحاولات"
                      value={childDetail.quiz_stats.total_attempts}
                      color={T.blue}
                      bgColor={T.blueSoft}
                    />
                    <StatCard
                      icon="💯"
                      label="المتوسط العام"
                      value={childDetail.quiz_stats.avg_score !== null ? `${childDetail.quiz_stats.avg_score}%` : '—'}
                      color={childDetail.quiz_stats.avg_score !== null
                        ? (childDetail.quiz_stats.avg_score >= 80 ? T.green
                          : childDetail.quiz_stats.avg_score >= 60 ? T.blue
                          : T.mutedCol)
                        : T.mutedCol}
                      bgColor={childDetail.quiz_stats.avg_score !== null
                        ? (childDetail.quiz_stats.avg_score >= 80 ? T.greenSoft
                          : childDetail.quiz_stats.avg_score >= 60 ? T.blueSoft
                          : T.yellowSoft)
                        : undefined}
                    />
                  </div>

                  {/* أعلى وأدنى وأقل درجة */}
                  <div style={{
                    display: 'flex',
                    gap: 16,
                    marginBottom: 24,
                    padding: '16px 20px',
                    background: T.cardBg,
                    border: '1px solid ' + T.borderCol,
                    borderRadius: 12,
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: T.textCol,
                        marginBottom: 12,
                      }}>
                        📈 أعلى وأدنى درجات
                      </h3>
                      <p style={{
                        fontSize: 14,
                        color: T.subCol,
                        margin: 0,
                        lineHeight: 1.7,
                        marginBottom: 16,
                      }}>
                        {childDetail.quiz_stats.highest_score !== undefined
                          ? `أعلى درجة: ${childDetail.quiz_stats.highest_score}%`
                          : ''}
                      </p>
                    </div>
                    <div style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: T.red,
                      }}>
                      {childDetail.quiz_stats.lowest_score !== undefined
                        ? `أدنى درجة: ${childDetail.quiz_stats.lowest_score}%`
                        : ''}
                    </div>
                  </div>

                  {/* آخر الاختبارات */}
                  <div style={{
                    background: 'linear-gradient(to left, #780F1E, #C32D2D, #D2692E)',
                    borderRadius: 12,
                    padding: '20px',
                    marginBottom: 24,
                  }}>
                    <h3 style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: '#FFFFFF',
                    }}>
                      📋 آخر الاختبارات
                    </h3>
                    {(childDetail.recent_quizzes || []).length === 0 ? (
                      <p style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: 14,
                        textAlign: 'center',
                        padding: '40px 0',
                      }}>لا توجد اختبارات بعد</p>
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}>
                        {childDetail.recent_quizzes.map((q, i) => (
                          <div
                            key={q.id}
                            style={{
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 10,
                              padding: '12px 16px',
                              fontFamily: 'Cairo, sans-serif',
                              fontSize: 14,
                              color: '#FFFFFF',
                              lineHeight: 1.6,
                            }}
                          >
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: 8,
                            }}>
                              <div>
                                <div style={{ fontWeight: 600 }}>{q.title || 'اختبار بدون عنوان'}</div>
                                <div style={{
                                  fontSize: 13,
                                  color: 'rgba(255,255,255,0.6)',
                                }}>
                                  {q.date ? new Date(q.date).toLocaleDateString('ar-KW', {
                                    day: 'numeric',
                                    month: 'short',
                                  }) : ''}
                                </div>
                              </div>
                              <div style={{
                                fontSize: 24,
                                fontWeight: 700,
                                color: q.score >= 80 ? '#4ADE80' : q.score >= 60 ? '#2563EB' : q.score >= 40 ? '#F59E0B' : '#EF4444',
                              }}>
                                {q.score !== null ? `${q.score}%` : '—'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                  {/* المهام */}
                  <div style={{
                    background: 'linear-gradient(to left, #780F1E, #C32D2D, #D2692E)',
                    borderRadius: 12,
                    padding: '20px',
                    marginBottom: 24,
                  }}>
                    <h3 style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#FFFFFF',
                    }}>
                      📝 المهام والتسليمات
                    </h3>
                    <div style={{
                    display: 'flex',
                    gap: 16,
                    marginBottom: 16,
                  }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#FFFFFF',
                        marginBottom: 8,
                      }}>
                        التسليمات: {childDetail.assignment_stats.total_submitted}
                      </h4>
                      <p style={{
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.6)',
                        margin: 0,
                        lineHeight: 1.7,
                        marginBottom: 12,
                      }}>
                        {childDetail.assignment_stats.avg_score !== null
                          ? `المتوسط الدرجات: ${childDetail.assignment_stats.avg_score}%`
                          : 'لم تُسلَّم مهام بعد'}
                      </p>
                    </div>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#FCD34D',
                    }}>
                      {childDetail.assignment_stats.pending_grading > 0 && (
                        <span>⚠️ {childDetail.assignment_stats.pending_grading} بانتظار تصحيح</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* الإنجازات */}
                {childDetail.achievements_count > 0 && (
                  <div style={{
                    background: T.cardBg,
                    border: '1px solid ' + T.borderCol,
                    borderRadius: 12,
                    padding: '20px',
                    marginBottom: 24,
                  }}>
                    <h3 style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: T.textCol,
                      marginBottom: 16,
                      paddingBottom: 12,
                      borderBottom: '1px solid ' + T.borderCol,
                    }}>
                      🏆 الإنجازات ({childDetail.achievements_count})
                    </h3>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}>
                      {childDetail.achievements.map((a, i) => (
                        <AchievementBadge key={a.code} achievement={a} />
                      ))}
                    </div>
                  </div>
                )}

                {/* نقاط الضعف */}
                {childDetail.weak_points && childDetail.weak_points.length > 0 && (
                  <div style={{
                    background: T.redSoft,
                    border: '1px solid #FECACA',
                    borderRadius: 12,
                    padding: '20px',
                    marginBottom: 24,
                  }}>
                    <h3 style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: T.red,
                      marginBottom: 16,
                    }}>
                      ⚠️ نقاط ضعفف يحتاج تركيز
                    </h3>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}>
                      {childDetail.weak_points.map((wp, i) => (
                        <div
                          key={i}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid ' + T.borderCol,
                            borderRadius: 8,
                            padding: '10px 14px',
                            fontSize: 13,
                            color: T.textCol,
                            lineHeight: 1.6,
                          }}
                        >
                          <div style={{
                            fontWeight: 600,
                            marginBottom: 4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            direction: 'rtl',
                          }}>
                            {wp.summary}
                          </div>
                          <div style={{
                            fontSize: 12,
                            color: T.mutedCol,
                            display: 'flex',
                            gap: 16,
                          }}>
                            <span>نوع الخطأ: {wp.question_type}</span>
                            <span>محاولات: {wp.total_attempts}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* التوصية */}
                {childDetail.recommendation && (
                  <div style={{
                    background: T.blueSoft,
                    border: '1px solid ' + T.blue,
                    borderRadius: 12,
                    padding: '16px 20px',
                    marginBottom: 24,
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}>
                    <span style={{
                      fontSize: 20,
                      flexShrink: 0,
                    }}>💡</span>
                    <div>
                      <h4 style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: T.textCol,
                        marginBottom: 4,
                      }}>
                        توصية ذكية
                      </h4>
                      <p style={{
                        fontSize: 14,
                        color: T.subCol,
                        margin: 0,
                        lineHeight: 1.7,
                      }}>
                        {childDetail.recommendation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ===== تبويب "الإشعارات" ===== */}
          {activeTab === 'notifications' && (
            <div style={{
            background: T.cardBg,
            border: '1px solid ' + T.borderCol,
            borderRadius: 12,
            padding: '20px',
            marginBottom: 24,
          }}>
              <h3 style={{
                fontSize: 16,
                fontWeight: 700,
                color: T.textCol,
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: '1px solid ' + T.borderCol,
              }}>
                🔔 الإشعارات
                {notifications.filter(n => !n.read).length > 0 && (
                  <div style={{
                    background: T.redSoft,
                    border: '1px solid #FECACA',
                    borderRadius: 8,
                    padding: '8px 12px',
                    marginBottom: 12,
                    fontSize: 13,
                    color: T.red,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    {notifications.filter(n => !n.read).length} إشعار جديد
                  </div>
                )}
              </h3>

              {notifications.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: T.mutedCol,
                }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
                  <p style={{ fontSize: 14 }}>لا توجد إشعارات</p>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  {notifications.map(notif => (
                    <NotificationItem
                      key={notif.id}
                      notif={notif}
                      onSelect={() => markOneRead(notif.id)}
                    />
                  ))}
                </div>
              )}

              {/* زر "تعليم الكل كمقروء" */}
              {notifications.some(n => !n.read) && (
                <button
                  onClick={markAllRead}
                  style={{
                    background: 'transparent',
                    border: '1px solid ' + T.borderCol,
                    borderRadius: 8,
                    padding: '10px 20px',
                    fontFamily: 'Cairo, sans-serif',
                    fontSize: 14,
                    color: T.textCol,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    alignSelf: 'flex-start',
                  }}
                >
                  تعليم الكل كمقروء
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* مودال ربط ابن جديد */}
      {showLinkModal && (
        <div
          onClick={(e) => {
            if (e.target !== e.currentTarget) return
            setShowLinkModal(false)
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{
            background: T.cardBg,
            borderRadius: 16,
            padding: '32px',
            width: 420,
            maxWidth: '90vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}>
            <h2 style={{
              fontSize: 20,
              fontWeight: 700,
              color: T.primaryDeep,
              marginBottom: 20,
              textAlign: 'center',
            }}>
              ربط ابن جديد
            </h2>

            {/* إدخال رقم الهوية أو الاسم */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: T.textCol,
                marginBottom: 6,
              }}>
                رقم الهوية (UUID)
              </label>
              <input
                type="text"
                placeholder="أدخل رقم الهوية أو الاسم لبحث عن الطالب..."
                value={linkChildId}
                onChange={(e) => { setLinkChildId(e.target.value); setLinkError('') }}
                style={{
                  width: '100%',
                  background: T.inputBg,
                  border: '1px solid ' + T.inputBorder,
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontFamily: 'Cairo, sans-serif',
                  fontSize: 15,
                  color: T.textCol,
                  outline: 'none',
                  direction: 'rtl',
                }}
              />
            </div>

            {/* اختيار صلة القرابة */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: T.textCol,
                marginBottom: 6,
              }}>
                صلة القرابة
              </label>
              <select
                value={linkRelation}
                onChange={(e) => setLinkRelation(e.target.value as any)}
                style={{
                  width: '100%',
                  background: T.inputBg,
                  border: '1px solid ' + T.inputBorder,
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontFamily: 'Cairo, sans-serif',
                  fontSize: 15,
                  color: T.textCol,
                  outline: 'none',
                  direction: 'rtl',
                  cursor: 'pointer',
                }}
              >
                <option value="father">الأب</option>
                <option value="mother">الأم</option>
                <option value="guardian">وصي شرعي</option>
              </select>
            </div>

            {/* رسالة الخطأ */}
            {linkError && (
              <div style={{
                background: T.redSoft,
                border: '1px solid #FECACA',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 16,
                fontSize: 14,
                color: T.red,
                textAlign: 'center',
                fontFamily: 'Cairo, sans-serif',
              }}>
                {linkError}
              </div>
            )}

            {/* أزرار الإلغاء */}
            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end',
              marginTop: 8,
            }}>
              <button
                onClick={() => {
                  setLinkError('')
                  setShowLinkModal(false)
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid ' + T.borderCol,
                  borderRadius: 8,
                  padding: '10px 24px',
                  fontFamily: 'Cairo, sans-serif',
                  fontSize: 14,
                  fontWeight: 600,
                  color: T.mutedCol,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                إلغاء
              </button>
              <button
                onClick={handleLinkSubmit}
                style={{
                  background: T.primary,
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 24px',
                  fontFamily: 'Cairo, sans-serif',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                ربط
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ===== الصفحة مع Suspense =====
export default function ParentPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: '#F7F2EA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Cairo, sans-serif',
        color: '#6B7280',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👨‍👦</div>
        <p style={{ fontSize: 16 }}>جارٍ تحميل بوابة ولي الأمر...</p>
      </div>
    }>
      <ParentContent />
    </Suspense>
  )
}