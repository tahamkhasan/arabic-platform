'use client'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'
import { STAGE_LABELS, GRADES_BY_STAGE, TRACK_LABELS, StageKey, TrackKey } from '@/lib/constants/stages'
import type { PackageItem, PackageFormState } from '@/types/packages'

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

function pillStyle(active: boolean): React.CSSProperties {
  return {
    padding: '8px 14px',
    borderRadius: 999,
    border: active ? `2px solid ${BRAND.crimson}` : `1px solid ${BRAND.border}`,
    background: active ? 'rgba(140,20,40,0.08)' : 'transparent',
    color: active ? BRAND.crimson : BRAND.text,
    fontWeight: BRAND.weightBold,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 13,
  }
}

export default function PackageFormModal({
  open,
  form,
  editingPackage,
  saving,
  onClose,
  onSubmit,
  onChange,
}: {
  open: boolean
  form: PackageFormState
  editingPackage: PackageItem | null
  saving: boolean
  onClose: () => void
  onSubmit: () => void
  onChange: <K extends keyof PackageFormState>(key: K, value: PackageFormState[K]) => void
}) {
  if (!open) return null

  const isEdit = Boolean(editingPackage)
  const needsTrack = form.grade === '11' || form.grade === '12'
  const canSubmit = !saving && form.name.trim().length > 0 && (isEdit || form.grade.length > 0)

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
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: BRAND.bgSoft,
          borderRadius: BRAND.radiusXl,
          border: `1.5px solid ${BRAND.border}`,
          padding: 24,
          boxShadow: BRAND.shadow,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: BRAND.weightBlack,
              fontFamily: BRAND.fontHeading,
              color: BRAND.text,
              margin: 0,
            }}
          >
            {isEdit ? '✏️ تعديل باقة' : '➕ باقة جديدة'}
          </h2>
          <Button variant="ghost" size="sm" disabled={saving} onClick={onClose}>
            ✕
          </Button>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: BRAND.sub, display: 'block', marginBottom: 6 }}>
              اسم الباقة *
            </label>
            <input
              value={form.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="مثال: باقة الثاني عشر الأدبي كاملة"
              style={inputStyle}
            />
          </div>

          {!isEdit && (
            <>
              <div>
                <label style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: BRAND.sub, display: 'block', marginBottom: 8 }}>
                  المرحلة
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(Object.keys(STAGE_LABELS) as StageKey[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        onChange('stage', s)
                        onChange('grade', '')
                        onChange('track', null)
                      }}
                      style={pillStyle(form.stage === s)}
                    >
                      {STAGE_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: BRAND.sub, display: 'block', marginBottom: 8 }}>
                  الصف
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {GRADES_BY_STAGE[form.stage as StageKey]?.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        onChange('grade', g.id)
                        onChange('track', null)
                      }}
                      style={pillStyle(form.grade === g.id)}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {needsTrack && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: BRAND.sub, display: 'block', marginBottom: 8 }}>
                    التشعيب
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(Object.keys(TRACK_LABELS) as TrackKey[]).map((t) => (
                      <button key={t} type="button" onClick={() => onChange('track', t)} style={pillStyle(form.track === t)}>
                        {TRACK_LABELS[t]}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: BRAND.sub, marginTop: 6 }}>
                    ستشمل الباقة هذا التشعيب + كل المواد المشتركة بين التشعيبين تلقائياً.
                  </p>
                </div>
              )}
            </>
          )}

          {isEdit && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: BRAND.radiusSm,
                background: 'rgba(140,20,40,0.05)',
                fontSize: 12,
                color: BRAND.sub,
                lineHeight: 1.7,
              }}
            >
              المرحلة/الصف/التشعيب غير قابلة للتعديل بعد الإنشاء — أنشئ باقة جديدة لتركيبة مختلفة.
            </div>
          )}

          <div>
            <label style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: BRAND.sub, display: 'block', marginBottom: 6 }}>
              وصف مختصر
            </label>
            <textarea
              value={form.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="وصف مختصر يظهر للمدير عند الإسناد"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {isEdit && (
            <label
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: BRAND.weightBold, color: BRAND.text }}
            >
              <input type="checkbox" checked={form.is_active} onChange={(e) => onChange('is_active', e.target.checked)} />
              الباقة نشطة
            </label>
          )}
        </div>

        <div style={{ marginTop: 20 }}>
          <Button variant="primary" fullWidth disabled={!canSubmit} onClick={onSubmit}>
            {saving ? 'جارٍ الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إنشاء الباقة'}
          </Button>
        </div>
      </div>
    </div>
  )
}
