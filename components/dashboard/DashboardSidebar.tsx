'use client'
import { BRAND } from '@/lib/constants/theme'
import { ar } from '@/lib/constants/ar'
import type { ThemePalette } from './dashboardTheme'

const t = ar.dashboard
const TOOLS = t.tools as readonly { id: string; icon: string; label: string; desc: string }[]

const SIDEBAR_WIDTH = 240
const SIDEBAR_WIDTH_COLLAPSED = 78

interface DashboardSidebarProps {
  tool: string
  onToolChange: (id: string) => void
  isAdmin: boolean
  isDark: boolean
  sidebarCollapsed: boolean
  onToggleCollapse: () => void
  onToggleTheme: () => void
  onLogout: () => void
  onGoHistory: () => void
  onGoAdmin: () => void
  onGoAdminGenerator: () => void
  onGoTeacher: () => void
  themeColor: string
  T: ThemePalette
}

export default function DashboardSidebar({
  tool,
  onToolChange,
  isAdmin,
  isDark,
  sidebarCollapsed,
  onToggleCollapse,
  onToggleTheme,
  onLogout,
  onGoHistory,
  onGoAdmin,
  onGoAdminGenerator,
  onGoTeacher,
  themeColor,
  T,
}: DashboardSidebarProps) {
  const sidebarWidth = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH

  return (
    <>
      <aside
        className="dashboard-sidebar"
        style={{
          width: sidebarWidth,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          background: T.sidebarBg,
          borderLeft: `1px solid ${T.borderCol}`,
          display: 'flex',
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
              <div style={{ fontSize: 12, color: T.subCol }}>لوحة المعلم</div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
          {TOOLS.map(item => {
            const active = tool === item.id
            return (
              <button
                key={item.id}
                onClick={() => onToolChange(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  padding: sidebarCollapsed ? '12px 8px' : '12px 14px',
                  borderRadius: 14,
                  border: 'none',
                  background: active ? `${themeColor}10` : 'transparent',
                  color: active ? themeColor : T.textCol,
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  width: '100%',
                  textAlign: 'right',
                }}
              >
                <span style={{ fontSize: 19, flexShrink: 0 }}>{item.icon}</span>
                {!sidebarCollapsed && <span style={{ flex: 1 }}>{item.label}</span>}
              </button>
            )
          })}

          <div style={{ height: 1, background: T.borderCol, margin: '8px 6px' }} />

          <button
            onClick={onGoHistory}
            title={sidebarCollapsed ? 'سجل التوليدات' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              padding: sidebarCollapsed ? '10px 8px' : '10px 14px',
              borderRadius: 14,
              border: `1px solid ${themeColor}22`,
              background: `${themeColor}0A`,
              color: themeColor,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
              width: '100%',
              textAlign: 'right',
            }}
          >
            <span style={{ fontSize: 17, flexShrink: 0 }}>📚</span>
            {!sidebarCollapsed && <span style={{ flex: 1 }}>سجل التوليدات</span>}
          </button>

          {isAdmin ? (
            <>
              <button
                onClick={onGoAdmin}
                title={sidebarCollapsed ? 'لوحة الأدمن' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  padding: sidebarCollapsed ? '10px 8px' : '10px 14px',
                  borderRadius: 14, border: `1px solid ${T.borderCol}`, background: 'transparent',
                  color: T.subCol, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                  width: '100%', textAlign: 'right',
                }}
              >
                <span style={{ fontSize: 17, flexShrink: 0 }}>🛠️</span>
                {!sidebarCollapsed && <span style={{ flex: 1 }}>لوحة الأدمن</span>}
              </button>
              <button
                onClick={onGoAdminGenerator}
                title={sidebarCollapsed ? 'توليد الأدمن' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  padding: sidebarCollapsed ? '10px 8px' : '10px 14px',
                  borderRadius: 14, border: `1px solid ${T.borderCol}`, background: 'transparent',
                  color: T.subCol, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                  width: '100%', textAlign: 'right',
                }}
              >
                <span style={{ fontSize: 17, flexShrink: 0 }}>✨</span>
                {!sidebarCollapsed && <span style={{ flex: 1 }}>توليد الأدمن</span>}
              </button>
            </>
          ) : (
            <button
              onClick={onGoTeacher}
              title={sidebarCollapsed ? 'إدارة الطلاب' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                padding: sidebarCollapsed ? '10px 8px' : '10px 14px',
                borderRadius: 14, border: `1px solid ${T.borderCol}`, background: 'transparent',
                color: T.subCol, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                width: '100%', textAlign: 'right',
              }}
            >
              <span style={{ fontSize: 17, flexShrink: 0 }}>🏠</span>
              {!sidebarCollapsed && <span style={{ flex: 1 }}>الرئيسة</span>}
            </button>
          )}
        </nav>

        <div style={{ padding: '12px 10px', borderTop: `1px solid ${T.borderCol}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={onToggleTheme}
            style={{
              padding: '10px', borderRadius: 12, border: `1px solid ${T.borderCol}`,
              background: 'transparent', color: T.subCol, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
            }}
          >
            {isDark ? '☀️' : '🌙'} {!sidebarCollapsed && (isDark ? 'الوضع النهاري' : 'الوضع الليلي')}
          </button>

          <button
            onClick={onToggleCollapse}
            style={{
              padding: '10px', borderRadius: 12, border: `1px solid ${T.borderCol}`,
              background: 'transparent', color: T.subCol, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
            }}
          >
            {sidebarCollapsed ? '»' : '« طيّ القائمة'}
          </button>

          <button
            onClick={onLogout}
            style={{
              padding: '10px', borderRadius: 12, border: '1px solid rgba(200,90,84,0.34)',
              background: 'rgba(200,90,84,0.08)', color: T.danger, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
            }}
          >
            🚪 {!sidebarCollapsed && 'خروج'}
          </button>
        </div>
      </aside>

      <nav
        className="dashboard-mobile-nav"
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
        {TOOLS.map(item => (
          <button
            key={item.id}
            onClick={() => onToolChange(item.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              padding: '4px 8px', borderRadius: 10,
              color: tool === item.id ? themeColor : T.subCol,
            }}
          >
            <span style={{ fontSize: 19 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tool === item.id ? 900 : 600 }}>{item.label}</span>
          </button>
        ))}
        <button
          onClick={onGoHistory}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            padding: '4px 8px', borderRadius: 10, color: T.subCol,
          }}
        >
          <span style={{ fontSize: 19 }}>📚</span>
          <span style={{ fontSize: 10, fontWeight: 600 }}>السجل</span>
        </button>
      </nav>
    </>
  )
}