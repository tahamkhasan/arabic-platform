'use client'

import type { CSSProperties } from 'react'
import type { UITheme } from '../teacher.types'
import { SectionTitle } from '../ui/SectionTitle'
import { LoadingBlock } from '../ui/LoadingBlock'
import { EmptyState } from '../ui/EmptyState'
import { ClassCard } from '../cards/ClassCard'

export function ClassesSection({
  ui,
  sectionCard,
  smallCard,
  primaryBtn,
  accessToken,
  classes,
  onOpenNewClass,
  openClassDetail,
}: {
  ui: UITheme
  sectionCard: CSSProperties
  smallCard: CSSProperties
  primaryBtn: (enabled?: boolean) => CSSProperties
  accessToken: string | null | undefined
  classes: any[]
  onOpenNewClass: () => void
  openClassDetail: (id: string) => void
}) {
  return (
    <section className="fade-in" style={{ ...sectionCard, padding: 22 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <SectionTitle icon="🏫" title={`الفصول (${classes.length})`} ui={ui} margin={0} />
        <button type="button" onClick={onOpenNewClass} style={primaryBtn(true)}>
          ＋ فصل جديد
        </button>
      </div>

      {!accessToken ? (
        <LoadingBlock text="جارٍ التحقق من الجلسة..." sub={ui.sub} />
      ) : classes.length === 0 ? (
        <EmptyState
          icon="🏫"
          title="لا توجد فصول بعد"
          sub="أنشئ أول فصل لبدء تنظيم الطلاب والمهام."
          cardBg={ui.panelStrong}
          borderCol={ui.border}
          textCol={ui.text}
          subCol={ui.sub}
        />
      ) : (
        <div className="teacher-cards-grid">
          {classes.map((g: any) => (
            <ClassCard key={g.id} item={g} ui={ui} cardStyle={smallCard} onOpen={openClassDetail} />
          ))}
        </div>
      )}
    </section>
  )
}