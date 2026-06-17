'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ar } from '@/lib/constants/ar'
import MarkdownRenderer from '@/components/MarkdownRenderer'

const c = ar.common

interface User       { id: string; name: string; role: string; user_type: string; theme_color?: string; theme_mode?: string }
interface Subject    { id: string; name: string; icon?: string; grade?: string }
interface Student    { id: string; name: string; email: string; allowed_grades?: string[] }
interface GroupMember { id: string; student_id: string; users: { id: string; name: string; email: string } }
interface Group      { id: string; name: string; subject_id: string; level: string; created_at: string; group_members: GroupMember[] }
interface Assignment { id: string; title: string; content: string; tool: string; deadline?: string; max_grade: number; target_type: string; created_at: string }
interface Submission { id: string; assignment_id: string; student_id: string; answer_text: string; submitted_at: string; ai_grade?: number; ai_feedback?: string; teacher_grade?: number; teacher_feedback?: string; status: string; users?: { name: string; email: string } }
interface Media      { id: string; title: string; type: 'video' | 'audio'; url: string; embed_url?: string; link_type: string; thumbnail?: string; subject_id: string; created_at: string }
interface Message    { id: string; from_id: string; to_id: string; content: string; image_url?: string; is_read: boolean; created_at: string }

type Tab = 'assignments' | 'groups' | 'submissions' | 'media' | 'messages' | 'students' | 'stats'

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

const THEME_COLORS = [
  { name: 'ذهبي',    value: '#f9d423', gradient: 'linear-gradient(135deg,#f9d423,#ff4e50)' },
  { name: 'أزرق',    value: '#4facfe', gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)' },
  { name: 'أخضر',    value: '#43e97b', gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)' },
  { name: 'بنفسجي',  value: '#a78bfa', gradient: 'linear-gradient(135deg,#a78bfa,#ec4899)' },
  { name: 'برتقالي', value: '#f97316', gradient: 'linear-gradient(135deg,#f97316,#ef4444)' },
  { name: 'وردي',    value: '#ec4899', gradient: 'linear-gradient(135deg,#ec4899,#8b5cf6)' },
]

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
  const [themeColor,   setThemeColor]   = useState('#f9d423')
  const [showSettings, setShowSettings] = useState(false)
  const [tab,          setTab]          = useState<Tab>('assignments')

  const [subjects,    setSubjects]    = useState<Subject[]>([])
  const [students,    setStudents]    = useState<Student[]>([])
  const [groups,      setGroups]      = useState<Group[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [media,       setMedia]       = useState<Media[]>([])
  const [unread,      setUnread]      = useState(0)
  const [stats,       setStats]       = useState<Stats | null>(null)
  const [statsLoading,setStatsLoading]= useState(false)

  // ── نموذج المهمة ──────────────────────────────────────────────
  const [aTitle,    setATitle]    = useState('')
  const [aContent,  setAContent]  = useState('')
  const [aSubject,  setASubject]  = useState('')
  const [aTarget,   setATarget]   = useState<'all'|'group'|'student'>('all')
  const [aTargetId, setATargetId] = useState('')
  const [aDeadline, setADeadline] = useState('')
  const [aGrade,    setAGrade]    = useState(10)
  const [sendingA,  setSendingA]  = useState(false)
  const [aDone,     setADone]     = useState(false)

  // ── نموذج المجموعة ────────────────────────────────────────────
  const [gName,       setGName]       = useState('')
  const [gSubject,    setGSubject]    = useState('')
  const [gLevel,      setGLevel]      = useState('all')
  const [gStudents,   setGStudents]   = useState<string[]>([])
  const [creatingG,   setCreatingG]   = useState(false)
  const [gDone,       setGDone]       = useState(false)
  const [showNewG,    setShowNewG]    = useState(false)
  const [openGroup,   setOpenGroup]   = useState<Group | null>(null)
  const [addingMember,setAddingMember]= useState(false)

  // ── نموذج الوسائط ─────────────────────────────────────────────
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

  // ── مراجعة الإجابات ───────────────────────────────────────────
  const [openSub,    setOpenSub]    = useState<Submission | null>(null)
  const [tGrade,     setTGrade]     = useState('')
  const [tFeedback,  setTFeedback]  = useState('')
  const [reviewing,  setReviewing]  = useState(false)
  const [reviewDone, setReviewDone] = useState(false)

  // ── الرسائل ───────────────────────────────────────────────────
  const [selStudent, setSelStudent] = useState<Student | null>(null)
  const [msgList,    setMsgList]    = useState<Message[]>([])
  const [newMsg,     setNewMsg]     = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)

  // ── تحميل المستخدم ────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('mosaed_user')
    if (!saved) { router.replace('/'); return }
    try {
      const u = JSON.parse(saved) as User
      if (u.user_type === 'student') { router.replace('/student'); return }
      setUser(u)
      if (u.theme_color) setThemeColor(u.theme_color)
    } catch { router.replace('/') }
  }, [router])


  useEffect(() => {
    if (!user) return
    fetch('/api/subjects').then(r => r.json()).then(d => setSubjects(d.subjects ?? []))
    fetch('/api/users?userType=student').then(r => r.json()).then(d => setStudents(d.users ?? []))
  }, [user])

  useEffect(() => {
    if (!user) return
    if (tab === 'assignments') fetch(`/api/assignments?teacherId=${user.id}`).then(r => r.json()).then(d => setAssignments(d.assignments ?? []))
    if (tab === 'groups')      fetch(`/api/groups?teacherId=${user.id}`).then(r => r.json()).then(d => setGroups(d.groups ?? []))
    if (tab === 'submissions') fetch(`/api/submissions?teacherId=${user.id}`).then(r => r.json()).then(d => setSubmissions(d.submissions ?? []))
    if (tab === 'media')       fetch(`/api/teacher-media?teacherId=${user.id}`).then(r => r.json()).then(d => setMedia(d.media ?? []))
    if (tab === 'messages')    fetch(`/api/messages?userId=${user.id}&unreadOnly=true`).then(r => r.json()).then(d => setUnread(d.unread ?? 0))
    if (tab === 'stats') {
      setStatsLoading(true)
      fetch(`/api/stats?teacherId=${user.id}`)
        .then(r => r.json()).then(d => setStats(d))
        .finally(() => setStatsLoading(false))
    }
  }, [user, tab])

  useEffect(() => {
    if (!user || !selStudent) return
    fetch(`/api/messages?userId=${user.id}&otherId=${selStudent.id}`).then(r => r.json()).then(d => setMsgList(d.messages ?? []))
  }, [user, selStudent])

  const bg        = '#F5F0E8'
  const cardBg    = '#FDFAF5'
  const textCol   = '#1A1221'
  const subCol    = '#6B5050'
  const borderCol = 'rgba(192,57,43,0.15)'
  const inputBg   = 'rgba(192,57,43,0.05)'
  const headerBg  = 'rgba(245,240,232,0.97)'

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: `1.5px solid ${borderCol}`, background: inputBg,
    color: textCol, fontSize: 14, fontFamily: 'inherit',
    colorScheme: 'light',
  }

  // ── إرسال مهمة ────────────────────────────────────────────────
  async function sendAssignment() {
    if (!user || !aTitle.trim() || !aContent.trim()) return
    setSendingA(true)
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: user.id, subjectId: aSubject || null, title: aTitle, content: aContent, tool: 'worksheet', targetType: aTarget, targetId: aTargetId || null, deadline: aDeadline || null, maxGrade: aGrade }),
      })
      if (res.ok) {
        setADone(true); setATitle(''); setAContent(''); setASubject('')
        setATarget('all'); setATargetId(''); setADeadline('')
        setTimeout(() => setADone(false), 3000)
        fetch(`/api/assignments?teacherId=${user.id}`).then(r => r.json()).then(d => setAssignments(d.assignments ?? []))
      }
    } finally { setSendingA(false) }
  }

  // ── إنشاء مجموعة ──────────────────────────────────────────────
  async function createGroup() {
    if (!user || !gName.trim()) return
    setCreatingG(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: user.id, name: gName, subjectId: gSubject || null, level: gLevel, studentIds: gStudents }),
      })
      if (res.ok) {
        setGDone(true); setGName(''); setGSubject(''); setGStudents([]); setGLevel('all')
        setTimeout(() => { setGDone(false); setShowNewG(false) }, 2000)
        fetch(`/api/groups?teacherId=${user.id}`).then(r => r.json()).then(d => setGroups(d.groups ?? []))
      }
    } finally { setCreatingG(false) }
  }

  // ── إضافة طالب لمجموعة ────────────────────────────────────────
  async function addToGroup(groupId: string, studentId: string) {
    setAddingMember(true)
    try {
      await fetch('/api/groups', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, addStudentIds: [studentId] }),
      })
      fetch(`/api/groups?teacherId=${user?.id}`).then(r => r.json()).then(d => {
        setGroups(d.groups ?? [])
        const updated = d.groups?.find((g: Group) => g.id === groupId)
        if (updated) setOpenGroup(updated)
      })
    } finally { setAddingMember(false) }
  }

  // ── إزالة طالب من مجموعة ──────────────────────────────────────
  async function removeFromGroup(groupId: string, studentId: string) {
    await fetch('/api/groups', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, removeStudentIds: [studentId] }),
    })
    fetch(`/api/groups?teacherId=${user?.id}`).then(r => r.json()).then(d => {
      setGroups(d.groups ?? [])
      const updated = d.groups?.find((g: Group) => g.id === groupId)
      if (updated) setOpenGroup(updated)
    })
  }

  // ── حذف مجموعة ────────────────────────────────────────────────
  async function deleteGroup(groupId: string) {
    if (!confirm('هل تريد حذف هذه المجموعة؟')) return
    await fetch('/api/groups', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, teacherId: user?.id }),
    })
    setOpenGroup(null)
    fetch(`/api/groups?teacherId=${user?.id}`).then(r => r.json()).then(d => setGroups(d.groups ?? []))
  }

  // ── رفع وسائط ─────────────────────────────────────────────────
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

  // ── مراجعة إجابة ──────────────────────────────────────────────
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

  // ── إرسال رسالة ───────────────────────────────────────────────
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
      await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, theme_color: themeColor, theme_mode: 'light' }) })
      const updated = { ...user, theme_color: themeColor, theme_mode: 'light' }
      setUser(updated); localStorage.setItem('mosaed_user', JSON.stringify(updated))
    } finally { setShowSettings(false) }
  }

  function handleLogout() { localStorage.removeItem('mosaed_user'); localStorage.removeItem('mosaed_session'); router.replace('/') }

  if (!user) return null

  const pendingReviews = submissions.filter(s => s.status === 'submitted' && !s.teacher_grade).length

  const TABS = [
    { id: 'assignments' as Tab, icon: '📝', label: 'مهمة جديدة' },
    { id: 'groups'      as Tab, icon: '👥', label: 'المجموعات' },
    { id: 'submissions' as Tab, icon: '📬', label: 'الإجابات',  badge: pendingReviews },
    { id: 'media'       as Tab, icon: '🎥', label: 'الوسائط' },
    { id: 'messages'    as Tab, icon: '💬', label: 'الرسائل',   badge: unread },
    { id: 'students'    as Tab, icon: '👤', label: 'الطلاب' },
    { id: 'stats'       as Tab, icon: '📊', label: 'تحليلات' },
  ]

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: bg, color: textCol, fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif", paddingBottom: 90 }}>
      <style>{`
        * { box-sizing: border-box; } body { margin: 0; }
        @keyframes spin   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.3s ease; }
        textarea:focus, input:focus, select:focus { outline: none; }
        select option { background-color: ${'#FDFAF5'} !important; color: ${textCol} !important; }
        select { color-scheme: light; }
      `}</style>

      {/* الرأس */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: headerBg, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${borderCol}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>🌙</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: themeColor }}>{c.platformName}</div>
            <div style={{ fontSize: 13, color: subCol, marginTop: 2 }}>👨‍🏫 {user.name} • معلم</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => router.push('/dashboard')} style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: `1.5px solid ${themeColor}44`, background: `${themeColor}15`, color: themeColor, cursor: 'pointer', fontFamily: 'inherit' }}>✨ أدوات التوليد</button>
          <button onClick={() => setShowSettings(true)} style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: `1.5px solid ${borderCol}`, background: 'transparent', color: subCol, cursor: 'pointer', fontFamily: 'inherit' }}>⚙️</button>
          <button onClick={handleLogout} style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: '1.5px solid rgba(252,129,129,0.4)', background: 'rgba(252,129,129,0.1)', color: '#fc8181', cursor: 'pointer', fontFamily: 'inherit' }}>🚪 خروج</button>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── إرسال مهمة ── */}
        {tab === 'assignments' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 900, color: themeColor, marginBottom: 20 }}>📝 إرسال مهمة جديدة</h2>
            {aDone && <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(67,233,123,0.15)', border: '1px solid rgba(67,233,123,0.4)', color: '#43e97b', fontSize: 14, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>✅ تم إرسال المهمة بنجاح!</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 6 }}>عنوان المهمة *</label>
                <input value={aTitle} onChange={e => setATitle(e.target.value)} placeholder="مثال: ورقة عمل النعت" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 6 }}>المادة</label>
                <select value={aSubject} onChange={e => setASubject(e.target.value)} style={inputStyle}>
                  <option value="">-- اختر المادة (اختياري) --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} {s.grade ? `— الصف ${s.grade}` : ''}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 6 }}>محتوى المهمة * (اكتب الأسئلة كاملة)</label>
                <textarea value={aContent} onChange={e => setAContent(e.target.value)} placeholder="١- عرّف النعت.&#10;٢- اذكر أنواع النعت مع مثال لكل نوع.&#10;٣- أعرب ما تحته خط..." rows={8} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }} />
                <div style={{ fontSize: 11, color: subCol, marginTop: 4, textAlign: 'left' }}>{aContent.length} حرف</div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 8 }}>إرسال إلى</label>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  {([['all', '👥 الجميع'], ['student', '👤 طالب محدد'], ['group', '👨‍👩‍👧 مجموعة']] as const).map(([val, label]) => (
                    <button key={val} onClick={() => { setATarget(val); setATargetId('') }}
                      style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: `2px solid ${aTarget === val ? themeColor : borderCol}`, background: aTarget === val ? `${themeColor}18` : 'transparent', color: aTarget === val ? themeColor : subCol, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
                      {label}
                    </button>
                  ))}
                </div>
                {aTarget === 'student' && (
                  <select value={aTargetId} onChange={e => setATargetId(e.target.value)} style={inputStyle}>
                    <option value="">-- اختر الطالب --</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
                  </select>
                )}
                {aTarget === 'group' && (
                  <select value={aTargetId} onChange={e => setATargetId(e.target.value)} style={inputStyle}>
                    <option value="">-- اختر المجموعة --</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.group_members?.length ?? 0} طالب)</option>)}
                  </select>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 6 }}>⏰ الموعد النهائي</label>
                  <input type="datetime-local" value={aDeadline} onChange={e => setADeadline(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 6 }}>🎯 الدرجة الكاملة</label>
                  <input type="number" min={1} max={100} value={aGrade} onChange={e => setAGrade(Number(e.target.value))} style={inputStyle} />
                </div>
              </div>
              <button onClick={sendAssignment} disabled={sendingA || !aTitle.trim() || !aContent.trim()}
                style={{ padding: '14px', borderRadius: 14, border: 'none', background: (aTitle && aContent) ? `linear-gradient(135deg,${themeColor},#ff4e50)` : borderCol, color: '#1a1a2e', fontWeight: 900, fontSize: 16, cursor: (aTitle && aContent) ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {sendingA ? <><span style={{ width: 18, height: 18, border: '3px solid #1a1a2e44', borderTopColor: '#1a1a2e', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />جارٍ الإرسال...</> : '📤 إرسال المهمة'}
              </button>
            </div>
            {assignments.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: textCol, marginBottom: 14 }}>📋 المهام المرسلة ({assignments.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {assignments.map(a => (
                    <div key={a.id} style={{ padding: '14px 16px', borderRadius: 14, background: cardBg, border: `1.5px solid ${borderCol}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: textCol }}>{a.title}</div>
                          <div style={{ fontSize: 12, color: subCol, marginTop: 4 }}>
                            {a.target_type === 'all' ? '👥 الجميع' : a.target_type === 'student' ? '👤 طالب' : '👨‍👩‍👧 مجموعة'}
                            {a.deadline && ` • ⏰ ${new Date(a.deadline).toLocaleDateString('ar-KW', { month: 'short', day: 'numeric' })}`}
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

        {/* ── المجموعات ── */}
        {tab === 'groups' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: themeColor, margin: 0 }}>👥 المجموعات ({groups.length})</h2>
              <button onClick={() => setShowNewG(true)}
                style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${themeColor},#ff4e50)`, color: '#1a1a2e', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                ＋ مجموعة جديدة
              </button>
            </div>

            {groups.length === 0
              ? <EmptyState icon="👥" title="لا توجد مجموعات بعد" sub="أنشئ مجموعة وأضف طلابك إليها" />
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
                  {groups.map(g => (
                    <div key={g.id} style={{ padding: '18px 20px', borderRadius: 16, background: cardBg, border: `1.5px solid ${borderCol}`, cursor: 'pointer' }}
                      onClick={() => setOpenGroup(g)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ fontSize: 32 }}>👥</div>
                        <span style={{ fontSize: 12, background: `${themeColor}18`, color: themeColor, padding: '3px 10px', borderRadius: 8, fontWeight: 700 }}>
                          {g.group_members?.length ?? 0} طالب
                        </span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: textCol, marginBottom: 6 }}>{g.name}</div>
                      <div style={{ fontSize: 12, color: subCol }}>
                        {g.level !== 'all' ? `المستوى: ${g.level}` : 'كل المستويات'}
                      </div>
                      {g.group_members?.slice(0, 3).map(m => (
                        <div key={m.id} style={{ fontSize: 12, color: subCol, marginTop: 4 }}>• {m.users?.name}</div>
                      ))}
                      {(g.group_members?.length ?? 0) > 3 && (
                        <div style={{ fontSize: 12, color: themeColor, marginTop: 4 }}>+{(g.group_members?.length ?? 0) - 3} آخرين</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ── الإجابات ── */}
        {tab === 'submissions' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 900, color: themeColor, marginBottom: 20 }}>
              📬 إجابات الطلاب
              {pendingReviews > 0 && <span style={{ fontSize: 13, marginRight: 10, background: '#f97316', color: '#fff', padding: '2px 10px', borderRadius: 8 }}>{pendingReviews} تحتاج مراجعة</span>}
            </h2>
            {submissions.length === 0
              ? <EmptyState icon="📭" title="لا توجد إجابات بعد" sub="ستظهر إجابات الطلاب هنا" />
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {submissions.map(sub => {
                    const isPending = sub.status === 'submitted' && !sub.teacher_grade
                    return (
                      <div key={sub.id} style={{ padding: '16px 18px', borderRadius: 14, background: cardBg, border: `1.5px solid ${isPending ? '#f9741644' : '#43e97b44'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: textCol }}>{sub.users?.name ?? 'طالب'}</div>
                            <div style={{ fontSize: 12, color: subCol, marginTop: 3 }}>{new Date(sub.submitted_at).toLocaleDateString('ar-KW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            {sub.ai_grade !== null && sub.ai_grade !== undefined && <div style={{ fontSize: 12, color: '#4facfe', fontWeight: 700 }}>🤖 AI: {sub.ai_grade}</div>}
                            {sub.teacher_grade !== null && sub.teacher_grade !== undefined && <div style={{ fontSize: 13, color: '#43e97b', fontWeight: 800 }}>✅ {sub.teacher_grade}</div>}
                            {isPending && <div style={{ fontSize: 12, color: '#f97316', fontWeight: 700 }}>⏳ تحتاج مراجعة</div>}
                          </div>
                        </div>
                        <div style={{ padding: '10px 12px', borderRadius: 10, background: inputBg, border: `1px solid ${borderCol}`, marginBottom: 12, fontSize: 13, color: subCol, lineHeight: 1.6 }}>
                          {sub.answer_text.slice(0, 150)}{sub.answer_text.length > 150 ? '...' : ''}
                        </div>
                        <button onClick={() => { setOpenSub(sub); setTGrade(String(sub.teacher_grade ?? sub.ai_grade ?? '')); setTFeedback(sub.teacher_feedback ?? sub.ai_feedback ?? '') }}
                          style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: isPending ? `linear-gradient(135deg,${themeColor},#ff4e50)` : `${themeColor}22`, color: isPending ? '#1a1a2e' : themeColor, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {isPending ? '✏️ مراجعة وتصحيح' : '👁️ عرض التفاصيل'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
          </div>
        )}

        {/* ── الوسائط ── */}
        {tab === 'media' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 900, color: themeColor, marginBottom: 20 }}>🎥 إضافة وسائط تعليمية</h2>
            {mDone && <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(67,233,123,0.15)', border: '1px solid rgba(67,233,123,0.4)', color: '#43e97b', fontSize: 14, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>✅ تمت الإضافة بنجاح!</div>}
            {mError && <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(252,129,129,0.12)', border: '1px solid rgba(252,129,129,0.4)', color: '#fc8181', fontSize: 13, marginBottom: 14 }}>⚠️ {mError}</div>}
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
                style={{ padding: '14px', borderRadius: 14, border: 'none', background: (mTitle && (mUrl || mFile)) ? `linear-gradient(135deg,${themeColor},#ff4e50)` : borderCol, color: '#1a1a2e', fontWeight: 900, fontSize: 15, cursor: (mTitle && (mUrl || mFile)) ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {uploadingM ? <><span style={{ width: 18, height: 18, border: '3px solid #1a1a2e44', borderTopColor: '#1a1a2e', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />جارٍ الرفع...</> : '📤 إضافة الوسيط'}
              </button>
            </div>
            {media.length > 0 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: textCol, marginBottom: 14 }}>📚 الوسائط المضافة ({media.length})</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
                  {media.map(m => (
                    <button key={m.id} onClick={() => setOpenMedia(m)}
                      style={{ borderRadius: 14, overflow: 'hidden', border: `1.5px solid ${borderCol}`, background: cardBg, cursor: 'pointer', textAlign: 'right', fontFamily: 'inherit', padding: 0 }}>
                      <div style={{ height: 110, background: `${themeColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, position: 'relative' }}>
                        {m.link_type === 'link' && m.embed_url?.includes('youtube') ? '▶️' : m.type === 'video' ? '🎬' : '🎵'}
                        {m.link_type === 'link' && <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, background: '#4facfe', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>🔗</span>}
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

        {/* ── الرسائل ── */}
        {tab === 'messages' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 900, color: themeColor, marginBottom: 20 }}>💬 رسائل الطلاب</h2>
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
                      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${borderCol}`, fontSize: 14, fontWeight: 700, color: themeColor }}>💬 {selStudent.name}</div>
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

        {/* ── الطلاب ── */}
        {tab === 'students' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 900, color: themeColor, marginBottom: 20 }}>👤 الطلاب ({students.length})</h2>
            {students.length === 0
              ? <EmptyState icon="👥" title="لا يوجد طلاب بعد" sub="سيظهر الطلاب هنا بعد موافقة المدير" />
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

        {/* ── التحليلات ── */}
        {tab === 'stats' && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 900, color: themeColor, marginBottom: 20 }}>📊 تحليلات الأداء</h2>

            {statsLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: subCol }}>
                <div style={{ width: 48, height: 48, border: `4px solid ${themeColor}33`, borderTopColor: themeColor, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ margin: 0 }}>جارٍ تحميل التحليلات...</p>
              </div>
            ) : !stats ? (
              <EmptyState icon="📊" title="لا توجد بيانات بعد" sub="أرسل مهاماً وصحّح إجابات لترى التحليلات" />
            ) : (
              <>
                {/* بطاقات الملخص */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
                  {[
                    { icon: '👥', label: 'الطلاب',         value: stats.summary.totalStudents,      color: '#4facfe' },
                    { icon: '📝', label: 'المهام',          value: stats.summary.totalAssignments,   color: '#a78bfa' },
                    { icon: '📬', label: 'الإجابات',        value: stats.summary.totalSubmissions,   color: '#43e97b' },
                    { icon: '🎯', label: 'متوسط الدرجات',  value: stats.summary.avgGrade || '—',    color: '#f9d423' },
                    { icon: '⏳', label: 'تحتاج مراجعة',   value: stats.summary.pendingReview,      color: '#f97316' },
                    { icon: '📈', label: 'نسبة الاستجابة', value: `${stats.summary.responseRate}%`, color: '#ec4899' },
                  ].map((card, i) => (
                    <div key={i} style={{ padding: '16px 12px', borderRadius: 14, background: cardBg, border: `1.5px solid ${card.color}33`, textAlign: 'center' }}>
                      <div style={{ fontSize: 26, marginBottom: 6 }}>{card.icon}</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: card.color, marginBottom: 4 }}>{card.value}</div>
                      <div style={{ fontSize: 11, color: subCol }}>{card.label}</div>
                    </div>
                  ))}
                </div>

                {/* أداء الطلاب */}
                {stats.studentStats.length > 0 && (
                  <div style={{ borderRadius: 16, background: cardBg, border: `1.5px solid ${borderCol}`, marginBottom: 20, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: textCol }}>👨‍🎓 أداء الطلاب</span>
                      <span style={{ fontSize: 12, color: subCol }}>{stats.studentStats.length} طالب</span>
                    </div>
                    {stats.studentStats.map((s, i) => {
                      const gradeColor = s.avgGrade === null ? subCol : s.avgGrade >= 7 ? '#43e97b' : s.avgGrade >= 5 ? '#f9d423' : '#fc8181'
                      return (
                        <div key={s.id} style={{ padding: '14px 18px', borderBottom: i < stats.studentStats.length - 1 ? `1px solid ${borderCol}` : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                          {/* الترتيب */}
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${themeColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: themeColor, flexShrink: 0 }}>
                            {i + 1}
                          </div>
                          {/* الاسم + شريط الاستجابة */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: textCol }}>{s.name}</span>
                              <span style={{ fontSize: 12, color: subCol }}>{s.responseRate}% استجابة</span>
                            </div>
                            <div style={{ height: 6, borderRadius: 3, background: 'rgba(192,57,43,0.08)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 3, width: `${s.responseRate}%`, background: `linear-gradient(90deg,${themeColor},#ff4e50)`, transition: 'width 0.6s ease' }} />
                            </div>
                          </div>
                          {/* الدرجة */}
                          <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 50 }}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: gradeColor }}>
                              {s.avgGrade !== null ? s.avgGrade : '—'}
                            </div>
                            <div style={{ fontSize: 10, color: subCol }}>{s.graded} مصحح</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* أداء المهام */}
                {stats.assignmentStats.length > 0 && (
                  <div style={{ borderRadius: 16, background: cardBg, border: `1.5px solid ${borderCol}`, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: textCol }}>📋 أداء المهام</span>
                      <span style={{ fontSize: 12, color: subCol }}>من الأصعب للأسهل</span>
                    </div>
                    {stats.assignmentStats.map((a, i) => {
                      const pct        = a.avgPercent ?? 0
                      const barColor   = a.avgPercent === null ? borderCol : pct >= 70 ? '#43e97b' : pct >= 50 ? '#f9d423' : '#fc8181'
                      const gradeColor = a.avgPercent === null ? subCol : pct >= 70 ? '#43e97b' : pct >= 50 ? '#f9d423' : '#fc8181'
                      return (
                        <div key={a.id} style={{ padding: '14px 18px', borderBottom: i < stats.assignmentStats.length - 1 ? `1px solid ${borderCol}` : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: textCol, marginBottom: 2 }}>{a.title}</div>
                              <div style={{ fontSize: 11, color: subCol }}>
                                {a.submitted} إجابة {a.pending > 0 && <span style={{ color: '#f97316' }}>• {a.pending} معلّق</span>}
                              </div>
                            </div>
                            <div style={{ textAlign: 'center', flexShrink: 0, marginRight: 12 }}>
                              <div style={{ fontSize: 16, fontWeight: 900, color: gradeColor }}>
                                {a.avgGrade !== null ? `${a.avgGrade}/${a.maxGrade}` : '—'}
                              </div>
                              {a.avgPercent !== null && (
                                <div style={{ fontSize: 10, color: gradeColor }}>{a.avgPercent}%</div>
                              )}
                            </div>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: 'rgba(192,57,43,0.08)', overflow: 'hidden' }}>
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

      {/* شريط التنقل */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: headerBg, backdropFilter: 'blur(20px)', borderTop: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-around', padding: '8px 0 14px' }}>
        {TABS.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px', borderRadius: 10, color: tab === tb.id ? themeColor : subCol, position: 'relative', transition: 'all 0.2s' }}>
            <span style={{ fontSize: 20 }}>{tb.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === tb.id ? 800 : 600 }}>{tb.label}</span>
            {'badge' in tb && (tb as { badge: number }).badge > 0 && (
              <span style={{ position: 'absolute', top: 0, right: 2, background: '#fc8181', color: '#fff', width: 16, height: 16, borderRadius: '50%', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{(tb as { badge: number }).badge}</span>
            )}
          </button>
        ))}
      </nav>

      {/* ══ نافذة إنشاء مجموعة جديدة ══════════════════════════ */}
      {showNewG && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowNewG(false) }}>
          <div style={{ width: '100%', maxWidth: 560, borderRadius: 20, background: '#FDFAF5', border: `1px solid ${borderCol}`, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: themeColor, margin: 0 }}>👥 مجموعة جديدة</h3>
              <button onClick={() => setShowNewG(false)} style={{ background: 'none', border: 'none', color: subCol, fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {gDone && <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(67,233,123,0.15)', color: '#43e97b', fontSize: 14, fontWeight: 700, textAlign: 'center' }}>✅ تم إنشاء المجموعة!</div>}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 6 }}>اسم المجموعة *</label>
                <input value={gName} onChange={e => setGName(e.target.value)} placeholder="مثال: المجموعة أ، المتفوقون، الصف 12أ" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 6 }}>المادة</label>
                  <select value={gSubject} onChange={e => setGSubject(e.target.value)} style={inputStyle}>
                    <option value="">-- كل المواد --</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 6 }}>المستوى</label>
                  <select value={gLevel} onChange={e => setGLevel(e.target.value)} style={inputStyle}>
                    <option value="all">الكل</option>
                    <option value="advanced">متقدم</option>
                    <option value="intermediate">متوسط</option>
                    <option value="basic">أساسي</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: subCol, display: 'block', marginBottom: 8 }}>اختر الطلاب ({gStudents.length} محدد)</label>
                <div style={{ maxHeight: 200, overflowY: 'auto', border: `1.5px solid ${borderCol}`, borderRadius: 12, padding: 4 }}>
                  {students.map(s => (
                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', background: gStudents.includes(s.id) ? `${themeColor}12` : 'transparent' }}>
                      <input type="checkbox" checked={gStudents.includes(s.id)}
                        onChange={e => setGStudents(prev => e.target.checked ? [...prev, s.id] : prev.filter(id => id !== s.id))}
                        style={{ width: 16, height: 16, accentColor: themeColor }} />
                      <span style={{ fontSize: 14, color: textCol, fontWeight: gStudents.includes(s.id) ? 700 : 400 }}>👨‍🎓 {s.name}</span>
                      <span style={{ fontSize: 11, color: subCol, marginRight: 'auto' }}>{s.email}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={createGroup} disabled={creatingG || !gName.trim()}
                style={{ padding: '13px', borderRadius: 12, border: 'none', background: gName.trim() ? `linear-gradient(135deg,${themeColor},#ff4e50)` : borderCol, color: '#1a1a2e', fontWeight: 900, fontSize: 15, cursor: gName.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {creatingG ? <><span style={{ width: 16, height: 16, border: '2px solid #1a1a2e44', borderTopColor: '#1a1a2e', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />جارٍ الإنشاء...</> : '✅ إنشاء المجموعة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ نافذة تفاصيل المجموعة ══════════════════════════════ */}
      {openGroup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setOpenGroup(null) }}>
          <div style={{ width: '100%', maxWidth: 600, maxHeight: '90vh', borderRadius: 20, background: '#FDFAF5', border: `1px solid ${borderCol}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: themeColor, margin: 0 }}>👥 {openGroup.name}</h3>
                <p style={{ fontSize: 12, color: subCol, margin: '4px 0 0' }}>{openGroup.group_members?.length ?? 0} طالب</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => deleteGroup(openGroup.id)}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(252,129,129,0.4)', background: 'rgba(252,129,129,0.1)', color: '#fc8181', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                  🗑️ حذف
                </button>
                <button onClick={() => setOpenGroup(null)} style={{ background: 'none', border: 'none', color: subCol, fontSize: 22, cursor: 'pointer' }}>✕</button>
              </div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>
              {/* أعضاء المجموعة الحاليون */}
              <h4 style={{ fontSize: 14, fontWeight: 700, color: textCol, marginBottom: 12 }}>أعضاء المجموعة:</h4>
              {openGroup.group_members?.length === 0
                ? <p style={{ color: subCol, fontSize: 13 }}>لا يوجد أعضاء بعد</p>
                : openGroup.group_members?.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: inputBg, border: `1px solid ${borderCol}`, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: textCol }}>👨‍🎓 {m.users?.name}</div>
                      <div style={{ fontSize: 11, color: subCol }}>{m.users?.email}</div>
                    </div>
                    <button onClick={() => removeFromGroup(openGroup.id, m.student_id)}
                      style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(252,129,129,0.4)', background: 'rgba(252,129,129,0.1)', color: '#fc8181', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                      إزالة
                    </button>
                  </div>
                ))}

              {/* إضافة طلاب جدد */}
              <h4 style={{ fontSize: 14, fontWeight: 700, color: textCol, marginTop: 20, marginBottom: 12 }}>إضافة طلاب:</h4>
              {students
                .filter(s => !openGroup.group_members?.some(m => m.student_id === s.id))
                .map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: inputBg, border: `1px solid ${borderCol}`, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, color: textCol }}>👨‍🎓 {s.name}</div>
                      <div style={{ fontSize: 11, color: subCol }}>{s.email}</div>
                    </div>
                    <button onClick={() => addToGroup(openGroup.id, s.id)} disabled={addingMember}
                      style={{ padding: '4px 12px', borderRadius: 8, border: 'none', background: themeColor, color: '#1a1a2e', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
                      ＋ إضافة
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ نافذة مراجعة الإجابة ══════════════════════════════ */}
      {openSub && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setOpenSub(null) }}>
          <div style={{ width: '100%', maxWidth: 700, maxHeight: '92vh', borderRadius: 20, background: '#FDFAF5', border: `1px solid ${borderCol}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: themeColor, margin: 0 }}>✏️ مراجعة إجابة — {openSub.users?.name}</h3>
              <button onClick={() => setOpenSub(null)} style={{ background: 'none', border: 'none', color: subCol, fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>
              {reviewDone ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                  <h3 style={{ color: '#43e97b', fontSize: 20, fontWeight: 900 }}>تم حفظ التصحيح!</h3>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, color: themeColor, fontWeight: 700, marginBottom: 8 }}>✍️ إجابة الطالب:</div>
                    <div style={{ padding: '14px 16px', borderRadius: 12, background: inputBg, border: `1px solid ${borderCol}`, fontSize: 14, color: textCol, lineHeight: 1.7 }}>{openSub.answer_text}</div>
                  </div>
                  {openSub.ai_grade !== null && openSub.ai_grade !== undefined && (
                    <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(79,172,254,0.1)', border: '1px solid rgba(79,172,254,0.3)', marginBottom: 20 }}>
                      <div style={{ fontSize: 13, color: '#4facfe', fontWeight: 700, marginBottom: 6 }}>🤖 تقييم الذكاء الاصطناعي: {openSub.ai_grade} درجة</div>
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
                    style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: tGrade ? `linear-gradient(135deg,${themeColor},#ff4e50)` : borderCol, color: '#1a1a2e', fontWeight: 900, fontSize: 15, cursor: tGrade ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {reviewing ? <><span style={{ width: 18, height: 18, border: '3px solid #1a1a2e44', borderTopColor: '#1a1a2e', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />جارٍ الحفظ...</> : '💾 حفظ التصحيح وإرسال الدرجة'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ نافذة عرض الوسائط ══════════════════════════════════ */}
      {openMedia && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setOpenMedia(null) }}>
          <div style={{ width: '100%', maxWidth: 760, borderRadius: 20, background: '#FDFAF5', border: `1px solid ${borderCol}`, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: themeColor, margin: 0 }}>{openMedia.title}</h3>
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

      {/* ══ الإعدادات ══════════════════════════════════════════ */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { if (e.target === e.currentTarget) setShowSettings(false) }}>
          <div style={{ width: '90%', maxWidth: 380, borderRadius: 24, padding: 28, background: '#FDFAF5', border: `1px solid ${borderCol}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: themeColor, margin: 0 }}>⚙️ الإعدادات</h2>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: subCol, fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: textCol, marginBottom: 12 }}>🎨 لون المظهر</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {THEME_COLORS.map(th => <button key={th.value} title={th.name} onClick={() => setThemeColor(th.value)} style={{ width: 44, height: 44, borderRadius: '50%', background: th.gradient, border: 'none', cursor: 'pointer', boxShadow: themeColor === th.value ? `0 0 0 3px #F5F0E8, 0 0 0 5px ${th.value}` : 'none', transition: 'all 0.2s' }} />)}
              </div>
            </div>
            <button onClick={saveSettings} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg,${themeColor},#ff4e50)`, color: '#1a1a2e', fontWeight: 900, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }}>💾 حفظ</button>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState({ icon, title, sub }: {
  icon: string; title: string; sub: string
}) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FDFAF5', borderRadius: 18, border: '1.5px solid rgba(192,57,43,0.15)' }}>
      <div style={{ fontSize: 52, marginBottom: 14 }}>{icon}</div>
      <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1A1221', marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, color: '#6B5050', opacity: 0.8 }}>{sub}</p>
    </div>
  )
}