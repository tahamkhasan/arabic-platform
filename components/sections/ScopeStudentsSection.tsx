'use client'

import type { CSSProperties } from 'react'
import type { UITheme } from '../teacher.types'
import { SectionTitle } from '../ui/SectionTitle'
import { LoadingBlock } from '../ui/LoadingBlock'
import { EmptyState } from '../ui/EmptyState'

export function ScopeStudentsSection({
  ui,
  sectionCard,
  smallCard,
  scopeGroupsLoading,
  scopeGroups,
}: {
  ui: UITheme
  sectionCard: CSSProperties
  smallCard: CSSProperties
  scopeGroupsLoading: boolean
  scopeGroups: any[]
}) {
  return (
    <section className="fade-in" style={{ ...sectionCard, padding: 22 }}>
      <SectionTitle icon="👥" title="طلابي حسب النطاق" ui={ui} />
      <p style={{ fontSize: 13, color: ui.sub, marginBottom: 20 }}>
        استعراض الطلاب الموزعين حسب المرحلة والصف والمسار والمادة.
      </p>

      {scopeGroupsLoading ? (
        <LoadingBlock text="جارٍ تحميل مجموعات الطلاب..." sub={ui.sub} />
      ) : scopeGroups.length === 0 ? (
        <EmptyState
          icon="👥"
          title="لا توجد مجموعات ظاهرة"
          sub="لم يتم العثور على طلاب ضمن نطاقك الحالي."
          cardBg={ui.panelStrong}
          borderCol={ui.border}
          textCol={ui.text}
          subCol={ui.sub}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {scopeGroups.map((group: any) => (
            <div key={group.scope_id} style={{ ...smallCard, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: `1px solid ${ui.border}`,
                  background: `${ui.themeColor}08`,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 800, color: ui.text }}>
                  {group.stage_label} • الصف {group.grade}
                  {group.track_label ? ` • ${group.track_label}` : ''}
                </div>
                <div style={{ fontSize: 12, color: ui.sub, marginTop: 3 }}>
                  {group.subject_name ? group.subject_name : 'بلا مادة'} • {group.students.length} طالب
                </div>
              </div>

              {group.students.length === 0 ? (
                <p style={{ padding: '16px 18px', fontSize: 13, color: ui.sub, margin: 0 }}>
                  لا يوجد طلاب في هذه المجموعة.
                </p>
              ) : (
                <div>
                  {group.students.map((s: any, i: number) => (
                    <div
                      key={s.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 18px',
                        borderBottom: i < group.students.length - 1 ? `1px solid ${ui.border}` : 'none',
                      }}
                    >
                      <span style={{ fontSize: 16 }}>👤</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: ui.text }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: ui.sub }}>{s.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}