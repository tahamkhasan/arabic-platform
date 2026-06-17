'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter }         from 'next/navigation'
import { ar }                from '@/lib/constants/ar'
import FeedbackButtons       from '@/components/FeedbackButtons'
import PrintButton           from '@/components/PrintButton'
import SpeechButton          from '@/components/SpeechButton'
import WordExportButton      from '@/components/WordExportButton'
import PptxButton            from '@/components/PptxButton'
import VisualCard            from '@/components/VisualCard'
import MarkdownRenderer      from '@/components/MarkdownRenderer'
import NotificationBell from '@/components/NotificationBell'

const t = ar.dashboard
const c = ar.common

interface User    { id: string; name: string; role: string; user_type: string; theme_color?: string; theme_mode?: string }
interface Subject { id: string; name: string; icon?: string; grade?: string; stage?: string }
interface Unit    { id: string; name: string; icon?: string }
interface Lesson  { id: string; name: string; content?: string; file_urls?: string[] }
interface Exam    { id: string; name: string; exam_type: 'short' | 'final' }

const TOOLS = t.tools as readonly { id: string; icon: string; label: string; desc: string }[]

export default function DashboardPage() {
  const router = useRouter()

  const [user,           setUser]           = useState<User | null>(null)
  const [themeColor,     setThemeColor]     = useState('#f9d423')
  const [themeMode,      setThemeMode]      = useState<'dark' | 'light' | 'system'>('dark')
  const [showSettings,   setShowSettings]   = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  const [subjects,   setSubjects]   = useState<Subject[]>([])
  const [units,      setUnits]      = useState<Unit[]>([])
  const [lessons,    setLessons]    = useState<Lesson[]>([])
  const [exams,      setExams]      = useState<Exam[]>([])

  const [selSubject, setSelSubject] = useState<Subject | null>(null)
  const [selUnit,    setSelUnit]    = useState<Unit | null>(null)
  const [selLesson,  setSelLesson]  = useState<Lesson | null>(null)
  const [selExam,    setSelExam]    = useState<Exam | null>(null)
  const [tool,       setTool]       = useState<string>('')
  const [examType,   setExamType]   = useState<'short' | 'final'>('short')
  const [details,    setDetails]    = useState('')

  const [output,     setOutput]     = useState('')
  const [genId,      setGenId]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [copied,     setCopied]     = useState(false)

  const [isEditing,  setIsEditing]  = useState(false)
  const [editedText, setEditedText] = useState('')
  const [savedText,  setSavedText]  = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [editSaved,  setEditSaved]  = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── تحميل المستخدم مع حارس الطالب ───────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('mosaed_user')
    if (!saved) { router.replace('/'); return }
    try {
      const u = JSON.parse(saved) as User
      // ✅ الطالب ليس له مكان هنا — أعده لصفحته
// ✅ الطالب ليس له مكان هنا — أعده لصفحته
if (u.user_type === 'student') { router.replace('/student'); return }      setUser(u)
      if (u.theme_color) setThemeColor(u.theme_color)
      if (u.theme_mode)  setThemeMode(u.theme_mode as 'dark' | 'light' | 'system')
    } catch { router.replace('/') }
  }, [router])

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
    if (tool !== 'exam' || !selSubject) { setExams([]); return }
    fetch(`/api/exams?subjectId=${selSubject.id}&type=${examType}`).then(r => r.json()).then(d => setExams(d.exams ?? [])).catch(console.error)
  }, [tool, selSubject, examType])

  // ── isDark reactive ───────────────────────────────────────────
  const [isDark, setIsDark] = useState(true)
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

  const bg        = isDark ? '#0d0b1e'                : '#f0f4ff'
  const cardBg    = isDark ? 'rgba(255,255,255,0.07)' : '#ffffff'
  const textCol   = isDark ? '#f1f5f9'                : '#1a202c'
  const subCol    = isDark ? '#94a3b8'                : '#4a5568'
  const borderCol = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
  const inputBg   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const headerBg  = isDark ? 'rgba(13,11,30,0.97)'   : 'rgba(240,244,255,0.97)'

  const handleGenerate = useCallback(async () => {
    if (!user || !selSubject || (!selLesson && tool !== 'exam') || !tool) return
    setLoading(true); setOutput(''); setError('')
    setIsEditing(false); setEditedText(''); setSavedText('')
    try {
      const promptText = tool === 'exam'
        ? `${selExam?.name ?? ''} ${details}`.trim()
        : `${selLesson?.name ?? ''} ${details}`.trim()

      const body: Record<string, unknown> = {
        userId:   user.id,
        tool,
        grade:    selSubject.grade   ?? '',
        stage:    selSubject.stage   ?? '',
        prompt:   promptText,
        material: tool === 'exam' ? '' : (selLesson?.content ?? ''),
      }

      const res  = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || c.errors.generic); return }
      setOutput(data.result)
      setSavedText(data.result)
      setGenId(data.generation_id ?? data.id ?? '')
    } catch {
      setError(c.errors.connection)
    } finally { setLoading(false) }
  }, [user, selSubject, selLesson, selExam, tool, details])

  function startEditing()   { setEditedText(savedText || output); setIsEditing(true); setTimeout(() => textareaRef.current?.focus(), 100) }
  function cancelEditing()  { setIsEditing(false); setEditedText('') }
  function restoreOriginal(){ setEditedText(output) }

  async function saveEdit() {
    if (!genId || !user) return
    setSavingEdit(true)
    try {
      await fetch('/api/history', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: genId, userId: user.id, action: 'edit', value: editedText }),
      })
      setSavedText(editedText); setIsEditing(false)
      setEditSaved(true); setTimeout(() => setEditSaved(false), 2500)
    } finally { setSavingEdit(false) }
  }

  async function saveSettings() {
    if (!user) return
    setSavingSettings(true)
    try {
      await fetch('/api/settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, theme_color: themeColor, theme_mode: themeMode }),
      })
      const updated = { ...user, theme_color: themeColor, theme_mode: themeMode }
      setUser(updated)
      localStorage.setItem('mosaed_user', JSON.stringify(updated))
    } finally { setSavingSettings(false); setShowSettings(false) }
  }

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    localStorage.removeItem('mosaed_user')
    localStorage.removeItem('mosaed_session')
    router.replace('/')
  }

  const canGenerate = selSubject && tool && (tool === 'exam' ? !!selExam : !!selLesson)
  const toolData    = TOOLS.find(x => x.id === tool)
  const isModified  = savedText !== output && savedText !== ''
  const displayText = savedText || output

  if (!user) return null

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: bg, color: textCol, fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; } body { margin: 0; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .result-fade { animation: fadeIn 0.4s ease; }
        textarea:focus { outline: none; }
      `}</style>

      {/* ══ الرأس ══════════════════════════════════════════════ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: headerBg, backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${borderCol}`,
        padding: '14px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🌙</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: themeColor, lineHeight: 1.2 }}>{c.platformName}</div>
            <div style={{ fontSize: 13, color: subCol, marginTop: 2 }}>
              {t.greeting(user.name)} • {user.role === 'admin' ? '👑 مدير' : '👨‍🏫 معلم'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <HeaderBtn label="👨‍🏫 إدارة الطلاب" color={themeColor} bordered onClick={() => router.push('/teacher')} />
          <HeaderBtn label="📚 سجل التوليدات" color={themeColor} bordered onClick={() => router.push('/history')} />
          <HeaderBtn label={t.settings.title} color={subCol} isDark={isDark} onClick={() => setShowSettings(true)} />
          <HeaderBtn label={c.logout} color="#fc8181" danger onClick={handleLogout} />
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
        </div>
      </header>

      {/* ══ المحتوى ════════════════════════════════════════════ */}
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px' }}>

        {/* ① المادة */}
        <Section step="①" title="اختر المادة" cardBg={cardBg} borderCol={borderCol} textCol={textCol} themeColor={themeColor}>
          {subjects.length === 0
            ? <Empty text={t.noSubjects} subCol={subCol} />
            : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {subjects.map(s => (
                  <Chip key={s.id}
                    label={`${s.icon ?? '📚'} ${s.name}${s.grade ? ` — الصف ${s.grade}` : ''}`}
                    active={selSubject?.id === s.id} color={themeColor} subCol={subCol} borderCol={borderCol}
                    onClick={() => { setSelSubject(s); setSelUnit(null); setSelLesson(null); setTool(''); setOutput(''); setGenId(''); setSavedText('') }}
                  />
                ))}
              </div>
            )}
        </Section>

        {/* ② الوحدة */}
        {selSubject && (
          <Section step="②" title="اختر الوحدة" cardBg={cardBg} borderCol={borderCol} textCol={textCol} themeColor={themeColor}>
            {units.length === 0
              ? <Empty text="لا توجد وحدات لهذه المادة" subCol={subCol} />
              : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {units.map(u => (
                    <Chip key={u.id} label={`${u.icon ?? '📖'} ${u.name}`}
                      active={selUnit?.id === u.id} color={themeColor} subCol={subCol} borderCol={borderCol}
                      onClick={() => { setSelUnit(u); setSelLesson(null); setOutput(''); setGenId(''); setSavedText('') }}
                    />
                  ))}
                </div>
              )}
          </Section>
        )}

        {/* ③ الدرس */}
        {selUnit && (
          <Section step="③" title="اختر الدرس" cardBg={cardBg} borderCol={borderCol} textCol={textCol} themeColor={themeColor}>
            {lessons.length === 0
              ? <Empty text="لا توجد دروس لهذه الوحدة" subCol={subCol} />
              : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {lessons.map(l => (
                    <Chip key={l.id} label={`✏️ ${l.name}${l.file_urls?.length ? ' 📎' : ''}`}
                      active={selLesson?.id === l.id} color={themeColor} subCol={subCol} borderCol={borderCol}
                      onClick={() => { setSelLesson(l); setOutput(''); setGenId(''); setSavedText('') }}
                    />
                  ))}
                </div>
              )}
          </Section>
        )}

        {/* ④ الأداة */}
        {selSubject && (
          <Section step="④" title="ماذا تريد؟" cardBg={cardBg} borderCol={borderCol} textCol={textCol} themeColor={themeColor}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {TOOLS.map(tool_ => (
                <button key={tool_.id}
                  onClick={() => { setTool(tool_.id); setOutput(''); setGenId(''); setSavedText('') }}
                  style={{
                    padding: '16px 12px', borderRadius: 14, textAlign: 'right',
                    border: `2px solid ${tool === tool_.id ? themeColor : borderCol}`,
                    background: tool === tool_.id ? `${themeColor}18` : cardBg,
                    color: tool === tool_.id ? themeColor : textCol,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                    boxShadow: tool === tool_.id ? `0 4px 16px ${themeColor}30` : 'none',
                  }}
                >
                  <div style={{ fontSize: 26, marginBottom: 8 }}>{tool_.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{tool_.label}</div>
                  <div style={{ fontSize: 12, color: tool === tool_.id ? `${themeColor}cc` : subCol, lineHeight: 1.4 }}>{tool_.desc}</div>
                </button>
              ))}
            </div>

            {tool === 'exam' && (
              <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: inputBg, border: `1px solid ${borderCol}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: subCol, marginBottom: 12 }}>نوع الاختبار:</div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  {(['short', 'final'] as const).map(type => (
                    <button key={type} onClick={() => { setExamType(type); setSelExam(null) }}
                      style={{
                        padding: '8px 20px', borderRadius: 10,
                        border: `2px solid ${examType === type ? themeColor : borderCol}`,
                        background: examType === type ? `${themeColor}18` : 'transparent',
                        color: examType === type ? themeColor : subCol,
                        cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                      }}
                    >
                      {type === 'short' ? t.exams.short : t.exams.final}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: subCol, marginBottom: 10 }}>{t.exams.title}</div>
                {exams.length === 0
                  ? <Empty text={t.exams.noneOfType} subCol={subCol} />
                  : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {exams.map(ex => (
                        <Chip key={ex.id} label={ex.name}
                          active={selExam?.id === ex.id} color={themeColor} subCol={subCol} borderCol={borderCol}
                          onClick={() => setSelExam(ex)}
                        />
                      ))}
                    </div>
                  )}
              </div>
            )}
          </Section>
        )}

        {/* ⑤ تفاصيل */}
        {canGenerate && (
          <Section step="⑤" title="تفاصيل إضافية (اختياري)" cardBg={cardBg} borderCol={borderCol} textCol={textCol} themeColor={themeColor}>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder={t.placeholders.default}
              rows={3}
              style={{
                width: '100%', borderRadius: 12, padding: '14px 16px',
                background: inputBg, border: `1.5px solid ${borderCol}`,
                color: textCol, fontSize: 15, fontFamily: 'inherit',
                resize: 'vertical', lineHeight: 1.7,
              }}
            />
          </Section>
        )}

        {/* زر التوليد */}
        {canGenerate && (
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <button onClick={handleGenerate} disabled={loading}
              style={{
                padding: '16px 48px', borderRadius: 16, border: 'none',
                background: loading
                  ? isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
                  : `linear-gradient(135deg,${themeColor},#ff4e50)`,
                color: loading ? themeColor : '#1a1a2e',
                fontSize: 18, fontWeight: 900,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'all 0.3s', minWidth: 240,
                boxShadow: loading ? 'none' : `0 8px 24px ${themeColor}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                margin: '0 auto',
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: 22, height: 22, flexShrink: 0, border: `3px solid ${themeColor}33`, borderTopColor: themeColor, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  <span>جارٍ التوليد...</span>
                </>
              ) : `✨ توليد ${toolData?.label ?? ''}`}
            </button>
          </div>
        )}

        {/* خطأ */}
        {error && (
          <div style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 14, background: 'rgba(252,129,129,0.12)', border: '1.5px solid rgba(252,129,129,0.4)', color: '#fc8181', fontSize: 15, fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* النتيجة */}
        {output && (
          <div className="result-fade" style={{
            borderRadius: 18, padding: 28, background: cardBg,
            border: `1.5px solid ${isEditing ? themeColor + '88' : borderCol}`,
            marginBottom: 28, transition: 'border-color 0.3s',
          }}>
            {/* رأس النتيجة */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 17, fontWeight: 900, color: themeColor, margin: 0 }}>
                  {toolData?.icon} {toolData?.label}
                  {selLesson && ` — ${selLesson.name}`}
                  {selExam   && ` — ${selExam.name}`}
                </h3>
                {isModified && !isEditing && (
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: `${themeColor}22`, color: themeColor, fontWeight: 700 }}>✏️ معدَّل</span>
                )}
                {editSaved && (
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(72,187,120,0.2)', color: '#68d391', fontWeight: 700 }}>✅ تم الحفظ</span>
                )}
              </div>

              {!isEditing && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={startEditing}
                    style={{ padding: '6px 14px', borderRadius: 10, border: `1.5px solid ${themeColor}55`, background: `${themeColor}15`, color: themeColor, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
                    ✏️ تعديل
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(displayText); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                    style={{ padding: '6px 14px', borderRadius: 10, border: `1.5px solid ${copied ? '#68d391' : borderCol}`, background: copied ? 'rgba(72,187,120,0.15)' : 'transparent', color: copied ? '#68d391' : subCol, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
                    {copied ? '✅ تم النسخ' : '📋 نسخ'}
                  </button>
                  <PrintButton content={displayText}
                    title={tool === 'exam' ? (selExam?.name ?? '') : `${toolData?.label ?? ''} — ${selLesson?.name ?? ''}`}
                    grade={selSubject?.grade} subject={selSubject?.name} themeColor={themeColor} />
                  <WordExportButton content={displayText}
                    title={tool === 'exam' ? (selExam?.name ?? '') : `${toolData?.label ?? ''} — ${selLesson?.name ?? ''}`}
                    grade={selSubject?.grade} subject={selSubject?.name} themeColor={themeColor} />
                  <PptxButton content={displayText}
                    title={tool === 'exam' ? (selExam?.name ?? '') : `${toolData?.label ?? ''} — ${selLesson?.name ?? ''}`}
                    grade={selSubject?.grade} subject={selSubject?.name} themeColor={themeColor} />
                </div>
              )}
            </div>

            {/* وضع التحرير */}
            {isEditing ? (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: inputBg, border: `1px solid ${borderCol}`, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: subCol, fontWeight: 700 }}>✏️ وضع التحرير</span>
                  <div style={{ flex: 1 }} />
                  <button onClick={restoreOriginal}
                    style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${borderCol}`, background: 'transparent', color: subCol, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
                    🔄 استعادة الأصل
                  </button>
                  <button onClick={cancelEditing}
                    style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(252,129,129,0.4)', background: 'rgba(252,129,129,0.1)', color: '#fc8181', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
                    ❌ إلغاء
                  </button>
                  <button onClick={saveEdit} disabled={savingEdit}
                    style={{ padding: '5px 16px', borderRadius: 8, border: 'none', background: savingEdit ? `${themeColor}44` : themeColor, color: '#1a1a2e', cursor: savingEdit ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 900, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {savingEdit ? (
                      <><span style={{ width: 12, height: 12, border: '2px solid #1a1a2e44', borderTopColor: '#1a1a2e', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />جارٍ الحفظ...</>
                    ) : '💾 حفظ التعديل'}
                  </button>
                </div>
                <textarea ref={textareaRef} value={editedText} onChange={e => setEditedText(e.target.value)} rows={20}
                  style={{ width: '100%', borderRadius: 12, padding: '16px', background: inputBg, border: `2px solid ${themeColor}66`, color: textCol, fontSize: 15, fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif", resize: 'vertical', lineHeight: 1.9 }} />
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
                  <VisualCard content={displayText}
                    title={tool === 'exam' ? (selExam?.name ?? '') : `${toolData?.label ?? ''} — ${selLesson?.name ?? ''}`}
                    grade={selSubject?.grade} subject={selSubject?.name} themeColor={themeColor} />
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

      {/* ══ الإعدادات ══════════════════════════════════════════ */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowSettings(false) }}>
          <div style={{ width: '90%', maxWidth: 400, borderRadius: 24, padding: 28, background: isDark ? '#1a1630' : '#ffffff', border: `1px solid ${borderCol}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: themeColor, margin: 0 }}>{t.settings.title}</h2>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: subCol, fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: textCol, marginBottom: 12 }}>{t.settings.themeColor}</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {t.themeColors.map(th => (
                  <button key={th.value} title={th.name} onClick={() => setThemeColor(th.value)}
                    style={{ width: 44, height: 44, borderRadius: '50%', background: th.gradient, border: 'none', cursor: 'pointer', boxShadow: themeColor === th.value ? `0 0 0 3px ${isDark ? '#fff' : '#333'}, 0 0 0 6px ${th.value}` : 'none', transition: 'all 0.2s' }} />
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: textCol, marginBottom: 12 }}>{t.settings.displayMode}</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {(['dark', 'light', 'system'] as const).map(mode => (
                  <button key={mode} onClick={() => setThemeMode(mode)}
                    style={{ flex: 1, padding: '10px 6px', borderRadius: 12, border: `2px solid ${themeMode === mode ? themeColor : borderCol}`, background: themeMode === mode ? `${themeColor}18` : 'transparent', color: themeMode === mode ? themeColor : subCol, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
                    {{ dark: t.settings.modes.dark, light: t.settings.modes.light, system: t.settings.modes.system }[mode]}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={saveSettings} disabled={savingSettings}
              style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg,${themeColor},#ff4e50)`, color: '#1a1a2e', fontWeight: 900, fontSize: 16, cursor: savingSettings ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: savingSettings ? 0.7 : 1 }}>
              {savingSettings ? c.saving : '💾 حفظ الإعدادات'}
            </button>
          </div>
        </div>
      )}

      <footer style={{ textAlign: 'center', padding: '24px', color: subCol, fontSize: 13, borderTop: `1px solid ${borderCol}` }}>
        {c.footerStages}
      </footer>
    </div>
  )
}

function HeaderBtn({ label, color, onClick, bordered, danger, isDark }: {
  label: string; color: string; onClick: () => void
  bordered?: boolean; danger?: boolean; isDark?: boolean
}) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 16px', borderRadius: 10, fontFamily: 'inherit',
      fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
      border: danger ? '1.5px solid rgba(252,129,129,0.4)' : bordered ? `1.5px solid ${color}55` : `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
      background: danger ? 'rgba(252,129,129,0.1)' : bordered ? `${color}15` : 'transparent',
      color,
    }}>
      {label}
    </button>
  )
}

function Section({ step, title, children, cardBg, borderCol, textCol, themeColor }: {
  step: string; title: string; children: React.ReactNode
  cardBg: string; borderCol: string; textCol: string; themeColor: string
}) {
  return (
    <div style={{ borderRadius: 18, padding: '20px 24px', background: cardBg, border: `1.5px solid ${borderCol}`, marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 18, color: themeColor, fontWeight: 900 }}>{step}</span>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: textCol, margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Chip({ label, active, color, subCol, borderCol, onClick }: {
  label: string; active: boolean; color: string
  subCol: string; borderCol: string; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 18px', borderRadius: 12,
      border: `2px solid ${active ? color : borderCol}`,
      background: active ? `${color}22` : 'transparent',
      color: active ? color : subCol,
      cursor: 'pointer', fontSize: 14, fontWeight: 700,
      fontFamily: 'inherit', transition: 'all 0.15s',
      boxShadow: active ? `0 4px 14px ${color}33` : 'none',
    }}>
      {label}
    </button>
  )
}

function Empty({ text, subCol }: { text: string; subCol: string }) {
  return <p style={{ color: subCol, fontSize: 14, margin: 0, padding: '8px 0' }}>{text}</p>
}