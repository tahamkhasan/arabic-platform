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

export type SelectionItem = {
  id: string
  title: string
  sub?: string | null
}