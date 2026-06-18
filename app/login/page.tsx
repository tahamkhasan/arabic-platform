'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ══ هوية مِداد الكاملة ══
const B = {
  bg:          '#F7F2EA',
  bgForm:      '#FCF8F2',
  text:        '#1F1215',
  sub:         '#6F5B5B',
  border:      'rgba(140,20,40,0.14)',
  borderFocus: 'rgba(140,20,40,0.45)',
  inputBg:     '#FFFFFF',
  deep:        '#781414',
  red:         '#8C1428',
  crimson:     '#B42828',
  orange:      '#DC6428',
  gold:        '#DC8C3C',
  gradMain:    'linear-gradient(135deg,#781414,#B42828,#DC6428)',
  gradWarm:    'linear-gradient(135deg,#781414,#8C1428,#DC8C3C)',
  gradBlue:    'linear-gradient(135deg,#2563EB,#1D4ED8)',
  shadow:      '0 20px 50px rgba(60,16,20,0.08)',
  shadowBlue:  '0 8px 28px rgba(37,99,235,0.42)',
}

const CALIBRI  = "'Calibri','Trebuchet MS','Gill Sans MT',Tahoma,sans-serif"
const CAIRO    = "'Cairo','Segoe UI',Tahoma,Arial,sans-serif"

export default function LoginPage() {
  const router = useRouter()
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPass,     setShowPass]     = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [isRegister,   setIsRegister]   = useState(false)
  const [name,         setName]         = useState('')
  const [logoUrl,      setLogoUrl]      = useState('/logo-midad.png')
  const [focusField,   setFocusField]   = useState('')

  useEffect(() => {
    fetch('/api/platform-settings')
      .then(r => r.json())
      .then(d => { if (d.settings?.logo_url) setLogoUrl(d.settings.logo_url) })
      .catch(() => {})
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res  = await fetch('/api/auth', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'login', email, password }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'بيانات غير صحيحة'); return }
      localStorage.setItem('mosaed_user',    JSON.stringify(data.user))
      localStorage.setItem('mosaed_session', JSON.stringify(data.session))
      if (data.user?.role === 'admin')             router.push('/admin')
      else if (data.user?.user_type === 'student') router.push('/student')
      else                                          router.push('/dashboard')
    } catch { setError('تعذّر الاتصال بالخادم') } finally { setLoading(false) }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res  = await fetch('/api/auth', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'register', email, password, name }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'فشل التسجيل'); return }
      setIsRegister(false); setError('✅ تم التسجيل! انتظر موافقة المدير.')
    } catch { setError('تعذّر الاتصال بالخادم') } finally { setLoading(false) }
  }

  const inp = (name: string): React.CSSProperties => ({
    width:'100%', padding:'14px 46px 14px 16px', borderRadius:12,
    border: `1.5px solid ${focusField===name ? B.borderFocus : B.border}`,
    background: B.inputBg, color: B.text,
    fontSize:15, fontFamily: CAIRO,
    boxShadow: focusField===name ? `0 0 0 3px rgba(140,20,40,0.08)` : 'none',
    transition:'border-color 0.2s,box-shadow 0.2s', outline:'none',
  })

  const Logo = ({ h=56 }: { h?:number }) => (
    <img src={logoUrl} alt="مِداد" height={h}
      style={{ height:h, width:'auto', objectFit:'contain', display:'block' }}
      onError={e=>{ (e.target as HTMLImageElement).src='/logo-midad.png' }} />
  )

  const canSubmit = email.trim() && password.trim()

  return (
    <div dir="rtl" style={{
      minHeight:'100vh', display:'flex',
      fontFamily: CAIRO, background: B.bg,
    }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
        @keyframes fadeUp {from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
        @keyframes float  {0%,100%{transform:translateY(0);}50%{transform:translateY(-9px);}}
        @keyframes spin   {from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes glow   {0%,100%{box-shadow:${B.shadowBlue};}50%{box-shadow:0 14px 44px rgba(37,99,235,0.65);}}
        @keyframes shimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
        @keyframes pulse  {0%,100%{opacity:1;}50%{opacity:0.4;}}
        .a1{opacity:0;animation:fadeUp .5s ease .05s forwards;}
        .a2{opacity:0;animation:fadeUp .5s ease .13s forwards;}
        .a3{opacity:0;animation:fadeUp .5s ease .21s forwards;}
        .a4{opacity:0;animation:fadeUp .5s ease .29s forwards;}
        .a5{opacity:0;animation:fadeUp .5s ease .37s forwards;}
        .a6{opacity:0;animation:fadeUp .5s ease .45s forwards;}
        .r1{opacity:0;animation:fadeUp .6s ease .1s  forwards;}
        .r2{opacity:0;animation:fadeUp .6s ease .2s  forwards;}
        .r3{opacity:0;animation:fadeUp .6s ease .3s  forwards;}
        .r4{opacity:0;animation:fadeUp .6s ease .4s  forwards;}
        .r5{opacity:0;animation:fadeUp .6s ease .5s  forwards;}

        /* زر الدخول — أزرق وهاج مثل "ابدأ مع مِداد" */
        .btn-submit{
          width:100%;padding:16px;border-radius:13px;border:none;
          background:${B.gradBlue};
          color:#fff;font-size:16px;font-weight:900;
          font-family:${CAIRO};cursor:pointer;
          display:flex;align-items:center;justify-content:center;gap:8px;
          box-shadow:${B.shadowBlue};
          animation:glow 3s ease-in-out infinite;
          transition:transform .18s,box-shadow .18s;
        }
        .btn-submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 44px rgba(37,99,235,0.65)!important;}
        .btn-submit:active:not(:disabled){transform:translateY(0);}
        .btn-submit:disabled{background:rgba(111,91,91,0.12)!important;color:rgba(111,91,91,0.4)!important;cursor:not-allowed!important;box-shadow:none!important;animation:none!important;}

        .btn-sec{transition:border-color .2s,color .2s,background .2s;font-family:${CAIRO};}
        .btn-sec:hover{border-color:${B.borderFocus}!important;color:${B.red}!important;background:rgba(140,20,40,0.05)!important;}

        .feat{transition:border-color .2s,background .2s,transform .2s;}
        .feat:hover{border-color:rgba(140,20,40,0.25)!important;background:rgba(140,20,40,0.05)!important;transform:translateY(-2px);}

        @media(max-width:820px){.right-side{display:none!important;}.left-side{width:100%!important;padding:36px 24px!important;}}
      `}</style>

      {/* ══ الجانب الأيمن — الهوية ══ */}
      <div className="right-side" style={{
        flex:1, display:'flex', flexDirection:'column', justifyContent:'center',
        padding:'56px 64px', position:'relative', overflow:'hidden',
        background:`
          radial-gradient(circle at 75% 25%, rgba(220,140,60,0.10), transparent 32%),
          radial-gradient(circle at 20% 80%, rgba(140,20,40,0.07), transparent 28%),
          ${B.bg}
        `,
      }}>
        <div style={{ position:'relative', zIndex:2, maxWidth:520 }}>

          {/* الشعار الكبير العائم */}
          <div className="r1" style={{ marginBottom:40, animation:'float 4s ease-in-out infinite' }}>
            <Logo h={72} />
          </div>

          {/* العنوان بكاليبري */}
          <h1 className="r2" style={{
            fontSize:'clamp(34px,4.2vw,56px)', fontWeight:900,
            fontFamily: CALIBRI, lineHeight:1.22,
            color: B.text, marginBottom:16,
          }}>
            تعلّم، علِّم،<br />
            <span style={{
              background: B.gradWarm, backgroundSize:'200% auto',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              animation:'shimmer 4s linear infinite',
            }}>
              وارتقِ بالعربية.
            </span>
          </h1>

          <p className="r3" style={{
            fontSize:16, fontFamily: CALIBRI,
            color: B.sub, lineHeight:1.9, marginBottom:18,
          }}>
            مخصص للمعلّم والمتعلّم في اللغة العربية
          </p>

          {/* نقاط الثقة */}
          <div className="r4" style={{ display:'flex', gap:18, marginBottom:36, flexWrap:'wrap' }}>
            {['شرح ذكي','اختبارات تفاعلية','متابعة الأداء'].map((t,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:7 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:B.orange, flexShrink:0, animation:'pulse 2s ease-in-out infinite' }} />
                <span style={{ fontSize:15, color:B.sub, fontWeight:600 }}>{t}</span>
              </div>
            ))}
          </div>

          {/* بطاقة كبيرة + 2 صغيرة */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }} className="r5">
            {/* كبيرة */}
            <div className="feat" style={{ gridColumn:'1/-1', display:'flex', alignItems:'center', gap:14, padding:'16px 18px', borderRadius:16, background:'rgba(255,255,255,0.68)', border:`1px solid ${B.border}`, boxShadow:B.shadow }}>
              <div style={{ width:46, height:46, borderRadius:12, background:'rgba(140,20,40,0.1)', border:`1px solid rgba(140,20,40,0.18)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>💡</div>
              <div>
                <div style={{ fontSize:14, fontWeight:900, color:B.text, marginBottom:3, fontFamily:CALIBRI }}>شرح ذكي للدروس</div>
                <div style={{ fontSize:13, color:B.sub }}>شرح + ورقة عمل + تصحيح فوري بالذكاء الاصطناعي</div>
              </div>
            </div>
            {/* صغيرتان */}
            {[{icon:'🎯',t:'اختبارات تفاعلية',s:'8 أسئلة وتصحيح فوري'},{icon:'📊',t:'متابعة الأداء',s:'تحليلات للطرفين'}].map((f,i) => (
              <div key={i} className="feat" style={{ padding:'16px', borderRadius:14, background:'rgba(255,255,255,0.65)', border:`1px solid ${B.border}`, boxShadow:B.shadow }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{f.icon}</div>
                <div style={{ fontSize:13, fontWeight:900, color:B.text, marginBottom:3, fontFamily:CALIBRI }}>{f.t}</div>
                <div style={{ fontSize:12, color:B.sub, lineHeight:1.6 }}>{f.s}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize:12, color:`${B.sub}70`, marginTop:24 }}>🇰🇼 منصة مِداد • الكويت</p>
        </div>
      </div>

      {/* فاصل */}
      <div style={{ width:1, flexShrink:0, background:`linear-gradient(180deg,transparent,${B.border} 25%,${B.border} 75%,transparent)` }} />

      {/* ══ الجانب الأيسر — النموذج ══ */}
      <div className="left-side" style={{
        width:440, flexShrink:0, background:B.bgForm,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:'52px 44px', position:'relative', overflow:'hidden',
      }}>
        {/* شريط هوية مِداد العلوي */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:B.gradMain }} />

        {/* ضوء خلفي */}
        <div style={{ position:'absolute', bottom:-50, left:-40, width:220, height:220, borderRadius:'50%', background:'rgba(140,20,40,0.05)', filter:'blur(60px)', pointerEvents:'none' }} />

        <div style={{ width:'100%', maxWidth:320, position:'relative', zIndex:2 }}>

          {/* الرأس */}
          <div className="a1" style={{ marginBottom:28 }}>
            <h2 style={{ fontSize:24, fontWeight:900, fontFamily:CALIBRI, color:B.text, marginBottom:6 }}>
              {isRegister ? 'إنشاء حساب ✨' : 'مرحباً بك 👋'}
            </h2>
            <p style={{ fontSize:15, color:B.sub }}>
              {isRegister ? 'سجّل للانضمام لمِداد' : 'سجّل دخولك للمتابعة'}
            </p>
          </div>

          {/* رسالة */}
          {error && (
            <div className="a1" style={{
              padding:'12px 16px', borderRadius:11, marginBottom:18,
              fontSize:14, fontWeight:600,
              background: error.startsWith('✅') ? 'rgba(5,150,105,0.08)' : 'rgba(140,20,40,0.08)',
              border: `1.5px solid ${error.startsWith('✅') ? 'rgba(5,150,105,0.28)' : 'rgba(140,20,40,0.28)'}`,
              color: error.startsWith('✅') ? '#059669' : B.red,
            }}>{error}</div>
          )}

          {/* النموذج */}
          <form onSubmit={isRegister ? handleRegister : handleLogin}
            style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {isRegister && (
              <div className="a2">
                <label style={{ fontSize:13, color:B.sub, display:'block', marginBottom:7, fontWeight:700 }}>الاسم الكامل</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', fontSize:17, pointerEvents:'none' }}>👤</span>
                  <input value={name} onChange={e=>setName(e.target.value)} placeholder="أدخل اسمك الكامل" required
                    onFocus={()=>setFocusField('name')} onBlur={()=>setFocusField('')} style={inp('name')} />
                </div>
              </div>
            )}

            <div className="a2">
              <label style={{ fontSize:13, color:B.sub, display:'block', marginBottom:7, fontWeight:700 }}>البريد الإلكتروني</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', fontSize:17, pointerEvents:'none' }}>📧</span>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="example@email.com" required
                  onFocus={()=>setFocusField('email')} onBlur={()=>setFocusField('')}
                  style={{ ...inp('email'), direction:'ltr', textAlign:'right' }} />
              </div>
            </div>

            <div className="a3">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                <label style={{ fontSize:13, color:B.sub, fontWeight:700 }}>كلمة المرور</label>
                {!isRegister && (
                  <button type="button" onClick={()=>setError('تواصل مع المدير لإعادة تعيين كلمة المرور')}
                    style={{ fontSize:12, color:B.red, background:'none', border:'none', cursor:'pointer', fontFamily:CAIRO, fontWeight:600 }}>
                    نسيت كلمة المرور؟
                  </button>
                )}
              </div>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', fontSize:17, pointerEvents:'none' }}>🔑</span>
                <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                  placeholder="••••••••" required
                  onFocus={()=>setFocusField('pass')} onBlur={()=>setFocusField('')}
                  style={{ ...inp('pass'), paddingLeft:44 }} />
                <button type="button" onClick={()=>setShowPass(s=>!s)}
                  style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:B.sub, padding:0 }}>
                  {showPass?'🙈':'👁️'}
                </button>
              </div>
            </div>

            {/* ══ زر الدخول — أزرق وهاج مثل landing ══ */}
            <button type="submit" disabled={loading || !canSubmit} className="btn-submit a4"
              style={{ marginTop:4 }}>
              {loading
                ? <><span style={{ width:17,height:17,border:'2.5px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite' }} />جارٍ التحقق...</>
                : isRegister ? '✨ إنشاء الحساب' : 'دخول ←'}
            </button>
          </form>

          {/* فاصل */}
          <div className="a5" style={{ display:'flex', alignItems:'center', gap:10, margin:'20px 0' }}>
            <div style={{ flex:1, height:1, background:B.border }} />
            <span style={{ fontSize:12, color:`${B.sub}80` }}>أو</span>
            <div style={{ flex:1, height:1, background:B.border }} />
          </div>

          {/* التسجيل */}
          <button className="a5 btn-sec" onClick={()=>{ setIsRegister(r=>!r); setError('') }}
            style={{ width:'100%', padding:'13px', borderRadius:12, border:`1.5px solid ${B.border}`, background:'rgba(255,255,255,0.65)', color:B.sub, fontSize:14, fontWeight:700, cursor:'pointer' }}>
            {isRegister ? '← العودة لتسجيل الدخول' : 'ليس لدي حساب — التسجيل ✨'}
          </button>

          <div className="a6" style={{ textAlign:'center', marginTop:16 }}>
            <button onClick={()=>router.push('/landing')}
              style={{ background:'none', border:'none', color:`${B.sub}70`, fontSize:13, cursor:'pointer', fontFamily:CAIRO, fontWeight:600 }}>
              ← الصفحة الرئيسية
            </button>
          </div>

          <p style={{ textAlign:'center', fontSize:12, color:`${B.sub}50`, marginTop:18 }}>
            مِداد • الكويت 🇰🇼
          </p>
        </div>
      </div>
    </div>
  )
}