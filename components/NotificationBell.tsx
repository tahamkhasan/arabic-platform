'use client'

import { useEffect, useRef, useState } from 'react'
import { BRAND } from '@/lib/constants/theme'

interface Notification {
  id: string
  type: string
  title: string
  body?: string | null
  link?: string | null
  is_read: boolean
  created_at: string
}

interface Props {
  userId: string
  themeColor: string
  textCol: string
  subCol: string
  cardBg: string
  borderCol: string
  inputBg: string
  isDark: boolean
}

const TYPE_ICONS: Record<string, string> = {
  new_assignment: '📝',
  new_grade: '🎯',
  new_message: '💬',
  new_submission: '📬',
  account_approved: '✅',
}

export default function NotificationBell({
  userId,
  themeColor,
  textCol,
  subCol,
  cardBg,
  borderCol,
  inputBg,
  isDark,
}: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  async function fetchNotifications() {
    if (!userId) return

    try {
      const res = await fetch(`/api/notifications?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        cache: 'no-store',
      })

      const data = await res.json().catch(() => null)

      if (!mountedRef.current) return

      if (!res.ok) {
        setNotifications([])
        setUnread(0)
        return
      }

      setNotifications(Array.isArray(data?.notifications) ? data.notifications : [])
      setUnread(typeof data?.unread === 'number' ? data.unread : 0)
    } catch {
      if (!mountedRef.current) return
      setNotifications([])
      setUnread(0)
    }
  }

  useEffect(() => {
    if (!userId) return

    void fetchNotifications()

    const iv = setInterval(() => {
      void fetchNotifications()
    }, 30000)

    return () => clearInterval(iv)
  }, [userId])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function markRead(notificationId?: string) {
    if (!userId) return

    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notificationId }),
      })

      if (!res.ok) return
      await fetchNotifications()
    } catch {
      // تجاهل الفشل بصمت حتى لا تنهار الواجهة
    }
  }

  function handleOpen() {
    const nextOpen = !open
    setOpen(nextOpen)

    if (nextOpen && unread > 0) {
      window.setTimeout(() => {
        void markRead()
      }, 1500)
    }
  }

  function timeAgo(dateStr: string): string {
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return 'الآن'

    const diff = Date.now() - date.getTime()
    const mins = Math.floor(diff / 60000)

    if (mins < 1) return 'الآن'
    if (mins < 60) return `منذ ${mins} دقيقة`

    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `منذ ${hrs} ساعة`

    return `منذ ${Math.floor(hrs / 24)} يوم`
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={handleOpen}
        style={{
          position: 'relative',
          padding: '8px 12px',
          borderRadius: 10,
          border: `1.5px solid ${open ? `${themeColor}55` : borderCol}`,
          background: open ? `${themeColor}15` : 'transparent',
          color: open ? themeColor : subCol,
          cursor: 'pointer',
          fontSize: 18,
          transition: 'all 0.2s',
        }}
      >
        🔔
        {unread > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              background: BRAND.crimson,
              color: '#fff',
              minWidth: 16,
              height: 16,
              borderRadius: '50%',
              fontSize: 9,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
            }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '110%',
            left: 0,
            width: 340,
            maxHeight: 480,
            borderRadius: 16,
            overflow: 'hidden',
            background: isDark ? '#241F1A' : '#fff',
            border: `1.5px solid ${borderCol}`,
            boxShadow: '0 20px 40px rgba(31,18,21,0.35)',
            zIndex: 200,
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: `1px solid ${borderCol}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: `${themeColor}10`,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 800, color: textCol }}>
              🔔 الإشعارات {unread > 0 && `(${unread} جديد)`}
            </span>

            {unread > 0 && (
              <button
                type="button"
                onClick={() => void markRead()}
                style={{
                  fontSize: 11,
                  color: themeColor,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                }}
              >
                تعليم الكل كمقروء
              </button>
            )}
          </div>

          <div style={{ overflowY: 'auto', maxHeight: 400 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: subCol }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🔕</div>
                <p style={{ fontSize: 13, margin: 0 }}>لا توجد إشعارات</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    void markRead(n.id)
                    if (n.link) window.location.assign(n.link)
                  }}
                  style={{
                    padding: '12px 16px',
                    borderBottom: `1px solid ${borderCol}`,
                    background: n.is_read ? 'transparent' : `${themeColor}08`,
                    cursor: n.link ? 'pointer' : 'default',
                    transition: 'background 0.2s',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    style={{
                      fontSize: 22,
                      flexShrink: 0,
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: `${themeColor}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {TYPE_ICONS[n.type] ?? '🔔'}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: n.is_read ? 600 : 800,
                        color: textCol,
                        marginBottom: 3,
                        lineHeight: 1.4,
                      }}
                    >
                      {n.title}
                    </div>

                    {n.body && (
                      <div
                        style={{
                          fontSize: 12,
                          color: subCol,
                          lineHeight: 1.5,
                          marginBottom: 4,
                        }}
                      >
                        {n.body}
                      </div>
                    )}

                    <div style={{ fontSize: 10, color: subCol }}>
                      {timeAgo(n.created_at)}
                    </div>
                  </div>

                  {!n.is_read && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: themeColor,
                        flexShrink: 0,
                        marginTop: 4,
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}