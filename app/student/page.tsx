'use client'

import { useState, useEffect, CSSProperties, memo } from 'react'
import { useRouter } from 'next/navigation'
import { ar } from '@/lib/constants/ar'
import { BRAND } from '@/lib/constants/theme'
import { supabase } from '@/lib/supabase'
import {
  STAGE_LABELS,
  GRADES_BY_STAGE,
  TRACK_LABELS,
  StageKey,
  TrackKey,
} from '@/lib/constants/stages'
import MarkdownRendererRaw from '@/components/MarkdownRenderer'
import QuizPlayer from '@/components/QuizPlayer'
import FlashcardPlayer from '@/components/FlashcardPlayer'
import NotificationBell from '@/components/NotificationBell'
import SubjectCardNew from '@/components/student/SubjectCard'

const MarkdownRenderer = MarkdownRendererRaw as any
const c = ar.common

const T = {
  bg: BRAND.bg,
  pageBg: BRAND.bgSoft,
  sectionBg: BRAND.bgSoft,
  cardBg: BRAND.bgSoft,
  cardSoft: BRAND.bgSoft,
  headerBg: 'rgba(247,242,234,0.94)',
  sidebarBg: BRAND.bgSoft,

  textCol: BRAND.text,
  titleCol: BRAND.text,
  subCol: BRAND.sub,
  mutedCol: BRAND.muted,

  borderCol: BRAND.border,
  borderSoft: BRAND.border,
  inputBg: '#FFFFFF',
  inputBorder: BRAND.border,

  primary: BRAND.red,
  primaryHover: BRAND.crimson,
  primarySoft: 'rgba(140,20,40,0.08)',
  primaryDeep: BRAND.deep,
  deep: BRAND.deep,
  red: BRAND.red,

  gold: BRAND.gold,
  blue: '#2563EB',
  blueDark: '#1D4ED8',
  green: BRAND.gold,

  gradMain: BRAND.gradMain,
  gradBlue: BRAND.gradBlue,
  gradWarm: `linear-gradient(135deg, rgba(220,100,40,0.10), ${BRAND.bgSoft})`,

  shadowSoft: BRAND.shadow,
  shadowCard: BRAND.shadowWarm,
  blueGlow: BRAND.shadowBlue,

  fontHeading: BRAND.fontHeading,
  fontBody: BRAND.fontBody,
}

const FIXED_NAV_ACTIVE_COLOR = BRAND.deep

interface User {
  id: string
  name: string
  role: string
  user_type: string
  status?: string
  theme_color?: string
  allowed_grades?: string[]
  allowed_stages?: string[]
  track?: string | null
}

interface Subject {
  id: string
  name: string
  icon?: string
  grade?: string
  stage?: string
  teacherName?: string | null
  unitsCount?: number
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
  video_url?: string | null
  video_embed_url?: string | null
  file_urls?: string[]
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

interface QuizAvailable {
  id: string
  title: string
  description?: string
  time_limit_minutes?: number
  attempts_allowed: number
  questions_count: number
  attempts_used: number
  last_score: number | null
  has_active_attempt: boolean
  can_attempt: boolean
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

// ── مُزال: ACCENT_COLORS (اختيار لون شخصي) — أُلغيت الميزة بالكامل ──

const Empty = memo(({ icon, title, sub }: { icon: string; title: string; sub: string }) => {
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
      <div style={{ fontSize: 46, marginBottom: 14 }}>{icon}</div>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 900,
          color: T.titleCol,
          marginBottom: 8,
          fontFamily: T.fontHeading,
        }}
      >
        {title}
      </h3>
      <p style={{ fontSize: 14, color: T.subCol, lineHeight: 1.8, margin: 0, fontFamily: T.fontBody }}>
        {sub}
      </p>
    </div>
  )
})
Empty.displayName = 'Empty'

const Card = memo(({
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
}) => {
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
          gap: 14,
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
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 900,
                color: T.titleCol,
                fontFamily: T.fontHeading,
              }}
            >
              {title}
            </h3>
            {sub && (
              <p style={{ margin: '4px 0 0', fontSize: 14, color: T.subCol, fontFamily: T.fontBody }}>
                {sub}
              </p>
            )}
          </div>
        </div>
        {action}
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </section>
  )
})
Card.displayName = 'Card'

const StatCard = memo(({
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
}) => {
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
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
        <span style={{ fontSize: 14, fontWeight: 900, color, fontFamily: T.fontBody }}>{title}</span>
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 900,
          color: T.titleCol,
          marginBottom: 6,
          fontFamily: T.fontHeading,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 14, color: T.subCol, fontFamily: T.fontBody }}>{sub}</div>
    </div>
  )
})
StatCard.displayName = 'StatCard'
export default function StudentPage() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  // ── مُعدَّل: accentColor ثابت (BRAND.deep) — لا اختيار شخصي بعد الآن ──
  const accentColor = BRAND.deep
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

  const [quizzesAvailable, setQuizzesAvailable] = useState<QuizAvailable[]>([])
  const [accessToken, setAccessToken] = useState('')

  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [teacherId, setTeacherId] = useState<string | null>(null)

  const [media, setMedia] = useState<Media[]>([])
  const [openMedia, setOpenMedia] = useState<Media | null>(null)

  const [selectedStage, setSelectedStage] = useState<StageKey | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null)
  const [selectedTrack, setSelectedTrack] = useState<TrackKey | null>(null)

  // تحميل المستخدم من localStorage
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
      if (u.status === 'pending' || u.status === 'suspended') {
        router.replace('/pending-approval')
        return
      }
      setUser(u)
      // ── مُزال: لا نقرأ theme_color بعد الآن، اللون ثابت دائماً ──

      const stage = (u.allowed_stages && u.allowed_stages[0]) as StageKey | undefined
      const grade = u.allowed_grades && u.allowed_grades[0]

      if (stage) setSelectedStage(stage)
      if (grade) setSelectedGrade(grade)

      if (stage === 'secondary' && (u.track === 'scientific' || u.track === 'literary')) {
        setSelectedTrack(u.track as TrackKey)
      }
    } catch {
      router.replace('/')
    }
  }, [router])

  // جلب المواد النهائية الفعلية للطالب
  useEffect(() => {
    if (!user) return
    fetch(`/api/students/${user.id}/subjects`)
      .then(r => r.json())
      .then(d => setSubjects(d.subjects ?? []))
      .catch(() => setSubjects([]))
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
    if (!user) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) setAccessToken(data.session.access_token)
    })
  }, [user])

  useEffect(() => {
    if (!accessToken || tab !== 'assignments') return
    fetch('/api/quizzes/available', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => setQuizzesAvailable(d.quizzes ?? []))
      .catch(() => setQuizzesAvailable([]))
  }, [accessToken, tab])

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

  // ── مُزال: saveSettings (كانت تحفظ theme_color فقط — لا حاجة لها) ──

  function handleLogout() {
    localStorage.removeItem('mosaed_user')
    localStorage.removeItem('mosaed_session')
    router.replace('/')
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
          prev.map(a => (a.id === openAssign.id ? { ...a, submitted: true } : a)),
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
        fontFamily: T.fontBody,
        paddingBottom: 90,
      }}
    >
      {/* الهيدر */}
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
            maxWidth: 1400,
            margin: '0 auto',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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
                fontFamily: T.fontHeading,
              }}
            >
              م
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: T.titleCol, fontFamily: T.fontHeading }}>
                مِداد
              </div>
              <div style={{ fontSize: 14, color: T.subCol, fontFamily: T.fontBody }}>لوحة الطالب</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <NotificationBell
              userId={user?.id ?? ''}
              themeColor={accentColor}
              textCol={T.textCol}
              subCol={T.subCol}
              cardBg={T.cardBg}
              borderCol={T.borderCol}
              inputBg={T.inputBg}
              isDark={false}
            />
            {/* ── مُزال: زر "⚙️ الإعدادات" — كان يحتوي فقط اختيار
                 لون التمييز، المُلغى الآن بالكامل ── */}
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 14px',
                borderRadius: 14,
                border: '1px solid rgba(252,149,149,0.4)',
                background: 'rgba(252,149,149,0.1)',
                color: '#fc8181',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: T.fontBody,
              }}
            >
              🚪 خروج
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '22px 16px 0' }}>
        {/* الهيرو */}
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
                  fontFamily: T.fontBody,
                }}
              >
                ✨ رحلة تعلم ممتعة مع مِداد
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: 34,
                  lineHeight: 1.35,
                  fontWeight: 900,
                  color: T.titleCol,
                  fontFamily: T.fontHeading,
                }}
              >
                أهلاً {user?.name || 'بك'},
                <br />
                <span
                  style={{
                      color: T.red,
    background: `${T.red}10`,
    padding: '2px 10px',
    borderRadius: 10,
    boxDecorationBreak: 'clone',
    WebkitBoxDecorationBreak: 'clone',
    fontWeight: 900,
                  }}
                >
                  ابدأ درسك اليوم
                </span>{' '}
                وواصل تقدّمك بثقة.
              </h1>

              <p
                style={{
                  margin: '14px 0 0',
                  fontSize: 16,
                  lineHeight: 1.9,
                  color: T.subCol,
                  maxWidth: 650,
                  fontFamily: T.fontBody,
                }}
              >
                مِداد تجعل التعلم أبسط: اختر المادة، افتح الدرس، تدرّب تفاعلياً، ثم راجع
                أخطاءك ونتيجتك في مكان واحد.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 18 }}>
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
                    boxShadow: `0 14px 24px ${accentColor}25`,
                    fontFamily: T.fontBody,
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
                    fontFamily: T.fontBody,
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
                gap: 14,
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

        {/* تبويب الرئيسية */}
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
                    <div style={{ fontSize: 13, color: T.subCol, marginBottom: 6, fontFamily: T.fontBody }}>
                      الدرس المحدد حالياً
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 900,
                        color: T.titleCol,
                        fontFamily: T.fontHeading,
                      }}
                    >
                      {currentLessonName}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: T.subCol,
                        marginTop: 8,
                        lineHeight: 1.8,
                        fontFamily: T.fontBody,
                      }}
                    >
                      {selLesson?.content?.slice(0, 180)
                        ? selLesson.content.slice(0, 180) + '...'
                        : 'اختر مادة ووحدة ودرساً من تبويب "دروسي" حتى تبدأ الشرح والتدريب.'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    <button
                      onClick={() => setTab('lessons')}
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
                      افتح الدروس
                    </button>
                    <button
                      onClick={() => setTab('practice')}
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
                      اذهب للتدريب
                    </button>
                  </div>
                </div>
              </Card>

              <Card title="تقدّمي هذا الأسبوع" sub="متابعة سريعة" icon="📈">
                <div style={{ display: 'grid', gap: 14 }}>
                  <div
                    style={{
                      borderRadius: 16,
                      background: `${T.green}14`,
                      border: `1px solid ${T.green}22`,
                      padding: 14,
                    }}
                  >
                    <div style={{ fontSize: 13, color: T.subCol, marginBottom: 6, fontFamily: T.fontBody }}>
                      المهام المكتملة
                    </div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: T.titleCol,
                        fontFamily: T.fontHeading,
                      }}
                    >
                      {completedAssignments}
                    </div>
                  </div>

                  <div
                    style={{
                      borderRadius: 16,
                      background: `${T.blue}10`,
                      border: `1px solid ${T.blue}22`,
                      padding: 14,
                    }}
                  >
                    <div style={{ fontSize: 13, color: T.subCol, marginBottom: 6, fontFamily: T.fontBody }}>
                      رسائل بانتظارك
                    </div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: T.titleCol,
                        fontFamily: T.fontHeading,
                      }}
                    >
                      {unreadCount}
                    </div>
                  </div>

                  <div
                    style={{
                      borderRadius: 16,
                      background: `${accentColor}10`,
                      border: `1px solid ${accentColor}22`,
                      padding: 14,
                    }}
                  >
                    <div style={{ fontSize: 13, color: T.subCol, marginBottom: 6, fontFamily: T.fontBody }}>
                      أولوية اليوم
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: T.titleCol,
                        fontFamily: T.fontBody,
                      }}
                    >
                      {selLesson ? 'أكمل التدريب على الدرس المختار' : 'اختر أول درس لتبدأ رحلتك'}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
                gap: 18,
              }}
            >
              <Card title="ابدأ بسرعة" sub="أفضل نقطة بداية" icon="⚡">
                <div
                  style={{
                    fontSize: 14,
                    color: T.subCol,
                    lineHeight: 1.9,
                    marginBottom: 14,
                    fontFamily: T.fontBody,
                  }}
                >
                  افتح الدرس ثم انتقل مباشرة إلى الاختبار التفاعلي أو بطاقات الحفظ.
                </div>
                <button
                  onClick={() => setTab('practice')}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 14,
                    border: 'none',
                    background: T.gradBlue,
                    color: '#fff',
                    fontWeight: 900,
                    cursor: 'pointer',
                    fontFamily: T.fontBody,
                    boxShadow: T.blueGlow,
                  }}
                >
                  ابدأ الآن
                </button>
              </Card>

              <Card title="مراجعة أخطائي" sub="ذكّر نفسك بما يحتاج تركيزًا" icon="🧠">
                <div style={{ fontSize: 14, color: T.subCol, lineHeight: 1.9, fontFamily: T.fontBody }}>
                  بعد إنهاء الاختبارات القصيرة، اجعل هذه المساحة لاحقاً مخصصة لأكثر الأخطاء
                  تكراراً.
                </div>
              </Card>

              <Card title="تواصل مع المعلّم" sub="إن احتجت توضيحاً" icon="💬">
                <div
                  style={{
                    fontSize: 14,
                    color: T.subCol,
                    lineHeight: 1.9,
                    marginBottom: 14,
                    fontFamily: T.fontBody,
                  }}
                >
                  أرسل سؤالك بسرعة من تبويب الرسائل وتابع الردود من معلمك.
                </div>
                <button
                  onClick={() => setTab('messages')}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 14,
                    border: `1px solid ${T.borderCol}`,
                    background: T.cardBg,
                    color: T.textCol,
                    fontWeight: 900,
                    cursor: 'pointer',
                    fontFamily: T.fontBody,
                  }}
                >
                  افتح الرسائل
                </button>
              </Card>
            </div>
          </div>
        )}

        {/* تبويب المهام — يضم "اختباراتي" + "مهامي" معاً */}
        {tab === 'assignments' && (
          <div style={{ display: 'grid', gap: 18 }}>
            <Card
              title="اختباراتي"
              sub="الاختبارات التفاعلية المتاحة لفصلك"
              icon="🎯"
              accent={accentColor}
            >
              {quizzesAvailable.length === 0 ? (
                <Empty
                  icon="🎯"
                  title="لا توجد اختبارات بعد"
                  sub="عندما ينشر معلمك اختباراً جديداً سيظهر هنا."
                />
              ) : (
                <div style={{ display: 'grid', gap: 14 }}>
                  {quizzesAvailable.map(q => {
                    const exhausted = !q.can_attempt
                    return (
                      <div
                        key={q.id}
                        style={{
                          background: T.cardBg,
                          border: `1px solid ${q.last_score !== null ? T.green + '28' : T.borderCol}`,
                          borderRadius: 18,
                          padding: 16,
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 16,
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: T.titleCol, marginBottom: 6, fontFamily: T.fontHeading }}>
                            {q.title}
                          </div>
                          <div style={{ fontSize: 13, color: T.subCol, marginBottom: 4, fontFamily: T.fontBody }}>
                            {q.questions_count} سؤال
                            {q.time_limit_minutes ? ` • ⏰ ${q.time_limit_minutes} دقيقة` : ''}
                            {' • '}المحاولات: {q.attempts_used}/{q.attempts_allowed}
                          </div>
                          {q.last_score !== null && (
                            <div style={{ fontSize: 14, color: T.green, fontWeight: 800, fontFamily: T.fontBody }}>
                              آخر نتيجة: {q.last_score}%
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => router.push(`/student/quizzes/${q.id}`)}
                          disabled={exhausted}
                          style={{
                            padding: '11px 18px',
                            borderRadius: 14,
                            border: 'none',
                            background: exhausted ? T.borderCol : T.gradMain,
                            color: exhausted ? T.subCol : '#fff',
                            fontWeight: 900,
                            cursor: exhausted ? 'not-allowed' : 'pointer',
                            fontFamily: T.fontBody,
                          }}
                        >
                          {q.has_active_attempt ? '▶️ أكمل المحاولة' : exhausted ? '✅ انتهت المحاولات' : '🚀 ابدأ الاختبار'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            <Card
              title="مهامي"
              sub="المهام التي تنتظر الإنجاز أو التسليم"
              icon="📝"
              accent={accentColor}
            >
              {assignments.length === 0 ? (
                <Empty
                  icon="🗂️"
                  title="لا توجد مهام حالياً"
                  sub="عندما يرسل المعلم مهاماً جديدة ستظهر هنا."
                />
              ) : (
                <div style={{ display: 'grid', gap: 14 }}>
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
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 900,
                            color: T.titleCol,
                            marginBottom: 6,
                            fontFamily: T.fontHeading,
                          }}
                        >
                          {a.title}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: T.subCol,
                            marginBottom: 4,
                            fontFamily: T.fontBody,
                          }}
                        >
                          الأداة: {a.tool} • الدرجة: {a.max_grade}
                        </div>
                        {a.deadline && (
                          <div style={{ fontSize: 14, color: T.mutedCol, fontFamily: T.fontBody }}>
                            آخر موعد: {a.deadline}
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            padding: '8px 14px',
                            borderRadius: 999,
                            background: a.submitted ? `${T.green}14` : `${accentColor}10`,
                            color: a.submitted ? T.green : accentColor,
                            fontSize: 14,
                            fontWeight: 900,
                            border: `1px solid ${a.submitted ? T.green + '20' : accentColor + '20'}`,
                            fontFamily: T.fontBody,
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
                            borderRadius: 14,
                            border: 'none',
                            background: T.gradMain,
                            color: '#fff',
                            fontWeight: 900,
                            cursor: 'pointer',
                            fontFamily: T.fontBody,
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
        {/* تبويب دروسي */}
        {tab === 'lessons' && (
          <div style={{ display: 'grid', gap: 18 }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 10,
                padding: '14px 16px',
                borderRadius: 16,
                background: T.sectionBg,
                border: `1px solid ${T.borderCol}`,
              }}
            >
              <span style={{ fontSize: 13, color: T.subCol, fontWeight: 700, fontFamily: T.fontBody }}>
                📍 صفّك المسجَّل:
              </span>

              {selectedStage ? (
                <>
                  <span
                    style={{
                      padding: '6px 14px',
                      borderRadius: 999,
                      background: `${T.primary}10`,
                      color: T.primary,
                      fontWeight: 800,
                      fontSize: 13,
                      fontFamily: T.fontBody,
                    }}
                  >
                    {STAGE_LABELS[selectedStage]}
                  </span>
                  {selectedGrade && (
                    <span
                      style={{
                        padding: '6px 14px',
                        borderRadius: 999,
                        background: `${T.primary}10`,
                        color: T.primary,
                        fontWeight: 800,
                        fontSize: 13,
                        fontFamily: T.fontBody,
                      }}
                    >
                      {GRADES_BY_STAGE[selectedStage].find(g => g.id === selectedGrade)?.label ?? `الصف ${selectedGrade}`}
                    </span>
                  )}
                  {selectedTrack && (
                    <span
                      style={{
                        padding: '6px 14px',
                        borderRadius: 999,
                        background: `${T.primary}10`,
                        color: T.primary,
                        fontWeight: 800,
                        fontSize: 13,
                        fontFamily: T.fontBody,
                      }}
                    >
                      {TRACK_LABELS[selectedTrack]}
                    </span>
                  )}
                </>
              ) : (
                <span style={{ fontSize: 14, color: T.mutedCol, fontFamily: T.fontBody }}>
                  لم يُحدَّد صفّك بعد — تواصل مع إدارة المنصة لتفعيل هذا القسم.
                </span>
              )}
            </div>

            {!selSubject ? (
              subjects.length === 0 ? (
                <Empty
                  icon="📭"
                  title="لا توجد مواد متاحة لك بعد"
                  sub="تواصل مع إدارة المنصة لتفعيل اشتراكك في مادة أو باقة."
                />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
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
                      onClick={() => {
                        setSelSubject(s)
                        setSelUnit(null)
                        setSelLesson(null)
                      }}
                    />
                  ))}
                </div>
              )
            ) : !selUnit ? (
              <div style={{ display: 'grid', gap: 14 }}>
                <button
                  onClick={() => setSelSubject(null)}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: `1px solid ${T.borderCol}`,
                    background: T.cardBg,
                    color: T.textCol,
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: T.fontBody,
                  }}
                >
                  ← رجوع للمواد
                </button>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    fontFamily: T.fontHeading,
                    color: T.titleCol,
                  }}
                >
                  {selSubject.icon ? `${selSubject.icon} ` : ''}{selSubject.name}
                </div>
                {units.length === 0 ? (
                  <Empty icon="📭" title="لا توجد وحدات منشورة بعد" sub="سيضيف معلمك الوحدات قريباً." />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
                    {units.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setSelUnit(u)
                          setSelLesson(null)
                        }}
                        style={{
                          textAlign: 'right',
                          padding: 18,
                          borderRadius: 18,
                          border: `1px solid ${T.borderCol}`,
                          background: T.cardBg,
                          cursor: 'pointer',
                          fontFamily: T.fontBody,
                          boxShadow: T.shadowCard,
                        }}
                      >
                        <div style={{ fontSize: 26, marginBottom: 8 }}>{u.icon || '📖'}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: T.titleCol, fontFamily: T.fontBody }}>
                          {u.name}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : !selLesson ? (
              <div style={{ display: 'grid', gap: 10 }}>
                <button
                  onClick={() => setSelUnit(null)}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: `1px solid ${T.borderCol}`,
                    background: T.cardBg,
                    color: T.textCol,
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: T.fontBody,
                  }}
                >
                  ← رجوع للوحدات
                </button>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    fontFamily: T.fontHeading,
                    color: T.titleCol,
                    marginBottom: 4,
                  }}
                >
                  {selUnit.icon ? `${selUnit.icon} ` : ''}{selUnit.name}
                </div>
                {lessons.length === 0 ? (
                  <Empty icon="📭" title="لا توجد دروس منشورة بعد" sub="سيضيف معلمك الدروس قريباً." />
                ) : (
                  lessons.map(l => (
                    <button
                      key={l.id}
                      onClick={() => setSelLesson(l)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px 18px',
                        borderRadius: 14,
                        border: `1px solid ${T.borderCol}`,
                        background: T.cardBg,
                        cursor: 'pointer',
                        fontFamily: T.fontBody,
                        textAlign: 'right',
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 700, color: T.textCol, fontFamily: T.fontBody }}>
                        {l.video_url || l.video_embed_url ? '🎬' : '📄'} {l.name}
                      </span>
                      <span style={{ color: T.subCol, fontSize: 13, fontFamily: T.fontBody }}>فتح ←</span>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                <button
                  onClick={() => setSelLesson(null)}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: `1px solid ${T.borderCol}`,
                    background: T.cardBg,
                    color: T.textCol,
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: T.fontBody,
                  }}
                >
                  ← رجوع للدروس
                </button>

                <Card title={selLesson.name} sub="محتوى الدرس" icon="📖">
                  <MarkdownRenderer
                    text={selLesson.content || 'لا توجد مادة علمية لهذا الدرس بعد.'}
                  />
                </Card>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {(selLesson.video_url || selLesson.video_embed_url) && (
                    <button
                      onClick={() =>
                        setOpenMedia({
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
                      🎬 فيديو الدرس
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
                      📎 المرفقات ({selLesson.file_urls.length})
                    </a>
                  )}

                  <button
                    onClick={() => setTab('practice')}
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
                    ✨ تدرّب على هذا الدرس
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* تبويب التدريب */}
        {tab === 'practice' && (
          <div style={{ display: 'grid', gap: 18 }}>
            <Card
              title="التدرّب على الدرس"
              sub="اختر الأداة التي تناسبك"
              icon="✨"
              accent={accentColor}
            >
              {!selLesson && (
                <div
                  style={{
                    marginBottom: 18,
                    padding: 14,
                    borderRadius: 16,
                    background: `${T.gold}14`,
                    border: `1px solid ${T.gold}30`,
                    color: T.subCol,
                    fontSize: 14,
                    fontFamily: T.fontBody,
                  }}
                >
                  اختر درسًا أولاً من تبويب "دروسي" لتفعيل أدوات التدريب.
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
                  gap: 14,
                }}
              >
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
                        fontFamily: T.fontBody,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 10 }}>{tool.icon}</div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 900,
                          color: T.titleCol,
                          marginBottom: 4,
                          fontFamily: T.fontBody,
                        }}
                      >
                        {tool.label}
                      </div>
                      <div style={{ fontSize: 14, color: T.subCol, fontFamily: T.fontBody }}>
                        {tool.desc}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                  marginTop: 18,
                }}
              >
                <button
                  onClick={handlePractice}
                  disabled={
                    !selLesson ||
                    !practiceTool ||
                    practiceLoading ||
                    quizLoading ||
                    flashLoading
                  }
                  style={{
                    padding: '13px 22px',
                    borderRadius: 14,
                    border: 'none',
                    background: !selLesson || !practiceTool ? T.borderCol : T.gradMain,
                    color: !selLesson || !practiceTool ? T.subCol : '#fff',
                    fontWeight: 900,
                    cursor: !selLesson || !practiceTool ? 'not-allowed' : 'pointer',
                    fontFamily: T.fontBody,
                  }}
                >
                  {practiceLoading || quizLoading || flashLoading
                    ? '⏳ جارٍ التحضير...'
                    : 'ابدأ التمرين'}
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
                  fontFamily: T.fontBody,
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
                  fontFamily: T.fontBody,
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
                  fontFamily: T.fontBody,
                }}
              >
                {flashError}
              </div>
            )}

            {practiceOutput && (
              <Card
                title="نتيجة التدريب"
                sub="محتوى مولّد لك حسب الدرس"
                icon="🧾"
              >
                <MarkdownRenderer text={practiceOutput} />
              </Card>
            )}
          </div>
        )}

        {/* تبويب الرسائل */}
        {tab === 'messages' && (
          <Card
            title="رسائل المعلم"
            sub="ابقَ على تواصل عند الحاجة"
            icon="💬"
            accent={accentColor}
          >
            {!teacherId ? (
              <Empty
                icon="📭"
                title="لا توجد محادثة حالياً"
                sub="عند ربط معلمك بك ستظهر المحادثات هنا."
              />
            ) : (
              <div
                style={{
                  border: `1px solid ${T.borderCol}`,
                  borderRadius: 18,
                  overflow: 'hidden',
                  background: T.sectionBg,
                }}
              >
                <div
                  style={{
                    maxHeight: 420,
                    overflowY: 'auto',
                    padding: 14,
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  {messages.length === 0 && (
                    <div
                      style={{
                        color: T.subCol,
                        fontSize: 14,
                        textAlign: 'center',
                        padding: 20,
                        fontFamily: T.fontBody,
                      }}
                    >
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
                            background: isMe ? `${accentColor}14` : T.cardBg,
                            border: `1px solid ${isMe ? accentColor + '24' : T.borderCol}`,
                          }}
                        >
                          {msg.image_url && (
                            <img
                              src={msg.image_url}
                              alt="صورة"
                              style={{
                                maxWidth: '100%',
                                borderRadius: 10,
                                marginBottom: 8,
                              }}
                            />
                          )}
                          <p
                            style={{
                              fontSize: 14,
                              color: T.textCol,
                              margin: 0,
                              lineHeight: 1.8,
                              fontFamily: T.fontBody,
                            }}
                          >
                            {msg.content}
                          </p>
                          <p
                            style={{
                              fontSize: 10,
                              color: T.subCol,
                              margin: '4px 0 0',
                              textAlign: isMe ? 'right' : 'left',
                              fontFamily: T.fontBody,
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
                      padding: '14px 14px',
                      borderRadius: 14,
                      border: `1px solid ${T.inputBorder}`,
                      background: T.inputBg,
                      color: T.textCol,
                      fontSize: 14,
                      fontFamily: T.fontBody,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMsg || !newMsg.trim()}
                    style={{
                      padding: '14px 18px',
                      borderRadius: 14,
                      border: 'none',
                      background: newMsg.trim() ? T.gradBlue : T.borderCol,
                      color: newMsg.trim() ? '#fff' : T.subCol,
                      fontWeight: 900,
                      cursor: newMsg.trim() ? 'pointer' : 'not-allowed',
                      fontFamily: T.fontBody,
                    }}
                  >
                    {sendingMsg ? '⏳' : 'إرسال'}
                  </button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* تبويب الوسائط */}
        {tab === 'media' && (
          <Card
            title="وسائط المعلم"
            sub="فيديوهات أو تسجيلات تساعدك على الفهم"
            icon="🎥"
            accent={accentColor}
          >
            {media.length === 0 ? (
              <Empty
                icon="🎬"
                title="لا توجد وسائط"
                sub="سيضيف معلمك الفيديوهات أو التسجيلات هنا."
              />
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
                  gap: 14,
                }}
              >
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
                      fontFamily: T.fontBody,
                      padding: 0,
                      boxShadow: T.shadowCard,
                    }}
                  >
                    <div
                      style={{
                        height: 140,
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
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : m.type === 'video' ? (
                        '🎬'
                      ) : (
                        '🎵'
                      )}
                    </div>
                    <div style={{ padding: '14px 14px' }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: T.textCol,
                          marginBottom: 4,
                          fontFamily: T.fontBody,
                        }}
                      >
                        {m.title}
                      </div>
                      <div style={{ fontSize: 14, color: T.subCol, fontFamily: T.fontBody }}>
                        {m.type === 'video' ? 'فيديو' : 'صوت'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        )}
      </main>
      {/* شريط التبويبات السفلي */}
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
          alignItems: 'center',
          padding: '2px 0 12px',
          boxShadow: '0 -2px 12px rgba(73,44,24,0.08)',
        }}
      >
        {TABS.map(tb => {
          const isActive = tab === tb.id
          const activeColor = FIXED_NAV_ACTIVE_COLOR

          return (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              aria-label={tb.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                background: isActive ? '#FFFFFF' : 'transparent',
                border: isActive ? `2px solid ${activeColor}` : '2px solid transparent',
                borderRadius: 12,
                padding: '4px 8px',
                margin: '0 2px',
                cursor: 'pointer',
                fontFamily: T.fontBody,
                color: isActive ? activeColor : T.subCol,
                position: 'relative',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive ? '0 6px 18px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)' : 'none',
                transform: isActive ? 'translateY(-4px)' : 'translateY(0)',
                minWidth: 48,
                minHeight: 40,
              }}
            >
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 18,
                    height: 3,
                    borderRadius: 3,
                    background: activeColor,
                  }}
                />
              )}

              <span
                style={{
                  fontSize: isActive ? 18 : 16,
                  filter: isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {tb.icon}
              </span>

              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 900 : 700,
                  transition: 'all 0.3s ease',
                  textShadow: isActive ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {tb.label}
              </span>

              {'badge' in tb && (tb as { badge: number }).badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 1,
                    right: 1,
                    background: T.primaryDeep,
                    color: '#fff',
                    minWidth: 14,
                    height: 14,
                    padding: '0 3px',
                    borderRadius: 999,
                    fontSize: 8,
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid ${isActive ? '#FFFFFF' : T.headerBg}`,
                  }}
                >
                  {(tb as { badge: number }).badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* مودال الاختبار (نمط /api/quiz القديم — لا تغيير) */}
      {showQuiz && quizData && (
        <div style={overlayStyle}>
          <div style={modalStyle(accentColor)}>
            <div style={modalHeader(accentColor)}>
              <div>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 900,
                    color: accentColor,
                    margin: 0,
                    fontFamily: T.fontHeading,
                  }}
                >
                  🎯 {quizData.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: T.subCol,
                    margin: '4px 0 0',
                    fontFamily: T.fontBody,
                  }}
                >
                  {quizData.questions.length} أسئلة
                </p>
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

      {/* مودال البطاقات */}
      {showFlash && flashData && (
        <div style={overlayStyle}>
          <div style={modalStyle(accentColor)}>
            <div style={modalHeader(accentColor)}>
              <div>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 900,
                    color: accentColor,
                    margin: 0,
                    fontFamily: T.fontHeading,
                  }}
                >
                  🃏 {flashData.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: T.subCol,
                    margin: '4px 0 0',
                    fontFamily: T.fontBody,
                  }}
                >
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

      {/* ── مُزال: مودال "⚙️ إعداداتي" بالكامل — كان يحتوي فقط
           اختيار لون التمييز (6 دوائر)، المُلغى الآن بقرار صريح ── */}

      {/* مودال المهمة */}
      {openAssign && (
        <div
          style={overlayStyle}
          onClick={e => {
            if (e.target === e.currentTarget) setOpenAssign(null)
          }}
        >
          <div style={modalStyle(accentColor, 720)}>
            <div style={modalHeader(accentColor)}>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: T.titleCol,
                  margin: 0,
                  fontFamily: T.fontHeading,
                }}
              >
                {openAssign.title}
              </h3>
              <button onClick={() => setOpenAssign(null)} style={closeStyle()}>
                ✕
              </button>
            </div>

            <div
              style={{
                overflowY: 'auto',
                padding: 18,
                display: 'grid',
                gap: 16,
              }}
            >
              <div
                style={{
                  background: T.sectionBg,
                  border: `1px solid ${T.borderCol}`,
                  borderRadius: 18,
                  padding: 16,
                }}
              >
                <MarkdownRenderer text={openAssign.content} />
              </div>

              {submitDone ? (
                <div
                  style={{
                    background: `${T.green}14`,
                    border: `1px solid ${T.green}30`,
                    color: T.green,
                    padding: 14,
                    borderRadius: 16,
                    fontWeight: 800,
                    fontFamily: T.fontBody,
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
                      fontFamily: T.fontBody,
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
                      fontFamily: T.fontBody,
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

      {/* مودال الوسائط */}
      {openMedia && (
        <div
          style={overlayStyle}
          onClick={e => {
            if (e.target === e.currentTarget) setOpenMedia(null)
          }}
        >
          <div style={modalStyle(accentColor, 840)}>
            <div style={modalHeader(accentColor)}>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: T.titleCol,
                  margin: 0,
                  fontFamily: T.fontHeading,
                }}
              >
                {openMedia.title}
              </h3>
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
                    style={{
                      width: '100%',
                      height: 420,
                      border: 'none',
                      borderRadius: 18,
                    }}
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

const overlayStyle: CSSProperties = {
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

function modalStyle(accentColor: string, maxWidth = 680): CSSProperties {
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

function modalHeader(accentColor: string): CSSProperties {
  return {
    padding: '14px 18px',
    borderBottom: `1px solid ${T.borderCol}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: `${accentColor}08`,
  }
}

function closeStyle(): CSSProperties {
  return {
    background: 'none',
    border: 'none',
    color: T.subCol,
    fontSize: 22,
    cursor: 'pointer',
    lineHeight: 1,
  }
}
