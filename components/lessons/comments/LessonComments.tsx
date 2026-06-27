'use client'

import { useState } from 'react'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'
import { useLessonComments } from '@/hooks/useLessonComments'

type Props = {
  lessonId: string
  currentUserId: string
  currentUserRole: 'admin' | 'teacher' | 'student' | string
}

export default function LessonComments({ lessonId, currentUserId, currentUserRole }: Props) {
  const { items, loading, posting, error, addComment, deleteComment } = useLessonComments(lessonId)
  const [draft, setDraft] = useState('')

  const isStudent = currentUserRole === 'student'
  const isStaff = currentUserRole === 'admin' || currentUserRole === 'teacher'

  async function handleSubmit() {
    if (!draft.trim()) return
    const ok = await addComment(draft.trim())
    if (ok) setDraft('')
  }

  return (
    <div style={{ direction: 'rtl', fontFamily: BRAND.fontBody }}>
      <h3 style={{ fontSize: 16, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: BRAND.text, marginBottom: 10 }}>
        💬 التعليقات {isStaff ? '(كل الطلاب)' : ''}
      </h3>

      {loading ? (
        <p style={{ color: BRAND.sub, fontSize: 14 }}>⏳ جارٍ التحميل...</p>
      ) : items.length === 0 ? (
        <p style={{ color: BRAND.sub, fontSize: 14 }}>لا توجد تعليقات بعد.</p>
      ) : (
        <div style={{ marginBottom: 16 }}>
          {items.map(c => (
            <div
              key={c.id}
              style={{
                background: BRAND.bgSoft,
                border: `1px solid ${BRAND.border}`,
                borderRadius: BRAND.radiusMd,
                padding: '10px 14px',
                marginBottom: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <strong style={{ fontSize: 13, color: BRAND.crimson }}>
                  {isStaff ? c.student_name || 'طالب' : 'أنت'}
                </strong>
                {(c.student_id === currentUserId || currentUserRole === 'admin') && (
                  <button
                    type="button"
                    onClick={() => deleteComment(c.id)}
                    style={{ border: 'none', background: 'transparent', color: BRAND.crimson, fontSize: 12, cursor: 'pointer', fontFamily: BRAND.fontBody }}
                  >
                    🗑️ حذف
                  </button>
                )}
              </div>
              <p style={{ fontSize: 14, color: BRAND.text, margin: 0, lineHeight: 1.6 }}>{c.content}</p>
            </div>
          ))}
        </div>
      )}

      {error && <p style={{ color: BRAND.crimson, fontSize: 13, marginBottom: 10 }}>❌ {error}</p>}

      {isStudent && (
        <div>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="اكتب تعليقك أو سؤالك على الدرس..."
            rows={3}
            maxLength={2000}
            style={{
              width: '100%',
              padding: 10,
              borderRadius: BRAND.radiusSm,
              border: `1px solid ${BRAND.border}`,
              fontFamily: BRAND.fontBody,
              fontSize: 14,
              marginBottom: 8,
              resize: 'vertical',
              color: BRAND.text,
              background: BRAND.bgCard,
            }}
          />
          <Button variant="primary" size="sm" disabled={posting || !draft.trim()} onClick={handleSubmit}>
            {posting ? '⏳ جارٍ الإرسال...' : '📨 إرسال التعليق'}
          </Button>
        </div>
      )}
    </div>
  )
}
