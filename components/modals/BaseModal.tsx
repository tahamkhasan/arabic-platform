'use client'

import type { ReactNode } from 'react'
import type { UITheme } from '../teacher.types'

export function BaseModal({
  ui,
  title,
  subtitle,
  onClose,
  maxWidth = 920,
  headerActions,
  children,
}: {
  ui: UITheme
  title: string
  subtitle?: string
  onClose: () => void
  maxWidth?: number
  headerActions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="teacher-modal-shell" onClick={onClose}>
      <div
        className="teacher-modal-card"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth,
          background: ui.panelAlt,
          border: `1px solid ${ui.border}`,
          boxShadow: ui.shadow,
        }}
      >
        <div
          style={{
            padding: '16px 18px',
            borderBottom: `1px solid ${ui.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: ui.text }}>{title}</div>
            {subtitle ? <div style={{ fontSize: 12, color: ui.sub, marginTop: 4 }}>{subtitle}</div> : null}
          </div>

          {headerActions ? <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{headerActions}</div> : null}
        </div>

        <div className="teacher-modal-body-scroll">{children}</div>
      </div>
    </div>
  )
}