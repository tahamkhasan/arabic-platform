'use client'
import { memo } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { BRAND } from '@/lib/constants/theme'

export const T = {
  bg: BRAND.bg,
  pageBg: BRAND.bgSoft,
  sectionBg: '#FFFDFC',
  cardBg: '#FFFFFF',
  cardSoft: 'rgba(255,255,255,0.72)',
  headerBg: 'rgba(247,242,234,0.84)',
  sidebarBg: '#FFFFFF',

  textCol: BRAND.text,
  titleCol: BRAND.text,
  subCol: BRAND.sub,
  mutedCol: BRAND.muted,

  borderCol: 'rgba(97,74,58,0.14)',
  borderSoft: 'rgba(97,74,58,0.10)',
  inputBg: '#FFFFFF',
  inputBorder: 'rgba(97,74,58,0.16)',

  primary: BRAND.red,
  primaryHover: BRAND.crimson,
  primarySoft: 'rgba(140,20,40,0.08)',
  primaryDeep: BRAND.deep,
  deep: BRAND.deep,
  red: BRAND.red,

  gold: BRAND.orange,
  blue: '#2563EB',
  blueDark: '#1D4ED8',
  green: '#059669',

  gradMain: BRAND.gradMain,
  gradBlue: BRAND.gradBlue,
  gradWarm:
    'linear-gradient(135deg, rgba(140,20,40,0.08) 0%, rgba(220,100,40,0.10) 45%, rgba(37,99,235,0.06) 100%)',

  shadowSoft: '0 10px 30px rgba(73,44,24,0.08)',
  shadowCard: '0 14px 34px rgba(73,44,24,0.07)',
  blueGlow: '0 12px 24px rgba(37,99,235,0.14)',

  fontHeading: BRAND.fontHeading,
  fontBody: BRAND.fontBody,
}

export const interactiveCard: CSSProperties = {
  transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease',
  willChange: 'transform',
}

export function fmtDate(date?: string | null) {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleDateString('ar-KW', { month: 'short', day: 'numeric' })
  } catch {
    return '—'
  }
}

export function fmtDateTime(date?: string | null) {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleDateString('ar-KW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

export function getEmbedUrl(url?: string | null): string | null {
  if (!url) return null
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  if (url.match(/\.(mp4|webm|ogg)$/i)) return url
  return url
}

export const Empty = memo(({ icon, title, sub }: { icon: string; title: string; sub: string }) => {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '60px 20px',
        background: T.cardBg,
        borderRadius: 24,
        border: `1px solid ${T.borderCol}`,
        boxShadow: T.shadowCard,
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 14 }}>{icon}</div>
      <h3 style={{ fontSize: 18, fontWeight: 900, color: T.titleCol, marginBottom: 8, fontFamily: T.fontHeading }}>
        {title}
      </h3>
      <p style={{ fontSize: 14, color: T.subCol, lineHeight: 1.9, margin: 0, fontFamily: T.fontBody }}>{sub}</p>
    </div>
  )
})
Empty.displayName = 'Empty'

export const SectionCard = memo(
  ({
    title,
    sub,
    icon,
    children,
    action,
    accent,
  }: {
    title: string
    sub?: string
    icon?: string
    children?: ReactNode
    action?: ReactNode
    accent?: string
  }) => {
    return (
      <section
        style={{
          background: T.cardBg,
          border: `1px solid ${accent ? `${accent}20` : T.borderCol}`,
          borderRadius: 26,
          boxShadow: T.shadowCard,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '18px 18px 14px',
            borderBottom: `1px solid ${T.borderCol}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            background: accent ? `${accent}08` : T.sectionBg,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {icon && (
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: accent ? `${accent}14` : T.primarySoft,
                  fontSize: 20,
                }}
              >
                {icon}
              </div>
            )}
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: T.titleCol, fontFamily: T.fontHeading }}>
                {title}
              </h3>
              {sub && (
                <p style={{ margin: '4px 0 0', fontSize: 14, color: T.subCol, fontFamily: T.fontBody }}>{sub}</p>
              )}
            </div>
          </div>
          {action}
        </div>
        <div style={{ padding: 18 }}>{children}</div>
      </section>
    )
  },
)
SectionCard.displayName = 'SectionCard'

export const StatPill = memo(
  ({
    icon,
    label,
    value,
    color,
    onClick,
  }: {
    icon: string
    label: string
    value: string | number
    color: string
    onClick?: () => void
  }) => {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          border: `1px solid ${color}22`,
          background: `${color}0D`,
          color,
          borderRadius: 16,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          fontFamily: T.fontBody,
          ...interactiveCard,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 16, fontWeight: 900, fontFamily: T.fontHeading }}>{value}</span>
        <span style={{ fontSize: 12, color: T.subCol }}>{label}</span>
      </button>
    )
  },
)
StatPill.displayName = 'StatPill'

export const QuickAction = memo(
  ({ icon, label, badge, onClick }: { icon: string; label: string; badge?: number; onClick: () => void }) => {
    return (
      <button
        onClick={onClick}
        style={{
          ...interactiveCard,
          padding: '18px 16px',
          borderRadius: 18,
          border: `1px solid ${T.borderCol}`,
          background: T.cardBg,
          cursor: 'pointer',
          fontFamily: T.fontBody,
          textAlign: 'center',
          position: 'relative',
          boxShadow: T.shadowCard,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = `0 18px 34px ${BRAND.deep}14`
          e.currentTarget.style.borderColor = `${BRAND.deep}33`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = T.shadowCard
          e.currentTarget.style.borderColor = T.borderCol
        }}
      >
        <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.textCol }}>{label}</div>
        {!!badge && badge > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              background: BRAND.crimson,
              color: '#fff',
              minWidth: 19,
              height: 19,
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 5px',
            }}
          >
            {badge}
          </span>
        )}
      </button>
    )
  },
)
QuickAction.displayName = 'QuickAction'