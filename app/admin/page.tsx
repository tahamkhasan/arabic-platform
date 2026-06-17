'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const T = {
  bg:        '#F5F0E8',
  cardBg:    '#FDFAF5',
  textCol:   '#1A1221',
  subCol:    '#6B5050',
  borderCol: 'rgba(192,57,43,0.15)',
  inputBg:   'rgba(192,57,43,0.05)',
  headerBg:  'rgba(245,240,232,0.97)',
  shadow:    '0 2px 12px rgba(192,57,43,0.08)',
  gradMain:  'linear-gradient(135deg,#C0392B,#E07020)',
  gradBlue:  'linear-gradient(135deg,#2563EB,#1D4ED8)',
}

interface User {
  id: string; name: string; email: string
  role: string; user_type: string
  status: string; allowed_grades?: string[]
  created_at: string
}

type Tab = 'users' | 'subjects' | 'stats' | 'settings'

export default function AdminPage() {
  const router = useRouter()
  const [admin,      setAdmin]      = useState<User | null>(null)
  const [tab,        setTab]        = useState<Tab>('users')
  const [users,      setUsers]      = useState<User[]>([])
  const [subjects,   setSubjects]   = useState<{id:string;name:string;grade?:string;icon?:string}[]>([])
  const [loading,    setLoading]    = useState(false)
  const [filter,     setFilter]     = useState<'all'|'pending'|'student'|'teacher'>('all')
  const [searchQ,    setSearchQ]    = useState('')
  const [actionMsg,  setActionMsg]  = useState('')
  const [logoUrl,     setLogoUrl]     = useState('/logo-midad.png')
  const [logoFile,    setLogoFile]    = useState<File | null>(null)
  const [uploading,   setUploading]   = useState(false)
  const [uploadMsg,   setUploadMsg]   = useState('')
  const logoInputRef = useRef<HTMLInputElement | null>(null)

  // ── التحقق من الجلسة ───────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('mosaed_user')
    if (!saved) { router.replace('/'); return }
    try {
      const u = JSON.parse(saved) as User
      // توجيه صحيح حسب الدور
      if (u.role !== 'admin') {
        if (u.user_type === 'student') router.replace('/student')
        else router.replace('/dashboard')
        return
      }
      setAdmin(u)
    } catch { router.replace('/') }
  }, [router])

  // ── جلب شعار المنصة ──────────────────────────────────────────
  useEffect(() => {
    fetch('/api/platform-settings')
      .then(r => r.json())
      .then(d => { if (d.settings?.logo_url) setLogoUrl(d.settings.logo_url) })
      .catch(() => {})
  }, [])

  // ── جلب المستخدمين ─────────────────────────────────────────
  useEffect(() => {
    if (!admin || tab !== 'users') return
    setLoading(true)
    fetch('/api/users')
      .then(r => r.json())
      .then(d => setUsers(d.users ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [admin, tab])

  // ── جلب المواد ─────────────────────────────────────────────
  useEffect(() => {
    if (!admin || tab !== 'subjects') return
    fetch('/api/subjects')
      .then(r => r.json())
      .then(d => setSubjects(d.subjects ?? []))
      .catch(console.error)
  }, [admin, tab])

  // ── موافقة / رفض / حذف ────────────────────────────────────
  async function updateUser(userId: string, updates: Record<string, string>) {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updates }),
      })
      if (res.ok) {
        setActionMsg('✅ تم التحديث')
        setTimeout(() => setActionMsg(''), 2500)
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u))
      }
    } catch { setActionMsg('❌ حدث خطأ') }
  }

  async function deleteUser(userId: string) {
    if (!confirm('هل تريد حذف هذا المستخدم؟')) return
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId))
        setActionMsg('✅ تم الحذف')
        setTimeout(() => setActionMsg(''), 2500)
      }
    } catch { setActionMsg('❌ حدث خطأ') }
  }

  // ── رفع الشعار ────────────────────────────────────────────────
  async function uploadLogo() {
    if (!logoFile) return
    setUploading(true); setUploadMsg('')
    try {
      const form = new FormData()
      form.append('logo', logoFile)
      const res  = await fetch('/api/platform-settings/logo', { method:'POST', body:form })
      const data = await res.json()
      if (res.ok) {
        setLogoUrl(data.url); setUploadMsg('✅ تم رفع الشعار بنجاح!'); setLogoFile(null)
      } else { setUploadMsg(`❌ ${data.error}`) }
    } catch { setUploadMsg('❌ فشل الاتصال') }
    finally { setUploading(false) }
  }

  // ── تسجيل الخروج — يحذف المفاتيح الموحدة ──────────────────
  function handleLogout() {
    localStorage.removeItem('mosaed_user')
    localStorage.removeItem('mosaed_session')
    router.replace('/')
  }

  if (!admin) return null

  // فلترة المستخدمين
  const filtered = users.filter(u => {
    const matchSearch = !searchQ || u.name.includes(searchQ) || u.email.includes(searchQ)
    const matchFilter =
      filter === 'all'     ? true :
      filter === 'pending' ? u.status === 'pending' :
      filter === 'student' ? u.user_type === 'student' :
      filter === 'teacher' ? u.role === 'teacher' : true
    return matchSearch && matchFilter
  })

  const pendingCount = users.filter(u => u.status === 'pending').length
  const studentsCount = users.filter(u => u.user_type === 'student').length
  const teachersCount = users.filter(u => u.role === 'teacher' && u.user_type !== 'student').length

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px', borderRadius: 10,
    border: `1.5px solid ${T.borderCol}`,
    background: T.inputBg, color: T.textCol,
    fontSize: 14, fontFamily: 'inherit',
  }

  const TABS: { id: Tab; icon: string; label: string; badge?: number }[] = [
    { id:'users',    icon:'👥', label:'المستخدمون', badge: pendingCount },
    { id:'subjects', icon:'📚', label:'المواد' },
    { id:'stats',    icon:'📊', label:'الإحصائيات' },
    { id:'settings', icon:'⚙️', label:'إعدادات المنصة' },
  ]

  return (
    <div dir="rtl" style={{ minHeight:'100vh', background: T.bg, color: T.textCol, fontFamily:"'Segoe UI',Tahoma,Arial,sans-serif", paddingBottom: 80 }}>
      <style>{`
        *{box-sizing:border-box;} body{margin:0;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
        .fade-in{animation:fadeIn 0.3s ease;}
        input:focus,select:focus{outline:none;border-color:rgba(192,57,43,0.4)!important;}
        select option{background:#F5F0E8!important;color:#1A1221!important;}
        select{color-scheme:light;}
      `}</style>

      {/* الرأس */}
      <header style={{ position:'sticky',top:0,zIndex:50,background:T.headerBg,backdropFilter:'blur(20px)',borderBottom:`1px solid ${T.borderCol}`,padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:T.shadow }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <div style={{ width:38,height:38,borderRadius:10,background:T.gradMain,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:900,color:'#fff' }}>م</div>
          <div>
            <div style={{ fontSize:16,fontWeight:900,color:T.textCol }}>مِداد</div>
            <div style={{ fontSize:12,color:T.subCol }}>👑 {admin.name} • مدير</div>
          </div>
        </div>
        <div style={{ display:'flex',gap:8 }}>
          <button onClick={() => router.push('/dashboard')} style={{ padding:'8px 14px',borderRadius:9,fontSize:13,fontWeight:700,border:`1.5px solid ${T.borderCol}`,background:'transparent',color:T.subCol,cursor:'pointer',fontFamily:'inherit' }}>
            ✨ أدوات التوليد
          </button>
          <button onClick={handleLogout} style={{ padding:'8px 14px',borderRadius:9,fontSize:13,fontWeight:700,border:'1.5px solid rgba(192,57,43,0.3)',background:'rgba(192,57,43,0.06)',color:'#C0392B',cursor:'pointer',fontFamily:'inherit' }}>
            🚪 خروج
          </button>
        </div>
      </header>

      <main style={{ maxWidth:900,margin:'0 auto',padding:'20px 16px' }}>

        {/* رسالة الإجراء */}
        {actionMsg && (
          <div style={{ padding:'11px 16px',borderRadius:10,marginBottom:16,fontSize:14,fontWeight:700,textAlign:'center',background:actionMsg.startsWith('✅')?'rgba(5,150,105,0.1)':'rgba(192,57,43,0.1)',border:`1px solid ${actionMsg.startsWith('✅')?'rgba(5,150,105,0.3)':'rgba(192,57,43,0.3)'}`,color:actionMsg.startsWith('✅')?'#059669':'#C0392B' }}>
            {actionMsg}
          </div>
        )}

        {/* ── تبويب المستخدمين ── */}
        {tab === 'users' && (
          <div className="fade-in">
            {/* بطاقات الإحصاء */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:24 }}>
              {[
                { label:'إجمالي المستخدمين', value: users.length,   color:'#C0392B', icon:'👥' },
                { label:'طلاب مسجلون',        value: studentsCount,  color:'#E07020', icon:'👨‍🎓' },
                { label:'بانتظار الموافقة',    value: pendingCount,   color:'#F4A420', icon:'⏳' },
              ].map((s,i) => (
                <div key={i} style={{ padding:'18px',borderRadius:14,background:T.cardBg,border:`1.5px solid ${s.color}20`,boxShadow:T.shadow,textAlign:'center' }}>
                  <div style={{ fontSize:28,marginBottom:6 }}>{s.icon}</div>
                  <div style={{ fontSize:28,fontWeight:900,color:s.color,marginBottom:4 }}>{s.value}</div>
                  <div style={{ fontSize:13,color:T.subCol }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* شريط البحث والفلترة */}
            <div style={{ display:'flex',gap:10,marginBottom:16,flexWrap:'wrap' }}>
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="🔍 بحث بالاسم أو البريد..."
                style={{ ...inputStyle,flex:1,minWidth:200 }} />
              <select value={filter} onChange={e=>setFilter(e.target.value as typeof filter)} style={{ ...inputStyle,cursor:'pointer',minWidth:160 }}>
                <option value="all">الكل ({users.length})</option>
                <option value="pending">بانتظار الموافقة ({pendingCount})</option>
                <option value="student">طلاب ({studentsCount})</option>
                <option value="teacher">معلمون ({teachersCount})</option>
              </select>
            </div>

            {/* قائمة المستخدمين */}
            {loading ? (
              <div style={{ textAlign:'center',padding:'40px',color:T.subCol }}>⏳ جارٍ التحميل...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign:'center',padding:'40px',background:T.cardBg,borderRadius:14,border:`1px solid ${T.borderCol}`,color:T.subCol }}>لا يوجد مستخدمون</div>
            ) : (
              <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                {filtered.map(u => (
                  <div key={u.id} style={{ padding:'14px 18px',borderRadius:14,background:T.cardBg,border:`1.5px solid ${u.status==='pending'?'rgba(244,164,32,0.3)':T.borderCol}`,boxShadow:T.shadow }}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:10 }}>
                      <div>
                        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                          <span style={{ fontSize:18 }}>{u.user_type==='student'?'👨‍🎓':u.role==='admin'?'👑':'👨‍🏫'}</span>
                          <span style={{ fontSize:15,fontWeight:800,color:T.textCol }}>{u.name}</span>
                          <span style={{ fontSize:11,padding:'2px 8px',borderRadius:6,fontWeight:700,
                            background: u.status==='approved'?'rgba(5,150,105,0.1)':u.status==='pending'?'rgba(244,164,32,0.15)':'rgba(192,57,43,0.1)',
                            color: u.status==='approved'?'#059669':u.status==='pending'?'#D97706':'#C0392B'
                          }}>{u.status==='approved'?'✅ مفعّل':u.status==='pending'?'⏳ انتظار':'❌ مرفوض'}</span>
                        </div>
                        <div style={{ fontSize:13,color:T.subCol,marginBottom:4 }}>{u.email}</div>
                        <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
                          <span style={{ fontSize:11,color:T.subCol }}>{u.user_type==='student'?'طالب':u.role==='admin'?'مدير':'معلم'}</span>
                          {u.allowed_grades?.length ? <span style={{ fontSize:11,color:'#C0392B',fontWeight:600 }}>الصف {u.allowed_grades.join('، ')}</span> : null}
                          <span style={{ fontSize:11,color:T.subCol }}>{new Date(u.created_at).toLocaleDateString('ar-KW',{year:'numeric',month:'short',day:'numeric'})}</span>
                        </div>
                      </div>
                      {/* أزرار الإجراءات */}
                      <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                        {u.status === 'pending' && (
                          <button onClick={()=>updateUser(u.id,{status:'approved'})}
                            style={{ padding:'7px 14px',borderRadius:8,border:'none',background:'rgba(5,150,105,0.12)',color:'#059669',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit' }}>
                            ✅ موافقة
                          </button>
                        )}
                        {u.status === 'approved' && u.role !== 'admin' && (
                          <button onClick={()=>updateUser(u.id,{status:'suspended'})}
                            style={{ padding:'7px 14px',borderRadius:8,border:'none',background:'rgba(244,164,32,0.12)',color:'#D97706',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit' }}>
                            🔒 تعليق
                          </button>
                        )}
                        {u.status === 'suspended' && (
                          <button onClick={()=>updateUser(u.id,{status:'approved'})}
                            style={{ padding:'7px 14px',borderRadius:8,border:'none',background:'rgba(5,150,105,0.1)',color:'#059669',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit' }}>
                            🔓 إعادة تفعيل
                          </button>
                        )}
                        {u.user_type === 'student' && u.role !== 'admin' && (
                          <button onClick={()=>updateUser(u.id,{role:'teacher',user_type:'teacher'})}
                            style={{ padding:'7px 14px',borderRadius:8,border:`1px solid ${T.borderCol}`,background:'transparent',color:T.subCol,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit' }}>
                            ترقية لمعلم
                          </button>
                        )}
                        {u.role !== 'admin' && (
                          <button onClick={()=>deleteUser(u.id)}
                            style={{ padding:'7px 12px',borderRadius:8,border:'1px solid rgba(192,57,43,0.3)',background:'rgba(192,57,43,0.06)',color:'#C0392B',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit' }}>
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── تبويب المواد ── */}
        {tab === 'subjects' && (
          <div className="fade-in">
            <h2 style={{ fontSize:20,fontWeight:900,color:'#C0392B',marginBottom:16 }}>📚 المواد الدراسية</h2>
            {subjects.length === 0 ? (
              <div style={{ textAlign:'center',padding:'40px',background:T.cardBg,borderRadius:14,color:T.subCol }}>لا توجد مواد</div>
            ) : (
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14 }}>
                {subjects.map(s => (
                  <div key={s.id} style={{ padding:'18px',borderRadius:14,background:T.cardBg,border:`1.5px solid ${T.borderCol}`,boxShadow:T.shadow,textAlign:'center' }}>
                    <div style={{ fontSize:36,marginBottom:8 }}>{s.icon ?? '📚'}</div>
                    <div style={{ fontSize:15,fontWeight:800,color:T.textCol,marginBottom:4 }}>{s.name}</div>
                    {s.grade && <div style={{ fontSize:12,color:'#C0392B',fontWeight:700 }}>الصف {s.grade}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── تبويب الإحصاء ── */}
        {tab === 'stats' && (
          <div className="fade-in">
            <h2 style={{ fontSize:20,fontWeight:900,color:'#C0392B',marginBottom:20 }}>📊 إحصائيات النظام</h2>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16 }}>
              {[
                { label:'إجمالي المستخدمين',   value:users.length,                                      color:'#C0392B', icon:'👥' },
                { label:'طلاب مسجلون',          value:studentsCount,                                     color:'#E07020', icon:'👨‍🎓' },
                { label:'معلمون',               value:teachersCount,                                     color:'#F4A420', icon:'👨‍🏫' },
                { label:'بانتظار الموافقة',     value:pendingCount,                                      color:'#2563EB', icon:'⏳' },
                { label:'مستخدمون مفعلون',     value:users.filter(u=>u.status==='approved').length,     color:'#059669', icon:'✅' },
                { label:'مواد دراسية',          value:subjects.length,                                   color:'#7C3AED', icon:'📚' },
              ].map((s,i) => (
                <div key={i} style={{ padding:'20px',borderRadius:14,background:T.cardBg,border:`1.5px solid ${s.color}20`,boxShadow:T.shadow }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:13,color:T.subCol,marginBottom:6 }}>{s.label}</div>
                      <div style={{ fontSize:32,fontWeight:900,color:s.color }}>{s.value}</div>
                    </div>
                    <div style={{ fontSize:36,opacity:0.6 }}>{s.icon}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>


        {/* ── تبويب الإعدادات ── */}
        {tab === 'settings' && (
          <div className="fade-in">
            <h2 style={{ fontSize:20,fontWeight:900,color:'#C0392B',marginBottom:24 }}>⚙️ إعدادات المنصة</h2>
            <div style={{ background:T.cardBg,borderRadius:18,border:`1px solid ${T.borderCol}`,padding:28,maxWidth:520,boxShadow:T.shadow }}>
              <h3 style={{ fontSize:16,fontWeight:800,color:T.textCol,marginBottom:20 }}>🖼️ شعار المنصة</h3>

              {/* الشعار الحالي */}
              <div style={{ textAlign:'center',marginBottom:22,padding:22,borderRadius:14,background:T.inputBg,border:`1px dashed ${T.borderCol}` }}>
                <img src={logoUrl} alt="الشعار الحالي" style={{ maxHeight:80,maxWidth:'100%',objectFit:'contain' }} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                <p style={{ fontSize:12,color:T.subCol,marginTop:8 }}>الشعار الحالي</p>
              </div>

              {/* إدخال الملف */}
              <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display:'none' }}
                onChange={e => { setLogoFile(e.target.files?.[0]??null); setUploadMsg('') }} />

              <button onClick={()=>logoInputRef.current?.click()}
                style={{ width:'100%',padding:16,borderRadius:12,border:`2px dashed ${logoFile?'#C0392B':T.borderCol}`,background:logoFile?'rgba(192,57,43,0.06)':'transparent',color:logoFile?'#C0392B':T.subCol,cursor:'pointer',fontSize:14,fontWeight:700,fontFamily:'inherit',marginBottom:14 }}>
                {logoFile ? `✅ ${logoFile.name}` : '📁 اختر صورة الشعار (PNG أو JPG)'}
              </button>

              {/* معاينة */}
              {logoFile && (
                <div style={{ marginBottom:16,padding:'12px 14px',borderRadius:10,background:'rgba(192,57,43,0.05)',border:`1px solid ${T.borderCol}`,fontSize:13,color:T.subCol }}>
                  <div style={{ marginBottom:8 }}>📦 {(logoFile.size/1024).toFixed(1)} KB</div>
                  <img src={URL.createObjectURL(logoFile)} alt="معاينة" style={{ maxHeight:60,maxWidth:'100%',objectFit:'contain',borderRadius:8 }} />
                </div>
              )}

              {/* رسالة */}
              {uploadMsg && (
                <div style={{ padding:'10px 14px',borderRadius:10,marginBottom:14,fontSize:14,fontWeight:700,
                  background:uploadMsg.startsWith('✅')?'rgba(5,150,105,0.08)':'rgba(192,57,43,0.08)',
                  border:`1px solid ${uploadMsg.startsWith('✅')?'rgba(5,150,105,0.3)':'rgba(192,57,43,0.3)'}`,
                  color:uploadMsg.startsWith('✅')?'#059669':'#C0392B' }}>
                  {uploadMsg}
                </div>
              )}

              {/* زر الرفع */}
              <button onClick={uploadLogo} disabled={uploading||!logoFile}
                style={{ width:'100%',padding:'13px',borderRadius:12,border:'none',
                  background:logoFile?'linear-gradient(135deg,#2563EB,#1D4ED8)':'rgba(107,80,80,0.1)',
                  color:logoFile?'#fff':'#6B5050',fontWeight:900,fontSize:15,
                  cursor:logoFile?'pointer':'not-allowed',fontFamily:'inherit',
                  boxShadow:logoFile?'0 5px 18px rgba(37,99,235,0.35)':'none',
                  display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
                {uploading
                  ? <><span style={{ width:16,height:16,border:'2.5px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite' }} />جارٍ الرفع...</>
                  : '🚀 رفع الشعار الجديد'}
              </button>

              <p style={{ fontSize:12,color:T.subCol,marginTop:12,textAlign:'center' }}>
                PNG شفاف • أبعاد مثالية 300×150 • أقل من 2MB
              </p>
            </div>
          </div>
        )}

      {/* شريط التنقل */}
      <nav style={{ position:'fixed',bottom:0,left:0,right:0,zIndex:50,background:T.headerBg,backdropFilter:'blur(20px)',borderTop:`1px solid ${T.borderCol}`,display:'flex',justifyContent:'space-around',padding:'8px 0 14px',boxShadow:'0 -2px 10px rgba(192,57,43,0.07)' }}>
        {TABS.map(tb => (
          <button key={tb.id} onClick={()=>setTab(tb.id)}
            style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:3,background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',padding:'4px 12px',borderRadius:10,color:tab===tb.id?'#C0392B':T.subCol,position:'relative',transition:'all 0.2s' }}>
            <span style={{ fontSize:20 }}>{tb.icon}</span>
            <span style={{ fontSize:11,fontWeight:tab===tb.id?800:600 }}>{tb.label}</span>
            {tb.badge && tb.badge > 0 ? <span style={{ position:'absolute',top:0,right:2,background:'#F4A420',color:'#fff',width:16,height:16,borderRadius:'50%',fontSize:9,fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center' }}>{tb.badge}</span> : null}
          </button>
        ))}
      </nav>
    </div>
  )
}