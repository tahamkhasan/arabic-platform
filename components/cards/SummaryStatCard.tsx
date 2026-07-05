'use client'

import type { CSSProperties } from 'react'
import type { UITheme } from '../teacher.types'

export function SummaryStatCard({
  ui,
  cardStyle,
  icon,
  label,
  value,
  color,
}: {
  ui: UITheme
  cardStyle: CSSProperties
  icon: string
  label: string
  value: number | string
  color: string
}) {
  return (
    <div
      style={{
        ...cardStyle,
        padding: 18,
        minHeight: 140,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            color,
            background: `${color}14`,
            border: `1px solid ${color}26`,
            borderRadius: 999,
            padding: '5px 10px',
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>

      <div style={{ fontSize: 38, fontWeight: 900, color: ui.text, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: ui.sub }}>{label}</div>
    </div>
  )
}