'use client'

import { A, type AdminTab } from './admin-utils'

type Item = {
  id: AdminTab
  label: string
  icon: string
  badge?: number
}

type Props = {
  activeTab: AdminTab
  items: Item[]
  onChange: (tab: AdminTab) => void
}

export default function AdminTabs({ activeTab, items, onChange }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
      }}
    >
      {items.map(item => {
        const active = item.id === activeTab

        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 14px',
              borderRadius: 14,
              border: active ? `2px solid ${A.crimson}` : `1px solid ${A.border}`,
              background: active ? 'rgba(140,20,40,0.08)' : '#fff',
              color: active ? A.crimson : A.text,
              cursor: 'pointer',
              fontFamily: A.fontBody,
              fontWeight: active ? A.weightBlack : A.weightSemibold,
              position: 'relative',
              minHeight: 48,
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ fontSize: 13 }}>{item.label}</span>

            {item.badge && item.badge > 0 ? (
              <span
                style={{
                  minWidth: 18,
                  height: 18,
                  borderRadius: 999,
                  padding: '0 6px',
                  background: A.orange,
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: A.weightBlack,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.badge}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}