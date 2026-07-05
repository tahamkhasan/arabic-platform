'use client'

import type { CSSProperties } from 'react'
import { BRAND } from '@/lib/constants/theme'
import type { UITheme } from '../teacher.types'
import { SectionTitle } from '../ui/SectionTitle'
import { EmptyState } from '../ui/EmptyState'
import { SubmissionCard } from '../cards/SubmissionCard'

export function SubmissionsSection({
  ui,
  sectionCard,
  smallCard,
  ghostBtn,
  submissions,
  pendingReviews,
  setOpenSub,
  setTGrade,
  setTFeedback,
}: {
  ui: UITheme
  sectionCard: CSSProperties
  smallCard: CSSProperties
  ghostBtn: (active?: boolean) => CSSProperties
  submissions: any[]
  pendingReviews: number
  setOpenSub: (sub: any) => void
  setTGrade: (value: string) => void
  setTFeedback: (value: string) => void
}) {
  return (
    <section className="fade-in" style={{ ...sectionCard, padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <SectionTitle icon="📬" title="الإجابات المرسلة" ui={ui} margin={0} />
        {pendingReviews > 0 ? (
          <span
            style={{
              fontSize: 12,
              background: BRAND.orange,
              color: '#fff',
              padding: '4px 10px',
              borderRadius: 999,
              fontWeight: 800,
            }}
          >
            {pendingReviews} بانتظار المراجعة
          </span>
        ) : null}
      </div>

      {submissions.length === 0 ? (
        <EmptyState
          icon="📬"
          title="لا توجد إجابات بعد"
          sub="ستظهر إجابات الطلاب هنا عند التسليم."
          cardBg={ui.panelStrong}
          borderCol={ui.border}
          textCol={ui.text}
          subCol={ui.sub}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {submissions.map((sub: any) => (
            <SubmissionCard
              key={sub.id}
              sub={sub}
              ui={ui}
              cardStyle={smallCard}
              ghostBtn={ghostBtn}
              onOpen={current => {
                setOpenSub(current)
                setTGrade(String(current.teacher_grade ?? current.ai_grade ?? ''))
                setTFeedback(current.teacher_feedback ?? current.ai_feedback ?? '')
              }}
            />
          ))}
        </div>
      )}
    </section>
  )
}