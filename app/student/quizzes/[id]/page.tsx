'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { BRAND } from '@/lib/constants/theme'
import { supabase } from '@/lib/supabase'

interface User { id: string; name: string; role: string; user_type: string; status?: string; theme_color?: string }

interface QuestionOption { id: string; text: string }
interface Question {
  id: string
  type: string
  text: string
  options?: QuestionOption[]
  points: number
  hint?: string
}
interface QuizData {
  id: string
  title: string
  description?: string
  time_limit_minutes?: number
  questions: Question[]
}

interface Evaluation {
  is_correct: boolean
  score: number
  immediate_feedback: string
  detailed_explanation: string
  needs_ai_review?: boolean
}

export default function StudentQuizPage() {
  const router = useRouter()
  const params = useParams()
  const quizId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState('')
  const [themeColor, setThemeColor] = useState<string>(BRAND.red)

  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [attemptId, setAttemptId] = useState('')
  const [loading, setLoading] = useState(true)
  const [startError, setStartError] = useState('')

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentIdx, setCurrentIdx] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [result, setResult] = useState<{
    score: number | null
    score_label: string
    correct_count: number
    total_questions: number
    evaluations: Record<string, Evaluation>
  } | null>(null)

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    const saved = localStorage.getItem('mosaed_user')
    if (!saved) { router.replace('/'); return }
    try {
      const u = JSON.parse(saved) as User
      if (u.user_type !== 'student') { router.replace('/dashboard'); return }
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

  // ── بدء/استئناف المحاولة، ثم جلب الأسئلة ────────────────────────
  useEffect(() => {
    if (!accessToken || !quizId) return
    setLoading(true)
    setStartError('')

    fetch(`/api/quizzes/${quizId}/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(async (startData) => {
        if (startData?.error) {
          setStartError(startData.error)
          setLoading(false)
          return
        }
        const data = startData?.data ?? startData
        setAttemptId(data.attempt_id)
        if (data.time_limit_minutes) setSecondsLeft(data.time_limit_minutes * 60)
        startTimeRef.current = Date.now()

        // جلب أسئلة الاختبار (الإجابات الصحيحة مخفية تلقائياً للطالب من الخادم)
        const quizRes = await fetch(`/api/quizzes/${quizId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const quizData = await quizRes.json()
        if (!quizRes.ok) {
          setStartError(quizData?.error || 'تعذّر تحميل الاختبار.')
          setLoading(false)
          return
        }
        setQuiz(quizData?.data ?? quizData)

        // إن كانت محاولة مستأنفة، استرجع الإجابات السابقة
        if (data.is_existing) {
          const attemptRes = await fetch(`/api/quizzes/${quizId}/attempt`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          const attemptData = await attemptRes.json()
          const ad = attemptData?.data ?? attemptData
          if (ad?.answers) setAnswers(ad.answers)
        }
        setLoading(false)
      })
      .catch(() => {
        setStartError('تعذّر الاتصال بالخادم.')
        setLoading(false)
      })
  }, [accessToken, quizId])

  // ── مؤقّت العدّ التنازلي ─────────────────────────────────────────
  useEffect(() => {
    if (secondsLeft === null || result) return
    if (secondsLeft <= 0) {
      handleSubmit()
      return
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s !== null ? s - 1 : null)), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, result])

  const T = {
    bg: BRAND.bg, cardBg: BRAND.bgSoft, text: BRAND.text, sub: BRAND.sub, border: BRAND.border,
    inputBg: 'rgba(140,20,40,0.04)',
  }

  function setAnswer(questionId: string, value: string) {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  async function handleSubmit() {
    if (!accessToken || !attemptId || submitting) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000)
      const res = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ attempt_id: attemptId, answers, time_spent_seconds: timeSpent }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setSubmitError(data?.error || 'فشل تسليم الإجابات.')
        return
      }
      setResult(data?.data ?? data)
    } catch {
      setSubmitError('تعذّر الاتصال بالخادم.')
    } finally {
      setSubmitting(false)
    }
  }

  function formatTime(s: number): string {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (!user) return null

  if (loading) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: BRAND.fontBody }}>
        <div style={{ textAlign: 'center', color: T.sub }}>
          <div style={{ width: 48, height: 48, border: `4px solid ${themeColor}33`, borderTopColor: themeColor, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p>⏳ جارٍ تحضير الاختبار...</p>
        </div>
      </div>
    )
  }

  if (startError) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: BRAND.fontBody, padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <p style={{ color: BRAND.crimson, fontWeight: 700, marginBottom: 20 }}>{startError}</p>
          <button onClick={() => router.push('/student')} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: themeColor, color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            ← رجوع للرئيسية
          </button>
        </div>
      </div>
    )
  }

  // ── شاشة النتائج بعد التسليم ── ────────────────────────────────
  if (result) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: T.bg, fontFamily: BRAND.fontBody, padding: '24px 16px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>{(result.score ?? 0) >= 60 ? '🎉' : '📚'}</div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: T.text, marginBottom: 8, fontFamily: BRAND.fontHeading }}>تم تسليم الاختبار!</h1>
            <div style={{ fontSize: 40, fontWeight: 900, color: themeColor, marginBottom: 6 }}>{result.score_label}</div>
            <p style={{ color: T.sub, fontSize: 14 }}>{result.correct_count} من {result.total_questions} إجابة صحيحة</p>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {quiz?.questions.map((q, i) => {
              const ev = result.evaluations[q.id]
              if (!ev) return null
              return (
                <div key={q.id} style={{ padding: 16, borderRadius: 14, background: T.cardBg, border: `1.5px solid ${ev.is_correct ? 'rgba(5,150,105,0.3)' : 'rgba(180,40,40,0.25)'}` }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8 }}>{i + 1}. {q.text}</div>
                  <div style={{ fontSize: 13, color: ev.is_correct ? '#059669' : BRAND.crimson, fontWeight: 700, marginBottom: 6 }}>{ev.immediate_feedback}</div>
                  {ev.detailed_explanation && (
                    <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.7 }}>{ev.detailed_explanation}</div>
                  )}
                  {ev.needs_ai_review && (
                    <div style={{ fontSize: 12, color: BRAND.orange, marginTop: 6 }}>⏳ بانتظار مراجعة المعلم</div>
                  )}
                </div>
              )
            })}
          </div>

          <button onClick={() => router.push('/student')} style={{ width: '100%', marginTop: 24, padding: '14px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg,${themeColor},${BRAND.gold})`, color: '#1a1a2e', fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
            ✅ تم — رجوع للرئيسية
          </button>
        </div>
      </div>
    )
  }

  if (!quiz) return null

  const currentQ = quiz.questions[currentIdx]
  const answeredCount = Object.keys(answers).filter(k => answers[k]?.trim()).length

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: `1.5px solid ${T.border}`, background: T.inputBg, color: T.text,
    fontSize: 14, fontFamily: 'inherit',
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: BRAND.fontBody, paddingBottom: 100 }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(247,242,234,0.97)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${T.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 16, fontWeight: 900, color: themeColor, background: `${themeColor}16`, padding: '4px 12px', borderRadius: 8, margin: 0, fontFamily: BRAND.fontHeading }}>🎯 {quiz.title}</h1>
        {secondsLeft !== null && (
          <span style={{ fontSize: 15, fontWeight: 900, color: secondsLeft < 60 ? BRAND.crimson : T.text, fontFamily: 'monospace' }}>⏰ {formatTime(secondsLeft)}</span>
        )}
      </header>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px' }}>
        {submitError && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(180,40,40,0.1)', color: BRAND.crimson, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>⚠️ {submitError}</div>
        )}

        <p style={{ fontSize: 13, color: T.sub, textAlign: 'center', marginBottom: 16 }}>
          سؤال {currentIdx + 1} من {quiz.questions.length} — أُجيب على {answeredCount}
        </p>

        {currentQ && (
          <div style={{ padding: 22, borderRadius: 18, background: T.cardBg, border: `1.5px solid ${T.border}`, marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 18, lineHeight: 1.8 }}>{currentQ.text}</div>

            {currentQ.type === 'multiple_choice' && currentQ.options && (
              <div style={{ display: 'grid', gap: 10 }}>
                {currentQ.options.map(opt => (
                  <button key={opt.id} onClick={() => setAnswer(currentQ.id, opt.id)}
                    style={{ textAlign: 'right', padding: '14px 16px', borderRadius: 12, border: `2px solid ${answers[currentQ.id] === opt.id ? themeColor : T.border}`, background: answers[currentQ.id] === opt.id ? `${themeColor}14` : 'transparent', color: answers[currentQ.id] === opt.id ? themeColor : T.text, cursor: 'pointer', fontSize: 14, fontWeight: answers[currentQ.id] === opt.id ? 800 : 500, fontFamily: 'inherit' }}>
                    {opt.text}
                  </button>
                ))}
              </div>
            )}

            {currentQ.type === 'true_false' && (
              <div style={{ display: 'flex', gap: 12 }}>
                {([['true', '✅ صحيح'], ['false', '❌ خطأ']] as const).map(([val, label]) => (
                  <button key={val} onClick={() => setAnswer(currentQ.id, val)}
                    style={{ flex: 1, padding: '16px', borderRadius: 12, border: `2px solid ${answers[currentQ.id] === val ? themeColor : T.border}`, background: answers[currentQ.id] === val ? `${themeColor}14` : 'transparent', color: answers[currentQ.id] === val ? themeColor : T.text, cursor: 'pointer', fontSize: 15, fontWeight: 800, fontFamily: 'inherit' }}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            {currentQ.type === 'fill_blank' && (
              <input value={answers[currentQ.id] ?? ''} onChange={e => setAnswer(currentQ.id, e.target.value)} placeholder="اكتب إجابتك..." style={inputStyle} />
            )}

            {currentQ.type === 'essay' && (
              <textarea value={answers[currentQ.id] ?? ''} onChange={e => setAnswer(currentQ.id, e.target.value)} placeholder="اكتب إجابتك بالتفصيل..." rows={6} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.8 }} />
            )}

            {currentQ.hint && (
              <p style={{ fontSize: 12, color: T.sub, marginTop: 14 }}>💡 تلميح: {currentQ.hint}</p>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}
            style={{ flex: 1, padding: '12px', borderRadius: 12, border: `1.5px solid ${T.border}`, background: 'transparent', color: currentIdx === 0 ? T.border : T.text, cursor: currentIdx === 0 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>
            → السابق
          </button>
          {currentIdx < quiz.questions.length - 1 ? (
            <button onClick={() => setCurrentIdx(i => Math.min(quiz.questions.length - 1, i + 1))}
              style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: themeColor, color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 14, fontFamily: 'inherit' }}>
              التالي ←
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${themeColor},${BRAND.gold})`, color: '#1a1a2e', cursor: 'pointer', fontWeight: 900, fontSize: 15, fontFamily: 'inherit' }}>
              {submitting ? '⏳ جارٍ التسليم...' : '✅ تسليم الاختبار'}
            </button>
          )}
        </div>

        {/* شريط تنقّل سريع بين الأسئلة */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24, justifyContent: 'center' }}>
          {quiz.questions.map((q, i) => (
            <button key={q.id} onClick={() => setCurrentIdx(i)}
              style={{ width: 34, height: 34, borderRadius: 8, border: `1.5px solid ${i === currentIdx ? themeColor : T.border}`, background: answers[q.id]?.trim() ? `${themeColor}18` : 'transparent', color: i === currentIdx ? themeColor : T.sub, cursor: 'pointer', fontWeight: 800, fontSize: 13, fontFamily: 'inherit' }}>
              {i + 1}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}