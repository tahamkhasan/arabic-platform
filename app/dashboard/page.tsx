'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FeedbackButtons   from '@/components/FeedbackButtons'
import PrintButton       from '@/components/PrintButton'
import SpeechButton      from '@/components/SpeechButton'
import WordExportButton  from '@/components/WordExportButton'
import PptxButton        from '@/components/PptxButton'

const TOOLS = [
  { id: 'explain',   icon: '💡', label: 'شرح الدرس',      desc: 'شرح مبسط مع أمثلة' },
  { id: 'worksheet', icon: '📋', label: 'ورقة عمل',       desc: 'أنشطة تفاعلية' },
  { id: 'game',      icon: '🎮', label: 'لعبة لغوية',     desc: 'نشاط ممتع وتعليمي' },
  { id: 'plan',      icon: '📖', label: 'تحضير الدرس',    desc: 'خطة درس كاملة' },
  { id: 'pptx',      icon: '📊', label: 'عرض PowerPoint', desc: 'شرائح جاهزة للعرض' },
  { id: 'exam',      icon: '📝', label: 'اختبار',          desc: 'أسئلة متنوعة' },
]

const THEME_COLORS = [
  { name: 'ذهبي',    value: '#f9d423', gradient: 'linear-gradient(135deg,#f9d423,#ff4e50)' },
  { name: 'أزرق',    value: '#4facfe', gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)' },
  { name: 'أخضر',    value: '#43e97b', gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)' },
  { name: 'بنفسجي',  value: '#a78bfa', gradient: 'linear-gradient(135deg,#a78bfa,#ec4899)' },
  { name: 'برتقالي', value: '#f97316', gradient: 'linear-gradient(135deg,#f97316,#ef4444)' },
  { name: 'وردي',    value: '#ec4899', gradient: 'linear-gradient(135deg,#ec4899,#8b5cf6)' },
]

const STAGE_NAMES: Record<string, string> = { primary: 'ابتدائي', middle: 'متوسط', high: 'ثانوي' }

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser]               = useState<any>(null)
  const [subjects, setSubjects]       = useState<any[]>([])
  const [units, setUnits]             = useState<any[]>([])
  const [lessons, setLessons]         = useState<any[]>([])
  const [exams, setExams]             = useState<any[]>([])
  const [selSubject, setSelSubject]   = useState<any>(null)
  const [selUnit, setSelUnit]         = useState<any>(null)
  const [selLesson, setSelLesson]     = useState<any>(null)
  const [tool, setTool]               = useState<string | null>(null)
  const [examMode, setExamMode]       = useState<'short' | 'final' | null>(null)
  const [selExam, setSelExam]         = useState<any>(null)
  const [examLessons, setExamLessons] = useState<any[]>([])
  const [userInput, setUserInput]     = useState('')
  const [output, setOutput]           = useState('')
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [copied, setCopied]           = useState(false)

  // إعدادات المظهر
  const [showSettings, setShowSettings] = useState(false)
  const [themeColor, setThemeColor]     = useState('#f9d423')
  const [themeMode, setThemeMode]       = useState<'dark' | 'light' | 'system'>('dark')
  const [savingTheme, setSavingTheme]   = useState(false)

  const isDark = themeMode === 'dark' ||
    (themeMode === 'system' && typeof window !== 'undefined' &&
     window.matchMedia('(prefers-color-scheme: dark)').matches)

  const bg        = isDark ? 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)' : 'linear-gradient(135deg,#f0f4ff,#e8ecf8,#dde6ff)'
  const cardBg    = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)'
  const textMain  = isDark ? '#e2e8f0' : '#1a1a2e'
  const textSub   = isDark ? '#718096' : '#4a5568'
  const borderCol = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const inputBg   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)'
  const themeGradient = THEME_COLORS.find(c => c.value === themeColor)?.gradient || 'linear-gradient(135deg,#f9d423,#ff4e50)'

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) return router.push('/')
    const u = JSON.parse(stored)
    setUser(u)
    setThemeColor(u.theme_color || '#f9d423')
    setThemeMode(u.theme_mode || 'dark')
    fetchSubjects(u)
  }, [])

  async function fetchSubjects(u: any) {
    const params = new URLSearchParams()
    if (u.user_type === 'teacher' && u.allowed_stages?.length > 0)
      params.append('stages', u.allowed_stages.join(','))
    if (u.user_type === 'student') {
      if (u.allowed_stages?.length > 0) params.append('stage', u.allowed_stages[0])
      if (u.allowed_grades?.length > 0) params.append('grade', u.allowed_grades[0])
    }
    const res = await fetch(`/api/subjects?${params}`)
    const d = await res.json()
    setSubjects(d.subjects || [])
  }

  async function selectSubject(s: any) {
    setSelSubject(s); setSelUnit(null); setSelLesson(null)
    setUnits([]); setLessons([]); setOutput(''); setError(''); setGenerationId(null)
    const [uRes, eRes] = await Promise.all([
      fetch(`/api/units?subject_id=${s.id}`),
      fetch(`/api/exams?subject_id=${s.id}`),
    ])
    const [uD, eD] = await Promise.all([uRes.json(), eRes.json()])
    setUnits(uD.units || [])
    setExams(eD.exams || [])
  }

  async function selectUnit(u: any) {
    setSelUnit(u); setSelLesson(null); setLessons([]); setOutput(''); setError(''); setGenerationId(null)
    const res = await fetch(`/api/lessons?unit_id=${u.id}`)
    const d = await res.json()
    setLessons(d.lessons || [])
  }

  async function selectExam(exam: any) {
    setSelExam(exam)
    if (exam.lesson_ids?.length > 0) {
      const res = await fetch(`/api/lessons?lesson_ids=${exam.lesson_ids.join(',')}`)
      const d = await res.json()
      setExamLessons(d.lessons || [])
    }
  }

  function buildMaterial() {
    if (tool === 'exam' && selExam) {
      let ctx = `اسم الاختبار: ${selExam.name}\nنوع الاختبار: ${selExam.exam_type === 'short' ? 'اختبار قصير' : 'اختبار نهائي'}\n`
      if (selExam.description) ctx += `تعليمات: ${selExam.description}\n`
      if (examLessons.length > 0) {
        ctx += '\nمحتوى الدروس:\n'
        examLessons.forEach(l => { ctx += `\n━━ ${l.name} ━━\n${l.content || ''}\n` })
      }
      return ctx
    }
    if (!selLesson) return ''
    return `المادة: ${selSubject?.name}\nالوحدة: ${selUnit?.name}\nالدرس: ${selLesson.name}\n${selLesson.description ? `الوصف: ${selLesson.description}\n` : ''}${selLesson.content ? `\nالمادة العلمية:\n${selLesson.content}` : ''}`
  }

  async function handleGenerate() {
    if (tool === 'exam') { if (!selExam) return setError('اختر الاختبار أولاً') }
    else { if (!selLesson) return setError('اختر الدرس أولاً'); if (!tool) return setError('اختر الأداة أولاً') }
    setError(''); setOutput(''); setLoading(true); setGenerationId(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: tool || 'exam', grade: selSubject?.grade, stage: selSubject?.stage,
          prompt: userInput || `${tool === 'exam' ? `أعدّ ${selExam?.name}` : `${TOOLS.find(t => t.id === tool)?.label} لدرس ${selLesson?.name}`}`,
          userId: user?.id, material: buildMaterial(),
        }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'حدث خطأ')
      setOutput(data.result)
      setGenerationId(data.generation_id ?? null)
    } catch { setError('خطأ في الاتصال.') }
    setLoading(false)
  }

  async function saveTheme(color: string, mode: string) {
    setSavingTheme(true)
    setThemeColor(color); setThemeMode(mode as any)
    const updatedUser = { ...user, theme_color: color, theme_mode: mode }
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, theme_color: color, theme_mode: mode }),
    })
    setSavingTheme(false)
  }

  function handleLogout() {
    localStorage.removeItem('user'); localStorage.removeItem('session'); router.push('/')
  }

  const shortExams = exams.filter(e => e.exam_type === 'short')
  const finalExams = exams.filter(e => e.exam_type === 'final')
  const toolData   = TOOLS.find(t => t.id === tool)

  return (
    <div dir="rtl" style={{ minHeight: '100vh', padding: '16px', color: textMain, background: bg, fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif", transition: 'all 0.3s' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0, background: themeGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🌙 مساعد اللغة العربية
          </h1>
          <p style={{ margin: 0, color: textSub, fontSize: 11 }}>
            أهلاً {user?.name || user?.email} 👋
            {user?.user_type === 'teacher' && user?.allowed_stages?.length > 0 && (
              <span style={{ marginRight: 8, color: themeColor, fontSize: 10 }}>
                ({user.allowed_stages.map((s: string) => STAGE_NAMES[s]).join('، ')})
              </span>
            )}
            {user?.user_type === 'student' && (
              <span style={{ marginRight: 8, color: themeColor, fontSize: 10 }}>
                (الصف {user?.allowed_grades?.[0]})
              </span>
            )}
          </p>
        </div>
        <button onClick={() => setShowSettings(true)} style={{ background: cardBg, border: `1px solid ${borderCol}`, color: textSub, borderRadius: 12, padding: '8px 14px', cursor: 'pointer', fontSize: 18 }}>⚙️</button>
      </div>

      {/* القائمة الجانبية للإعدادات */}
      {showSettings && (
        <>
          <div onClick={() => setShowSettings(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40, backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 300, zIndex: 50, background: isDark ? '#0d1117' : '#ffffff', borderRight: `1px solid ${borderCol}`, padding: 24, overflowY: 'auto', boxShadow: '4px 0 30px rgba(0,0,0,0.3)', animation: 'slideIn 0.3s ease' }}>
            <style>{`@keyframes slideIn { from { transform: translateX(-100%) } to { transform: translateX(0) } }`}</style>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: textMain }}>⚙️ الإعدادات</h2>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: textSub, cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <div style={{ padding: 14, borderRadius: 14, marginBottom: 20, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px solid ${borderCol}` }}>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: textMain }}>{user?.name}</p>
              <p style={{ margin: 0, fontSize: 12, color: textSub }}>{user?.email}</p>
              <span style={{ display: 'inline-block', marginTop: 6, fontSize: 11, padding: '2px 8px', borderRadius: 8, background: themeColor + '22', color: themeColor, fontWeight: 700 }}>
                {user?.user_type === 'teacher' ? '👨‍🏫 معلم' : '👨‍🎓 طالب'}
              </span>
            </div>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: textSub, marginBottom: 10 }}>🎨 لون المظهر</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {THEME_COLORS.map(c => (
                  <button key={c.value} onClick={() => saveTheme(c.value, themeMode)}
                    style={{ padding: '10px 6px', borderRadius: 12, border: themeColor === c.value ? `2px solid ${c.value}` : '2px solid transparent', background: c.gradient, cursor: 'pointer', color: '#1a1a2e', fontWeight: 700, fontSize: 11, transition: 'all 0.2s', boxShadow: themeColor === c.value ? `0 4px 12px ${c.value}44` : 'none' }}>
                    {themeColor === c.value ? '✓ ' : ''}{c.name}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: 1, background: borderCol, marginBottom: 20 }} />
            <button onClick={handleLogout} style={{ width: '100%', padding: 13, borderRadius: 14, border: '1.5px solid rgba(252,129,129,0.3)', background: 'rgba(252,129,129,0.08)', color: '#fc8181', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 16 }}>
              🚪 تسجيل الخروج
            </button>
            <div style={{ height: 1, background: borderCol, marginBottom: 20 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: textSub, marginBottom: 10 }}>🌓 وضع العرض</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['dark','🌙 داكن'],['light','☀️ فاتح'],['system','💻 حسب النظام']].map(([mode, label]) => (
                  <button key={mode} onClick={() => saveTheme(themeColor, mode)}
                    style={{ padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${themeMode === mode ? themeColor : borderCol}`, background: themeMode === mode ? themeColor + '15' : 'transparent', color: themeMode === mode ? themeColor : textSub, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right', transition: 'all 0.2s' }}>
                    {label} {themeMode === mode ? '✓' : ''}
                  </button>
                ))}
              </div>
            </div>
            {savingTheme && <p style={{ textAlign: 'center', color: '#43e97b', fontSize: 12, marginTop: 12 }}>💾 جارٍ الحفظ...</p>}
          </div>
        </>
      )}

      {/* Step 1: المادة */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: textSub, fontWeight: 700, marginBottom: 8 }}>① اختر المادة</p>
        {subjects.length === 0
          ? <p style={{ fontSize: 12, color: textSub, padding: 12, borderRadius: 12, border: `1px solid ${borderCol}`, background: cardBg }}>لا توجد مواد متاحة — تواصل مع المدير</p>
          : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {subjects.map(s => (
              <button key={s.id} onClick={() => selectSubject(s)} style={{ padding: '10px 16px', borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'all 0.2s', background: selSubject?.id === s.id ? themeGradient : cardBg, color: selSubject?.id === s.id ? '#1a1a2e' : textSub, boxShadow: selSubject?.id === s.id ? `0 4px 14px ${themeColor}44` : 'none' }}>
                {s.icon} {s.name}
              </button>
            ))}
          </div>
        }
      </div>

      {/* Step 2: الوحدة */}
      {selSubject && units.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: textSub, fontWeight: 700, marginBottom: 8 }}>② اختر الوحدة</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {units.map(u => (
              <button key={u.id} onClick={() => selectUnit(u)} style={{ padding: '9px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, transition: 'all 0.2s', background: selUnit?.id === u.id ? themeGradient : cardBg, color: selUnit?.id === u.id ? '#1a1a2e' : textSub }}>
                {u.icon} {u.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: الدرس */}
      {selUnit && lessons.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: textSub, fontWeight: 700, marginBottom: 8 }}>③ اختر الدرس</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lessons.map(l => (
              <button key={l.id} onClick={() => { setSelLesson(l); setTool(null); setOutput(''); setError(''); setExamMode(null); setGenerationId(null) }} style={{ padding: '12px 14px', borderRadius: 12, border: selLesson?.id === l.id ? `2px solid ${themeColor}` : `1.5px solid ${borderCol}`, cursor: 'pointer', fontWeight: 700, fontSize: 13, textAlign: 'right', background: selLesson?.id === l.id ? themeColor + '15' : cardBg, color: selLesson?.id === l.id ? themeColor : textSub, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
                <span style={{ color: textSub, fontSize: 11 }}>{l.order_num}.</span>
                {l.name}
                {l.file_urls?.length > 0 && <span style={{ fontSize: 11, color: '#4facfe', marginRight: 'auto' }}>📎</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: الأداة */}
      {(selLesson || examMode) && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: textSub, fontWeight: 700, marginBottom: 8 }}>④ ماذا تريد؟</p>
          {selLesson && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {TOOLS.filter(t => t.id !== 'exam').map(t => (
                <button key={t.id} onClick={() => { setTool(t.id); setExamMode(null); setSelExam(null); setOutput(''); setGenerationId(null) }} style={{ padding: '12px 8px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 12, textAlign: 'right', border: tool === t.id ? `2px solid ${themeColor}` : '2px solid transparent', background: tool === t.id ? themeColor + '15' : cardBg, color: tool === t.id ? themeColor : textSub, transition: 'all 0.2s' }}>
                  <div style={{ fontSize: 20, marginBottom: 3 }}>{t.icon}</div>
                  <div style={{ fontWeight: 900 }}>{t.label}</div>
                  <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>{t.desc}</div>
                </button>
              ))}
            </div>
          )}
          {selSubject && exams.length > 0 && (
            <div style={{ padding: 14, borderRadius: 14, border: `1px solid ${borderCol}`, background: cardBg }}>
              <p style={{ fontSize: 12, color: textSub, fontWeight: 700, marginBottom: 8 }}>📝 الاختبارات</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {[['short','📝 قصير'],['final','📊 نهائي']].map(([type, label]) => (
                  <button key={type} onClick={() => { setExamMode(type as any); setTool('exam'); setSelLesson(null); setSelExam(null); setOutput(''); setGenerationId(null) }} style={{ flex: 1, padding: 9, borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, background: examMode === type ? themeGradient : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', color: examMode === type ? '#1a1a2e' : textSub, transition: 'all 0.2s' }}>{label}</button>
                ))}
              </div>
              {examMode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(examMode === 'short' ? shortExams : finalExams).map(e => (
                    <button key={e.id} onClick={() => { selectExam(e); setOutput(''); setGenerationId(null) }} style={{ padding: '9px 12px', borderRadius: 10, textAlign: 'right', cursor: 'pointer', fontWeight: 700, fontSize: 12, border: selExam?.id === e.id ? `1px solid ${themeColor}` : `1px solid ${borderCol}`, background: selExam?.id === e.id ? themeColor + '15' : 'transparent', color: selExam?.id === e.id ? themeColor : textSub, transition: 'all 0.2s' }}>
                      {e.name}
                      {e.lesson_ids?.length > 0 && <span style={{ color: textSub, fontSize: 10, marginRight: 6 }}>({e.lesson_ids.length} درس)</span>}
                    </button>
                  ))}
                  {(examMode === 'short' ? shortExams : finalExams).length === 0 && (
                    <p style={{ fontSize: 11, color: textSub }}>لا توجد اختبارات من هذا النوع</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 5: تفاصيل إضافية */}
      {((tool && tool !== 'exam' && selLesson) || (tool === 'exam' && selExam)) && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 12, color: textSub, fontWeight: 700, marginBottom: 8 }}>⑤ تفاصيل إضافية (اختياري)</p>
          <textarea value={userInput} onChange={e => setUserInput(e.target.value)}
            placeholder={tool === 'explain' ? 'ركز على الأمثلة التطبيقية...' : tool === 'worksheet' ? '5 أنشطة متنوعة...' : tool === 'game' ? 'لعبة جماعية...' : tool === 'plan' ? 'درس 45 دقيقة...' : '10 أسئلة الدرجة من 20...'}
            rows={2}
            style={{ width: '100%', padding: 12, borderRadius: 12, border: `1.5px solid ${borderCol}`, background: inputBg, color: textMain, fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.9, transition: 'all 0.3s' }} />
        </div>
      )}

      {error && <p style={{ color: '#fc8181', fontSize: 12, textAlign: 'center', marginBottom: 10, padding: 8, borderRadius: 10, background: 'rgba(252,129,129,0.08)' }}>⚠️ {error}</p>}

      {/* زر التوليد */}
      {((tool && tool !== 'exam' && selLesson) || (tool === 'exam' && selExam)) && (
        <button onClick={handleGenerate} disabled={loading} style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: loading ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)') : themeGradient, color: loading ? textSub : '#1a1a2e', fontWeight: 900, fontSize: 15, boxShadow: loading ? 'none' : `0 6px 18px ${themeColor}44`, transition: 'all 0.3s', marginBottom: 20, fontFamily: 'inherit' }}>
          {loading ? '⏳ جارٍ الاستخراج...' : `✨ ${tool === 'exam' ? `إنشاء ${selExam?.name}` : `${toolData?.label} — ${selLesson?.name}`}`}
        </button>
      )}

      {/* النتيجة */}
      {output && (
        <div style={{ borderRadius: 16, border: `1.5px solid ${themeColor}33`, padding: 16, background: cardBg }}>
          {/* أدوات النتيجة: نسخ + طباعة + صوت */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ color: themeColor, fontWeight: 700, fontSize: 13 }}>
              {tool === 'exam' ? '📝' : toolData?.icon} {tool === 'exam' ? selExam?.name : `${toolData?.label} — ${selLesson?.name}`}
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* نسخ */}
              <button onClick={() => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                style={{ padding: '4px 10px', borderRadius: 8, border: `1px solid ${copied ? '#68d391' : themeColor + '44'}`, background: copied ? 'rgba(72,187,120,0.2)' : themeColor + '15', color: copied ? '#68d391' : themeColor, cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>
                {copied ? '✅ تم' : '📋 نسخ'}
              </button>
              {/* طباعة */}
              <PrintButton
                content={output}
                title={tool === 'exam' ? selExam?.name : `${toolData?.label} — ${selLesson?.name}`}
                grade={selSubject?.grade}
                subject={selSubject?.name}
                themeColor={themeColor}
              />
              {/* تصدير Word */}
              <WordExportButton
                content={output}
                title={tool === 'exam' ? selExam?.name : `${toolData?.label} — ${selLesson?.name}`}
                grade={selSubject?.grade}
                subject={selSubject?.name}
                tool={tool || ''}
                themeColor={themeColor}
              />
              {/* تصدير PowerPoint — للشرح والتحضير فقط */}
              {(tool === 'explain' || tool === 'plan' || tool === 'pptx') && (
                <PptxButton
                  content={output}
                  title={`${toolData?.label} — ${selLesson?.name}`}
                  grade={selSubject?.grade}
                  subject={selSubject?.name}
                  themeColor={themeColor}
                />
              )}
            </div>
          </div>

          {/* المحتوى */}
          <div style={{ fontSize: 13, color: textMain, whiteSpace: 'pre-wrap', maxHeight: 500, overflowY: 'auto', lineHeight: 2.1 }}>
            {output}
          </div>

          {/* القراءة الصوتية */}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${borderCol}` }}>
            <SpeechButton text={output} themeColor={themeColor} />
          </div>

          {/* أزرار التقييم */}
          {generationId && user && (
            <div style={{ paddingTop: 12, borderTop: `1px solid ${borderCol}` }}>
              <FeedbackButtons
                generationId={generationId}
                userId={user.id}
                themeColor={themeColor}
              />
            </div>
          )}
        </div>
      )}

      <p style={{ textAlign: 'center', color: isDark ? '#2d3748' : '#a0aec0', fontSize: 10, marginTop: 20 }}>
        منصة مساعد اللغة العربية • ابتدائي · متوسط · ثانوي
      </p>
    </div>
  )
}