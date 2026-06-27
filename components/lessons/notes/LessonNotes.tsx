'use client'

import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'
import { useLessonNote } from '@/hooks/useLessonNote'

type Props = {
  lessonId: string
}

export default function LessonNotes({ lessonId }: Props) {
  const {
    content,
    updateContent,
    loading,
    saving,
    deleting,
    message,
    hasExisting,
    dirty,
    save,
    remove,
  } = useLessonNote(lessonId)

  async function handleDelete() {
    if (!confirm('هل تريد حذف ملاحظتك على هذا الدرس؟')) return
    await remove()
  }

  return (
    <div style={{ direction: 'rtl', fontFamily: BRAND.fontBody }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <h3 style={{ fontSize: 16, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: BRAND.text, margin: 0 }}>
          🔒 ملاحظاتي الخاصة
        </h3>
        <span style={{ fontSize: 11, color: BRAND.sub }}>(لا يراها أحد سواك)</span>
      </div>

      {loading ? (
        <p style={{ color: BRAND.sub, fontSize: 14 }}>⏳ جارٍ التحميل...</p>
      ) : (
        <>
          <textarea
            value={content}
            onChange={e => updateContent(e.target.value)}
            placeholder="اكتب ملاحظاتك الخاصة على هذا الدرس — لن يراها معلمك أو أي شخص آخر..."
            rows={6}
            maxLength={5000}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: BRAND.radiusMd,
              border: `1px solid ${BRAND.border}`,
              fontFamily: BRAND.fontBody,
              fontSize: 14,
              marginBottom: 8,
              resize: 'vertical',
              background: BRAND.bgCard,
              color: BRAND.text,
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: BRAND.sub }}>{content.length}/5000</span>
            {dirty && <span style={{ fontSize: 12, color: BRAND.orange, fontWeight: BRAND.weightBold }}>● تعديلات غير محفوظة</span>}
          </div>

          {message && (
            <p style={{ fontSize: 13, fontWeight: BRAND.weightBold, color: message.startsWith('❌') ? BRAND.crimson : BRAND.gold, marginBottom: 10 }}>
              {message}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            {hasExisting && (
              <Button variant="danger" disabled={deleting} onClick={handleDelete}>
                {deleting ? '⏳ جارٍ الحذف...' : '🗑️ حذف الملاحظة'}
              </Button>
            )}
            <Button variant="primary" fullWidth disabled={saving || !dirty} onClick={save}>
              {saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ الملاحظة'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
