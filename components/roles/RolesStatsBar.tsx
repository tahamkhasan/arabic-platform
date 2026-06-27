'use client'

import { cardStyle, inputStyle } from '@/lib/roles-page-styles'

type Props = {
  search: string
  onSearchChange: (value: string) => void
  total: number
  filtered: number
}

export default function RolesStatsBar({
  search,
  onSearchChange,
  total,
  filtered,
}: Props) {
  return (
    <div
      style={{
        ...cardStyle,
        padding: 16,
        marginBottom: 18,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 160px 160px',
          gap: 12,
        }}
      >
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ابحث بالاسم أو المفتاح أو الصلاحية..."
          style={inputStyle}
        />

        <div
          style={{
            ...inputStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(140,20,40,0.05)',
            fontWeight: 800,
          }}
        >
          إجمالي الأدوار: {total}
        </div>

        <div
          style={{
            ...inputStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(140,20,40,0.05)',
            fontWeight: 800,
          }}
        >
          نتائج البحث: {filtered}
        </div>
      </div>
    </div>
  )
}
