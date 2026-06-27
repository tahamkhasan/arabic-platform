'use client'
import type { RoleItem } from '@/types/roles'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'

type Props = {
  role: RoleItem
  deleting: boolean
  onEdit: (role: RoleItem) => void
  onDelete: (role: RoleItem) => void
}

export default function RoleCard({ role, deleting, onEdit, onDelete }: Props) {
  const isActive = role.is_active !== false

  return (
    <div
      style={{
        background: BRAND.bgSoft,
        borderRadius: BRAND.radiusLg,
        border: `1.5px solid ${BRAND.border}`,
        boxShadow: BRAND.shadow,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        fontFamily: BRAND.fontBody,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: BRAND.weightBlack,
              fontFamily: BRAND.fontHeading,
              color: BRAND.text,
              marginBottom: 6,
            }}
          >
            {role.name}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 11,
                padding: '5px 8px',
                borderRadius: BRAND.radiusPill,
                background: 'rgba(140,20,40,0.07)',
                color: BRAND.crimson,
                fontWeight: BRAND.weightBold,
              }}
            >
              {role.key}
            </span>

            <span
              style={{
                fontSize: 11,
                padding: '5px 8px',
                borderRadius: BRAND.radiusPill,
                background: isActive ? 'rgba(220,140,60,0.12)' : 'rgba(140,20,40,0.08)',
                color: isActive ? BRAND.gold : BRAND.crimson,
                fontWeight: BRAND.weightBold,
              }}
            >
              {isActive ? 'نشط' : 'غير نشط'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 13, color: BRAND.sub, lineHeight: 1.9, minHeight: 46 }}>
        {role.description || 'لا يوجد وصف مسجل لهذا الدور.'}
      </div>

      <div>
        <div style={{ fontSize: 12, color: BRAND.text, fontWeight: BRAND.weightBlack, marginBottom: 8 }}>
          الصلاحيات
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(role.permissions || []).length > 0 ? (
            (role.permissions || []).map((perm: string) => (
              <span
                key={perm}
                style={{
                  fontSize: 11,
                  padding: '6px 9px',
                  borderRadius: BRAND.radiusPill,
                  background: 'rgba(140,20,40,0.08)',
                  color: BRAND.crimson,
                  fontWeight: BRAND.weightBold,
                }}
              >
                {perm}
              </span>
            ))
          ) : (
            <span style={{ fontSize: 12, color: BRAND.sub }}>لا توجد صلاحيات مسجلة.</span>
          )}
        </div>
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Button variant="secondary" fullWidth onClick={() => onEdit(role)}>
          تعديل
        </Button>
        <Button variant="danger" fullWidth disabled={deleting} onClick={() => onDelete(role)}>
          حذف
        </Button>
      </div>
    </div>
  )
}
