'use client'
import Link from 'next/link'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'
import { T } from './adminTheme'
import type { Tab } from '@/types/admin.types'

const SIDEBAR_WIDTH = 240
const SIDEBAR_WIDTH_COLLAPSED = 78

interface AdminSidebarProps {
  tab: Tab
  onTabChange: (t: Tab) => void
  pendingCount: number
  signalsCount: number
  sidebarCollapsed: boolean
  onToggleCollapse: () => void
  onLogout: () => void
  adminEmail: string
  onGoSettings: () => void
  onGoSubjects: () => void
  onGoGenerator: () => void
  onGoDelegations: () => void
  onAddParent: () => void
}

export default function AdminSidebar({
  tab,
  onTabChange,
  pendingCount,
  signalsCount,
  sidebarCollapsed,
  onToggleCollapse,
  onLogout,
  adminEmail,
  onGoSettings,
  onGoSubjects,
  onGoGenerator,
  onGoDelegations,
  onAddParent,
}: AdminSidebarProps) {
  const TABS: { id: Tab; icon: string; label: string; badge?: number }[] = [
    { id: 'overview', icon: '👑', label: 'نظرة عامة' },
    { id: 'students', icon: '🎓', label: 'الطلاب', badge: pendingCount },
    { id: 'teachers', icon: '👨‍🏫', label: 'المعلمون' },
    { id: 'stages', icon: '🏫', label: 'المراحل' },
    { id: 'signals', icon: '🔔', label: 'الإشارات', badge: signalsCount },
    { id: 'stats', icon: '📊', label: 'الإحصائيات' },
    { id: 'settings', icon: '⚙️', label: 'الإعدادات' },
  ]

  const QUICK_LINKS = [
    { icon: '📚', label: 'إدارة المواد', onClick: onGoSubjects },
    { icon: '✨', label: 'أدوات التوليد', onClick: onGoGenerator },
    { icon: '🗂️', label: 'التفويضات', onClick: onGoDelegations },
    { icon: '👨‍👦', label: 'ولي أمر جديد', onClick: onAddParent },
  ]

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH

  return (
    <>
      <aside
        className="admin-sidebar"
        style={{
          width: sidebarWidth,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          background: T.cardBg,
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
              width: 40,
              height: 40,
              borderRadius: BRAND.radiusSm,
              background: T.gradMain,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: BRAND.weightBlack,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            م
          </div>
          {!sidebarCollapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: T.textCol }}>
                لوحة الأدمن
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: T.subCol,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {adminEmail}
              </div>
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
                  borderRadius: BRAND.radiusMd,
                  border: 'none',
                  background: active ? 'rgba(140,20,40,0.08)' : 'transparent',
                  color: active ? BRAND.crimson : T.textCol,
                  fontWeight: BRAND.weightBlack,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  width: '100%',
                  textAlign: 'right',
                  position: 'relative',
                }}
              >
                <span style={{ fontSize: 18, position: 'relative', flexShrink: 0 }}>
                  {item.icon}
                  {!!item.badge && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -6,
                        left: -8,
                        minWidth: 16,
                        height: 16,
                        borderRadius: 999,
                        background: BRAND.orange,
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
                  )}
                </span>
                {!sidebarCollapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                {!sidebarCollapsed && !!item.badge && (
                  <span
                    style={{
                      minWidth: 20,
                      height: 20,
                      borderRadius: 999,
                      background: BRAND.orange,
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
                )}
              </button>
            )
          })}

          <div style={{ height: 1, background: T.borderCol, margin: '8px 6px' }} />

          {QUICK_LINKS.map(link => (
            <button
              key={link.label}
              onClick={link.onClick}
              title={sidebarCollapsed ? link.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                padding: sidebarCollapsed ? '10px 8px' : '10px 14px',
                borderRadius: BRAND.radiusMd,
                border: `1px solid ${T.borderCol}`,
                background: 'transparent',
                color: T.subCol,
                fontWeight: BRAND.weightBold,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 13,
                width: '100%',
                textAlign: 'right',
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{link.icon}</span>
              {!sidebarCollapsed && <span style={{ flex: 1 }}>{link.label}</span>}
            </button>
          ))}
        </nav>

        <div style={{ padding: '12px 10px', borderTop: `1px solid ${T.borderCol}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={onToggleCollapse}
            style={{
              padding: '10px',
              borderRadius: BRAND.radiusMd,
              border: `1px solid ${T.borderCol}`,
              background: 'transparent',
              color: T.subCol,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: BRAND.weightBold,
            }}
          >
            {sidebarCollapsed ? '»' : '« طيّ القائمة'}
          </button>

          <button
            onClick={onLogout}
            style={{
              padding: '10px',
              borderRadius: BRAND.radiusMd,
              border: `1.5px solid ${BRAND.borderStrong}`,
              background: 'rgba(140,20,40,0.06)',
              color: BRAND.crimson,
              fontWeight: BRAND.weightBold,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
            }}
          >
            🚪 {!sidebarCollapsed && 'خروج'}
          </button>
        </div>
      </aside>

      <nav
        className="admin-mobile-nav"
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
              padding: '4px 8px',
              borderRadius: 10,
              color: tab === item.id ? BRAND.crimson : T.subCol,
              position: 'relative',
            }}
          >
            <span style={{ fontSize: 19 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === item.id ? BRAND.weightBold : BRAND.weightSemibold }}>
              {item.label}
            </span>

            {!!item.badge && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
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
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </>
  )
}