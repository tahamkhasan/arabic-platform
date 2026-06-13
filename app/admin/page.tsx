'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const STAGES = [
  { id: 'primary', label: 'ابتدائي', grades: ['الأول','الثاني','الثالث','الرابع','الخامس'] },
  { id: 'middle',  label: 'متوسط',   grades: ['السادس','السابع','الثامن','التاسع'] },
  { id: 'high',    label: 'ثانوي',   grades: ['العاشر','الحادي عشر','الثاني عشر'] },
]

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser]           = useState<any>(null)
  const [tab, setTab]             = useState('requests')
  const [materials, setMaterials] = useState<any[]>([])
  const [requests, setRequests]   = useState<any[]>([])
  const [stats, setStats]         = useState({ users: 0, generations: 0 })

  // نموذج إضافة مادة
  const [title, setTitle]     = useState('')
  const [content, setContent] = useState('')
  const [stage, setStage]     = useState('primary')
  const [grade, setGrade]     = useState('الأول')
  const [subject, setSubject] = useState('')
  const [files, setFiles]     = useState<File[]>([])
  const [saving, setSaving]   = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) return router.push('/')
    const u = JSON.parse(stored)
    if (u.role !== 'admin') return router.push('/dashboard')
    setUser(u)
    fetchMaterials()
    fetchRequests()
    fetchStats()
  }, [])

  async function fetchMaterials() {
    const res = await fetch('/api/materials')
    const data = await res.json()
    setMaterials(data.materials || [])
  }

  async function fetchRequests() {
    const res = await fetch('/api/users?status=pending')
    const data = await res.json()
    setRequests(data.users || [])
  }

  async function fetchStats() {
    const res = await fetch('/api/stats')
    const data = await res.json()
    setStats(data || { users: 0, generations: 0 })
  }

  async function handleApprove(userId: string) {
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, status: 'approved', adminId: user.id }),
    })
    if (res.ok) { fetchRequests(); fetchStats() }
  }

  async function handleReject(userId: string) {
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, status: 'rejected', adminId: user.id }),
    })
    if (res.ok) fetchRequests()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)])
  }

  function removeFile(i: number) {
    setFiles(prev => prev.filter((_, idx) => idx !== i))
  }

  function getFileIcon(name: string) {
    const ext = name.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return '📄'
    if (['doc','docx'].includes(ext||'')) return '📝'
    if (['png','jpg','jpeg','webp'].includes(ext||'')) return '🖼️'
    return '📎'
  }

  async function handleSave() {
    if (!title) return setSavedMsg('⚠️ أدخل عنوان المادة')
    if (!content && files.length === 0) return setSavedMsg('⚠️ أدخل محتوى أو ارفع ملفاً')
    setSaving(true); setSavedMsg('')
    const formData = new FormData()
    formData.append('title', title)
    formData.append('content', content)
    formData.append('stage', stage)
    formData.append('grade', grade)
    formData.append('subject', subject)
    formData.append('adminId', user.id)
    files.forEach(f => formData.append('files', f))
    const res = await fetch('/api/materials', { method: 'POST', body: formData })
    if (res.ok) {
      setSavedMsg('✅ تم الحفظ والنشر!')
      setTitle(''); setContent(''); setSubject(''); setFiles([])
      fetchMaterials()
    } else {
      const err = await res.json()
      setSavedMsg(`❌ ${err.error || 'حدث خطأ'}`)
    }
    setSaving(false)
    setTimeout(() => setSavedMsg(''), 4000)
  }

  async function handleDelete(id: string) {
    if (!confirm('هل تريد حذف هذه المادة؟')) return
    await fetch('/api/materials', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, adminId: user?.id }),
    })
    fetchMaterials()
  }

  function handleLogout() {
    localStorage.removeItem('user')
    localStorage.removeItem('session')
    router.push('/')
  }

  const currentStage = STAGES.find(s => s.id === stage)
  const pendingCount = requests.length

  return (
    <div dir="rtl" className="min-h-screen p-5 text-white"
      style={{ background: 'linear-gradient(135deg,#0d1117,#161b22,#1a1a2e)' }}>

      {/* Header */}
      <div className="flex justify-between items-center mb-6 p-4 rounded-2xl border border-white/8"
        style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div>
          <h1 className="text-lg font-black text-yellow-400">⚙️ لوحة تحكم المدير</h1>
          <p className="text-xs text-gray-600">منصة مساعد اللغة العربية</p>
        </div>
        <button onClick={handleLogout}
          className="px-4 py-2 rounded-xl text-red-400 text-sm font-bold border border-red-400/30"
          style={{ background: 'rgba(252,129,129,0.08)' }}>خروج</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'المواد',      value: materials.length, icon: '📚', color: '#f9d423' },
          { label: 'التوليدات',   value: stats.generations, icon: '✨', color: '#4facfe' },
          { label: 'المستخدمون', value: stats.users,       icon: '👨‍🏫', color: '#43e97b' },
          { label: 'طلبات',       value: pendingCount,      icon: '🔔', color: '#ff4e50' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3 text-center border"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: s.color + '22' }}>
            <div className="text-xl">{s.icon}</div>
            <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          ['requests', `🔔 الطلبات${pendingCount > 0 ? ` (${pendingCount})` : ''}`],
          ['materials', '📚 إضافة مادة'],
          ['list', '📋 المواد'],
        ].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex-1 py-3 rounded-xl font-bold text-xs whitespace-nowrap transition-all"
            style={{
              background: tab === id ? 'linear-gradient(135deg,#f9d423,#ff4e50)' : 'rgba(255,255,255,0.06)',
              color: tab === id ? '#1a1a2e' : '#718096',
            }}>{lbl}</button>
        ))}
      </div>

      {/* Tab: Requests */}
      {tab === 'requests' && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-gray-500 text-sm">لا توجد طلبات معلقة</p>
            </div>
          ) : requests.map(r => {
            const stageNames: Record<string,string> = { primary:'ابتدائي', middle:'متوسط', high:'ثانوي' }
            const stageColors: Record<string,string> = { primary:'#43e97b', middle:'#4facfe', high:'#f9d423' }
            const isTeacher = r.user_type === 'teacher'
            return (
            <div key={r.id} className="p-4 rounded-xl border border-white/8"
              style={{ background: 'rgba(255,255,255,0.04)' }}>

              {/* معلومات المستخدم */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{isTeacher ? '👨‍🏫' : '👨‍🎓'}</span>
                    <p className="font-bold text-white text-sm">{r.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-lg"
                      style={{
                        background: isTeacher ? 'rgba(79,172,254,0.15)' : 'rgba(67,233,123,0.15)',
                        color: isTeacher ? '#4facfe' : '#43e97b',
                      }}>
                      {isTeacher ? 'معلم' : 'طالب'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{r.email}</p>
                </div>
                <span className="text-xs text-gray-600">
                  {new Date(r.created_at).toLocaleDateString('ar')}
                </span>
              </div>

              {/* المراحل المطلوبة */}
              <div className="mb-3 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>

                {/* للمعلم — المراحل */}
                {isTeacher && r.allowed_stages?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-2">📚 المراحل المطلوبة:</p>
                    <div className="flex flex-wrap gap-2">
                      {r.allowed_stages.map((s: string) => (
                        <span key={s} className="text-xs px-3 py-1 rounded-lg font-bold"
                          style={{
                            background: stageColors[s] + '22',
                            color: stageColors[s],
                            border: `1px solid ${stageColors[s]}44`,
                          }}>
                          {stageNames[s] || s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* للطالب — المرحلة والصف */}
                {!isTeacher && (
                  <div className="space-y-2">
                    {r.allowed_stages?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500 font-bold">📚 المرحلة:</p>
                        <div className="flex gap-2">
                          {r.allowed_stages.map((s: string) => (
                            <span key={s} className="text-xs px-3 py-1 rounded-lg font-bold"
                              style={{
                                background: stageColors[s] + '22',
                                color: stageColors[s],
                                border: `1px solid ${stageColors[s]}44`,
                              }}>
                              {stageNames[s] || s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {r.allowed_grades?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500 font-bold">🎓 الصف:</p>
                        <div className="flex gap-2">
                          {r.allowed_grades.map((g: string) => (
                            <span key={g} className="text-xs px-3 py-1 rounded-lg font-bold"
                              style={{
                                background: 'rgba(249,212,35,0.12)',
                                color: '#f9d423',
                                border: '1px solid rgba(249,212,35,0.3)',
                              }}>
                              الصف {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* أزرار الموافقة والرفض */}
              <div className="flex gap-2">
                <button onClick={() => handleApprove(r.id)}
                  className="flex-1 py-2 rounded-xl font-bold text-sm transition-all"
                  style={{ background: 'linear-gradient(135deg,#43e97b,#38f9d7)', color: '#1a1a2e' }}>
                  ✅ موافقة
                </button>
                <button onClick={() => handleReject(r.id)}
                  className="flex-1 py-2 rounded-xl font-bold text-sm border border-red-400/30"
                  style={{ background: 'rgba(252,129,129,0.08)', color: '#fc8181' }}>
                  ❌ رفض
                </button>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Tab: Add Material */}
      {tab === 'materials' && (
        <div className="space-y-4">
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="عنوان المادة"
            className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none border border-white/10"
            style={{ background: 'rgba(255,255,255,0.06)' }} />
          <input value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="المادة — نحو، بلاغة، أدب..."
            className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none border border-white/10"
            style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div>
            <p className="text-xs text-gray-500 mb-2 font-bold">المرحلة</p>
            <div className="flex gap-2">
              {STAGES.map(s => (
                <button key={s.id} onClick={() => { setStage(s.id); setGrade(s.grades[0]) }}
                  className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: stage === s.id ? 'linear-gradient(135deg,#f9d423,#ff4e50)' : 'rgba(255,255,255,0.06)',
                    color: stage === s.id ? '#1a1a2e' : '#718096',
                  }}>{s.label}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2 font-bold">الصف</p>
            <div className="flex flex-wrap gap-2">
              {currentStage?.grades.map(g => (
                <button key={g} onClick={() => setGrade(g)}
                  className="px-3 py-2 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: grade === g ? 'linear-gradient(135deg,#f9d423,#ff4e50)' : 'rgba(255,255,255,0.06)',
                    color: grade === g ? '#1a1a2e' : '#a0aec0',
                  }}>الصف {g}</button>
              ))}
            </div>
          </div>
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="المادة العلمية النصية (اختياري إذا رفعت ملفات)..."
            rows={5}
            className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none border border-white/10 resize-y"
            style={{ background: 'rgba(255,255,255,0.06)', fontFamily: 'inherit', lineHeight: '2' }} />
          <div>
            <p className="text-xs text-gray-500 mb-2 font-bold">📎 رفع الملفات</p>
            <div onClick={() => fileRef.current?.click()}
              onDrop={e => { e.preventDefault(); setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]) }}
              onDragOver={e => e.preventDefault()}
              className="border-2 border-dashed rounded-xl p-5 text-center cursor-pointer"
              style={{ borderColor: 'rgba(249,212,35,0.3)', background: 'rgba(249,212,35,0.03)' }}>
              <div className="text-3xl mb-2">📂</div>
              <p className="text-yellow-400 font-bold text-sm">اسحب أو انقر للاختيار</p>
              <p className="text-gray-600 text-xs mt-1">Word • PDF • صور</p>
              <input ref={fileRef} type="file" multiple
                accept=".docx,.pdf,.png,.jpg,.jpeg,.webp,.txt"
                onChange={handleFileChange} className="hidden" />
            </div>
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-white/8"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center gap-2">
                      <span>{getFileIcon(f.name)}</span>
                      <div>
                        <p className="text-xs font-bold text-gray-300">{f.name}</p>
                        <p className="text-xs text-gray-600">{(f.size/1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button onClick={() => removeFile(i)} className="text-red-400 text-xs px-2 py-1 rounded-lg">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {savedMsg && (
            <p className="text-center text-sm font-bold py-2 rounded-xl"
              style={{
                color: savedMsg.includes('✅') ? '#43e97b' : '#fc8181',
                background: savedMsg.includes('✅') ? 'rgba(67,233,123,0.1)' : 'rgba(252,129,129,0.1)',
              }}>{savedMsg}</p>
          )}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 rounded-xl font-black text-base transition-all"
            style={{
              background: saving ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg,#f9d423,#ff4e50)',
              color: saving ? '#4a5568' : '#1a1a2e',
            }}>
            {saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ ونشر للمعلمين'}
          </button>
        </div>
      )}

      {/* Tab: Materials List */}
      {tab === 'list' && (
        <div className="space-y-3">
          {materials.length === 0
            ? <p className="text-center text-gray-600 py-10">لا توجد مواد بعد</p>
            : materials.map(m => (
              <div key={m.id} className="p-4 rounded-xl border border-white/8"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 ml-3">
                    <p className="font-bold text-yellow-400 text-sm">{m.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {m.stage === 'primary' ? 'ابتدائي' : m.stage === 'middle' ? 'متوسط' : 'ثانوي'} — الصف {m.grade} {m.subject ? `— ${m.subject}` : ''}
                    </p>
                    {m.file_urls?.length > 0 && (
                      <p className="text-xs text-blue-400 mt-1">📎 {m.file_urls.length} ملف مرفق</p>
                    )}
                  </div>
                  <button onClick={() => handleDelete(m.id)}
                    className="text-red-400 text-xs px-3 py-1 rounded-lg border border-red-400/30"
                    style={{ background: 'rgba(252,129,129,0.08)' }}>🗑️</button>
                </div>
              </div>
            ))}
        </div>
      )}

      <p className="text-center text-gray-800 text-xs mt-8">
        منصة مساعد اللغة العربية • ابتدائي · متوسط · ثانوي
      </p>
    </div>
  )
}