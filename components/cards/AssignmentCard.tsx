'use client'

import type { CSSProperties } from 'react'
import { fmtDateShort } from '@/lib/teacher/teacher.utils'
import type { UITheme } from '../teacher.types'

export function AssignmentCard({
  assignment,
  ui,
  cardStyle,
}: {
  assignment: any
  ui: UITheme
  cardStyle: CSSProperties
}) {
  return (
    <div style={{ ...cardStyle, padding: '14px 16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: ui.text }}>{assignment.title}</div>
          <div style={{ fontSize: 12, color: ui.sub, marginTop: 4 }}>
            🎯 {assignment.quiz_title || 'اختبار'} • {assignment.questions_count ?? 0} سؤال
            {assignment.due_date && ` • ⏰ ${fmtDateShort(assignment.due_date)}`}
          </div>
        </div>

        <span
          style={{
            fontSize: 11,
            color: ui.themeColor,
            background: `${ui.themeColor}14`,
            padding: '4px 10px',
            borderRadius: 999,
            fontWeight: 700,
          }}
        >
          {fmtDateShort(assignment.created_at)}
        </span>
      </div>

      {assignment.description ? (
        <p style={{ fontSize: 13, color: ui.sub, margin: '10px 0 0', lineHeight: 1.8 }}>
          {assignment.description}
        </p>
      ) : null}
    </div>
  )
}