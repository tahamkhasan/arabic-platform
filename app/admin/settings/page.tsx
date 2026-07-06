'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BRAND } from '@/lib/constants/theme'

const T = {
  bg: BRAND.bg, cardBg: BRAND.bgSoft, textCol: BRAND.text, subCol: BRAND.sub,
  borderCol: BRAND.border, inputBg: 'rgba(140,20,40,0.04)',
  headerBg: 'rgba(247,242,234,0.97)', shadow: BRAND.shadow,
  gradMain: BRAND.gradMain, gradBlue: BRAND.gradBlue,
}

type AssignedRole = { id:string; key:string; name:string; description?:string|null; permissions?:string[]; is_active?:boolean } | null
type CurrentUser  = { id:string; email:string; role:string; status?:string; user_type?:string; assigned_role_id?:string|null; assigned_role?:AssignedRole; is_active?:boolean; effective_role?:string; permissions?:string[] }
type PlatformSettings = { platform_name?:string; logo_url?:string; support_email?:string; contact_phone?:string; landing_title?:string; landing_subtitle?:string; [key:string]:any }

export default function AdminSettingsPage() {
  const router = useRouter()
  const logoInputRef     = useRef<HTMLInputElement|null>(null)
  const shortTemplateRef = useRef<HTMLInputElement|null>(null)
  const finalTemplateRef = useRef<HTMLInputElement|null>(null)

  const [admin,           setAdmin]           = useState<CurrentUser|null>(null)
  const [authChecking,    setAuthChecking]    = useState(true)
  const [fatalError,      setFatalError]      = useState('')
  const [message,         setMessage]         = useState('')
  const [settings,        setSettings]        = useState<PlatformSettings>({})
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [savingSettings,  setSavingSettings]  = useState(false)
  const [logoUrl,         setLogoUrl]         = useState('/logo-midad.png')
  const [logoFile,        setLogoFile]        = useState<File|null>(null)
  const [logoPreview,     setLogoPreview]     = useState('')
  const [uploadingLogo,   setUploadingLogo]   = useState(false)
  const [platformName,    setPlatformName]    = useState('')
  const [supportEmail,    setSupportEmail]    = useState('')
  const [contactPhone,    setContactPhone]    = useState('')
  const [landingTitle,    setLandingTitle]    = useState('')
  const [landingSubtitle, setLandingSubtitle] = useState('')
  const [semester1Active, setSemester1Active] = useState(true)
  const [semester2Active, setSemester2Active] = useState(true)
  const [loadingSemesters,setLoadingSemesters]= useState(false)
  const [savingSemesters, setSavingSemesters] = useState(false)

  // ── نماذج الاختبارات ─────────────────────────────────────────
  const [shortTemplate,  setShortTemplate]  = useState<{url:string|null,name:string|null}>({url:null,name:null})
  const [finalTemplate,  setFinalTemplate]  = useState<{url:string|null,name:string|null}>({url:null,name:null})
  const [shortFile,      setShortFile]      = useState<File|null>(null)
  const [finalFile,      setFinalFile]      = useState<File|null>(null)
  const [uploadingShort, setUploadingShort] = useState(false)
  const [uploadingFinal, setUploadingFinal] = useState(false)

  // ── جديد: الذكاء الاصطناعي الاحتياطي (Claude + Gemini) ────────
  const [aiDailyLimit,     setAiDailyLimit]     = useState(0)        // 0 = بلا حد
  const [aiUsageToday,     setAiUsageToday]     = useState(0)
  const [aiLimitInput,     setAiLimitInput]     = useState('')
  const [loadingAiProvider,setLoadingAiProvider]= useState(false)
  const [savingAiProvider, setSavingAiProvider] = useState(false)

  async function getAccessToken() {
    const { data:{session}, error } = await supabase.auth.getSession()
    if (error || !session?.access_token) return null
    return session.access_token
  }

  async function fetchMe(token:string) {
    const res  = await fetch('/api/auth/me', { method:'GET', headers:{ Authorization:`Bearer ${token}` } })
    const data = await res.json().catch(()=>null)
    if (!res.ok || !data?.user) throw new Error(data?.error || 'تعذر التحقق من المستخدم الحالي')
    return data.user as CurrentUser
  }

  async function loadSettings() {
    try {
      setLoadingSettings(true); setMessage('')
      const res  = await fetch('/api/platform-settings', { method:'GET' })
      const data = await res.json().catch(()=>null)
      if (!res.ok) throw new Error(data?.error || 'فشل تحميل إعدادات المنصة')
      const s = data?.settings || {}
      setSettings(s); setLogoUrl(s.logo_url || '/logo-midad.png')
      setPlatformName(s.platform_name || ''); setSupportEmail(s.support_email || '')
      setContactPhone(s.contact_phone || ''); setLandingTitle(s.landing_title || '')
      setLandingSubtitle(s.landing_subtitle || '')
    } catch (error:any) {
      setMessage(`❌ ${error?.message || 'تعذر تحميل إعدادات المنصة'}`)
    } finally { setLoadingSettings(false) }
  }

  async function loadSemesters() {
    try {
      setLoadingSemesters(true)
      const res  = await fetch('/api/platform-settings/semesters')
      const data = await res.json().catch(()=>null)
      if (data) { setSemester1Active(data.semester_1_active !== false); setSemester2Active(data.semester_2_active !== false) }
    } catch {} finally { setLoadingSemesters(false) }
  }

  async function loadTemplates() {
    try {
      const res  = await fetch('/api/platform-settings/quiz-templates')
      const data = await res.json().catch(()=>null)
      if (data?.short) setShortTemplate(data.short)
      if (data?.final) setFinalTemplate(data.final)
    } catch {}
  }

  // ── جديد: تحميل حالة الذكاء الاصطناعي الاحتياطي ──────────────
  async function loadAiProvider() {
    try {
      setLoadingAiProvider(true)
      const accessToken = await getAccessToken()
      if (!accessToken) return
      const res  = await fetch('/api/platform-settings/ai-provider', { headers:{ Authorization:`Bearer ${accessToken}` } })
      const data = await res.json().catch(()=>null)
      if (res.ok && data) {
        setAiDailyLimit(data.dailyLimit || 0)
        setAiUsageToday(data.usageToday || 0)
        setAiLimitInput(data.dailyLimit ? String(data.dailyLimit) : '')
      }
    } catch {} finally { setLoadingAiProvider(false) }
  }

  async function saveAiLimit() {
    try {
      setSavingAiProvider(true); setMessage('')
      const accessToken = await getAccessToken()
      if (!accessToken) { setFatalError('انتهت الجلسة. أعد تسجيل الدخول.'); return }
      const limit = aiLimitInput.trim() === '' ? 0 : Number(aiLimitInput)
      if (!Number.isFinite(limit) || limit < 0) { setMessage('❌ قيمة الحد اليومي غير صالحة'); return }
      const res  = await fetch('/api/platform-settings/ai-provider', { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${accessToken}` }, body:JSON.stringify({ dailyLimit: limit }) })
      const data = await res.json().catch(()=>null)
      if (!res.ok) throw new Error(data?.error || 'فشل حفظ الحد اليومي')
      setAiDailyLimit(data.dailyLimit || 0)
      setMessage('✅ تم حفظ حد الذكاء الاصطناعي'); setTimeout(()=>setMessage(''), 2500)
    } catch (error:any) {
      setMessage(`❌ ${error?.message || 'تعذر حفظ الحد اليومي'}`)
    } finally { setSavingAiProvider(false) }
  }

  async function toggleSemester(which:1|2) {
    try {
      setSavingSemesters(true); setMessage('')
      const accessToken = await getAccessToken()
      if (!accessToken) { setFatalError('انتهت الجلسة. أعد تسجيل الدخول.'); return }
      const nextVal = which === 1 ? !semester1Active : !semester2Active
      const payload = which === 1 ? { semester_1_active: nextVal } : { semester_2_active: nextVal }
      const res  = await fetch('/api/platform-settings/semesters', { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${accessToken}` }, body:JSON.stringify(payload) })
      const data = await res.json().catch(()=>null)
      if (!res.ok) throw new Error(data?.error || 'فشل تحديث حالة الفصل الدراسي')
      setSemester1Active(data.semester_1_active !== false); setSemester2Active(data.semester_2_active !== false)
      setMessage('✅ تم تحديث حالة الفصل الدراسي'); setTimeout(()=>setMessage(''), 2000)
    } catch (error:any) {
      setMessage(`❌ ${error?.message || 'تعذر تحديث حالة الفصل'}`)
    } finally { setSavingSemesters(false) }
  }

  async function uploadTemplate(type:'short'|'final') {
    const file = type === 'short' ? shortFile : finalFile
    if (!file) return
    const setUploading = type === 'short' ? setUploadingShort : setUploadingFinal
    try {
      setUploading(true); setMessage('')
      const accessToken = await getAccessToken()
      if (!accessToken) return
      const fd = new FormData(); fd.append('file', file); fd.append('type', type)
      const res  = await fetch('/api/platform-settings/quiz-templates', { method:'POST', headers:{ Authorization:`Bearer ${accessToken}` }, body:fd })
      const data = await res.json().catch(()=>null)
      if (!res.ok) throw new Error(data?.error || 'فشل الرفع')
      setMessage(data.message || '✅ تم رفع النموذج بنجاح')
      if (type === 'short') { setShortTemplate({url:data.url,name:data.name}); setShortFile(null) }
      else                  { setFinalTemplate({url:data.url,name:data.name}); setFinalFile(null)  }
      setTimeout(()=>setMessage(''), 3000)
    } catch (err:any) {
      setMessage(`❌ ${err?.message || 'حدث خطأ'}`)
    } finally { setUploading(false) }
  }

  async function deleteTemplate(type:'short'|'final') {
    if (!confirm('هل تريد حذف هذا النموذج؟')) return
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) return
      await fetch('/api/platform-settings/quiz-templates', { method:'DELETE', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${accessToken}` }, body:JSON.stringify({ type }) })
      if (type === 'short') setShortTemplate({url:null,name:null})
      else                  setFinalTemplate({url:null,name:null})
      setMessage('✅ تم حذف النموذج.'); setTimeout(()=>setMessage(''), 2000)
    } catch {}
  }

  async function saveSettings() {
    try {
      setSavingSettings(true); setMessage('')
      const accessToken = await getAccessToken()
      if (!accessToken) { setFatalError('انتهت الجلسة. أعد تسجيل الدخول.'); return }
      const payload = { platform_name:platformName.trim(), support_email:supportEmail.trim(), contact_phone:contactPhone.trim(), landing_title:landingTitle.trim(), landing_subtitle:landingSubtitle.trim() }
      const res  = await fetch('/api/platform-settings', { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${accessToken}` }, body:JSON.stringify(payload) })
      const data = await res.json().catch(()=>null)
      if (!res.ok) throw new Error(data?.error || 'فشل حفظ إعدادات المنصة')
      setSettings(data?.settings || { ...settings, ...payload })
      setMessage('✅ تم حفظ إعدادات المنصة بنجاح'); setTimeout(()=>setMessage(''), 2500)
    } catch (error:any) {
      setMessage(`❌ ${error?.message || 'تعذر حفظ الإعدادات'}`)
    } finally { setSavingSettings(false) }
  }

  async function uploadLogo() {
    if (!logoFile) return
    try {
      setUploadingLogo(true); setMessage('')
      const accessToken = await getAccessToken()
      if (!accessToken) { setFatalError('انتهت الجلسة. أعد تسجيل الدخول.'); return }
      const form = new FormData(); form.append('logo', logoFile)
      const res  = await fetch('/api/platform-settings/logo', { method:'POST', headers:{ Authorization:`Bearer ${accessToken}` }, body:form })
      const data = await res.json().catch(()=>null)
      if (!res.ok) throw new Error(data?.error || 'فشل رفع الشعار')
      const nextUrl = data?.url || logoUrl
      setLogoUrl(nextUrl); setSettings(prev=>({...prev,logo_url:nextUrl}))
      setLogoFile(null); setLogoPreview('')
      if (logoInputRef.current) logoInputRef.current.value = ''
      setMessage('✅ تم رفع الشعار بنجاح'); setTimeout(()=>setMessage(''), 2500)
    } catch (error:any) {
      setMessage(`❌ ${error?.message || 'تعذر رفع الشعار'}`)
    } finally { setUploadingLogo(false) }
  }

  async function handleLogout() {
    localStorage.removeItem('mosaed_user'); localStorage.removeItem('mosaed_session')
    await supabase.auth.signOut(); router.replace('/login')
  }

  useEffect(() => {
    let mounted = true
    async function checkAuth() {
      try {
        setFatalError('')
        const accessToken = await getAccessToken()
        if (!accessToken) { setFatalError('لا توجد جلسة صالحة. أعد تسجيل الدخول.'); return }
        const appUser = await fetchMe(accessToken)
        if (!mounted) return
        if (appUser.role !== 'admin') { if (appUser.user_type==='student') router.replace('/student'); else router.replace('/dashboard'); return }
        localStorage.setItem('mosaed_user', JSON.stringify(appUser))
        setAdmin(appUser)
        await loadSettings(); await loadSemesters(); await loadTemplates(); await loadAiProvider()
      } catch (error:any) {
        localStorage.removeItem('mosaed_user')
        if (mounted) setFatalError(error?.message || 'فشل التحقق من جلسة الأدمن')
      } finally { if (mounted) setAuthChecking(false) }
    }
    checkAuth()
    const { data:{subscription} } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') { localStorage.removeItem('mosaed_user'); router.replace('/login') }
    })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [router])

  useEffect(() => {
    if (!logoFile) { setLogoPreview(''); return }
    const objectUrl = URL.createObjectURL(logoFile)
    setLogoPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [logoFile])

  if (authChecking) return <div dir="rtl" style={centerPageStyle}>⏳ جارٍ التحقق من الجلسة...</div>

  if (fatalError) return (
    <div dir="rtl" style={{ ...centerPageStyle, padding:24 }}>
      <div style={fatalCardStyle}>
        <div style={{ fontSize:42, marginBottom:10 }}>⚠️</div>
        <h1 style={{ fontSize:24, fontWeight:BRAND.weightBlack, fontFamily:BRAND.fontHeading, marginBottom:10 }}>تعذر فتح إعدادات المنصة</h1>
        <p style={{ fontSize:14, color:T.subCol, lineHeight:1.9, marginBottom:16 }}>{fatalError}</p>
        <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
          <button type="button" onClick={()=>window.location.reload()} style={primaryBtn}>إعادة المحاولة</button>
          <button type="button" onClick={()=>router.replace('/login')} style={ghostBtn}>الذهاب إلى تسجيل الدخول</button>
        </div>
      </div>
    </div>
  )

  if (!admin) return <div dir="rtl" style={centerPageStyle}>تعذر تحميل بيانات الأدمن.</div>

  return (
    <div dir="rtl" style={{ minHeight:'100vh', background:T.bg, color:T.textCol, fontFamily:BRAND.fontBody, paddingBottom:40 }}>
      <style>{`
        * { box-sizing: border-box; } body { margin: 0; }
        input:focus, textarea:focus { outline:none; border-color:rgba(140,20,40,0.4)!important; box-shadow:0 0 0 3px rgba(140,20,40,0.06); }
        @media (max-width:980px) { .settings-grid { grid-template-columns:1fr!important; } }
        @media (max-width:760px) { .topbar { flex-direction:column; align-items:stretch!important; } .topbar-actions { width:100%; justify-content:stretch!important; } .hero-grid { grid-template-columns:1fr!important; } }
      `}</style>

      <header style={{ position:'sticky', top:0, zIndex:50, background:T.headerBg, backdropFilter:'blur(20px)', borderBottom:`1px solid ${T.borderCol}`, padding:'12px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:T.shadow }}>
        <div className="topbar" style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:BRAND.radiusSm, background:T.gradMain, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:BRAND.weightBlack, color:'#fff' }}>م</div>
            <div>
              <div style={{ fontSize:16, fontWeight:BRAND.weightBlack, fontFamily:BRAND.fontHeading, color:T.textCol }}>إعدادات المنصة</div>
              <div style={{ fontSize:12, color:T.subCol }}>{admin.email}</div>
            </div>
          </div>
          <div className="topbar-actions" style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <Link href="/admin" style={linkGhostBtn}>← لوحة الأدمن</Link>
            <Link href="/dashboard" style={linkGhostBtn}>← المنصة</Link>
            <button type="button" onClick={handleLogout} style={dangerBtn}>🚪 خروج</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth:1280, margin:'0 auto', padding:'20px 16px' }}>
        {message && (
          <div style={{ padding:'11px 16px', borderRadius:BRAND.radiusSm, marginBottom:16, fontSize:14, fontWeight:BRAND.weightBold, textAlign:'center', background:message.startsWith('✅')?'rgba(5,150,105,0.10)':'rgba(140,20,40,0.10)', border:`1px solid ${message.startsWith('✅')?'rgba(5,150,105,0.3)':'rgba(140,20,40,0.3)'}`, color:message.startsWith('✅')?'#059669':BRAND.crimson }}>
            {message}
          </div>
        )}

        {/* الفصول الدراسية */}
        <section style={{ background:T.cardBg, borderRadius:BRAND.radiusXl, border:`1px solid ${T.borderCol}`, boxShadow:T.shadow, padding:22, marginBottom:18 }}>
          <h2 style={{ fontSize:18, fontWeight:BRAND.weightBlack, fontFamily:BRAND.fontHeading, marginBottom:6, color:BRAND.crimson }}>📅 الفصول الدراسية</h2>
          <p style={{ fontSize:13, color:T.subCol, lineHeight:1.8, marginBottom:18 }}>يتحكم هذا الإعداد في ما يراه الطلاب فقط — الوحدات والدروس تبقى محفوظة في الحالتين.</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {([
              [1,'الفصل الدراسي الأول',semester1Active],
              [2,'الفصل الدراسي الثاني',semester2Active],
            ] as const).map(([num,label,active])=>(
              <div key={num} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderRadius:BRAND.radiusMd, border:`1.5px solid ${active?'rgba(5,150,105,0.3)':T.borderCol}`, background:active?'rgba(5,150,105,0.06)':T.inputBg }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:BRAND.weightBold, color:T.textCol }}>{label}</div>
                  <div style={{ fontSize:12, color:active?'#059669':T.subCol, marginTop:2, fontWeight:BRAND.weightBold }}>{active?'✅ مفعَّل — ظاهر للطلاب':'⛔ معطَّل — مخفي عن الطلاب'}</div>
                </div>
                <button type="button" disabled={savingSemesters||loadingSemesters} onClick={()=>toggleSemester(num as 1|2)} style={{ width:52, height:30, borderRadius:999, border:'none', background:active?'#059669':'rgba(111,91,91,0.25)', position:'relative', cursor:savingSemesters?'wait':'pointer', flexShrink:0, padding:0 }}>
                  <span style={{ position:'absolute', top:3, right:active?25:3, width:24, height:24, borderRadius:'50%', background:'#fff', transition:'right 0.2s ease', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }}/>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── نماذج الاختبارات الاحتذائية ── */}
        <section style={{ background:T.cardBg, borderRadius:BRAND.radiusXl, border:`1px solid ${T.borderCol}`, boxShadow:T.shadow, padding:22, marginBottom:18 }}>
          <h2 style={{ fontSize:18, fontWeight:BRAND.weightBlack, fontFamily:BRAND.fontHeading, marginBottom:6, color:BRAND.crimson }}>📋 نماذج الاختبارات الاحتذائية</h2>
          <p style={{ fontSize:13, color:T.subCol, lineHeight:1.8, marginBottom:18 }}>ارفع نموذج اختبار جيد لكل نوع — سيستخدمه الذكاء الاصطناعي كمرجع للصياغة والأسلوب عند كل توليد تلقائياً.</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {([
              { type:'short' as const, label:'الاختبار القصير (درسان)', template:shortTemplate, file:shortFile, setFile:setShortFile, uploading:uploadingShort, ref:shortTemplateRef },
              { type:'final' as const, label:'اختبار نهاية الفصل (خمسة دروس)', template:finalTemplate, file:finalFile, setFile:setFinalFile, uploading:uploadingFinal, ref:finalTemplateRef },
            ]).map(({ type, label, template, file, setFile, uploading, ref })=>(
              <div key={type} style={{ padding:16, borderRadius:BRAND.radiusMd, background:T.inputBg, border:`1.5px solid ${template.url?'rgba(5,150,105,0.3)':T.borderCol}` }}>
                <div style={{ fontSize:14, fontWeight:BRAND.weightBlack, color:T.textCol, marginBottom:10 }}>{label}</div>
                {template.url ? (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderRadius:8, background:'rgba(5,150,105,0.08)', border:'1px solid rgba(5,150,105,0.25)', marginBottom:10, fontSize:12, gap:8 }}>
                    <a href={template.url} target="_blank" rel="noopener noreferrer" style={{ color:'#059669', fontWeight:BRAND.weightBold, textDecoration:'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>✅ {template.name}</a>
                    <button type="button" onClick={()=>deleteTemplate(type)} style={{ background:'none', border:'none', color:BRAND.crimson, cursor:'pointer', fontSize:12, fontWeight:BRAND.weightBold, flexShrink:0 }}>🗑️ حذف</button>
                  </div>
                ) : (
                  <div style={{ padding:'8px 12px', borderRadius:8, background:'rgba(220,100,40,0.08)', color:BRAND.orange, fontSize:12, fontWeight:BRAND.weightBold, marginBottom:10 }}>⚠️ لم يُرفع نموذج بعد</div>
                )}
                <input ref={ref} type="file" accept=".doc,.docx" style={{ display:'none' }} onChange={e=>{ setFile(e.target.files?.[0]??null); if(ref.current) ref.current.value='' }}/>
                <button type="button" onClick={()=>ref.current?.click()} style={{ width:'100%', padding:'9px', borderRadius:8, border:`2px dashed ${file?BRAND.crimson:T.borderCol}`, background:'transparent', color:file?BRAND.crimson:T.subCol, cursor:'pointer', fontSize:12, fontFamily:'inherit', marginBottom:8 }}>
                  {file?`📄 ${file.name}`:'＋ اختر ملف Word (.docx)'}
                </button>
                <button type="button" onClick={()=>uploadTemplate(type)} disabled={!file||uploading} style={{ width:'100%', padding:'9px', borderRadius:8, border:'none', background:file?BRAND.gradMain:'rgba(111,91,91,0.12)', color:file?'#fff':T.subCol, fontWeight:BRAND.weightBold, fontSize:13, cursor:file?'pointer':'not-allowed', fontFamily:'inherit' }}>
                  {uploading?'⏳ جارٍ الرفع...':'⬆️ رفع النموذج'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── جديد: الذكاء الاصطناعي الاحتياطي (Claude + Gemini) ── */}
        <section style={{ background:T.cardBg, borderRadius:BRAND.radiusXl, border:`1px solid ${T.borderCol}`, boxShadow:T.shadow, padding:22, marginBottom:18 }}>
          <h2 style={{ fontSize:18, fontWeight:BRAND.weightBlack, fontFamily:BRAND.fontHeading, marginBottom:6, color:BRAND.crimson }}>🔀 الذكاء الاصطناعي الاحتياطي</h2>
          <p style={{ fontSize:13, color:T.subCol, lineHeight:1.8, marginBottom:18 }}>
            Claude هو المحرك الأساسي دائماً لكل أدوات التوليد (شرح، خطط، اختبارات، أوراق عمل، ألعاب، ودردشة الطالب).
            عند انقطاع الاتصال به، أو تعطّله، أو بلوغ الحد اليومي أدناه، تتحوّل المنصة تلقائياً إلى Gemini كمزوّد احتياطي بنفس الدقة والتعليمات.
          </p>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
            <div style={{ padding:'14px 16px', borderRadius:BRAND.radiusMd, border:`1.5px solid ${T.borderCol}`, background:T.inputBg }}>
              <div style={{ fontSize:12, color:T.subCol, marginBottom:4 }}>استدعاءات Claude اليوم</div>
              <div style={{ fontSize:22, fontWeight:BRAND.weightBlack, color:T.textCol }}>
                {loadingAiProvider ? '...' : aiUsageToday}
                {aiDailyLimit > 0 && <span style={{ fontSize:14, color:T.subCol, fontWeight:BRAND.weightBold }}> / {aiDailyLimit}</span>}
              </div>
            </div>
            <div style={{ padding:'14px 16px', borderRadius:BRAND.radiusMd, border:`1.5px solid ${aiDailyLimit>0 && aiUsageToday>=aiDailyLimit ? 'rgba(220,100,40,0.35)' : 'rgba(5,150,105,0.3)'}`, background: aiDailyLimit>0 && aiUsageToday>=aiDailyLimit ? 'rgba(220,100,40,0.08)' : 'rgba(5,150,105,0.06)' }}>
              <div style={{ fontSize:12, color:T.subCol, marginBottom:4 }}>حالة المزوّد الآن</div>
              <div style={{ fontSize:15, fontWeight:BRAND.weightBlack, color: aiDailyLimit>0 && aiUsageToday>=aiDailyLimit ? BRAND.orange : '#059669' }}>
                {aiDailyLimit>0 && aiUsageToday>=aiDailyLimit ? '⚠️ Gemini (الحد مُستنفَد)' : '✅ Claude نشط'}
              </div>
            </div>
          </div>

          <label style={{ display:'grid', gap:7, maxWidth:360 }}>
            <span style={{ fontSize:13, color:T.subCol, fontWeight:BRAND.weightBold }}>الحد اليومي لاستدعاءات Claude (0 = بلا حد)</span>
            <div style={{ display:'flex', gap:8 }}>
              <input
                type="number" min={0} value={aiLimitInput}
                onChange={e=>setAiLimitInput(e.target.value)}
                placeholder="مثال: 500"
                style={{ ...inputStyle, direction:'ltr', textAlign:'right' }}
              />
              <button type="button" onClick={saveAiLimit} disabled={savingAiProvider} style={{ ...primaryBtn, flexShrink:0 }}>
                {savingAiProvider ? '...' : '💾 حفظ'}
              </button>
            </div>
          </label>
        </section>

        <div className="hero-grid" style={{ display:'grid', gridTemplateColumns:'1.2fr 0.8fr', gap:16, marginBottom:18 }}>
          <section style={{ background:T.cardBg, borderRadius:BRAND.radiusXl, border:`1px solid ${T.borderCol}`, boxShadow:T.shadow, padding:22 }}>
            <div style={{ fontSize:13, color:T.subCol, marginBottom:8 }}>الهوية العامة</div>
            <h1 style={{ fontSize:26, fontWeight:BRAND.weightBlack, fontFamily:BRAND.fontHeading, marginBottom:8 }}>{platformName||'مِداد'}</h1>
            <p style={{ fontSize:14, color:T.subCol, lineHeight:1.9, margin:0 }}>عدّل اسم المنصة وبيانات التواصل وعنوان صفحة الهبوط، ثم ارفع شعارًا جديدًا من نفس الصفحة.</p>
          </section>
          <section style={{ background:T.cardBg, borderRadius:BRAND.radiusXl, border:`1px solid ${T.borderCol}`, boxShadow:T.shadow, padding:22, display:'flex', flexDirection:'column', justifyContent:'center', gap:8 }}>
            <div style={{ fontSize:13, color:T.subCol }}>حالة التحميل</div>
            <div style={{ fontSize:24, fontWeight:BRAND.weightBlack, color:loadingSettings?BRAND.orange:'#059669' }}>{loadingSettings?'جارٍ التحميل...':'✓ جاهز للتعديل'}</div>
            <div style={{ fontSize:13, color:T.subCol }}>الحقول والشعار مرتبطان مباشرة بإعدادات المنصة الحالية.</div>
          </section>
        </div>

        <div className="settings-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, alignItems:'start' }}>
          <section style={{ background:T.cardBg, borderRadius:BRAND.radiusXl, border:`1px solid ${T.borderCol}`, boxShadow:T.shadow, padding:22 }}>
            <h2 style={{ fontSize:18, fontWeight:BRAND.weightBlack, fontFamily:BRAND.fontHeading, marginBottom:18, color:BRAND.crimson }}>معلومات المنصة</h2>
            <div style={{ display:'grid', gap:14 }}>
              <Field label="اسم المنصة"><input value={platformName} onChange={e=>setPlatformName(e.target.value)} placeholder="مثال: مِداد" style={inputStyle}/></Field>
              <Field label="البريد الداعم"><input type="email" value={supportEmail} onChange={e=>setSupportEmail(e.target.value)} placeholder="support@example.com" style={{ ...inputStyle, direction:'ltr', textAlign:'right' }}/></Field>
              <Field label="رقم التواصل"><input value={contactPhone} onChange={e=>setContactPhone(e.target.value)} placeholder="+965 ..." style={{ ...inputStyle, direction:'ltr', textAlign:'right' }}/></Field>
              <Field label="عنوان صفحة الهبوط"><input value={landingTitle} onChange={e=>setLandingTitle(e.target.value)} placeholder="عنوان رئيسي" style={inputStyle}/></Field>
              <Field label="وصف صفحة الهبوط"><textarea value={landingSubtitle} onChange={e=>setLandingSubtitle(e.target.value)} rows={4} style={{ ...inputStyle, resize:'vertical', lineHeight:1.8 }}/></Field>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:4 }}>
                <button type="button" onClick={saveSettings} disabled={savingSettings} style={primaryBtn}>{savingSettings?'جارٍ الحفظ...':'💾 حفظ الإعدادات'}</button>
                <button type="button" onClick={loadSettings} disabled={loadingSettings} style={ghostBtn}>{loadingSettings?'جارٍ التحديث...':'↻ إعادة التحميل'}</button>
              </div>
            </div>
          </section>

          <section style={{ background:T.cardBg, borderRadius:BRAND.radiusXl, border:`1px solid ${T.borderCol}`, boxShadow:T.shadow, padding:22 }}>
            <h2 style={{ fontSize:18, fontWeight:BRAND.weightBlack, fontFamily:BRAND.fontHeading, marginBottom:18, color:BRAND.crimson }}>الشعار والهوية</h2>
            <div style={{ textAlign:'center', marginBottom:18, padding:22, borderRadius:BRAND.radiusMd, background:T.inputBg, border:`1px dashed ${T.borderCol}` }}>
              <img src={logoUrl} alt="شعار المنصة" style={{ maxHeight:84, maxWidth:'100%', objectFit:'contain', margin:'0 auto' }} onError={e=>{(e.target as HTMLImageElement).src='/logo-midad.png'}}/>
              <p style={{ fontSize:12, color:T.subCol, marginTop:8 }}>الشعار الحالي</p>
            </div>
            <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display:'none' }} onChange={e=>setLogoFile(e.target.files?.[0]??null)}/>
            <button type="button" onClick={()=>logoInputRef.current?.click()} style={{ width:'100%', padding:14, borderRadius:BRAND.radiusMd, border:`2px dashed ${logoFile?BRAND.crimson:BRAND.border}`, background:logoFile?'rgba(140,20,40,0.06)':'transparent', color:logoFile?BRAND.crimson:T.subCol, cursor:'pointer', fontSize:14, fontWeight:BRAND.weightBold, fontFamily:'inherit', marginBottom:14 }}>
              {logoFile?logoFile.name:'اختر شعارًا جديدًا (PNG / JPG / WEBP / SVG)'}
            </button>
            {logoFile && logoPreview && (
              <div style={{ marginBottom:14, padding:'12px 14px', borderRadius:BRAND.radiusMd, background:'rgba(140,20,40,0.05)', border:`1px solid ${T.borderCol}`, color:T.subCol }}>
                <div style={{ fontSize:13, marginBottom:8 }}>الحجم: {(logoFile.size/1024).toFixed(1)} KB</div>
                <img src={logoPreview} alt="معاينة" style={{ maxHeight:60, maxWidth:'100%', objectFit:'contain', borderRadius:8 }}/>
              </div>
            )}
            <button type="button" onClick={uploadLogo} disabled={uploadingLogo||!logoFile} style={{ width:'100%', padding:14, borderRadius:BRAND.radiusMd, border:'none', background:logoFile?BRAND.gradMain:'rgba(111,91,91,0.12)', color:logoFile?'#fff':BRAND.sub, fontWeight:BRAND.weightBlack, fontSize:15, cursor:logoFile?'pointer':'not-allowed', fontFamily:'inherit', boxShadow:logoFile?BRAND.shadowWarm:'none' }}>
              {uploadingLogo?'جارٍ رفع الشعار...':'⬆️ رفع الشعار'}
            </button>
            <p style={{ fontSize:12, color:T.subCol, marginTop:12, textAlign:'center', lineHeight:1.8 }}>يُفضّل شعار أفقي بخلفية شفافة.</p>
          </section>
        </div>

        <section style={{ background:T.cardBg, borderRadius:BRAND.radiusXl, border:`1px solid ${T.borderCol}`, boxShadow:T.shadow, padding:22, marginTop:16 }}>
          <h2 style={{ fontSize:18, fontWeight:BRAND.weightBlack, fontFamily:BRAND.fontHeading, marginBottom:16, color:BRAND.crimson }}>معاينة سريعة</h2>
          <div style={{ borderRadius:BRAND.radiusLg, padding:20, border:`1px solid ${T.borderCol}`, background:'linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,255,255,0.75))' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, flexWrap:'wrap' }}>
              <img src={logoUrl} alt="معاينة الشعار" style={{ height:46, width:'auto', objectFit:'contain' }} onError={e=>{(e.target as HTMLImageElement).src='/logo-midad.png'}}/>
              <div>
                <div style={{ fontSize:18, fontWeight:BRAND.weightBlack, fontFamily:BRAND.fontHeading }}>{platformName||'مِداد'}</div>
                <div style={{ fontSize:12, color:T.subCol }}>{supportEmail||'support@example.com'}</div>
              </div>
            </div>
            <div style={{ fontSize:22, fontWeight:BRAND.weightBlack, fontFamily:BRAND.fontHeading, marginBottom:8 }}>{landingTitle||'تعلّم، علِّم، وارتقِ بالعربية.'}</div>
            <div style={{ fontSize:14, color:T.subCol, lineHeight:1.9 }}>{landingSubtitle||'منصة تعليمية مرنة للمعلم والمتعلم في اللغة العربية.'}</div>
          </div>
        </section>
      </main>
    </div>
  )
}

function Field({ label, children }:{ label:string; children:React.ReactNode }) {
  return (
    <label style={{ display:'grid', gap:7 }}>
      <span style={{ fontSize:13, color:T.subCol, fontWeight:BRAND.weightBold }}>{label}</span>
      {children}
    </label>
  )
}

const centerPageStyle: React.CSSProperties = { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:T.bg, color:T.subCol, fontFamily:BRAND.fontBody }
const fatalCardStyle:  React.CSSProperties = { width:'100%', maxWidth:560, background:T.cardBg, border:`1px solid ${T.borderCol}`, borderRadius:BRAND.radiusXl, padding:24, boxShadow:T.shadow, textAlign:'center' }
const inputStyle:      React.CSSProperties = { width:'100%', padding:'12px 14px', borderRadius:BRAND.radiusMd, border:`1.5px solid ${BRAND.border}`, background:'rgba(140,20,40,0.04)', color:BRAND.text, fontSize:14, fontFamily:'inherit' }
const primaryBtn:      React.CSSProperties = { padding:'10px 16px', borderRadius:BRAND.radiusMd, fontSize:13, fontWeight:BRAND.weightBold, border:'none', background:BRAND.gradMain, color:'#fff', cursor:'pointer', fontFamily:'inherit' }
const ghostBtn:        React.CSSProperties = { padding:'10px 16px', borderRadius:BRAND.radiusMd, fontSize:13, fontWeight:BRAND.weightBold, border:`1.5px solid ${BRAND.border}`, background:'transparent', color:BRAND.sub, cursor:'pointer', fontFamily:'inherit' }
const dangerBtn:       React.CSSProperties = { padding:'10px 16px', borderRadius:BRAND.radiusMd, fontSize:13, fontWeight:BRAND.weightBold, border:`1.5px solid ${BRAND.borderStrong}`, background:'rgba(140,20,40,0.06)', color:BRAND.crimson, cursor:'pointer', fontFamily:'inherit' }
const linkGhostBtn:    React.CSSProperties = { ...ghostBtn, textDecoration:'none', display:'inline-flex', alignItems:'center', justifyContent:'center' }