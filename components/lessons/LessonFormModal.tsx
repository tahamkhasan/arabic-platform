'use client'
import { useRef, useState } from 'react'
import type { LessonFormState, LessonItem } from '@/types/lessons'
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

export default function LessonFormModal({
  open,
  form,
  editingLesson,
  saving,
  deleting,
  onClose,
  onSubmit,
  onChange,
}: {
  open: boolean
  form: LessonFormState
  editingLesson: LessonItem | null
  saving: boolean
  deleting: boolean
  onClose: () => void
  onSubmit: () => void
  onChange: <K extends keyof LessonFormState>(key: K, value: LessonFormState[K]) => void
}) {
  const videoFileRef = useRef<HTMLInputElement>(null)
  const filesRef = useRef<HTMLInputElement>(null)
  const [videoMode, setVideoMode] = useState<'link' | 'upload'>('link')

  if (!open) return null

  const canSubmit = !saving && form.name.trim().length > 0

  function removeExistingFile(url: string) {
    onChange('existingFileUrls', form.existingFileUrls.filter((u) => u !== url))
  }

  function removeNewFile(index: number) {
    onChange('newFiles', form.newFiles.filter((_, i) => i !== index))
  }

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
          maxWidth: 600,
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
            {editingLesson ? '✏️ تعديل درس' : '➕ درس جديد'}
          </h2>
          <Button variant="ghost" size="sm" disabled={saving || deleting} onClick={onClose}>✕</Button>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 10 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: BRAND.sub, display: 'block', marginBottom: 6 }}>
                اسم الدرس *
              </label>
              <input
                value={form.name}
                onChange={(e) => onChange('name', e.target.value)}
                placeholder="مثال: النعت وأنواعه"
                style={inputStyle}
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
              وصف مختصر
            </label>
            <textarea
              value={form.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="وصف مختصر للدرس"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: BRAND.sub, display: 'block', marginBottom: 6 }}>
              محتوى الدرس (نصّي)
            </label>
            <textarea
              value={form.content}
              onChange={(e) => onChange('content', e.target.value)}
              placeholder="المادة العلمية الكاملة للدرس"
              rows={6}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
            />
          </div>

          {/* ── الفيديو — تينت ذهبي بدل الأخضر ── */}
          <div
            style={{
              padding: 16,
              borderRadius: BRAND.radiusMd,
              background: 'rgba(220,140,60,0.05)',
              border: '1px solid rgba(220,140,60,0.16)',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: BRAND.weightBlack, color: BRAND.text, marginBottom: 10 }}>
              🎬 فيديو الدرس
            </div>

            {form.currentVideoUrl && !form.removeVideo ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: BRAND.radiusSm,
                  background: '#fff',
                  border: `1px solid ${BRAND.border}`,
                  marginBottom: 10,
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 13, color: BRAND.gold, fontWeight: BRAND.weightBold }}>
                  ✅ يوجد فيديو مرفوع حالياً
                </span>
                <button
                  type="button"
                  onClick={() => onChange('removeVideo', true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: BRAND.crimson,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: BRAND.weightBold,
                  }}
                >
                  🗑️ إزالة
                </button>
              </div>
            ) : form.removeVideo ? (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: BRAND.radiusSm,
                  background: 'rgba(140,20,40,0.06)',
                  color: BRAND.crimson,
                  fontSize: 12,
                  fontWeight: BRAND.weightBold,
                  marginBottom: 10,
                }}
              >
                سيُحذَف الفيديو الحالي عند الحفظ.
                <button
                  type="button"
                  onClick={() => onChange('removeVideo', false)}
                  style={{
                    marginRight: 10,
                    background: 'none',
                    border: 'none',
                    color: BRAND.crimson,
                    cursor: 'pointer',
                    fontWeight: BRAND.weightBold,
                    textDecoration: 'underline',
                  }}
                >
                  تراجع
                </button>
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <button
                type="button"
                onClick={() => setVideoMode('link')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 8,
                  border: `1.5px solid ${videoMode === 'link' ? BRAND.gold : BRAND.border}`,
                  background: videoMode === 'link' ? 'rgba(220,140,60,0.12)' : 'transparent',
                  color: videoMode === 'link' ? BRAND.gold : BRAND.sub,
                  fontWeight: BRAND.weightBold,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                🔗 رابط (يوتيوب/فيميو)
              </button>
              <button
                type="button"
                onClick={() => setVideoMode('upload')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 8,
                  border: `1.5px solid ${videoMode === 'upload' ? BRAND.gold : BRAND.border}`,
                  background: videoMode === 'upload' ? 'rgba(220,140,60,0.12)' : 'transparent',
                  color: videoMode === 'upload' ? BRAND.gold : BRAND.sub,
                  fontWeight: BRAND.weightBold,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                📁 رفع ملف فيديو
              </button>
            </div>

            {videoMode === 'link' ? (
              <input
                value={form.videoLink}
                onChange={(e) => onChange('videoLink', e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
              />
            ) : (
              <div>
                <input
                  ref={videoFileRef}
                  type="file"
                  accept="video/*"
                  style={{ display: 'none' }}
                  onChange={(e) => onChange('videoFile', e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => videoFileRef.current?.click()}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: BRAND.radiusSm,
                    border: `2px dashed ${BRAND.border}`,
                    background: 'transparent',
                    color: BRAND.sub,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontFamily: 'inherit',
                  }}
                >
                  {form.videoFile ? `✅ ${form.videoFile.name}` : '📁 اختر ملف فيديو'}
                </button>
              </div>
            )}
          </div>

          {/* ── الملفات المصاحبة — تينت قرمزي بدل الأزرق (ليس CTA) ── */}
          <div
            style={{
              padding: 16,
              borderRadius: BRAND.radiusMd,
              background: 'rgba(140,20,40,0.05)',
              border: `1px solid ${BRAND.border}`,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: BRAND.weightBlack, color: BRAND.text, marginBottom: 10 }}>
              📎 الملفات المصاحبة للفيديو
            </div>

            {form.existingFileUrls.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {form.existingFileUrls.map((url, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: '#fff',
                      border: `1px solid ${BRAND.border}`,
                      fontSize: 12,
                    }}
                  >
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: BRAND.crimson,
                        textDecoration: 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                      }}
                    >
                      📄 ملف {i + 1}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeExistingFile(url)}
                      style={{ background: 'none', border: 'none', color: BRAND.crimson, cursor: 'pointer', fontSize: 12 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {form.newFiles.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {form.newFiles.map((file, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(220,140,60,0.08)',
                      border: '1px solid rgba(220,140,60,0.25)',
                      fontSize: 12,
                      color: BRAND.gold,
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      ＋ {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeNewFile(i)}
                      style={{ background: 'none', border: 'none', color: BRAND.crimson, cursor: 'pointer', fontSize: 12 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <input
              ref={filesRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                const picked = Array.from(e.target.files || [])
                onChange('newFiles', [...form.newFiles, ...picked])
                if (filesRef.current) filesRef.current.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => filesRef.current?.click()}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: BRAND.radiusSm,
                border: `2px dashed ${BRAND.border}`,
                background: 'transparent',
                color: BRAND.sub,
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            >
              ＋ إضافة ملف مصاحب (PDF، صورة، Word...)
            </button>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: BRAND.weightBold, color: BRAND.text }}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => onChange('is_active', e.target.checked)}
            />
            الدرس نشط
          </label>
        </div>

        <div style={{ marginTop: 20 }}>
          <Button variant="primary" fullWidth disabled={!canSubmit} onClick={onSubmit}>
            {saving ? 'جارٍ الحفظ...' : editingLesson ? 'حفظ التعديلات' : 'إنشاء الدرس'}
          </Button>
        </div>
      </div>
    </div>
  )
}
