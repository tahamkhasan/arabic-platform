'use client'
import { BRAND } from '@/lib/constants/theme'
import { T, Empty, SectionCard, QuickAction, interactiveCard } from '../studentTheme'
import type { Subject, Unit, Lesson } from '@/types/student.types'

interface HomeTabProps {
  subjects: Subject[]
  selSubject: Subject | null
  selUnit: Unit | null
  selLesson: Lesson | null
  pendingCount: number
  unreadCount: number
  onOpenSubject: (s: Subject) => void
  onGoLessons: () => void
  onGoPractice: () => void
  onGoAssignments: () => void
  onGoMessages: () => void
  onGoChat: () => void
}

export default function HomeTab({
  subjects,
  selSubject,
  selUnit,
  selLesson,
  pendingCount,
  unreadCount,
  onOpenSubject,
  onGoLessons,
  onGoPractice,
  onGoAssignments,
  onGoMessages,
  onGoChat,
}: HomeTabProps) {
  const accentColor = BRAND.deep

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <SectionCard title="موادك الدراسية" sub="اختر مادة للانتقال إلى الوحدات والدروس" icon="📚" accent={accentColor}>
        {subjects.length === 0 ? (
          <Empty icon="📚" title="لا توجد مواد متاحة" sub="ستظهر هنا المواد المتاحة لك بمجرد ربط حسابك." />
        ) : (
          <div className="subject-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
            {subjects.map(s => (
              <button
                key={s.id}
                onClick={() => onOpenSubject(s)}
                style={{
                  ...interactiveCard,
                  textAlign: 'right',
                  padding: 0,
                  borderRadius: 22,
                  border: `1px solid ${T.borderCol}`,
                  background: T.cardBg,
                  cursor: 'pointer',
                  fontFamily: T.fontBody,
                  boxShadow: T.shadowCard,
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'
                  e.currentTarget.style.boxShadow = `0 18px 34px ${accentColor}18`
                  e.currentTarget.style.borderColor = `${accentColor}33`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = T.shadowCard
                  e.currentTarget.style.borderColor = T.borderCol
                }}
              >
                <div
                  style={{
                    padding: '22px 20px 16px',
                    background: `${accentColor}08`,
                    borderBottom: `1px solid ${T.borderCol}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 18,
                      background: `${accentColor}14`,
                      border: `1px solid ${accentColor}22`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 28,
                      flexShrink: 0,
                    }}
                  >
                    {s.icon || '📘'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 900,
                        color: T.titleCol,
                        fontFamily: T.fontHeading,
                        marginBottom: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.name}
                    </div>
                    {s.grade && <div style={{ fontSize: 12, color: accentColor, fontWeight: 700 }}>{s.grade}</div>}
                  </div>
                </div>

                <div style={{ padding: '14px 20px 18px' }}>
                  {s.teacherName && (
                    <div style={{ fontSize: 13, color: T.subCol, marginBottom: 10 }}>المعلم: {s.teacherName}</div>
                  )}
                  <div style={{ fontSize: 12, color: T.subCol, marginBottom: 14 }}>{s.unitsCount ?? 0} وحدة</div>
                  <div
                    style={{
                      width: '100%',
                      padding: '10px 0',
                      borderRadius: 14,
                      background: T.gradMain,
                      color: '#fff',
                      fontWeight: 900,
                      fontSize: 14,
                      textAlign: 'center',
                    }}
                  >
                    افتح المادة
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="double-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 18 }}>
        <SectionCard title="المسار الحالي" sub="ملخص سريع لاختيارك الحالي" icon="🧭" accent={T.blue}>
          {!selSubject ? (
            <Empty icon="🧭" title="لم يتم اختيار مادة بعد" sub="اختر مادة من الأعلى لتبدأ بالتصفح." />
          ) : (
            <div style={{ borderRadius: 20, border: `1px solid ${T.borderCol}`, background: T.cardSoft, padding: 18 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: T.titleCol, marginBottom: 8, fontFamily: T.fontHeading }}>
                {selSubject.name}
              </div>
              <div style={{ fontSize: 13, color: T.subCol, lineHeight: 1.9, marginBottom: 14 }}>
                {selUnit ? selUnit.name : 'اختر وحدة'}
                <br />
                {selLesson ? selLesson.name : 'ثم اختر درسًا'}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={onGoLessons}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 14,
                    border: 'none',
                    background: T.gradMain,
                    color: '#fff',
                    fontWeight: 900,
                    cursor: 'pointer',
                    fontFamily: T.fontBody,
                  }}
                >
                  افتح الدروس
                </button>
                {selLesson && (
                  <button
                    onClick={onGoPractice}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 14,
                      border: `1px solid ${T.blue}22`,
                      background: `${T.blue}0D`,
                      color: T.blue,
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontFamily: T.fontBody,
                    }}
                  >
                    تدرب الآن
                  </button>
                )}
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="روابط سريعة" sub="افتح أهم الأجزاء مباشرة" icon="⚡" accent={BRAND.orange}>
          <div className="quick-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <QuickAction icon="📝" label="مهامي" badge={pendingCount} onClick={onGoAssignments} />
            <QuickAction icon="💬" label="رسائل المعلم" badge={unreadCount} onClick={onGoMessages} />
            <QuickAction icon="🤖" label="مساعد مِداد" onClick={onGoChat} />
          </div>
        </SectionCard>
      </div>
    </div>
  )
}