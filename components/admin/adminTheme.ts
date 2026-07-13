import type { CSSProperties } from 'react'
import { BRAND } from '@/lib/constants/theme'

export const T = {
  bg: BRAND.bg,
  cardBg: BRAND.bgSoft,
  textCol: BRAND.text,
  subCol: BRAND.sub,
  borderCol: BRAND.border,
  inputBg: 'rgba(140,20,40,0.04)',
  headerBg: 'rgba(247,242,234,0.92)',
  shadow: BRAND.shadow,
  gradMain: BRAND.gradMain,
  gradBlue: BRAND.gradBlue,
}

export const inputStyle: CSSProperties = {
  padding: '12px 14px',
  borderRadius: BRAND.radiusSm,
  border: `1.5px solid ${T.borderCol}`,
  background: T.inputBg,
  color: T.textCol,
  fontSize: 14,
  fontFamily: 'inherit',
}

export const sectionCard: CSSProperties = {
  background: 'rgba(255,255,255,0.68)',
  border: `1px solid ${T.borderCol}`,
  borderRadius: BRAND.radiusXl,
  boxShadow: T.shadow,
  padding: 22,
  backdropFilter: 'blur(14px)',
}