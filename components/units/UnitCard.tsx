'use client'
import type { UnitItem } from '@/types/units'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'

export default function UnitCard({
  unit,
  deleting,
  onEdit,
  onDelete,
  onOpenLessons,
  onToggleActive,
}: {
  unit: UnitItem
  deleting: boolean
  onEdit: (unit: UnitItem) => void
  onDelete: (unit: UnitItem) => void
  onOpenLessons: (unit: UnitItem) => void
  onToggleActive: (unit: UnitItem) => void
}) {
  return (
    <div
      style={{
        background: BRAND.bgSoft,
        borderRadius: BRAND.radiusLg,
        border: `1.5px solid ${BRAND.border}`,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        flexWrap: 'wrap',
        opacity: unit.is_active ? 1 : 0.6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 200 }}>
        <span
          style={{
            width: 38,
            height: 38,
            borderRadius: BRAND.radiusSm,
            background: 'rgba(140,20,40,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {unit.icon || '📖'}
        </span>
        <div>
          <div style={{ fontSize: 15, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: BRAND.text }}>
            {unit.order_num}. {unit.name}
            {!unit.is_active && (
              <span style={{ fontSize: 11, color: BRAND.crimson, marginRight: 8, fontFamily: BRAND.fontBody, fontWeight: BRAND.weightSemibold }}>
                (مخفية)
              </span>
            )}
          </div>
          {unit.description ? (
            <div style={{ fontSize: 12, color: BRAND.sub, marginTop: 2, fontFamily: BRAND.fontBody }}>{unit.description}</div>
          ) : null}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
        <Button variant="primary" size="sm" onClick={() => onOpenLessons(unit)}>
          📝 الدروس
        </Button>
        <button
          onClick={() => onToggleActive(unit)}
          style={{
            padding: '8px 14px',
            borderRadius: BRAND.radiusSm,
            border: `1.5px solid ${unit.is_active ? BRAND.border : BRAND.crimson}`,
            background: unit.is_active ? 'transparent' : 'rgba(140,20,40,0.10)',
            color: unit.is_active ? BRAND.sub : BRAND.crimson,
            fontSize: 13,
            fontWeight: BRAND.weightBold,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {unit.is_active ? '🙈 إخفاء' : '👁️ إظهار'}
        </button>
        <Button variant="secondary" size="sm" onClick={() => onEdit(unit)}>
          ✏️ تعديل
        </Button>
        <Button variant="danger" size="sm" disabled={deleting} onClick={() => onDelete(unit)}>
          🗑️
        </Button>
      </div>
    </div>
  )
}
