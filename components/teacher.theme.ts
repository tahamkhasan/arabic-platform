import { BRAND } from '@/lib/constants/theme'
import type { UITheme } from './teacher.types'

export function getTeacherTheme(isDark: boolean): UITheme {
  return {
    themeColor: BRAND.crimson,
    accent2: BRAND.orange,
    bg: isDark ? '#181413' : BRAND.bg,
    bgSoft: isDark ? '#201A18' : BRAND.bgSoft,
    panel: isDark ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.82)',
    panelStrong: isDark ? 'rgba(255,255,255,0.065)' : 'rgba(255,255,255,0.90)',
    panelAlt: isDark ? '#241D1A' : '#FFFDFC',
    text: isDark ? '#F6F0E8' : BRAND.text,
    sub: isDark ? 'rgba(246,240,232,0.72)' : BRAND.sub,
    muted: isDark ? 'rgba(246,240,232,0.56)' : `${BRAND.sub}BB`,
    border: isDark ? 'rgba(255,255,255,0.08)' : BRAND.border,
    borderAccent: isDark ? 'rgba(140,20,40,0.18)' : 'rgba(140,20,40,0.14)',
    inputBg: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    headerBg: isDark ? 'rgba(24,20,19,0.86)' : 'rgba(247,242,234,0.92)',
    shadow: isDark ? '0 18px 42px rgba(0,0,0,0.24)' : BRAND.shadow,
    glow: isDark ? '0 12px 28px rgba(140,20,40,0.12)' : '0 12px 28px rgba(140,20,40,0.08)',
    cardGlow: isDark ? '0 12px 32px rgba(0,0,0,0.18)' : '0 12px 30px rgba(0,0,0,0.05)',
    gradMain: BRAND.gradMain,
    gradBlue: BRAND.gradBlue,
    gradWarm: BRAND.gradWarm,
    successBg: 'rgba(5,150,105,0.10)',
    successBorder: 'rgba(5,150,105,0.28)',
    warnBg: 'rgba(217,119,6,0.10)',
    warnBorder: 'rgba(217,119,6,0.26)',
    dangerBg: 'rgba(180,40,40,0.10)',
    dangerBorder: 'rgba(180,40,40,0.28)',
  }
}