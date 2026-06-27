'use client'
import { useState } from 'react'
import type { SubjectFormState, SubjectItem, SubjectOffering } from '@/types/subjects'
import { STAGE_LABELS, GRADES_BY_STAGE, TRACK_LABELS, StageKey } from '@/lib/constants/stages'
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

export default function SubjectFormModal({
  open,
  form,
  editingSubject,
  saving,
  deleting,
  onClose,
  onSubmit,
  onChange,
}: {
  open: boolean
  form: SubjectFormState
  editingSubject: SubjectItem | null
  saving: boolean
  deleting: boolean
  onClose: () => void
  onSubmit: () => void
  onChange: <K extends keyof SubjectFormState>(key: K, value: SubjectFormState[K]) => void
}) {
  const [pickStage, setPickStage] = useState<StageKey>('secondary')
  const [pickGrade, setPickGrade] = useState('')
  const [pickTracks, setPickTracks] = useState<{ scientific: boolean; literary: boolean }>({
    scientific: false,
    literary: false,
  })

  if (!open) return null

  const needsTrack = pickGrade === '11' || pickGrade === '12'

  function addOffering() {
    if (!pickGrade) return

    const newOfferings: SubjectOffering[] = []

    if (needsTrack) {
      if (pickTracks.scientific) newOfferings.push({ stage: pickStage, grade: pickGrade, track: 'scientific' })
      if (pickTracks.literary) newOfferings.push({ stage: pickStage, grade: pickGrade, track: 'literary' })
      if (newOfferings.length === 0) return
    } else {
      newOfferings.push({ stage: pickStage, grade: pickGrade, track: null })
    }

    const merged = [...form.offerings]
    for (const o of newOfferings) {
      const dup = merged.some((e) => e.stage === o.stage && e.grade === o.grade && e.track === o.track)
      if (!dup) merged.push(o)
    }

    onChange('offerings', merged)
    setPickGrade('')
    setPickTracks({ scientific: false, literary: false })
  }

  function removeOffering(index: number) {
    onChange('offerings', form.offerings.filter((_, i) => i !== index))
  }

  const canSubmit = !saving && form.name.trim() && form.offerings.length > 0

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
          maxWidth: 620,
          maxHeight: '92vh',
          overflowY: 'auto',
          background: BRAND.bgSoft,
          borderRadius: BRAND.radiusXl,
          border: `1.5px solid ${BRAND.border}`,
          padding: 24,
          boxShadow: BRAND.shadow,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: BRAND.text, margin: 0 }}>
            {editingSubject ? '✏️ تعديل مادة' : '➕ مادة جديدة'}
          </h2>
          <Button variant="ghost" size="sm" disabled={saving || deleting} onClick={onClose}>✕</Button>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 10 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: BRAND.sub, display: 'block', marginBottom: 6 }}>
                اسم المادة *
              </label>
              <input
                value={form.name}
                onChange={(e) => onChange('name', e.target.value)}
                placeholder="مثال: اللغة العربية"
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
                placeholder="📚"
                style={{ ...inputStyle, textAlign: 'center', fontSize: 20 }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: BRAND.sub, display: 'block', marginBottom: 6 }}>
              تعريف بالمادة
            </label>
            <textarea
              value={form.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="وصف مختصر يظهر للطالب والمعلم"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: BRAND.sub, display: 'block', marginBottom: 6 }}>
              محتوى المادة وفصولها
            </label>
            <textarea
              value={form.content_overview}
              onChange={(e) => onChange('content_overview', e.target.value)}
              placeholder="نظرة عامة على فصول ومحاور المادة"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: BRAND.sub, display: 'block', marginBottom: 6 }}>
              المنهج (يظهر للطالب عند دخول الوحدات)
            </label>
            <textarea
              value={form.curriculum}
              onChange={(e) => onChange('curriculum', e.target.value)}
              placeholder="منهج الفصل الدراسي لهذه المادة"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: BRAND.sub, display: 'block', marginBottom: 6 }}>
              فيديو تعريفي بمعلم المادة (رابط)
            </label>
            <input
              value={form.teacher_intro_video_url}
              onChange={(e) => onChange('teacher_intro_video_url', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: BRAND.weightBold, color: BRAND.text }}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => onChange('is_active', e.target.checked)}
            />
            المادة نشطة
          </label>

          {/* ── منتقي المرحلة/الصف/التشعيب ── */}
          <div
            style={{
              padding: 16,
              borderRadius: BRAND.radiusMd,
              background: 'rgba(140,20,40,0.05)',
              border: `1px solid ${BRAND.border}`,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: BRAND.weightBlack, color: BRAND.text, marginBottom: 12 }}>
              📍 المراحل والصفوف — أضف عرضاً واحداً أو أكثر
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: BRAND.sub, display: 'block', marginBottom: 4 }}>المرحلة</label>
                <select
                  value={pickStage}
                  onChange={(e) => {
                    setPickStage(e.target.value as StageKey)
                    setPickGrade('')
                  }}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {(Object.keys(STAGE_LABELS) as StageKey[]).map((s) => (
                    <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: BRAND.sub, display: 'block', marginBottom: 4 }}>الصف</label>
                <select
                  value={pickGrade}
                  onChange={(e) => setPickGrade(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">اختر الصف</option>
                  {GRADES_BY_STAGE[pickStage]?.map((g) => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {needsTrack ? (
              <div style={{ display: 'flex', gap: 14, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: BRAND.text, fontWeight: BRAND.weightBold }}>
                  <input
                    type="checkbox"
                    checked={pickTracks.scientific}
                    onChange={(e) => setPickTracks((p) => ({ ...p, scientific: e.target.checked }))}
                  />
                  علمي
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: BRAND.text, fontWeight: BRAND.weightBold }}>
                  <input
                    type="checkbox"
                    checked={pickTracks.literary}
                    onChange={(e) => setPickTracks((p) => ({ ...p, literary: e.target.checked }))}
                  />
                  أدبي
                </label>
                <span style={{ fontSize: 11, color: BRAND.sub }}>(حدّد الاثنين لمادة مشتركة بين التشعيبين)</span>
              </div>
            ) : null}

            <Button
              variant="primary"
              size="sm"
              disabled={!pickGrade || (needsTrack && !pickTracks.scientific && !pickTracks.literary)}
              onClick={addOffering}
            >
              ＋ إضافة هذا العرض
            </Button>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              {form.offerings.length === 0 ? (
                <span style={{ fontSize: 12, color: BRAND.sub }}>لم تُضف أي مرحلة/صف بعد.</span>
              ) : (
                form.offerings.map((o, i) => (
                  <span
                    key={i}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      padding: '5px 10px',
                      borderRadius: BRAND.radiusPill,
                      background: '#fff',
                      border: `1px solid ${BRAND.border}`,
                      color: BRAND.text,
                      fontWeight: BRAND.weightBold,
                    }}
                  >
                    {o.stage} • الصف {o.grade}
                    {o.track ? ` • ${TRACK_LABELS[o.track] || o.track}` : ''}
                    <button
                      type="button"
                      onClick={() => removeOffering(i)}
                      style={{ background: 'none', border: 'none', color: BRAND.crimson, cursor: 'pointer', fontSize: 13, padding: 0 }}
                    >
                      ✕
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          fullWidth
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          {saving ? 'جارٍ الحفظ...' : editingSubject ? 'حفظ التعديلات' : 'إنشاء المادة'}
        </Button>
      </div>
    </div>
  )
}
