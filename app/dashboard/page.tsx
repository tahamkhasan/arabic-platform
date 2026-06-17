'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ar } from '@/lib/constants/ar'
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

interface User { id: string; name: string; role: string; user_type: string; theme_color?: string; theme_mode?: string }
interface Subject { id: string; name: string; icon?: string; grade?: string; stage?: string }
interface Unit { id: string; name: string; icon?: string }
interface Lesson { id: string; name: string; content?: string; file_urls?: string[] }
interface Exam { id: string; name: string; exam_type: 'short' | 'final' }

const TOOLS = t.tools as readonly { id: string; icon: string; label: string; desc: string }[]

const T = {
  bg: '#F5F0E8',
  pageBg: '#F7F2EA',
  sectionBg: '#FBF8F2',
  cardBg: '#FFFDF9',
  cardSoft: '#F3E8DE',
  headerBg: 'rgba(245,240,232,0.94)',

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
  danger: '#C85A54',

  gradMain: 'linear-gradient(135deg,#C0392B,#E07020)',
  gradBlue: 'linear-gradient(135deg,#2563EB,#1D4ED8)',
  gradWarm: 'linear-gradient(135deg,#F7E5D3,#FFF9F3)',

  shadowSoft: '0 8px 30px rgba(73,44,24,0.08)',
  shadowCard: '0 10px 24px rgba(60,35,20,0.06)',
  blueGlow: '0 8px 24px rgba(37,99,235,0.18)',
}

const ACCENT_COLORS = ['#C0392B', '#E07020', '#F4A420', '#2563EB', '#059669', '#7C3AED']

export default function DashboardPage() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [themeColor, setThemeColor] = useState(T.primaryDeep)
  const [showSettings, setShowSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [exams, setExams] = useState<Exam[]>([])

  const [selSubject, setSelSubject] = useState<Subject | null>(null)
  const [selUnit, setSelUnit] = useState<Unit | null>(null)
  const [selLesson, setSelLesson] = useState<Lesson | null>(null)
  const [selExam, setSelExam] = useState<Exam | null>(null)
  const [tool, setTool] = useState<string>('')
  const [examType, setExamType] = useState<'short' | 'final'>('short')
  const [details, setDetails] = useState('')

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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('mosaed_user')
    if (!saved) { router.replace('/'); return }
    try {
      const u = JSON.parse(saved) as User
      if (u.user_type === 'student') { router.replace('/student'); return }
      setUser(u)
      if (u.theme_color) setThemeColor(u.theme_color)
    } catch {
      router.replace('/')
    }
  }, [router])

  useEffect(() => {
    if (!user) return
    fetch('/api/subjects')
      .then(r => r.json())
      .then(d => setSubjects(d.subjects ?? []))
      .catch(console.error)
  }, [user])

  useEffect(() => {
    if (!selSubject) { setUnits([]); setSelUnit(null); return }
    fetch(`/api/units?subjectId=${selSubject.id}`)
      .then(r => r.json())
      .then(d => setUnits(d.units ?? []))
      .catch(console.error)
  }, [selSubject])

  useEffect(() => {
    if (!selUnit) { setLessons([]); setSelLesson(null); return }
    fetch(`/api/lessons?unitId=${selUnit.id}`)
      .then(r => r.json())
      .then(d => setLessons(d.lessons ?? []))
      .catch(console.error)
  }, [selUnit])

  useEffect(() => {
    if (tool !== 'exam' || !selSubject) { setExams([]); return }
    fetch(`/api/exams?subjectId=${selSubject.id}&type=${examType}`)
      .then(r => r.json())
      .then(d => setExams(d.exams ?? []))
      .catch(console.error)
  }, [tool, selSubject, examType])

  const bg = T.bg
  const cardBg = T.cardBg
  const textCol = T.textCol
  const subCol = T.subCol
  const borderCol = T.borderCol
  const inputBg = T.inputBg
  const headerBg = T.headerBg

  const handleGenerate = useCallback(async () => {
    if (!user || !selSubject || (!selLesson && tool !== 'exam') || !tool) return
    setLoading(true)
    setOutput('')
    setError('')
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

      const data = await res.json()
      if (!res.ok) { setError(data.error || c.errors.generic); return }

      setOutput(data.result)
      setSavedText(data.result)
      setGenId(data.generation_id ?? data.id ?? '')
    } catch {
      setError(c.errors.connection)
    } finally {
      setLoading(false)
    }
  }, [user, selSubject, selLesson, selExam, tool, details])

  function startEditing() {
    setEditedText(savedText || output)
    setIsEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  function cancelEditing() {
    setIsEditing(false)
    setEditedText('')
  }

  function restoreOriginal() {
    setEditedText(output)
  }

  async function saveEdit() {
    if (!genId || !user) return
    setSavingEdit(true)
    try {
      await fetch('/api/history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: genId, userId: user.id, action: 'edit', value: editedText }),
      })
      setSavedText(editedText)
      setIsEditing(false)
      setEditSaved(true)
      setTimeout(() => setEditSaved(false), 2500)
    } finally {
      setSavingEdit(false)
    }
  }

  async function saveSettings() {
    if (!user) return
    setSavingSettings(true)
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          theme_color: themeColor,
          theme_mode: 'light',
        }),
      })
      const updated = { ...user, theme_color: themeColor, theme_mode: 'light' }
      setUser(updated)
      localStorage.setItem('mosaed_user', JSON.stringify(updated))
    } finally {
      setSavingSettings(false)
      setShowSettings(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    localStorage.removeItem('mosaed_user')
    localStorage.removeItem('mosaed_session')
    router.replace('/')
  }

  const canGenerate = selSubject && tool && (tool === 'exam' ? !!selExam : !!selLesson)
  const toolData = TOOLS.find(x => x.id === tool)
  const isModified = savedText !== output && savedText !== ''
  const displayText = savedText || output

  if (!user) return null

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${T.bg} 0%, ${T.pageBg} 100%)`,
        color: textCol,
        fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .result-fade { animation: fadeIn 0.35s ease; }
        textarea:focus, input:focus { outline: none; }
      `}</style>

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: headerBg,
          backdropFilter: 'blur(18px)',
          borderBottom: `1px solid ${borderCol}`,
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
              <div style={{ fontSize: 16, fontWeight: 900, color: themeColor, lineHeight: 1.2 }}>
                {c.platformName}
              </div>
              <div style={{ fontSize: 13, color: subCol, marginTop: 3 }}>
                {t.greeting(user.name)} • {user.role === 'admin' ? '👑 مدير' : '👨‍🏫 معلم'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <HeaderBtn label="👨‍🏫 إدارة الطلاب" color={themeColor} bordered onClick={() => router.push('/teacher')} />
            <HeaderBtn label="📚 سجل التوليدات" color={themeColor} bordered onClick={() => router.push('/history')} />
            <HeaderBtn label={t.settings.title} color={subCol} onClick={() => setShowSettings(true)} />
            <HeaderBtn label={c.logout} color={T.danger} danger onClick={handleLogout} />
            <NotificationBell
              userId={user.id}
              themeColor={themeColor}
              textCol={textCol}
              subCol={subCol}
              cardBg={cardBg}
              borderCol={borderCol}
              inputBg={inputBg}
              isDark={false}
            />
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 18px 40px' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18, alignItems: 'center' }}>
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
                ✨ مساحة المعلم لإنتاج المحتوى
              </div>

              <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.35, fontWeight: 900, color: T.titleCol }}>
                اختر الدرس ثم
                <span style={{ color: themeColor }}> أنشئ شرحك واختبارك وخطتك </span>
                من مكان واحد.
              </h1>

              <p style={{ margin: '14px 0 0', fontSize: 16, lineHeight: 1.9, color: subCol, maxWidth: 700 }}>
                هذه الواجهة مخصصة لعمل المعلم اليومي: تحديد المادة، اختيار الدرس، توليد المحتوى،
                ثم مراجعته وتعديله وتصديره بصورة سريعة وواضحة.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
              <StatCard title="المواد" value={subjects.length} sub="متاحة الآن" color={themeColor} icon="📚" />
              <StatCard title="الوحدات" value={units.length} sub="ضمن المادة" color={T.green} icon="🗂️" />
              <StatCard title="الدروس" value={lessons.length} sub="جاهزة للاستخدام" color={T.blue} icon="📖" />
              <StatCard title="الأداة" value={toolData?.label ?? '—'} sub="المحددة حالياً" color={T.gold} icon="✨" />
            </div>
          </div>
        </section>

        <Section step="①" title="اختر المادة" cardBg={cardBg} borderCol={borderCol} textCol={textCol} themeColor={themeColor}>
          {subjects.length === 0 ? (
            <Empty text={t.noSubjects} subCol={subCol} />
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {subjects.map(s => (
                <Chip
                  key={s.id}
                  label={`${s.icon ?? '📚'} ${s.name}${s.grade ? ` — الصف ${s.grade}` : ''}`}
                  active={selSubject?.id === s.id}
                  color={themeColor}
                  subCol={subCol}
                  borderCol={borderCol}
                  onClick={() => {
                    setSelSubject(s)
                    setSelUnit(null)
                    setSelLesson(null)
                    setTool('')
                    setOutput('')
                    setGenId('')
                    setSavedText('')
                  }}
                />
              ))}
            </div>
          )}
        </Section>

        {selSubject && (
          <Section step="②" title="اختر الوحدة" cardBg={cardBg} borderCol={borderCol} textCol={textCol} themeColor={themeColor}>
            {units.length === 0 ? (
              <Empty text="لا توجد وحدات لهذه المادة" subCol={subCol} />
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {units.map(u => (
                  <Chip
                    key={u.id}
                    label={`${u.icon ?? '📖'} ${u.name}`}
                    active={selUnit?.id === u.id}
                    color={themeColor}
                    subCol={subCol}
                    borderCol={borderCol}
                    onClick={() => {
                      setSelUnit(u)
                      setSelLesson(null)
                      setOutput('')
                      setGenId('')
                      setSavedText('')
                    }}
                  />
                ))}
              </div>
            )}
          </Section>
        )}

        {selUnit && (
          <Section step="③" title="اختر الدرس" cardBg={cardBg} borderCol={borderCol} textCol={textCol} themeColor={themeColor}>
            {lessons.length === 0 ? (
              <Empty text="لا توجد دروس لهذه الوحدة" subCol={subCol} />
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {lessons.map(l => (
                  <Chip
                    key={l.id}
                    label={`✏️ ${l.name}${l.file_urls?.length ? ' 📎' : ''}`}
                    active={selLesson?.id === l.id}
                    color={themeColor}
                    subCol={subCol}
                    borderCol={borderCol}
                    onClick={() => {
                      setSelLesson(l)
                      setOutput('')
                      setGenId('')
                      setSavedText('')
                    }}
                  />
                ))}
              </div>
            )}
          </Section>
        )}

        {selSubject && (
          <Section step="④" title="اختر الأداة" cardBg={cardBg} borderCol={borderCol} textCol={textCol} themeColor={themeColor}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {TOOLS.map(tool_ => (
                <button
                  key={tool_.id}
                  onClick={() => {
                    setTool(tool_.id)
                    setOutput('')
                    setGenId('')
                    setSavedText('')
                  }}
                  style={{
                    padding: '16px 12px',
                    borderRadius: 16,
                    textAlign: 'right',
                    border: `1px solid ${tool === tool_.id ? themeColor + '33' : borderCol}`,
                    background: tool === tool_.id ? `${themeColor}0F` : cardBg,
                    color: tool === tool_.id ? themeColor : textCol,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                    boxShadow: tool === tool_.id ? `0 10px 24px ${themeColor}14` : 'none',
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{tool_.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>{tool_.label}</div>
                  <div style={{ fontSize: 12, color: tool === tool_.id ? `${themeColor}cc` : subCol, lineHeight: 1.5 }}>
                    {tool_.desc}
                  </div>
                </button>
              ))}
            </div>

            {tool === 'exam' && (
              <div style={{ marginTop: 20, padding: 16, borderRadius: 16, background: inputBg, border: `1px solid ${borderCol}` }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: subCol, marginBottom: 12 }}>نوع الاختبار:</div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  {(['short', 'final'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => { setExamType(type); setSelExam(null) }}
                      style={{
                        padding: '9px 20px',
                        borderRadius: 12,
                        border: `1px solid ${examType === type ? themeColor : borderCol}`,
                        background: examType === type ? `${themeColor}14` : 'transparent',
                        color: examType === type ? themeColor : subCol,
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

                <div style={{ fontSize: 14, fontWeight: 800, color: subCol, marginBottom: 10 }}>{t.exams.title}</div>
                {exams.length === 0 ? (
                  <Empty text={t.exams.noneOfType} subCol={subCol} />
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {exams.map(ex => (
                      <Chip
                        key={ex.id}
                        label={ex.name}
                        active={selExam?.id === ex.id}
                        color={themeColor}
                        subCol={subCol}
                        borderCol={borderCol}
                        onClick={() => setSelExam(ex)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </Section>
        )}

        {canGenerate && (
          <Section step="⑤" title="تفاصيل إضافية" cardBg={cardBg} borderCol={borderCol} textCol={textCol} themeColor={themeColor}>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder={t.placeholders.default}
              rows={4}
              style={{
                width: '100%',
                borderRadius: 14,
                padding: '14px 16px',
                background: inputBg,
                border: `1px solid ${T.inputBorder}`,
                color: textCol,
                fontSize: 15,
                fontFamily: 'inherit',
                resize: 'vertical',
                lineHeight: 1.8,
              }}
            />
          </Section>
        )}

        {canGenerate && (
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                padding: '16px 44px',
                borderRadius: 16,
                border: 'none',
                background: loading ? T.borderCol : T.gradMain,
                color: loading ? subCol : '#fff',
                fontSize: 18,
                fontWeight: 900,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.3s',
                minWidth: 240,
                boxShadow: loading ? 'none' : `0 8px 24px ${themeColor}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                margin: '0 auto',
              }}
            >
              {loading ? (
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

        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: '14px 18px',
              borderRadius: 14,
              background: '#FFF4F1',
              border: '1px solid rgba(200,90,84,0.28)',
              color: T.danger,
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {output && (
          <div
            className="result-fade"
            style={{
              borderRadius: 20,
              padding: 24,
              background: cardBg,
              border: `1px solid ${isEditing ? themeColor + '66' : borderCol}`,
              marginBottom: 28,
              boxShadow: T.shadowCard,
              transition: 'border-color 0.3s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: themeColor, margin: 0 }}>
                  {toolData?.icon} {toolData?.label}
                  {selLesson && ` — ${selLesson.name}`}
                  {selExam && ` — ${selExam.name}`}
                </h3>

                {isModified && !isEditing && (
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, background: `${themeColor}18`, color: themeColor, fontWeight: 800 }}>
                    ✏️ معدّل
                  </span>
                )}

                {editSaved && (
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, background: 'rgba(72,187,120,0.16)', color: T.green, fontWeight: 800 }}>
                    ✅ تم الحفظ
                  </span>
                )}
              </div>

              {!isEditing && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={startEditing}
                    style={smallBtn(`${themeColor}15`, themeColor, `1px solid ${themeColor}44`)}
                  >
                    ✏️ تعديل
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(displayText)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    style={smallBtn(copied ? 'rgba(72,187,120,0.15)' : 'transparent', copied ? T.green : subCol, `1px solid ${copied ? T.green : borderCol}`)}
                  >
                    {copied ? '✅ تم النسخ' : '📋 نسخ'}
                  </button>

                  <PrintButton
                    content={displayText}
                    title={tool === 'exam' ? (selExam?.name ?? '') : `${toolData?.label ?? ''} — ${selLesson?.name ?? ''}`}
                    grade={selSubject?.grade}
                    subject={selSubject?.name}
                    themeColor={themeColor}
                  />
                  <WordExportButton
                    content={displayText}
                    title={tool === 'exam' ? (selExam?.name ?? '') : `${toolData?.label ?? ''} — ${selLesson?.name ?? ''}`}
                    grade={selSubject?.grade}
                    subject={selSubject?.name}
                    themeColor={themeColor}
                  />
                  <PptxButton
                    content={displayText}
                    title={tool === 'exam' ? (selExam?.name ?? '') : `${toolData?.label ?? ''} — ${selLesson?.name ?? ''}`}
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
                    background: inputBg,
                    border: `1px solid ${borderCol}`,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 13, color: subCol, fontWeight: 800 }}>✏️ وضع التحرير</span>
                  <div style={{ flex: 1 }} />

                  <button onClick={restoreOriginal} style={smallBtn('transparent', subCol, `1px solid ${borderCol}`)}>
                    🔄 استعادة الأصل
                  </button>

                  <button onClick={cancelEditing} style={smallBtn('rgba(200,90,84,0.08)', T.danger, '1px solid rgba(200,90,84,0.3)')}>
                    ❌ إلغاء
                  </button>

                  <button
                    onClick={saveEdit}
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
                        <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                        جارٍ الحفظ...
                      </>
                    ) : '💾 حفظ التعديل'}
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  value={editedText}
                  onChange={e => setEditedText(e.target.value)}
                  rows={20}
                  style={{
                    width: '100%',
                    borderRadius: 14,
                    padding: '16px',
                    background: inputBg,
                    border: `1px solid ${themeColor}66`,
                    color: textCol,
                    fontSize: 15,
                    fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
                    resize: 'vertical',
                    lineHeight: 1.9,
                  }}
                />
                <div style={{ textAlign: 'left', marginTop: 6, fontSize: 11, color: subCol }}>{editedText.length} حرف</div>
              </div>
            ) : (
              <div style={{ marginBottom: 12 }}>
                <MarkdownRenderer text={displayText} textCol={textCol} subCol={subCol} fontSize={15} />
              </div>
            )}

            {!isEditing && (
              <>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${borderCol}` }}>
                  <SpeechButton text={displayText} themeColor={themeColor} />
                </div>

                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${borderCol}` }}>
                  <VisualCard
                    content={displayText}
                    title={tool === 'exam' ? (selExam?.name ?? '') : `${toolData?.label ?? ''} — ${selLesson?.name ?? ''}`}
                    grade={selSubject?.grade}
                    subject={selSubject?.name}
                    themeColor={themeColor}
                  />
                </div>

                {genId && user && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${borderCol}` }}>
                    <FeedbackButtons generationId={genId} userId={user.id} themeColor={themeColor} />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {showSettings && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(33,28,23,0.38)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowSettings(false) }}
        >
          <div
            style={{
              width: '90%',
              maxWidth: 400,
              borderRadius: 24,
              padding: 28,
              background: T.cardBg,
              border: `1px solid ${borderCol}`,
              boxShadow: T.shadowSoft,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: themeColor, margin: 0 }}>{t.settings.title}</h2>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: subCol, fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: textCol, marginBottom: 12 }}>🎨 لون التمييز</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {ACCENT_COLORS.map(col => (
                  <button
                    key={col}
                    title={col}
                    onClick={() => setThemeColor(col)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: col,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: themeColor === col ? `0 0 0 3px ${T.bg}, 0 0 0 6px ${col}` : 'none',
                      transition: 'all 0.2s',
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={saveSettings}
              disabled={savingSettings}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 14,
                border: 'none',
                background: T.gradBlue,
                color: '#fff',
                fontWeight: 900,
                fontSize: 16,
                cursor: savingSettings ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                opacity: savingSettings ? 0.7 : 1,
                boxShadow: T.blueGlow,
              }}
            >
              {savingSettings ? c.saving : '💾 حفظ الإعدادات'}
            </button>
          </div>
        </div>
      )}

      <footer
        style={{
          textAlign: 'center',
          padding: '22px',
          color: subCol,
          fontSize: 13,
          borderTop: `1px solid ${borderCol}`,
          background: 'rgba(255,255,255,0.22)',
        }}
      >
        {c.footerStages}
      </footer>
    </div>
  )
}

function HeaderBtn({
  label, color, onClick, bordered, danger,
}: {
  label: string
  color: string
  onClick: () => void
  bordered?: boolean
  danger?: boolean
}) {
  return (
    <button
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

function Section({
  step, title, children, cardBg, borderCol, textCol, themeColor,
}: {
  step: string
  title: string
  children: React.ReactNode
  cardBg: string
  borderCol: string
  textCol: string
  themeColor: string
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 18, color: themeColor, fontWeight: 900 }}>{step}</span>
        <h2 style={{ fontSize: 16, fontWeight: 900, color: textCol, margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Chip({
  label, active, color, subCol, borderCol, onClick,
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

function Empty({ text, subCol }: { text: string; subCol: string }) {
  return <p style={{ color: subCol, fontSize: 14, margin: 0, padding: '8px 0', lineHeight: 1.8 }}>{text}</p>
}

function StatCard({
  title, value, sub, color, icon,
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
        padding: 16,
        boxShadow: T.shadowCard,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
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
        <span style={{ fontSize: 12, fontWeight: 800, color }}>{title}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: T.titleCol, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: T.subCol }}>{sub}</div>
    </div>
  )
}

function smallBtn(background: string, color: string, border: string): React.CSSProperties {
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