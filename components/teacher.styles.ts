import type { CSSProperties } from 'react'
import type { UITheme } from './teacher.types'

export function createTeacherStyles(ui: UITheme, themeMode: 'light' | 'dark') {
  const isDark = themeMode === 'dark'

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '13px 14px',
    borderRadius: 14,
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderColor: ui.border,
    background: ui.inputBg,
    color: ui.text,
    fontSize: 14,
    fontFamily: 'inherit',
    colorScheme: themeMode,
    transition: 'border-color .18s, box-shadow .18s, background .18s',
    outline: 'none',
  }

  const sectionCard: CSSProperties = {
    background: ui.panel,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: ui.border,
    borderRadius: 24,
    boxShadow: ui.cardGlow,
    backdropFilter: 'blur(12px)',
  }

  const smallCard: CSSProperties = {
    background: ui.panelStrong,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: ui.border,
    borderRadius: 18,
    boxShadow: ui.cardGlow,
  }

  const ghostBtn = (active = false): CSSProperties => ({
    padding: '10px 14px',
    borderRadius: 12,
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderColor: active ? ui.borderAccent : ui.border,
    background: active ? (isDark ? 'rgba(140,20,40,0.12)' : 'rgba(140,20,40,0.07)') : 'transparent',
    color: active ? ui.themeColor : ui.sub,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: active ? 800 : 700,
    transition: 'all .18s',
  })

  const primaryBtn = (enabled = true): CSSProperties => ({
    padding: '14px 16px',
    borderRadius: 14,
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    background: enabled ? ui.gradMain : ui.border,
    color: '#fff',
    fontWeight: 900,
    fontSize: 15,
    cursor: enabled ? 'pointer' : 'not-allowed',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: enabled ? ui.glow : 'none',
  })

  return {
    inputStyle,
    sectionCard,
    smallCard,
    ghostBtn,
    primaryBtn,
  }
}

export type TeacherStyles = ReturnType<typeof createTeacherStyles>