'use client'

import { useState, useEffect, memo } from 'react'
import type { CSSProperties, ReactNode } from 'react'
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
  sectionBg: '#FFFDFC',
  cardBg: '#FFFFFF',
  cardSoft: 'rgba(255,255,255,0.72)',
  headerBg: 'rgba(247,242,234,0.84)',
  sidebarBg: BRAND.bgSoft,

  textCol: BRAND.text,
  titleCol: BRAND.text,
  subCol: BRAND.sub,
  mutedCol: BRAND.muted,

  borderCol: 'rgba(97,74,58,0.14)',
  borderSoft: 'rgba(97,74,58,0.10)',
  inputBg: '#FFFFFF',
  inputBorder: 'rgba(97,74,58,0.16)',

  primary: BRAND.red,
  primaryHover: BRAND.crimson,
  primarySoft: 'rgba(140,20,40,0.08)',
  primaryDeep: BRAND.deep,
  deep: BRAND.deep,
  red: BRAND.red,

  gold: BRAND.orange,
  blue: '#2563EB',
  blueDark: '#1D4ED8',
  green: '#059669',

  gradMain: BRAND.gradMain,
  gradBlue: BRAND.gradBlue,
  gradWarm:
    'linear-gradient(135deg, rgba(140,20,40,0.08) 0%, rgba(220,100,40,0.10) 45%, rgba(37,99,235,0.06) 100%)',

  shadowSoft: '0 10px 30px rgba(73,44,24,0.08)',
  shadowCard: '0 14px 34px rgba(73,44,24,0.07)',
  blueGlow: '0 12px 24px rgba(37,99,235,0.14)',

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
  semester?: number
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
  content?: string
  tool?: string
  deadline?: string
  due_date?: string | null
  max_grade?: number
  subject_id?: string
  submitted?: boolean
  grade?: number | null
  score?: number | null
  description?: string | null
  quiz_id?: string | null
  created_at?: string
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

const interactiveCard: CSSProperties = {
  transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease',
  willChange: 'transform',
}

function fmtDate(date?: string | null) {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleDateString('ar-KW', {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return '—'
  }
}

function fmtDateTime(date?: string | null) {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleDateString('ar-KW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function getEmbedUrl(url?: string | null): string | null {
  if (!url) return null
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  if (url.match(/\.(mp4|webm|ogg)$/i)) return url
  return url
}

const Empty = memo(({ icon, title, sub }: { icon: string; title: string; sub: string }) => {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '60px 20px',
        background: T.cardBg,
        borderRadius: 24,
        border: `1px solid ${T.borderCol}`,
        boxShadow: T.shadowCard,
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 14 }}>{icon}</div>
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
      <p style={{ fontSize: 14, color: T.subCol, lineHeight: 1.9, margin: 0, fontFamily: T.fontBody }}>
        {sub}
      </p>
    </div>
  )
})
Empty.displayName = 'Empty'

const SectionCard = memo(
  ({
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
    children?: ReactNode
    action?: ReactNode
    accent?: string
  }) => {
    return (
      <section
        style={{
          background: T.cardBg,
          border: `1px solid ${accent ? `${accent}20` : T.borderCol}`,
          borderRadius: 26,
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
                  width: 44,
                  height: 44,
                  borderRadius: 16,
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
  },
)
SectionCard.displayName = 'SectionCard'

const StatPill = memo(
  ({ icon, label, value, color, onClick }: { icon: string; label: string; value: string | number; color: string; onClick?: () => void }) => {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          border: `1px solid ${color}22`,
          background: `${color}0D`,
          color,
          borderRadius: 16,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          fontFamily: T.fontBody,
          ...interactiveCard,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 16, fontWeight: 900, fontFamily: T.fontHeading }}>{value}</span>
        <span style={{ fontSize: 12, color: T.subCol }}>{label}</span>
      </button>
    )
  },
)
StatPill.displayName = 'StatPill'

const QuickAction = memo(
  ({
    icon,
    label,
    badge,
    onClick,
  }: {
    icon: string
    label: string
    badge?: number
    onClick: () => void
  }) => {
    return (
      <button
        onClick={onClick}
        style={{
          ...interactiveCard,
          padding: '18px 16px',
          borderRadius: 18,
          border: `1px solid ${T.borderCol}`,
          background: T.cardBg,
          cursor: 'pointer',
          fontFamily: T.fontBody,
          textAlign: 'center',
          position: 'relative',
          boxShadow: T.shadowCard,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = `0 18px 34px ${BRAND.deep}14`
          e.currentTarget.style.borderColor = `${BRAND.deep}33`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = T.shadowCard
          e.currentTarget.style.borderColor = T.borderCol
        }}
      >
        <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.textCol }}>{label}</div>
        {!!badge && badge > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              background: BRAND.crimson,
              color: '#fff',
              minWidth: 19,
              height: 19,
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 5px',
            }}
          >
            {badge}
          </span>
        )}
      </button>
    )
  },
)
QuickAction.displayName = 'QuickAction'

export default function StudentPage() {
  const router = useRouter()

  const [booting, setBooting] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const accentColor = BRAND.deep
  const [tab, setTab] = useState<Tab>('home')

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selSubject, setSelSubject] = useState<Subject | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [activeSemesters, setActiveSemesters] = useState({
    semester_1_active: true,
    semester_2_active: true,
  })

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

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const { data, error } = await supabase.auth.getSession()
        const session = data.session

        if (error || !session) {
          localStorage.removeItem('mosaed_user')
          localStorage.removeItem('mosaed_session')
          sessionStorage.clear()
          router.replace('/')
          return
        }

        const saved = localStorage.getItem('mosaed_user')

        if (!saved) {
          try {
            await supabase.auth.signOut()
          } catch {}
          localStorage.removeItem('mosaed_user')
          localStorage.removeItem('mosaed_session')
          sessionStorage.clear()
          router.replace('/')
          return
        }

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

        if (cancelled) return

        setUser(u)
        setAccessToken(session.access_token)

        const stage = (u.allowed_stages && u.allowed_stages[0]) as StageKey | undefined
        const grade = u.allowed_grades && u.allowed_grades[0]

        if (stage) setSelectedStage(stage)
        if (grade) setSelectedGrade(grade)
        if (stage === 'secondary' && (u.track === 'scientific' || u.track === 'literary')) {
          setSelectedTrack(u.track as TrackKey)
        }
      } catch {
        try {
          await supabase.auth.signOut()
        } catch {}

        localStorage.removeItem('mosaed_user')
        localStorage.removeItem('mosaed_session')
        sessionStorage.clear()
        router.replace('/')
      } finally {
        if (!cancelled) setBooting(false)
      }
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    if (!user) return
    fetch(`/api/students/${user.id}/subjects`)
      .then(r => r.json())
      .then(d => setSubjects(d.subjects ?? []))
      .catch(() => setSubjects([]))
  }, [user])

  useEffect(() => {
    fetch('/api/platform-settings/semesters')
      .then(r => r.json())
      .then(d =>
        setActiveSemesters({
          semester_1_active: d.semester_1_active !== false,
          semester_2_active: d.semester_2_active !== false,
        }),
      )
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selSubject) {
      setUnits([])
      setSelUnit(null)
      return
    }
    fetch(`/api/units?subjectId=${selSubject.id}`)
      .then(r => r.json())
      .then(d => {
        const allUnits = d.units ?? []
        const visible = allUnits.filter((u: any) => {
          const sem = u.semester === 2 ? 2 : 1
          return sem === 1 ? activeSemesters.semester_1_active : activeSemesters.semester_2_active
        })
        setUnits(visible)
      })
      .catch(() => setUnits([]))
  }, [selSubject, activeSemesters])

  useEffect(() => {
    if (!selUnit) {
      setLessons([])
      setSelLesson(null)
      return
    }
    fetch(`/api/lessons?unitId=${selUnit.id}`)
      .then(r => r.json())
      .then(d => setLessons(d.lessons ?? []))
      .catch(() => setLessons([]))
  }, [selUnit])

  useEffect(() => {
    if (!user || tab !== 'assignments') return
    fetch(`/api/assignments?studentId=${user.id}`)
      .then(r => r.json())
      .then(d => setAssignments(d.assignments ?? []))
      .catch(() => setAssignments([]))
  }, [user, tab])

  useEffect(() => {
    if (!user) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) setAccessToken(data.session.access_token)
    })
  }, [user])

  useEffect(() => {
    if (!accessToken || tab !== 'assignments') return
    fetch('/api/quizzes/available', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
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
      .catch(() => {
        setMessages([])
        setTeacherId(null)
      })
  }, [user, tab])

  useEffect(() => {
    if (!user || tab !== 'media') return
    fetch(`/api/teacher-media?studentId=${user.id}`)
      .then(r => r.json())
      .then(d => setMedia(d.media ?? []))
      .catch(() => setMedia([]))
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

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
    } catch {}

    localStorage.removeItem('mosaed_user')
    localStorage.removeItem('mosaed_session')
    sessionStorage.clear()
    router.replace('/')
  }

  function openSubject(subject: Subject) {
    setSelSubject(subject)
    setSelUnit(null)
    setSelLesson(null)
    setPracticeOutput('')
    setPracticeError('')
    setTab('lessons')
  }

  function openLessonForPractice(lesson: Lesson) {
    setSelLesson(lesson)
    setTab('practice')
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
  const completedAssignments = assignments.filter(a => a.submitted).length
  const currentLessonName = selLesson?.name ?? 'اختر درسًا لتبدأ'
  const currentSubjectName = selSubject?.name ?? 'المادة غير محددة'

  const currentStageLabel = selectedStage ? STAGE_LABELS[selectedStage] : ''
  const currentGradeLabel =
    selectedStage && selectedGrade
      ? GRADES_BY_STAGE[selectedStage].find(g => g.id === selectedGrade)?.label ?? selectedGrade
      : ''
  const currentTrackLabel = selectedTrack ? TRACK_LABELS[selectedTrack] : ''

  const TABS = [
    { id: 'home' as Tab, icon: '🏠', label: 'الرئيسية' },
    { id: 'assignments' as Tab, icon: '📝', label: 'مهامي', badge: pendingCount },
    { id: 'lessons' as Tab, icon: '📚', label: 'دروسي' },
    { id: 'practice' as Tab, icon: '✨', label: 'تدرّب' },
    { id: 'messages' as Tab, icon: '💬', label: 'رسائل', badge: unreadCount },
    { id: 'media' as Tab, icon: '🎥', label: 'وسائط' },
  ] as const

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 110,
    background: 'rgba(37,24,18,0.58)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  }

  const modalStyle = (width = 900): CSSProperties => ({
    width: '100%',
    maxWidth: width,
    maxHeight: '90vh',
    borderRadius: 28,
    background: T.cardBg,
    border: `1px solid ${T.borderCol}`,
    boxShadow: '0 24px 60px rgba(37,24,18,0.18)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  })

  const modalHeaderStyle = (accent: string = accentColor): CSSProperties => ({
  padding: '18px 20px',
  borderBottom: `1px solid ${T.borderCol}`,
  background: `${accent}08`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
})

  const closeBtnStyle: CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 14,
    border: `1px solid ${T.borderCol}`,
    background: T.cardBg,
    color: T.textCol,
    fontSize: 18,
    cursor: 'pointer',
    fontFamily: T.fontBody,
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '13px 14px',
    borderRadius: 14,
    border: `1.5px solid ${T.inputBorder}`,
    background: T.inputBg,
    color: T.textCol,
    fontSize: 14,
    fontFamily: T.fontBody,
    outline: 'none',
  }

  if (booting || !user) return null

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${T.bg} 0%, ${T.pageBg} 100%)`,
        color: T.textCol,
        fontFamily: T.fontBody,
        paddingBottom: 96,
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: ${T.bg}; }
        .student-shell { animation: fadeIn .25s ease; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 960px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .quick-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .practice-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .double-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .quick-grid { grid-template-columns: 1fr !important; }
          .practice-grid { grid-template-columns: 1fr !important; }
          .subject-grid { grid-template-columns: 1fr !important; }
          .summary-grid { grid-template-columns: 1fr !important; }
          .header-wrap { flex-wrap: wrap; }
        }
      `}</style>

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: T.headerBg,
          backdropFilter: 'blur(18px)',
          borderBottom: `1px solid ${T.borderCol}`,
        }}
      >
        <div
          className="header-wrap"
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
                width: 46,
                height: 46,
                borderRadius: 16,
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
              <div style={{ fontSize: 13, color: T.subCol }}>لوحة الطالب</div>
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
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 14px',
                borderRadius: 14,
                border: '1px solid rgba(252,149,149,0.4)',
                background: 'rgba(252,149,149,0.10)',
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

      <main className="student-shell" style={{ maxWidth: 1400, margin: '0 auto', padding: '22px 16px 0' }}>
        <div
          style={{
            background: T.gradWarm,
            borderRadius: 30,
            border: `1px solid ${accentColor}18`,
            boxShadow: T.shadowSoft,
            padding: '24px 24px 20px',
            marginBottom: 22,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -40,
              left: -30,
              width: 150,
              height: 150,
              borderRadius: '50%',
              background: `${accentColor}10`,
              filter: 'blur(10px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -45,
              right: -25,
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: 'rgba(37,99,235,0.08)',
              filter: 'blur(10px)',
            }}
          />

          <div
            className="hero-grid"
            style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: '1.25fr .75fr',
              gap: 18,
              alignItems: 'stretch',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: '#fff',
                  border: `1px solid ${accentColor}18`,
                  color: accentColor,
                  fontSize: 12,
                  fontWeight: 800,
                  marginBottom: 14,
                }}
              >
                ✨ رحلة تعلمك اليوم
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(25px, 4vw, 36px)',
                  fontWeight: 900,
                  color: T.titleCol,
                  fontFamily: T.fontHeading,
                  lineHeight: 1.25,
                }}
              >
                أهلاً {user?.name?.split(' ')[0] || 'بك'} 👋
              </h1>

              <p style={{ margin: '10px 0 0', fontSize: 14, color: T.subCol, lineHeight: 1.9 }}>
                {currentStageLabel || 'مرحبًا بك'}
                {currentGradeLabel ? ` • ${currentGradeLabel}` : ''}
                {currentTrackLabel ? ` • ${currentTrackLabel}` : ''} • {currentSubjectName}
              </p>

              <p style={{ margin: '8px 0 0', fontSize: 14, color: T.mutedCol, lineHeight: 1.9 }}>
                الدرس الحالي: {currentLessonName}
              </p>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
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
                    fontFamily: T.fontBody,
                    boxShadow: T.shadowSoft,
                  }}
                >
                  📚 ابدأ الدرس
                </button>
                <button
                  onClick={() => setTab('assignments')}
                  style={{
                    padding: '12px 18px',
                    borderRadius: 14,
                    border: `1px solid ${accentColor}22`,
                    background: '#fff',
                    color: accentColor,
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: T.fontBody,
                  }}
                >
                  📝 مهامي الآن
                </button>
                <button
                  onClick={() => router.push('/student/chat')}
                  style={{
                    padding: '12px 18px',
                    borderRadius: 14,
                    border: `1px solid rgba(37,99,235,0.20)`,
                    background: 'rgba(37,99,235,0.08)',
                    color: T.blue,
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: T.fontBody,
                  }}
                >
                  🤖 مساعد مِداد
                </button>
              </div>
            </div>

            <div className="summary-grid" style={{ display: 'grid', gap: 10 }}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.76)',
                  border: `1px solid ${BRAND.crimson}16`,
                  borderRadius: 20,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 16,
                      background: `${BRAND.crimson}12`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                    }}
                  >
                    📝
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: T.subCol }}>بانتظارك</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: BRAND.crimson, fontFamily: T.fontHeading }}>
                      {pendingCount}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: T.mutedCol }}>مهام جديدة</div>
              </div>

              <div
                style={{
                  background: 'rgba(255,255,255,0.76)',
                  border: `1px solid ${T.green}16`,
                  borderRadius: 20,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 16,
                      background: `${T.green}12`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                    }}
                  >
                    ✅
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: T.subCol }}>أنجزت</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: T.green, fontFamily: T.fontHeading }}>
                      {completedAssignments}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: T.mutedCol }}>مهام مكتملة</div>
              </div>

              <div
                style={{
                  background: 'rgba(255,255,255,0.76)',
                  border: `1px solid ${T.blue}16`,
                  borderRadius: 20,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 16,
                      background: `${T.blue}12`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                    }}
                  >
                    💬
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: T.subCol }}>رسائل</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: T.blue, fontFamily: T.fontHeading }}>
                      {unreadCount}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: T.mutedCol }}>غير مقروءة</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            <StatPill icon="📚" label="المواد" value={subjects.length} color={accentColor} onClick={() => setTab('home')} />
            <StatPill icon="🎯" label="اختبارات" value={quizzesAvailable.length} color={T.blue} onClick={() => setTab('assignments')} />
            <StatPill icon="✨" label="تدرّب" value={selLesson ? 'جاهز' : 'اختر درسًا'} color={BRAND.orange} onClick={() => setTab('practice')} />
          </div>
        </div>

        <nav
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 20,
          }}
        >
          {TABS.map(item => {
            const active = tab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 16,
                  border: `1px solid ${active ? `${FIXED_NAV_ACTIVE_COLOR}33` : T.borderCol}`,
                  background: active ? `${FIXED_NAV_ACTIVE_COLOR}10` : T.cardBg,
                  color: active ? FIXED_NAV_ACTIVE_COLOR : T.textCol,
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontFamily: T.fontBody,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: active ? `0 10px 24px ${FIXED_NAV_ACTIVE_COLOR}12` : 'none',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {'badge' in item && item.badge ? (
                  <span
                    style={{
                      minWidth: 20,
                      height: 20,
                      borderRadius: 999,
                      background: BRAND.crimson,
                      color: '#fff',
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 6px',
                    }}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>

        {tab === 'home' && (
          <div style={{ display: 'grid', gap: 20 }}>
            <SectionCard title="موادك الدراسية" sub="اختر مادة للانتقال إلى الوحدات والدروس" icon="📚" accent={accentColor}>
              {subjects.length === 0 ? (
                <Empty
                  icon="📚"
                  title="لا توجد مواد متاحة"
                  sub="ستظهر هنا المواد المتاحة لك بمجرد ربط حسابك."
                />
              ) : (
                <div className="subject-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
                  {subjects.map(s => (
                    <button
                      key={s.id}
                      onClick={() => openSubject(s)}
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
                          <div style={{ fontSize: 13, color: T.subCol, marginBottom: 10 }}>
                            المعلم: {s.teacherName}
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: T.subCol, marginBottom: 14 }}>
                          {s.unitsCount ?? 0} وحدة
                        </div>
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
                  <Empty
                    icon="🧭"
                    title="لم يتم اختيار مادة بعد"
                    sub="اختر مادة من الأعلى لتبدأ بالتصفح."
                  />
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
                        onClick={() => setTab('lessons')}
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
                          onClick={() => setTab('practice')}
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

              <SectionCard
                title="روابط سريعة"
                sub="افتح أهم الأجزاء مباشرة"
                icon="⚡"
                accent={BRAND.orange}
              >
                <div className="quick-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <QuickAction icon="📝" label="مهامي" badge={pendingCount} onClick={() => setTab('assignments')} />
                  <QuickAction icon="💬" label="رسائل المعلم" badge={unreadCount} onClick={() => setTab('messages')} />
                  <QuickAction icon="🤖" label="مساعد مِداد" onClick={() => router.push('/student/chat')} />
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {tab === 'assignments' && (
          <div style={{ display: 'grid', gap: 18 }}>
            <SectionCard
              title="اختباراتي"
              sub="الاختبارات التفاعلية المتاحة لفصلك"
              icon="🎯"
              accent={accentColor}
            >
              {quizzesAvailable.length === 0 ? (
                <Empty
                  icon="🎯"
                  title="لا توجد اختبارات بعد"
                  sub="عندما ينشر معلمك اختبارًا جديدًا سيظهر هنا."
                />
              ) : (
                <div style={{ display: 'grid', gap: 14 }}>
                  {quizzesAvailable.map(q => {
                    const exhausted = !q.can_attempt
                    const progress =
                      q.attempts_allowed > 0
                        ? Math.min((q.attempts_used / q.attempts_allowed) * 100, 100)
                        : 0

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
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: 11,
                                color: T.subCol,
                                marginBottom: 6,
                              }}
                            >
                              <span>تقدّم المحاولات</span>
                              <span>{q.attempts_used}/{q.attempts_allowed}</span>
                            </div>
                            <div
                              style={{
                                width: '100%',
                                height: 9,
                                borderRadius: 999,
                                background: 'rgba(0,0,0,0.06)',
                                overflow: 'hidden',
                              }}
                            >
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
                          onClick={() => router.push(`/student/quizzes/${q.id}`)}
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

            <SectionCard
              title="واجباتي"
              sub="الواجبات والأنشطة المرسلة من المعلم"
              icon="📝"
              accent={accentColor}
            >
              {assignments.length === 0 ? (
                <Empty
                  icon="📝"
                  title="لا توجد واجبات حاليًا"
                  sub="عند نشر واجب جديد سيظهر هنا."
                />
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
                              onClick={() => router.push(`/student/quizzes/${a.quiz_id}`)}
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
                              onClick={() => {
                                setOpenAssign(a)
                                setAnswerText('')
                                setSubmitDone(false)
                              }}
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
        )}

        {tab === 'lessons' && (
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
                <Empty
                  icon="📚"
                  title="لا توجد مواد متاحة"
                  sub="ستظهر هنا المواد المتاحة لك بمجرد ربط حسابك."
                />
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
                      onClick={() => openSubject(s)}
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
                    <Empty
                      icon="📂"
                      title="لا توجد وحدات متاحة"
                      sub="عند إضافة وحدات جديدة ستظهر هنا."
                    />
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
                  onClick={() => setSelUnit(null)}
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
                    <Empty
                      icon="📄"
                      title="لا توجد دروس داخل هذه الوحدة"
                      sub="عند إضافة الدروس ستظهر هنا تلقائيًا."
                    />
                  ) : (
                    <div style={{ display: 'grid', gap: 10 }}>
                      {lessons.map(l => (
                        <button
                          key={l.id}
                          onClick={() => setSelLesson(l)}
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
                  onClick={() => setSelLesson(null)}
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
                    <Empty
                      icon="📝"
                      title="لا يوجد محتوى نصي بعد"
                      sub="يمكنك مشاهدة الوسائط أو متابعة التدريب على الدرس."
                    />
                  )}
                </SectionCard>

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
                    onClick={() => openLessonForPractice(selLesson)}
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
        )}

        {tab === 'practice' && (
          <div style={{ display: 'grid', gap: 18 }}>
            <SectionCard title="منطقة التدريب" sub="اختر أداة التمرين المناسبة" icon="✨" accent={accentColor}>
              {!selLesson ? (
                <div
                  style={{
                    marginBottom: 18,
                    padding: 14,
                    borderRadius: 16,
                    background: `${BRAND.orange}12`,
                    border: `1px solid ${BRAND.orange}26`,
                    color: T.subCol,
                    fontSize: 14,
                  }}
                >
                  اختر درسًا أولًا من تبويب الدروس حتى تتمكن من تشغيل أدوات التدريب.
                </div>
              ) : (
                <div
                  style={{
                    marginBottom: 18,
                    padding: 16,
                    borderRadius: 18,
                    border: `1px solid ${T.borderCol}`,
                    background: T.cardSoft,
                  }}
                >
                  <div style={{ fontSize: 12, color: T.subCol, marginBottom: 4 }}>الدرس المختار</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: T.titleCol, fontFamily: T.fontHeading }}>
                    {selLesson?.name}
                  </div>
                  <div style={{ fontSize: 13, color: T.mutedCol, marginTop: 6 }}>
                    {selSubject?.name}
                    {selUnit ? ` • ${selUnit.name}` : ''}
                  </div>
                </div>
              )}

              <div className="practice-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }}>
                {PRACTICE_TOOLS.map(tool => {
                  const active = practiceTool === tool.id
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setPracticeTool(tool.id)}
                      style={{
                        ...interactiveCard,
                        textAlign: 'right',
                        padding: 18,
                        borderRadius: 20,
                        border: `1px solid ${active ? `${accentColor}33` : T.borderCol}`,
                        background: active ? `${accentColor}0F` : T.cardBg,
                        boxShadow: active ? `0 12px 28px ${accentColor}14` : 'none',
                        cursor: 'pointer',
                        fontFamily: T.fontBody,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-3px)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <div style={{ fontSize: 24, marginBottom: 10 }}>{tool.icon}</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: T.titleCol, marginBottom: 4 }}>{tool.label}</div>
                      <div style={{ fontSize: 13, color: T.subCol, lineHeight: 1.8 }}>{tool.desc}</div>
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
                    background: !selLesson || !practiceTool ? '#E8E2DB' : T.gradMain,
                    color: !selLesson || !practiceTool ? T.subCol : '#fff',
                    fontWeight: 900,
                    cursor: !selLesson || !practiceTool ? 'not-allowed' : 'pointer',
                    fontFamily: T.fontBody,
                    boxShadow: !selLesson || !practiceTool ? 'none' : T.shadowSoft,
                  }}
                >
                  {practiceLoading || quizLoading || flashLoading ? 'جارٍ التنفيذ...' : 'تشغيل الأداة'}
                </button>

                {selLesson && (
                  <button
                    onClick={() => setTab('lessons')}
                    style={{
                      padding: '13px 18px',
                      borderRadius: 14,
                      border: `1px solid ${T.borderCol}`,
                      background: T.cardBg,
                      color: T.textCol,
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontFamily: T.fontBody,
                    }}
                  >
                    العودة إلى الدرس
                  </button>
                )}
              </div>

              {practiceError && (
                <div
                  style={{
                    marginTop: 16,
                    padding: '14px 16px',
                    borderRadius: 16,
                    background: `${BRAND.crimson}10`,
                    border: `1px solid ${BRAND.crimson}22`,
                    color: BRAND.crimson,
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {practiceError}
                </div>
              )}

              {quizError && (
                <div
                  style={{
                    marginTop: 16,
                    padding: '14px 16px',
                    borderRadius: 16,
                    background: `${BRAND.crimson}10`,
                    border: `1px solid ${BRAND.crimson}22`,
                    color: BRAND.crimson,
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {quizError}
                </div>
              )}

              {flashError && (
                <div
                  style={{
                    marginTop: 16,
                    padding: '14px 16px',
                    borderRadius: 16,
                    background: `${BRAND.crimson}10`,
                    border: `1px solid ${BRAND.crimson}22`,
                    color: BRAND.crimson,
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {flashError}
                </div>
              )}

              {!!practiceOutput && (
                <div
                  style={{
                    marginTop: 20,
                    borderRadius: 20,
                    overflow: 'hidden',
                    border: `1px solid ${T.borderCol}`,
                    boxShadow: T.shadowCard,
                    background: T.cardBg,
                  }}
                >
                  <div
                    style={{
                      padding: '14px 16px',
                      borderBottom: `1px solid ${T.borderCol}`,
                      background: `${accentColor}08`,
                      fontWeight: 900,
                      color: T.titleCol,
                      fontFamily: T.fontHeading,
                    }}
                  >
                    ناتج التدريب
                  </div>
                  <div style={{ padding: 18 }}>
                    <MarkdownRenderer text={practiceOutput} />
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {tab === 'messages' && (
          <div style={{ display: 'grid', gap: 18 }}>
            <SectionCard title="رسائل المعلم" sub="تابع الرسائل وأرسل استفساراتك" icon="💬" accent={T.blue}>
              {!teacherId && messages.length === 0 ? (
                <Empty
                  icon="💬"
                  title="لا توجد محادثة حالية"
                  sub="عند بدء المراسلة مع المعلم ستظهر الرسائل هنا."
                />
              ) : (
                <div style={{ display: 'grid', gap: 14 }}>
                  <div
                    style={{
                      maxHeight: 420,
                      overflowY: 'auto',
                      display: 'grid',
                      gap: 10,
                      padding: 4,
                    }}
                  >
                    {messages.length === 0 ? (
                      <div
                        style={{
                          padding: 18,
                          borderRadius: 16,
                          background: T.cardSoft,
                          color: T.subCol,
                          fontSize: 14,
                        }}
                      >
                        لا توجد رسائل بعد. ابدأ بإرسال رسالة إلى معلمك.
                      </div>
                    ) : (
                      messages.map(msg => {
                        const mine = msg.from_id === user.id
                        return (
                          <div
                            key={msg.id}
                            style={{
                              justifySelf: mine ? 'start' : 'end',
                              maxWidth: '85%',
                              background: mine ? `${T.blue}0F` : T.cardBg,
                              border: `1px solid ${mine ? `${T.blue}22` : T.borderCol}`,
                              borderRadius: 18,
                              padding: '12px 14px',
                              boxShadow: mine ? 'none' : T.shadowCard,
                            }}
                          >
                            <div style={{ fontSize: 14, color: T.textCol, lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
                              {msg.content}
                            </div>
                            <div style={{ fontSize: 11, color: T.mutedCol, marginTop: 8 }}>
                              {fmtDateTime(msg.created_at)}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  <div style={{ display: 'grid', gap: 10 }}>
                    <textarea
                      value={newMsg}
                      onChange={e => setNewMsg(e.target.value)}
                      placeholder="اكتب رسالتك هنا..."
                      rows={4}
                      style={{
                        ...inputStyle,
                        resize: 'vertical',
                        minHeight: 110,
                      }}
                    />
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        onClick={handleSendMessage}
                        disabled={!teacherId || !newMsg.trim() || sendingMsg}
                        style={{
                          padding: '12px 18px',
                          borderRadius: 14,
                          border: 'none',
                          background: !teacherId || !newMsg.trim() ? '#E8E2DB' : T.gradMain,
                          color: !teacherId || !newMsg.trim() ? T.subCol : '#fff',
                          fontWeight: 900,
                          cursor: !teacherId || !newMsg.trim() ? 'not-allowed' : 'pointer',
                          fontFamily: T.fontBody,
                        }}
                      >
                        {sendingMsg ? 'جارٍ الإرسال...' : 'إرسال الرسالة'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {tab === 'media' && (
          <div style={{ display: 'grid', gap: 18 }}>
            <SectionCard title="الوسائط التعليمية" sub="مرئيات ومواد صوتية من المعلم" icon="🎥" accent={BRAND.orange}>
              {media.length === 0 ? (
                <Empty
                  icon="🎥"
                  title="لا توجد وسائط حالياً"
                  sub="عند إضافة وسائط جديدة من المعلم ستظهر هنا."
                />
              ) : (
                <div style={{ display: 'grid', gap: 14 }}>
                  {media.map(item => (
                    <div
                      key={item.id}
                      style={{
                        background: T.cardBg,
                        border: `1px solid ${T.borderCol}`,
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
                          {item.title}
                        </div>
                        <div style={{ fontSize: 13, color: T.subCol, lineHeight: 1.9 }}>
                          {item.type === 'video' ? 'محتوى مرئي' : 'محتوى صوتي'} • {item.link_type}
                        </div>
                      </div>

                      <button
                        onClick={() => setOpenMedia(item)}
                        style={{
                          padding: '12px 18px',
                          borderRadius: 16,
                          border: 'none',
                          background: T.gradMain,
                          color: '#fff',
                          fontWeight: 900,
                          cursor: 'pointer',
                          fontFamily: T.fontBody,
                        }}
                      >
                        فتح الوسائط
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        )}
      </main>

      {openAssign && (
        <div style={overlayStyle} onClick={() => setOpenAssign(null)}>
          <div style={modalStyle(760)} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle(BRAND.crimson)}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: T.titleCol, fontFamily: T.fontHeading }}>
                  {openAssign.title}
                </div>
                <div style={{ fontSize: 13, color: T.subCol, marginTop: 4 }}>
                  {openAssign.description || openAssign.content || 'أدخل إجابتك ثم أرسلها.'}
                </div>
              </div>
              <button onClick={() => setOpenAssign(null)} style={closeBtnStyle}>
                ✕
              </button>
            </div>

            <div style={{ padding: 20, overflowY: 'auto' }}>
              {submitDone ? (
                <div
                  style={{
                    padding: 18,
                    borderRadius: 18,
                    background: `${T.green}12`,
                    border: `1px solid ${T.green}22`,
                    color: T.green,
                    fontSize: 15,
                    fontWeight: 900,
                  }}
                >
                  تم إرسال الواجب بنجاح.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 14 }}>
                  <textarea
                    value={answerText}
                    onChange={e => setAnswerText(e.target.value)}
                    placeholder="اكتب إجابتك هنا..."
                    rows={10}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      minHeight: 220,
                    }}
                  />

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      onClick={handleSubmitAssignment}
                      disabled={!answerText.trim() || submitting}
                      style={{
                        padding: '12px 18px',
                        borderRadius: 14,
                        border: 'none',
                        background: !answerText.trim() ? '#E8E2DB' : T.gradMain,
                        color: !answerText.trim() ? T.subCol : '#fff',
                        fontWeight: 900,
                        cursor: !answerText.trim() ? 'not-allowed' : 'pointer',
                        fontFamily: T.fontBody,
                      }}
                    >
                      {submitting ? 'جارٍ الإرسال...' : 'إرسال الإجابة'}
                    </button>

                    <button
                      onClick={() => setOpenAssign(null)}
                      style={{
                        padding: '12px 18px',
                        borderRadius: 14,
                        border: `1px solid ${T.borderCol}`,
                        background: T.cardBg,
                        color: T.textCol,
                        fontWeight: 800,
                        cursor: 'pointer',
                        fontFamily: T.fontBody,
                      }}
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showQuiz && quizData && (
        <div style={overlayStyle} onClick={() => setShowQuiz(false)}>
          <div style={modalStyle(980)} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle(T.blue)}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: T.titleCol, fontFamily: T.fontHeading }}>
                  {quizData.title}
                </div>
                <div style={{ fontSize: 13, color: T.subCol, marginTop: 4 }}>
                  اختبار تفاعلي على الدرس الحالي
                </div>
              </div>
              <button onClick={() => setShowQuiz(false)} style={closeBtnStyle}>
                ✕
              </button>
            </div>

            <div style={{ padding: 20, overflowY: 'auto' }}>
              <QuizPlayer
  quiz={quizData as any}
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
        <div style={overlayStyle} onClick={() => setShowFlash(false)}>
          <div style={modalStyle(980)} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle(BRAND.orange)}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: T.titleCol, fontFamily: T.fontHeading }}>
                  {flashData.title}
                </div>
                <div style={{ fontSize: 13, color: T.subCol, marginTop: 4 }}>
                  بطاقات مراجعة تفاعلية
                </div>
              </div>
              <button onClick={() => setShowFlash(false)} style={closeBtnStyle}>
                ✕
              </button>
            </div>

            <div style={{ padding: 20, overflowY: 'auto' }}>
              <FlashcardPlayer
  data={flashData as any}
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

      {openMedia && (
        <div style={overlayStyle} onClick={() => setOpenMedia(null)}>
          <div style={modalStyle(1100)} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle(BRAND.orange)}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: T.titleCol, fontFamily: T.fontHeading }}>
                  {openMedia.title}
                </div>
                <div style={{ fontSize: 13, color: T.subCol, marginTop: 4 }}>
                  {openMedia.type === 'video' ? 'محتوى مرئي' : 'محتوى صوتي'}
                </div>
              </div>
              <button onClick={() => setOpenMedia(null)} style={closeBtnStyle}>
                ✕
              </button>
            </div>

            <div style={{ padding: 20, overflowY: 'auto' }}>
              {openMedia.type === 'video' ? (
                <div style={{ borderRadius: 20, overflow: 'hidden', background: '#000' }}>
                  <iframe
                    src={openMedia.embed_url || getEmbedUrl(openMedia.url) || openMedia.url}
                    title={openMedia.title}
                    style={{ width: '100%', height: '62vh', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
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