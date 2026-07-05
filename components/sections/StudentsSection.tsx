'use client'

import type { CSSProperties } from 'react'
import type { UITheme } from '../teacher.types'
import { SectionTitle } from '../ui/SectionTitle'
import { EmptyState } from '../ui/EmptyState'

export function StudentsSection({
  ui,
  sectionCard,
  smallCard,
  ghostBtn,
  students,
  onMessageStudent,
}: {
  ui: UITheme
  sectionCard: CSSProperties
  smallCard: CSSProperties
  ghostBtn: (active?: boolean) => CSSProperties
  students: any[]
  onMessageStudent: (student: any) => void
}) {
  return (
    <section className="fade-in" style={{ ...sectionCard, padding: 22 }}>
      <SectionTitle icon="👤" title={`الطلاب (${students.length})`} ui={ui} />

      {students.length === 0 ? (
        <EmptyState
          icon="👤"
          title="لا يوجد طلاب"
          sub="ستظهر قائمة الطلاب هنا عند توفرها."
          cardBg={ui.panelStrong}
          borderCol={ui.border}
          textCol={ui.text}
          subCol={ui.sub}
        />
      ) : (
        <div className="teacher-cards-grid">
          {students.map((s: any) => (
            <div key={s.id} style={{ ...smallCard, padding: '16px 18px' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>👤</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: ui.text, marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: ui.sub, marginBottom: 8 }}>{s.email}</div>

              {s.allowed_grades?.length ? (
                <div style={{ fontSize: 12, color: ui.themeColor, fontWeight: 700 }}>{s.allowed_grades.join('، ')}</div>
              ) : null}

              <button
                type="button"
                onClick={() => onMessageStudent(s)}
                style={{ ...ghostBtn(true), width: '100%', marginTop: 12 }}
              >
                💬 مراسلة الطالب
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}