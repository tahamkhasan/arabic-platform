'use client'

import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'
import { useLessonQuiz } from '@/hooks/useLessonQuiz'
import QuestionEditor from '@/components/lessons/quiz/QuestionEditor'

type LessonForQuiz = {
  id: string
  name: string
  content?: string | null
  grade?: string | null
}

type Props = {
  lesson: LessonForQuiz
  onClose: () => void
}

export default function LessonQuizManager({ lesson, onClose }: Props) {
  const {
    title,
    setTitle,
    questions,
    loading,
    generating,
    saving,
    deleting,
    message,
    hasExisting,
    generate,
    addBlankQuestion,
    updateQuestion,
    removeQuestion,
    save,
    remove,
  } = useLessonQuiz({
    lessonId: lesson.id,
    lessonName: lesson.name,
    lessonContent: lesson.content,
    grade: lesson.grade,
  })

  async function handleSave() {
    const ok = await save()
    if (ok) setTimeout(onClose, 900)
  }

  async function handleDelete() {
    if (!confirm('هل تريد حذف اختبار هذا الدرس؟')) return
    await remove()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(31,18,21,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: 16,
      }}
    >
      <div
        style={{
          background: BRAND.bgSoft,
          borderRadius: BRAND.radiusXl,
          width: '100%',
          maxWidth: 720,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 24,
          direction: 'rtl',
          fontFamily: BRAND.fontBody,
          boxShadow: BRAND.shadow,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontFamily: BRAND.fontHeading, fontWeight: BRAND.weightBlack, color: BRAND.text }}>
              🎯 اختبار الدرس
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: BRAND.sub }}>{lesson.name}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: BRAND.sub, padding: '40px 0' }}>⏳ جارٍ التحميل...</p>
        ) : (
          <>
            <Button variant="primary" fullWidth onClick={() => generate()} disabled={generating}>
              {generating ? '⏳ جارٍ التوليد بالذكاء الاصطناعي...' : '✨ توليد تلقائي بالذكاء الاصطناعي'}
            </Button>

            <div style={{ height: 18 }} />

            {questions.length > 0 && (
              <>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="عنوان الاختبار (اختياري)"
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: BRAND.radiusSm,
                    border: `1px solid ${BRAND.border}`,
                    fontFamily: BRAND.fontBody,
                    fontSize: 14,
                    marginBottom: 16,
                    fontWeight: BRAND.weightBold,
                    color: BRAND.text,
                    background: BRAND.bgCard,
                  }}
                />

                {questions.map((q, i) => (
                  <QuestionEditor
                    key={q.id}
                    index={i}
                    question={q}
                    onChange={patch => updateQuestion(q.id, patch)}
                    onRemove={() => removeQuestion(q.id)}
                  />
                ))}
              </>
            )}

            <button
              type="button"
              onClick={addBlankQuestion}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: BRAND.radiusMd,
                border: `1px dashed ${BRAND.borderStrong}`,
                background: 'transparent',
                color: BRAND.sub,
                fontWeight: BRAND.weightBold,
                fontSize: 14,
                cursor: 'pointer',
                marginBottom: 18,
                fontFamily: BRAND.fontBody,
              }}
            >
              ➕ إضافة سؤال يدوياً
            </button>

            {message && (
              <p
                style={{
                  textAlign: 'center',
                  fontSize: 14,
                  fontWeight: BRAND.weightBold,
                  color: message.startsWith('❌') ? BRAND.crimson : BRAND.gold,
                  marginBottom: 14,
                }}
              >
                {message}
              </p>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              {hasExisting && (
                <Button variant="danger" disabled={deleting} onClick={handleDelete}>
                  {deleting ? '⏳ جارٍ الحذف...' : '🗑️ حذف الاختبار'}
                </Button>
              )}
              <Button
                variant="primary"
                fullWidth
                disabled={saving || questions.length === 0}
                onClick={handleSave}
              >
                {saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ اختبار الدرس'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
