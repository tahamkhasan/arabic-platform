'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ar } from '@/lib/constants/ar'
import MarkdownRenderer   from '@/components/MarkdownRenderer'
import QuizPlayer         from '@/components/QuizPlayer'
import FlashcardPlayer    from '@/components/FlashcardPlayer'
import NotificationBell from '@/components/NotificationBell'
const c = ar.common

interface User       { id: string; name: string; role: string; user_type: string; theme_color?: string; theme_mode?: string; allowed_grades?: string[]; allowed_stages?: string[] }
interface Subject    { id: string; name: string; icon?: string; grade?: string; stage?: string }
interface Unit       { id: string; name: string; icon?: string }
interface Lesson     { id: string; name: string; content?: string }
interface Assignment { id: string; title: string; content: string; tool: string; deadline?: string; max_grade: number; subject_id: string; submitted?: boolean; grade?: number | null; ai_grade?: number | null }
interface Message    { id: string; from_id: string; to_id: string; content: string; image_url?: string; is_read: boolean; created_at: string }
interface Media      { id: string; title: string; type: 'video' | 'audio'; url: string; thumbnail?: string; subject_id: string }
interface QuizQuestion {
  id: number; type: 'multiple' | 'truefalse' | 'fill'
  question: string; options?: string[]
  correct: string | number | boolean; explanation: string
}
interface QuizData        { title: string; questions: QuizQuestion[] }
interface FlashcardsData  {
  title: string; lessonType: string
  cards: { id: number; category: string; front: string; back: string; example?: string | null }[]
}

// ── أدوات التدرب — تشمل الاختبار والبطاقات ───────────────────
const PRACTICE_TOOLS = [
  { id: 'explain',    icon: '💡', label: 'شرح الدرس',      desc: 'شرح مبسط مع أمثلة' },
  { id: 'worksheet',  icon: '📋', label: 'ورقة عمل',        desc: 'أنشطة تفاعلية' },
  { id: 'quiz',       icon: '🎯', label: 'اختبار تفاعلي',   desc: 'أسئلة وتصحيح فوري' },
  { id: 'flashcards', icon: '🃏', label: 'بطاقات الحفظ',    desc: 'راجع بالبطاقات الذكية' },
] as const

const THEME_COLORS = [
  { name: 'أزرق',    value: '#4facfe', gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)' },
  { name: 'ذهبي',    value: '#f9d423', gradient: 'linear-gradient(135deg,#f9d423,#ff4e50)' },
  { name: 'أخضر',    value: '#43e97b', gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)' },
  { name: 'بنفسجي',  value: '#a78bfa', gradient: 'linear-gradient(135deg,#a78bfa,#ec4899)' },
  { name: 'برتقالي', value: '#f97316', gradient: 'linear-gradient(135deg,#f97316,#ef4444)' },
  { name: 'وردي',    value: '#ec4899', gradient: 'linear-gradient(135deg,#ec4899,#8b5cf6)' },
]

type Tab = 'home' | 'assignments' | 'lessons' | 'practice' | 'messages' | 'media'

export default function StudentPage() {
  const router = useRouter()

  const [user,         setUser]         = useState<User | null>(null)
  const [themeColor,   setThemeColor]   = useState('#4facfe')
  const [themeMode,    setThemeMode]    = useState<'dark' | 'light' | 'system'>('dark')
  const [isDark,       setIsDark]       = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [savingSet,    setSavingSet]    = useState(false)
  const [tab,          setTab]          = useState<Tab>('home')

  const [subjects,   setSubjects]   = useState<Subject[]>([])
  const [selSubject, setSelSubject] = useState<Subject | null>(null)
  const [units,      setUnits]      = useState<Unit[]>([])
  const [selUnit,    setSelUnit]    = useState<Unit | null>(null)
  const [lessons,    setLessons]    = useState<Lesson[]>([])
  const [selLesson,  setSelLesson]  = useState<Lesson | null>(null)

  // ── أدوات التدرب ──────────────────────────────────────────────
  const [practiceTool,    setPracticeTool]    = useState('')
  const [practiceOutput,  setPracticeOutput]  = useState('')
  const [practiceLoading, setPracticeLoading] = useState(false)
  const [practiceError,   setPracticeError]   = useState('')

  // ── الاختبار التفاعلي ─────────────────────────────────────────
  const [quizData,    setQuizData]    = useState<QuizData | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizError,   setQuizError]   = useState('')
  const [showQuiz,    setShowQuiz]    = useState(false)

  // ── بطاقات الحفظ ──────────────────────────────────────────────
  const [flashData,    setFlashData]    = useState<FlashcardsData | null>(null)
  const [flashLoading, setFlashLoading] = useState(false)
  const [flashError,   setFlashError]   = useState('')
  const [showFlash,    setShowFlash]    = useState(false)

  // ── المهام ────────────────────────────────────────────────────
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [openAssign,  setOpenAssign]  = useState<Assignment | null>(null)
  const [answerText,  setAnswerText]  = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [submitDone,  setSubmitDone]  = useState(false)

  // ── الرسائل ───────────────────────────────────────────────────
  const [messages,    setMessages]    = useState<Message[]>([])
  const [newMsg,      setNewMsg]      = useState('')
  const [sendingMsg,  setSendingMsg]  = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [teacherId,   setTeacherId]   = useState<string | null>(null)

  // ── الوسائط ───────────────────────────────────────────────────
  const [media,     setMedia]     = useState<Media[]>([])
  const [openMedia, setOpenMedia] = useState<Media | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('mosaed_user')
    if (!saved) { router.replace('/'); return }
    try {
      const u = JSON.parse(saved) as User
      if (u.role === 'admin')        { router.replace('/admin');     return }
      if (u.user_type !== 'student') { router.replace('/dashboard'); return }
      setUser(u)
      if (u.theme_color) setThemeColor(u.theme_color)
      if (u.theme_mode)  setThemeMode(u.theme_mode as 'dark' | 'light' | 'system')
    } catch { router.replace('/') }
  }, [router])

  useEffect(() => {
    const calc = () => {
      if (themeMode === 'dark')  return setIsDark(true)
      if (themeMode === 'light') return setIsDark(false)
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    calc()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', calc)
    return () => mq.removeEventListener('change', calc)
  }, [themeMode])

  useEffect(() => {
    if (!user) return
    fetch('/api/subjects').then(r => r.json()).then(d => setSubjects(d.subjects ?? [])).catch(console.error)
  }, [user])

  useEffect(() => {
    if (!selSubject) { setUnits([]); setSelUnit(null); return }
    fetch(`/api/units?subjectId=${selSubject.id}`).then(r => r.json()).then(d => setUnits(d.units ?? [])).catch(console.error)
  }, [selSubject])

  useEffect(() => {
    if (!selUnit) { setLessons([]); setSelLesson(null); return }
    fetch(`/api/lessons?unitId=${selUnit.id}`).then(r => r.json()).then(d => setLessons(d.lessons ?? [])).catch(console.error)
  }, [selUnit])

  useEffect(() => {
    if (!user || tab !== 'assignments') return
    fetch(`/api/assignments?studentId=${user.id}`).then(r => r.json()).then(d => setAssignments(d.assignments ?? [])).catch(console.error)
  }, [user, tab])

  useEffect(() => {
    if (!user || tab !== 'messages') return
    fetch(`/api/messages?userId=${user.id}`)
      .then(r => r.json())
      .then(d => { setMessages(d.messages ?? []); setTeacherId(d.teacherId ?? null); setUnreadCount(d.unread ?? 0) })
      .catch(console.error)
  }, [user, tab])

  useEffect(() => {
    if (!user || tab !== 'media') return
    fetch(`/api/teacher-media?studentId=${user.id}`).then(r => r.json()).then(d => setMedia(d.media ?? [])).catch(console.error)
  }, [user, tab])

  useEffect(() => {
    if (!user) return
    const fn = () => fetch(`/api/messages?userId=${user.id}&unreadOnly=true`)
      .then(r => r.json()).then(d => setUnreadCount(d.unread ?? 0)).catch(() => {})
    fn()
    const iv = setInterval(fn, 30000)
    return () => clearInterval(iv)
  }, [user])

  const bg        = isDark ? '#0d0b1e'                : '#f0f4ff'
  const cardBg    = isDark ? 'rgba(255,255,255,0.09)' : '#ffffff'
  const textCol   = isDark ? '#f1f5f9'                : '#1a202c'
  const subCol    = isDark ? '#94a3b8'                : '#4a5568'
  const borderCol = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)'
  const inputBg   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)'
  const headerBg  = isDark ? 'rgba(13,11,30,0.97)'   : 'rgba(240,244,255,0.97)'

  async function saveSettings() {
    if (!user) return
    setSavingSet(true)
    try {
      await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, theme_color: themeColor, theme_mode: themeMode }) })
      const updated = { ...user, theme_color: themeColor, theme_mode: themeMode }
      setUser(updated)
      localStorage.setItem('mosaed_user', JSON.stringify(updated))
    } finally { setSavingSet(false); setShowSettings(false) }
  }

  // ── توليد نصي (شرح / ورقة عمل) ──────────────────────────────
  async function handlePractice() {
    if (!user || !selLesson || !practiceTool) return
    setPracticeLoading(true); setPracticeOutput(''); setPracticeError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, tool: practiceTool, grade: selSubject?.grade ?? user.allowed_grades?.[0] ?? '', stage: selSubject?.stage ?? user.allowed_stages?.[0] ?? '', prompt: selLesson.name, material: selLesson.content ?? '' }),
      })
      const data = await res.json()
      if (!res.ok) { setPracticeError(data.error || c.errors.generic); return }
      setPracticeOutput(data.result)
    } catch { setPracticeError(c.errors.connection) }
    finally  { setPracticeLoading(false) }
  }

  // ── اختبار تفاعلي ─────────────────────────────────────────────
  async function generateQuiz() {
    if (!user || !selLesson) return
    setQuizLoading(true); setQuizError(''); setQuizData(null)
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonName: selLesson.name, material: selLesson.content ?? '', grade: selSubject?.grade ?? user.allowed_grades?.[0] ?? '', count: 8 }),
      })
      const data = await res.json()
      if (!res.ok) { setQuizError(data.error || 'حدث خطأ'); return }
      setQuizData(data.quiz); setShowQuiz(true)
    } catch { setQuizError('تعذّر الاتصال') }
    finally  { setQuizLoading(false) }
  }

  // ── بطاقات الحفظ ──────────────────────────────────────────────
  async function generateFlashcards() {
    if (!user || !selLesson) return
    if (!selLesson.content?.trim()) {
      setFlashError('هذا الدرس لا يحتوي على مادة علمية — يجب إضافتها من لوحة المدير أولاً')
      return
    }
    setFlashLoading(true); setFlashError(''); setFlashData(null)
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonName: selLesson.name, material: selLesson.content, grade: selSubject?.grade ?? user.allowed_grades?.[0] ?? '' }),
      })
      const data = await res.json()
      if (!res.ok) { setFlashError(data.error || 'حدث خطأ'); return }
      setFlashData(data.flashcards); setShowFlash(true)
    } catch { setFlashError('تعذّر الاتصال') }
    finally  { setFlashLoading(false) }
  }

  // ── دالة موحّدة للتوليد ───────────────────────────────────────
  function handleGenerate() {
    if (practiceTool === 'quiz')       generateQuiz()
    else if (practiceTool === 'flashcards') generateFlashcards()
    else handlePractice()
  }

  async function handleSubmit() {
    if (!user || !openAssign || !answerText.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/submissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignmentId: openAssign.id, studentId: user.id, answerText }) })
      if (res.ok) { setSubmitDone(true); setAnswerText('') }
    } finally { setSubmitting(false) }
  }

  async function handleSendMessage() {
    if (!user || !teacherId || !newMsg.trim()) return
    setSendingMsg(true)
    try {
      const res = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fromId: user.id, toId: teacherId, content: newMsg }) })
      const data = await res.json()
      if (res.ok) { setMessages(prev => [...prev, data.message]); setNewMsg('') }
    } finally { setSendingMsg(false) }
  }

  function handleLogout() {
    localStorage.removeItem('mosaed_user')
    localStorage.removeItem('mosaed_session')
    router.replace('/')
  }

  if (!user) return null

  const pendingCount = assignments.filter(a => !a.submitted).length
  const isGenerating = practiceLoading || quizLoading || flashLoading
  const anyError     = practiceError || quizError || flashError

  const TABS = [
    { id: 'home'       , icon: '🏠', label: 'الرئيسية' },
    { id: 'assignments', icon: '📝', label: 'مهامي',   badge: pendingCount },
    { id: 'lessons'    , icon: '📚', label: 'دروسي' },
    { id: 'practice'   , icon: '✨', label: 'تدرّب' },
    { id: 'messages'   , icon: '💬', label: 'رسائل',   badge: unreadCount },
    { id: 'media'      , icon: '🎥', label: 'وسائط' },
  ] as const

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: bg, color: textCol, fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif", paddingBottom: 90 }}>
      <style>{`
        * { box-sizing: border-box; } body { margin: 0; }
        @keyframes spin   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.35s ease; }
        textarea:focus, input:focus { outline: none; }
      `}</style>

      {/* الرأس */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: headerBg, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${borderCol}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>🌙</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: themeColor }}>{c.platformName}</div>
            <div style={{ fontSize: 13, color: subCol, marginTop: 2 }}>👨‍🎓 {user.name} • {user.allowed_grades?.[0] ? `الصف ${user.allowed_grades[0]}` : 'طالب'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowSettings(true)} style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: `1.5px solid ${borderCol}`, background: 'transparent', color: subCol, cursor: 'pointer', fontFamily: 'inherit' }}>⚙️ الإعدادات</button>
          {user && (
  <NotificationBell
    userId={user.id}
    themeColor={themeColor}
    textCol={textCol}
    subCol={subCol}
    cardBg={cardBg}
    borderCol={borderCol}
    inputBg={inputBg}
    isDark={isDark}
  />
)}
          <button onClick={handleLogout} style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: '1.5px solid rgba(252,129,129,0.4)', background: 'rgba(252,129,129,0.1)', color: '#fc8181', cursor: 'pointer', fontFamily: 'inherit' }}>🚪 خروج</button>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '20px 16px' }}>

        {/* الرئيسية */}
        {tab === 'home' && (
          <div className="fade-in">
            <div style={{ borderRadius: 20, padding: '28px 24px', marginBottom: 20, background: `linear-gradient(135deg,${themeColor}28,${themeColor}10)`, border: `1.5px solid ${themeColor}44` }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>👋</div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: themeColor, margin: '0 0 8px' }}>أهلاً {user.name}!</h1>
              <p style={{ fontSize: 15, color: subCol, margin: 0 }}>{user.allowed_grades?.length ? `الصف ${user.allowed_grades.join(' • ')}` : ''} • منصة مساعد اللغة العربية</p>
            </div>

            {subjects.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: textCol, marginBottom: 12 }}>📚 موادي ({subjects.length})</h3>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
                  {subjects.map(s => (
                    <button key={s.id} onClick={() => { setSelSubject(s); setSelUnit(null); setSelLesson(null); setTab('lessons') }}
                      style={{ flexShrink: 0, padding: '14px 18px', borderRadius: 14, border: `1.5px solid ${themeColor}44`, background: `${themeColor}12`, cursor: 'pointer', textAlign: 'right', fontFamily: 'inherit', minWidth: 140 }}>
                      <div style={{ fontSize: 26, marginBottom: 6 }}>{s.icon ?? '📚'}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: textCol }}>{s.name}</div>
                      {s.grade && <div style={{ fontSize: 12, color: themeColor, marginTop: 4 }}>الصف {s.grade}</div>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              {[
                { tab: 'assignments' as Tab, icon: '📝', label: 'مهامي',         color: '#f97316', badge: pendingCount, sub: pendingCount > 0 ? `${pendingCount} مهمة جديدة` : 'لا توجد مهام' },
                { tab: 'practice'    as Tab, icon: '🃏', label: 'تدرّب وراجع',   color: '#43e97b', badge: 0,           sub: 'اختبار • بطاقات • شرح' },
                { tab: 'messages'    as Tab, icon: '💬', label: 'رسائل',         color: '#a78bfa', badge: unreadCount,  sub: unreadCount > 0 ? `${unreadCount} غير مقروء` : 'تواصل مع معلمك' },
                { tab: 'media'       as Tab, icon: '🎥', label: 'وسائط',         color: '#4facfe', badge: 0,           sub: 'فيديو وصوت' },
              ].map(card => (
                <button key={card.tab} onClick={() => setTab(card.tab)}
                  style={{ padding: '20px 16px', borderRadius: 18, border: `1.5px solid ${card.color}44`, background: isDark ? `linear-gradient(135deg,${card.color}18,${card.color}08)` : `linear-gradient(135deg,${card.color}15,${card.color}05)`, cursor: 'pointer', textAlign: 'right', fontFamily: 'inherit', transition: 'all 0.2s', position: 'relative' }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>{card.icon}</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: textCol, marginBottom: 6 }}>{card.label}</div>
                  <div style={{ fontSize: 13, color: card.badge > 0 ? card.color : subCol, fontWeight: card.badge > 0 ? 700 : 400 }}>{card.sub}</div>
                  {card.badge > 0 && <span style={{ position: 'absolute', top: 12, left: 12, background: card.color, color: '#fff', width: 22, height: 22, borderRadius: '50%', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{card.badge}</span>}
                </button>
              ))}
            </div>

            {pendingCount > 0 && (
              <div style={{ borderRadius: 16, padding: '18px 20px', background: cardBg, border: '1.5px solid #f9741644' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f97316', margin: '0 0 14px' }}>⏰ مهام لم تُجَب بعد</h3>
                {assignments.filter(a => !a.submitted).slice(0, 3).map(a => (
                  <div key={a.id} onClick={() => { setOpenAssign(a); setTab('assignments') }}
                    style={{ padding: '12px 14px', borderRadius: 12, marginBottom: 8, background: inputBg, border: `1px solid ${borderCol}`, cursor: 'pointer' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: textCol }}>{a.title}</div>
                    {a.deadline && <div style={{ fontSize: 12, color: '#f97316', marginTop: 4 }}>⏰ {new Date(a.deadline).toLocaleDateString('ar-KW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* المهام */}
        {tab === 'assignments' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 900, color: themeColor, marginBottom: 16 }}>📝 مهامي</h2>
            {assignments.length === 0
              ? <EmptyState icon="📭" title="لا توجد مهام بعد" sub="سيرسل لك معلمك مهام هنا" cardBg={cardBg} borderCol={borderCol} textCol={textCol} subCol={subCol} />
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {assignments.map(a => (
                    <div key={a.id} style={{ borderRadius: 16, padding: '18px 20px', background: cardBg, border: `1.5px solid ${a.submitted ? '#68d39144' : '#f9741644'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: textCol }}>{a.title}</div>
                          {a.deadline && <div style={{ fontSize: 13, color: new Date(a.deadline) < new Date() ? '#fc8181' : '#f97316', marginTop: 4 }}>⏰ {new Date(a.deadline).toLocaleDateString('ar-KW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          {a.submitted ? (
                            a.grade !== null && a.grade !== undefined ? (
                              <div>
                                <div style={{ fontSize: 16, fontWeight: 900, color: '#43e97b' }}>
                                  ✅ {a.grade}/{a.max_grade}
                                </div>
                                <div style={{ fontSize: 11, color: '#43e97b' }}>درجتك</div>
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 8, fontWeight: 700, background: 'rgba(79,172,254,0.2)', color: '#4facfe' }}>
                                ⏳ في انتظار التصحيح
                              </span>
                            )
                          ) : (
                            <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 8, fontWeight: 700, background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
                              📝 لم يُجَب بعد
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ padding: '12px 14px', borderRadius: 10, background: inputBg, border: `1px solid ${borderCol}`, marginBottom: 14, fontSize: 13, color: subCol, lineHeight: 1.7 }}>
                        {a.content.slice(0, 180)}{a.content.length > 180 ? '...' : ''}
                      </div>
                      {!a.submitted && (
                        <button onClick={() => { setOpenAssign(a); setSubmitDone(false); setAnswerText('') }}
                          style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${themeColor},#ff4e50)`, color: '#1a1a2e', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                          ✍️ إجابة المهمة
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* الدروس */}
        {tab === 'lessons' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 900, color: themeColor, marginBottom: 16 }}>📚 دروسي</h2>
            <SCard title="① اختر المادة" cardBg={cardBg} borderCol={borderCol} textCol={textCol} themeColor={themeColor}>
              {subjects.length === 0 ? <p style={{ color: subCol, fontSize: 14, margin: 0 }}>لا توجد مواد متاحة</p>
                : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {subjects.map(s => <SChip key={s.id} label={`${s.icon ?? '📚'} ${s.name}${s.grade ? ` — ${s.grade}` : ''}`} active={selSubject?.id === s.id} color={themeColor} subCol={subCol} borderCol={borderCol} onClick={() => { setSelSubject(s); setSelUnit(null); setSelLesson(null) }} />)}
                  </div>}
            </SCard>
            {selSubject && <SCard title="② اختر الوحدة" cardBg={cardBg} borderCol={borderCol} textCol={textCol} themeColor={themeColor}><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{units.map(u => <SChip key={u.id} label={`${u.icon ?? '📖'} ${u.name}`} active={selUnit?.id === u.id} color={themeColor} subCol={subCol} borderCol={borderCol} onClick={() => { setSelUnit(u); setSelLesson(null) }} />)}</div></SCard>}
            {selUnit && <SCard title="③ اختر الدرس" cardBg={cardBg} borderCol={borderCol} textCol={textCol} themeColor={themeColor}><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{lessons.map(l => <SChip key={l.id} label={`✏️ ${l.name}`} active={selLesson?.id === l.id} color={themeColor} subCol={subCol} borderCol={borderCol} onClick={() => setSelLesson(l)} />)}</div></SCard>}
            {selLesson && selLesson.content && (
              <div style={{ borderRadius: 16, padding: '20px 22px', background: cardBg, border: `1.5px solid ${borderCol}` }}>
                <h3 style={{ fontSize: 17, fontWeight: 900, color: themeColor, marginBottom: 16 }}>📖 {selLesson.name}</h3>
                <MarkdownRenderer text={selLesson.content} textCol={textCol} subCol={subCol} fontSize={15} />
                <p style={{ fontSize: 12, color: subCol, marginTop: 16, textAlign: 'center', borderTop: `1px solid ${borderCol}`, paddingTop: 12 }}>🔒 هذا المحتوى للقراءة فقط</p>
              </div>
            )}
          </div>
        )}

        {/* التدرب */}
        {tab === 'practice' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 900, color: themeColor, marginBottom: 6 }}>✨ التدرب الذاتي</h2>
            <p style={{ fontSize: 14, color: subCol, marginBottom: 18 }}>شرح • ورقة عمل • اختبار تفاعلي • بطاقات حفظ ذكية</p>

            <SCard title="① اختر المادة" cardBg={cardBg} borderCol={borderCol} textCol={textCol} themeColor={themeColor}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {subjects.map(s => <SChip key={s.id} label={`${s.icon ?? '📚'} ${s.name}${s.grade ? ` — ${s.grade}` : ''}`} active={selSubject?.id === s.id} color={themeColor} subCol={subCol} borderCol={borderCol} onClick={() => { setSelSubject(s); setSelUnit(null); setSelLesson(null); setPracticeOutput('') }} />)}
              </div>
            </SCard>

            {selSubject && <SCard title="② اختر الوحدة" cardBg={cardBg} borderCol={borderCol} textCol={textCol} themeColor={themeColor}><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{units.map(u => <SChip key={u.id} label={`${u.icon ?? '📖'} ${u.name}`} active={selUnit?.id === u.id} color={themeColor} subCol={subCol} borderCol={borderCol} onClick={() => { setSelUnit(u); setSelLesson(null); setPracticeOutput('') }} />)}</div></SCard>}

            {selUnit && <SCard title="③ اختر الدرس" cardBg={cardBg} borderCol={borderCol} textCol={textCol} themeColor={themeColor}><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{lessons.map(l => <SChip key={l.id} label={`✏️ ${l.name}`} active={selLesson?.id === l.id} color={themeColor} subCol={subCol} borderCol={borderCol} onClick={() => { setSelLesson(l); setPracticeOutput(''); setPracticeTool('') }} />)}</div></SCard>}

            {selLesson && (
              <SCard title="④ ماذا تريد؟" cardBg={cardBg} borderCol={borderCol} textCol={textCol} themeColor={themeColor}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                  {PRACTICE_TOOLS.map(tool_ => {
                    const specialColors: Record<string, string> = { quiz: '#43e97b', flashcards: '#f9d423' }
                    const sc = specialColors[tool_.id]
                    return (
                      <button key={tool_.id} onClick={() => { setPracticeTool(tool_.id); setPracticeOutput('') }}
                        style={{
                          padding: '16px 14px', borderRadius: 14, textAlign: 'right',
                          border: `2px solid ${practiceTool === tool_.id ? (sc ?? themeColor) : (sc ? sc + '44' : borderCol)}`,
                          background: practiceTool === tool_.id ? `${sc ?? themeColor}18` : (sc ? `${sc}08` : cardBg),
                          color: practiceTool === tool_.id ? (sc ?? themeColor) : textCol,
                          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                          boxShadow: practiceTool === tool_.id ? `0 4px 16px ${(sc ?? themeColor)}30` : 'none',
                        }}>
                        <div style={{ fontSize: 26, marginBottom: 8 }}>{tool_.icon}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{tool_.label}</div>
                        <div style={{ fontSize: 12, color: practiceTool === tool_.id ? `${(sc ?? themeColor)}cc` : subCol, lineHeight: 1.4 }}>{tool_.desc}</div>
                        {(tool_.id === 'quiz' || tool_.id === 'flashcards') && (
                          <div style={{ fontSize: 10, marginTop: 6, color: sc, fontWeight: 700 }}>✨ تفاعلي</div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </SCard>
            )}

            {selLesson && practiceTool && (
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <button onClick={handleGenerate} disabled={isGenerating}
                  style={{
                    padding: '14px 40px', borderRadius: 14, border: 'none',
                    background: isGenerating ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg,${themeColor},#ff4e50)`,
                    color: isGenerating ? themeColor : '#1a1a2e',
                    fontSize: 16, fontWeight: 900, cursor: isGenerating ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', minWidth: 240,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, margin: '0 auto',
                  }}>
                  {isGenerating
                    ? <><span style={{ width: 18, height: 18, border: `3px solid ${themeColor}33`, borderTopColor: themeColor, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />جارٍ التوليد...</>
                    : practiceTool === 'quiz'       ? '🎯 ابدأ الاختبار التفاعلي'
                    : practiceTool === 'flashcards' ? '🃏 استخرج بطاقات الحفظ'
                    : `✨ توليد ${PRACTICE_TOOLS.find(x => x.id === practiceTool)?.label ?? ''}`}
                </button>
              </div>
            )}

            {anyError && (
              <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(252,129,129,0.12)', border: '1px solid rgba(252,129,129,0.4)', color: '#fc8181', fontSize: 14, marginBottom: 16 }}>
                ⚠️ {anyError}
              </div>
            )}

            {practiceOutput && (practiceTool === 'explain' || practiceTool === 'worksheet') && (
              <div style={{ borderRadius: 16, padding: '20px 22px', background: cardBg, border: `1.5px solid ${borderCol}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: themeColor, margin: 0 }}>{PRACTICE_TOOLS.find(x => x.id === practiceTool)?.icon} النتيجة</h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => navigator.clipboard.writeText(practiceOutput)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${borderCol}`, background: 'transparent', color: subCol, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>📋 نسخ</button>
                    <button onClick={() => window.print()} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${themeColor}44`, background: `${themeColor}15`, color: themeColor, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>🖨️ طباعة</button>
                  </div>
                </div>
                <MarkdownRenderer text={practiceOutput} textCol={textCol} subCol={subCol} fontSize={15} />
              </div>
            )}
          </div>
        )}

        {/* الرسائل */}
        {tab === 'messages' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 900, color: themeColor, marginBottom: 16 }}>💬 رسائلي</h2>
            {!teacherId
              ? <EmptyState icon="💬" title="لا يوجد معلم مرتبط بك" sub="تواصل مع المدير لإضافة معلمك" cardBg={cardBg} borderCol={borderCol} textCol={textCol} subCol={subCol} />
              : (
                <div style={{ borderRadius: 16, background: cardBg, border: `1.5px solid ${borderCol}`, overflow: 'hidden' }}>
                  <div style={{ padding: 16, maxHeight: 440, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {messages.length === 0 ? <p style={{ color: subCol, fontSize: 14, textAlign: 'center', padding: '20px 0' }}>لا توجد رسائل بعد</p>
                      : messages.map(msg => {
                        const isMe = msg.from_id === user.id
                        return (
                          <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-start' : 'flex-end' }}>
                            <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: isMe ? '16px 16px 16px 4px' : '16px 16px 4px 16px', background: isMe ? `${themeColor}22` : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', border: `1px solid ${isMe ? themeColor + '44' : borderCol}` }}>
                              {msg.image_url && <img src={msg.image_url} alt="صورة" style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 6 }} />}
                              <p style={{ fontSize: 14, color: textCol, margin: 0, lineHeight: 1.6 }}>{msg.content}</p>
                              <p style={{ fontSize: 10, color: subCol, margin: '4px 0 0', textAlign: isMe ? 'right' : 'left' }}>{new Date(msg.created_at).toLocaleTimeString('ar-KW', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                  <div style={{ padding: '12px 16px', borderTop: `1px solid ${borderCol}`, display: 'flex', gap: 8 }}>
                    <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="اكتب رسالة لمعلمك..." style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${borderCol}`, background: inputBg, color: textCol, fontSize: 14, fontFamily: 'inherit' }} />
                    <button onClick={handleSendMessage} disabled={sendingMsg || !newMsg.trim()} style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: newMsg.trim() ? themeColor : borderCol, color: '#1a1a2e', fontSize: 16, fontWeight: 800, cursor: newMsg.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>{sendingMsg ? '⏳' : '←'}</button>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* الوسائط */}
        {tab === 'media' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 900, color: themeColor, marginBottom: 16 }}>🎥 وسائط المعلم</h2>
            {media.length === 0
              ? <EmptyState icon="🎬" title="لا توجد وسائط بعد" sub="سيضيف معلمك فيديوهات وملفات صوتية هنا" cardBg={cardBg} borderCol={borderCol} textCol={textCol} subCol={subCol} />
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
                  {media.map(m => (
                    <button key={m.id} onClick={() => setOpenMedia(m)} style={{ borderRadius: 14, overflow: 'hidden', border: `1.5px solid ${borderCol}`, background: cardBg, cursor: 'pointer', textAlign: 'right', fontFamily: 'inherit', padding: 0 }}>
                      <div style={{ height: 100, background: `${themeColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>{m.thumbnail ? <img src={m.thumbnail} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.type === 'video' ? '🎬' : '🎵'}</div>
                      <div style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: textCol, marginBottom: 4 }}>{m.title}</div>
                        <div style={{ fontSize: 12, color: subCol }}>{m.type === 'video' ? '🎬 فيديو' : '🎵 صوت'}</div>
                      </div>
                    </button>
                  ))}
                </div>}
          </div>
        )}
      </main>

      {/* شريط التنقل */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: headerBg, backdropFilter: 'blur(20px)', borderTop: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-around', padding: '8px 0 14px' }}>
        <NotificationBell
          userId={user.id}
          themeColor={themeColor}
          textCol={textCol}
          subCol={subCol}
          cardBg={cardBg}
          borderCol={borderCol}
          inputBg={inputBg}
          isDark={isDark}
        />
        {TABS.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px', borderRadius: 10, color: tab === tb.id ? themeColor : subCol, position: 'relative', transition: 'all 0.2s' }}>
            <span style={{ fontSize: 22 }}>{tb.icon}</span>
            <span style={{ fontSize: 11, fontWeight: tab === tb.id ? 800 : 600 }}>{tb.label}</span>
            {'badge' in tb && (tb as { badge: number }).badge > 0 && <span style={{ position: 'absolute', top: 0, right: 2, background: '#fc8181', color: '#fff', width: 17, height: 17, borderRadius: '50%', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{(tb as { badge: number }).badge}</span>}
          </button>
        ))}
      </nav>

      {/* نافذة الاختبار التفاعلي */}
      {showQuiz && quizData && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 680, maxHeight: '92vh', borderRadius: 22, background: isDark ? '#1a1630' : '#fff', border: `1.5px solid ${themeColor}44`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `${themeColor}10` }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: themeColor, margin: 0 }}>🎯 {quizData.title}</h3>
                <p style={{ fontSize: 12, color: subCol, margin: '4px 0 0' }}>{quizData.questions.length} أسئلة تفاعلية</p>
              </div>
              <button onClick={() => setShowQuiz(false)} style={{ background: 'none', border: 'none', color: subCol, fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>
              <QuizPlayer quiz={quizData} themeColor={themeColor} textCol={textCol} subCol={subCol} cardBg={cardBg} borderCol={borderCol} inputBg={inputBg} isDark={isDark} onClose={() => setShowQuiz(false)} />
            </div>
          </div>
        </div>
      )}

      {/* نافذة بطاقات الحفظ */}
      {showFlash && flashData && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 640, maxHeight: '92vh', borderRadius: 22, background: isDark ? '#1a1630' : '#fff', border: `1.5px solid #f9d42344`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(249,212,35,0.08)' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: '#f9d423', margin: 0 }}>🃏 {flashData.title}</h3>
                <p style={{ fontSize: 12, color: subCol, margin: '4px 0 0' }}>{flashData.cards.length} بطاقة • {flashData.lessonType}</p>
              </div>
              <button onClick={() => setShowFlash(false)} style={{ background: 'none', border: 'none', color: subCol, fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>
              <FlashcardPlayer data={flashData} themeColor={themeColor} textCol={textCol} subCol={subCol} cardBg={cardBg} borderCol={borderCol} isDark={isDark} onClose={() => setShowFlash(false)} />
            </div>
          </div>
        </div>
      )}

      {/* نافذة الإعدادات */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { if (e.target === e.currentTarget) setShowSettings(false) }}>
          <div style={{ width: '90%', maxWidth: 380, borderRadius: 24, padding: 28, background: isDark ? '#1a1630' : '#ffffff', border: `1px solid ${borderCol}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: themeColor, margin: 0 }}>⚙️ الإعدادات</h2>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: subCol, fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: textCol, marginBottom: 12 }}>🎨 لون المظهر</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {THEME_COLORS.map(th => <button key={th.value} title={th.name} onClick={() => setThemeColor(th.value)} style={{ width: 44, height: 44, borderRadius: '50%', background: th.gradient, border: 'none', cursor: 'pointer', boxShadow: themeColor === th.value ? `0 0 0 3px ${isDark ? '#fff' : '#333'}, 0 0 0 6px ${th.value}` : 'none', transition: 'all 0.2s' }} />)}
              </div>
            </div>
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: textCol, marginBottom: 12 }}>🌓 وضع العرض</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {([{ id: 'dark', label: '🌙 داكن' }, { id: 'light', label: '☀️ فاتح' }, { id: 'system', label: '💻 نظام' }] as const).map(mode => (
                  <button key={mode.id} onClick={() => setThemeMode(mode.id)} style={{ flex: 1, padding: '10px 6px', borderRadius: 12, border: `2px solid ${themeMode === mode.id ? themeColor : borderCol}`, background: themeMode === mode.id ? `${themeColor}18` : 'transparent', color: themeMode === mode.id ? themeColor : subCol, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>{mode.label}</button>
                ))}
              </div>
            </div>
            <button onClick={saveSettings} disabled={savingSet} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg,${themeColor},#ff4e50)`, color: '#1a1a2e', fontWeight: 900, fontSize: 16, cursor: savingSet ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: savingSet ? 0.7 : 1 }}>
              {savingSet ? '⏳ جارٍ الحفظ...' : '💾 حفظ الإعدادات'}
            </button>
          </div>
        </div>
      )}

      {/* نافذة إجابة المهمة */}
      {openAssign && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setOpenAssign(null) }}>
          <div style={{ width: '100%', maxWidth: 680, maxHeight: '90vh', borderRadius: 20, background: isDark ? '#1a1630' : '#fff', border: `1px solid ${borderCol}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: themeColor, margin: 0 }}>{openAssign.title}</h3>
              <button onClick={() => setOpenAssign(null)} style={{ background: 'none', border: 'none', color: subCol, fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>
              {submitDone ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: '#68d391', marginBottom: 8 }}>تم إرسال إجابتك!</h3>
                  <p style={{ color: subCol, fontSize: 14 }}>سيراجع معلمك إجابتك ويعطيك الدرجة قريباً</p>
                  <button onClick={() => setOpenAssign(null)} style={{ marginTop: 20, padding: '10px 24px', borderRadius: 12, border: 'none', background: themeColor, color: '#1a1a2e', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>إغلاق</button>
                </div>
              ) : (
                <>
                  <div style={{ padding: '14px 16px', borderRadius: 12, background: inputBg, border: `1px solid ${borderCol}`, marginBottom: 16 }}>
                    <div style={{ fontSize: 13, color: themeColor, fontWeight: 700, marginBottom: 8 }}>📋 المهمة:</div>
                    <MarkdownRenderer text={openAssign.content} textCol={textCol} subCol={subCol} fontSize={13} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: textCol, marginBottom: 8 }}>✍️ إجابتك:</div>
                    <textarea value={answerText} onChange={e => setAnswerText(e.target.value)} placeholder="اكتب إجابتك هنا..." rows={8} style={{ width: '100%', borderRadius: 12, padding: '14px 16px', background: inputBg, border: `1.5px solid ${borderCol}`, color: textCol, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.7 }} />
                    <div style={{ fontSize: 11, color: subCol, marginTop: 4, textAlign: 'left' }}>{answerText.length} حرف</div>
                  </div>
                  <button onClick={handleSubmit} disabled={submitting || !answerText.trim()} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: answerText.trim() ? `linear-gradient(135deg,${themeColor},#ff4e50)` : borderCol, color: '#1a1a2e', fontWeight: 900, fontSize: 15, cursor: answerText.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {submitting ? <><span style={{ width: 18, height: 18, border: '3px solid #1a1a2e44', borderTopColor: '#1a1a2e', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />جارٍ الإرسال...</> : '📤 إرسال الإجابة'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* نافذة الوسائط */}
      {openMedia && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setOpenMedia(null) }}>
          <div style={{ width: '100%', maxWidth: 720, borderRadius: 20, background: isDark ? '#1a1630' : '#fff', border: `1px solid ${borderCol}`, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: themeColor, margin: 0 }}>{openMedia.title}</h3>
              <button onClick={() => setOpenMedia(null)} style={{ background: 'none', border: 'none', color: subCol, fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 20 }}>
              {openMedia.type === 'video' ? <video controls style={{ width: '100%', borderRadius: 12, maxHeight: 400 }} src={openMedia.url} /> : <audio controls style={{ width: '100%' }} src={openMedia.url} />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SCard({ title, children, cardBg, borderCol, textCol, themeColor }: { title: string; children: React.ReactNode; cardBg: string; borderCol: string; textCol: string; themeColor: string }) {
  return (
    <div style={{ borderRadius: 16, padding: '18px 20px', background: cardBg, border: `1.5px solid ${borderCol}`, marginBottom: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: themeColor, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  )
}

function SChip({ label, active, color, subCol, borderCol, onClick }: { label: string; active: boolean; color: string; subCol: string; borderCol: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: '9px 16px', borderRadius: 10, border: `2px solid ${active ? color : borderCol}`, background: active ? `${color}22` : 'transparent', color: active ? color : subCol, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.15s', boxShadow: active ? `0 4px 12px ${color}33` : 'none' }}>
      {label}
    </button>
  )
}

function EmptyState({ icon, title, sub, cardBg, borderCol, textCol, subCol }: { icon: string; title: string; sub: string; cardBg: string; borderCol: string; textCol: string; subCol: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', background: cardBg, borderRadius: 18, border: `1.5px solid ${borderCol}` }}>
      <div style={{ fontSize: 52, marginBottom: 14 }}>{icon}</div>
      <h3 style={{ fontSize: 17, fontWeight: 800, color: textCol, marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, color: subCol, opacity: 0.8 }}>{sub}</p>
    </div>
  )
}