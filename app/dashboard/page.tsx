'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ar } from '@/lib/constants/ar'
import { BRAND } from '@/lib/constants/theme'
import { useRouteGuard } from '@/hooks/useRouteGuard'
import { signOutApp } from '@/lib/auth/auth.session'
import { writeStoredUser } from '@/lib/auth/auth.storage'
import { supabase } from '@/lib/supabase'
import FeedbackButtons from '@/components/FeedbackButtons'
import PrintButton from '@/components/PrintButton'
import SpeechButton from '@/components/SpeechButton'
import WordExportButton from '@/components/WordExportButton'
import PptxButton from '@/components/PptxButton'
import VisualCard from '@/components/VisualCard'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import NotificationBell from '@/components/NotificationBell'

const t = ar.dashboard
const c = ar.common

interface User {
  id: string
  name: string
  role: string
  user_type: string
  status?: string
  theme_color?: string
  theme_mode?: string
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
  file_urls?: string[]
}

interface Exam {
  id: string
  name: string
  exam_type: 'short' | 'final'
}

type ToolItem = {
  id: string
  icon: string
  label: string
  desc: string
}

const TOOLS = t.tools as readonly ToolItem[]
const FIXED_BRAND_COLOR = BRAND.deep

const LIGHT_THEME = {
  bg: BRAND.bg,
  pageBg: BRAND.bgSoft,
  sectionBg: BRAND.bgSoft,
  cardBg: BRAND.bgSoft,
  cardSoft: BRAND.bgSoft,
  headerBg: 'rgba(247,242,234,0.94)',

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
  crimson: BRAND.crimson,

  gold: BRAND.crimson,
  blue: '#2563EB',
  blueDark: '#1D4ED8',
  green: BRAND.crimson,
  danger: BRAND.crimson,

  gradMain: BRAND.gradMain,
  gradBlue: BRAND.gradBlue,
  gradWarm: `linear-gradient(135deg, rgba(140,20,40,0.10), ${BRAND.bgSoft})`,

  shadowSoft: BRAND.shadow,
  shadowCard: BRAND.shadowWarm,
  blueGlow: BRAND.shadowBlue,

  fontHeading: BRAND.fontHeading,
}

const DARK_THEME = {
  bg: '#1A1612',
  pageBg: '#15120F',
  sectionBg: '#211B16',
  cardBg: '#241F1A',
  cardSoft: '#2B241D',
  headerBg: 'rgba(26,22,18,0.92)',

  textCol: '#F0E9DE',
  titleCol: '#F5EFE6',
  subCol: '#B5A99C',
  mutedCol: '#8F8378',

  borderCol: 'rgba(140,20,40,0.25)',
  borderSoft: 'rgba(140,20,40,0.18)',
  inputBg: 'rgba(255,255,255,0.05)',
  inputBorder: 'rgba(255,255,255,0.10)',

  primary: BRAND.crimson,
  primaryHover: BRAND.red,
  primarySoft: 'rgba(140,20,40,0.15)',
  primaryDeep: BRAND.deep,
  crimson: BRAND.crimson,

  gold: BRAND.crimson,
  blue: '#4FA0FE',
  blueDark: '#2563EB',
  green: BRAND.crimson,
  danger: BRAND.crimson,

  gradMain: BRAND.gradMain,
  gradBlue: BRAND.gradBlue,
  gradWarm: 'linear-gradient(135deg,#2B241D,#1A1612)',

  shadowSoft: '0 8px 30px rgba(0,0,0,0.35)',
  shadowCard: '0 10px 24px rgba(0,0,0,0.3)',
  blueGlow: '0 8px 24px rgba(37,99,235,0.25)',

  fontHeading: BRAND.fontHeading,
}

type ThemePalette = typeof LIGHT_THEME | typeof DARK_THEME

function useDashboardCatalog(params: {
  user: User | null
  tool: string
  selSubject: Subject | null
  selUnit: Unit | null
  examType: 'short' | 'final'
}) {
  const { user, tool, selSubject, selUnit, examType } = params

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [exams, setExams] = useState<Exam[]>([])

  useEffect(() => {
    if (!user) {
      setSubjects([])
      return
    }

    const url =
      user.role === 'admin'
        ? '/api/subjects'
        : `/api/subjects?teacherId=${user.id}`

    fetch(url)
      .then(r => r.json())
      .then(d => setSubjects(d.subjects ?? []))
      .catch(console.error)
  }, [user])

  useEffect(() => {
    if (!selSubject) {
      setUnits([])
      return
    }

    fetch(`/api/units?subjectId=${selSubject.id}`)
      .then(r => r.json())
      .then(d => setUnits(d.units ?? []))
      .catch(console.error)
  }, [selSubject])

  useEffect(() => {
    if (!selUnit) {
      setLessons([])
      return
    }

    fetch(`/api/lessons?unitId=${selUnit.id}`)
      .then(r => r.json())
      .then(d => setLessons(d.lessons ?? []))
      .catch(console.error)
  }, [selUnit])

  useEffect(() => {
    if (tool !== 'exam' || !selSubject) {
      setExams([])
      return
    }

    fetch(`/api/exams?subjectId=${selSubject.id}&type=${examType}`)
      .then(r => r.json())
      .then(d => setExams(d.exams ?? []))
      .catch(console.error)
  }, [tool, selSubject, examType])

  return {
    subjects,
    units,
    lessons,
    exams,
  }
}

function useDashboardGenerator(params: {
  user: User | null
  selSubject: Subject | null
  selLesson: Lesson | null
  selExam: Exam | null
  tool: string
  details: string
}) {
  const { user, selSubject, selLesson, selExam, tool, details } = params

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [output, setOutput] = useState('')
  const [genId, setGenId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState('')
  const [savedText, setSavedText] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [editSaved, setEditSaved] = useState(false)

  const reset = useCallback(() => {
    setOutput('')
    setGenId('')
    setLoading(false)
    setError('')
    setCopied(false)
    setIsEditing(false)
    setEditedText('')
    setSavedText('')
    setSavingEdit(false)
    setEditSaved(false)
  }, [])

  const generate = useCallback(async () => {
    if (!user || !selSubject || !tool) return
    if (tool === 'exam' && !selExam) return
    if (tool !== 'exam' && !selLesson) return

    setLoading(true)
    setError('')
    setCopied(false)
    setIsEditing(false)
    setEditedText('')
    setSavedText('')

    try {
      const promptText =
        tool === 'exam'
          ? `${selExam?.name ?? ''} ${details}`.trim()
          : `${selLesson?.name ?? ''} ${details}`.trim()

      const body: Record<string, unknown> = {
        userId: user.id,
        tool,
        grade: selSubject.grade ?? '',
        stage: selSubject.stage ?? '',
        prompt: promptText,
        material: tool === 'exam' ? '' : (selLesson?.content ?? ''),
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || c.errors.generic)
        return
      }

      setOutput(data?.result ?? '')
      setSavedText(data?.result ?? '')
      setGenId(data?.generation_id ?? data?.id ?? '')
    } catch {
      setError(c.errors.connection)
    } finally {
      setLoading(false)
    }
  }, [details, selExam, selLesson, selSubject, tool, user])

  const startEditing = useCallback(() => {
    setEditedText(savedText || output)
    setIsEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 100)
  }, [output, savedText])

  const cancelEditing = useCallback(() => {
    setIsEditing(false)
    setEditedText('')
  }, [])

  const restoreOriginal = useCallback(() => {
    setEditedText(output)
  }, [output])

  const saveEdit = useCallback(async () => {
    if (!genId || !user) return

    setSavingEdit(true)

    try {
      await fetch('/api/history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: genId,
          userId: user.id,
          action: 'edit',
          value: editedText,
        }),
      })

      setSavedText(editedText)
      setIsEditing(false)
      setEditSaved(true)
      setTimeout(() => setEditSaved(false), 2500)
    } finally {
      setSavingEdit(false)
    }
  }, [editedText, genId, user])

  const copyText = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  return {
    textareaRef,
    output,
    genId,
    loading,
    error,
    copied,
    isEditing,
    editedText,
    savedText,
    savingEdit,
    editSaved,
    setEditedText,
    setError,
    reset,
    generate,
    startEditing,
    cancelEditing,
    restoreOriginal,
    saveEdit,
    copyText,
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: guardLoading, authorized, setUser } =
    useRouteGuard('teacher')

  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light')

  const [selSubject, setSelSubject] = useState<Subject | null>(null)
  const [selUnit, setSelUnit] = useState<Unit | null>(null)
  const [selLesson, setSelLesson] = useState<Lesson | null>(null)
  const [selExam, setSelExam] = useState<Exam | null>(null)

  const [tool, setTool] = useState<string>('')
  const [examType, setExamType] = useState<'short' | 'final'>('short')
  const [details, setDetails] = useState('')

  useEffect(() => {
    if (!user) return
    setThemeMode(user.theme_mode === 'dark' ? 'dark' : 'light')
  }, [user])

  const catalog = useDashboardCatalog({
    user: user as User | null,
    tool,
    selSubject,
    selUnit,
    examType,
  })

  const generator = useDashboardGenerator({
    user: user as User | null,
    selSubject,
    selLesson,
    selExam,
    tool,
    details,
  })

  const isDark = themeMode === 'dark'
  const T = isDark ? DARK_THEME : LIGHT_THEME
  const themeColor = FIXED_BRAND_COLOR
  const isAdmin = user?.role === 'admin'

  const toolData = useMemo(
    () => TOOLS.find(item => item.id === tool),
    [tool]
  )

  const canGenerate = Boolean(
    selSubject && tool && (tool === 'exam' ? selExam : selLesson)
  )

  const isModified =
    generator.savedText !== generator.output && generator.savedText !== ''

  const displayText = generator.savedText || generator.output

  const resetSelectionsAfterSubject = useCallback(() => {
    setSelUnit(null)
    setSelLesson(null)
    setSelExam(null)
    setTool('')
    setDetails('')
    generator.reset()
  }, [generator])

  const resetSelectionsAfterUnit = useCallback(() => {
    setSelLesson(null)
    setSelExam(null)
    setDetails('')
    generator.reset()
  }, [generator])

  const resetSelectionsAfterLesson = useCallback(() => {
    setDetails('')
    generator.reset()
  }, [generator])

  const resetSelectionsAfterTool = useCallback(() => {
    setSelExam(null)
    generator.reset()
  }, [generator])

  // ══════════════════════════════════════════════════════════════
  // تبديل الوضع الليلي/النهاري — مُصحَّح:
  // كان يستدعي PATCH /api/settings بلا Authorization header، فيفشل
  // دائماً بـ 401 (صامتاً بسبب .catch(() => {}))، والحالة تعود
  // للوضع الفاتح عند أي تحديث للصفحة لأنها لم تُحفظ فعلياً في القاعدة.
  // الآن نجلب access_token من جلسة Supabase ونرسله في الهيدر.
  // ══════════════════════════════════════════════════════════════
  const toggleThemeMode = useCallback(async () => {
    if (!user) return

    const next: 'light' | 'dark' = themeMode === 'dark' ? 'light' : 'dark'

    setThemeMode(next)

    const updated = {
      ...user,
      theme_mode: next,
    }

    setUser(updated)
    writeStoredUser(updated)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) return

      await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: user.id,
          theme_mode: next,
        }),
      })
    } catch {
      // فشل الحفظ في القاعدة لا يُسقط تجربة المستخدم — الحالة محفوظة محلياً بالفعل
    }
  }, [setUser, themeMode, user])

  const handleLogout = useCallback(async () => {
    await signOutApp()
    router.replace('/login')
  }, [router])

  if (guardLoading) return null
  if (!authorized || !user) return null

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${T.bg} 0%, ${T.pageBg} 100%)`,
        color: T.textCol,
        fontFamily: BRAND.fontBody,
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: ${T.bg}; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .result-fade {
          animation: fadeIn 0.35s ease;
        }
        textarea:focus,
        input:focus,
        button:focus {
          outline: none;
        }
        .page-wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px 18px 40px;
        }
        .hero-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 18px;
          align-items: center;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .tools-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
          .tools-grid {
            grid-template-columns: 1fr !important;
          }
          .stats-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <DashboardHeader
        user={user as User}
        isDark={isDark}
        isAdmin={isAdmin}
        themeColor={themeColor}
        T={T}
        onToggleTheme={toggleThemeMode}
        onLogout={handleLogout}
        onGoAdmin={() => router.push('/admin')}
        onGoAdminGenerator={() => router.push('/admin/generator')}
        onGoTeacher={() => router.push('/teacher')}
        onGoHistory={() => router.push('/history')}
      />

      <main className="page-wrap">
        <HeroSection
          T={T}
          isAdmin={isAdmin}
          themeColor={themeColor}
          subjectsCount={catalog.subjects.length}
          unitsCount={catalog.units.length}
          lessonsCount={catalog.lessons.length}
          toolLabel={toolData?.label ?? '—'}
        />

        <StepSection
          step="①"
          title="اختر المادة"
          cardBg={T.cardBg}
          borderCol={T.borderCol}
          textCol={T.textCol}
          themeColor={themeColor}
          T={T}
        >
          {catalog.subjects.length === 0 ? (
            <Empty text={t.noSubjects} subCol={T.subCol} />
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {catalog.subjects.map(subject => (
                <Chip
                  key={subject.id}
                  label={`${subject.icon ?? '📚'} ${subject.name}${
                    subject.grade ? ` — الصف ${subject.grade}` : ''
                  }`}
                  active={selSubject?.id === subject.id}
                  color={themeColor}
                  subCol={T.subCol}
                  borderCol={T.borderCol}
                  onClick={() => {
                    setSelSubject(subject)
                    resetSelectionsAfterSubject()
                  }}
                />
              ))}
            </div>
          )}
        </StepSection>

        {selSubject && (
          <StepSection
            step="②"
            title="اختر الوحدة"
            cardBg={T.cardBg}
            borderCol={T.borderCol}
            textCol={T.textCol}
            themeColor={themeColor}
            T={T}
          >
            {catalog.units.length === 0 ? (
              <Empty text="لا توجد وحدات لهذه المادة" subCol={T.subCol} />
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {catalog.units.map(unit => (
                  <Chip
                    key={unit.id}
                    label={`${unit.icon ?? '📖'} ${unit.name}`}
                    active={selUnit?.id === unit.id}
                    color={themeColor}
                    subCol={T.subCol}
                    borderCol={T.borderCol}
                    onClick={() => {
                      setSelUnit(unit)
                      resetSelectionsAfterUnit()
                    }}
                  />
                ))}
              </div>
            )}
          </StepSection>
        )}

        {selUnit && (
          <StepSection
            step="③"
            title="اختر الدرس"
            cardBg={T.cardBg}
            borderCol={T.borderCol}
            textCol={T.textCol}
            themeColor={themeColor}
            T={T}
          >
            {catalog.lessons.length === 0 ? (
              <Empty text="لا توجد دروس لهذه الوحدة" subCol={T.subCol} />
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {catalog.lessons.map(lesson => (
                  <Chip
                    key={lesson.id}
                    label={`✏️ ${lesson.name}${
                      lesson.file_urls?.length ? ' 📎' : ''
                    }`}
                    active={selLesson?.id === lesson.id}
                    color={themeColor}
                    subCol={T.subCol}
                    borderCol={T.borderCol}
                    onClick={() => {
                      setSelLesson(lesson)
                      resetSelectionsAfterLesson()
                    }}
                  />
                ))}
              </div>
            )}
          </StepSection>
        )}

        {selSubject && (
          <StepSection
            step="④"
            title="اختر الأداة"
            cardBg={T.cardBg}
            borderCol={T.borderCol}
            textCol={T.textCol}
            themeColor={themeColor}
            T={T}
          >
            <div className="tools-grid">
              {TOOLS.map(toolItem => (
                <ToolCard
                  key={toolItem.id}
                  item={toolItem}
                  active={tool === toolItem.id}
                  themeColor={themeColor}
                  cardBg={T.cardBg}
                  textCol={T.textCol}
                  subCol={T.subCol}
                  borderCol={T.borderCol}
                  onClick={() => {
                    setTool(toolItem.id)
                    resetSelectionsAfterTool()
                  }}
                />
              ))}
            </div>

            {tool === 'exam' && (
              <div
                style={{
                  marginTop: 20,
                  padding: 16,
                  borderRadius: 16,
                  background: T.inputBg,
                  border: `1px solid ${T.borderCol}`,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: T.subCol,
                    marginBottom: 12,
                  }}
                >
                  نوع الاختبار:
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    marginBottom: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  {(['short', 'final'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setExamType(type)
                        setSelExam(null)
                      }}
                      style={{
                        padding: '9px 20px',
                        borderRadius: 12,
                        border: `1px solid ${
                          examType === type ? themeColor : T.borderCol
                        }`,
                        background:
                          examType === type ? `${themeColor}14` : 'transparent',
                        color: examType === type ? themeColor : T.subCol,
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 800,
                        fontFamily: 'inherit',
                      }}
                    >
                      {type === 'short' ? t.exams.short : t.exams.final}
                    </button>
                  ))}
                </div>

                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: T.subCol,
                    marginBottom: 10,
                  }}
                >
                  {t.exams.title}
                </div>

                {catalog.exams.length === 0 ? (
                  <Empty text={t.exams.noneOfType} subCol={T.subCol} />
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {catalog.exams.map(exam => (
                      <Chip
                        key={exam.id}
                        label={exam.name}
                        active={selExam?.id === exam.id}
                        color={themeColor}
                        subCol={T.subCol}
                        borderCol={T.borderCol}
                        onClick={() => setSelExam(exam)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </StepSection>
        )}

        {canGenerate && (
          <StepSection
            step="⑤"
            title="تفاصيل إضافية"
            cardBg={T.cardBg}
            borderCol={T.borderCol}
            textCol={T.textCol}
            themeColor={themeColor}
            T={T}
          >
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder={t.placeholders.default}
              rows={4}
              style={{
                width: '100%',
                borderRadius: 14,
                padding: '14px 16px',
                background: T.inputBg,
                border: `1px solid ${T.inputBorder}`,
                color: T.textCol,
                fontSize: 15,
                fontFamily: 'inherit',
                resize: 'vertical',
                lineHeight: 1.8,
              }}
            />
          </StepSection>
        )}

        {canGenerate && (
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <button
              type="button"
              onClick={generator.generate}
              disabled={generator.loading}
              style={{
                padding: '16px 44px',
                borderRadius: 16,
                border: 'none',
                background: generator.loading ? T.borderCol : T.gradMain,
                color: generator.loading ? T.subCol : '#fff',
                fontSize: 18,
                fontWeight: 900,
                cursor: generator.loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.3s',
                minWidth: 240,
                boxShadow: generator.loading
                  ? 'none'
                  : `0 8px 24px ${themeColor}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                margin: '0 auto',
              }}
            >
              {generator.loading ? (
                <>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      flexShrink: 0,
                      border: `3px solid ${themeColor}33`,
                      borderTopColor: themeColor,
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  <span>جارٍ التوليد...</span>
                </>
              ) : (
                `✨ توليد ${toolData?.label ?? ''}`
              )}
            </button>
          </div>
        )}

        {generator.error && (
          <div
            style={{
              marginBottom: 20,
              padding: '14px 18px',
              borderRadius: 14,
              background: isDark ? 'rgba(224,114,114,0.12)' : '#FFF4F1',
              border: '1px solid rgba(200,90,84,0.28)',
              color: T.danger,
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            ⚠️ {generator.error}
          </div>
        )}

        {generator.output && (
          <ResultPanel
            T={T}
            themeColor={themeColor}
            isEditing={generator.isEditing}
            isModified={isModified}
            editSaved={generator.editSaved}
            copied={generator.copied}
            displayText={displayText}
            editedText={generator.editedText}
            savingEdit={generator.savingEdit}
            textareaRef={generator.textareaRef}
            toolData={toolData}
            selLesson={selLesson}
            selExam={selExam}
            selSubject={selSubject}
            user={user as User}
            genId={generator.genId}
            onStartEditing={generator.startEditing}
            onCopy={() => generator.copyText(displayText)}
            onRestoreOriginal={generator.restoreOriginal}
            onCancelEditing={generator.cancelEditing}
            onSaveEdit={generator.saveEdit}
            onEditedTextChange={generator.setEditedText}
          />
        )}
      </main>

      <footer
        style={{
          textAlign: 'center',
          padding: 22,
          color: T.subCol,
          fontSize: 13,
          borderTop: `1px solid ${T.borderCol}`,
          background: isDark
            ? 'rgba(255,255,255,0.03)'
            : 'rgba(255,255,255,0.22)',
        }}
      >
        {c.footerStages}
      </footer>
    </div>
  )
}

function DashboardHeader({
  user,
  isDark,
  isAdmin,
  themeColor,
  T,
  onToggleTheme,
  onLogout,
  onGoAdmin,
  onGoAdminGenerator,
  onGoTeacher,
  onGoHistory,
}: {
  user: User
  isDark: boolean
  isAdmin: boolean
  themeColor: string
  T: ThemePalette
  onToggleTheme: () => void
  onLogout: () => void
  onGoAdmin: () => void
  onGoAdminGenerator: () => void
  onGoTeacher: () => void
  onGoHistory: () => void
}) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: T.headerBg,
        backdropFilter: 'blur(18px)',
        borderBottom: `1px solid ${T.borderCol}`,
        padding: '14px 24px',
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 46,
              height: 46,
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
            <div
              style={{
                fontSize: 16,
                fontWeight: 900,
                color: themeColor,
                background: `${themeColor}16`,
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: 8,
                lineHeight: 1.2,
              }}
            >
              {c.platformName}
            </div>

            <div style={{ fontSize: 13, color: T.subCol, marginTop: 3 }}>
              {t.greeting(user.name)} • {isAdmin ? '👑 مدير' : '👨‍🏫 معلم'}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {isAdmin ? (
            <>
              <HeaderBtn
                label="🛠️ لوحة الأدمن"
                color={themeColor}
                bordered
                onClick={onGoAdmin}
                T={T}
              />
              <HeaderBtn
                label="✨ توليد الأدمن"
                color={themeColor}
                bordered
                onClick={onGoAdminGenerator}
                T={T}
              />
            </>
          ) : (
            <>
              <HeaderBtn
                label="👨‍🏫 إدارة الطلاب"
                color={themeColor}
                bordered
                onClick={onGoTeacher}
                T={T}
              />
              <HeaderBtn
                label="📚 سجل التوليدات"
                color={themeColor}
                bordered
                onClick={onGoHistory}
                T={T}
              />
            </>
          )}

          <HeaderBtn
            label={isDark ? '☀️' : '🌙'}
            color={T.subCol}
            onClick={onToggleTheme}
            T={T}
          />

          <HeaderBtn
            label={c.logout}
            color={T.danger}
            danger
            onClick={onLogout}
            T={T}
          />

          <NotificationBell
            userId={user.id}
            themeColor={themeColor}
            textCol={T.textCol}
            subCol={T.subCol}
            cardBg={T.cardBg}
            borderCol={T.borderCol}
            inputBg={T.inputBg}
            isDark={isDark}
          />
        </div>
      </div>
    </header>
  )
}

function HeroSection({
  T,
  isAdmin,
  themeColor,
  subjectsCount,
  unitsCount,
  lessonsCount,
  toolLabel,
}: {
  T: ThemePalette
  isAdmin: boolean
  themeColor: string
  subjectsCount: number
  unitsCount: number
  lessonsCount: number
  toolLabel: string
}) {
  return (
    <section
      style={{
        background: T.gradWarm,
        borderRadius: 26,
        border: `1px solid ${T.borderCol}`,
        boxShadow: T.shadowSoft,
        padding: 24,
        marginBottom: 20,
      }}
    >
      <div className="hero-grid">
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: `${themeColor}10`,
              color: themeColor,
              border: `1px solid ${themeColor}22`,
              padding: '8px 14px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 800,
              marginBottom: 14,
            }}
          >
            {isAdmin
              ? '✨ مساحة المدير لإدارة التوليد'
              : '✨ مساحة المعلم لإنتاج المحتوى'}
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 32,
              lineHeight: 1.35,
              fontWeight: 900,
              color: T.titleCol,
              fontFamily: BRAND.fontHeading,
            }}
          >
            اختر الدرس ثم
            <span
              style={{
                color: themeColor,
                background: `${themeColor}14`,
                padding: '2px 10px',
                borderRadius: 10,
                boxDecorationBreak: 'clone',
                WebkitBoxDecorationBreak: 'clone',
              }}
            >
              {' '}
              أنشئ شرحك واختبارك وخطتك{' '}
            </span>
            من مكان واحد.
          </h1>

          <p
            style={{
              margin: '14px 0 0',
              fontSize: 16,
              lineHeight: 1.9,
              color: T.subCol,
              maxWidth: 700,
            }}
          >
            {isAdmin
              ? 'هذه الواجهة مخصصة للمدير لمراجعة مسار التوليد والوصول السريع إلى أدوات الإدارة دون الدخول في مسار المعلم.'
              : 'هذه الواجهة مخصصة لعمل المعلم اليومي: تحديد المادة، اختيار الدرس، توليد المحتوى، ثم مراجعته وتعديله وتصديره بصورة سريعة وواضحة.'}
          </p>
        </div>

        <div className="stats-grid">
          <StatCard
            title="المواد"
            value={subjectsCount}
            sub="متاحة الآن"
            color={themeColor}
            icon="📚"
            T={T}
          />
          <StatCard
            title="الوحدات"
            value={unitsCount}
            sub="ضمن المادة"
            color={T.crimson}
            icon="🗂️"
            T={T}
          />
          <StatCard
            title="الدروس"
            value={lessonsCount}
            sub="جاهزة للاستخدام"
            color={T.blue}
            icon="📖"
            T={T}
          />
          <StatCard
            title="الأداة"
            value={toolLabel}
            sub="المحددة حالياً"
            color={T.crimson}
            icon="✨"
            T={T}
          />
        </div>
      </div>
    </section>
  )
}

function ResultPanel({
  T,
  themeColor,
  isEditing,
  isModified,
  editSaved,
  copied,
  displayText,
  editedText,
  savingEdit,
  textareaRef,
  toolData,
  selLesson,
  selExam,
  selSubject,
  user,
  genId,
  onStartEditing,
  onCopy,
  onRestoreOriginal,
  onCancelEditing,
  onSaveEdit,
  onEditedTextChange,
}: {
  T: ThemePalette
  themeColor: string
  isEditing: boolean
  isModified: boolean
  editSaved: boolean
  copied: boolean
  displayText: string
  editedText: string
  savingEdit: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  toolData?: ToolItem
  selLesson: Lesson | null
  selExam: Exam | null
  selSubject: Subject | null
  user: User
  genId: string
  onStartEditing: () => void
  onCopy: () => void
  onRestoreOriginal: () => void
  onCancelEditing: () => void
  onSaveEdit: () => void
  onEditedTextChange: (value: string) => void
}) {
  return (
    <div
      className="result-fade"
      style={{
        borderRadius: 20,
        padding: 24,
        background: T.cardBg,
        border: `1px solid ${isEditing ? `${themeColor}66` : T.borderCol}`,
        marginBottom: 28,
        boxShadow: T.shadowCard,
        transition: 'border-color 0.3s',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <h3
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: themeColor,
              background: `${themeColor}14`,
              display: 'inline-block',
              padding: '3px 12px',
              borderRadius: 8,
              margin: 0,
              fontFamily: BRAND.fontHeading,
            }}
          >
            {toolData?.icon} {toolData?.label}
            {selLesson && ` — ${selLesson.name}`}
            {selExam && ` — ${selExam.name}`}
          </h3>

          {isModified && !isEditing && (
            <span
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 8,
                background: `${themeColor}18`,
                color: themeColor,
                fontWeight: 800,
              }}
            >
              ✏️ معدّل
            </span>
          )}

          {editSaved && (
            <span
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 8,
                background: 'rgba(180,40,40,0.16)',
                color: T.crimson,
                fontWeight: 800,
              }}
            >
              ✅ تم الحفظ
            </span>
          )}
        </div>

        {!isEditing && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onStartEditing}
              style={smallBtn(
                `${themeColor}15`,
                themeColor,
                `1px solid ${themeColor}44`
              )}
            >
              ✏️ تعديل
            </button>

            <button
              type="button"
              onClick={onCopy}
              style={smallBtn(
                copied ? 'rgba(180,40,40,0.15)' : 'transparent',
                copied ? T.crimson : T.subCol,
                `1px solid ${copied ? T.crimson : T.borderCol}`
              )}
            >
              {copied ? '✅ تم النسخ' : '📋 نسخ'}
            </button>

            <PrintButton
              content={displayText}
              title={
                selExam?.name ??
                `${toolData?.label ?? ''}${selLesson ? ` — ${selLesson.name}` : ''}`
              }
              grade={selSubject?.grade}
              subject={selSubject?.name}
              themeColor={themeColor}
            />

            <WordExportButton
              content={displayText}
              title={
                selExam?.name ??
                `${toolData?.label ?? ''}${selLesson ? ` — ${selLesson.name}` : ''}`
              }
              grade={selSubject?.grade}
              subject={selSubject?.name}
              themeColor={themeColor}
            />

            <PptxButton
              content={displayText}
              title={
                selExam?.name ??
                `${toolData?.label ?? ''}${selLesson ? ` — ${selLesson.name}` : ''}`
              }
              grade={selSubject?.grade}
              subject={selSubject?.name}
              themeColor={themeColor}
            />
          </div>
        )}
      </div>

      {isEditing ? (
        <div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 12,
              padding: '10px 14px',
              borderRadius: 12,
              background: T.inputBg,
              border: `1px solid ${T.borderCol}`,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: T.subCol,
                fontWeight: 800,
              }}
            >
              ✏️ وضع التحرير
            </span>

            <div style={{ flex: 1 }} />

            <button
              type="button"
              onClick={onRestoreOriginal}
              style={smallBtn('transparent', T.subCol, `1px solid ${T.borderCol}`)}
            >
              🔄 استعادة الأصل
            </button>

            <button
              type="button"
              onClick={onCancelEditing}
              style={smallBtn(
                'rgba(200,90,84,0.08)',
                T.danger,
                '1px solid rgba(200,90,84,0.3)'
              )}
            >
              ❌ إلغاء
            </button>

            <button
              type="button"
              onClick={onSaveEdit}
              disabled={savingEdit}
              style={{
                padding: '6px 16px',
                borderRadius: 10,
                border: 'none',
                background: savingEdit ? `${themeColor}55` : themeColor,
                color: '#fff',
                cursor: savingEdit ? 'not-allowed' : 'pointer',
                fontSize: 12,
                fontWeight: 900,
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {savingEdit ? (
                <>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      border: '2px solid rgba(255,255,255,0.25)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  جارٍ الحفظ...
                </>
              ) : (
                '💾 حفظ التعديل'
              )}
            </button>
          </div>

          <textarea
            ref={textareaRef}
            value={editedText}
            onChange={e => onEditedTextChange(e.target.value)}
            rows={20}
            style={{
              width: '100%',
              borderRadius: 14,
              padding: '16px',
              background: T.inputBg,
              border: `1px solid ${themeColor}66`,
              color: T.textCol,
              fontSize: 15,
              fontFamily: BRAND.fontBody,
              resize: 'vertical',
              lineHeight: 1.9,
            }}
          />

          <div
            style={{
              textAlign: 'left',
              marginTop: 6,
              fontSize: 11,
              color: T.subCol,
            }}
          >
            {editedText.length} حرف
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 12 }}>
          <MarkdownRenderer
            text={displayText}
            textCol={T.textCol}
            subCol={T.subCol}
            fontSize={15}
          />
        </div>
      )}

      {!isEditing && (
        <>
          <div
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: `1px solid ${T.borderCol}`,
            }}
          >
            <SpeechButton text={displayText} themeColor={themeColor} />
          </div>

          <div
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: `1px solid ${T.borderCol}`,
            }}
          >
            <VisualCard
              content={displayText}
              title={
                selExam?.name ??
                `${toolData?.label ?? ''}${selLesson ? ` — ${selLesson.name}` : ''}`
              }
              grade={selSubject?.grade}
              subject={selSubject?.name}
              themeColor={themeColor}
            />
          </div>

          {genId && user && (
            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: `1px solid ${T.borderCol}`,
              }}
            >
              <FeedbackButtons
                generationId={genId}
                userId={user.id}
                themeColor={themeColor}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ToolCard({
  item,
  active,
  themeColor,
  cardBg,
  textCol,
  subCol,
  borderCol,
  onClick,
}: {
  item: ToolItem
  active: boolean
  themeColor: string
  cardBg: string
  textCol: string
  subCol: string
  borderCol: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '16px 12px',
        borderRadius: 16,
        textAlign: 'right',
        border: `1px solid ${active ? `${themeColor}33` : borderCol}`,
        background: active ? `${themeColor}0F` : cardBg,
        color: active ? themeColor : textCol,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.2s',
        boxShadow: active ? `0 10px 24px ${themeColor}14` : 'none',
      }}
    >
      <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
      <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>
        {item.label}
      </div>
      <div
        style={{
          fontSize: 12,
          color: active ? `${themeColor}cc` : subCol,
          lineHeight: 1.5,
        }}
      >
        {item.desc}
      </div>
    </button>
  )
}

function HeaderBtn({
  label,
  color,
  onClick,
  bordered,
  danger,
  T,
}: {
  label: string
  color: string
  onClick: () => void
  bordered?: boolean
  danger?: boolean
  T: ThemePalette
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: 12,
        fontFamily: 'inherit',
        fontSize: 14,
        fontWeight: 800,
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: danger
          ? '1px solid rgba(200,90,84,0.34)'
          : bordered
            ? `1px solid ${color}44`
            : `1px solid ${T.borderCol}`,
        background: danger
          ? 'rgba(200,90,84,0.08)'
          : bordered
            ? `${color}12`
            : T.cardBg,
        color,
      }}
    >
      {label}
    </button>
  )
}

function StepSection({
  step,
  title,
  children,
  cardBg,
  borderCol,
  textCol,
  themeColor,
  T,
}: {
  step: string
  title: string
  children: ReactNode
  cardBg: string
  borderCol: string
  textCol: string
  themeColor: string
  T: ThemePalette
}) {
  return (
    <div
      style={{
        borderRadius: 20,
        padding: '20px 22px',
        background: cardBg,
        border: `1px solid ${borderCol}`,
        marginBottom: 18,
        boxShadow: T.shadowCard,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontSize: 16,
            color: themeColor,
            fontWeight: 900,
            background: `${themeColor}16`,
            width: 28,
            height: 28,
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {step}
        </span>

        <h2
          style={{
            fontSize: 16,
            fontWeight: 900,
            color: textCol,
            margin: 0,
            fontFamily: BRAND.fontHeading,
          }}
        >
          {title}
        </h2>
      </div>

      <div>{children}</div>
    </div>
  )
}

function Chip({
  label,
  active,
  color,
  subCol,
  borderCol,
  onClick,
}: {
  label: string
  active: boolean
  color: string
  subCol: string
  borderCol: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '10px 18px',
        borderRadius: 12,
        border: `1px solid ${active ? color : borderCol}`,
        background: active ? `${color}15` : 'transparent',
        color: active ? color : subCol,
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 800,
        fontFamily: 'inherit',
        transition: 'all 0.15s',
        boxShadow: active ? `0 6px 18px ${color}18` : 'none',
      }}
    >
      {label}
    </button>
  )
}

function Empty({
  text,
  subCol,
}: {
  text: string
  subCol: string
}) {
  return (
    <p
      style={{
        color: subCol,
        fontSize: 14,
        margin: 0,
        padding: '8px 0',
        lineHeight: 1.8,
      }}
    >
      {text}
    </p>
  )
}

function StatCard({
  title,
  value,
  sub,
  color,
  icon,
  T,
}: {
  title: string
  value: string | number
  sub: string
  color: string
  icon: string
  T: ThemePalette
}) {
  return (
    <div
      style={{
        background: T.cardBg,
        borderRadius: 18,
        border: `1px solid ${color}20`,
        padding: 16,
        boxShadow: T.shadowCard,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${color}14`,
            fontSize: 18,
          }}
        >
          {icon}
        </div>

        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            color,
            background: `${color}14`,
            padding: '2px 8px',
            borderRadius: 6,
          }}
        >
          {title}
        </span>
      </div>

      <div
        style={{
          fontSize: 24,
          fontWeight: 900,
          color: T.titleCol,
          marginBottom: 4,
        }}
      >
        {value}
      </div>

      <div style={{ fontSize: 12, color: T.subCol }}>{sub}</div>
    </div>
  )
}

function smallBtn(
  background: string,
  color: string,
  border: string
): CSSProperties {
  return {
    padding: '6px 14px',
    borderRadius: 10,
    border,
    background,
    color,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 800,
    fontFamily: 'inherit',
  }
}
