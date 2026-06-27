'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { BRAND } from '@/lib/constants/theme'
import { supabase } from '@/lib/supabase'

interface User { id: string; name: string; role: string; user_type: string; status?: string; theme_color?: string }

interface QuestionOption { id: string; text: string; is_correct?: boolean }
interface Question {
  id: string
  type: string
  text: string
  options?: QuestionOption[]
  correct_answer?: string
  points: number
}
interface QuizDetail {
  id: string
  title: string
  description?: string
  published: boolean
  questions: Question[]
  questions_count: number
  total_points: number
}

interface ResultRow {
  attempt_id: string
  student_name: string
  score: number | null
  submitted_at: string | null
  time_spent_seconds: number | null
  status: 'submitted' | 'in_progress'
}

// ── جديد: تفاصيل محاولة طالب واحدة، لمودال المراجعة/التصحيح ──────
interface AttemptEvaluation {
  is_correct?: boolean
  score?: number
  immediate_feedback?: string
  detailed_explanation?: string
  needs_ai_review?: boolean
  manually_graded?: boolean
}
interface AttemptQuestionItem {
  question_id: string
  type: string
  text: string
  options?: QuestionOption[]
  correct_answer?: string
  points: number
  explanation?: string
  student_answer: string | string[] | null
  evaluation: AttemptEvaluation | null
}
interface AttemptDetail {
  quiz_title: string
  student_name: string
  score: number | null
  submitted_at: string | null
  time_spent_seconds: number | null
  questions: AttemptQuestionItem[]
}

export default function QuizDetailPage() {
  const router = useRouter()
  const params = useParams()
  const quizId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState('')
  const [themeColor, setThemeColor] = useState<string>(BRAND.red)

  const [quiz, setQuiz] = useState<QuizDetail | null>(null)
  const [results, setResults] = useState<ResultRow[]>([])
  const [resultsSummary, setResultsSummary] = useState<{ total_attempts: number; submitted_count: number; average_score: number | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [view, setView] = useState<'questions' | 'results'>('results')

  // ── جديد: مودال مراجعة/تصحيح محاولة طالب ──────────────────────
  const [openAttemptId, setOpenAttemptId] = useState<string | null>(null)
  const [attemptDetail, setAttemptDetail] = useState<AttemptDetail | null>(null)
  const [attemptLoading, setAttemptLoading] = useState(false)
  const [gradeDrafts, setGradeDrafts] = useState<Record<string, { score: string; feedback: string }>>({})
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null)
  const [gradeError, setGradeError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('mosaed_user')
    if (!saved) { router.replace('/'); return }
    try {
      const u = JSON.parse(saved) as User
      if (u.user_type === 'student') { router.replace('/student'); return }
      if (u.status === 'pending' || u.status === 'suspended') { router.replace('/pending-approval'); return }
      setUser(u)
      if (u.theme_color) setThemeColor(u.theme_color)
    } catch { router.replace('/') }
  }, [router])

  useEffect(() => {
    if (!user) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) setAccessToken(data.session.access_token)
    })
  }, [user])

  function loadResults() {
    if (!accessToken || !quizId) return
    fetch(`/api/quizzes/${quizId}/results`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(resultsRes => {
        if (!resultsRes?.error) {
          setResults(resultsRes.results ?? [])
          setResultsSummary({
            total_attempts: resultsRes.total_attempts ?? 0,
            submitted_count: resultsRes.submitted_count ?? 0,
            average_score: resultsRes.average_score ?? null,
          })
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    if (!accessToken || !quizId) return
    setLoading(true)
    setLoadError('')

    fetch(`/api/quizzes/${quizId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(quizRes => {
        if (quizRes?.error) {
          setLoadError(quizRes.error)
          return
        }
        setQuiz(quizRes?.data ?? quizRes)
        loadResults()
      })
      .catch(() => setLoadError('تعذّر الاتصال بالخادم.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, quizId])

  // ── جديد: فتح مودال مراجعة محاولة ─────────────────────────────
  function openAttempt(attemptId: string) {
    if (!accessToken) return
    setOpenAttemptId(attemptId)
    setAttemptLoading(true)
    setAttemptDetail(null)
    setGradeError('')
    fetch(`/api/quizzes/${quizId}/attempt/${attemptId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(data => {
        if (data?.error) {
          setGradeError(data.error)
          return
        }
        setAttemptDetail(data)
        // تهيئة مسودات التصحيح للأسئلة التي تحتاج مراجعة
        const drafts: Record<string, { score: string; feedback: string }> = {}
        for (const q of data.questions || []) {
          if (q.evaluation?.needs_ai_review || q.evaluation?.manually_graded) {
            drafts[q.question_id] = {
              score: q.evaluation?.score != null && q.evaluation.score >= 0 ? String(q.evaluation.score) : '',
              feedback: q.evaluation?.immediate_feedback || '',
            }
          }
        }
        setGradeDrafts(drafts)
      })
      .catch(() => setGradeError('تعذّر تحميل تفاصيل المحاولة.'))
      .finally(() => setAttemptLoading(false))
  }

  // ── جديد: حفظ تصحيح سؤال مقالي ────────────────────────────────
  async function saveGrade(questionId: string, maxPoints: number) {
    if (!accessToken || !openAttemptId) return
    const draft = gradeDrafts[questionId]
    if (!draft || draft.score.trim() === '') {
      setGradeError('اكتب الدرجة قبل الحفظ.')
      return
    }
    const scoreNum = Number(draft.score)
    if (Number.isNaN(scoreNum) || scoreNum < 0) {
      setGradeError('الدرجة يجب أن تكون رقماً صحيحاً.')
      return
    }
    setSavingQuestionId(questionId)
    setGradeError('')
    try {
      const res = await fetch(`/api/quizzes/${quizId}/attempt/${openAttemptId}/grade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          question_id: questionId,
          score: Math.min(scoreNum, maxPoints),
          feedback: draft.feedback.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setGradeError(data?.error || 'فشل حفظ التصحيح.')
        return
      }
      // تحديث محلي فوري + إعادة جلب نتائج القائمة الرئيسية
      openAttempt(openAttemptId)
      loadResults()
    } catch {
      setGradeError('تعذّر الاتصال بالخادم.')
    } finally {
      setSavingQuestionId(null)
    }
  }

  const T = {
    bg: BRAND.bg, cardBg: BRAND.bgSoft, text: BRAND.text, sub: BRAND.sub, border: BRAND.border,
    inputBg: 'rgba(140,20,40,0.04)',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: `1.5px solid ${T.border}`, background: T.inputBg, color: T.text,
    fontSize: 13, fontFamily: 'inherit',
  }

  function formatDuration(seconds: number | null): string {
    if (!seconds) return '—'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const pendingReviewCount = attemptDetail?.questions.filter(q => q.evaluation?.needs_ai_review).length ?? 0

  // ── جديد: ترجمة معرّف الخيار (UUID) إلى نصّه المقروء — لأسئلة
  // multiple_choice، إجابة الطالب والإجابة الصحيحة كلاهما مخزَّنان
  // بصيغة id الخيار، لا نصّه. بدون هذا تظهر UUID خاماً في الواجهة. ──
  function resolveAnswerText(q: AttemptQuestionItem, raw: string | string[] | null | undefined): string {
    if (raw == null) return '— لم يُجب —'
    if (q.type === 'multiple_choice' && q.options) {
      const ids = Array.isArray(raw) ? raw : [raw]
      const texts = ids.map(id => q.options!.find(o => o.id === id)?.text ?? id)
      return texts.join('، ')
    }
    return Array.isArray(raw) ? raw.join('، ') : raw
  }

  if (!user) return null

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: BRAND.fontBody, paddingBottom: 60 }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(247,242,234,0.97)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${T.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => router.push('/teacher/quizzes')} style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: themeColor, color: '#1a1a2e', fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>→ رجوع</button>
        <h1 style={{ fontSize: 16, fontWeight: 900, color: themeColor, background: `${themeColor}16`, padding: '4px 12px', borderRadius: 8, margin: 0, fontFamily: BRAND.fontHeading }}>
          {quiz?.title ? `🎯 ${quiz.title}` : 'تفاصيل الاختبار'}
        </h1>
        <div style={{ width: 90 }} />
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '20px 16px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: T.sub }}>⏳ جارٍ التحميل...</div>
        )}

        {loadError && !loading && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <p style={{ color: BRAND.crimson, fontWeight: 700 }}>{loadError}</p>
          </div>
        )}

        {quiz && !loading && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {([['results', '📊 النتائج'], ['questions', '📋 الأسئلة']] as const).map(([val, label]) => (
                <button key={val} onClick={() => setView(val)}
                  style={{ flex: 1, padding: '10px', borderRadius: 12, border: `2px solid ${view === val ? themeColor : T.border}`, background: view === val ? `${themeColor}14` : 'transparent', color: view === val ? themeColor : T.sub, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}>
                  {label}
                </button>
              ))}
            </div>

            {view === 'results' && (
              <div style={{ display: 'grid', gap: 16 }}>
                {resultsSummary && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                    <div style={{ padding: '14px 10px', borderRadius: 12, background: T.cardBg, border: `1.5px solid ${T.border}`, textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: themeColor }}>{resultsSummary.total_attempts}</div>
                      <div style={{ fontSize: 11, color: T.sub }}>محاولة</div>
                    </div>
                    <div style={{ padding: '14px 10px', borderRadius: 12, background: T.cardBg, border: `1.5px solid ${T.border}`, textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#059669' }}>{resultsSummary.submitted_count}</div>
                      <div style={{ fontSize: 11, color: T.sub }}>مُسلَّمة</div>
                    </div>
                    <div style={{ padding: '14px 10px', borderRadius: 12, background: T.cardBg, border: `1.5px solid ${T.border}`, textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: themeColor }}>{resultsSummary.average_score !== null ? `${resultsSummary.average_score}%` : '—'}</div>
                      <div style={{ fontSize: 11, color: T.sub }}>المتوسط</div>
                    </div>
                  </div>
                )}

                {results.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 20px', background: T.cardBg, borderRadius: 16, border: `1.5px solid ${T.border}` }}>
                    <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
                    <p style={{ color: T.sub, fontSize: 14 }}>لم يحل أي طالب هذا الاختبار بعد.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {results.map(r => (
                      <button key={r.attempt_id} onClick={() => r.status === 'submitted' && openAttempt(r.attempt_id)}
                        disabled={r.status !== 'submitted'}
                        style={{ padding: '14px 16px', borderRadius: 14, background: T.cardBg, border: `1.5px solid ${r.status === 'submitted' ? T.border : 'rgba(217,119,6,0.3)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: r.status === 'submitted' ? 'pointer' : 'default', fontFamily: 'inherit', textAlign: 'right', width: '100%' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{r.student_name}</div>
                          <div style={{ fontSize: 12, color: T.sub, marginTop: 3 }}>
                            {r.status === 'submitted'
                              ? `${new Date(r.submitted_at!).toLocaleDateString('ar-KW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • ⏱️ ${formatDuration(r.time_spent_seconds)}`
                              : '⏳ جارٍ الحل الآن'}
                          </div>
                        </div>
                        {r.status === 'submitted' ? (
                          <span style={{ fontSize: 18, fontWeight: 900, color: (r.score ?? 0) >= 60 ? '#059669' : BRAND.crimson }}>{r.score}%</span>
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 700, color: BRAND.orange }}>جارية</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {view === 'questions' && (
              <div style={{ display: 'grid', gap: 12 }}>
                <p style={{ fontSize: 13, color: T.sub, textAlign: 'center' }}>{quiz.questions_count} سؤال — {quiz.total_points} درجة إجمالية</p>
                {quiz.questions.map((q, i) => (
                  <div key={q.id} style={{ padding: 16, borderRadius: 14, background: T.cardBg, border: `1.5px solid ${T.border}` }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }}>{i + 1}. {q.text}</div>
                    {q.type === 'multiple_choice' && q.options && (
                      <div style={{ display: 'grid', gap: 6 }}>
                        {q.options.map(o => (
                          <div key={o.id} style={{ padding: '8px 12px', borderRadius: 8, background: o.is_correct ? 'rgba(5,150,105,0.08)' : T.inputBg, fontSize: 13, color: o.is_correct ? '#059669' : T.sub, fontWeight: o.is_correct ? 700 : 400 }}>
                            {o.is_correct ? '✅ ' : ''}{o.text}
                          </div>
                        ))}
                      </div>
                    )}
                    {(q.type === 'true_false' || q.type === 'fill_blank') && (
                      <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(5,150,105,0.08)', fontSize: 13, color: '#059669', fontWeight: 700 }}>
                        ✅ الإجابة الصحيحة: {q.correct_answer}
                      </div>
                    )}
                    {q.type === 'essay' && (
                      <div style={{ padding: '8px 12px', borderRadius: 8, background: T.inputBg, fontSize: 12, color: T.sub }}>سؤال مقالي — تصحيح يدوي</div>
                    )}
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 8, textAlign: 'left' }}>{q.points} درجة</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* ══ جديد: مودال مراجعة وتصحيح محاولة طالب ══════════════════ */}
      {openAttemptId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setOpenAttemptId(null) }}>
          <div style={{ width: '100%', maxWidth: 700, maxHeight: '90vh', borderRadius: 20, background: T.cardBg, border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: themeColor, background: `${themeColor}14`, display: 'inline-block', padding: '3px 12px', borderRadius: 8, margin: 0, fontFamily: BRAND.fontHeading }}>
                  ✏️ {attemptDetail?.student_name || 'جارٍ التحميل...'}
                </h3>
                {attemptDetail && (
                  <p style={{ fontSize: 12, color: T.sub, margin: '4px 0 0' }}>
                    الدرجة الحالية: {attemptDetail.score}%
                    {pendingReviewCount > 0 && <span style={{ color: BRAND.orange, fontWeight: 700 }}> • {pendingReviewCount} سؤال بانتظار تصحيحك</span>}
                  </p>
                )}
              </div>
              <button onClick={() => setOpenAttemptId(null)} style={{ background: 'none', border: 'none', color: T.sub, fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>
              {attemptLoading ? (
                <p style={{ color: T.sub, fontSize: 13, textAlign: 'center' }}>⏳ جارٍ التحميل...</p>
              ) : gradeError && !attemptDetail ? (
                <p style={{ color: BRAND.crimson, fontSize: 13, textAlign: 'center', fontWeight: 700 }}>⚠️ {gradeError}</p>
              ) : attemptDetail ? (
                <div style={{ display: 'grid', gap: 14 }}>
                  {gradeError && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(180,40,40,0.1)', color: BRAND.crimson, fontSize: 13, fontWeight: 700 }}>⚠️ {gradeError}</div>
                  )}
                  {attemptDetail.questions.map((q, i) => {
                    const needsReview = q.evaluation?.needs_ai_review
                    const isManual = q.evaluation?.manually_graded
                    const draft = gradeDrafts[q.question_id]

                    return (
                      <div key={q.question_id} style={{ padding: 16, borderRadius: 14, background: needsReview ? 'rgba(217,119,6,0.05)' : T.inputBg, border: `1.5px solid ${needsReview ? 'rgba(217,119,6,0.3)' : T.border}` }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }}>{i + 1}. {q.text}</div>

                        <div style={{ padding: '10px 12px', borderRadius: 10, background: T.cardBg, border: `1px solid ${T.border}`, marginBottom: 10, fontSize: 13, color: T.text, lineHeight: 1.7 }}>
                          <span style={{ fontSize: 11, color: T.sub, fontWeight: 700, display: 'block', marginBottom: 4 }}>إجابة الطالب:</span>
                          {resolveAnswerText(q, q.student_answer)}
                        </div>

                        {!needsReview && !isManual && q.evaluation && (
                          <div style={{ fontSize: 13, fontWeight: 700, color: q.evaluation.is_correct ? '#059669' : BRAND.crimson }}>
                            {q.evaluation.immediate_feedback} — {q.evaluation.score}/{q.points}
                          </div>
                        )}

                        {(needsReview || isManual) && (
                          <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                            {isManual && !needsReview && (
                              <div style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>✅ مصحَّحة يدوياً — {q.evaluation?.score}/{q.points}</div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 8 }}>
                              <input
                                type="number" min={0} max={q.points}
                                value={draft?.score ?? ''}
                                onChange={e => setGradeDrafts(prev => ({ ...prev, [q.question_id]: { score: e.target.value, feedback: prev[q.question_id]?.feedback ?? '' } }))}
                                placeholder={`من ${q.points}`}
                                style={{ ...inputStyle, textAlign: 'center', fontWeight: 800 }}
                              />
                              <input
                                value={draft?.feedback ?? ''}
                                onChange={e => setGradeDrafts(prev => ({ ...prev, [q.question_id]: { score: prev[q.question_id]?.score ?? '', feedback: e.target.value } }))}
                                placeholder="ملاحظة للطالب (اختياري)"
                                style={inputStyle}
                              />
                            </div>
                            <button
                              onClick={() => saveGrade(q.question_id, q.points)}
                              disabled={savingQuestionId === q.question_id}
                              style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: themeColor, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start' }}>
                              {savingQuestionId === q.question_id ? '⏳ جارٍ الحفظ...' : isManual ? '🔄 تعديل الدرجة' : '💾 حفظ الدرجة'}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
