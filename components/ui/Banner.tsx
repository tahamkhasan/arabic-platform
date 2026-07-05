'use client'

import { BRAND } from '@/lib/constants/theme'
import type { UITheme } from '../teacher.types'

export function Banner({
  type,
  ui,
  text,
}: {
  type: 'success' | 'error'
  ui: UITheme
  text: string
}) {
  const style =
    type === 'success'
      ? {
          background: ui.successBg,
          border: `1px solid ${ui.successBorder}`,
          color: '#0f7a4a',
        }
      : {
          background: ui.dangerBg,
          border: `1px solid ${ui.dangerBorder}`,
          color: BRAND.crimson,
        }

  return (
    <div
      style={{
        ...style,
        padding: '12px 14px',
        borderRadius: 14,
        fontSize: 13,
        fontWeight: 700,
        marginBottom: 14,
      }}
    >
      {text}
    </div>
  )
}