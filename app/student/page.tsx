'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ar } from '@/lib/constants/ar'
import MarkdownRenderer   from '@/components/MarkdownRenderer'
import QuizPlayer         from '@/components/QuizPlayer'
import FlashcardPlayer    from '@/components/FlashcardPlayer'
import NotificationBell   from '@/components/NotificationBell'

const c = ar.common

// ── ألوان مِداد الثابتة ────────────────────────────────────────
const T = {
  bg:        '#F5F0E8',
  cardBg:    '#FDFAF5',
  card2:     'rgba(192,57,43,0.04)',
  textCol:   '#1A1221',
  subCol:    '#6B5050',
  borderCol: 'rgba(192,57,43,0.15)',
  inputBg:   'rgba(192,57,43,0.05)',
  headerBg:  'rgba(245,240,232,0.97)',
  shadow:    '0 2px 12px rgba(192,57,43,0.08)',
  gradMain:  'linear-gradient(135deg,#C0392B,#E07020)',
  gradBlue:  'linear-gradient(135deg,#2563EB,#1D4ED8)',
  blueGlow:  '0 6px 24px rgba(37,99,235,0.4)',
}

interface User       { id: string; name: string; role: string; user_type: string; theme_color?: string; allowed_grades?: string[]; allowed_stages?: string[] }
interface Subject    { id: string; name: string; icon?: string; grade?: string; stage?: string }
interface Unit       { id: string; name: string; icon?: string }
interface Lesson     { id: string; name: string; content?: string }
interface Assignment { id: string; title: string; content: string; tool: string; deadline?: string; max_grade: number; subject_id: string; submitted?: boolean; grade?: number | null }
interface Message    { id: string; from_id: string; to_id: string; content: string; image_url?: string; is_read: boolean; created_at: string }
interface Media      { id: string; title: string; type: 'video' | 'audio'; url: string; embed_url?: string; link_type: string; thumbnail?: string }
interface QuizQuestion { id: number; type: 'multiple'|'truefalse'|'fill'; question: string; options?: string[]; correct: string|number|boolean; explanation: string }
interface QuizData        { title: string; questions: QuizQuestion[] }
interface FlashcardsData  { title: string; lessonType: string; cards: { id: number; category: string; front: string; back: string; example?: string|null }[] }

function getSubjectImage(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('عرب') || n.includes('لغة'))  return 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&q=80&auto=format&fit=crop'
  if (n.includes('قرآن') || n.includes('إسلام')) return 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=400&q=80&auto=format&fit=crop'
  if (n.includes('رياض') || n.includes('حساب')) return 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&q=80&auto=format&fit=crop'
  if (n.includes('علم') || n.includes('فيزياء')) return 'https://images.unsplash.com/photo-1532094349884-543559059c4a?w=400&q=80&auto=format&fit=crop'
  return 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80&auto=format&fit=crop'
}

const PRACTICE_TOOLS = [
  { id:'explain',    icon:'💡', label:'شرح الدرس',      desc:'شرح مبسط مع أمثلة' },
  { id:'worksheet',  icon:'📋', label:'ورقة عمل',        desc:'أنشطة تفاعلية' },
  { id:'quiz',       icon:'🎯', label:'اختبار تفاعلي',   desc:'أسئلة وتصحيح فوري' },
  { id:'flashcards', icon:'🃏', label:'بطاقات الحفظ',    desc:'راجع بالبطاقات الذكية' },
] as const

const ACCENT_COLORS = ['#C0392B','#E07020','#F4A420','#2563EB','#059669','#7C3AED']

type Tab = 'home'|'assignments'|'lessons'|'practice'|'messages'|'media'

export default function StudentPage() {
  const router = useRouter()
  const [user,          setUser]          = useState<User|null>(null)
  const [accentColor,   setAccentColor]   = useState('#C0392B')
  const [showSettings,  setShowSettings]  = useState(false)
  const [savingSet,     setSavingSet]     = useState(false)
  const [tab,           setTab]           = useState<Tab>('home')

  const [subjects,   setSubjects]   = useState<Subject[]>([])
  const [selSubject, setSelSubject] = useState<Subject|null>(null)
  const [units,      setUnits]      = useState<Unit[]>([])
  const [selUnit,    setSelUnit]    = useState<Unit|null>(null)
  const [lessons,    setLessons]    = useState<Lesson[]>([])
  const [selLesson,  setSelLesson]  = useState<Lesson|null>(null)

  const [practiceTool,    setPracticeTool]    = useState('')
  const [practiceOutput,  setPracticeOutput]  = useState('')
  const [practiceLoading, setPracticeLoading] = useState(false)
  const [practiceError,   setPracticeError]   = useState('')

  const [quizData,    setQuizData]    = useState<QuizData|null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizError,   setQuizError]   = useState('')
  const [showQuiz,    setShowQuiz]    = useState(false)

  const [flashData,    setFlashData]    = useState<FlashcardsData|null>(null)
  const [flashLoading, setFlashLoading] = useState(false)
  const [flashError,   setFlashError]   = useState('')
  const [showFlash,    setShowFlash]    = useState(false)

  const [assignments,  setAssignments]  = useState<Assignment[]>([])
  const [openAssign,   setOpenAssign]   = useState<Assignment|null>(null)
  const [answerText,   setAnswerText]   = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [submitDone,   setSubmitDone]   = useState(false)

  const [messages,     setMessages]     = useState<Message[]>([])
  const [newMsg,       setNewMsg]       = useState('')
  const [sendingMsg,   setSendingMsg]   = useState(false)
  const [unreadCount,  setUnreadCount]  = useState(0)
  const [teacherId,    setTeacherId]    = useState<string|null>(null)

  const [media,        setMedia]        = useState<Media[]>([])
  const [openMedia,    setOpenMedia]    = useState<Media|null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('mosaed_user')
    if (!saved) { router.replace('/'); return }
    try {
      const u = JSON.parse(saved) as User
      if (u.role === 'admin')        { router.replace('/admin');     return }
      if (u.user_type !== 'student') { router.replace('/dashboard'); return }
      setUser(u)
      if (u.theme_color) setAccentColor(u.theme_color)
    } catch { router.replace('/') }
  }, [router])

  useEffect(() => { if (!user) return; fetch('/api/subjects').then(r=>r.json()).then(d=>setSubjects(d.subjects??[])) }, [user])
  useEffect(() => { if (!selSubject) { setUnits([]); setSelUnit(null); return }; fetch(`/api/units?subjectId=${selSubject.id}`).then(r=>r.json()).then(d=>setUnits(d.units??[])) }, [selSubject])
  useEffect(() => { if (!selUnit) { setLessons([]); setSelLesson(null); return }; fetch(`/api/lessons?unitId=${selUnit.id}`).then(r=>r.json()).then(d=>setLessons(d.lessons??[])) }, [selUnit])
  useEffect(() => { if (!user||tab!=='assignments') return; fetch(`/api/assignments?studentId=${user.id}`).then(r=>r.json()).then(d=>setAssignments(d.assignments??[])) }, [user,tab])
  useEffect(() => { if (!user||tab!=='messages') return; fetch(`/api/messages?userId=${user.id}`).then(r=>r.json()).then(d=>{ setMessages(d.messages??[]); setTeacherId(d.teacherId??null); setUnreadCount(d.unread??0) }) }, [user,tab])
  useEffect(() => { if (!user||tab!=='media') return; fetch(`/api/teacher-media?studentId=${user.id}`).then(r=>r.json()).then(d=>setMedia(d.media??[])) }, [user,tab])
  useEffect(() => {
    if (!user) return
    const fn = () => fetch(`/api/messages?userId=${user.id}&unreadOnly=true`).then(r=>r.json()).then(d=>setUnreadCount(d.unread??0)).catch(()=>{})
    fn(); const iv = setInterval(fn,30000); return () => clearInterval(iv)
  }, [user])

  async function saveSettings() {
    if (!user) return; setSavingSet(true)
    try {
      await fetch('/api/settings',{ method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({ userId:user.id, theme_color:accentColor, theme_mode:'light' }) })
      const updated = { ...user, theme_color:accentColor }
      setUser(updated); localStorage.setItem('mosaed_user',JSON.stringify(updated))
    } finally { setSavingSet(false); setShowSettings(false) }
  }

  async function handlePractice() {
    if (!user||!selLesson||!practiceTool) return
    setPracticeLoading(true); setPracticeOutput(''); setPracticeError('')
    try {
      const res = await fetch('/api/generate',{ method:'POST',headers:{'Content-Type':'application/json'}, body:JSON.stringify({ userId:user.id, tool:practiceTool, grade:selSubject?.grade??user.allowed_grades?.[0]??'', stage:selSubject?.stage??user.allowed_stages?.[0]??'', prompt:selLesson.name, material:selLesson.content??'' }) })
      const data = await res.json()
      if (!res.ok) { setPracticeError(data.error||c.errors.generic); return }
      setPracticeOutput(data.result)
    } catch { setPracticeError(c.errors.connection) } finally { setPracticeLoading(false) }
  }

  async function generateQuiz() {
    if (!user||!selLesson) return; setQuizLoading(true); setQuizError(''); setQuizData(null)
    try {
      const res = await fetch('/api/quiz',{ method:'POST',headers:{'Content-Type':'application/json'}, body:JSON.stringify({ lessonName:selLesson.name, material:selLesson.content??'', grade:selSubject?.grade??user.allowed_grades?.[0]??'', count:8 }) })
      const data = await res.json()
      if (!res.ok) { setQuizError(data.error||'حدث خطأ'); return }
      setQuizData(data.quiz); setShowQuiz(true)
    } catch { setQuizError('تعذّر الاتصال') } finally { setQuizLoading(false) }
  }

  async function generateFlashcards() {
    if (!user||!selLesson) return
    if (!selLesson.content?.trim()) { setFlashError('هذا الدرس لا يحتوي على مادة علمية'); return }
    setFlashLoading(true); setFlashError(''); setFlashData(null)
    try {
      const res = await fetch('/api/flashcards',{ method:'POST',headers:{'Content-Type':'application/json'}, body:JSON.stringify({ lessonName:selLesson.name, material:selLesson.content, grade:selSubject?.grade??user.allowed_grades?.[0]??'' }) })
      const data = await res.json()
      if (!res.ok) { setFlashError(data.error||'حدث خطأ'); return }
      setFlashData(data.flashcards); setShowFlash(true)
    } catch { setFlashError('تعذّر الاتصال') } finally { setFlashLoading(false) }
  }

  function handleGenerate() {
    if (practiceTool==='quiz') generateQuiz()
    else if (practiceTool==='flashcards') generateFlashcards()
    else handlePractice()
  }

  async function handleSubmit() {
    if (!user||!openAssign||!answerText.trim()) return; setSubmitting(true)
    try {
      const res = await fetch('/api/submissions',{ method:'POST',headers:{'Content-Type':'application/json'}, body:JSON.stringify({ assignmentId:openAssign.id, studentId:user.id, answerText }) })
      if (res.ok) { setSubmitDone(true); setAnswerText('') }
    } finally { setSubmitting(false) }
  }

  async function handleSendMessage() {
    if (!user||!teacherId||!newMsg.trim()) return; setSendingMsg(true)
    try {
      const res = await fetch('/api/messages',{ method:'POST',headers:{'Content-Type':'application/json'}, body:JSON.stringify({ fromId:user.id, toId:teacherId, content:newMsg }) })
      const data = await res.json()
      if (res.ok) { setMessages(prev=>[...prev,data.message]); setNewMsg('') }
    } finally { setSendingMsg(false) }
  }

  function handleLogout() { localStorage.removeItem('mosaed_user'); localStorage.removeItem('mosaed_session'); router.replace('/') }
  if (!user) return null

  const pendingCount  = assignments.filter(a=>!a.submitted).length
  const isGenerating  = practiceLoading||quizLoading||flashLoading
  const anyError      = practiceError||quizError||flashError

  const inputStyle: React.CSSProperties = { width:'100%', padding:'12px 14px', borderRadius:10, border:`1.5px solid ${T.borderCol}`, background:T.inputBg, color:T.textCol, fontSize:15, fontFamily:'inherit', colorScheme:'light' }

  const TABS = [
    { id:'home'        as Tab, icon:'🏠', label:'الرئيسية' },
    { id:'assignments' as Tab, icon:'📝', label:'مهامي',  badge:pendingCount },
    { id:'lessons'     as Tab, icon:'📚', label:'دروسي' },
    { id:'practice'    as Tab, icon:'✨', label:'تدرّب' },
    { id:'messages'    as Tab, icon:'💬', label:'رسائل',  badge:unreadCount },
    { id:'media'       as Tab, icon:'🎥', label:'وسائط' },
  ] as const

  return (
    <div dir="rtl" style={{ minHeight:'100vh', background:T.bg, color:T.textCol, fontFamily:"'Segoe UI',Tahoma,Arial,sans-serif", paddingBottom:90 }}>
      <style>{`
        *{box-sizing:border-box;} body{margin:0;}
        @keyframes spin   {from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes fadeIn {from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
        .fade-in{animation:fadeIn 0.3s ease;}
        textarea:focus,input:focus,select:focus{outline:none;}
        select option{background:#F5F0E8!important;color:#1A1221!important;}
        select{color-scheme:light;}
      `}</style>

      {/* الرأس */}
      <header style={{ position:'sticky',top:0,zIndex:50,background:T.headerBg,backdropFilter:'blur(20px)',borderBottom:`1px solid ${T.borderCol}`,padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:T.shadow }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <div style={{ width:36,height:36,borderRadius:10,background:T.gradMain,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:900,color:'#fff' }}>م</div>
          <div>
            <div style={{ fontSize:15,fontWeight:900,color:T.textCol }}>مِداد</div>
            <div style={{ fontSize:12,color:T.subCol,marginTop:1 }}>👨‍🎓 {user.name}</div>
          </div>
        </div>
        <div style={{ display:'flex',gap:8,alignItems:'center' }}>
          {user && <NotificationBell userId={user.id} themeColor={accentColor} textCol={T.textCol} subCol={T.subCol} cardBg={T.cardBg} borderCol={T.borderCol} inputBg={T.inputBg} isDark={false} />}
          <button onClick={()=>setShowSettings(true)} style={{ padding:'7px 13px',borderRadius:9,fontSize:13,fontWeight:700,border:`1.5px solid ${T.borderCol}`,background:'transparent',color:T.subCol,cursor:'pointer',fontFamily:'inherit' }}>⚙️</button>
          <button onClick={handleLogout} style={{ padding:'7px 13px',borderRadius:9,fontSize:13,fontWeight:700,border:'1.5px solid rgba(192,57,43,0.3)',background:'rgba(192,57,43,0.06)',color:'#C0392B',cursor:'pointer',fontFamily:'inherit' }}>🚪 خروج</button>
        </div>
      </header>

      <main style={{ maxWidth:760,margin:'0 auto',padding:'20px 16px' }}>

        {/* الرئيسية */}
        {tab==='home' && (
          <div className="fade-in">
            <div style={{ borderRadius:20,padding:'28px 24px',marginBottom:20,background:`${accentColor}10`,border:`1.5px solid ${accentColor}25`,boxShadow:T.shadow }}>
              <div style={{ fontSize:38,marginBottom:10 }}>👋</div>
              <h1 style={{ fontSize:24,fontWeight:900,color:accentColor,margin:'0 0 8px' }}>أهلاً {user.name}!</h1>
              <p style={{ fontSize:15,color:T.subCol,margin:0 }}>{user.allowed_grades?.length ? `الصف ${user.allowed_grades.join(' • ')}` : ''} • منصة مِداد</p>
            </div>

            {subjects.length>0 && (
              <div style={{ marginBottom:20 }}>
                <h3 style={{ fontSize:15,fontWeight:800,color:T.textCol,marginBottom:12 }}>📚 موادي ({subjects.length})</h3>
                <div style={{ display:'flex',gap:10,overflowX:'auto',paddingBottom:8 }}>
                  {subjects.map(s=>(
                    <button key={s.id} onClick={()=>{ setSelSubject(s);setSelUnit(null);setSelLesson(null);setTab('lessons') }}
                      style={{ flexShrink:0,width:155,borderRadius:14,border:`1.5px solid ${T.borderCol}`,background:T.cardBg,cursor:'pointer',textAlign:'right',fontFamily:'inherit',overflow:'hidden',padding:0,boxShadow:T.shadow }}>
                      <div style={{ height:85,overflow:'hidden',position:'relative' }}>
                        <img src={getSubjectImage(s.name)} alt={s.name} style={{ width:'100%',height:'100%',objectFit:'cover',filter:'brightness(0.75) saturate(0.8)' }} />
                        <div style={{ position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 40%,rgba(245,240,232,0.9))' }} />
                        <div style={{ position:'absolute',bottom:6,right:8,fontSize:18 }}>{s.icon??'📚'}</div>
                      </div>
                      <div style={{ padding:'8px 10px' }}>
                        <div style={{ fontSize:13,fontWeight:800,color:T.textCol }}>{s.name}</div>
                        {s.grade && <div style={{ fontSize:11,color:accentColor,marginTop:2,fontWeight:700 }}>الصف {s.grade}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:18 }}>
              {[
                { tab:'assignments' as Tab,icon:'📝',label:'مهامي',       color:'#C0392B',badge:pendingCount, sub:pendingCount>0?`${pendingCount} مهمة`:'لا توجد مهام' },
                { tab:'practice'    as Tab,icon:'✨',label:'تدرّب وراجع', color:'#E07020',badge:0,            sub:'اختبار • بطاقات • شرح' },
                { tab:'messages'    as Tab,icon:'💬',label:'رسائل',       color:'#7C3AED',badge:unreadCount,  sub:unreadCount>0?`${unreadCount} غير مقروء`:'تواصل مع معلمك' },
                { tab:'media'       as Tab,icon:'🎥',label:'وسائط',       color:'#2563EB',badge:0,            sub:'فيديو وصوت' },
              ].map(card=>(
                <button key={card.tab} onClick={()=>setTab(card.tab)}
                  style={{ padding:'18px 14px',borderRadius:16,border:`1.5px solid ${card.color}20`,background:`${card.color}07`,cursor:'pointer',textAlign:'right',fontFamily:'inherit',position:'relative',boxShadow:T.shadow,transition:'all 0.2s' }}>
                  <div style={{ fontSize:28,marginBottom:8 }}>{card.icon}</div>
                  <div style={{ fontSize:16,fontWeight:900,color:T.textCol,marginBottom:4 }}>{card.label}</div>
                  <div style={{ fontSize:13,color:card.badge>0?card.color:T.subCol,fontWeight:card.badge>0?700:400 }}>{card.sub}</div>
                  {card.badge>0&&<span style={{ position:'absolute',top:10,left:10,background:card.color,color:'#fff',width:20,height:20,borderRadius:'50%',fontSize:10,fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center' }}>{card.badge}</span>}
                </button>
              ))}
            </div>

            {pendingCount>0&&(
              <div style={{ borderRadius:14,padding:'16px 18px',background:T.cardBg,border:`1.5px solid rgba(192,57,43,0.2)`,boxShadow:T.shadow }}>
                <h3 style={{ fontSize:14,fontWeight:800,color:'#C0392B',margin:'0 0 12px' }}>⏰ مهام لم تُجَب</h3>
                {assignments.filter(a=>!a.submitted).slice(0,3).map(a=>(
                  <div key={a.id} onClick={()=>{ setOpenAssign(a);setTab('assignments') }}
                    style={{ padding:'10px 12px',borderRadius:10,marginBottom:8,background:T.inputBg,border:`1px solid ${T.borderCol}`,cursor:'pointer' }}>
                    <div style={{ fontSize:14,fontWeight:700,color:T.textCol }}>{a.title}</div>
                    {a.deadline&&<div style={{ fontSize:12,color:'#C0392B',marginTop:3 }}>⏰ {new Date(a.deadline).toLocaleDateString('ar-KW',{ month:'short',day:'numeric' })}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* المهام */}
        {tab==='assignments'&&(
          <div className="fade-in">
            <h2 style={{ fontSize:20,fontWeight:900,color:accentColor,marginBottom:16 }}>📝 مهامي</h2>
            {assignments.length===0
              ? <Empty icon="📭" title="لا توجد مهام بعد" sub="سيرسل لك معلمك مهام هنا" />
              : <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                  {assignments.map(a=>(
                    <div key={a.id} style={{ borderRadius:14,padding:'16px 18px',background:T.cardBg,border:`1.5px solid ${a.submitted?'rgba(5,150,105,0.2)':T.borderCol}`,boxShadow:T.shadow }}>
                      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10 }}>
                        <div>
                          <div style={{ fontSize:15,fontWeight:800,color:T.textCol }}>{a.title}</div>
                          {a.deadline&&<div style={{ fontSize:12,color:new Date(a.deadline)<new Date()?'#C0392B':'#E07020',marginTop:3 }}>⏰ {new Date(a.deadline).toLocaleDateString('ar-KW',{ month:'short',day:'numeric' })}</div>}
                        </div>
                        <div style={{ textAlign:'left',flexShrink:0 }}>
                          {a.submitted ? (
                            a.grade!=null
                              ? <div><div style={{ fontSize:18,fontWeight:900,color:'#059669' }}>✅ {a.grade}/{a.max_grade}</div><div style={{ fontSize:11,color:'#059669' }}>درجتك</div></div>
                              : <span style={{ fontSize:12,padding:'3px 10px',borderRadius:7,background:'rgba(37,99,235,0.1)',color:'#2563EB',fontWeight:700 }}>⏳ انتظار</span>
                          ) : <span style={{ fontSize:12,padding:'3px 10px',borderRadius:7,background:'rgba(192,57,43,0.1)',color:'#C0392B',fontWeight:700 }}>📝 لم يُجَب</span>}
                        </div>
                      </div>
                      <div style={{ padding:'10px 12px',borderRadius:9,background:T.inputBg,border:`1px solid ${T.borderCol}`,marginBottom:12,fontSize:13,color:T.subCol,lineHeight:1.7 }}>
                        {a.content.slice(0,160)}{a.content.length>160?'...':''}
                      </div>
                      {!a.submitted&&<button onClick={()=>{ setOpenAssign(a);setSubmitDone(false);setAnswerText('') }}
                        style={{ padding:'9px 20px',borderRadius:9,border:'none',background:T.gradBlue,color:'#fff',fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 14px rgba(37,99,235,0.35)' }}>✍️ إجابة المهمة</button>}
                    </div>
                  ))}
                </div>}
          </div>
        )}

        {/* الدروس */}
        {tab==='lessons'&&(
          <div className="fade-in">
            <h2 style={{ fontSize:20,fontWeight:900,color:accentColor,marginBottom:16 }}>📚 دروسي</h2>
            <SCard title="① اختر المادة">
              {subjects.length===0?<p style={{ color:T.subCol,fontSize:14,margin:0 }}>لا توجد مواد</p>
                :<div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>{subjects.map(s=><SChip key={s.id} label={`${s.icon??'📚'} ${s.name}${s.grade?` — ${s.grade}`:''}`} active={selSubject?.id===s.id} color={accentColor} onClick={()=>{ setSelSubject(s);setSelUnit(null);setSelLesson(null) }} />)}</div>}
            </SCard>
            {selSubject&&<SCard title="② اختر الوحدة"><div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>{units.map(u=><SChip key={u.id} label={`${u.icon??'📖'} ${u.name}`} active={selUnit?.id===u.id} color={accentColor} onClick={()=>{ setSelUnit(u);setSelLesson(null) }} />)}</div></SCard>}
            {selUnit&&<SCard title="③ اختر الدرس"><div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>{lessons.map(l=><SChip key={l.id} label={`✏️ ${l.name}`} active={selLesson?.id===l.id} color={accentColor} onClick={()=>setSelLesson(l)} />)}</div></SCard>}
            {selLesson&&selLesson.content&&(
              <div style={{ borderRadius:14,padding:'18px 20px',background:T.cardBg,border:`1.5px solid ${T.borderCol}`,boxShadow:T.shadow }}>
                <h3 style={{ fontSize:16,fontWeight:900,color:accentColor,marginBottom:14 }}>📖 {selLesson.name}</h3>
                <MarkdownRenderer text={selLesson.content} textCol={T.textCol} subCol={T.subCol} fontSize={15} />
                <p style={{ fontSize:12,color:T.subCol,marginTop:14,textAlign:'center',borderTop:`1px solid ${T.borderCol}`,paddingTop:10 }}>🔒 للقراءة فقط</p>
              </div>
            )}
          </div>
        )}

        {/* التدرب */}
        {tab==='practice'&&(
          <div className="fade-in">
            <h2 style={{ fontSize:20,fontWeight:900,color:accentColor,marginBottom:6 }}>✨ التدرب الذاتي</h2>
            <p style={{ fontSize:14,color:T.subCol,marginBottom:18 }}>شرح • ورقة عمل • اختبار تفاعلي • بطاقات حفظ</p>
            <SCard title="① اختر المادة"><div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>{subjects.map(s=><SChip key={s.id} label={`${s.icon??'📚'} ${s.name}${s.grade?` — ${s.grade}`:''}`} active={selSubject?.id===s.id} color={accentColor} onClick={()=>{ setSelSubject(s);setSelUnit(null);setSelLesson(null);setPracticeOutput('') }} />)}</div></SCard>
            {selSubject&&<SCard title="② اختر الوحدة"><div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>{units.map(u=><SChip key={u.id} label={`${u.icon??'📖'} ${u.name}`} active={selUnit?.id===u.id} color={accentColor} onClick={()=>{ setSelUnit(u);setSelLesson(null);setPracticeOutput('') }} />)}</div></SCard>}
            {selUnit&&<SCard title="③ اختر الدرس"><div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>{lessons.map(l=><SChip key={l.id} label={`✏️ ${l.name}`} active={selLesson?.id===l.id} color={accentColor} onClick={()=>{ setSelLesson(l);setPracticeOutput('');setPracticeTool('') }} />)}</div></SCard>}
            {selLesson&&(
              <SCard title="④ ماذا تريد؟">
                <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10 }}>
                  {PRACTICE_TOOLS.map(tool_=>{
                    const isActive = practiceTool===tool_.id
                    const specialC = tool_.id==='quiz'?'#C0392B':tool_.id==='flashcards'?'#E07020':accentColor
                    return (
                      <button key={tool_.id} onClick={()=>{ setPracticeTool(tool_.id);setPracticeOutput('') }}
                        style={{ padding:'14px 12px',borderRadius:12,textAlign:'right',border:`2px solid ${isActive?specialC:T.borderCol}`,background:isActive?`${specialC}10`:T.cardBg,color:isActive?specialC:T.textCol,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',boxShadow:isActive?`0 4px 12px ${specialC}25`:T.shadow }}>
                        <div style={{ fontSize:24,marginBottom:6 }}>{tool_.icon}</div>
                        <div style={{ fontSize:14,fontWeight:800,marginBottom:3 }}>{tool_.label}</div>
                        <div style={{ fontSize:12,color:isActive?`${specialC}cc`:T.subCol,lineHeight:1.4 }}>{tool_.desc}</div>
                      </button>
                    )
                  })}
                </div>
              </SCard>
            )}
            {selLesson&&practiceTool&&(
              <div style={{ textAlign:'center',marginBottom:18 }}>
                <button onClick={handleGenerate} disabled={isGenerating}
                  style={{ padding:'13px 38px',borderRadius:12,border:'none',background:isGenerating?'rgba(192,57,43,0.1)':T.gradBlue,color:isGenerating?accentColor:'#fff',fontSize:15,fontWeight:900,cursor:isGenerating?'not-allowed':'pointer',fontFamily:'inherit',minWidth:220,display:'flex',alignItems:'center',justifyContent:'center',gap:8,margin:'0 auto',boxShadow:isGenerating?'none':'0 6px 20px rgba(37,99,235,0.35)' }}>
                  {isGenerating?<><span style={{ width:17,height:17,border:`2.5px solid rgba(37,99,235,0.25)`,borderTopColor:'#2563EB',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite' }} />جارٍ التوليد...</>
                    :practiceTool==='quiz'?'🎯 ابدأ الاختبار':practiceTool==='flashcards'?'🃏 استخرج البطاقات':`✨ توليد ${PRACTICE_TOOLS.find(x=>x.id===practiceTool)?.label??''}`}
                </button>
              </div>
            )}
            {anyError&&<div style={{ padding:'11px 14px',borderRadius:10,background:'rgba(192,57,43,0.08)',border:'1px solid rgba(192,57,43,0.25)',color:'#C0392B',fontSize:14,marginBottom:14 }}>⚠️ {anyError}</div>}
            {practiceOutput&&(practiceTool==='explain'||practiceTool==='worksheet')&&(
              <div style={{ borderRadius:14,padding:'18px 20px',background:T.cardBg,border:`1.5px solid ${T.borderCol}`,boxShadow:T.shadow }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:8 }}>
                  <h3 style={{ fontSize:15,fontWeight:900,color:accentColor,margin:0 }}>{PRACTICE_TOOLS.find(x=>x.id===practiceTool)?.icon} النتيجة</h3>
                  <div style={{ display:'flex',gap:8 }}>
                    <button onClick={()=>navigator.clipboard.writeText(practiceOutput)} style={{ padding:'5px 11px',borderRadius:7,border:`1px solid ${T.borderCol}`,background:'transparent',color:T.subCol,cursor:'pointer',fontSize:13,fontFamily:'inherit' }}>📋 نسخ</button>
                    <button onClick={()=>window.print()} style={{ padding:'5px 11px',borderRadius:7,border:`1px solid ${accentColor}30`,background:`${accentColor}10`,color:accentColor,cursor:'pointer',fontSize:13,fontFamily:'inherit' }}>🖨️ طباعة</button>
                  </div>
                </div>
                <MarkdownRenderer text={practiceOutput} textCol={T.textCol} subCol={T.subCol} fontSize={15} />
              </div>
            )}
          </div>
        )}

        {/* الرسائل */}
        {tab==='messages'&&(
          <div className="fade-in">
            <h2 style={{ fontSize:20,fontWeight:900,color:accentColor,marginBottom:16 }}>💬 رسائلي</h2>
            {!teacherId ? <Empty icon="💬" title="لا يوجد معلم مرتبط" sub="تواصل مع المدير لإضافة معلمك" />
              : <div style={{ borderRadius:14,background:T.cardBg,border:`1.5px solid ${T.borderCol}`,overflow:'hidden',boxShadow:T.shadow }}>
                  <div style={{ padding:14,maxHeight:440,overflowY:'auto',display:'flex',flexDirection:'column',gap:10 }}>
                    {messages.length===0?<p style={{ color:T.subCol,fontSize:14,textAlign:'center',padding:'20px 0' }}>لا توجد رسائل</p>
                      :messages.map(msg=>{
                        const isMe=msg.from_id===user.id
                        return <div key={msg.id} style={{ display:'flex',justifyContent:isMe?'flex-start':'flex-end' }}>
                          <div style={{ maxWidth:'75%',padding:'9px 13px',borderRadius:isMe?'14px 14px 14px 4px':'14px 14px 4px 14px',background:isMe?`${accentColor}12`:'rgba(192,57,43,0.06)',border:`1px solid ${isMe?accentColor+'25':T.borderCol}` }}>
                            {msg.image_url&&<img src={msg.image_url} alt="صورة" style={{ maxWidth:'100%',borderRadius:6,marginBottom:5 }} />}
                            <p style={{ fontSize:14,color:T.textCol,margin:0,lineHeight:1.6 }}>{msg.content}</p>
                            <p style={{ fontSize:10,color:T.subCol,margin:'3px 0 0',textAlign:isMe?'right':'left' }}>{new Date(msg.created_at).toLocaleTimeString('ar-KW',{ hour:'2-digit',minute:'2-digit' })}</p>
                          </div>
                        </div>
                      })}
                  </div>
                  <div style={{ padding:'10px 14px',borderTop:`1px solid ${T.borderCol}`,display:'flex',gap:8 }}>
                    <input value={newMsg} onChange={e=>setNewMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSendMessage()} placeholder="اكتب رسالة لمعلمك..."
                      style={{ flex:1,padding:'10px 13px',borderRadius:10,border:`1.5px solid ${T.borderCol}`,background:T.inputBg,color:T.textCol,fontSize:14,fontFamily:'inherit' }} />
                    <button onClick={handleSendMessage} disabled={sendingMsg||!newMsg.trim()} style={{ padding:'10px 16px',borderRadius:10,border:'none',background:newMsg.trim()?T.gradBlue:T.borderCol,color:newMsg.trim()?'#fff':T.subCol,fontSize:16,fontWeight:800,cursor:newMsg.trim()?'pointer':'not-allowed',fontFamily:'inherit',boxShadow:newMsg.trim()?'0 4px 12px rgba(37,99,235,0.3)':'none' }}>
                      {sendingMsg?'⏳':'←'}
                    </button>
                  </div>
                </div>}
          </div>
        )}

        {/* الوسائط */}
        {tab==='media'&&(
          <div className="fade-in">
            <h2 style={{ fontSize:20,fontWeight:900,color:accentColor,marginBottom:16 }}>🎥 وسائط المعلم</h2>
            {media.length===0?<Empty icon="🎬" title="لا توجد وسائط" sub="سيضيف معلمك فيديوهات هنا" />
              :<div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12 }}>
                {media.map(m=>(
                  <button key={m.id} onClick={()=>setOpenMedia(m)} style={{ borderRadius:12,overflow:'hidden',border:`1.5px solid ${T.borderCol}`,background:T.cardBg,cursor:'pointer',textAlign:'right',fontFamily:'inherit',padding:0,boxShadow:T.shadow }}>
                    <div style={{ height:90,background:`${accentColor}10`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:32 }}>
                      {m.thumbnail?<img src={m.thumbnail} alt={m.title} style={{ width:'100%',height:'100%',objectFit:'cover' }} />:m.type==='video'?'🎬':'🎵'}
                    </div>
                    <div style={{ padding:'10px 12px' }}>
                      <div style={{ fontSize:13,fontWeight:700,color:T.textCol,marginBottom:3 }}>{m.title}</div>
                      <div style={{ fontSize:11,color:T.subCol }}>{m.type==='video'?'🎬 فيديو':'🎵 صوت'}</div>
                    </div>
                  </button>
                ))}
              </div>}
          </div>
        )}
      </main>

      {/* شريط التنقل */}
      <nav style={{ position:'fixed',bottom:0,left:0,right:0,zIndex:50,background:T.headerBg,backdropFilter:'blur(20px)',borderTop:`1px solid ${T.borderCol}`,display:'flex',justifyContent:'space-around',padding:'8px 0 14px',boxShadow:'0 -2px 12px rgba(192,57,43,0.08)' }}>
        {TABS.map(tb=>(
          <button key={tb.id} onClick={()=>setTab(tb.id)}
            style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:3,background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',padding:'4px 8px',borderRadius:10,color:tab===tb.id?accentColor:T.subCol,position:'relative',transition:'all 0.2s' }}>
            <span style={{ fontSize:20 }}>{tb.icon}</span>
            <span style={{ fontSize:11,fontWeight:tab===tb.id?800:600 }}>{tb.label}</span>
            {'badge' in tb&&(tb as {badge:number}).badge>0&&<span style={{ position:'absolute',top:0,right:2,background:'#C0392B',color:'#fff',width:16,height:16,borderRadius:'50%',fontSize:9,fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center' }}>{(tb as {badge:number}).badge}</span>}
          </button>
        ))}
      </nav>

      {/* نافذة الاختبار */}
      {showQuiz&&quizData&&(
        <div style={{ position:'fixed',inset:0,zIndex:100,background:'rgba(26,18,33,0.7)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
          <div style={{ width:'100%',maxWidth:680,maxHeight:'92vh',borderRadius:20,background:T.cardBg,border:`1.5px solid ${accentColor}30`,display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 24px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ padding:'14px 18px',borderBottom:`1px solid ${T.borderCol}`,display:'flex',justifyContent:'space-between',alignItems:'center',background:`${accentColor}08` }}>
              <div><h3 style={{ fontSize:15,fontWeight:900,color:accentColor,margin:0 }}>🎯 {quizData.title}</h3><p style={{ fontSize:12,color:T.subCol,margin:'3px 0 0' }}>{quizData.questions.length} أسئلة</p></div>
              <button onClick={()=>setShowQuiz(false)} style={{ background:'none',border:'none',color:T.subCol,fontSize:22,cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ overflowY:'auto',flex:1,padding:18 }}>
              <QuizPlayer quiz={quizData} themeColor={accentColor} textCol={T.textCol} subCol={T.subCol} cardBg={T.cardBg} borderCol={T.borderCol} inputBg={T.inputBg} isDark={false} onClose={()=>setShowQuiz(false)} />
            </div>
          </div>
        </div>
      )}

      {/* نافذة البطاقات */}
      {showFlash&&flashData&&(
        <div style={{ position:'fixed',inset:0,zIndex:100,background:'rgba(26,18,33,0.7)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
          <div style={{ width:'100%',maxWidth:640,maxHeight:'92vh',borderRadius:20,background:T.cardBg,border:`1.5px solid ${T.borderCol}`,display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 24px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ padding:'14px 18px',borderBottom:`1px solid ${T.borderCol}`,display:'flex',justifyContent:'space-between',alignItems:'center',background:`${accentColor}06` }}>
              <div><h3 style={{ fontSize:15,fontWeight:900,color:accentColor,margin:0 }}>🃏 {flashData.title}</h3><p style={{ fontSize:12,color:T.subCol,margin:'3px 0 0' }}>{flashData.cards.length} بطاقة • {flashData.lessonType}</p></div>
              <button onClick={()=>setShowFlash(false)} style={{ background:'none',border:'none',color:T.subCol,fontSize:22,cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ overflowY:'auto',flex:1,padding:18 }}>
              <FlashcardPlayer data={flashData} themeColor={accentColor} textCol={T.textCol} subCol={T.subCol} cardBg={T.cardBg} borderCol={T.borderCol} isDark={false} onClose={()=>setShowFlash(false)} />
            </div>
          </div>
        </div>
      )}

      {/* نافذة الإعدادات — لون اللهجة فقط */}
      {showSettings&&(
        <div style={{ position:'fixed',inset:0,zIndex:100,background:'rgba(26,18,33,0.5)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center' }} onClick={e=>{ if(e.target===e.currentTarget)setShowSettings(false) }}>
          <div style={{ width:'90%',maxWidth:340,borderRadius:22,padding:26,background:T.cardBg,border:`1px solid ${T.borderCol}`,boxShadow:'0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22 }}>
              <h2 style={{ fontSize:17,fontWeight:900,color:T.textCol,margin:0 }}>⚙️ إعداداتي</h2>
              <button onClick={()=>setShowSettings(false)} style={{ background:'none',border:'none',color:T.subCol,fontSize:22,cursor:'pointer' }}>✕</button>
            </div>
            <p style={{ fontSize:14,fontWeight:700,color:T.textCol,marginBottom:12 }}>🎨 لون التمييز</p>
            <div style={{ display:'flex',gap:10,flexWrap:'wrap',marginBottom:24 }}>
              {ACCENT_COLORS.map(col=>(
                <button key={col} onClick={()=>setAccentColor(col)}
                  style={{ width:42,height:42,borderRadius:'50%',background:col,border:'none',cursor:'pointer',boxShadow:accentColor===col?`0 0 0 3px ${T.bg},0 0 0 5px ${col}`:'none',transition:'all 0.2s' }} />
              ))}
            </div>
            <button onClick={saveSettings} disabled={savingSet}
              style={{ width:'100%',padding:'13px',borderRadius:11,border:'none',background:T.gradBlue,color:'#fff',fontWeight:900,fontSize:15,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 5px 18px rgba(37,99,235,0.35)',opacity:savingSet?0.7:1 }}>
              {savingSet?'⏳ جارٍ الحفظ...':'💾 حفظ الإعدادات'}
            </button>
          </div>
        </div>
      )}

      {/* نافذة المهمة */}
      {openAssign&&(
        <div style={{ position:'fixed',inset:0,zIndex:100,background:'rgba(26,18,33,0.6)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }} onClick={e=>{ if(e.target===e.currentTarget)setOpenAssign(null) }}>
          <div style={{ width:'100%',maxWidth:680,maxHeight:'90vh',borderRadius:18,background:T.cardBg,border:`1px solid ${T.borderCol}`,display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ padding:'14px 18px',borderBottom:`1px solid ${T.borderCol}`,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <h3 style={{ fontSize:15,fontWeight:900,color:accentColor,margin:0 }}>{openAssign.title}</h3>
              <button onClick={()=>setOpenAssign(null)} style={{ background:'none',border:'none',color:T.subCol,fontSize:22,cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ overflowY:'auto',flex:1,padding:18 }}>
              {submitDone?(
                <div style={{ textAlign:'center',padding:'36px 0' }}>
                  <div style={{ fontSize:60,marginBottom:14 }}>✅</div>
                  <h3 style={{ fontSize:20,fontWeight:900,color:'#059669',marginBottom:8 }}>تم إرسال إجابتك!</h3>
                  <p style={{ color:T.subCol,fontSize:14 }}>سيراجع معلمك إجابتك قريباً</p>
                  <button onClick={()=>setOpenAssign(null)} style={{ marginTop:18,padding:'10px 22px',borderRadius:10,border:'none',background:T.gradBlue,color:'#fff',fontWeight:800,fontSize:14,cursor:'pointer',fontFamily:'inherit' }}>إغلاق</button>
                </div>
              ):(
                <>
                  <div style={{ padding:'12px 14px',borderRadius:10,background:T.inputBg,border:`1px solid ${T.borderCol}`,marginBottom:14 }}>
                    <div style={{ fontSize:12,color:accentColor,fontWeight:700,marginBottom:6 }}>📋 المهمة:</div>
                    <MarkdownRenderer text={openAssign.content} textCol={T.textCol} subCol={T.subCol} fontSize={14} />
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ fontSize:13,fontWeight:700,color:T.textCol,display:'block',marginBottom:6 }}>✍️ إجابتك:</label>
                    <textarea value={answerText} onChange={e=>setAnswerText(e.target.value)} placeholder="اكتب إجابتك هنا..." rows={8} style={{ ...inputStyle,resize:'vertical',lineHeight:1.7 }} />
                    <div style={{ fontSize:11,color:T.subCol,marginTop:3,textAlign:'left' }}>{answerText.length} حرف</div>
                  </div>
                  <button onClick={handleSubmit} disabled={submitting||!answerText.trim()}
                    style={{ width:'100%',padding:'13px',borderRadius:12,border:'none',background:answerText.trim()?T.gradBlue:T.borderCol,color:answerText.trim()?'#fff':T.subCol,fontWeight:900,fontSize:15,cursor:answerText.trim()?'pointer':'not-allowed',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:answerText.trim()?'0 5px 18px rgba(37,99,235,0.35)':'none' }}>
                    {submitting?<><span style={{ width:17,height:17,border:'2.5px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite' }} />جارٍ الإرسال...</>:'📤 إرسال الإجابة'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* نافذة الوسائط */}
      {openMedia&&(
        <div style={{ position:'fixed',inset:0,zIndex:100,background:'rgba(26,18,33,0.7)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }} onClick={e=>{ if(e.target===e.currentTarget)setOpenMedia(null) }}>
          <div style={{ width:'100%',maxWidth:720,borderRadius:18,background:T.cardBg,border:`1px solid ${T.borderCol}`,overflow:'hidden',boxShadow:'0 20px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ padding:'13px 18px',borderBottom:`1px solid ${T.borderCol}`,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <h3 style={{ fontSize:14,fontWeight:900,color:accentColor,margin:0 }}>{openMedia.title}</h3>
              <button onClick={()=>setOpenMedia(null)} style={{ background:'none',border:'none',color:T.subCol,fontSize:22,cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ padding:16 }}>
              {openMedia.type==='video'
                ?openMedia.embed_url&&(openMedia.embed_url.includes('youtube')||openMedia.embed_url.includes('vimeo'))
                  ?<iframe src={openMedia.embed_url} style={{ width:'100%',height:400,border:'none',borderRadius:10 }} allowFullScreen title={openMedia.title} />
                  :<video controls style={{ width:'100%',borderRadius:10,maxHeight:400 }} src={openMedia.url} />
                :<audio controls style={{ width:'100%' }} src={openMedia.url} />}
              {openMedia.link_type==='link'&&<a href={openMedia.url} target="_blank" rel="noopener noreferrer" style={{ display:'block',marginTop:10,fontSize:13,color:'#2563EB',textAlign:'center',textDecoration:'none' }}>🔗 فتح الرابط الأصلي</a>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// مكوّنات مساعدة
function SCard({ title, children }: { title:string; children:React.ReactNode }) {
  return (
    <div style={{ borderRadius:14,padding:'16px 18px',background:'#FDFAF5',border:'1.5px solid rgba(192,57,43,0.15)',marginBottom:12,boxShadow:'0 2px 10px rgba(192,57,43,0.06)' }}>
      <div style={{ fontSize:13,fontWeight:800,color:'#C0392B',marginBottom:10 }}>{title}</div>
      {children}
    </div>
  )
}

function SChip({ label,active,color,onClick }: { label:string;active:boolean;color:string;onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{ padding:'8px 14px',borderRadius:9,border:`2px solid ${active?color:'rgba(192,57,43,0.15)'}`,background:active?`${color}12`:'transparent',color:active?color:'#6B5050',cursor:'pointer',fontSize:14,fontWeight:700,fontFamily:'inherit',transition:'all 0.15s',boxShadow:active?`0 3px 10px ${color}25`:'none' }}>
      {label}
    </button>
  )
}

function Empty({ icon,title,sub }: { icon:string;title:string;sub:string }) {
  return (
    <div style={{ textAlign:'center',padding:'56px 20px',background:'#FDFAF5',borderRadius:16,border:'1.5px solid rgba(192,57,43,0.12)',boxShadow:'0 2px 10px rgba(192,57,43,0.06)' }}>
      <div style={{ fontSize:48,marginBottom:12 }}>{icon}</div>
      <h3 style={{ fontSize:16,fontWeight:800,color:'#1A1221',marginBottom:6 }}>{title}</h3>
      <p style={{ fontSize:14,color:'#6B5050',opacity:0.8 }}>{sub}</p>
    </div>
  )
}