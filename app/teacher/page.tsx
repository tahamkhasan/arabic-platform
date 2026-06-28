'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ar } from '@/lib/constants/ar'
import { BRAND } from '@/lib/constants/theme'
import { supabase } from '@/lib/supabase'
import MarkdownRenderer from '@/components/MarkdownRenderer'

const c = ar.common

interface User       { id: string; name: string; role: string; user_type: string; status?: string; theme_color?: string; theme_mode?: string; allowed_stages?: string[] }
interface Subject    { id: string; name: string; icon?: string; grade?: string }
interface Student    { id: string; name: string; email: string; allowed_grades?: string[] }

interface ClassStudent {
  member_id: string
  student_id: string
  full_name: string
  email: string | null
  grade: string | null
  avg_score?: number | null
  joined_at: string
}
interface ClassItem {
  id: string
  name: string
  level: string | null
  subject_id: string | null
  subject_name: string | null
  students_count: number
  open_assignments?: number
  created_at: string
}
interface ClassDetail extends ClassItem {
  students: ClassStudent[]
}

// ── جديد: اختبار منشور متاح للربط بمهمة ──────────────────────────
interface QuizOption {
  id: string
  title: string
  published: boolean
  questions_count: number
}

// ── مُعاد بناؤه: مهمة الآن غلاف حول اختبار، لا نص حر ─────────────
interface Assignment {
  id: string
  title: string
  description?: string | null
  quiz_id: string
  quiz_title?: string | null
  questions_count?: number
  target_type: 'all' | 'class' | 'student'
  due_date?: string | null
  created_at: string
}

interface Submission { id: string; assignment_id: string; student_id: string; answer_text: string; submitted_at: string; ai_grade?: number; ai_feedback?: string; teacher_grade?: number; teacher_feedback?: string; status: string; users?: { name: string; email: string } }
interface Media      { id: string; title: string; type: 'video' | 'audio'; url: string; embed_url?: string; link_type: string; thumbnail?: string; subject_id: string; created_at: string }
interface Message    { id: string; from_id: string; to_id: string; content: string; image_url?: string; is_read: boolean; created_at: string }

type Tab = 'assignments' | 'classes' | 'submissions' | 'media' | 'messages' | 'students' | 'stats'

interface Stats {
  summary: {
    totalAssignments: number; totalStudents: number; totalSubmissions: number
    avgGrade: number; pendingReview: number; responseRate: number; reviewedSubs: number
  }
  studentStats: {
    id: string; name: string; email: string; grades: string[]
    submitted: number; graded: number; avgGrade: number | null
    pending: number; responseRate: number
  }[]
  assignmentStats: {
    id: string; title: string; maxGrade: number
    submitted: number; graded: number; avgGrade: number | null
    avgPercent: number | null; pending: number
  }[]
}

// ── مُزال: THEME_COLORS (اختيار لون التمييز) — أُلغيت الميزة بالكامل
// بقرار صريح، استُبدلت بهويّة بصريّة ثابتة واحدة (BRAND.gradMain) ────

function getEmbedUrl(url: string): string | null {
  if (!url) return null
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  if (url.match(/\.(mp4|webm|ogg)$/i)) return url
  return url
}

export default function TeacherPage() {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [user,         setUser]         = useState<User | null>(null)
  // ── مُعدَّل: themeColor أصبح ثابتاً (BRAND.deep) — لا اختيار بعد
  // الآن، الهويّة البصريّة للمنصّة موحَّدة بالكامل (نهاري/ليلي فقط) ──
  const themeColor = BRAND.deep
  const [themeMode,    setThemeMode]    = useState<'light' | 'dark'>('light')
  const [showSettings, setShowSettings] = useState(false)
  const [tab,          setTab]          = useState<Tab>('assignments')

  const [accessToken, setAccessToken] = useState('')

  const [subjects,    setSubjects]    = useState<Subject[]>([])
  const [students,    setStudents]    = useState<Student[]>([])
  const [classes,     setClasses]     = useState<ClassItem[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [media,       setMedia]       = useState<Media[]>([])
  const [unread,      setUnread]      = useState(0)
  const [stats,       setStats]       = useState<Stats | null>(null)
  const [statsLoading,setStatsLoading]= useState(false)

  // ── مُعاد بناؤه بالكامل: نموذج المهمة الجديد (اختبار + استهداف) ──
  const [quizzesList, setQuizzesList] = useState<QuizOption[]>([])
  const [aTitle,       setATitle]       = useState('')
  const [aDescription, setADescription] = useState('')
  const [aQuizId,      setAQuizId]      = useState('')
  const [aTarget,      setATarget]      = useState<'all'|'class'|'student'>('all')
  const [aTargetIds,   setATargetIds]   = useState<string[]>([])
  const [aDeadline,    setADeadline]    = useState('')
  const [sendingA,     setSendingA]     = useState(false)
  const [aDone,        setADone]        = useState(false)
  const [aError,       setAError]       = useState('')

  const [gName,       setGName]       = useState('')
  const [gSubject,    setGSubject]    = useState('')
  const [gLevel,      setGLevel]      = useState('')
  const [creatingG,   setCreatingG]   = useState(false)
  const [gDone,       setGDone]       = useState(false)
  const [showNewG,    setShowNewG]    = useState(false)
  const [openClass,   setOpenClass]   = useState<ClassDetail | null>(null)
  const [loadingClassDetail, setLoadingClassDetail] = useState(false)
  const [addingMember,setAddingMember]= useState(false)
  const [classError,  setClassError]  = useState('')

  const [mTitle,     setMTitle]     = useState('')
  const [mType,      setMType]      = useState<'video'|'audio'>('video')
  const [mSubject,   setMSubject]   = useState('')
  const [mLinkType,  setMLinkType]  = useState<'upload'|'link'>('link')
  const [mUrl,       setMUrl]       = useState('')
  const [mFile,      setMFile]      = useState<File | null>(null)
  const [uploadingM, setUploadingM] = useState(false)
  const [mDone,      setMDone]      = useState(false)
  const [mError,     setMError]     = useState('')
  const [openMedia,  setOpenMedia]  = useState<Media | null>(null)

  const [openSub,    setOpenSub]    = useState<Submission | null>(null)
  const [tGrade,     setTGrade]     = useState('')
  const [tFeedback,  setTFeedback]  = useState('')
  const [reviewing,  setReviewing]  = useState(false)
  const [reviewDone, setReviewDone] = useState(false)

  const [selStudent, setSelStudent] = useState<Student | null>(null)
  const [msgList,    setMsgList]    = useState<Message[]>([])
  const [newMsg,     setNewMsg]     = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)

  useEffect(() => {
      const saved = localStorage.getItem('mosaed_user')
      if (!saved) { router.replace('/'); return }
      try {
        const u = JSON.parse(saved) as User
        if (u.user_type === 'student') { router.replace('/student'); return }
        if (u.status === 'pending' || u.status === 'suspended') {
         router.replace('/pending-approval')
      return
    }
    setUser(u)
      // ── مُزال: لا نقرأ theme_color من المستخدم بعد، اللون ثابت دائماً ──
      if (u.theme_mode === 'dark') setThemeMode('dark')
    } catch { router.replace('/') }
  }, [router])

  useEffect(() => {
    if (!user) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) setAccessToken(data.session.access_token)
    })
  }, [user])

  useEffect(() => {
    if (!user) return

    const params = new URLSearchParams()
    if (user.allowed_stages?.length) {
      params.set('stages', user.allowed_stages.join(','))
    }
    params.set('teacherId', user.id)

    fetch(`/api/subjects?${params.toString()}`).then(r => r.json()).then(d => setSubjects(d.subjects ?? []))
  }, [user])

  useEffect(() => {
    if (!accessToken) return
    fetch('/api/students', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => setStudents((d.students ?? []).map((s: any) => ({ id: s.id, name: s.name, email: s.email, allowed_grades: s.allowed_grades }))))
      .catch(() => setStudents([]))
  }, [accessToken])

  function loadClasses() {
    if (!accessToken) return
    fetch('/api/classes', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => setClasses(d.items ?? d.data?.items ?? []))
      .catch(() => setClasses([]))
  }

  // ── جديد: جلب اختبارات المعلم المنشورة لاستخدامها في نموذج المهمة ──
  useEffect(() => {
    if (!accessToken || tab !== 'assignments') return
    fetch('/api/quizzes?status=published&page_size=100', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(d => setQuizzesList(d.data?.items ?? d.items ?? []))
      .catch(() => setQuizzesList([]))
  }, [accessToken, tab])

  useEffect(() => {
    if (!user || !accessToken) return
    if (tab === 'assignments') {
      fetch(`/api/assignments?teacherId=${user.id}`, { headers: { Authorization: `Bearer ${accessToken}` } })
        .then(r => r.json()).then(d => setAssignments(d.assignments ?? []))
      loadClasses() // ── مُصحَّح: تُحتاج أيضاً لقائمة استهداف "فصل" هنا، لا فقط تبويب الفصول نفسه ──
    }
    if (tab === 'classes')     loadClasses()
    if (tab === 'submissions') fetch(`/api/submissions?teacherId=${user.id}`).then(r => r.json()).then(d => setSubmissions(d.submissions ?? []))
    if (tab === 'media')       fetch(`/api/teacher-media?teacherId=${user.id}`).then(r => r.json()).then(d => setMedia(d.media ?? []))
    if (tab === 'messages')    fetch(`/api/messages?userId=${user.id}&unreadOnly=true`).then(r => r.json()).then(d => setUnread(d.unread ?? 0))
    if (tab === 'stats') {
      setStatsLoading(true)
      fetch(`/api/stats?teacherId=${user.id}`, { headers: { Authorization: `Bearer ${accessToken}` } })
        .then(r => r.json()).then(d => setStats(d))
        .finally(() => setStatsLoading(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tab, accessToken])

  useEffect(() => {
    if (!user || !selStudent) return
    fetch(`/api/messages?userId=${user.id}&otherId=${selStudent.id}`).then(r => r.json()).then(d => setMsgList(d.messages ?? []))
  }, [user, selStudent])

  const isDark = themeMode === 'dark'

  const bg        = isDark ? '#1A1612' : BRAND.bg
  const cardBg    = isDark ? '#241F1A' : BRAND.bgSoft
  const textCol   = isDark ? '#F5EFE6' : BRAND.text
  const subCol    = isDark ? '#B5A99C' : BRAND.sub
  const borderCol = isDark ? 'rgba(220,100,40,0.18)' : BRAND.border
  const inputBg   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(140,20,40,0.04)'
  const headerBg  = isDark ? 'rgba(26,22,18,0.94)' : 'rgba(247,242,234,0.97)'

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: `1.5px solid ${borderCol}`, background: inputBg,
    color: textCol, fontSize: 14, fontFamily: 'inherit',
    colorScheme: themeMode,
  }

  // ── مُعاد بناؤه بالكامل: إرسال مهمة جديدة (اختبار + استهداف) ──────
  async function sendAssignment() {
    if (!user || !accessToken || !aTitle.trim() || !aQuizId) return
    if ((aTarget === 'class' || aTarget === 'student') && aTargetIds.length === 0) {
      setAError(aTarget === 'class' ? 'اختر فصلاً واحداً على الأقل.' : 'اختر طالباً واحداً على الأقل.')
      return
    }
    setSendingA(true)
    setAError('')
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          teacherId: user.id,
          quizId: aQuizId,
          title: aTitle.trim(),
          description: aDescription.trim() || undefined,
          targetType: aTarget,
          targetIds: aTargetIds,
          dueDate: aDeadline || null,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setAError(data?.error || 'فشل إرسال المهمة.')
        return
      }
      setADone(true); setATitle(''); setADescription(''); setAQuizId('')
      setATarget('all'); setATargetIds([]); setADeadline('')
      setTimeout(() => setADone(false), 3000)
      fetch(`/api/assignments?teacherId=${user.id}`, { headers: { Authorization: `Bearer ${accessToken}` } })
        .then(r => r.json()).then(d => setAssignments(d.assignments ?? []))
    } catch {
      setAError('تعذّر الاتصال بالخادم.')
    } finally {
      setSendingA(false)
    }
  }

  async function createClass() {
    if (!user || !accessToken || !gName.trim()) return
    setCreatingG(true)
    setClassError('')
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ name: gName, level: gLevel || undefined, subject_id: gSubject || undefined }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok) {
        setGDone(true); setGName(''); setGSubject(''); setGLevel('')
        setTimeout(() => { setGDone(false); setShowNewG(false) }, 1500)
        loadClasses()
      } else {
        setClassError(data?.error || 'فشل إنشاء الفصل.')
      }
    } catch {
      setClassError('تعذّر الاتصال بالخادم.')
    } finally { setCreatingG(false) }
  }

  async function openClassDetail(classId: string) {
    if (!accessToken) return
    setLoadingClassDetail(true)
    try {
      const res = await fetch(`/api/classes/${classId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      const data = await res.json().catch(() => null)
      if (res.ok) setOpenClass(data?.data ?? data)
    } finally { setLoadingClassDetail(false) }
  }

  async function addToClass(classId: string, studentId: string) {
    if (!accessToken) return
    setAddingMember(true)
    try {
      await fetch(`/api/classes/${classId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ student_id: studentId }),
      })
      await openClassDetail(classId)
      loadClasses()
    } finally { setAddingMember(false) }
  }

  async function removeFromClass(classId: string, studentId: string) {
    if (!accessToken) return
    await fetch(`/api/classes/${classId}/students`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ student_id: studentId }),
    })
    await openClassDetail(classId)
    loadClasses()
  }

  async function deleteClass(classId: string) {
    if (!accessToken) return
    if (!confirm('هل تريد حذف هذا الفصل؟')) return
    const res = await fetch(`/api/classes/${classId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      alert(data?.error || 'فشل حذف الفصل.')
      return
    }
    setOpenClass(null)
    loadClasses()
  }

  async function uploadMedia() {
    if (!user || !mTitle.trim()) return
    setUploadingM(true); setMError('')
    try {
      let finalUrl = mUrl, embedUrl = ''
      if (mLinkType === 'upload' && mFile) {
        const formData = new FormData()
        formData.append('file', mFile)
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_PRESET ?? 'mosaed_media')
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD ?? ''
        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: 'POST', body: formData })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error('فشل رفع الملف')
        finalUrl = uploadData.secure_url; embedUrl = uploadData.secure_url
      } else { embedUrl = getEmbedUrl(mUrl) ?? mUrl }
      const res = await fetch('/api/teacher-media', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: user.id, subjectId: mSubject || null, title: mTitle, type: mType, url: finalUrl, embedUrl, linkType: mLinkType }),
      })
      if (res.ok) {
        setMDone(true); setMTitle(''); setMUrl(''); setMFile(null); setMSubject('')
        setTimeout(() => setMDone(false), 3000)
        fetch(`/api/teacher-media?teacherId=${user.id}`).then(r => r.json()).then(d => setMedia(d.media ?? []))
      }
    } catch (e: unknown) { setMError(e instanceof Error ? e.message : 'حدث خطأ') }
    finally { setUploadingM(false) }
  }

  async function submitReview() {
    if (!openSub) return
    setReviewing(true)
    try {
      const res = await fetch('/api/submissions', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: openSub.id, teacherGrade: Number(tGrade), teacherFeedback: tFeedback }),
      })
      if (res.ok) {
        setReviewDone(true); setTGrade(''); setTFeedback('')
        setTimeout(() => { setReviewDone(false); setOpenSub(null) }, 2000)
        fetch(`/api/submissions?teacherId=${user?.id}`).then(r => r.json()).then(d => setSubmissions(d.submissions ?? []))
      }
    } finally { setReviewing(false) }
  }

  async function sendMessage() {
    if (!user || !selStudent || !newMsg.trim()) return
    setSendingMsg(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromId: user.id, toId: selStudent.id, content: newMsg }),
      })
      const data = await res.json()
      if (res.ok) { setMsgList(prev => [...prev, data.message]); setNewMsg('') }
    } finally { setSendingMsg(false) }
  }

  async function saveSettings() {
    if (!user) return
    try {
      await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, theme_color: themeColor, theme_mode: themeMode }) })
      const updated = { ...user, theme_color: themeColor, theme_mode: themeMode }
      setUser(updated); localStorage.setItem('mosaed_user', JSON.stringify(updated))
    } finally { setShowSettings(false) }
  }

  function toggleThemeMode() {
    if (!user) return
    const next = themeMode === 'dark' ? 'light' : 'dark'
    setThemeMode(next)
    const updated = { ...user, theme_mode: next }
    setUser(updated)
    localStorage.setItem('mosaed_user', JSON.stringify(updated))
    fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, theme_mode: next }),
    }).catch(() => {})
  }

  function handleLogout() { localStorage.removeItem('mosaed_user'); localStorage.removeItem('mosaed_session'); router.replace('/') }

  if (!user) return null

  const pendingReviews = submissions.filter(s => s.status === 'submitted' && !s.teacher_grade).length

  const TABS = [
    { id: 'assignments' as Tab, icon: '📝', label: 'مهمة جديدة' },
    { id: 'classes'      as Tab, icon: '🏫', label: 'الفصول' },
    { id: 'submissions' as Tab, icon: '📬', label: 'الإجابات',  badge: pendingReviews },
    { id: 'media'       as Tab, icon: '🎥', label: 'الوسائط' },
    { id: 'messages'    as Tab, icon: '💬', label: 'الرسائل',   badge: unread },
    { id: 'students'    as Tab, icon: '👤', label: 'الطلاب' },
    { id: 'stats'       as Tab, icon: '📊', label: 'تحليلات' },
  ]
  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: bg, color: textCol, fontFamily: BRAND.fontBody, paddingBottom: 90 }}>
      <style>{`
        * { box-sizing: border-box; } body { margin: 0; }
        @keyframes spin   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.3s ease; }
        textarea:focus, input:focus, select:focus { outline: none; }
        select option { background-color: ${cardBg} !important; color: ${textCol} !important; }
        select { color-scheme: ${themeMode}; }
      `}</style>

      {/* الرأس */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: headerBg, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${borderCol}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 12,
              border: 'none', background: themeColor, color: '#1a1a2e', fontWeight: 900, fontSize: 14,
              cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 14px ${themeColor}40`, flexShrink: 0,
            }}
          >
            → رجوع
          </button>
          <span style={{ fontSize: 26 }}>🌙</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: themeColor, background: `${themeColor}16`, display: 'inline-block', padding: '2px 10px', borderRadius: 8 }}>
              {c.platformName}
            </div>
            <div style={{ fontSize: 13, color: subCol, marginTop: 2 }}>👨‍🏫 {user.name} • معلم</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => router.push('/dashboard')} style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: `1.5px solid ${themeColor}44`, background: `${themeColor}15`, color: themeColor, cursor: 'pointer', fontFamily: 'inherit' }}>✨ أدوات التوليد</button>
          <button onClick={toggleThemeMode} title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'} style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: `1.5px solid ${borderCol}`, background: 'transparent', color: subCol, cursor: 'pointer', fontFamily: 'inherit' }}>{isDark ? '☀️' : '🌙'}</button>
          {/* ── مُزال: زر ⚙️ الإعدادات — لا محتوى فعلي بقي فيه ── */}
          <button onClick={handleLogout} style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: `1.5px solid rgba(180,40,40,0.4)`, background: 'rgba(180,40,40,0.1)', color: BRAND.crimson, cursor: 'pointer', fontFamily: 'inherit' }}>🚪 خروج</button>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── مُعاد بناؤه بالكامل: إرسال مهمة جديدة (اختبار + استهداف) ── */}
        {tab === 'assignments' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 900, color: themeColor, background: `${themeColor}14`, display: 'inline-block', padding: '4px 14px', borderRadius: 10, marginBottom: 20 , fontFamily: BRAND.fontHeading }}>📝 إرسال مهمة جديدة</h2>

            {aDone && <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.4)', color: '#059669', fontSize: 14, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>✅ تم إرسال المهمة بنجاح!</div>}
            {aError && <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(180,40,40,0.1)', color: BRAND.crimson, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>⚠️ {aError}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 6 }}>عنوان المهمة *</label>
                <input value={aTitle} onChange={e => setATitle(e.target.value)} placeholder="مثال: مهمة مراجعة النعت" style={inputStyle} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 6 }}>وصف مختصر (اختياري)</label>
                <input value={aDescription} onChange={e => setADescription(e.target.value)} placeholder="وصف موجز للمهمة" style={inputStyle} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 6 }}>الاختبار المرتبط *</label>
                <select value={aQuizId} onChange={e => setAQuizId(e.target.value)} style={inputStyle}>
                  <option value="">-- اختر اختباراً منشوراً --</option>
                  {quizzesList.map(q => <option key={q.id} value={q.id}>{q.title} ({q.questions_count} سؤال)</option>)}
                </select>
                {quizzesList.length === 0 && (
                  <p style={{ fontSize: 12, color: subCol, marginTop: 6 }}>لا توجد اختبارات منشورة بعد — أنشئ ونشر اختباراً أولاً من تبويب "🎯 الاختبارات".</p>
                )}
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 8 }}>إرسال إلى</label>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  {([['all', '👥 الجميع'], ['student', '👤 طالب محدد'], ['class', '🏫 فصل']] as const).map(([val, label]) => (
                    <button key={val} onClick={() => { setATarget(val); setATargetIds([]) }}
                      style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: `2px solid ${aTarget === val ? themeColor : borderCol}`, background: aTarget === val ? `${themeColor}18` : 'transparent', color: aTarget === val ? themeColor : subCol, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* ── مُصحَّح: button بدل label+input (كان لا يستجيب للنقر
                     بسبب تعارض محتمل بين معالج label وسلوك input الافتراضي) ── */}
                {aTarget === 'student' && (
                  <div style={{ maxHeight: 220, overflowY: 'auto', borderRadius: 12, border: `1.5px solid ${borderCol}`, background: inputBg }}>
                    {students.length === 0 ? (
                      <p style={{ fontSize: 12, color: subCol, padding: 14, margin: 0 }}>لا يوجد طلاب متاحون.</p>
                    ) : students.map(s => {
                      const checked = aTargetIds.includes(s.id)
                      return (
                        <button key={s.id} type="button"
                          onClick={() => setATargetIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                          style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${borderCol}`, border: 'none', borderBottomWidth: 1, cursor: 'pointer', background: checked ? `${themeColor}16` : 'transparent', fontFamily: 'inherit', textAlign: 'right' }}>
                          <span style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? themeColor : subCol}`, background: checked ? themeColor : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff' }}>{checked ? '✓' : ''}</span>
                          <span style={{ fontSize: 13, color: checked ? themeColor : textCol, fontWeight: checked ? 700 : 400 }}>{s.name} ({s.email})</span>
                        </button>
                      )
                    })}
                  </div>
                )}
                {aTarget === 'class' && (
                  <div style={{ maxHeight: 220, overflowY: 'auto', borderRadius: 12, border: `1.5px solid ${borderCol}`, background: inputBg }}>
                    {classes.length === 0 ? (
                      <p style={{ fontSize: 12, color: subCol, padding: 14, margin: 0 }}>لا توجد فصول متاحة.</p>
                    ) : classes.map(g => {
                      const checked = aTargetIds.includes(g.id)
                      return (
                        <button key={g.id} type="button"
                          onClick={() => setATargetIds(prev => prev.includes(g.id) ? prev.filter(id => id !== g.id) : [...prev, g.id])}
                          style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${borderCol}`, border: 'none', borderBottomWidth: 1, cursor: 'pointer', background: checked ? `${themeColor}16` : 'transparent', fontFamily: 'inherit', textAlign: 'right' }}>
                          <span style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? themeColor : subCol}`, background: checked ? themeColor : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff' }}>{checked ? '✓' : ''}</span>
                          <span style={{ fontSize: 13, color: checked ? themeColor : textCol, fontWeight: checked ? 700 : 400 }}>{g.name} ({g.students_count} طالب)</span>
                        </button>
                      )
                    })}
                  </div>
                )}
                {(aTarget === 'student' || aTarget === 'class') && aTargetIds.length > 0 && (
                  <p style={{ fontSize: 11, color: themeColor, marginTop: 6, fontWeight: 700 }}>✅ تم تحديد {aTargetIds.length} عنصر</p>
                )}
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 6 }}>⏰ الموعد النهائي (اختياري)</label>
                <input type="datetime-local" value={aDeadline} onChange={e => setADeadline(e.target.value)} style={inputStyle} />
              </div>

              <button onClick={sendAssignment} disabled={sendingA || !aTitle.trim() || !aQuizId}
                style={{ padding: '14px', borderRadius: 14, border: 'none', background: (aTitle.trim() && aQuizId) ? BRAND.gradMain : borderCol, color: '#1a1a2e', fontWeight: 900, fontSize: 16, cursor: (aTitle.trim() && aQuizId) ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {sendingA ? <><span style={{ width: 18, height: 18, border: '3px solid #1a1a2e44', borderTopColor: '#1a1a2e', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />جارٍ الإرسال...</> : '📤 إرسال المهمة'}
              </button>
            </div>

            {assignments.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: textCol, marginBottom: 14 , fontFamily: BRAND.fontHeading }}>📋 المهام المرسلة ({assignments.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {assignments.map(a => (
                    <div key={a.id} style={{ padding: '14px 16px', borderRadius: 14, background: cardBg, border: `1.5px solid ${borderCol}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: textCol }}>{a.title}</div>
                          <div style={{ fontSize: 12, color: subCol, marginTop: 4 }}>
                            🎯 {a.quiz_title || 'اختبار'} • {a.questions_count ?? 0} سؤال
                            {a.due_date && ` • ⏰ ${new Date(a.due_date).toLocaleDateString('ar-KW', { month: 'short', day: 'numeric' })}`}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, color: themeColor, background: `${themeColor}18`, padding: '3px 10px', borderRadius: 8, fontWeight: 700 }}>
                          {new Date(a.created_at).toLocaleDateString('ar-KW', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── تبويب "الفصول" (بلا تغيير) ── */}
        {tab === 'classes' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: themeColor, background: `${themeColor}14`, display: 'inline-block', padding: '4px 14px', borderRadius: 10, margin: 0 , fontFamily: BRAND.fontHeading }}>🏫 الفصول ({classes.length})</h2>
              <button onClick={() => { setShowNewG(true); setClassError('') }}
                style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: BRAND.gradMain, color: '#1a1a2e', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                ＋ فصل جديد
              </button>
            </div>

            {!accessToken ? (
              <div style={{ textAlign: 'center', padding: '40px', color: subCol }}>⏳ جارٍ تجهيز الجلسة...</div>
            ) : classes.length === 0
              ? <EmptyState icon="🏫" title="لا توجد فصول بعد" sub="أنشئ فصلاً وأضف طلابك إليه" cardBg={cardBg} borderCol={borderCol} textCol={textCol} subCol={subCol} />
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
                  {classes.map(g => (
                    <div key={g.id} style={{ padding: '18px 20px', borderRadius: 16, background: cardBg, border: `1.5px solid ${borderCol}`, cursor: 'pointer' }}
                      onClick={() => openClassDetail(g.id)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ fontSize: 32 }}>🏫</div>
                        <span style={{ fontSize: 12, background: `${themeColor}18`, color: themeColor, padding: '3px 10px', borderRadius: 8, fontWeight: 700 }}>
                          {g.students_count} طالب
                        </span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: textCol, marginBottom: 6 }}>{g.name}</div>
                      <div style={{ fontSize: 12, color: subCol }}>
                        {g.subject_name ? `📚 ${g.subject_name}` : 'بلا مادة محدَّدة'}
                        {g.level ? ` • ${g.level}` : ''}
                      </div>
                      {!!g.open_assignments && (
                        <div style={{ fontSize: 12, color: themeColor, marginTop: 6 }}>📝 {g.open_assignments} مهمة مفتوحة</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ── الإجابات (بلا تغيير) ── */}
        {tab === 'submissions' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, fontFamily: BRAND.fontHeading }}>
              <span style={{ color: themeColor, background: `${themeColor}14`, display: 'inline-block', padding: '4px 14px', borderRadius: 10 }}>📬 إجابات الطلاب</span>
              {pendingReviews > 0 && <span style={{ fontSize: 13, marginRight: 10, background: BRAND.orange, color: '#fff', padding: '2px 10px', borderRadius: 8 }}>{pendingReviews} تحتاج مراجعة</span>}
            </h2>
            {submissions.length === 0
              ? <EmptyState icon="📭" title="لا توجد إجابات بعد" sub="ستظهر إجابات الطلاب هنا" cardBg={cardBg} borderCol={borderCol} textCol={textCol} subCol={subCol} />
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {submissions.map(sub => {
                    const isPending = sub.status === 'submitted' && !sub.teacher_grade
                    return (
                      <div key={sub.id} style={{ padding: '16px 18px', borderRadius: 14, background: cardBg, border: `1.5px solid ${isPending ? BRAND.orange + '44' : BRAND.gold + '44'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: textCol }}>{sub.users?.name ?? 'طالب'}</div>
                            <div style={{ fontSize: 12, color: subCol, marginTop: 3 }}>{new Date(sub.submitted_at).toLocaleDateString('ar-KW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            {sub.ai_grade !== null && sub.ai_grade !== undefined && <div style={{ fontSize: 12, color: BRAND.crimson, fontWeight: 700 }}>🤖 AI: {sub.ai_grade}</div>}
                            {sub.teacher_grade !== null && sub.teacher_grade !== undefined && <div style={{ fontSize: 13, color: BRAND.gold, fontWeight: 800 }}>✅ {sub.teacher_grade}</div>}
                            {isPending && <div style={{ fontSize: 12, color: BRAND.orange, fontWeight: 700 }}>⏳ تحتاج مراجعة</div>}
                          </div>
                        </div>
                        <div style={{ padding: '10px 12px', borderRadius: 10, background: inputBg, border: `1px solid ${borderCol}`, marginBottom: 12, fontSize: 13, color: subCol, lineHeight: 1.6 }}>
                          {sub.answer_text.slice(0, 150)}{sub.answer_text.length > 150 ? '...' : ''}
                        </div>
                        <button onClick={() => { setOpenSub(sub); setTGrade(String(sub.teacher_grade ?? sub.ai_grade ?? '')); setTFeedback(sub.teacher_feedback ?? sub.ai_feedback ?? '') }}
                          style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: isPending ? BRAND.gradMain : `${themeColor}22`, color: isPending ? '#1a1a2e' : themeColor, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {isPending ? '✏️ مراجعة وتصحيح' : '👁️ عرض التفاصيل'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
          </div>
        )}

        {/* ── الوسائط (بلا تغيير) ── */}
        {tab === 'media' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 900, color: themeColor, background: `${themeColor}14`, display: 'inline-block', padding: '4px 14px', borderRadius: 10, marginBottom: 20 , fontFamily: BRAND.fontHeading }}>🎥 إضافة وسائط تعليمية</h2>
            {mDone && <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(220,140,60,0.15)', border: '1px solid rgba(220,140,60,0.4)', color: BRAND.gold, fontSize: 14, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>✅ تمت الإضافة بنجاح!</div>}
            {mError && <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(180,40,40,0.12)', border: '1px solid rgba(180,40,40,0.4)', color: BRAND.crimson, fontSize: 13, marginBottom: 14 }}>⚠️ {mError}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 6 }}>عنوان الوسيط *</label>
                <input value={mTitle} onChange={e => setMTitle(e.target.value)} placeholder="مثال: شرح درس النعت" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 6 }}>النوع</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {([['video', '🎬 فيديو'], ['audio', '🎵 صوت']] as const).map(([val, label]) => (
                      <button key={val} onClick={() => setMType(val)}
                        style={{ flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${mType === val ? themeColor : borderCol}`, background: mType === val ? `${themeColor}18` : 'transparent', color: mType === val ? themeColor : subCol, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 6 }}>المادة</label>
                  <select value={mSubject} onChange={e => setMSubject(e.target.value)} style={inputStyle}>
                    <option value="">-- اختر (اختياري) --</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 8 }}>طريقة الإضافة</label>
                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                  {([['link', '🔗 رابط خارجي'], ['upload', '📁 رفع ملف']] as const).map(([val, label]) => (
                    <button key={val} onClick={() => { setMLinkType(val); setMUrl(''); setMFile(null) }}
                      style={{ flex: 1, padding: '12px', borderRadius: 12, border: `2px solid ${mLinkType === val ? themeColor : borderCol}`, background: mLinkType === val ? `${themeColor}18` : 'transparent', color: mLinkType === val ? themeColor : subCol, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}>
                      {label}
                    </button>
                  ))}
                </div>
                {mLinkType === 'link' ? (
                  <div>
                    <input value={mUrl} onChange={e => setMUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=... أو https://vimeo.com/..." style={inputStyle} />
                    {mUrl && getEmbedUrl(mUrl) && (
                      <div style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden', border: `1px solid ${borderCol}` }}>
                        <iframe src={getEmbedUrl(mUrl) ?? ''} style={{ width: '100%', height: 220, border: 'none' }} allowFullScreen title="معاينة" />
                      </div>
                    )}
                    <p style={{ fontSize: 12, color: subCol, marginTop: 8 }}>✅ يدعم: YouTube • Vimeo • أي رابط فيديو مباشر</p>
                  </div>
                ) : (
                  <div>
                    <input ref={fileRef} type="file" accept={mType === 'video' ? 'video/*' : 'audio/*'} style={{ display: 'none' }} onChange={e => setMFile(e.target.files?.[0] ?? null)} />
                    <button onClick={() => fileRef.current?.click()}
                      style={{ width: '100%', padding: '20px', borderRadius: 14, border: `2px dashed ${borderCol}`, background: 'transparent', color: subCol, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
                      {mFile ? `✅ ${mFile.name}` : `📁 انقر لاختيار ملف ${mType === 'video' ? 'فيديو' : 'صوت'}`}
                    </button>
                    {mFile && <p style={{ fontSize: 12, color: subCol, marginTop: 6 }}>الحجم: {(mFile.size / 1024 / 1024).toFixed(1)} MB</p>}
                  </div>
                )}
              </div>
              <button onClick={uploadMedia} disabled={uploadingM || !mTitle.trim() || (mLinkType === 'link' ? !mUrl.trim() : !mFile)}
                style={{ padding: '14px', borderRadius: 14, border: 'none', background: (mTitle && (mUrl || mFile)) ? BRAND.gradMain : borderCol, color: '#1a1a2e', fontWeight: 900, fontSize: 15, cursor: (mTitle && (mUrl || mFile)) ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {uploadingM ? <><span style={{ width: 18, height: 18, border: '3px solid #1a1a2e44', borderTopColor: '#1a1a2e', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />جارٍ الرفع...</> : '📤 إضافة الوسيط'}
              </button>
            </div>
            {media.length > 0 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: textCol, marginBottom: 14 , fontFamily: BRAND.fontHeading }}>📚 الوسائط المضافة ({media.length})</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
                  {media.map(m => (
                    <button key={m.id} onClick={() => setOpenMedia(m)}
                      style={{ borderRadius: 14, overflow: 'hidden', border: `1.5px solid ${borderCol}`, background: cardBg, cursor: 'pointer', textAlign: 'right', fontFamily: 'inherit', padding: 0 }}>
                      <div style={{ height: 110, background: `${themeColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, position: 'relative' }}>
                        {m.link_type === 'link' && m.embed_url?.includes('youtube') ? '▶️' : m.type === 'video' ? '🎬' : '🎵'}
                        {m.link_type === 'link' && <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, background: BRAND.crimson, color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>🔗</span>}
                      </div>
                      <div style={{ padding: '10px 12px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: textCol, marginBottom: 3 }}>{m.title}</div>
                        <div style={{ fontSize: 11, color: subCol }}>{m.type === 'video' ? '🎬 فيديو' : '🎵 صوت'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── الرسائل (بلا تغيير) ── */}
        {tab === 'messages' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 900, color: themeColor, background: `${themeColor}14`, display: 'inline-block', padding: '4px 14px', borderRadius: 10, marginBottom: 20 , fontFamily: BRAND.fontHeading }}>💬 رسائل الطلاب</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, minHeight: 400 }}>
              <div style={{ borderRadius: 14, background: cardBg, border: `1.5px solid ${borderCol}`, overflow: 'hidden' }}>
                <div style={{ padding: '12px 14px', borderBottom: `1px solid ${borderCol}`, fontSize: 13, fontWeight: 700, color: subCol }}>الطلاب ({students.length})</div>
                <div style={{ overflowY: 'auto', maxHeight: 500 }}>
                  {students.length === 0
                    ? <p style={{ color: subCol, fontSize: 13, padding: 14, margin: 0 }}>لا يوجد طلاب</p>
                    : students.map(s => (
                      <button key={s.id} onClick={() => setSelStudent(s)}
                        style={{ width: '100%', padding: '12px 14px', textAlign: 'right', background: selStudent?.id === s.id ? `${themeColor}18` : 'transparent', border: 'none', borderBottom: `1px solid ${borderCol}`, cursor: 'pointer', fontFamily: 'inherit', color: selStudent?.id === s.id ? themeColor : textCol }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>👨‍🎓 {s.name}</div>
                        <div style={{ fontSize: 11, color: subCol, marginTop: 2 }}>{s.email}</div>
                      </button>
                    ))}
                </div>
              </div>
              <div style={{ borderRadius: 14, background: cardBg, border: `1.5px solid ${borderCol}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {!selStudent
                  ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: subCol, fontSize: 14 }}>← اختر طالباً لبدء المحادثة</div>
                  : (
                    <>
                      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${borderCol}`, fontSize: 14, fontWeight: 700, color: themeColor, background: `${themeColor}10` }}>💬 {selStudent.name}</div>
                      <div style={{ flex: 1, padding: 14, overflowY: 'auto', maxHeight: 360, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {msgList.length === 0
                          ? <p style={{ color: subCol, fontSize: 13, textAlign: 'center', margin: 'auto' }}>لا توجد رسائل بعد</p>
                          : msgList.map(msg => {
                            const isMe = msg.from_id === user.id
                            return (
                              <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-start' : 'flex-end' }}>
                                <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: isMe ? '16px 16px 16px 4px' : '16px 16px 4px 16px', background: isMe ? `${themeColor}22` : inputBg, border: `1px solid ${isMe ? themeColor + '44' : borderCol}` }}>
                                  <p style={{ fontSize: 14, color: textCol, margin: 0, lineHeight: 1.6 }}>{msg.content}</p>
                                  <p style={{ fontSize: 10, color: subCol, margin: '4px 0 0' }}>{new Date(msg.created_at).toLocaleTimeString('ar-KW', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                      <div style={{ padding: '12px 14px', borderTop: `1px solid ${borderCol}`, display: 'flex', gap: 8 }}>
                        <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="اكتب رسالة..." style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${borderCol}`, background: inputBg, color: textCol, fontSize: 14, fontFamily: 'inherit' }} />
                        <button onClick={sendMessage} disabled={sendingMsg || !newMsg.trim()} style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: newMsg.trim() ? themeColor : borderCol, color: '#1a1a2e', fontSize: 16, fontWeight: 800, cursor: newMsg.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                          {sendingMsg ? '⏳' : '←'}
                        </button>
                      </div>
                    </>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* ── الطلاب (بلا تغيير) ── */}
        {tab === 'students' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 900, color: themeColor, background: `${themeColor}14`, display: 'inline-block', padding: '4px 14px', borderRadius: 10, marginBottom: 20 , fontFamily: BRAND.fontHeading }}>👤 الطلاب ({students.length})</h2>
            {students.length === 0
              ? <EmptyState icon="👥" title="لا يوجد طلاب بعد" sub="سيظهر الطلاب هنا بعد موافقة المدير" cardBg={cardBg} borderCol={borderCol} textCol={textCol} subCol={subCol} />
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14 }}>
                  {students.map(s => (
                    <div key={s.id} style={{ padding: '16px 18px', borderRadius: 14, background: cardBg, border: `1.5px solid ${borderCol}` }}>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>👨‍🎓</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: textCol, marginBottom: 4 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: subCol, marginBottom: 8 }}>{s.email}</div>
                      {s.allowed_grades?.length ? <div style={{ fontSize: 12, color: themeColor, fontWeight: 700 }}>📚 {s.allowed_grades.join('، ')}</div> : null}
                      <button onClick={() => { setSelStudent(s); setTab('messages') }}
                        style={{ marginTop: 12, width: '100%', padding: '8px', borderRadius: 10, border: `1.5px solid ${themeColor}44`, background: `${themeColor}12`, color: themeColor, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                        💬 مراسلة
                      </button>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}
      </main>
        {/* ── التحليلات (بلا تغيير في المنطق، فقط بيانات الخادم الجديدة) ── */}
        {tab === 'stats' && (
          <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: themeColor, background: `${themeColor}14`, display: 'inline-block', padding: '4px 14px', borderRadius: 10, marginBottom: 20 , fontFamily: BRAND.fontHeading }}>📊 تحليلات الأداء</h2>

            {statsLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: subCol }}>
                <div style={{ width: 48, height: 48, border: `4px solid ${themeColor}33`, borderTopColor: themeColor, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ margin: 0 }}>جارٍ تحميل التحليلات...</p>
              </div>
            ) : !stats ? (
              <EmptyState icon="📊" title="لا توجد بيانات بعد" sub="أرسل مهاماً وصحّح إجابات لترى التحليلات" cardBg={cardBg} borderCol={borderCol} textCol={textCol} subCol={subCol} />
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
                  {[
                    { icon: '👥', label: 'الطلاب',         value: stats.summary.totalStudents,      color: BRAND.crimson },
                    { icon: '📝', label: 'المهام',          value: stats.summary.totalAssignments,   color: BRAND.orangeRed },
                    { icon: '📬', label: 'الإجابات',        value: stats.summary.totalSubmissions,   color: BRAND.gold },
                    { icon: '🎯', label: 'متوسط الدرجات',  value: stats.summary.avgGrade || '—',    color: BRAND.gold },
                    { icon: '⏳', label: 'تحتاج مراجعة',   value: stats.summary.pendingReview,      color: BRAND.orange },
                    { icon: '📈', label: 'نسبة الاستجابة', value: `${stats.summary.responseRate}%`, color: BRAND.deep },
                  ].map((card, i) => (
                    <div key={i} style={{ padding: '16px 12px', borderRadius: 14, background: cardBg, border: `1.5px solid ${card.color}33`, textAlign: 'center' }}>
                      <div style={{ fontSize: 26, marginBottom: 6 }}>{card.icon}</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: card.color, marginBottom: 4 }}>{card.value}</div>
                      <div style={{ fontSize: 11, color: subCol }}>{card.label}</div>
                    </div>
                  ))}
                </div>

                {stats.studentStats.length > 0 && (
                  <div style={{ borderRadius: 16, background: cardBg, border: `1.5px solid ${borderCol}`, marginBottom: 20, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: textCol }}>👨‍🎓 أداء الطلاب</span>
                      <span style={{ fontSize: 12, color: subCol }}>{stats.studentStats.length} طالب</span>
                    </div>
                    {stats.studentStats.map((s, i) => {
                      const gradeColor = s.avgGrade === null ? subCol : s.avgGrade >= 70 ? BRAND.gold : s.avgGrade >= 50 ? BRAND.orange : BRAND.crimson
                      return (
                        <div key={s.id} style={{ padding: '14px 18px', borderBottom: i < stats.studentStats.length - 1 ? `1px solid ${borderCol}` : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${themeColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: themeColor, flexShrink: 0 }}>
                            {i + 1}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: textCol }}>{s.name}</span>
                              <span style={{ fontSize: 12, color: subCol }}>{s.responseRate}% استجابة</span>
                            </div>
                            <div style={{ height: 6, borderRadius: 3, background: inputBg, overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 3, width: `${s.responseRate}%`, background: `linear-gradient(90deg,${themeColor},${BRAND.gold})`, transition: 'width 0.6s ease' }} />
                            </div>
                          </div>
                          <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 50 }}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: gradeColor }}>
                              {s.avgGrade !== null ? `${s.avgGrade}%` : '—'}
                            </div>
                            <div style={{ fontSize: 10, color: subCol }}>{s.graded} مصحح</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {stats.assignmentStats.length > 0 && (
                  <div style={{ borderRadius: 16, background: cardBg, border: `1.5px solid ${borderCol}`, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: textCol }}>📋 أداء المهام</span>
                      <span style={{ fontSize: 12, color: subCol }}>من الأصعب للأسهل</span>
                    </div>
                    {stats.assignmentStats.map((a, i) => {
                      const pct        = a.avgPercent ?? 0
                      const barColor   = a.avgPercent === null ? borderCol : pct >= 70 ? BRAND.gold : pct >= 50 ? BRAND.orange : BRAND.crimson
                      const gradeColor = a.avgPercent === null ? subCol : pct >= 70 ? BRAND.gold : pct >= 50 ? BRAND.orange : BRAND.crimson
                      return (
                        <div key={a.id} style={{ padding: '14px 18px', borderBottom: i < stats.assignmentStats.length - 1 ? `1px solid ${borderCol}` : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: textCol, marginBottom: 2 }}>{a.title}</div>
                              <div style={{ fontSize: 11, color: subCol }}>
                                {a.submitted} إجابة {a.pending > 0 && <span style={{ color: BRAND.orange }}>• {a.pending} معلّق</span>}
                              </div>
                            </div>
                            <div style={{ textAlign: 'center', flexShrink: 0, marginRight: 12 }}>
                              <div style={{ fontSize: 16, fontWeight: 900, color: gradeColor }}>
                                {a.avgGrade !== null ? `${a.avgGrade}%` : '—'}
                              </div>
                            </div>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: inputBg, overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: barColor, transition: 'width 0.6s ease' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

      {/* شريط التنقل — مع زر "الاختبارات" المستقل */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: headerBg, backdropFilter: 'blur(20px)', borderTop: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-around', padding: '8px 0 14px' }}>
        <button
          onClick={() => router.push('/teacher/quizzes')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px', borderRadius: 10, color: subCol, position: 'relative', transition: 'all 0.2s' }}>
          <span style={{ fontSize: 20 }}>🎯</span>
          <span style={{ fontSize: 10, fontWeight: 600 }}>الاختبارات</span>
        </button>
        {TABS.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: tab === tb.id ? `${themeColor}16` : 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px', borderRadius: 10, color: tab === tb.id ? themeColor : subCol, position: 'relative', transition: 'all 0.2s' }}>
            <span style={{ fontSize: 20 }}>{tb.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === tb.id ? 800 : 600 }}>{tb.label}</span>
            {'badge' in tb && (tb as { badge: number }).badge > 0 && (
              <span style={{ position: 'absolute', top: 0, right: 2, background: BRAND.crimson, color: '#fff', width: 16, height: 16, borderRadius: '50%', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{(tb as { badge: number }).badge}</span>
            )}
          </button>
        ))}
      </nav>

      {/* ══ نافذة إنشاء فصل جديد (بلا تغيير) ══════════════════════════ */}
      {showNewG && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowNewG(false) }}>
          <div style={{ width: '100%', maxWidth: 560, borderRadius: 20, background: cardBg, border: `1px solid ${borderCol}`, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: themeColor, background: `${themeColor}14`, display: 'inline-block', padding: '3px 12px', borderRadius: 8, margin: 0 , fontFamily: BRAND.fontHeading }}>🏫 فصل جديد</h3>
              <button onClick={() => setShowNewG(false)} style={{ background: 'none', border: 'none', color: subCol, fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {gDone && <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(220,140,60,0.15)', color: BRAND.gold, fontSize: 14, fontWeight: 700, textAlign: 'center' }}>✅ تم إنشاء الفصل!</div>}
              {classError && <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(180,40,40,0.1)', color: BRAND.crimson, fontSize: 13, fontWeight: 700, textAlign: 'center' }}>⚠️ {classError}</div>}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 6 }}>اسم الفصل *</label>
                <input value={gName} onChange={e => setGName(e.target.value)} placeholder="مثال: الصف 12أ، المتفوقون" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 6 }}>المادة</label>
                  <select value={gSubject} onChange={e => setGSubject(e.target.value)} style={inputStyle}>
                    <option value="">-- بلا مادة محدَّدة --</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 6 }}>المرحلة/المستوى</label>
                  <input value={gLevel} onChange={e => setGLevel(e.target.value)} placeholder="مثال: الصف 12" style={inputStyle} />
                </div>
              </div>
              <p style={{ fontSize: 12, color: subCol, margin: 0 }}>بعد الإنشاء، افتح الفصل لإضافة الطلاب إليه.</p>
              <button onClick={createClass} disabled={creatingG || !gName.trim()}
                style={{ padding: '13px', borderRadius: 12, border: 'none', background: gName.trim() ? BRAND.gradMain : borderCol, color: '#1a1a2e', fontWeight: 900, fontSize: 15, cursor: gName.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {creatingG ? <><span style={{ width: 16, height: 16, border: '2px solid #1a1a2e44', borderTopColor: '#1a1a2e', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />جارٍ الإنشاء...</> : '✅ إنشاء الفصل'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ نافذة تفاصيل الفصل (بلا تغيير) ══════════════════════════════ */}
      {openClass && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setOpenClass(null) }}>
          <div style={{ width: '100%', maxWidth: 600, maxHeight: '90vh', borderRadius: 20, background: cardBg, border: `1px solid ${borderCol}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: themeColor, background: `${themeColor}14`, display: 'inline-block', padding: '3px 12px', borderRadius: 8, margin: 0 , fontFamily: BRAND.fontHeading }}>🏫 {openClass.name}</h3>
                <p style={{ fontSize: 12, color: subCol, margin: '4px 0 0' }}>{openClass.students.length} طالب</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => deleteClass(openClass.id)}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(180,40,40,0.4)', background: 'rgba(180,40,40,0.1)', color: BRAND.crimson, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                  🗑️ حذف
                </button>
                <button onClick={() => setOpenClass(null)} style={{ background: 'none', border: 'none', color: subCol, fontSize: 22, cursor: 'pointer' }}>✕</button>
              </div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>
              {loadingClassDetail ? (
                <p style={{ color: subCol, fontSize: 13, textAlign: 'center' }}>⏳ جارٍ التحميل...</p>
              ) : (
                <>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: textCol, marginBottom: 12 , fontFamily: BRAND.fontHeading }}>طلاب الفصل:</h4>
                  {openClass.students.length === 0
                    ? <p style={{ color: subCol, fontSize: 13 }}>لا يوجد طلاب بعد</p>
                    : openClass.students.map(m => (
                      <div key={m.member_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: inputBg, border: `1px solid ${borderCol}`, marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: textCol }}>👨‍🎓 {m.full_name}</div>
                          <div style={{ fontSize: 11, color: subCol }}>{m.email}{m.avg_score != null ? ` • متوسط: ${m.avg_score}` : ''}</div>
                        </div>
                        <button onClick={() => removeFromClass(openClass.id, m.student_id)}
                          style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(180,40,40,0.4)', background: 'rgba(180,40,40,0.1)', color: BRAND.crimson, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                          إزالة
                        </button>
                      </div>
                    ))}

                  <h4 style={{ fontSize: 14, fontWeight: 700, color: textCol, marginTop: 20, marginBottom: 12 , fontFamily: BRAND.fontHeading }}>إضافة طلاب:</h4>
                  {students
                    .filter(s => !openClass.students.some(m => m.student_id === s.id))
                    .map(s => (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: inputBg, border: `1px solid ${borderCol}`, marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 14, color: textCol }}>👨‍🎓 {s.name}</div>
                          <div style={{ fontSize: 11, color: subCol }}>{s.email}</div>
                        </div>
                        <button onClick={() => addToClass(openClass.id, s.id)} disabled={addingMember}
                          style={{ padding: '4px 12px', borderRadius: 8, border: 'none', background: themeColor, color: '#1a1a2e', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
                          ＋ إضافة
                        </button>
                      </div>
                    ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ نافذة مراجعة الإجابة (بلا تغيير) ══════════════════════════════ */}
      {openSub && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setOpenSub(null) }}>
          <div style={{ width: '100%', maxWidth: 700, maxHeight: '92vh', borderRadius: 20, background: cardBg, border: `1px solid ${borderCol}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: themeColor, background: `${themeColor}14`, display: 'inline-block', padding: '3px 12px', borderRadius: 8, margin: 0 , fontFamily: BRAND.fontHeading }}>✏️ مراجعة إجابة — {openSub.users?.name}</h3>
              <button onClick={() => setOpenSub(null)} style={{ background: 'none', border: 'none', color: subCol, fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>
              {reviewDone ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                  <h3 style={{ color: BRAND.gold, fontSize: 20, fontWeight: 900, fontFamily: BRAND.fontHeading }}>تم حفظ التصحيح!</h3>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, color: themeColor, fontWeight: 700, marginBottom: 8 }}>✍️ إجابة الطالب:</div>
                    <div style={{ padding: '14px 16px', borderRadius: 12, background: inputBg, border: `1px solid ${borderCol}`, fontSize: 14, color: textCol, lineHeight: 1.7 }}>{openSub.answer_text}</div>
                  </div>
                  {openSub.ai_grade !== null && openSub.ai_grade !== undefined && (
                    <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(180,40,40,0.1)', border: '1px solid rgba(180,40,40,0.3)', marginBottom: 20 }}>
                      <div style={{ fontSize: 13, color: BRAND.crimson, fontWeight: 700, marginBottom: 6 }}>🤖 تقييم الذكاء الاصطناعي: {openSub.ai_grade} درجة</div>
                      {openSub.ai_feedback && <p style={{ fontSize: 13, color: textCol, margin: 0, lineHeight: 1.6 }}>{openSub.ai_feedback}</p>}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14, marginBottom: 14 }}>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 6 }}>الدرجة</label>
                      <input type="number" min={0} value={tGrade} onChange={e => setTGrade(e.target.value)} placeholder="0" style={{ ...inputStyle, textAlign: 'center', fontSize: 20, fontWeight: 900 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 6 }}>تغذية راجعة للطالب</label>
                      <textarea value={tFeedback} onChange={e => setTFeedback(e.target.value)} placeholder="اكتب ملاحظاتك للطالب..." rows={3} style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }} />
                    </div>
                  </div>
                  <button onClick={submitReview} disabled={reviewing || !tGrade}
                    style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: tGrade ? BRAND.gradMain : borderCol, color: '#1a1a2e', fontWeight: 900, fontSize: 15, cursor: tGrade ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {reviewing ? <><span style={{ width: 18, height: 18, border: '3px solid #1a1a2e44', borderTopColor: '#1a1a2e', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />جارٍ الحفظ...</> : '💾 حفظ التصحيح وإرسال الدرجة'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ نافذة عرض الوسائط (بلا تغيير) ══════════════════════════════════ */}
      {openMedia && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setOpenMedia(null) }}>
          <div style={{ width: '100%', maxWidth: 760, borderRadius: 20, background: cardBg, border: `1px solid ${borderCol}`, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: themeColor, background: `${themeColor}14`, display: 'inline-block', padding: '3px 12px', borderRadius: 8, margin: 0 , fontFamily: BRAND.fontHeading }}>{openMedia.title}</h3>
              <button onClick={() => setOpenMedia(null)} style={{ background: 'none', border: 'none', color: subCol, fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 16 }}>
              {openMedia.type === 'video'
                ? openMedia.embed_url && (openMedia.embed_url.includes('youtube') || openMedia.embed_url.includes('vimeo') || openMedia.embed_url.includes('player'))
                  ? <iframe src={openMedia.embed_url} style={{ width: '100%', height: 420, border: 'none', borderRadius: 12 }} allowFullScreen title={openMedia.title} />
                  : <video controls style={{ width: '100%', borderRadius: 12, maxHeight: 420 }} src={openMedia.url} />
                : <audio controls style={{ width: '100%' }} src={openMedia.url} />}
              {openMedia.link_type === 'link' && (
                <a href={openMedia.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 12, fontSize: 13, color: themeColor, textAlign: 'center', textDecoration: 'none' }}>
                  🔗 فتح الرابط الأصلي
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── مُزال: مودال "⚙️ الإعدادات" — كان يحتوي فقط اختيار لون
           المظهر (المُلغى الآن)، فلم يبقَ فيه محتوى فعلي. الوضع
           الليلي/النهاري له زرّه المستقل في الهيدر (🌙/☀️) بالفعل ── */}
    </div>
  )
}

function EmptyState({ icon, title, sub, cardBg = '#FDFAF5', borderCol = 'rgba(192,57,43,0.15)', textCol = '#1A1221', subCol = '#6B5050' }: {
  icon: string; title: string; sub: string
  cardBg?: string; borderCol?: string; textCol?: string; subCol?: string
}) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', background: cardBg, borderRadius: 18, border: `1.5px solid ${borderCol}` }}>
      <div style={{ fontSize: 52, marginBottom: 14 }}>{icon}</div>
      <h3 style={{ fontSize: 17, fontWeight: 800, color: textCol, marginBottom: 8 , fontFamily: BRAND.fontHeading }}>{title}</h3>
      <p style={{ fontSize: 14, color: subCol, opacity: 0.8 }}>{sub}</p>
    </div>
  )
}
