'use client'

import { useState } from 'react'
import { BRAND } from '@/lib/constants/theme'
import { useCurriculum } from '@/hooks/useCurriculum'

type Props = {
  subjectId: string
  onSelectLesson: (lessonId: string) => void
  activeLessonId?: string | null
}

export default function CurriculumView({ subjectId, onSelectLesson, activeLessonId }: Props) {
  const { data, loading, error } = useCurriculum(subjectId)
  const [openUnitId, setOpenUnitId] = useState<string | null>(null)

  if (loading) {
    return <p style={{ color: BRAND.sub, fontSize: 14, fontFamily: BRAND.fontBody }}>⏳ جارٍ تحميل المنهج...</p>
  }
  if (error) {
    return <p style={{ color: BRAND.crimson, fontSize: 14 }}>❌ {error}</p>
  }
  if (!data) return null

  return (
    <div style={{ direction: 'rtl', fontFamily: BRAND.fontBody }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 24 }}>{data.subject.icon || '📚'}</span>
        <h2 style={{ fontSize: 18, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: BRAND.text, margin: 0 }}>
          {data.subject.name}
        </h2>
      </div>

      {data.units.length === 0 ? (
        <p style={{ color: BRAND.sub, fontSize: 14 }}>لا توجد وحدات منشورة لهذه المادة حتى الآن.</p>
      ) : (
        data.units.map(unit => {
          const isOpen = openUnitId === unit.id
          return (
            <div
              key={unit.id}
              style={{
                border: `1.5px solid ${BRAND.border}`,
                borderRadius: BRAND.radiusMd,
                marginBottom: 10,
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => setOpenUnitId(isOpen ? null : unit.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: BRAND.bgSoft,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: BRAND.fontBody,
                  textAlign: 'right',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: BRAND.weightBold, color: BRAND.text }}>
                  <span>{unit.icon || '📖'}</span>
                  {unit.name}
                  <span style={{ fontSize: 12, color: BRAND.sub, fontWeight: BRAND.weightRegular }}>
                    ({unit.lessons.length} درس)
                  </span>
                </span>
                <span style={{ fontSize: 14, color: BRAND.sub }}>{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div style={{ padding: '6px 10px 12px' }}>
                  {unit.lessons.length === 0 ? (
                    <p style={{ fontSize: 13, color: BRAND.sub, padding: '8px 12px' }}>
                      لا توجد دروس منشورة في هذه الوحدة بعد.
                    </p>
                  ) : (
                    unit.lessons.map(lesson => {
                      const isActive = activeLessonId === lesson.id
                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => onSelectLesson(lesson.id)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: BRAND.radiusSm,
                            border: 'none',
                            background: isActive ? 'rgba(140,20,40,0.07)' : 'transparent',
                            color: isActive ? BRAND.crimson : BRAND.text,
                            fontWeight: isActive ? BRAND.weightBold : BRAND.weightRegular,
                            fontSize: 14,
                            cursor: 'pointer',
                            fontFamily: BRAND.fontBody,
                            marginBottom: 4,
                            textAlign: 'right',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {lesson.video_url ? '🎬' : '📄'} {lesson.name}
                          </span>
                          {lesson.has_quiz && (
                            <span style={{ fontSize: 11, color: BRAND.orange, fontWeight: BRAND.weightBold }}>🎯 اختبار</span>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
