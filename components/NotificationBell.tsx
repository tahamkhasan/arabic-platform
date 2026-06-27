'use client'
import { useState, useEffect, useRef } from 'react'
import { BRAND } from '@/lib/constants/theme'

interface Notification {
  id:         string
  type:       string
  title:      string
  body?:      string
  link?:      string
  is_read:    boolean
  created_at: string
}

interface Props {
  userId:     string
  themeColor: string
  textCol:    string
  subCol:     string
  cardBg:     string
  borderCol:  string
  inputBg:    string
  isDark:     boolean
}

const TYPE_ICONS: Record<string, string> = {
  new_assignment:   '📝',
  new_grade:        '🎯',
  new_message:      '💬',
  new_submission:   '📬',
  account_approved: '✅',
}

export default function NotificationBell({
  userId, themeColor, textCol, subCol, cardBg, borderCol, inputBg, isDark
}: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread,        setUnread]        = useState(0)
  const [open,          setOpen]          = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // ── جلب الإشعارات ─────────────────────────────────────────────
  async function fetchNotifications() {
    if (!userId) return
    const res = await fetch(`/api/notifications?userId=${userId}`)
    const data = await res.json()
    setNotifications(data.notifications ?? [])
    setUnread(data.unread ?? 0)
  }

  useEffect(() => {
    if (!userId) return
    fetchNotifications()
    const iv = setInterval(fetchNotifications, 30000) // كل 30 ثانية
    return () => clearInterval(iv)
  }, [userId])

  // ── إغلاق عند النقر خارجاً ────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ── تعليم كمقروء ──────────────────────────────────────────────
  async function markRead(notificationId?: string) {
    if (!userId) return
    await fetch('/api/notifications', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId, notificationId }),
    })
    fetchNotifications()
  }

  function handleOpen() {
    setOpen(o => !o)
    if (!open && unread > 0) {
      // تعليم الكل كمقروء عند الفتح
      setTimeout(() => markRead(), 1500)
    }
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1)  return 'الآن'
    if (mins < 60) return `منذ ${mins} دقيقة`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)  return `منذ ${hrs} ساعة`
    return `منذ ${Math.floor(hrs / 24)} يوم`
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* زر الجرس */}
      <button
        onClick={handleOpen}
        style={{
          position: 'relative',
          padding: '8px 12px', borderRadius: 10,
          border: `1.5px solid ${open ? themeColor + '55' : borderCol}`,
          background: open ? `${themeColor}15` : 'transparent',
          color: open ? themeColor : subCol,
          cursor: 'pointer', fontSize: 18,
          transition: 'all 0.2s',
        }}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            background: BRAND.crimson, color: '#fff',
            width: 16, height: 16, borderRadius: '50%',
            fontSize: 9, fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* قائمة الإشعارات */}
      {open && (
        <div style={{
          position: 'absolute', top: '110%', left: 0,
          width: 340, maxHeight: 480,
          borderRadius: 16, overflow: 'hidden',
          background: isDark ? '#241F1A' : '#fff',
          border: `1.5px solid ${borderCol}`,
          boxShadow: '0 20px 40px rgba(31,18,21,0.35)',
          zIndex: 200,
        }}>
          {/* رأس القائمة */}
          <div style={{
            padding: '14px 16px', borderBottom: `1px solid ${borderCol}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: `${themeColor}10`,
          }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: textCol }}>
              🔔 الإشعارات {unread > 0 && `(${unread} جديد)`}
            </span>
            {unread > 0 && (
              <button onClick={() => markRead()}
                style={{ fontSize: 11, color: themeColor, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>
                تعليم الكل كمقروء
              </button>
            )}
          </div>

          {/* قائمة الإشعارات */}
          <div style={{ overflowY: 'auto', maxHeight: 400 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: subCol }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🔕</div>
                <p style={{ fontSize: 13, margin: 0 }}>لا توجد إشعارات</p>
              </div>
            ) : notifications.map(n => (
              <div
                key={n.id}
                onClick={() => {
                  markRead(n.id)
                  if (n.link) window.location.href = n.link
                }}
                style={{
                  padding: '12px 16px',
                  borderBottom: `1px solid ${borderCol}`,
                  background: n.is_read ? 'transparent' : `${themeColor}08`,
                  cursor: n.link ? 'pointer' : 'default',
                  transition: 'background 0.2s',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}
              >
                {/* أيقونة النوع */}
                <span style={{
                  fontSize: 22, flexShrink: 0,
                  width: 36, height: 36, borderRadius: '50%',
                  background: `${themeColor}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {TYPE_ICONS[n.type] ?? '🔔'}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: n.is_read ? 600 : 800,
                    color: textCol, marginBottom: 3,
                    lineHeight: 1.4,
                  }}>
                    {n.title}
                  </div>
                  {n.body && (
                    <div style={{ fontSize: 12, color: subCol, lineHeight: 1.5, marginBottom: 4 }}>
                      {n.body}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: subCol }}>
                    {timeAgo(n.created_at)}
                  </div>
                </div>

                {/* نقطة غير مقروء */}
                {!n.is_read && (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: themeColor, flexShrink: 0, marginTop: 4,
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
