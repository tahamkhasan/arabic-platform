'use client'
import { useEffect, useMemo, useState } from 'react'
import { BRAND } from '@/lib/constants/theme'
import { STAGE_LABELS } from '@/lib/constants/stages'
import { useTeacherSubjectSummary } from '@/hooks/useTeacherSubjectSummary'

interface ScopeItem {
  id: string
  stage: string
  stage_label: string
  grade: string
  track: string | null
  track_label: string | null
  subject_id: string | null
  subject_name: string | null
  students_count: number
}

interface TeacherSubjectManagementTabProps {
  accessToken: string
  router: any
  ui: any
  styles: any
}

export function TeacherSubjectManagementTab({ accessToken, router, ui, styles }: TeacherSubjectManagementTabProps) {
  const { smallCard, ghostBtn, primaryBtn } = styles

  const [items, setItems] = useState<ScopeItem[]>([])
  const [loading, setLoading] = useState(false)

  const [activeStage, setActiveStage] = useState<string | null>(null)
  const [activeGrade, setActiveGrade] = useState<string | null>(null)
  const [selectedScope, setSelectedScope] = useState<ScopeItem | null>(null)

  useEffect(() => {
    if (!accessToken) return
    let cancelled = false
    setLoading(true)

    fetch('/api/teacher-scopes/mine', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        const list: ScopeItem[] = d?.items ?? []
        setItems(list)
        if (list.length > 0 && !activeStage) {
          setActiveStage(list[0].stage)
        }
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  const stagesPresent = useMemo(() => {
    const seen = new Set<string>()
    const ordered: { stage: string; label: string }[] = []
    for (const it of items) {
      if (!seen.has(it.stage)) {
        seen.add(it.stage)
        ordered.push({ stage: it.stage, label: it.stage_label })
      }
    }
    return ordered
  }, [items])

  const gradesForActiveStage = useMemo(() => {
    if (!activeStage) return []
    const seen = new Set<string>()
    const ordered: { grade: string; label: string }[] = []
    for (const it of items) {
      if (it.stage === activeStage && !seen.has(it.grade)) {
        seen.add(it.grade)
        ordered.push({ grade: it.grade, label: `الصف ${it.grade}` })
      }
    }
    return ordered
  }, [items, activeStage])

  const subjectsForActiveGrade = useMemo(() => {
    if (!activeStage || !activeGrade) return []
    return items.filter(it => it.stage === activeStage && it.grade === activeGrade)
  }, [items, activeStage, activeGrade])

  const summary = useTeacherSubjectSummary(selectedScope?.subject_id ?? null)

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: ui.sub, fontSize: 14 }}>
        ⏳ جارٍ تحميل نطاقات التدريس...
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div
        style={{
          background: ui.panelStrong,
          border: `1px solid ${ui.border}`,
          borderRadius: 18,
          padding: 28,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 10 }}>📚</div>
        <div style={{ fontSize: 16, color: ui.text, fontWeight: 800, marginBottom: 6 }}>لا توجد مواد مُسنَدة إليك بعد</div>
        <div style={{ fontSize: 13, color: ui.sub }}>سيحدد الأدمن نطاق تدريسك (المرحلة والصف والمادة) قريباً.</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }}>📚</span>
        <h2 style={{ margin: 0, fontSize: 18, color: ui.text, fontWeight: 900, fontFamily: BRAND.fontHeading }}>
          إدارة المادة
        </h2>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {stagesPresent.map(s => (
          <button
            key={s.stage}
            type="button"
            onClick={() => {
              setActiveStage(s.stage)
              setActiveGrade(null)
              setSelectedScope(null)
            }}
            style={ghostBtn(activeStage === s.stage)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {activeStage && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {gradesForActiveStage.map(g => (
            <button
              key={g.grade}
              type="button"
              onClick={() => {
                setActiveGrade(g.grade)
                setSelectedScope(null)
              }}
              style={ghostBtn(activeGrade === g.grade)}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}

      {activeGrade && (
        <div className="cards-grid">
          {subjectsForActiveGrade.map(scope => (
            <button
              key={scope.id}
              type="button"
              onClick={() => setSelectedScope(scope)}
              style={{
                ...smallCard,
                padding: '18px 20px',
                cursor: 'pointer',
                textAlign: 'right',
                fontFamily: 'inherit',
                borderColor: selectedScope?.id === scope.id ? ui.borderAccent : ui.border,
                background: selectedScope?.id === scope.id ? `${ui.themeColor}08` : undefined,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>📘</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: ui.text, marginBottom: 4 }}>
                {scope.subject_name ?? 'مادة غير محدَّدة'}
              </div>
              <div style={{ fontSize: 12, color: ui.sub }}>
                {scope.track_label ? `${scope.track_label} • ` : ''}
                {scope.students_count} طالب
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedScope && (
        <div style={{ ...smallCard, padding: 22 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: ui.text, marginBottom: 4, fontFamily: BRAND.fontHeading }}>
            {selectedScope.subject_name ?? 'مادة غير محدَّدة'}
          </div>
          <div style={{ fontSize: 13, color: ui.sub, marginBottom: 18 }}>
            {selectedScope.stage_label} • الصف {selectedScope.grade}
            {selectedScope.track_label ? ` • ${selectedScope.track_label}` : ''}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            <div style={{ textAlign: 'center', padding: '14px 10px', borderRadius: 14, background: ui.inputBg, border: `1px solid ${ui.border}` }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: ui.themeColor }}>{selectedScope.students_count}</div>
              <div style={{ fontSize: 11, color: ui.sub, marginTop: 4 }}>طالب</div>
            </div>
            <div style={{ textAlign: 'center', padding: '14px 10px', borderRadius: 14, background: ui.inputBg, border: `1px solid ${ui.border}` }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: ui.themeColor }}>
                {summary.loading ? '...' : summary.unitsCount}
              </div>
              <div style={{ fontSize: 11, color: ui.sub, marginTop: 4 }}>وحدة</div>
            </div>
            <div style={{ textAlign: 'center', padding: '14px 10px', borderRadius: 14, background: ui.inputBg, border: `1px solid ${ui.border}` }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: ui.themeColor }}>
                {summary.loading ? '...' : summary.lessonsCount}
              </div>
              <div style={{ fontSize: 11, color: ui.sub, marginTop: 4 }}>درس</div>
            </div>
          </div>

          <button
            type="button"
            disabled={!selectedScope.subject_id}
            onClick={() =>
              router.push(
                `/admin/subjects/${selectedScope.subject_id}/units?subjectName=${encodeURIComponent(selectedScope.subject_name ?? '')}`,
              )
            }
            style={primaryBtn(!!selectedScope.subject_id)}
          >
            📂 إدارة محتوى المادة (الوحدات والدروس)
          </button>

          {!selectedScope.subject_id && (
            <p style={{ fontSize: 12, color: ui.sub, marginTop: 8 }}>
              هذا النطاق غير مرتبط بمادة محدَّدة بعد — تواصل مع الأدمن لربطه.
            </p>
          )}
        </div>
      )}
    </div>
  )
}