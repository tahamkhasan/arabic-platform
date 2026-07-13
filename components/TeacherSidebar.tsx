'use client'

import { BRAND } from '@/lib/constants/theme'
import NotificationBell from '@/components/NotificationBell'

const SIDEBAR_WIDTH = 240
const SIDEBAR_WIDTH_COLLAPSED = 78

interface TeacherSidebarProps {
  tabs: any[]
  tab: string
  isHome: boolean
  onSelectHome: () => void
  onTabChange: (id: any) => void
  sidebarCollapsed: boolean
  onToggleCollapse: () => void
  onGoQuizBank: () => void
  ui: any
  userId: string
}

export function TeacherSidebar({
  tabs,
  tab,
  isHome,
  onSelectHome,
  onTabChange,
  sidebarCollapsed,
  onToggleCollapse,
  onGoQuizBank,
  ui,
  userId,
}: TeacherSidebarProps) {
  const sidebarWidth = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH

  const NAV_ITEMS: any[] = [{ id: '__home__', icon: '🏠', label: 'الرئيسية' }, ...tabs]

  return (
    <>
      <aside
        className="teacher-sidebar"
        style={{
          width: sidebarWidth,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          background: ui.panelStrong,
          borderLeft: `1px solid ${ui.border}`,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s ease',
          zIndex: 40,
        }}
      >
        <nav style={{ flex: 1, padding: '18px 10px', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
          {NAV_ITEMS.map((tb: any) => {
            const isHomeItem = tb.id === '__home__'
            const active = isHomeItem ? isHome : !isHome && tab === tb.id
            return (
              <button
                key={tb.id}
                type="button"
                onClick={() => (isHomeItem ? onSelectHome() : onTabChange(tb.id))}
                title={sidebarCollapsed ? tb.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  padding: sidebarCollapsed ? '12px 8px' : '12px 14px',
                  borderRadius: 14,
                  border: 'none',
                  background: active ? `${ui.themeColor}10` : 'transparent',
                  color: active ? ui.themeColor : ui.text,
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  width: '100%',
                  textAlign: 'right',
                  position: 'relative',
                }}
              >
                <span style={{ fontSize: 19, position: 'relative', flexShrink: 0 }}>
                  {tb.icon}
                  {typeof tb.badge === 'number' && tb.badge > 0 ? (
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
                      {tb.badge}
                    </span>
                  ) : null}
                </span>
                {!sidebarCollapsed && <span style={{ flex: 1 }}>{tb.label}</span>}
                {!sidebarCollapsed && typeof tb.badge === 'number' && tb.badge > 0 ? (
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
                    {tb.badge}
                  </span>
                ) : null}
              </button>
            )
          })}

          <div style={{ height: 1, background: ui.border, margin: '8px 6px' }} />

          <button
            type="button"
            onClick={onGoQuizBank}
            title={sidebarCollapsed ? 'بنك الاختبارات' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              padding: sidebarCollapsed ? '10px 8px' : '10px 14px',
              borderRadius: 14,
              border: `1px solid ${ui.borderAccent}`,
              background: `${ui.themeColor}0A`,
              color: ui.themeColor,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
              width: '100%',
              textAlign: 'right',
            }}
          >
            <span style={{ fontSize: 17, flexShrink: 0 }}>🧪</span>
            {!sidebarCollapsed && <span style={{ flex: 1 }}>بنك الاختبارات</span>}
          </button>
        </nav>

        <div style={{ padding: '12px 10px', borderTop: `1px solid ${ui.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <NotificationBell
                userId={userId}
                themeColor={ui.themeColor}
                textCol={ui.text}
                subCol={ui.sub}
                cardBg={ui.panelStrong}
                borderCol={ui.border}
                inputBg={ui.inputBg}
                isDark={false}
              />
            </div>
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 12,
              border: `1px solid ${ui.border}`,
              background: 'transparent',
              color: ui.sub,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {sidebarCollapsed ? '»' : '« طيّ القائمة'}
          </button>
        </div>
      </aside>

      <nav
        className="teacher-mobile-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: ui.headerBg,
          backdropFilter: 'blur(20px)',
          borderTop: `1px solid ${ui.border}`,
          justifyContent: 'space-around',
          padding: '8px 0 14px',
          boxShadow: '0 -2px 10px rgba(140,20,40,0.06)',
        }}
      >
        {NAV_ITEMS.map((tb: any) => {
          const isHomeItem = tb.id === '__home__'
          const active = isHomeItem ? isHome : !isHome && tab === tb.id
          return (
            <button
              key={tb.id}
              type="button"
              onClick={() => (isHomeItem ? onSelectHome() : onTabChange(tb.id))}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                padding: '4px 8px',
                borderRadius: 10,
                color: active ? ui.themeColor : ui.sub,
                position: 'relative',
              }}
            >
              <span style={{ fontSize: 19 }}>{tb.icon}</span>
              <span style={{ fontSize: 10, fontWeight: active ? 900 : 600 }}>{tb.label}</span>

              {typeof tb.badge === 'number' && tb.badge > 0 ? (
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
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
                  {tb.badge}
                </span>
              ) : null}
            </button>
          )
        })}

        <button
          type="button"
          onClick={onGoQuizBank}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: '4px 8px',
            borderRadius: 10,
            color: ui.sub,
          }}
        >
          <span style={{ fontSize: 19 }}>🧪</span>
          <span style={{ fontSize: 10, fontWeight: 600 }}>الاختبارات</span>
        </button>
      </nav>
    </>
  )
}