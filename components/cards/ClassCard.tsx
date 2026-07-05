'use client'

import type { CSSProperties } from 'react'
import type { UITheme } from '../teacher.types'

export function ClassCard({
  item,
  ui,
  cardStyle,
  onOpen,
}: {
  item: any
  ui: UITheme
  cardStyle: CSSProperties
  onOpen: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item.id)}
      style={{
        ...cardStyle,
        padding: '18px 20px',
        cursor: 'pointer',
        textAlign: 'right',
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 32 }}>🏫</div>
        <span
          style={{
            fontSize: 12,
            background: `${ui.themeColor}14`,
            color: ui.themeColor,
            padding: '4px 10px',
            borderRadius: 999,
            fontWeight: 700,
          }}
        >
          {item.students_count} طالب
        </span>
      </div>

      <div style={{ fontSize: 16, fontWeight: 800, color: ui.text, marginBottom: 6 }}>{item.name}</div>

      <div style={{ fontSize: 12, color: ui.sub }}>
        {item.subject_name ? item.subject_name : 'بلا مادة'} {item.level ? `• ${item.level}` : ''}
      </div>

      {!!item.open_assignments && (
        <div style={{ fontSize: 12, color: ui.themeColor, marginTop: 8 }}>{item.open_assignments} مهمة مفتوحة</div>
      )}
    </button>
  )
}