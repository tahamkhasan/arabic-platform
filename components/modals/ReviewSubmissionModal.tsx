'use client'

import type { CSSProperties } from 'react'
import { fmtDateTime } from '@/lib/teacher/teacher.utils'
import { Banner } from '../ui/Banner'
import { Field } from '../ui/Field'
import { BaseModal } from './BaseModal'
import type { UITheme } from '../teacher.types'

export function ReviewSubmissionModal({
  ui,
  openSub,
  onClose,
  reviewDone,
  reviewing,
  tGrade,
  setTGrade,
  tFeedback,
  setTFeedback,
  submitReview,
  smallCard,
  inputStyle,
  primaryBtn,
  ghostBtn,
}: {
  ui: UITheme
  openSub: any
  onClose: () => void
  reviewDone: boolean
  reviewing: boolean
  tGrade: string
  setTGrade: (value: string) => void
  tFeedback: string
  setTFeedback: (value: string) => void
  submitReview: () => void
  smallCard: CSSProperties
  inputStyle: CSSProperties
  primaryBtn: (enabled?: boolean) => CSSProperties
  ghostBtn: (active?: boolean) => CSSProperties
}) {
  if (!openSub) return null

  return (
    <BaseModal
      ui={ui}
      title={`مراجعة إجابة ${openSub.users?.name ?? 'طالب'}`}
      subtitle={fmtDateTime(openSub.submitted_at)}
      onClose={onClose}
      maxWidth={760}
      headerActions={
        <button type="button" onClick={onClose} style={ghostBtn(false)}>
          إغلاق
        </button>
      }
    >
      {reviewDone ? <Banner type="success" ui={ui} text="تم حفظ المراجعة بنجاح." /> : null}

      <div
        style={{
          ...smallCard,
          padding: 16,
          marginBottom: 16,
          lineHeight: 1.9,
          color: ui.text,
          whiteSpace: 'pre-wrap',
        }}
      >
        {openSub.answer_text}
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        <Field label="درجة المعلم" sub={ui.sub}>
          <input
            value={tGrade ?? ''}
            onChange={e => setTGrade(e.target.value)}
            inputMode="numeric"
            placeholder="أدخل الدرجة"
            style={inputStyle}
          />
        </Field>

        <Field label="تغذية راجعة" sub={ui.sub}>
          <textarea
            value={tFeedback ?? ''}
            onChange={e => setTFeedback(e.target.value)}
            placeholder="اكتب ملاحظاتك للطالب"
            style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
          />
        </Field>

        <button type="button" onClick={submitReview} disabled={reviewing} style={primaryBtn(true)}>
          {reviewing ? 'جارٍ الحفظ...' : '💾 حفظ المراجعة'}
        </button>
      </div>
    </BaseModal>
  )
}