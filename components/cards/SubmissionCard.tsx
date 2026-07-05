'use client'

import type { CSSProperties } from 'react'
import { BRAND } from '@/lib/constants/theme'
import { fmtDateTime } from '@/lib/teacher/teacher.utils'
import type { UITheme } from '../teacher.types'

export function SubmissionCard({
  sub,
  ui,
  cardStyle,
  ghostBtn,
  onOpen,
}: {
  sub: any
  ui: UITheme
  cardStyle: CSSProperties
  ghostBtn: (active?: boolean) => CSSProperties
  onOpen: (sub: any) => void
}) {
  const isPending =
    sub.status === 'submitted' && (sub.teacher_grade === null || sub.teacher_grade === undefined)

  return (
    <div
      style={{
        ...cardStyle,
        padding: '16px 18px',
        borderColor: isPending ? ui.warnBorder : ui.border,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 10,
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: ui.text }}>{sub.users?.name ?? 'طالب'}</div>
          <div style={{ fontSize: 12, color: ui.sub, marginTop: 3 }}>{fmtDateTime(sub.submitted_at)}</div>
        </div>

        <div style={{ textAlign: 'left' }}>
          {sub.ai_grade !== null && sub.ai_grade !== undefined ? (
            <div style={{ fontSize: 12, color: ui.themeColor, fontWeight: 700 }}>AI: {sub.ai_grade}</div>
          ) : null}

          {sub.teacher_grade !== null && sub.teacher_grade !== undefined ? (
            <div style={{ fontSize: 13, color: BRAND.gold, fontWeight: 800 }}>المعلم: {sub.teacher_grade}</div>
          ) : null}

          {isPending ? (
            <div style={{ fontSize: 12, color: BRAND.orange, fontWeight: 700 }}>بانتظار المراجعة</div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          padding: '10px 12px',
          borderRadius: 12,
          background: ui.inputBg,
          border: `1px solid ${ui.border}`,
          marginBottom: 12,
          fontSize: 13,
          color: ui.sub,
          lineHeight: 1.7,
        }}
      >
        {(sub.answer_text ?? '').slice(0, 150)}
        {(sub.answer_text ?? '').length > 150 ? '...' : ''}
      </div>

      <button
        type="button"
        onClick={() => onOpen(sub)}
        style={{
          ...ghostBtn(isPending),
          color: isPending ? '#fff' : ui.themeColor,
          background: isPending ? ui.gradMain : `${ui.themeColor}10`,
          borderWidth: 0,
          borderStyle: 'solid',
          borderColor: 'transparent',
        }}
      >
        {isPending ? '📝 مراجعة الآن' : '👁️ عرض المراجعة'}
      </button>
    </div>
  )
}