'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ar } from '@/lib/constants/ar'
import MarkdownRendererRaw from '@/components/MarkdownRenderer'
import QuizPlayer from '@/components/QuizPlayer'
import FlashcardPlayer from '@/components/FlashcardPlayer'
import NotificationBell from '@/components/NotificationBell'

const MarkdownRenderer = MarkdownRendererRaw as any
const c = ar.common

const T = {
  bg: '#F5F0E8',
  pageBg: '#F7F2EA',
  sectionBg: '#FBF8F2',
  cardBg: '#FFFDF9',
  cardSoft: '#F3E8DE',
  headerBg: 'rgba(245,240,232,0.94)',
  sidebarBg: '#F1E8DD',

  textCol: '#211C17',
  titleCol: '#1A1221',
  subCol: '#6E6258',
  mutedCol: '#8A7B70',

  borderCol: '#E8DDCF',
  borderSoft: 'rgba(192,57,43,0.10)',
  inputBg: '#FFF9F3',
  inputBorder: '#E5D7C8',

  primary: '#D96B2B',
  primaryHover: '#BF5A20',
  primarySoft: '#F3E0D2',
  primaryDeep: '#C0392B',

  gold: '#F4A420',
  blue: '#2563EB',
  blueDark: '#1D4ED8',
  green: '#4D7C3A',

  gradMain: 'linear-gradient(135deg,#C0392B,#E07020)',
  gradBlue: 'linear-gradient(135deg,#2563EB,#1D4ED8)',
  gradWarm: 'linear-gradient(135deg,#F7E5D3,#FFF9F3)',

  shadowSoft: '0 8px 30px rgba(73,44,24,0.08)',
  shadowCard: '0 10px 24px rgba(60,35,20,0.06)',
  blueGlow: '0 8px 24px rgba(37,99,235,0.18)',
}

interface User {
  id: string
  name: string
  role: string
  user_type: string
  theme_color?: string
  allowed_grades?: string[]
  allowed_stages?: string[]
}

interface Subject {
  id: string
  name: string
  icon?: string
  grade?: string
  stage?: string
}

interface Unit {
  id: string
  name: string
  icon?: string
}

interface Lesson {
  id: string
  name: string
  content?: string
}

interface Assignment {
  id: string
  title: string
  content: string
  tool: string
  deadline?: string
  max_grade: number
  subject_id: string
  submitted?: boolean
  grade?: number | null
}

interface Message {
  id: string
  from_id: string
  to_id: string
  content: string
  image_url?: string
  is_read: boolean
  created_at: string
}

interface Media {
  id: string
  title: string
  type: 'video' | 'audio'
  url: string
  embed_url?: string
  link_type: string
  thumbnail?: string
}

interface QuizQuestion {
  id: number
  type: 'multiple' | 'truefalse' | 'fill'
  question: string
  options?: string[]
  correct: string | number | boolean
  explanation: string
}

interface QuizData {
  title: string
  questions: QuizQuestion[]
}

interface FlashcardsData {
  title: string
  lessonType: string
  cards: {
    id: number
    category: string
    front: string
    back: string
    example?: string | null
  }[]
}

type Tab = 'home' | 'assignments' | 'lessons' | 'practice' | 'messages' | 'media'

const PRACTICE_TOOLS = [
  { id: 'explain', icon: '💡', label: 'شرح الدرس', desc: 'شرح مبسط مع أمثلة' },
  { id: 'worksheet', icon: '📋', label: 'ورقة عمل', desc: 'أنشطة وتدريبات' },
  { id: 'quiz', icon: '🎯', label: 'اختبار تفاعلي', desc: 'أسئلة وتصحيح فوري' },
  { id: 'flashcards', icon: '🃏', label: 'بطاقات الحفظ', desc: 'راجع بسرعة وذكاء' },
] as const

const ACCENT_COLORS = ['#C0392B', '#E07020', '#F4A420', '#2563EB', '#059669', '#7C3AED']

function getSubjectImage(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('عرب') || n.includes('لغة')) return 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&q=80&auto=format&fit=crop'
  if (n.includes('قرآن') || n.includes('إسلام')) return 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&q=80&auto=format&fit=crop'
  if (n.includes('رياض') || n.includes('حساب')) return 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&q=80&auto=format&fit=crop'
  if (n.includes('علم') || n.includes('فيزياء')) return 'https://images.unsplash.com/photo-1532094349884-543559059c4a?w=800&q=80&auto=format&fit=crop'
  return 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80&auto=format&fit=crop'
}

function Empty({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '56px 20px',
        background: T.cardBg,
        borderRadius: 20,
        border: `1px solid ${T.borderCol}`,
        boxShadow: T.shadowCard,
      }}
    >
      <div style={{ fontSize: 46, marginBottom: 12 }}>{icon}</div>
      <h3 style={{ fontSize: 18, fontWeight: 900, color: T.titleCol, marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, color: T.subCol, lineHeight: 1.8, margin: 0 }}>{sub}</p>
    </div>
  )
}

function Card({
  title,
  sub,
  icon,
  children,
  action,
  accent,
}: {
  title: string
  sub?: string
  icon?: string
  children?: React.ReactNode
  action?: React.ReactNode
  accent?: string
}) {
  return (
    <section
      style={{
        background: T.cardBg,
        border: `1px solid ${accent ? accent + '22' : T.borderCol}`,
        borderRadius: 22,
        boxShadow: T.shadowCard,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '18px 18px 14px',
          borderBottom: `1px solid ${T.borderCol}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          background: accent ? `${accent}08` : T.sectionBg,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon && (
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: accent ? `${accent}14` : T.primarySoft,
                fontSize: 20,
              }}
            >
              {icon}
            </div>
          )}
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: T.titleCol }}>{title}</h3>
            {sub && <p style={{ margin: '4px 0 0', fontSize: 13, color: T.subCol }}>{sub}</p>}
          </div>
        </div>
        {action}
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </section>
  )
}

function StatCard({
  title,
  value,
  sub,
  color,
  icon,
}: {
  title: string
  value: string | number
  sub: string
  color: string
  icon: string
}) {
  return (
    <div
      style={{
        background: T.cardBg,
        borderRadius: 18,
        border: `1px solid ${color}20`,
        padding: 18,
        boxShadow: T.shadowCard,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${color}14`,
            fontSize: 20,
          }}
        >
          {icon}
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color }}>{title}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: T.titleCol, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 13, color: T.subCol }}>{sub}</div>
    </div>
  )
}

export default function StudentPage() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [accentColor, setAccentColor] = useState(T.primaryDeep)
  const [showSettings, setShowSettings] = useState(false)
  const [savingSet, setSavingSet] = useState(false)
  const [tab, setTab] = useState<Tab>('home')

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selSubject, setSelSubject] = useState<Subject | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [selUnit, setSelUnit] = useState<Unit | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selLesson, setSelLesson] = useState<Lesson | null>(null)

  const [practiceTool, setPracticeTool] = useState('')
  const [practiceOutput, setPracticeOutput] = useState('')
  const [practiceLoading, setPracticeLoading] = useState(false)
  const [practiceError, setPracticeError] = useState('')

  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizError, setQuizError] = useState('')
  const [showQuiz, setShowQuiz] = useState(false)

  const [flashData, setFlashData] = useState<FlashcardsData | null>(null)
  const [flashLoading, setFlashLoading] = useState(false)
  const [flashError, setFlashError] = useState('')
  const [showFlash, setShowFlash] = useState(false)

  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [openAssign, setOpenAssign] = useState<Assignment | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitDone, setSubmitDone] = useState(false)

  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [teacherId, setTeacherId] = useState<string | null>(null)

  const [media, setMedia] = useState<Media[]>([])
  const [openMedia, setOpenMedia] = useState<Media | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('mosaed_user')
    if (!saved) {
      router.replace('/')
      return
    }
    try {
      const u = JSON.parse(saved) as User
      if (u.role === 'admin') {
        router.replace('/admin')
        return
      }
      if (u.user_type !== 'student') {
        router.replace('/dashboard')
        return
      }
      setUser(u)
      if (u.theme_color) setAccentColor(u.theme_color)
    } catch {
      router.replace('/')
    }
  }, [router])

  useEffect(() => {
    if (!user) return
    fetch('/api/subjects')
      .then(r => r.json())
      .then(d => setSubjects(d.subjects ?? []))
  }, [user])

  useEffect(() => {
    if (!selSubject) {
      setUnits([])
      setSelUnit(null)
      return
    }
    fetch(`/api/units?subjectId=${selSubject.id}`)
      .then(r => r.json())
      .then(d => setUnits(d.units ?? []))
  }, [selSubject])

  useEffect(() => {
    if (!selUnit) {
      setLessons([])
      setSelLesson(null)
      return
    }
    fetch(`/api/lessons?unitId=${selUnit.id}`)
      .then(r => r.json())
      .then(d => setLessons(d.lessons ?? []))
  }, [selUnit])

  useEffect(() => {
    if (!user || tab !== 'assignments') return
    fetch(`/api/assignments?studentId=${user.id}`)
      .then(r => r.json())
      .then(d => setAssignments(d.assignments ?? []))
  }, [user, tab])

  useEffect(() => {
    if (!user || tab !== 'messages') return
    fetch(`/api/messages?userId=${user.id}`)
      .then(r => r.json())
      .then(d => {
        setMessages(d.messages ?? [])
        setTeacherId(d.teacherId ?? null)
        setUnreadCount(d.unread ?? 0)
      })
  }, [user, tab])

  useEffect(() => {
    if (!user || tab !== 'media') return
    fetch(`/api/teacher-media?studentId=${user.id}`)
      .then(r => r.json())
      .then(d => setMedia(d.media ?? []))
  }, [user, tab])

  useEffect(() => {
    if (!user) return
    const fn = () =>
      fetch(`/api/messages?userId=${user.id}&unreadOnly=true`)
        .then(r => r.json())
        .then(d => setUnreadCount(d.unread ?? 0))
        .catch(() => {})
    fn()
    const iv = setInterval(fn, 30000)
    return () => clearInterval(iv)
  }, [user])

  async function saveSettings() {
    if (!user) return
    setSavingSet(true)
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          theme_color: accentColor,
          theme_mode: 'light',
        }),
      })
      const updated = { ...user, theme_color: accentColor }
      setUser(updated)
      localStorage.setItem('mosaed_user', JSON.stringify(updated))
    } finally {
      setSavingSet(false)
      setShowSettings(false)
    }
  }

  async function handlePractice() {
    if (!user || !selLesson || !practiceTool) return

    if (practiceTool === 'quiz') {
      generateQuiz()
      return
    }
    if (practiceTool === 'flashcards') {
      generateFlashcards()
      return
    }

    setPracticeLoading(true)
    setPracticeOutput('')
    setPracticeError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          tool: practiceTool,
          grade: selSubject?.grade ?? user.allowed_grades?.[0] ?? '',
          stage: selSubject?.stage ?? user.allowed_stages?.[0] ?? '',
          prompt: selLesson.name,
          material: selLesson.content ?? '',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPracticeError(data.error || c.errors.generic)
        return
      }
      setPracticeOutput(data.result)
    } catch {
      setPracticeError(c.errors.connection)
    } finally {
      setPracticeLoading(false)
    }
  }

  async function generateQuiz() {
    if (!user || !selLesson) return
    setQuizLoading(true)
    setQuizError('')
    setQuizData(null)
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonName: selLesson.name,
          material: selLesson.content ?? '',
          grade: selSubject?.grade ?? user.allowed_grades?.[0] ?? '',
          count: 8,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setQuizError(data.error || 'حدث خطأ')
        return
      }
      setQuizData(data.quiz)
      setShowQuiz(true)
    } catch {
      setQuizError('تعذّر الاتصال')
    } finally {
      setQuizLoading(false)
    }
  }

  async function generateFlashcards() {
    if (!user || !selLesson) return
    if (!selLesson.content?.trim()) {
      setFlashError('هذا الدرس لا يحتوي على مادة علمية')
      return
    }
    setFlashLoading(true)
    setFlashError('')
    setFlashData(null)
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonName: selLesson.name,
          material: selLesson.content,
          grade: selSubject?.grade ?? user.allowed_grades?.[0] ?? '',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFlashError(data.error || 'تعذّر إنشاء البطاقات')
        return
      }
      setFlashData(data.flashcards)
      setShowFlash(true)
    } catch {
      setFlashError('تعذّر الاتصال')
    } finally {
      setFlashLoading(false)
    }
  }

  async function handleSubmitAssignment() {
    if (!user || !openAssign || !answerText.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/assignment-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: openAssign.id,
          studentId: user.id,
          answer: answerText,
        }),
      })
      if (res.ok) {
        setSubmitDone(true)
        setAssignments(prev =>
          prev.map(a => (a.id === openAssign.id ? { ...a, submitted: true } : a))
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSendMessage() {
    if (!user || !teacherId || !newMsg.trim()) return
    setSendingMsg(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromId: user.id, toId: teacherId, content: newMsg }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessages(prev => [...prev, data.message])
        setNewMsg('')
      }
    } finally {
      setSendingMsg(false)
    }
  }

  const pendingCount = assignments.filter(a => !a.submitted).length

  const TABS = [
    { id: 'home' as Tab, icon: '🏠', label: 'الرئيسية' },
    { id: 'assignments' as Tab, icon: '📝', label: 'مهامي', badge: pendingCount },
    { id: 'lessons' as Tab, icon: '📚', label: 'دروسي' },
    { id: 'practice' as Tab, icon: '✨', label: 'تدرّب' },
    { id: 'messages' as Tab, icon: '💬', label: 'رسائل', badge: unreadCount },
    { id: 'media' as Tab, icon: '🎥', label: 'وسائط' },
  ] as const

  const completedAssignments = assignments.filter(a => a.submitted).length
  const currentLessonName = selLesson?.name ?? 'اختر درساً لتبدأ'
  const currentSubjectName = selSubject?.name ?? 'المادة غير محددة'

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${T.bg} 0%, ${T.pageBg} 100%)`,
        color: T.textCol,
        fontFamily: 'inherit',
        paddingBottom: 90,
      }}
    >
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: T.headerBg,
          backdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${T.borderCol}`,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: T.gradMain,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                boxShadow: T.shadowSoft,
                fontSize: 18,
              }}
            >
              م
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: T.titleCol }}>مِداد</div>
              <div style={{ fontSize: 12, color: T.subCol }}>لوحة الطالب</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <NotificationBell {...({ count: unreadCount } as any)} />
            <button
              onClick={() => setShowSettings(true)}
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                border: `1px solid ${T.borderCol}`,
                background: T.cardBg,
                color: T.textCol,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              ⚙️ الإعدادات
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '22px 16px 0' }}>
        <section
          style={{
            background: T.gradWarm,
            borderRadius: 28,
            border: `1px solid ${T.borderCol}`,
            boxShadow: T.shadowSoft,
            padding: 24,
            marginBottom: 20,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: -40,
              top: -40,
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: `${accentColor}10`,
              filter: 'blur(25px)',
            }}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.3fr 0.9fr',
              gap: 18,
              alignItems: 'center',
              position: 'relative',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: `${accentColor}10`,
                  color: accentColor,
                  border: `1px solid ${accentColor}22`,
                  padding: '8px 14px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 800,
                  marginBottom: 16,
                }}
              >
                ✨ رحلة تعلم أوضح مع مِداد
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: 34,
                  lineHeight: 1.35,
                  fontWeight: 900,
                  color: T.titleCol,
                }}
              >
                أهلاً {user?.name || 'بك'}،
                <br />
                <span style={{ color: accentColor }}>ابدأ درس اليوم</span> وواصل تقدّمك بثقة.
              </h1>

              <p
                style={{
                  margin: '14px 0 0',
                  fontSize: 16,
                  lineHeight: 1.9,
                  color: T.subCol,
                  maxWidth: 650,
                }}
              >
                مِداد تجعل التعلم أبسط: اختر المادة، افتح الدرس، تدرّب تفاعلياً، ثم راجع أخطاءك
                ونتيجتك في مكان واحد.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 18 }}>
                <button
                  onClick={() => setTab('practice')}
                  style={{
                    padding: '14px 22px',
                    borderRadius: 16,
                    border: 'none',
                    background: T.gradMain,
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: 15,
                    cursor: 'pointer',
                    boxShadow: `0 12px 24px ${accentColor}25`,
                    fontFamily: 'inherit',
                  }}
                >
                  ابدأ التدريب الآن
                </button>
                <button
                  onClick={() => setTab('lessons')}
                  style={{
                    padding: '14px 22px',
                    borderRadius: 16,
                    border: `1px solid ${T.borderCol}`,
                    background: T.cardBg,
                    color: T.textCol,
                    fontWeight: 900,
                    fontSize: 15,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  افتح دروسي
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
                gap: 12,
              }}
            >
              <StatCard
                title="المهام"
                value={pendingCount}
                sub="تنتظر الإنجاز"
                color={T.primaryDeep}
                icon="📝"
              />
              <StatCard
                title="المنجز"
                value={completedAssignments}
                sub="مهام مكتملة"
                color={T.green}
                icon="✅"
              />
              <StatCard
                title="الرسائل"
                value={unreadCount}
                sub="غير مقروءة"
                color={T.blue}
                icon="💬"
              />
              <StatCard
                title="الدرس الحالي"
                value={selLesson ? 'جاهز' : '—'}
                sub={selLesson ? 'تم اختياره' : 'لم تحدد درسًا بعد'}
                color={T.gold}
                icon="📚"
              />
            </div>
          </div>
        </section>

        {tab === 'home' && (
          <div style={{ display: 'grid', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18 }}>
              <Card title="درس اليوم" sub={currentSubjectName} icon="📘" accent={accentColor}>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 18,
                      border: `1px solid ${T.borderCol}`,
                      background: T.sectionBg,
                    }}
                  >
                    <div style={{ fontSize: 13, color: T.subCol, marginBottom: 6 }}>الدرس المحدد حالياً</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: T.titleCol }}>{currentLessonName}</div>
                    <div style={{ fontSize: 14, color: T.subCol, marginTop: 8, lineHeight: 1.8 }}>
                      {selLesson?.content?.slice(0, 180)
                        ? selLesson.content.slice(0, 180) + '...'
                        : 'اختر مادة ووحدة ودرساً من تبويب "دروسي" حتى تبدأ الشرح والتدريب.'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    <button
                      onClick={() => setTab('lessons')}
                      style={{
                        padding: '12px 18px',
                        borderRadius: 14,
                        border: 'none',
                        background: T.gradMain,
                        color: '#fff',
                        fontWeight: 900,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      افتح الدروس
                    </button>
                    <button
                      onClick={() => setTab('practice')}
                      style={{
                        padding: '12px 18px',
                        borderRadius: 14,
                        border: `1px solid ${T.borderCol}`,
                        background: T.cardBg,
                        color: T.textCol,
                        fontWeight: 800,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      اذهب للتدريب
                    </button>
                  </div>
                </div>
              </Card>

              <Card title="تقدّمي هذا الأسبوع" sub="متابعة سريعة" icon="📈">
                <div style={{ display: 'grid', gap: 12 }}>
                  <div
                    style={{
                      borderRadius: 16,
                      background: `${T.green}12`,
                      border: `1px solid ${T.green}22`,
                      padding: 14,
                    }}
                  >
                    <div style={{ fontSize: 13, color: T.subCol, marginBottom: 6 }}>المهام المكتملة</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: T.titleCol }}>{completedAssignments}</div>
                  </div>

                  <div
                    style={{
                      borderRadius: 16,
                      background: `${T.blue}10`,
                      border: `1px solid ${T.blue}22`,
                      padding: 14,
                    }}
                  >
                    <div style={{ fontSize: 13, color: T.subCol, marginBottom: 6 }}>رسائل بانتظارك</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: T.titleCol }}>{unreadCount}</div>
                  </div>

                  <div
                    style={{
                      borderRadius: 16,
                      background: `${accentColor}10`,
                      border: `1px solid ${accentColor}22`,
                      padding: 14,
                    }}
                  >
                    <div style={{ fontSize: 13, color: T.subCol, marginBottom: 6 }}>أولوية اليوم</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: T.titleCol }}>
                      {selLesson ? 'أكمل التدريب على الدرس المختار' : 'اختر أول درس لتبدأ رحلتك'}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 18 }}>
              <Card title="ابدأ بسرعة" sub="أفضل نقطة بداية" icon="⚡">
                <div style={{ fontSize: 14, color: T.subCol, lineHeight: 1.9, marginBottom: 14 }}>
                  افتح الدرس ثم انتقل مباشرة إلى الاختبار التفاعلي أو بطاقات الحفظ.
                </div>
                <button
                  onClick={() => setTab('practice')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 14,
                    border: 'none',
                    background: T.gradBlue,
                    color: '#fff',
                    fontWeight: 900,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: T.blueGlow,
                  }}
                >
                  ابدأ الآن
                </button>
              </Card>

              <Card title="مراجعة أخطائي" sub="ذكّر نفسك بما يحتاج تركيزًا" icon="🧠">
                <div style={{ fontSize: 14, color: T.subCol, lineHeight: 1.9 }}>
                  بعد إنهاء الاختبارات القصيرة، اجعل هذه المساحة لاحقاً مخصصة لأكثر الأخطاء تكراراً.
                </div>
              </Card>

              <Card title="تواصل مع المعلّم" sub="إن احتجت توضيحاً" icon="💬">
                <div style={{ fontSize: 14, color: T.subCol, lineHeight: 1.9, marginBottom: 14 }}>
                  أرسل سؤالك بسرعة من تبويب الرسائل وتابع الردود من معلمك.
                </div>
                <button
                  onClick={() => setTab('messages')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 14,
                    border: `1px solid ${T.borderCol}`,
                    background: T.cardBg,
                    color: T.textCol,
                    fontWeight: 900,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  افتح الرسائل
                </button>
              </Card>
            </div>
          </div>
        )}

        {tab === 'lessons' && (
          <div style={{ display: 'grid', gap: 18 }}>
            <Card title="اختيار المادة والوحدة والدرس" sub="ابدأ من هنا لتحديد مسار تعلمك" icon="📚" accent={accentColor}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }}>
                <select
                  value={selSubject?.id ?? ''}
                  onChange={e => {
                    const subject = subjects.find(s => s.id === e.target.value) || null
                    setSelSubject(subject)
                    setSelUnit(null)
                    setSelLesson(null)
                  }}
                  style={selectStyle()}
                >
                  <option value="">اختر المادة</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selUnit?.id ?? ''}
                  onChange={e => {
                    const unit = units.find(u => u.id === e.target.value) || null
                    setSelUnit(unit)
                    setSelLesson(null)
                  }}
                  style={selectStyle()}
                >
                  <option value="">اختر الوحدة</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selLesson?.id ?? ''}
                  onChange={e => {
                    const lesson = lessons.find(l => l.id === e.target.value) || null
                    setSelLesson(lesson)
                  }}
                  style={selectStyle()}
                >
                  <option value="">اختر الدرس</option>
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </Card>

            {selSubject && (
              <Card
                title={selSubject.name}
                sub={`${selSubject.stage ?? ''} ${selSubject.grade ?? ''}`}
                icon="🖼️"
              >
                <div
                  style={{
                    height: 220,
                    borderRadius: 18,
                    overflow: 'hidden',
                    border: `1px solid ${T.borderCol}`,
                    background: T.sectionBg,
                  }}
                >
                  <img
                    src={getSubjectImage(selSubject.name)}
                    alt={selSubject.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              </Card>
            )}

            {selLesson ? (
              <Card title={selLesson.name} sub="محتوى الدرس" icon="📖">
                <MarkdownRenderer content={selLesson.content || 'لا توجد مادة علمية لهذا الدرس بعد.'} />
              </Card>
            ) : (
              <Empty icon="📚" title="لم تختر درسًا بعد" sub="اختر المادة والوحدة والدرس حتى يظهر المحتوى هنا." />
            )}
          </div>
        )}

        {tab === 'practice' && (
          <div style={{ display: 'grid', gap: 18 }}>
            <Card title="التدرّب على الدرس" sub="اختر الأداة التي تناسبك" icon="✨" accent={accentColor}>
              {!selLesson && (
                <div
                  style={{
                    marginBottom: 18,
                    padding: 14,
                    borderRadius: 16,
                    background: `${T.gold}12`,
                    border: `1px solid ${T.gold}30`,
                    color: T.subCol,
                    fontSize: 14,
                  }}
                >
                  اختر درسًا أولاً من تبويب "دروسي" لتفعيل أدوات التدريب.
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }}>
                {PRACTICE_TOOLS.map(tool => {
                  const active = practiceTool === tool.id
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setPracticeTool(tool.id)}
                      style={{
                        textAlign: 'right',
                        padding: 16,
                        borderRadius: 18,
                        border: `1px solid ${active ? accentColor + '33' : T.borderCol}`,
                        background: active ? `${accentColor}0F` : T.cardBg,
                        boxShadow: active ? `0 10px 24px ${accentColor}14` : 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 10 }}>{tool.icon}</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: T.titleCol, marginBottom: 4 }}>{tool.label}</div>
                      <div style={{ fontSize: 12, color: T.subCol }}>{tool.desc}</div>
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
                <button
                  onClick={handlePractice}
                  disabled={!selLesson || !practiceTool || practiceLoading || quizLoading || flashLoading}
                  style={{
                    padding: '13px 22px',
                    borderRadius: 14,
                    border: 'none',
                    background: !selLesson || !practiceTool ? T.borderCol : T.gradMain,
                    color: !selLesson || !practiceTool ? T.subCol : '#fff',
                    fontWeight: 900,
                    cursor: !selLesson || !practiceTool ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {practiceLoading || quizLoading || flashLoading ? '⏳ جارٍ التحضير...' : 'ابدأ التمرين'}
                </button>
              </div>
            </Card>

            {practiceError && (
              <div
                style={{
                  background: '#FFF4F1',
                  border: `1px solid ${T.primaryDeep}22`,
                  color: T.primaryDeep,
                  padding: 14,
                  borderRadius: 16,
                  fontSize: 14,
                }}
              >
                {practiceError}
              </div>
            )}

            {quizError && (
              <div
                style={{
                  background: '#FFF4F1',
                  border: `1px solid ${T.primaryDeep}22`,
                  color: T.primaryDeep,
                  padding: 14,
                  borderRadius: 16,
                  fontSize: 14,
                }}
              >
                {quizError}
              </div>
            )}

            {flashError && (
              <div
                style={{
                  background: '#FFF4F1',
                  border: `1px solid ${T.primaryDeep}22`,
                  color: T.primaryDeep,
                  padding: 14,
                  borderRadius: 16,
                  fontSize: 14,
                }}
              >
                {flashError}
              </div>
            )}

            {practiceOutput && (
              <Card title="نتيجة التدريب" sub="محتوى مولّد لك حسب الدرس" icon="🧾">
                <MarkdownRenderer content={practiceOutput} />
              </Card>
            )}
          </div>
        )}

        {tab === 'assignments' && (
          <div style={{ display: 'grid', gap: 18 }}>
            <Card title="مهامي" sub="المهام التي تنتظر الإنجاز أو التسليم" icon="📝" accent={accentColor}>
              {assignments.length === 0 ? (
                <Empty icon="🗂️" title="لا توجد مهام حالياً" sub="عندما يرسل المعلم مهاماً جديدة ستظهر هنا." />
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {assignments.map(a => (
                    <div
                      key={a.id}
                      style={{
                        background: T.cardBg,
                        border: `1px solid ${a.submitted ? T.green + '28' : T.borderCol}`,
                        borderRadius: 18,
                        padding: 16,
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 16,
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: T.titleCol, marginBottom: 6 }}>{a.title}</div>
                        <div style={{ fontSize: 13, color: T.subCol, marginBottom: 4 }}>
                          الأداة: {a.tool} • الدرجة: {a.max_grade}
                        </div>
                        {a.deadline && (
                          <div style={{ fontSize: 12, color: T.mutedCol }}>آخر موعد: {a.deadline}</div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            padding: '8px 12px',
                            borderRadius: 999,
                            background: a.submitted ? `${T.green}14` : `${accentColor}10`,
                            color: a.submitted ? T.green : accentColor,
                            fontSize: 12,
                            fontWeight: 900,
                            border: `1px solid ${a.submitted ? T.green + '20' : accentColor + '20'}`,
                          }}
                        >
                          {a.submitted ? 'تم التسليم' : 'بانتظارك'}
                        </span>
                        <button
                          onClick={() => {
                            setOpenAssign(a)
                            setAnswerText('')
                            setSubmitDone(false)
                          }}
                          style={{
                            padding: '11px 15px',
                            borderRadius: 12,
                            border: 'none',
                            background: T.gradMain,
                            color: '#fff',
                            fontWeight: 900,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          فتح المهمة
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {tab === 'messages' && (
          <Card title="رسائل المعلم" sub="ابقَ على تواصل عند الحاجة" icon="💬" accent={accentColor}>
            {!teacherId ? (
              <Empty icon="📭" title="لا توجد محادثة حالياً" sub="عند ربط معلمك بك ستظهر المحادثات هنا." />
            ) : (
              <div
                style={{
                  border: `1px solid ${T.borderCol}`,
                  borderRadius: 18,
                  overflow: 'hidden',
                  background: T.sectionBg,
                }}
              >
                <div style={{ maxHeight: 420, overflowY: 'auto', padding: 14, display: 'grid', gap: 10 }}>
                  {messages.length === 0 && (
                    <div style={{ color: T.subCol, fontSize: 14, textAlign: 'center', padding: 20 }}>
                      لا توجد رسائل بعد.
                    </div>
                  )}

                  {messages.map(msg => {
                    const isMe = msg.from_id === user?.id
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          justifyContent: isMe ? 'flex-start' : 'flex-end',
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '75%',
                            padding: '10px 14px',
                            borderRadius: isMe ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
                            background: isMe ? `${accentColor}12` : T.cardBg,
                            border: `1px solid ${isMe ? accentColor + '24' : T.borderCol}`,
                          }}
                        >
                          {msg.image_url && (
                            <img
                              src={msg.image_url}
                              alt="صورة"
                              style={{ maxWidth: '100%', borderRadius: 10, marginBottom: 8 }}
                            />
                          )}
                          <p style={{ fontSize: 14, color: T.textCol, margin: 0, lineHeight: 1.8 }}>{msg.content}</p>
                          <p
                            style={{
                              fontSize: 10,
                              color: T.subCol,
                              margin: '4px 0 0',
                              textAlign: isMe ? 'right' : 'left',
                            }}
                          >
                            {new Date(msg.created_at).toLocaleTimeString('ar-KW', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div
                  style={{
                    padding: 14,
                    borderTop: `1px solid ${T.borderCol}`,
                    display: 'flex',
                    gap: 10,
                    background: T.cardBg,
                  }}
                >
                  <input
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="اكتب رسالة لمعلمك..."
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: `1px solid ${T.inputBorder}`,
                      background: T.inputBg,
                      color: T.textCol,
                      fontSize: 14,
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMsg || !newMsg.trim()}
                    style={{
                      padding: '12px 18px',
                      borderRadius: 12,
                      border: 'none',
                      background: newMsg.trim() ? T.gradBlue : T.borderCol,
                      color: newMsg.trim() ? '#fff' : T.subCol,
                      fontWeight: 900,
                      cursor: newMsg.trim() ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit',
                    }}
                  >
                    {sendingMsg ? '⏳' : 'إرسال'}
                  </button>
                </div>
              </div>
            )}
          </Card>
        )}

        {tab === 'media' && (
          <Card title="وسائط المعلم" sub="فيديوهات أو تسجيلات تساعدك على الفهم" icon="🎥" accent={accentColor}>
            {media.length === 0 ? (
              <Empty icon="🎬" title="لا توجد وسائط" sub="سيضيف معلمك الفيديوهات أو التسجيلات هنا." />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
                {media.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setOpenMedia(m)}
                    style={{
                      borderRadius: 18,
                      overflow: 'hidden',
                      border: `1px solid ${T.borderCol}`,
                      background: T.cardBg,
                      cursor: 'pointer',
                      textAlign: 'right',
                      fontFamily: 'inherit',
                      padding: 0,
                      boxShadow: T.shadowCard,
                    }}
                  >
                    <div
                      style={{
                        height: 120,
                        background: `${accentColor}10`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 34,
                      }}
                    >
                      {m.thumbnail ? (
                        <img
                          src={m.thumbnail}
                          alt={m.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : m.type === 'video' ? (
                        '🎬'
                      ) : (
                        '🎵'
                      )}
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.textCol, marginBottom: 4 }}>{m.title}</div>
                      <div style={{ fontSize: 12, color: T.subCol }}>{m.type === 'video' ? 'فيديو' : 'صوت'}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        )}
      </main>

      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: T.headerBg,
          backdropFilter: 'blur(20px)',
          borderTop: `1px solid ${T.borderCol}`,
          display: 'flex',
          justifyContent: 'space-around',
          padding: '8px 0 14px',
          boxShadow: '0 -2px 12px rgba(73,44,24,0.08)',
        }}
      >
        {TABS.map(tb => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              padding: '5px 10px',
              borderRadius: 12,
              color: tab === tb.id ? accentColor : T.subCol,
              position: 'relative',
            }}
          >
            <span style={{ fontSize: 19 }}>{tb.icon}</span>
            <span style={{ fontSize: 11, fontWeight: tab === tb.id ? 900 : 700 }}>{tb.label}</span>
            {'badge' in tb && (tb as { badge: number }).badge > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  background: T.primaryDeep,
                  color: '#fff',
                  minWidth: 18,
                  height: 18,
                  padding: '0 4px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {(tb as { badge: number }).badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {showQuiz && quizData && (
        <div style={overlayStyle}>
          <div style={modalStyle(accentColor)}>
            <div style={modalHeader(accentColor)}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 900, color: accentColor, margin: 0 }}>🎯 {quizData.title}</h3>
                <p style={{ fontSize: 12, color: T.subCol, margin: '4px 0 0' }}>{quizData.questions.length} أسئلة</p>
              </div>
              <button onClick={() => setShowQuiz(false)} style={closeStyle()}>
                ✕
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: 18 }}>
              <QuizPlayer
                quiz={quizData}
                themeColor={accentColor}
                textCol={T.textCol}
                subCol={T.subCol}
                cardBg={T.cardBg}
                borderCol={T.borderCol}
                inputBg={T.inputBg}
                isDark={false}
                onClose={() => setShowQuiz(false)}
              />
            </div>
          </div>
        </div>
      )}

      {showFlash && flashData && (
        <div style={overlayStyle}>
          <div style={modalStyle(accentColor)}>
            <div style={modalHeader(accentColor)}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 900, color: accentColor, margin: 0 }}>🃏 {flashData.title}</h3>
                <p style={{ fontSize: 12, color: T.subCol, margin: '4px 0 0' }}>
                  {flashData.cards.length} بطاقة • {flashData.lessonType}
                </p>
              </div>
              <button onClick={() => setShowFlash(false)} style={closeStyle()}>
                ✕
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: 18 }}>
              <FlashcardPlayer
                data={flashData}
                themeColor={accentColor}
                textCol={T.textCol}
                subCol={T.subCol}
                cardBg={T.cardBg}
                borderCol={T.borderCol}
                isDark={false}
                onClose={() => setShowFlash(false)}
              />
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div
          style={overlayStyle}
          onClick={e => {
            if (e.target === e.currentTarget) setShowSettings(false)
          }}
        >
          <div
            style={{
              width: '92%',
              maxWidth: 360,
              borderRadius: 24,
              padding: 24,
              background: T.cardBg,
              border: `1px solid ${T.borderCol}`,
              boxShadow: '0 20px 50px rgba(0,0,0,0.14)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: T.titleCol, margin: 0 }}>⚙️ إعداداتي</h2>
              <button onClick={() => setShowSettings(false)} style={closeStyle()}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: 14, fontWeight: 800, color: T.titleCol, marginBottom: 12 }}>🎨 لون التمييز</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
              {ACCENT_COLORS.map(col => (
                <button
                  key={col}
                  onClick={() => setAccentColor(col)}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: col,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: accentColor === col ? `0 0 0 3px ${T.bg},0 0 0 5px ${col}` : 'none',
                  }}
                />
              ))}
            </div>

            <button
              onClick={saveSettings}
              disabled={savingSet}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 14,
                border: 'none',
                background: T.gradBlue,
                color: '#fff',
                fontWeight: 900,
                fontSize: 15,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: T.blueGlow,
                opacity: savingSet ? 0.7 : 1,
              }}
            >
              {savingSet ? '⏳ جارٍ الحفظ...' : '💾 حفظ الإعدادات'}
            </button>
          </div>
        </div>
      )}

      {openAssign && (
        <div
          style={overlayStyle}
          onClick={e => {
            if (e.target === e.currentTarget) setOpenAssign(null)
          }}
        >
          <div style={modalStyle(accentColor, 720)}>
            <div style={modalHeader(accentColor)}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: T.titleCol, margin: 0 }}>{openAssign.title}</h3>
              <button onClick={() => setOpenAssign(null)} style={closeStyle()}>
                ✕
              </button>
            </div>

            <div style={{ overflowY: 'auto', padding: 18, display: 'grid', gap: 16 }}>
              <div
                style={{
                  background: T.sectionBg,
                  border: `1px solid ${T.borderCol}`,
                  borderRadius: 18,
                  padding: 16,
                }}
              >
                <MarkdownRenderer content={openAssign.content} />
              </div>

              {submitDone ? (
                <div
                  style={{
                    background: `${T.green}12`,
                    border: `1px solid ${T.green}30`,
                    color: T.green,
                    padding: 14,
                    borderRadius: 16,
                    fontWeight: 800,
                  }}
                >
                  ✅ تم تسليم المهمة بنجاح.
                </div>
              ) : (
                <>
                  <textarea
                    value={answerText}
                    onChange={e => setAnswerText(e.target.value)}
                    placeholder="اكتب إجابتك هنا..."
                    style={{
                      minHeight: 180,
                      width: '100%',
                      resize: 'vertical',
                      padding: 14,
                      borderRadius: 16,
                      border: `1px solid ${T.inputBorder}`,
                      background: T.inputBg,
                      color: T.textCol,
                      fontSize: 14,
                      lineHeight: 1.8,
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleSubmitAssignment}
                    disabled={submitting || !answerText.trim()}
                    style={{
                      padding: '13px 18px',
                      borderRadius: 14,
                      border: 'none',
                      background: !answerText.trim() ? T.borderCol : T.gradMain,
                      color: !answerText.trim() ? T.subCol : '#fff',
                      fontWeight: 900,
                      cursor: !answerText.trim() ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {submitting ? '⏳ جارٍ التسليم...' : 'إرسال المهمة'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {openMedia && (
        <div
          style={overlayStyle}
          onClick={e => {
            if (e.target === e.currentTarget) setOpenMedia(null)
          }}
        >
          <div style={modalStyle(accentColor, 840)}>
            <div style={modalHeader(accentColor)}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: T.titleCol, margin: 0 }}>{openMedia.title}</h3>
              <button onClick={() => setOpenMedia(null)} style={closeStyle()}>
                ✕
              </button>
            </div>

            <div style={{ padding: 18 }}>
              {openMedia.type === 'video' ? (
                openMedia.embed_url ? (
                  <iframe
                    src={openMedia.embed_url}
                    title={openMedia.title}
                    style={{ width: '100%', height: 420, border: 'none', borderRadius: 18 }}
                    allowFullScreen
                  />
                ) : (
                  <video controls style={{ width: '100%', borderRadius: 18 }}>
                    <source src={openMedia.url} />
                  </video>
                )
              ) : (
                <audio controls style={{ width: '100%' }}>
                  <source src={openMedia.url} />
                </audio>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function selectStyle(): React.CSSProperties {
  return {
    padding: '13px 14px',
    borderRadius: 14,
    border: `1px solid ${T.inputBorder}`,
    background: T.inputBg,
    color: T.textCol,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
  }
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  background: 'rgba(33,28,23,0.38)',
  backdropFilter: 'blur(6px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
}

function modalStyle(accentColor: string, maxWidth = 680): React.CSSProperties {
  return {
    width: '100%',
    maxWidth,
    maxHeight: '92vh',
    borderRadius: 22,
    background: T.cardBg,
    border: `1px solid ${accentColor}22`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 24px 60px rgba(33,28,23,0.18)',
  }
}

function modalHeader(accentColor: string): React.CSSProperties {
  return {
    padding: '14px 18px',
    borderBottom: `1px solid ${T.borderCol}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: `${accentColor}08`,
  }
}

function closeStyle(): React.CSSProperties {
  return {
    background: 'none',
    border: 'none',
    color: T.subCol,
    fontSize: 22,
    cursor: 'pointer',
    lineHeight: 1,
  }
}