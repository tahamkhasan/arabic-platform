'use client'
import { useState } from 'react'

// ── الأنواع ───────────────────────────────────────────────────
interface Question {
  id:          number
  type:        'multiple' | 'truefalse' | 'fill'
  question:    string
  options?:    string[]
  correct:     string | number | boolean
  explanation: string
}

interface QuizData {
  title:     string
  questions: Question[]
}

interface Props {
  quiz:       QuizData
  themeColor: string
  textCol:    string
  subCol:     string
  cardBg:     string
  borderCol:  string
  inputBg:    string
  isDark:     boolean
  onClose:    () => void
}

// ── حالة الإجابة لكل سؤال ────────────────────────────────────
type AnswerState = {
  value:     string | number | boolean | null
  submitted: boolean
  correct:   boolean
}

export default function QuizPlayer({
  quiz, themeColor, textCol, subCol, cardBg, borderCol, inputBg, isDark, onClose
}: Props) {
  const [current,   setCurrent]   = useState(0)
  const [answers,   setAnswers]   = useState<AnswerState[]>(
    quiz.questions.map(() => ({ value: null, submitted: false, correct: false }))
  )
  const [fillInput, setFillInput] = useState('')
  const [finished,  setFinished]  = useState(false)

  const q        = quiz.questions[current]
  const ans      = answers[current]
  const total    = quiz.questions.length
  const score    = answers.filter(a => a.correct).length
  const progress = ((current + 1) / total) * 100

  // ── التحقق من الإجابة ────────────────────────────────────────
  function checkAnswer(value: string | number | boolean) {
    let correct = false

    if (q.type === 'multiple') {
      correct = value === q.correct
    } else if (q.type === 'truefalse') {
      correct = value === q.correct
    } else if (q.type === 'fill') {
      // مقارنة مرنة — تجاهل التشكيل والمسافات الزائدة
      const normalize = (s: string) =>
        s.trim()
         .replace(/[\u064B-\u065F]/g, '')  // حذف التشكيل
         .replace(/\s+/g, ' ')
         .toLowerCase()
      correct = normalize(value as string) === normalize(String(q.correct))
    }

    const updated = [...answers]
    updated[current] = { value, submitted: true, correct }
    setAnswers(updated)
    setFillInput('')
  }

  // ── الانتقال للسؤال التالي ────────────────────────────────────
  function next() {
    if (current < total - 1) {
      setCurrent(c => c + 1)
      setFillInput('')
    } else {
      setFinished(true)
    }
  }

  // ── إعادة المحاولة ────────────────────────────────────────────
  function retry() {
    setCurrent(0)
    setAnswers(quiz.questions.map(() => ({ value: null, submitted: false, correct: false })))
    setFillInput('')
    setFinished(false)
  }

  // ── شاشة النتيجة النهائية ─────────────────────────────────────
  if (finished) {
    const pct     = Math.round((score / total) * 100)
    const grade   = pct >= 90 ? 'ممتاز 🌟' : pct >= 75 ? 'جيد جداً 👍' : pct >= 60 ? 'جيد ✅' : 'يحتاج مراجعة 📚'
    const gradeColor = pct >= 90 ? '#43e97b' : pct >= 75 ? '#4facfe' : pct >= 60 ? '#f9d423' : '#fc8181'

    return (
      <div style={{ padding: '20px 0' }}>
        {/* الدائرة الدورية */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 140, height: 140, borderRadius: '50%', margin: '0 auto 16px',
            background: `conic-gradient(${gradeColor} ${pct * 3.6}deg, ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <div style={{
              width: 112, height: 112, borderRadius: '50%',
              background: isDark ? '#1a1630' : '#fff',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: gradeColor }}>{pct}%</span>
              <span style={{ fontSize: 11, color: subCol, marginTop: 2 }}>{score}/{total}</span>
            </div>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: gradeColor, margin: '0 0 6px' }}>{grade}</h2>
          <p style={{ fontSize: 15, color: subCol, margin: 0 }}>{quiz.title}</p>
        </div>

        {/* مراجعة الأسئلة */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {quiz.questions.map((question, i) => (
            <div key={question.id} style={{
              padding: '14px 16px', borderRadius: 12,
              background: answers[i].correct
                ? 'rgba(67,233,123,0.1)' : 'rgba(252,129,129,0.1)',
              border: `1px solid ${answers[i].correct ? '#43e97b44' : '#fc818144'}`,
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{answers[i].correct ? '✅' : '❌'}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: textCol, margin: '0 0 6px', lineHeight: 1.5 }}>
                    {question.question}
                  </p>
                  {!answers[i].correct && (
                    <p style={{ fontSize: 13, color: '#43e97b', margin: '0 0 4px' }}>
                      ✓ الإجابة الصحيحة: {
                        question.type === 'multiple'
                          ? question.options?.[Number(question.correct)]
                          : question.type === 'truefalse'
                            ? (question.correct ? 'صح ✓' : 'خطأ ✗')
                            : String(question.correct)
                      }
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: subCol, margin: 0 }}>💡 {question.explanation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* الأزرار */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={retry}
            style={{
              flex: 1, padding: '14px', borderRadius: 12, border: 'none',
              background: `linear-gradient(135deg,${themeColor},#ff4e50)`,
              color: '#1a1a2e', fontWeight: 900, fontSize: 15,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
            🔄 حاول مرة أخرى
          </button>
          <button onClick={onClose}
            style={{
              flex: 1, padding: '14px', borderRadius: 12,
              border: `1.5px solid ${borderCol}`, background: 'transparent',
              color: subCol, fontWeight: 700, fontSize: 15,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
            ✕ إغلاق
          </button>
        </div>
      </div>
    )
  }

  // ── شاشة السؤال ───────────────────────────────────────────────
  return (
    <div style={{ padding: '4px 0' }}>

      {/* شريط التقدم */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: subCol, fontWeight: 700 }}>
            السؤال {current + 1} من {total}
          </span>
          <span style={{ fontSize: 13, color: themeColor, fontWeight: 700 }}>
            ✅ {answers.filter(a => a.submitted && a.correct).length} صحيح
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 4,
            background: `linear-gradient(90deg,${themeColor},#ff4e50)`,
            width: `${progress}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* نوع السؤال */}
      <div style={{
        display: 'inline-block', fontSize: 11, padding: '3px 10px', borderRadius: 6,
        background: `${themeColor}22`, color: themeColor, fontWeight: 700,
        marginBottom: 14,
      }}>
        {q.type === 'multiple'  ? '📋 اختيار متعدد' :
         q.type === 'truefalse' ? '✓✗ صح أو خطأ'  :
                                  '✍️ تكملة الفراغ'}
      </div>

      {/* نص السؤال */}
      <div style={{
        padding: '18px 20px', borderRadius: 14,
        background: inputBg, border: `1.5px solid ${borderCol}`,
        marginBottom: 20,
      }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: textCol, margin: 0, lineHeight: 1.7 }}>
          {q.question}
        </p>
      </div>

      {/* ── اختيار متعدد ── */}
      {q.type === 'multiple' && q.options && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {q.options.map((opt, i) => {
            const isSelected = ans.value === i
            const isCorrect  = i === Number(q.correct)
            let bgColor      = 'transparent'
            let borderColor  = borderCol
            let textColor    = textCol

            if (ans.submitted) {
              if (isCorrect)           { bgColor = 'rgba(67,233,123,0.15)';  borderColor = '#43e97b'; textColor = '#43e97b' }
              else if (isSelected)     { bgColor = 'rgba(252,129,129,0.15)'; borderColor = '#fc8181'; textColor = '#fc8181' }
            } else if (isSelected) {
              bgColor     = `${themeColor}18`
              borderColor = themeColor
              textColor   = themeColor
            }

            return (
              <button key={i}
                onClick={() => !ans.submitted && checkAnswer(i)}
                disabled={ans.submitted}
                style={{
                  padding: '14px 18px', borderRadius: 12, textAlign: 'right',
                  border: `2px solid ${borderColor}`,
                  background: bgColor, color: textColor,
                  cursor: ans.submitted ? 'default' : 'pointer',
                  fontFamily: 'inherit', fontSize: 15, fontWeight: 600,
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${borderColor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 900,
                  background: isSelected || (ans.submitted && isCorrect) ? borderColor : 'transparent',
                  color: isSelected || (ans.submitted && isCorrect)
                    ? (isCorrect ? '#fff' : '#fff') : borderColor,
                }}>
                  {ans.submitted && isCorrect ? '✓' : ans.submitted && isSelected && !isCorrect ? '✗' : ['أ','ب','ج','د'][i]}
                </span>
                {opt}
              </button>
            )
          })}
        </div>
      )}

      {/* ── صح أو خطأ ── */}
      {q.type === 'truefalse' && (
        <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
          {[
            { val: true,  label: 'صح ✓', color: '#43e97b' },
            { val: false, label: 'خطأ ✗', color: '#fc8181' },
          ].map(opt => {
            const isSelected = ans.value === opt.val
            const isCorrect  = q.correct === opt.val
            let border = borderCol
            let bg     = 'transparent'
            let color  = textCol

            if (ans.submitted) {
              if (isCorrect)        { border = '#43e97b'; bg = 'rgba(67,233,123,0.15)';  color = '#43e97b' }
              else if (isSelected)  { border = '#fc8181'; bg = 'rgba(252,129,129,0.15)'; color = '#fc8181' }
            } else if (isSelected) {
              border = opt.color; bg = `${opt.color}18`; color = opt.color
            }

            return (
              <button key={String(opt.val)}
                onClick={() => !ans.submitted && checkAnswer(opt.val)}
                disabled={ans.submitted}
                style={{
                  flex: 1, padding: '18px', borderRadius: 14,
                  border: `2px solid ${border}`,
                  background: bg, color,
                  cursor: ans.submitted ? 'default' : 'pointer',
                  fontFamily: 'inherit', fontSize: 18, fontWeight: 900,
                  transition: 'all 0.2s',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )}

      {/* ── تكملة فراغ ── */}
      {q.type === 'fill' && (
        <div style={{ marginBottom: 20 }}>
          {!ans.submitted ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                value={fillInput}
                onChange={e => setFillInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fillInput.trim() && checkAnswer(fillInput)}
                placeholder="اكتب إجابتك هنا..."
                style={{
                  flex: 1, padding: '14px 16px', borderRadius: 12,
                  border: `2px solid ${borderCol}`,
                  background: inputBg, color: textCol,
                  fontSize: 15, fontFamily: 'inherit',
                }}
              />
              <button
                onClick={() => fillInput.trim() && checkAnswer(fillInput)}
                disabled={!fillInput.trim()}
                style={{
                  padding: '14px 20px', borderRadius: 12, border: 'none',
                  background: fillInput.trim() ? themeColor : borderCol,
                  color: '#1a1a2e', fontWeight: 900, fontSize: 15,
                  cursor: fillInput.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                }}
              >
                تأكيد
              </button>
            </div>
          ) : (
            <div style={{
              padding: '14px 16px', borderRadius: 12,
              border: `2px solid ${ans.correct ? '#43e97b' : '#fc8181'}`,
              background: ans.correct ? 'rgba(67,233,123,0.1)' : 'rgba(252,129,129,0.1)',
            }}>
              <span style={{ fontSize: 14, color: ans.correct ? '#43e97b' : '#fc8181', fontWeight: 700 }}>
                {ans.correct ? '✅ إجابتك صحيحة!' : `❌ إجابتك: ${ans.value}`}
              </span>
              {!ans.correct && (
                <p style={{ fontSize: 14, color: '#43e97b', margin: '6px 0 0', fontWeight: 700 }}>
                  ✓ الإجابة الصحيحة: {String(q.correct)}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* شرح الإجابة */}
      {ans.submitted && (
        <div style={{
          padding: '14px 16px', borderRadius: 12,
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          border: `1px solid ${borderCol}`,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 12, color: themeColor, fontWeight: 700, marginBottom: 6 }}>💡 الشرح:</div>
          <p style={{ fontSize: 14, color: textCol, margin: 0, lineHeight: 1.7 }}>{q.explanation}</p>
        </div>
      )}

      {/* زر التالي */}
      {ans.submitted && (
        <button onClick={next}
          style={{
            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
            background: `linear-gradient(135deg,${themeColor},#ff4e50)`,
            color: '#1a1a2e', fontWeight: 900, fontSize: 16,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {current < total - 1 ? `السؤال التالي ← (${current + 2}/${total})` : '🏁 عرض النتيجة النهائية'}
        </button>
      )}
    </div>
  )
}