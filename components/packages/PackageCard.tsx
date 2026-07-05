'use client'
import { useState } from 'react'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'
import { STAGE_LABELS, GRADES_BY_STAGE, TRACK_LABELS, StageKey, TrackKey } from '@/lib/constants/stages'
import type { PackageItem } from '@/types/packages'

export default function PackageCard({
  pkg,
  deleting,
  onEdit,
  onDelete,
}: {
  pkg: PackageItem
  deleting: boolean
  onEdit: (pkg: PackageItem) => void
  onDelete: (pkg: PackageItem) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const gradeLabel =
    GRADES_BY_STAGE[pkg.stage as StageKey]?.find((g) => g.id === pkg.grade)?.label ?? `الصف ${pkg.grade}`

  return (
    <div
      style={{
        background: BRAND.bgSoft,
        borderRadius: BRAND.radiusLg,
        border: `1.5px solid ${pkg.is_active ? BRAND.border : 'rgba(220,100,40,0.3)'}`,
        padding: 18,
        boxShadow: BRAND.shadow,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: BRAND.weightBlack,
            fontFamily: BRAND.fontHeading,
            color: BRAND.text,
          }}
        >
          📦 {pkg.name}
        </div>
        {!pkg.is_active && (
          <span
            style={{
              fontSize: 11,
              padding: '3px 8px',
              borderRadius: 8,
              background: 'rgba(220,100,40,0.12)',
              color: BRAND.orange,
              fontWeight: BRAND.weightBold,
              flexShrink: 0,
            }}
          >
            معطّلة
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        <span
          style={{
            fontSize: 11,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'rgba(140,20,40,0.07)',
            color: BRAND.crimson,
            fontWeight: BRAND.weightBold,
          }}
        >
          {STAGE_LABELS[pkg.stage as StageKey] ?? pkg.stage}
        </span>
        <span
          style={{
            fontSize: 11,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'rgba(140,20,40,0.07)',
            color: BRAND.crimson,
            fontWeight: BRAND.weightBold,
          }}
        >
          {gradeLabel}
        </span>
        {pkg.track && (
          <span
            style={{
              fontSize: 11,
              padding: '4px 10px',
              borderRadius: 999,
              background: 'rgba(140,20,40,0.07)',
              color: BRAND.crimson,
              fontWeight: BRAND.weightBold,
            }}
          >
            {TRACK_LABELS[pkg.track as TrackKey]}
          </span>
        )}
      </div>

      {pkg.description ? (
        <p style={{ fontSize: 12, color: BRAND.sub, marginBottom: 10, lineHeight: 1.6 }}>{pkg.description}</p>
      ) : null}

      {/* ── مُعدَّل: BRAND.gold كان منخفض التباين (تشويش بصري)، وأصبح
           قابلاً للضغط لعرض/إخفاء قائمة المواد الفعلية بالباقة ── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          color: BRAND.crimson,
          fontWeight: BRAND.weightBold,
          marginBottom: expanded ? 8 : 14,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <span>📚 {pkg.subjects.length} مادة (محسوبة تلقائياً من مواد هذا الصف/التشعيب)</span>
        <span style={{ fontSize: 11 }}>{expanded ? '🔼 إخفاء' : '🔽 عرض'}</span>
      </button>

      {expanded ? (
        <div
          style={{
            marginBottom: 14,
            padding: 10,
            borderRadius: BRAND.radiusSm,
            background: 'rgba(140,20,40,0.04)',
            border: `1px solid ${BRAND.border}`,
            display: 'grid',
            gap: 6,
          }}
        >
          {pkg.subjects.length === 0 ? (
            <span style={{ fontSize: 12, color: BRAND.sub }}>
              لا توجد مواد مطابقة لهذا الصف/التشعيب بعد.
            </span>
          ) : (
            pkg.subjects.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  color: BRAND.text,
                  fontWeight: BRAND.weightSemibold,
                }}
              >
                <span>{s.icon || '📚'}</span>
                <span>{s.name}</span>
              </div>
            ))
          )}
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="secondary" size="sm" fullWidth onClick={() => onEdit(pkg)}>
          ✏️ تعديل
        </Button>
        <Button variant="danger" size="sm" disabled={deleting} onClick={() => onDelete(pkg)}>
          🗑️
        </Button>
      </div>
    </div>
  )
}
