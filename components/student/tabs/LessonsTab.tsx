'use client'
import { BRAND } from '@/lib/constants/theme'
import { STAGE_LABELS, GRADES_BY_STAGE, TRACK_LABELS } from '@/lib/constants/stages'
import type { StageKey, TrackKey } from '@/lib/constants/stages'
import MarkdownRendererRaw from '@/components/MarkdownRenderer'
import SubjectCardNew from '@/components/student/SubjectCard'
import { T, Empty, SectionCard, interactiveCard } from '../studentTheme'
import type { Subject, Unit, Lesson, Media } from '@/types/student.types'

const MarkdownRenderer = MarkdownRendererRaw as any

interface LessonsTabProps {
  selectedStage: StageKey | null
  selectedGrade: string | null
  selectedTrack: TrackKey | null
  subjects: Subject[]
  selSubject: Subject | null
  units: Unit[]
  selUnit: Unit | null
  lessons: Lesson[]
  selLesson: Lesson | null
  onOpenSubject: (s: Subject) => void
  onSelectUnit: (u: Unit) => void
  onBackToSubjects: () => void
  onSelectLesson: (l: Lesson) => void
  onBackToUnits: () => void
  onBackToLessons: () => void
  onOpenMedia: (m: Media) => void
  onPractice: (l: Lesson) => void
}

export default function LessonsTab({
  selectedStage,
  selectedGrade,
  selectedTrack,
  subjects,
  selSubject,
  units,
  selUnit,
  lessons,
  selLesson,
  onOpenSubject,
  onSelectUnit,
  onBackToSubjects,
  onSelectLesson,
  onBackToUnits,
  onBackToLessons,
  onOpenMedia,
  onPractice,
}: LessonsTabProps) {
  const accentColor = BRAND.deep

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 10,
          padding: '14px 16px',
          borderRadius: 18,
          background: T.cardBg,
          border: `1px solid ${T.borderCol}`,
          boxShadow: T.shadowCard,
        }}
      >
        <span style={{ fontSize: 13, color: T.subCol, fontWeight: 800 }}>المستوى الحالي:</span>

        {selectedStage && (
          <span
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              background: `${accentColor}10`,
              color: accentColor,
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            {STAGE_LABELS[selectedStage]}
          </span>
        )}

        {selectedGrade && selectedStage && (
          <span
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              background: `${accentColor}10`,
              color: accentColor,
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            {GRADES_BY_STAGE[selectedStage].find(g => g.id === selectedGrade)?.label ?? selectedGrade}
          </span>
        )}

        {selectedTrack && (
          <span
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              background: `${accentColor}10`,
              color: accentColor,
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            {TRACK_LABELS[selectedTrack]}
          </span>
        )}

        <span style={{ fontSize: 13, color: T.mutedCol }}>
          {selSubject ? `• ${selSubject.name}` : '• اختر مادة'}
          {selUnit ? ` • ${selUnit.name}` : ''}
          {selLesson ? ` • ${selLesson.name}` : ''}
        </span>
      </div>

      {!selSubject ? (
        subjects.length === 0 ? (
          <Empty icon="📚" title="لا توجد مواد متاحة" sub="ستظهر هنا المواد المتاحة لك بمجرد ربط حسابك." />
        ) : (
          <div className="subject-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
            {subjects.map(s => (
              <SubjectCardNew
                key={s.id}
                subject={{
                  id: s.id,
                  name: s.name,
                  icon: s.icon,
                  teacherName: s.teacherName ?? null,
                  unitsCount: s.unitsCount ?? 0,
                }}
                accentColor={accentColor}
                onClick={() => onOpenSubject(s)}
              />
            ))}
          </div>
        )
      ) : !selUnit ? (
        <div style={{ display: 'grid', gap: 14 }}>
          <button
            onClick={onBackToSubjects}
            style={{
              alignSelf: 'flex-start',
              padding: '10px 14px',
              borderRadius: 12,
              border: `1px solid ${T.borderCol}`,
              background: T.cardBg,
              color: T.textCol,
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: T.fontBody,
            }}
          >
            ← رجوع إلى المواد
          </button>

          <SectionCard title={selSubject.name} sub="اختر الوحدة" icon={selSubject.icon || '📚'} accent={accentColor}>
            {units.length === 0 ? (
              <Empty icon="📂" title="لا توجد وحدات متاحة" sub="عند إضافة وحدات جديدة ستظهر هنا." />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
                {units.map(u => (
                  <button
                    key={u.id}
                    onClick={() => onSelectUnit(u)}
                    style={{
                      ...interactiveCard,
                      textAlign: 'right',
                      padding: 18,
                      borderRadius: 20,
                      border: `1px solid ${T.borderCol}`,
                      background: T.cardBg,
                      cursor: 'pointer',
                      fontFamily: T.fontBody,
                      boxShadow: T.shadowCard,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = `0 18px 34px ${accentColor}16`
                      e.currentTarget.style.borderColor = `${accentColor}33`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = T.shadowCard
                      e.currentTarget.style.borderColor = T.borderCol
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{u.icon || '📂'}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: T.titleCol }}>{u.name}</div>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      ) : !selLesson ? (
        <div style={{ display: 'grid', gap: 14 }}>
          <button
            onClick={onBackToUnits}
            style={{
              alignSelf: 'flex-start',
              padding: '10px 14px',
              borderRadius: 12,
              border: `1px solid ${T.borderCol}`,
              background: T.cardBg,
              color: T.textCol,
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: T.fontBody,
            }}
          >
            ← رجوع إلى الوحدات
          </button>

          <SectionCard title={selUnit.name} sub="اختر الدرس" icon={selUnit.icon || '📂'} accent={accentColor}>
            {lessons.length === 0 ? (
              <Empty icon="📄" title="لا توجد دروس داخل هذه الوحدة" sub="عند إضافة الدروس ستظهر هنا تلقائيًا." />
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {lessons.map(l => (
                  <button
                    key={l.id}
                    onClick={() => onSelectLesson(l)}
                    style={{
                      ...interactiveCard,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      padding: '16px 18px',
                      borderRadius: 16,
                      border: `1px solid ${T.borderCol}`,
                      background: T.cardBg,
                      cursor: 'pointer',
                      fontFamily: T.fontBody,
                      textAlign: 'right',
                      boxShadow: T.shadowCard,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.borderColor = `${accentColor}33`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.borderColor = T.borderCol
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.textCol }}>{l.name}</span>
                    <span style={{ color: T.subCol, fontSize: 13 }}>
                      {l.video_url || l.video_embed_url ? '🎥 يحتوي وسائط' : 'افتح الدرس'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          <button
            onClick={onBackToLessons}
            style={{
              alignSelf: 'flex-start',
              padding: '10px 14px',
              borderRadius: 12,
              border: `1px solid ${T.borderCol}`,
              background: T.cardBg,
              color: T.textCol,
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: T.fontBody,
            }}
          >
            ← رجوع إلى الدروس
          </button>

          <SectionCard title={selLesson.name} sub="محتوى الدرس" icon="📖" accent={accentColor}>
            {selLesson.content ? (
              <MarkdownRenderer text={selLesson.content} />
            ) : (
              <Empty icon="📝" title="لا يوجد محتوى نصي بعد" sub="يمكنك مشاهدة الوسائط أو متابعة التدريب على الدرس." />
            )}
          </SectionCard>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {(selLesson.video_url || selLesson.video_embed_url) && (
              <button
                onClick={() =>
                  onOpenMedia({
                    id: selLesson.id,
                    title: selLesson.name,
                    type: 'video',
                    url: selLesson.video_url || '',
                    embed_url: selLesson.video_embed_url || undefined,
                    link_type: 'lesson',
                  })
                }
                style={{
                  padding: '14px 18px',
                  borderRadius: 14,
                  border: `1px solid ${T.borderCol}`,
                  background: T.cardBg,
                  color: T.textCol,
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: T.fontBody,
                }}
              >
                🎥 شاهد الوسائط
              </button>
            )}

            {selLesson.file_urls && selLesson.file_urls.length > 0 && (
              <a
                href={selLesson.file_urls[0]}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '14px 18px',
                  borderRadius: 14,
                  border: `1px solid ${T.borderCol}`,
                  background: T.cardBg,
                  color: T.textCol,
                  fontWeight: 800,
                  fontFamily: T.fontBody,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                📎 افتح المرفق
              </a>
            )}

            <button
              onClick={() => onPractice(selLesson)}
              style={{
                padding: '14px 18px',
                borderRadius: 14,
                border: 'none',
                background: T.gradMain,
                color: '#fff',
                fontWeight: 900,
                cursor: 'pointer',
                fontFamily: T.fontBody,
              }}
            >
              ✨ تدرب على الدرس
            </button>
          </div>
        </div>
      )}
    </div>
  )
}