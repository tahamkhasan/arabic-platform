'use client'

import type { CSSProperties } from 'react'
import { BRAND } from '@/lib/constants/theme'
import type { TeacherTab } from '@/lib/teacher/teacher.types'

export function TeacherTabsBar({
  tabs,
  activeTab,
  onChange,
  ghostBtn,
  onOpenQuizzes,
  sectionCard,
}: {
  tabs: Array<{
    id: TeacherTab
    label: string
    icon: string
    badge?: number
  }>
  activeTab: TeacherTab
  onChange: (tab: TeacherTab) => void
  ghostBtn: (active?: boolean) => CSSProperties
  onOpenQuizzes: () => void
  sectionCard: CSSProperties
}) {
  return (
    <section style={{ ...sectionCard, padding: 14, marginBottom: 18 }}>
      <div className="teacher-tabs-strip">
        {tabs.map(tb => (
          <button
            key={tb.id}
            type="button"
            onClick={() => onChange(tb.id)}
            style={{
              position: 'relative',
              ...ghostBtn(activeTab === tb.id),
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              paddingInline: 16,
            }}
          >
            <span>{tb.icon}</span>
            <span>{tb.label}</span>
            {typeof tb.badge === 'number' && tb.badge > 0 ? (
              <span
                style={{
                  background: BRAND.crimson,
                  color: '#fff',
                  minWidth: 18,
                  height: 18,
                  borderRadius: 999,
                  padding: '0 5px',
                  fontSize: 10,
                  fontWeight: 900,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {tb.badge}
              </span>
            ) : null}
          </button>
        ))}

        <button type="button" onClick={onOpenQuizzes} style={ghostBtn(false)}>
          🧪 بنك الاختبارات
        </button>
      </div>
    </section>
  )
}