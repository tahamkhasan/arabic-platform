'use client'
import { BRAND } from '@/lib/constants/theme'
import MarkdownRendererRaw from '@/components/MarkdownRenderer'
import { T, SectionCard } from '../studentTheme'
import { PRACTICE_TOOLS } from '@/types/student.types'
import type { Subject, Unit, Lesson } from '@/types/student.types'

const MarkdownRenderer = MarkdownRendererRaw as any

interface PracticeTabProps {
  selSubject: Subject | null
  selUnit: Unit | null
  selLesson: Lesson | null
  practiceTool: string
  onSelectTool: (id: string) => void
  onRunTool: () => void
  onBackToLesson: () => void
  loading: boolean
  practiceError: string
  quizError: string
  flashError: string
  practiceOutput: string
}

export default function PracticeTab({
  selSubject,
  selUnit,
  selLesson,
  practiceTool,
  onSelectTool,
  onRunTool,
  onBackToLesson,
  loading,
  practiceError,
  quizError,
  flashError,
  practiceOutput,
}: PracticeTabProps) {
  const accentColor = BRAND.deep

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <SectionCard title="منطقة التدريب" sub="اختر أداة التمرين المناسبة" icon="✨" accent={accentColor}>
        {!selLesson ? (
          <div
            style={{
              marginBottom: 18,
              padding: 14,
              borderRadius: 16,
              background: `${BRAND.orange}12`,
              border: `1px solid ${BRAND.orange}26`,
              color: T.subCol,
              fontSize: 14,
            }}
          >
            اختر درسًا أولًا من تبويب الدروس حتى تتمكن من تشغيل أدوات التدريب.
          </div>
        ) : (
          <div style={{ marginBottom: 18, padding: 16, borderRadius: 18, border: `1px solid ${T.borderCol}`, background: T.cardSoft }}>
            <div style={{ fontSize: 12, color: T.subCol, marginBottom: 4 }}>الدرس المختار</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: T.titleCol, fontFamily: T.fontHeading }}>{selLesson?.name}</div>
            <div style={{ fontSize: 13, color: T.mutedCol, marginTop: 6 }}>
              {selSubject?.name}
              {selUnit ? ` • ${selUnit.name}` : ''}
            </div>
          </div>
        )}

        <div className="practice-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }}>
          {PRACTICE_TOOLS.map(tool => {
            const active = practiceTool === tool.id
            return (
              <button
                key={tool.id}
                onClick={() => onSelectTool(tool.id)}
                style={{
                  textAlign: 'right',
                  padding: 18,
                  borderRadius: 20,
                  border: `1px solid ${active ? `${accentColor}33` : T.borderCol}`,
                  background: active ? `${accentColor}0F` : T.cardBg,
                  boxShadow: active ? `0 12px 28px ${accentColor}14` : 'none',
                  cursor: 'pointer',
                  fontFamily: T.fontBody,
                  transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 10 }}>{tool.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: T.titleCol, marginBottom: 4 }}>{tool.label}</div>
                <div style={{ fontSize: 13, color: T.subCol, lineHeight: 1.8 }}>{tool.desc}</div>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
          <button
            onClick={onRunTool}
            disabled={!selLesson || !practiceTool || loading}
            style={{
              padding: '13px 22px',
              borderRadius: 14,
              border: 'none',
              background: !selLesson || !practiceTool ? '#E8E2DB' : T.gradMain,
              color: !selLesson || !practiceTool ? T.subCol : '#fff',
              fontWeight: 900,
              cursor: !selLesson || !practiceTool ? 'not-allowed' : 'pointer',
              fontFamily: T.fontBody,
              boxShadow: !selLesson || !practiceTool ? 'none' : T.shadowSoft,
            }}
          >
            {loading ? 'جارٍ التنفيذ...' : 'تشغيل الأداة'}
          </button>

          {selLesson && (
            <button
              onClick={onBackToLesson}
              style={{
                padding: '13px 18px',
                borderRadius: 14,
                border: `1px solid ${T.borderCol}`,
                background: T.cardBg,
                color: T.textCol,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: T.fontBody,
              }}
            >
              العودة إلى الدرس
            </button>
          )}
        </div>

        {practiceError && (
          <div
            style={{
              marginTop: 16,
              padding: '14px 16px',
              borderRadius: 16,
              background: `${BRAND.crimson}10`,
              border: `1px solid ${BRAND.crimson}22`,
              color: BRAND.crimson,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {practiceError}
          </div>
        )}

        {quizError && (
          <div
            style={{
              marginTop: 16,
              padding: '14px 16px',
              borderRadius: 16,
              background: `${BRAND.crimson}10`,
              border: `1px solid ${BRAND.crimson}22`,
              color: BRAND.crimson,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {quizError}
          </div>
        )}

        {flashError && (
          <div
            style={{
              marginTop: 16,
              padding: '14px 16px',
              borderRadius: 16,
              background: `${BRAND.crimson}10`,
              border: `1px solid ${BRAND.crimson}22`,
              color: BRAND.crimson,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {flashError}
          </div>
        )}

        {!!practiceOutput && (
          <div
            style={{
              marginTop: 20,
              borderRadius: 20,
              overflow: 'hidden',
              border: `1px solid ${T.borderCol}`,
              boxShadow: T.shadowCard,
              background: T.cardBg,
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                borderBottom: `1px solid ${T.borderCol}`,
                background: `${accentColor}08`,
                fontWeight: 900,
                color: T.titleCol,
                fontFamily: T.fontHeading,
              }}
            >
              ناتج التدريب
            </div>
            <div style={{ padding: 18 }}>
              <MarkdownRenderer text={practiceOutput} />
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  )
}