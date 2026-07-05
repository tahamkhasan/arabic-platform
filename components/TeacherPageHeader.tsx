'use client'

import { BRAND } from '@/lib/constants/theme'
import type { TeacherPageHeaderProps } from '@/types/teacher-page.types'

export function TeacherPageHeader({ vm }: TeacherPageHeaderProps) {
  const { ui, isDark, c, user, router, styles, toggleThemeMode, handleLogout } = vm
  const { ghostBtn } = styles

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 60,
        background: ui.headerBg,
        backdropFilter: 'blur(18px)',
        borderBottom: `1px solid ${ui.border}`,
        padding: '14px 18px',
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: ui.gradMain,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 18,
              boxShadow: ui.glow,
              flexShrink: 0,
            }}
          >
            م
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                fontFamily: BRAND.fontHeading,
                color: ui.text,
                marginBottom: 3,
              }}
            >
              {c.platformName}
            </div>
            <div style={{ fontSize: 13, color: ui.sub }}>أهلاً {user?.name ?? ''} • معلم</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => router.push('/dashboard')} style={ghostBtn(false)}>
            ✨ أدوات التوليد
          </button>

          <button
            type="button"
            onClick={toggleThemeMode}
            title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
            style={ghostBtn(false)}
          >
            {isDark ? '☀️ الوضع النهاري' : '🌙 الوضع الليلي'}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              ...ghostBtn(false),
              borderColor: ui.dangerBorder,
              color: BRAND.crimson,
              background: ui.dangerBg,
            }}
          >
            🚪 تسجيل الخروج
          </button>
        </div>
      </div>
    </header>
  )
}