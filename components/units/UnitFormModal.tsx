'use client'
import type { UnitFormState, UnitItem } from '@/types/units'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: BRAND.radiusSm,
  border: `1.5px solid ${BRAND.border}`,
  background: 'rgba(140,20,40,0.04)',
  color: BRAND.text,
  fontSize: 14,
  fontFamily: 'inherit',
}

export default function UnitFormModal({
  open,
  form,
  editingUnit,
  saving,
  deleting,
  onClose,
  onSubmit,
  onChange,
}: {
  open: boolean
  form: UnitFormState
  editingUnit: UnitItem | null
  saving: boolean
  deleting: boolean
  onClose: () => void
  onSubmit: () => void
  onChange: <K extends keyof UnitFormState>(key: K, value: UnitFormState[K]) => void
}) {
  if (!open) return null

  const canSubmit = !saving && form.name.trim().length > 0

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(31,18,21,0.55)',
        backdropFilter: 'blur(6px)',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: BRAND.bgSoft,
          borderRadius: BRAND.radiusXl,
          border: `1.5px solid ${BRAND.border}`,
          padding: 24,
          boxShadow: BRAND.shadow,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: BRAND.text, margin: 0 }}>
            {editingUnit ? '✏️ تعديل وحدة' : '➕ وحدة جديدة'}
          </h2>
          <Button variant="ghost" size="sm" disabled={saving || deleting} onClick={onClose}>✕</Button>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 90px', gap: 10 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: BRAND.sub, display: 'block', marginBottom: 6 }}>
                اسم الوحدة *
              </label>
              <input
                value={form.name}
                onChange={(e) => onChange('name', e.target.value)}
                placeholder="مثال: الوحدة الأولى — النعت"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: BRAND.sub, display: 'block', marginBottom: 6 }}>
                أيقونة
              </label>
              <input
                value={form.icon}
                onChange={(e) => onChange('icon', e.target.value)}
                placeholder="📖"
                style={{ ...inputStyle, textAlign: 'center', fontSize: 18 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: BRAND.sub, display: 'block', marginBottom: 6 }}>
                الترتيب
              </label>
              <input
                type="number"
                min={1}
                value={form.order_num}
                onChange={(e) => onChange('order_num', Number(e.target.value) || 1)}
                style={{ ...inputStyle, textAlign: 'center' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: BRAND.sub, display: 'block', marginBottom: 6 }}>
              وصف الوحدة
            </label>
            <textarea
              value={form.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="وصف مختصر لمحتوى الوحدة"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: BRAND.weightBold, color: BRAND.text }}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => onChange('is_active', e.target.checked)}
            />
            الوحدة نشطة
          </label>
        </div>

        <div style={{ marginTop: 20 }}>
          <Button variant="primary" fullWidth disabled={!canSubmit} onClick={onSubmit}>
            {saving ? 'جارٍ الحفظ...' : editingUnit ? 'حفظ التعديلات' : 'إنشاء الوحدة'}
          </Button>
        </div>
      </div>
    </div>
  )
}
