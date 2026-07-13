'use client'
import { BRAND } from '@/lib/constants/theme'
import { T, Empty, SectionCard, fmtDate } from '../studentTheme'
import type { Assignment, QuizAvailable } from '@/types/student.types'

interface AssignmentsTabProps {
  quizzesAvailable: QuizAvailable[]
  assignments: Assignment[]
  onStartQuiz: (quizId: string) => void
  onOpenAssignment: (a: Assignment) => void
}

export default function AssignmentsTab({
  quizzesAvailable,
  assignments,
  onStartQuiz,
  onOpenAssignment,
}: AssignmentsTabProps) {
  const accentColor = BRAND.deep

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <SectionCard title="اختباراتي" sub="الاختبارات التفاعلية المتاحة لفصلك" icon="🎯" accent={accentColor}>
        {quizzesAvailable.length === 0 ? (
          <Empty icon="🎯" title="لا توجد اختبارات بعد" sub="عندما ينشر معلمك اختبارًا جديدًا سيظهر هنا." />
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {quizzesAvailable.map(q => {
              const exhausted = !q.can_attempt
              const progress = q.attempts_allowed > 0 ? Math.min((q.attempts_used / q.attempts_allowed) * 100, 100) : 0

              return (
                <div
                  key={q.id}
                  style={{
                    background: T.cardBg,
                    border: `1px solid ${q.last_score !== null ? `${T.green}28` : T.borderCol}`,
                    borderRadius: 22,
                    padding: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 16,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    boxShadow: T.shadowCard,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: T.titleCol, marginBottom: 6, fontFamily: T.fontHeading }}>
                      {q.title}
                    </div>
                    <div style={{ fontSize: 13, color: T.subCol, marginBottom: 6, lineHeight: 1.9 }}>
                      {q.questions_count} سؤال
                      {q.time_limit_minutes ? ` • ⏰ ${q.time_limit_minutes} دقيقة` : ''}
                      {' • '}المحاولات: {q.attempts_used}/{q.attempts_allowed}
                    </div>

                    {q.last_score !== null && (
                      <div style={{ fontSize: 14, color: T.green, fontWeight: 800, marginBottom: 10 }}>
                        آخر نتيجة: {q.last_score}%
                      </div>
                    )}

                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.subCol, marginBottom: 6 }}>
                        <span>تقدّم المحاولات</span>
                        <span>
                          {q.attempts_used}/{q.attempts_allowed}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: 9, borderRadius: 999, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${progress}%`,
                            height: '100%',
                            background: exhausted ? BRAND.crimson : T.gradBlue,
                            borderRadius: 999,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onStartQuiz(q.id)}
                    disabled={exhausted}
                    style={{
                      padding: '12px 18px',
                      borderRadius: 16,
                      border: 'none',
                      background: exhausted ? '#E8E2DB' : T.gradMain,
                      color: exhausted ? T.subCol : '#fff',
                      fontWeight: 900,
                      cursor: exhausted ? 'not-allowed' : 'pointer',
                      fontFamily: T.fontBody,
                      minWidth: 160,
                      boxShadow: exhausted ? 'none' : T.shadowSoft,
                    }}
                  >
                    {q.has_active_attempt ? '▶️ أكمل المحاولة' : exhausted ? '✅ انتهت المحاولات' : '🚀 ابدأ الاختبار'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard title="واجباتي" sub="الواجبات والأنشطة المرسلة من المعلم" icon="📝" accent={accentColor}>
        {assignments.length === 0 ? (
          <Empty icon="📝" title="لا توجد واجبات حاليًا" sub="عند نشر واجب جديد سيظهر هنا." />
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {assignments.map(a => {
              const due = a.due_date ?? a.deadline
              const resultValue = a.score ?? a.grade ?? null
              const isQuizAssignment = !!a.quiz_id

              return (
                <div
                  key={a.id}
                  style={{
                    background: T.cardBg,
                    border: `1px solid ${a.submitted ? `${T.green}28` : T.borderCol}`,
                    borderRadius: 22,
                    padding: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 16,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    boxShadow: T.shadowCard,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: T.titleCol, marginBottom: 6, fontFamily: T.fontHeading }}>
                      {a.title}
                    </div>
                    <div style={{ fontSize: 13, color: T.subCol, lineHeight: 1.9, marginBottom: 8 }}>
                      {a.description || a.content || (isQuizAssignment ? 'واجب مرتبط باختبار تفاعلي.' : 'مهمة دراسية.')}
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      {isQuizAssignment && (
                        <span
                          style={{
                            padding: '7px 12px',
                            borderRadius: 999,
                            background: `${T.blue}10`,
                            color: T.blue,
                            fontSize: 12,
                            fontWeight: 800,
                            border: `1px solid ${T.blue}18`,
                          }}
                        >
                          اختبار
                        </span>
                      )}

                      {a.submitted ? (
                        <span
                          style={{
                            padding: '7px 12px',
                            borderRadius: 999,
                            background: `${T.green}12`,
                            color: T.green,
                            fontSize: 12,
                            fontWeight: 900,
                            border: `1px solid ${T.green}18`,
                          }}
                        >
                          تم التسليم
                        </span>
                      ) : (
                        <span
                          style={{
                            padding: '7px 12px',
                            borderRadius: 999,
                            background: `${accentColor}10`,
                            color: accentColor,
                            fontSize: 12,
                            fontWeight: 900,
                            border: `1px solid ${accentColor}18`,
                          }}
                        >
                          بانتظار التسليم
                        </span>
                      )}

                      {resultValue !== null && resultValue !== undefined && (
                        <span
                          style={{
                            padding: '7px 12px',
                            borderRadius: 999,
                            background: `${BRAND.orange}12`,
                            color: BRAND.orange,
                            fontSize: 12,
                            fontWeight: 900,
                            border: `1px solid ${BRAND.orange}18`,
                          }}
                        >
                          الدرجة: {resultValue}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 12, color: T.mutedCol }}>
                      {due ? `موعد التسليم: ${fmtDate(due)}` : 'لا يوجد موعد محدد'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {isQuizAssignment ? (
                      <button
                        onClick={() => onStartQuiz(a.quiz_id as string)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 16,
                          border: 'none',
                          background: T.gradMain,
                          color: '#fff',
                          fontWeight: 900,
                          cursor: 'pointer',
                          fontFamily: T.fontBody,
                        }}
                      >
                        {a.submitted ? 'إعادة الفتح' : 'فتح الاختبار'}
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenAssignment(a)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 16,
                          border: 'none',
                          background: T.gradMain,
                          color: '#fff',
                          fontWeight: 900,
                          cursor: 'pointer',
                          fontFamily: T.fontBody,
                        }}
                      >
                        {a.submitted ? 'عرض التسليم' : 'حل الواجب'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>
    </div>
  )
}