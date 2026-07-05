'use client'

import { BRAND } from '@/lib/constants/theme'
import type { UITheme } from '../teacher.types'

export function SectionTitle({
  icon,
  title,
  ui,
  margin = 18,
}: {
  icon: string
  title: string
  ui: UITheme
  margin?: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: margin }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <h2
        style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 900,
          color: ui.text,
          fontFamily: BRAND.fontHeading,
        }}
      >
        {title}
      </h2>
    </div>
  )
}