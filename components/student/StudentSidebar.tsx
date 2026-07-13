'use client'
import { BRAND } from '@/lib/constants/theme'
import NotificationBell from '@/components/NotificationBell'
import { T } from './studentTheme'
import type { Tab } from '@/types/student.types'

const FIXED_NAV_ACTIVE_COLOR = BRAND.deep
const SIDEBAR_WIDTH = 236
const SIDEBAR_WIDTH_COLLAPSED = 78

interface StudentSidebarProps {
  tab: Tab
  onTabChange: (t: Tab) => void
  pendingCount: number
  unreadCount: number
  sidebarCollapsed: boolean
  onToggleCollapse: () => void
  onLogout: () => void
  onOpenChat: () => void
  userId: string
}

export default function StudentSidebar({
  tab,
  onTabChange,
  pendingCount,
  unreadCount,
  sidebarCollapsed,
  onToggleCollapse,
  onLogout,
  onOpenChat,
  userId,
}: StudentSidebarProps) {
  const TABS = [
    { id: 'home' as Tab, icon: '🏠', label: 'الرئيسية' },
    { id: 'assignments' as Tab, icon: '📝', label: 'مهامي', badge: pendingCount },
    { id: 'lessons' as Tab, icon: '📚', label: 'دروسي' },
    { id: 'practice' as Tab, icon: '✨', label: 'تدرّب' },
    { id: 'messages' as Tab, icon: '💬', label: 'رسائل', badge: unreadCount },
    { id: 'media' as Tab, icon: '🎥', label: 'وسائط' },
  ] as const

  const accentColor = BRAND.deep
  const sidebarWidth = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH

  return (
    <>
      <aside
        className="student-sidebar"
        style={{
          width: sidebarWidth,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          background: T.sidebarBg,
          borderLeft: `1px solid ${T.borderCol}`,
          flexDirection: 'column',
          transition: 'width 0.2s ease',
          zIndex: 40,
        }}
      >
        <div
          style={{
            padding: sidebarCollapsed ? '18px 12px' : '18px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: `1px solid ${T.borderCol}`,
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: T.gradMain,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              boxShadow: T.shadowSoft,
              fontSize: 17,
              fontFamily: T.fontHeading,
              flexShrink: 0,
            }}
          >
            م
          </div>
          {!sidebarCollapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: T.titleCol, fontFamily: T.fontHeading }}>مِداد</div>
              <div style={{ fontSize: 12, color: T.subCol }}>لوحة الطالب</div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
          {TABS.map(item => {
            const active = tab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  padding: sidebarCollapsed ? '12px 8px' : '12px 14px',
                  borderRadius: 14,
                  border: 'none',
                  background: active ? `${FIXED_NAV_ACTIVE_COLOR}10` : 'transparent',
                  color: active ? FIXED_NAV_ACTIVE_COLOR : T.textCol,
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontFamily: T.fontBody,
                  fontSize: 14,
                  position: 'relative',
                  width: '100%',
                  textAlign: 'right',
                }}
              >
                <span style={{ fontSize: 19, position: 'relative', flexShrink: 0 }}>
                  {item.icon}
                  {'badge' in item && item.badge ? (
                    <span
                      style={{
                        position: 'absolute',
                        top: -6,
                        left: -8,
                        minWidth: 16,
                        height: 16,
                        borderRadius: 999,
                        background: BRAND.crimson,
                        color: '#fff',
                        fontSize: 9,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                      }}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </span>
                {!sidebarCollapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                {!sidebarCollapsed && 'badge' in item && item.badge ? (
                  <span
                    style={{
                      minWidth: 20,
                      height: 20,
                      borderRadius: 999,
                      background: BRAND.crimson,
                      color: '#fff',
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 6px',
                    }}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            )
          })}

          <div style={{ height: 1, background: T.borderCol, margin: '8px 6px' }} />

          <button
            onClick={onOpenChat}
            title={sidebarCollapsed ? 'مساعد مِداد' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              padding: sidebarCollapsed ? '12px 8px' : '12px 14px',
              borderRadius: 14,
              border: `1px solid rgba(37,99,235,0.20)`,
              background: 'rgba(37,99,235,0.08)',
              color: T.blue,
              fontWeight: 900,
              cursor: 'pointer',
              fontFamily: T.fontBody,
              fontSize: 14,
              width: '100%',
              textAlign: 'right',
            }}
          >
            <span style={{ fontSize: 19, flexShrink: 0 }}>🤖</span>
            {!sidebarCollapsed && <span style={{ flex: 1 }}>مساعد مِداد</span>}
          </button>
        </nav>

        <div style={{ padding: '12px 10px', borderTop: `1px solid ${T.borderCol}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={onToggleCollapse}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px',
              borderRadius: 12,
              border: `1px solid ${T.borderCol}`,
              background: 'transparent',
              color: T.subCol,
              cursor: 'pointer',
              fontFamily: T.fontBody,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {sidebarCollapsed ? '»' : '« طيّ القائمة'}
          </button>

          {!sidebarCollapsed && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <NotificationBell
                userId={userId}
                themeColor={accentColor}
                textCol={T.textCol}
                subCol={T.subCol}
                cardBg={T.cardBg}
                borderCol={T.borderCol}
                inputBg={T.inputBg}
                isDark={false}
              />
            </div>
          )}

          <button
            onClick={onLogout}
            title="خروج"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px',
              borderRadius: 12,
              border: '1px solid rgba(252,149,149,0.4)',
              background: 'rgba(252,149,149,0.10)',
              color: '#fc8181',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: T.fontBody,
              fontSize: 13,
            }}
          >
            🚪 {!sidebarCollapsed && 'خروج'}
          </button>
        </div>
      </aside>

      <header
        className="student-topbar-mobile"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: T.headerBg,
          backdropFilter: 'blur(18px)',
          borderBottom: `1px solid ${T.borderCol}`,
          padding: '12px 16px',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: T.gradMain,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 15,
            }}
          >
            م
          </div>
          <div style={{ fontSize: 15, fontWeight: 900, color: T.titleCol, fontFamily: T.fontHeading }}>مِداد</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NotificationBell
            userId={userId}
            themeColor={accentColor}
            textCol={T.textCol}
            subCol={T.subCol}
            cardBg={T.cardBg}
            borderCol={T.borderCol}
            inputBg={T.inputBg}
            isDark={false}
          />
          <button
            onClick={onLogout}
            style={{
              padding: '8px 12px',
              borderRadius: 12,
              border: '1px solid rgba(252,149,149,0.4)',
              background: 'rgba(252,149,149,0.10)',
              color: '#fc8181',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: T.fontBody,
              fontSize: 13,
            }}
          >
            🚪
          </button>
        </div>
      </header>

      <nav
        className="student-bottom-nav"
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
        {TABS.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
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
              color: tab === item.id ? FIXED_NAV_ACTIVE_COLOR : T.subCol,
              position: 'relative',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 11, fontWeight: tab === item.id ? 900 : 600 }}>{item.label}</span>

            {'badge' in item && item.badge ? (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 2,
                  background: BRAND.crimson,
                  color: '#fff',
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                  borderRadius: '50%',
                  fontSize: 9,
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}

        <button
          onClick={onOpenChat}
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
            color: T.blue,
          }}
        >
          <span style={{ fontSize: 20 }}>🤖</span>
          <span style={{ fontSize: 11, fontWeight: 600 }}>مساعد</span>
        </button>
      </nav>
    </>
  )
}