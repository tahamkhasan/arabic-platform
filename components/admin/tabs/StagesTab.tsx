'use client'
import { useRouter } from 'next/navigation'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'
import { STAGE_LABELS, GRADES_BY_STAGE, TRACK_LABELS, type StageKey, type TrackKey } from '@/lib/constants/stages'
import { T, sectionCard } from '../adminTheme'
import type { SubjectOccurrence } from '@/types/admin.types'

interface StagesTabProps {
  occurrencesByStage: Record<StageKey, SubjectOccurrence[]>
  unassignedSubjects: any[]
  activeStageTab: StageKey
  setActiveStageTab: (s: StageKey) => void
  activeGrade: string | null
  setActiveGrade: (g: string | null) => void
  activeTrack: TrackKey | null
  setActiveTrack: (t: TrackKey | null) => void
}

export default function StagesTab({
  occurrencesByStage,
  unassignedSubjects,
  activeStageTab,
  setActiveStageTab,
  activeGrade,
  setActiveGrade,
  activeTrack,
  setActiveTrack,
}: StagesTabProps) {
  const router = useRouter()

  return (
    <div className="fade-in" style={sectionCard}>
      <h2 style={{ fontSize: 22, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: BRAND.crimson, margin: '0 0 8px' }}>
        🏫 المراحل الدراسية
      </h2>
      <p style={{ fontSize: 13, color: T.subCol, margin: '0 0 18px' }}>
        تصفح المراحل ثم الصفوف، ثم التشعيب إن وجد، لعرض المواد المرتبطة فعلياً.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {(Object.keys(STAGE_LABELS) as StageKey[]).map(stage => {
          const count = new Set(occurrencesByStage[stage].map(o => o.subject.id)).size
          return (
            <button
              key={stage}
              onClick={() => {
                setActiveStageTab(stage)
                setActiveGrade(null)
                setActiveTrack(null)
              }}
              style={{
                flex: 1,
                minWidth: 180,
                padding: '14px',
                borderRadius: BRAND.radiusMd,
                border: `2px solid ${activeStageTab === stage ? BRAND.crimson : T.borderCol}`,
                background: activeStageTab === stage ? 'rgba(140,20,40,0.08)' : 'rgba(255,255,255,0.72)',
                color: activeStageTab === stage ? BRAND.crimson : T.subCol,
                fontWeight: BRAND.weightBlack,
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {STAGE_LABELS[stage]}
              <span style={{ fontSize: 12, fontWeight: BRAND.weightSemibold, marginRight: 6, opacity: 0.7 }}>({count})</span>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {GRADES_BY_STAGE[activeStageTab].map(g => {
          const count = occurrencesByStage[activeStageTab].filter(o => o.offering.grade === g.id).length
          const isActive = activeGrade === g.id
          return (
            <button
              key={g.id}
              onClick={() => {
                setActiveGrade(isActive ? null : g.id)
                setActiveTrack(null)
              }}
              style={{
                padding: '10px 18px',
                borderRadius: 999,
                border: `1.5px solid ${isActive ? BRAND.crimson : T.borderCol}`,
                background: isActive ? 'rgba(140,20,40,0.10)' : 'rgba(255,255,255,0.72)',
                color: isActive ? BRAND.crimson : T.textCol,
                fontWeight: BRAND.weightBold,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {g.label}
              <span style={{ fontSize: 11, fontWeight: BRAND.weightSemibold, marginRight: 5, opacity: 0.7 }}>({count})</span>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <Button variant="primary" onClick={() => router.push('/admin/subjects')}>
          🆕 الذهاب إلى لوحة إدارة المواد والوحدات
        </Button>
        <Button variant="secondary" onClick={() => router.push('/admin/packages')}>
          📦 إدارة الباقات
        </Button>
      </div>

      {activeGrade && (activeGrade === '11' || activeGrade === '12') && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {(Object.keys(TRACK_LABELS) as TrackKey[]).map(track => {
            const count = occurrencesByStage[activeStageTab].filter(
              o => o.offering.grade === activeGrade && (o.offering.track === track || o.offering.track === null),
            ).length
            const isActive = activeTrack === track
            return (
              <button
                key={track}
                onClick={() => setActiveTrack(isActive ? null : track)}
                style={{
                  flex: 1,
                  minWidth: 170,
                  padding: '12px',
                  borderRadius: BRAND.radiusMd,
                  border: `1.5px solid ${isActive ? BRAND.crimson : T.borderCol}`,
                  background: isActive ? 'rgba(140,20,40,0.10)' : 'rgba(255,255,255,0.72)',
                  color: isActive ? BRAND.crimson : T.textCol,
                  fontWeight: BRAND.weightBold,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {TRACK_LABELS[track]}
                <span style={{ fontSize: 11, fontWeight: BRAND.weightSemibold, marginRight: 5, opacity: 0.7 }}>({count})</span>
              </button>
            )
          })}
        </div>
      )}

      {!activeGrade ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.72)', borderRadius: BRAND.radiusMd, border: `1px dashed ${T.borderCol}`, color: T.subCol }}>
          اختر صفاً من {STAGE_LABELS[activeStageTab]} أعلاه لعرض مواده
        </div>
      ) : (activeGrade === '11' || activeGrade === '12') && !activeTrack ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.72)', borderRadius: BRAND.radiusMd, border: `1px dashed ${T.borderCol}`, color: T.subCol }}>
          اختر التشعيب (علمي/أدبي) أعلاه لعرض مواد هذا الصف
        </div>
      ) : (
        (() => {
          const needsTrack = activeGrade === '11' || activeGrade === '12'
          const gradeOccurrences = occurrencesByStage[activeStageTab].filter(o => {
            if (o.offering.grade !== activeGrade) return false
            if (!needsTrack) return true
            return o.offering.track === activeTrack || o.offering.track === null
          })

          return gradeOccurrences.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.72)', borderRadius: BRAND.radiusMd, color: T.subCol }}>
              لا توجد مواد لهذا الصف بعد
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
              {gradeOccurrences.map((o, i) => (
                <div
                  key={`${o.subject.id}-${o.offering.track ?? 'shared'}-${i}`}
                  style={{
                    padding: '18px',
                    borderRadius: BRAND.radiusMd,
                    background: 'rgba(255,255,255,0.72)',
                    border: `1.5px solid ${
                      o.offering.track === null && needsTrack
                        ? o.isLegacy
                          ? 'rgba(140,20,40,0.35)'
                          : 'rgba(220,140,60,0.4)'
                        : T.borderCol
                    }`,
                    boxShadow: T.shadow,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 8 }}>{o.subject.icon ?? '📚'}</div>
                  <div style={{ fontSize: 15, fontWeight: BRAND.weightBold, color: T.textCol, marginBottom: 4 }}>{o.subject.name}</div>
                  <div style={{ fontSize: 12, color: BRAND.crimson, fontWeight: BRAND.weightBold }}>
                    الصف {o.offering.grade}
                    {o.offering.track
                      ? ` • ${TRACK_LABELS[o.offering.track]}`
                      : needsTrack
                      ? o.isLegacy
                        ? ' • ⚠️ تشعيب غير محدَّد'
                        : ' • مشتركة'
                      : ''}
                  </div>
                </div>
              ))}
            </div>
          )
        })()
      )}

      {unassignedSubjects.length > 0 && (
        <>
          <h3 style={{ fontSize: 14, fontWeight: BRAND.weightBold, color: T.subCol, margin: '24px 0 12px' }}>
            مواد بلا صف محدَّد ({unassignedSubjects.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
            {unassignedSubjects.map(s => (
              <div
                key={s.id}
                style={{
                  padding: '18px',
                  borderRadius: BRAND.radiusMd,
                  background: 'rgba(255,255,255,0.72)',
                  border: `1.5px dashed ${T.borderCol}`,
                  boxShadow: T.shadow,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 8 }}>{s.icon ?? '📚'}</div>
                <div style={{ fontSize: 15, fontWeight: BRAND.weightBold, color: T.textCol }}>{s.name}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}