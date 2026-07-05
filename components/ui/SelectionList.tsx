'use client'

import type { SelectionItem, UITheme } from '../teacher.types'

export function SelectionList({
  items,
  selected,
  onToggle,
  ui,
}: {
  items: SelectionItem[]
  selected: string[]
  onToggle: (id: string) => void
  ui: UITheme
}) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 8,
        maxHeight: 260,
        overflowY: 'auto',
        padding: 2,
      }}
    >
      {items.length === 0 ? (
        <div
          style={{
            border: `1px dashed ${ui.border}`,
            borderRadius: 14,
            padding: 14,
            fontSize: 12,
            color: ui.sub,
            background: ui.inputBg,
          }}
        >
          لا توجد عناصر متاحة.
        </div>
      ) : (
        items.map(item => {
          const active = selected.includes(item.id)

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item.id)}
              style={{
                textAlign: 'right',
                padding: '12px 14px',
                borderRadius: 14,
                border: `1.5px solid ${active ? ui.borderAccent : ui.border}`,
                background: active ? `${ui.themeColor}10` : ui.inputBg,
                color: active ? ui.themeColor : ui.text,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800 }}>{item.title}</div>
              {item.sub ? <div style={{ fontSize: 11, color: ui.sub, marginTop: 3 }}>{item.sub}</div> : null}
            </button>
          )
        })
      )}
    </div>
  )
}