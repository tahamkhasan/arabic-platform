'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ar, STAGES } from '@/lib/constants/ar'

const ICONS = ['📚','📖','✏️','🔤','📝','🎯','💡','🌟','📜','🎨','🔬','🧮']

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [tab, setTab] = useState('requests')

  // بيانات
  const [subjects, setSubjects] = useState<any[]>([])
  const [units, setUnits]       = useState<any[]>([])
  const [lessons, setLessons]   = useState<any[]>([])
  const [exams, setExams]       = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [stats, setStats]       = useState({ users: 0, generations: 0 })

  // اختيارات
  const [selSubject, setSelSubject] = useState<any>(null)
  const [selUnit, setSelUnit]       = useState<any>(null)

  // نموذج المادة
  const [sName, setSName]   = useState('')
  const [sDesc, setSDesc]   = useState('')
  const [sStage, setSStage] = useState<string>('middle')
  const [sGrade, setSGrade] = useState<string>(ar.common.grades.middle[0])
  const [sIcon, setSIcon]   = useState('📚')
  const [editSubject, setEditSubject] = useState<any>(null)

  // نموذج الوحدة
  const [uName, setUName]   = useState('')
  const [uDesc, setUDesc]   = useState('')
  const [uIcon, setUIcon]   = useState('📖')
  const [uOrder, setUOrder] = useState(1)
  const [editUnit, setEditUnit] = useState<any>(null)

  // نموذج الدرس
  const [lName, setLName]       = useState('')
  const [lDesc, setLDesc]       = useState('')
  const [lContent, setLContent] = useState('')
  const [lOrder, setLOrder]     = useState(1)
  const [lFiles, setLFiles]     = useState<File[]>([])
  const [editLesson, setEditLesson] = useState<any>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // نموذج الاختبار
  const [eName, setEName]         = useState('')
  const [eType, setEType]         = useState<'short'|'final'>('short')
  const [eDesc, setEDesc]         = useState('')
  const [eLessonIds, setELessonIds] = useState<string[]>([])
  const [allLessons, setAllLessons] = useState<any[]>([])

  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('mosaed_user')
    if (!stored) return router.push('/')
    const u = JSON.parse(stored)
    if (u.role !== 'admin') return router.push('/dashboard')
    setUser(u)
    fetchAll(u)
  }, [])

  async function fetchAll(u: any) {
    fetchSubjects()
    fetchRequests()
    fetchStats()
  }

  async function fetchSubjects() {
    const res = await fetch('/api/subjects')
    const d = await res.json()
    setSubjects(d.subjects || [])
  }

  async function fetchUnits(subjectId: string) {
    const res = await fetch(`/api/units?subject_id=${subjectId}`)
    const d = await res.json()
    setUnits(d.units || [])
  }

  async function fetchLessons(unitId: string) {
    const res = await fetch(`/api/lessons?unit_id=${unitId}`)
    const d = await res.json()
    setLessons(d.lessons || [])
  }

  async function fetchAllLessonsForSubject(subjectId: string) {
    const res = await fetch(`/api/lessons?subject_id=${subjectId}`)
    const d = await res.json()
    setAllLessons(d.lessons || [])
  }

  async function fetchExams() {
    const res = await fetch('/api/exams')
    const d = await res.json()
    setExams(d.exams || [])
  }

  async function fetchRequests() {
    const res = await fetch('/api/users?status=pending')
    const d = await res.json()
    setRequests(d.users || [])
  }

  async function fetchStats() {
    const res = await fetch('/api/stats')
    const d = await res.json()
    setStats(d || { users: 0, generations: 0 })
  }

  function showMsg(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  // ── المواد ──
  async function saveSubject() {
    if (!sName) return showMsg(ar.admin.messages.enterSubjectName)
    setSaving(true)
    const body = { name: sName, description: sDesc, stage: sStage, grade: sGrade, icon: sIcon, adminId: user.id }
    const res = editSubject
      ? await fetch('/api/subjects', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, id: editSubject.id }) })
      : await fetch('/api/subjects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      showMsg(editSubject ? ar.admin.messages.subjectUpdated : ar.admin.messages.subjectAdded)
      setSName(''); setSDesc(''); setEditSubject(null)
      fetchSubjects()
    }
    setSaving(false)
  }

  async function deleteSubject(id: string) {
    if (!confirm(ar.admin.confirms.deleteSubject)) return
    await fetch('/api/subjects', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, adminId: user.id }) })
    fetchSubjects(); setSelSubject(null); setUnits([]); setLessons([])
  }

  // ── الوحدات ──
  async function saveUnit() {
    if (!selSubject) return showMsg(ar.admin.messages.selectSubjectFirst)
    if (!uName) return showMsg(ar.admin.messages.enterUnitName)
    setSaving(true)
    const body = { subject_id: selSubject.id, name: uName, description: uDesc, icon: uIcon, order_num: uOrder, adminId: user.id }
    const res = editUnit
      ? await fetch('/api/units', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, id: editUnit.id }) })
      : await fetch('/api/units', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      showMsg(editUnit ? ar.admin.messages.unitUpdated : ar.admin.messages.unitAdded)
      setUName(''); setUDesc(''); setEditUnit(null)
      fetchUnits(selSubject.id)
    }
    setSaving(false)
  }

  async function deleteUnit(id: string) {
    if (!confirm(ar.admin.confirms.deleteUnit)) return
    await fetch('/api/units', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, adminId: user.id }) })
    fetchUnits(selSubject.id); setSelUnit(null); setLessons([])
  }

  // ── الدروس ──
  async function saveLesson() {
    if (!selUnit) return showMsg(ar.admin.messages.selectUnitFirst)
    if (!lName) return showMsg(ar.admin.messages.enterLessonName)
    setSaving(true)
    const formData = new FormData()
    formData.append('unit_id', selUnit.id)
    formData.append('subject_id', selSubject.id)
    formData.append('name', lName)
    formData.append('description', lDesc)
    formData.append('content', lContent)
    formData.append('order_num', lOrder.toString())
    formData.append('adminId', user.id)
    lFiles.forEach(f => formData.append('files', f))

    const res = editLesson
      ? await fetch('/api/lessons', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editLesson.id, name: lName, description: lDesc, content: lContent, order_num: lOrder, adminId: user.id }) })
      : await fetch('/api/lessons', { method: 'POST', body: formData })

    if (res.ok) {
      showMsg(editLesson ? ar.admin.messages.lessonUpdated : ar.admin.messages.lessonAdded)
      setLName(''); setLDesc(''); setLContent(''); setLFiles([]); setEditLesson(null)
      fetchLessons(selUnit.id)
    }
    setSaving(false)
  }

  async function deleteLesson(id: string) {
    if (!confirm(ar.admin.confirms.deleteLesson)) return
    await fetch('/api/lessons', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, adminId: user.id }) })
    fetchLessons(selUnit.id)
  }

  // ── الاختبارات ──
  async function saveExam() {
    if (!eName) return showMsg(ar.admin.messages.enterExamName)
    if (!selSubject) return showMsg(ar.admin.messages.selectSubjectForExam)
    if (eType === 'short' && eLessonIds.length === 0) return showMsg(ar.admin.messages.selectLessonsForShortExam)
    setSaving(true)
    const res = await fetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: eName, exam_type: eType, subject_id: selSubject?.id,
        stage: selSubject?.stage, grade: selSubject?.grade,
        lesson_ids: eLessonIds, description: eDesc, adminId: user.id,
      }),
    })
    if (res.ok) {
      showMsg(ar.admin.messages.examAdded)
      setEName(''); setEDesc(''); setELessonIds([]); fetchExams()
    }
    setSaving(false)
  }

  async function handleApprove(userId: string) {
    await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, status: 'approved', adminId: user.id }) })
    fetchRequests(); fetchStats()
  }

  async function handleReject(userId: string) {
    await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, status: 'rejected', adminId: user.id }) })
    fetchRequests()
  }

  function handleLogout() {
    localStorage.removeItem('user'); localStorage.removeItem('session'); router.push('/')
  }

  const currentStage = STAGES.find(s => s.id === sStage)
  const stageNames = ar.common.stages

  const tabs = [
    { id: 'requests', label: `${ar.admin.tabs.requests}${requests.length > 0 ? ` (${requests.length})` : ''}` },
    { id: 'subjects', label: ar.admin.tabs.subjects },
    { id: 'units',    label: ar.admin.tabs.units },
    { id: 'lessons',  label: ar.admin.tabs.lessons },
    { id: 'exams',    label: ar.admin.tabs.exams },
  ]

  return (
    <div dir="rtl" className="min-h-screen p-4 text-white"
      style={{ background: 'linear-gradient(135deg,#0d1117,#161b22,#1a1a2e)' }}>

      {/* Header */}
      <div className="flex justify-between items-center mb-5 p-4 rounded-2xl border border-white/8"
        style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div>
          <h1 className="text-lg font-black text-yellow-400">{ar.admin.title}</h1>
          <p className="text-xs text-gray-600">{ar.common.platformName}</p>
        </div>
        <button onClick={handleLogout}
          className="px-3 py-2 rounded-xl text-red-400 text-xs font-bold border border-red-400/30"
          style={{ background: 'rgba(252,129,129,0.08)' }}>{ar.common.exit}</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: ar.admin.stats.subjects,  value: subjects.length,  icon: '📚', color: '#f9d423' },
          { label: ar.admin.stats.generations, value: stats.generations, icon: '✨', color: '#4facfe' },
          { label: ar.admin.stats.users, value: stats.users,       icon: '👨‍🏫', color: '#43e97b' },
          { label: ar.admin.stats.requests, value: requests.length,  icon: '🔔', color: '#ff4e50' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center border"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: s.color + '22' }}>
            <div className="text-lg">{s.icon}</div>
            <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-600">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'exams') { fetchExams(); if (selSubject) fetchAllLessonsForSubject(selSubject.id) } }}
            className="px-3 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all"
            style={{
              background: tab === t.id ? 'linear-gradient(135deg,#f9d423,#ff4e50)' : 'rgba(255,255,255,0.06)',
              color: tab === t.id ? '#1a1a2e' : '#718096',
            }}>{t.label}</button>
        ))}
      </div>

      {msg && (
        <div className="mb-4 p-3 rounded-xl text-center text-sm font-bold"
          style={{ background: msg.includes('✅') ? 'rgba(67,233,123,0.1)' : 'rgba(252,129,129,0.1)', color: msg.includes('✅') ? '#43e97b' : '#fc8181' }}>
          {msg}
        </div>
      )}

      {/* ── تبويب الطلبات ── */}
      {tab === 'requests' && (
        <div className="space-y-3">
          {requests.length === 0
            ? <div className="text-center py-12"><div className="text-4xl mb-3">✅</div><p className="text-gray-500 text-sm">{ar.admin.requestsTab.empty}</p></div>
            : requests.map(r => {
              const stageColors: Record<string,string> = { primary:'#43e97b', middle:'#4facfe', high:'#f9d423' }
              return (
                <div key={r.id} className="p-4 rounded-xl border border-white/8" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span>{r.user_type === 'teacher' ? '👨‍🏫' : '👨‍🎓'}</span>
                        <p className="font-bold text-sm">{r.name}</p>
                        <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: r.user_type === 'teacher' ? 'rgba(79,172,254,0.15)' : 'rgba(67,233,123,0.15)', color: r.user_type === 'teacher' ? '#4facfe' : '#43e97b' }}>
                          {r.user_type === 'teacher' ? ar.common.userType.teacher : ar.common.userType.student}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{r.email}</p>
                    </div>
                    <span className="text-xs text-gray-600">{new Date(r.created_at).toLocaleDateString('ar')}</span>
                  </div>
                  <div className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {r.allowed_stages?.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 font-bold mb-1">{ar.admin.requestsTab.stages}</p>
                        <div className="flex flex-wrap gap-1">
                          {r.allowed_stages.map((s: string) => (
                            <span key={s} className="text-xs px-2 py-1 rounded-lg font-bold"
                              style={{ background: stageColors[s] + '22', color: stageColors[s], border: `1px solid ${stageColors[s]}44` }}>
                              {stageNames[s]}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {r.user_type === 'student' && r.allowed_grades?.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 font-bold mb-1">{ar.admin.requestsTab.grade}</p>
                        <span className="text-xs px-2 py-1 rounded-lg font-bold" style={{ background: 'rgba(249,212,35,0.12)', color: '#f9d423', border: '1px solid rgba(249,212,35,0.3)' }}>
                          {ar.common.gradePrefix} {r.allowed_grades[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(r.id)} className="flex-1 py-2 rounded-xl font-bold text-sm" style={{ background: 'linear-gradient(135deg,#43e97b,#38f9d7)', color: '#1a1a2e' }}>{ar.admin.requestsTab.approve}</button>
                    <button onClick={() => handleReject(r.id)} className="flex-1 py-2 rounded-xl font-bold text-sm border border-red-400/30" style={{ background: 'rgba(252,129,129,0.08)', color: '#fc8181' }}>{ar.admin.requestsTab.reject}</button>
                  </div>
                </div>
              )
            })
          }
        </div>
      )}

      {/* ── تبويب المواد ── */}
      {tab === 'subjects' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-white/8" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-xs text-yellow-400 font-black mb-3">{editSubject ? ar.admin.subjects.edit : ar.admin.subjects.add}</p>
            <div className="space-y-3">
              <input value={sName} onChange={e => setSName(e.target.value)} placeholder={ar.admin.subjects.namePlaceholder}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none border border-white/10"
                style={{ background: 'rgba(255,255,255,0.06)' }} />
              <input value={sDesc} onChange={e => setSDesc(e.target.value)} placeholder={ar.admin.subjects.descPlaceholder}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none border border-white/10"
                style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div>
                <p className="text-xs text-gray-500 mb-2 font-bold">{ar.admin.subjects.stage}</p>
                <div className="flex gap-2">
                  {STAGES.map(s => (
                    <button key={s.id} onClick={() => { setSStage(s.id); setSGrade(s.grades[0]) }}
                      className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{ background: sStage === s.id ? 'linear-gradient(135deg,#f9d423,#ff4e50)' : 'rgba(255,255,255,0.06)', color: sStage === s.id ? '#1a1a2e' : '#718096' }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 font-bold">{ar.admin.subjects.grade}</p>
                <div className="flex flex-wrap gap-2">
                  {currentStage?.grades.map(g => (
                    <button key={g} onClick={() => setSGrade(g)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{ background: sGrade === g ? 'linear-gradient(135deg,#f9d423,#ff4e50)' : 'rgba(255,255,255,0.06)', color: sGrade === g ? '#1a1a2e' : '#a0aec0' }}>
                      {ar.common.gradePrefix} {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 font-bold">{ar.admin.subjects.icon}</p>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(ic => (
                    <button key={ic} onClick={() => setSIcon(ic)}
                      className="w-10 h-10 rounded-xl text-lg transition-all"
                      style={{ background: sIcon === ic ? 'rgba(249,212,35,0.2)' : 'rgba(255,255,255,0.06)', border: sIcon === ic ? '2px solid #f9d423' : '2px solid transparent' }}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={saveSubject} disabled={saving}
                  className="flex-1 py-3 rounded-xl font-black text-sm transition-all"
                  style={{ background: saving ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg,#f9d423,#ff4e50)', color: saving ? '#4a5568' : '#1a1a2e' }}>
                  {saving ? ar.common.savingShort : editSubject ? ar.admin.subjects.saveEdit : ar.admin.subjects.addButton}
                </button>
                {editSubject && (
                  <button onClick={() => { setEditSubject(null); setSName(''); setSDesc('') }}
                    className="px-4 py-3 rounded-xl font-bold text-sm border border-white/10 text-gray-400">
                    {ar.common.cancel}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* قائمة المواد */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-bold">{ar.admin.subjects.list(subjects.length)}</p>
            {subjects.map(s => (
              <div key={s.id} className="p-3 rounded-xl border border-white/8 flex items-center justify-between"
                style={{ background: selSubject?.id === s.id ? 'rgba(249,212,35,0.08)' : 'rgba(255,255,255,0.04)', borderColor: selSubject?.id === s.id ? 'rgba(249,212,35,0.3)' : 'rgba(255,255,255,0.08)' }}>
                <button onClick={() => { setSelSubject(s); fetchUnits(s.id); setTab('units') }}
                  className="flex items-center gap-3 flex-1 text-right">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <p className="font-bold text-sm text-yellow-400">{s.name}</p>
                    <p className="text-xs text-gray-500">{ar.admin.subjects.stageGrade(stageNames[s.stage], s.grade)}</p>
                  </div>
                </button>
                <div className="flex gap-2">
                  <button onClick={() => { setEditSubject(s); setSName(s.name); setSDesc(s.description || ''); setSStage(s.stage); setSGrade(s.grade); setSIcon(s.icon) }}
                    className="text-xs px-2 py-1 rounded-lg text-blue-400 border border-blue-400/30" style={{ background: 'rgba(79,172,254,0.08)' }}>✏️</button>
                  <button onClick={() => deleteSubject(s.id)}
                    className="text-xs px-2 py-1 rounded-lg text-red-400 border border-red-400/30" style={{ background: 'rgba(252,129,129,0.08)' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── تبويب الوحدات ── */}
      {tab === 'units' && (
        <div className="space-y-4">
          {/* اختيار المادة */}
          <div>
            <p className="text-xs text-gray-500 font-bold mb-2">{ar.admin.units.subject}</p>
            <div className="flex flex-wrap gap-2">
              {subjects.map(s => (
                <button key={s.id} onClick={() => { setSelSubject(s); fetchUnits(s.id) }}
                  className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{ background: selSubject?.id === s.id ? 'linear-gradient(135deg,#f9d423,#ff4e50)' : 'rgba(255,255,255,0.06)', color: selSubject?.id === s.id ? '#1a1a2e' : '#718096' }}>
                  {s.icon} {s.name}
                </button>
              ))}
            </div>
          </div>

          {selSubject && (
            <div className="p-4 rounded-xl border border-white/8" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-xs text-yellow-400 font-black mb-3">{editUnit ? ar.admin.units.edit : ar.admin.units.add(selSubject.name)}</p>
              <div className="space-y-3">
                <input value={uName} onChange={e => setUName(e.target.value)} placeholder={ar.admin.units.namePlaceholder}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none border border-white/10"
                  style={{ background: 'rgba(255,255,255,0.06)' }} />
                <input value={uDesc} onChange={e => setUDesc(e.target.value)} placeholder={ar.admin.units.descPlaceholder}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none border border-white/10"
                  style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="flex gap-3 items-center">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1 font-bold">{ar.admin.units.order}</p>
                    <input type="number" value={uOrder} onChange={e => setUOrder(parseInt(e.target.value))} min={1}
                      className="w-full px-4 py-3 rounded-xl text-white outline-none border border-white/10"
                      style={{ background: 'rgba(255,255,255,0.06)' }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-bold">{ar.admin.units.icon}</p>
                    <div className="flex flex-wrap gap-1">
                      {ICONS.slice(0,6).map(ic => (
                        <button key={ic} onClick={() => setUIcon(ic)}
                          className="w-9 h-9 rounded-lg text-base transition-all"
                          style={{ background: uIcon === ic ? 'rgba(249,212,35,0.2)' : 'rgba(255,255,255,0.06)', border: uIcon === ic ? '2px solid #f9d423' : '2px solid transparent' }}>
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveUnit} disabled={saving}
                    className="flex-1 py-3 rounded-xl font-black text-sm transition-all"
                    style={{ background: saving ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg,#f9d423,#ff4e50)', color: saving ? '#4a5568' : '#1a1a2e' }}>
                    {saving ? ar.common.savingShort : editUnit ? ar.admin.units.saveEdit : ar.admin.units.addButton}
                  </button>
                  {editUnit && (
                    <button onClick={() => { setEditUnit(null); setUName(''); setUDesc('') }}
                      className="px-4 py-3 rounded-xl font-bold text-sm border border-white/10 text-gray-400">{ar.common.cancel}</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* قائمة الوحدات */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-bold">{ar.admin.units.list(units.length)}</p>
            {units.map(u => (
              <div key={u.id} className="p-3 rounded-xl border border-white/8 flex items-center justify-between"
                style={{ background: selUnit?.id === u.id ? 'rgba(79,172,254,0.08)' : 'rgba(255,255,255,0.04)', borderColor: selUnit?.id === u.id ? 'rgba(79,172,254,0.3)' : 'rgba(255,255,255,0.08)' }}>
                <button onClick={() => { setSelUnit(u); fetchLessons(u.id); setTab('lessons') }}
                  className="flex items-center gap-3 flex-1 text-right">
                  <span className="text-xl">{u.icon}</span>
                  <div>
                    <p className="font-bold text-sm text-blue-400">{u.name}</p>
                    <p className="text-xs text-gray-500">{ar.common.orderLabel(u.order_num)}</p>
                  </div>
                </button>
                <div className="flex gap-2">
                  <button onClick={() => { setEditUnit(u); setUName(u.name); setUDesc(u.description || ''); setUOrder(u.order_num); setUIcon(u.icon) }}
                    className="text-xs px-2 py-1 rounded-lg text-blue-400 border border-blue-400/30" style={{ background: 'rgba(79,172,254,0.08)' }}>✏️</button>
                  <button onClick={() => deleteUnit(u.id)}
                    className="text-xs px-2 py-1 rounded-lg text-red-400 border border-red-400/30" style={{ background: 'rgba(252,129,129,0.08)' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── تبويب الدروس ── */}
      {tab === 'lessons' && (
        <div className="space-y-4">
          {/* اختيار المادة والوحدة */}
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 font-bold mb-2">{ar.admin.units.subject}</p>
              <div className="flex flex-wrap gap-2">
                {subjects.map(s => (
                  <button key={s.id} onClick={() => { setSelSubject(s); fetchUnits(s.id); setSelUnit(null); setLessons([]) }}
                    className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{ background: selSubject?.id === s.id ? 'linear-gradient(135deg,#f9d423,#ff4e50)' : 'rgba(255,255,255,0.06)', color: selSubject?.id === s.id ? '#1a1a2e' : '#718096' }}>
                    {s.icon} {s.name}
                  </button>
                ))}
              </div>
            </div>
            {selSubject && units.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-bold mb-2">{ar.admin.lessons.unit}</p>
                <div className="flex flex-wrap gap-2">
                  {units.map(u => (
                    <button key={u.id} onClick={() => { setSelUnit(u); fetchLessons(u.id) }}
                      className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{ background: selUnit?.id === u.id ? 'linear-gradient(135deg,#4facfe,#00f2fe)' : 'rgba(255,255,255,0.06)', color: selUnit?.id === u.id ? '#1a1a2e' : '#718096' }}>
                      {u.icon} {u.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {selUnit && (
            <div className="p-4 rounded-xl border border-white/8" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-xs text-yellow-400 font-black mb-3">{editLesson ? ar.admin.lessons.edit : ar.admin.lessons.add(selUnit.name)}</p>
              <div className="space-y-3">
                <input value={lName} onChange={e => setLName(e.target.value)} placeholder={ar.admin.lessons.namePlaceholder}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none border border-white/10"
                  style={{ background: 'rgba(255,255,255,0.06)' }} />
                <input value={lDesc} onChange={e => setLDesc(e.target.value)} placeholder={ar.admin.lessons.descPlaceholder}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none border border-white/10"
                  style={{ background: 'rgba(255,255,255,0.06)' }} />
                <textarea value={lContent} onChange={e => setLContent(e.target.value)}
                  placeholder={ar.admin.lessons.contentPlaceholder}
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none border border-white/10 resize-y"
                  style={{ background: 'rgba(255,255,255,0.06)', fontFamily: 'inherit', lineHeight: '2' }} />
                <div className="flex gap-3 items-center">
                  <div className="w-24">
                    <p className="text-xs text-gray-500 mb-1 font-bold">{ar.admin.units.order}</p>
                    <input type="number" value={lOrder} onChange={e => setLOrder(parseInt(e.target.value))} min={1}
                      className="w-full px-3 py-2 rounded-xl text-white outline-none border border-white/10"
                      style={{ background: 'rgba(255,255,255,0.06)' }} />
                  </div>
                </div>
                {!editLesson && (
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-2">{ar.admin.lessons.files}</p>
                    <div onClick={() => fileRef.current?.click()}
                      onDrop={e => { e.preventDefault(); setLFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]) }}
                      onDragOver={e => e.preventDefault()}
                      className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer"
                      style={{ borderColor: 'rgba(249,212,35,0.3)', background: 'rgba(249,212,35,0.03)' }}>
                      <p className="text-yellow-400 font-bold text-sm">{ar.admin.lessons.upload}</p>
                      <p className="text-gray-600 text-xs mt-1">{ar.admin.lessons.uploadHint}</p>
                      <input ref={fileRef} type="file" multiple accept=".docx,.pdf,.png,.jpg,.jpeg,.webp,.txt" onChange={e => setLFiles(prev => [...prev, ...Array.from(e.target.files!)])} className="hidden" />
                    </div>
                    {lFiles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {lFiles.map((f, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-white/8" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <span className="text-xs text-gray-300">📎 {f.name}</span>
                            <button onClick={() => setLFiles(prev => prev.filter((_,idx) => idx !== i))} className="text-red-400 text-xs">✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={saveLesson} disabled={saving}
                    className="flex-1 py-3 rounded-xl font-black text-sm transition-all"
                    style={{ background: saving ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg,#f9d423,#ff4e50)', color: saving ? '#4a5568' : '#1a1a2e' }}>
                    {saving ? ar.common.savingShort : editLesson ? ar.admin.lessons.saveEdit : ar.admin.lessons.addButton}
                  </button>
                  {editLesson && (
                    <button onClick={() => { setEditLesson(null); setLName(''); setLDesc(''); setLContent('') }}
                      className="px-4 py-3 rounded-xl font-bold text-sm border border-white/10 text-gray-400">{ar.common.cancel}</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* قائمة الدروس */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-bold">{ar.admin.lessons.list(lessons.length)}</p>
            {lessons.map(l => (
              <div key={l.id} className="p-3 rounded-xl border border-white/8"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-green-400">{l.order_num}. {l.name}</p>
                    {l.description && <p className="text-xs text-gray-500 mt-0.5">{l.description}</p>}
                    {l.file_urls?.length > 0 && <p className="text-xs text-blue-400 mt-0.5">📎 {ar.common.fileCount(l.file_urls.length)}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditLesson(l); setLName(l.name); setLDesc(l.description || ''); setLContent(l.content || ''); setLOrder(l.order_num) }}
                      className="text-xs px-2 py-1 rounded-lg text-blue-400 border border-blue-400/30" style={{ background: 'rgba(79,172,254,0.08)' }}>✏️</button>
                    <button onClick={() => deleteLesson(l.id)}
                      className="text-xs px-2 py-1 rounded-lg text-red-400 border border-red-400/30" style={{ background: 'rgba(252,129,129,0.08)' }}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── تبويب الاختبارات ── */}
      {tab === 'exams' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-white/8" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-xs text-yellow-400 font-black mb-3">{ar.admin.exams.add}</p>
            <div className="space-y-3">
              <input value={eName} onChange={e => setEName(e.target.value)} placeholder={ar.admin.exams.namePlaceholder}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none border border-white/10"
                style={{ background: 'rgba(255,255,255,0.06)' }} />

              {/* نوع الاختبار */}
              <div>
                <p className="text-xs text-gray-500 font-bold mb-2">{ar.admin.exams.type}</p>
                <div className="flex gap-2">
                  {[['short', ar.admin.exams.short], ['final', ar.admin.exams.final]].map(([type, label]) => (
                    <button key={type} onClick={() => setEType(type as 'short'|'final')}
                      className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
                      style={{ background: eType === type ? 'linear-gradient(135deg,#f9d423,#ff4e50)' : 'rgba(255,255,255,0.06)', color: eType === type ? '#1a1a2e' : '#718096' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* اختيار المادة */}
              <div>
                <p className="text-xs text-gray-500 font-bold mb-2">{ar.admin.units.subject}</p>
                <div className="flex flex-wrap gap-2">
                  {subjects.map(s => (
                    <button key={s.id} onClick={() => { setSelSubject(s); fetchAllLessonsForSubject(s.id) }}
                      className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{ background: selSubject?.id === s.id ? 'linear-gradient(135deg,#f9d423,#ff4e50)' : 'rgba(255,255,255,0.06)', color: selSubject?.id === s.id ? '#1a1a2e' : '#718096' }}>
                      {s.icon} {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* اختيار الدروس للاختبار القصير */}
              {eType === 'short' && allLessons.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 font-bold mb-2">{ar.admin.exams.selectLessons(eLessonIds.length)}</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {allLessons.map(l => (
                      <button key={l.id}
                        onClick={() => setELessonIds(prev => prev.includes(l.id) ? prev.filter(id => id !== l.id) : [...prev, l.id])}
                        className="w-full text-right p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                        style={{
                          background: eLessonIds.includes(l.id) ? 'rgba(249,212,35,0.12)' : 'rgba(255,255,255,0.04)',
                          border: eLessonIds.includes(l.id) ? '1px solid rgba(249,212,35,0.3)' : '1px solid rgba(255,255,255,0.08)',
                          color: eLessonIds.includes(l.id) ? '#f9d423' : '#a0aec0',
                        }}>
                        <span>{eLessonIds.includes(l.id) ? '✅' : '⬜'}</span>
                        <span>{l.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <textarea value={eDesc} onChange={e => setEDesc(e.target.value)}
                placeholder={ar.admin.exams.descPlaceholder}
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none border border-white/10 resize-y"
                style={{ background: 'rgba(255,255,255,0.06)', fontFamily: 'inherit' }} />

              <button onClick={saveExam} disabled={saving}
                className="w-full py-3 rounded-xl font-black text-sm transition-all"
                style={{ background: saving ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg,#f9d423,#ff4e50)', color: saving ? '#4a5568' : '#1a1a2e' }}>
                {saving ? ar.common.savingShort : ar.admin.exams.addButton}
              </button>
            </div>
          </div>

          {/* قائمة الاختبارات */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-bold">{ar.admin.exams.list(exams.length)}</p>
            {exams.map(e => (
              <div key={e.id} className="p-3 rounded-xl border border-white/8" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-yellow-400">{e.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-lg font-bold"
                        style={{ background: e.exam_type === 'short' ? 'rgba(79,172,254,0.15)' : 'rgba(67,233,123,0.15)', color: e.exam_type === 'short' ? '#4facfe' : '#43e97b' }}>
                        {e.exam_type === 'short' ? ar.common.examType.shortBadge : ar.common.examType.finalBadge}
                      </span>
                    </div>
                    {e.exam_type === 'short' && <p className="text-xs text-gray-500 mt-1">{ar.common.lessonCountSelected(e.lesson_ids?.length ?? 0)}</p>}
                  </div>
                  <button onClick={async () => { if (!confirm(ar.admin.confirms.deleteExam)) return; await fetch('/api/exams', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: e.id, adminId: user.id }) }); fetchExams() }}
                    className="text-xs px-2 py-1 rounded-lg text-red-400 border border-red-400/30" style={{ background: 'rgba(252,129,129,0.08)' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-gray-800 text-xs mt-8">{ar.common.footerStages}</p>
    </div>
  )
}