'use client'

import type { CSSProperties } from 'react'
import { BRAND } from '@/lib/constants/theme'
import type { UITheme } from '../teacher.types'
import { SectionTitle } from '../ui/SectionTitle'
import { LoadingBlock } from '../ui/LoadingBlock'
import { EmptyState } from '../ui/EmptyState'

export function StatsSection({
  ui,
  sectionCard,
  smallCard,
  stats,
  statsLoading,
}: {
  ui: UITheme
  sectionCard: CSSProperties
  smallCard: CSSProperties
  stats: any
  statsLoading: boolean
}) {
  return (
    <section className="fade-in" style={{ ...sectionCard, padding: 22 }}>
      <SectionTitle icon="📊" title="التحليلات" ui={ui} />

      {statsLoading ? (
        <LoadingBlock text="جارٍ تحميل التحليلات..." sub={ui.sub} accent={ui.themeColor} />
      ) : !stats ? (
        <EmptyState
          icon="📊"
          title="لا توجد بيانات تحليلية"
          sub="ستظهر الإحصاءات عند توفر بيانات كافية."
          cardBg={ui.panelStrong}
          borderCol={ui.border}
          textCol={ui.text}
          subCol={ui.sub}
        />
      ) : (
        <>
          <div className="teacher-stats-top-grid">
            {[
              { icon: '👤', label: 'إجمالي الطلاب', value: stats.summary.totalStudents, color: BRAND.crimson },
              { icon: '📝', label: 'إجمالي المهام', value: stats.summary.totalAssignments, color: BRAND.orangeRed },
              { icon: '📬', label: 'إجمالي التسليمات', value: stats.summary.totalSubmissions, color: BRAND.gold },
              { icon: '⭐', label: 'متوسط الدرجات', value: stats.summary.avgGrade, color: BRAND.gold },
              { icon: '⏳', label: 'بانتظار المراجعة', value: stats.summary.pendingReview, color: BRAND.orange },
              { icon: '📈', label: 'معدل الاستجابة', value: `${stats.summary.responseRate}%`, color: BRAND.deep },
            ].map((card, i) => (
              <div
                key={i}
                style={{
                  ...smallCard,
                  padding: '16px 12px',
                  textAlign: 'center',
                  borderColor: `${card.color}28`,
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 6 }}>{card.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: card.color, marginBottom: 4 }}>{card.value}</div>
                <div style={{ fontSize: 11, color: ui.sub }}>{card.label}</div>
              </div>
            ))}
          </div>

          {stats.studentStats.length > 0 && (
            <div style={{ ...smallCard, marginBottom: 20, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: `1px solid ${ui.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 800, color: ui.text }}>أداء الطلاب</span>
                <span style={{ fontSize: 12, color: ui.sub }}>{stats.studentStats.length}</span>
              </div>

              <div>
                {stats.studentStats.map((s: any, i: number) => {
                  const gradeColor =
                    s.avgGrade === null
                      ? ui.sub
                      : s.avgGrade >= 70
                        ? BRAND.gold
                        : s.avgGrade >= 50
                          ? BRAND.orange
                          : BRAND.crimson

                  return (
                    <div
                      key={s.id}
                      style={{
                        padding: '14px 18px',
                        borderBottom: i < stats.studentStats.length - 1 ? `1px solid ${ui.border}` : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: ui.text }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: ui.sub, marginTop: 3 }}>{s.email}</div>
                      </div>

                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: ui.sub }}>
                          تسليم: <strong>{s.submitted}</strong>
                        </span>
                        <span style={{ fontSize: 12, color: ui.sub }}>
                          مراجعة: <strong>{s.graded}</strong>
                        </span>
                        <span style={{ fontSize: 12, color: ui.sub }}>
                          معلّق: <strong>{s.pending}</strong>
                        </span>
                        <span style={{ fontSize: 12, color: gradeColor, fontWeight: 800 }}>
                          المتوسط: {s.avgGrade ?? '—'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {stats.assignmentStats.length > 0 && (
            <div style={{ ...smallCard, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: `1px solid ${ui.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 800, color: ui.text }}>أداء المهام</span>
                <span style={{ fontSize: 12, color: ui.sub }}>{stats.assignmentStats.length}</span>
              </div>

              <div>
                {stats.assignmentStats.map((a: any, i: number) => (
                  <div
                    key={a.id}
                    style={{
                      padding: '14px 18px',
                      borderBottom: i < stats.assignmentStats.length - 1 ? `1px solid ${ui.border}` : 'none',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 800, color: ui.text }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: ui.sub }}>
                        متوسط: {a.avgGrade ?? '—'} • نسبة: {a.avgPercent ?? '—'}%
                      </div>
                    </div>

                    <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: ui.sub }}>تسليم: {a.submitted}</span>
                      <span style={{ fontSize: 12, color: ui.sub }}>مراجعة: {a.graded}</span>
                      <span style={{ fontSize: 12, color: BRAND.orange }}>معلّق: {a.pending}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}