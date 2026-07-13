'use client'
import { BRAND } from '@/lib/constants/theme'

export const LIGHT_THEME = {
  bg: BRAND.bg,
  pageBg: BRAND.bgSoft,
  sectionBg: BRAND.bgSoft,
  cardBg: BRAND.bgSoft,
  cardSoft: BRAND.bgSoft,
  headerBg: 'rgba(247,242,234,0.94)',
  sidebarBg: '#FFFFFF',

  textCol: BRAND.text,
  titleCol: BRAND.text,
  subCol: BRAND.sub,
  mutedCol: BRAND.muted,

  borderCol: BRAND.border,
  borderSoft: BRAND.border,
  inputBg: '#FFFFFF',
  inputBorder: BRAND.border,

  primary: BRAND.red,
  primaryHover: BRAND.crimson,
  primarySoft: 'rgba(140,20,40,0.08)',
  primaryDeep: BRAND.deep,
  crimson: BRAND.crimson,

  gold: BRAND.crimson,
  blue: '#2563EB',
  blueDark: '#1D4ED8',
  green: BRAND.crimson,
  danger: BRAND.crimson,

  gradMain: BRAND.gradMain,
  gradBlue: BRAND.gradBlue,
  gradWarm: `linear-gradient(135deg, rgba(140,20,40,0.10), ${BRAND.bgSoft})`,

  shadowSoft: BRAND.shadow,
  shadowCard: BRAND.shadowWarm,
  blueGlow: BRAND.shadowBlue,

  fontHeading: BRAND.fontHeading,
}

export const DARK_THEME = {
  bg: '#1A1612',
  pageBg: '#15120F',
  sectionBg: '#211B16',
  cardBg: '#241F1A',
  cardSoft: '#2B241D',
  headerBg: 'rgba(26,22,18,0.92)',
  sidebarBg: '#1E1A16',

  textCol: '#F0E9DE',
  titleCol: '#F5EFE6',
  subCol: '#B5A99C',
  mutedCol: '#8F8378',

  borderCol: 'rgba(140,20,40,0.25)',
  borderSoft: 'rgba(140,20,40,0.18)',
  inputBg: 'rgba(255,255,255,0.05)',
  inputBorder: 'rgba(255,255,255,0.10)',

  primary: BRAND.crimson,
  primaryHover: BRAND.red,
  primarySoft: 'rgba(140,20,40,0.15)',
  primaryDeep: BRAND.deep,
  crimson: BRAND.crimson,

  gold: BRAND.crimson,
  blue: '#4FA0FE',
  blueDark: '#2563EB',
  green: BRAND.crimson,
  danger: BRAND.crimson,

  gradMain: BRAND.gradMain,
  gradBlue: BRAND.gradBlue,
  gradWarm: 'linear-gradient(135deg,#2B241D,#1A1612)',

  shadowSoft: '0 8px 30px rgba(0,0,0,0.35)',
  shadowCard: '0 10px 24px rgba(0,0,0,0.3)',
  blueGlow: '0 8px 24px rgba(37,99,235,0.25)',

  fontHeading: BRAND.fontHeading,
}

export type ThemePalette = typeof LIGHT_THEME | typeof DARK_THEME

export function Empty({ text, subCol }: { text: string; subCol: string }) {
  return (
    <p style={{ color: subCol, fontSize: 14, margin: 0, padding: '8px 0', lineHeight: 1.8 }}>{text}</p>
  )
}

export function StatCard({
  title,
  value,
  sub,
  color,
  icon,
  T,
}: {
  title: string
  value: string | number
  sub: string
  color: string
  icon: string
  T: ThemePalette
}) {
  return (
    <div style={{ background: T.cardBg, borderRadius: 18, border: `1px solid ${color}20`, padding: 16, boxShadow: T.shadowCard }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${color}14`,
            fontSize: 18,
          }}
        >
          {icon}
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color, background: `${color}14`, padding: '2px 8px', borderRadius: 6 }}>
          {title}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: T.titleCol, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: T.subCol }}>{sub}</div>
    </div>
  )
}

export function StepSection({
  step,
  title,
  children,
  themeColor,
  T,
}: {
  step: string
  title: string
  children: React.ReactNode
  themeColor: string
  T: ThemePalette
}) {
  return (
    <div style={{ borderRadius: 20, padding: '20px 22px', background: T.cardBg, border: `1px solid ${T.borderCol}`, marginBottom: 18, boxShadow: T.shadowCard }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span
          style={{
            fontSize: 16,
            color: themeColor,
            fontWeight: 900,
            background: `${themeColor}16`,
            width: 28,
            height: 28,
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {step}
        </span>
        <h2 style={{ fontSize: 16, fontWeight: 900, color: T.textCol, margin: 0, fontFamily: BRAND.fontHeading }}>{title}</h2>
      </div>
      <div>{children}</div>
    </div>
  )
}

export function Chip({
  label,
  active,
  color,
  subCol,
  borderCol,
  onClick,
}: {
  label: string
  active: boolean
  color: string
  subCol: string
  borderCol: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '10px 18px',
        borderRadius: 12,
        border: `1px solid ${active ? color : borderCol}`,
        background: active ? `${color}15` : 'transparent',
        color: active ? color : subCol,
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 800,
        fontFamily: 'inherit',
        transition: 'all 0.15s',
        boxShadow: active ? `0 6px 18px ${color}18` : 'none',
      }}
    >
      {label}
    </button>
  )
}

export function smallBtn(background: string, color: string, border: string): React.CSSProperties {
  return {
    padding: '6px 14px',
    borderRadius: 10,
    border,
    background,
    color,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 800,
    fontFamily: 'inherit',
  }
}