import type { CSSProperties } from 'react'

export type UITheme = {
  themeColor: string
  accent2: string
  bg: string
  bgSoft: string
  panel: string
  panelStrong: string
  panelAlt: string
  text: string
  sub: string
  muted: string
  border: string
  borderAccent: string
  inputBg: string
  headerBg: string
  shadow: string
  glow: string
  cardGlow: string
  gradMain: string
  gradBlue: string
  gradWarm: string
  successBg: string
  successBorder: string
  warnBg: string
  warnBorder: string
  dangerBg: string
  dangerBorder: string
}

export type TeacherStyles = {
  inputStyle: CSSProperties
  sectionCard: CSSProperties
  smallCard: CSSProperties
  ghostBtn: (active?: boolean) => CSSProperties
  primaryBtn: (enabled?: boolean) => CSSProperties
  pageCss: string
}