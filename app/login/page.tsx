'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PublicHeader from '@/components/PublicHeader'

const B = {
  deep:'#780F1E', red:'#961E2D', crimson:'#C32D2D',
  orange:'#D2692D', amber:'#E1782D', gold:'#E1873C',
  text:'#231B19', sub:'#6B5050',
  bg:'#F7F2EA', bgForm:'#FCF8F2',
  border:'rgba(150,30,45,0.14)', borderFocus:'rgba(150,30,45,0.48)',
  inputBg:'#FFFFFF',
  gradMain:'linear-gradient(135deg,#780F1E,#C32D2D,#D2692D)',
  gradWarm:'linear-gradient(135deg,#780F1E,#961E2D,#E1873C)',
  gradBlue:'linear-gradient(135deg,#2563EB,#1D4ED8)',
  shadow:'0 20px 50px rgba(120,15,30,0.08)',
  shadowBlue:'0 8px 28px rgba(37,99,235,0.42)',
}
const CALIBRI = "'Calibri','Trebuchet MS','Gill Sans MT',Tahoma,sans-serif"
const CAIRO   = "'Cairo','Segoe UI',Tahoma,Arial,sans-serif"

export default function LoginPage() {
  const router = useRouter()
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [name,       setName]       = useState('')
  const [logoUrl,    setLogoUrl]    = useState('/logo-midad.png')
  const [focus,      setFocus]      = useState('')

  useEffect(() => {
    fetch('/api/platform-settings')
      .then(r => r.json())
      .then(d => { if (d.settings?.logo_url) setLogoUrl(d.settings.logo_url) })
      .catch(() => {})
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res  = await fetch('/api/auth', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action:'login', email, password }) })
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
      const res  = await fetch('/api/auth', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action:'register', email, password, name }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'فشل التسجيل'); return }
      setIsRegister(false); setError('✅ تم التسجيل! انتظر موافقة المدير.')
    } catch { setError('تعذّر الاتصال بالخادم') } finally { setLoading(false) }
  }

  const inp = (n: string): React.CSSProperties => ({
    width:'100%', padding:'14px 46px 14px 16px', borderRadius:12,
    border:`1.5px solid ${focus===n ? B.borderFocus : B.border}`,
    background: B.inputBg, color: B.text, fontSize:15, fontFamily:CAIRO,
    boxShadow: focus===n ? `0 0 0 3px rgba(150,30,45,0.08)` : 'none',
    transition:'border-color 0.2s,box-shadow 0.2s', outline:'none',
  })

  const Logo = ({ h=56 }: { h?:number }) => (
    <img src={logoUrl} alt="مِداد" height={h}
      style={{ height:h, width:'auto', objectFit:'contain', display:'block' }}
      onError={e=>{ (e.target as HTMLImageElement).src='/logo-midad.png' }} />
  )

  return (
    <div dir="rtl" style={{ minHeight:'100vh', display:'flex', flexDirection:'column', fontFamily:CAIRO, background:B.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp {from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
        @keyframes float  {0%,100%{transform:translateY(0);}50%{transform:translateY(-9px);}}
        @keyframes spin   {from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes glow   {0%,100%{box-shadow:${B.shadowBlue};}50%{box-shadow:0 14px 44px rgba(37,99,235,0.65);}}
        @keyframes shimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
        @keyframes pulse  {0%,100%{opacity:1;}50%{opacity:0.4;}}
        /* ظهور متتالي */
        .a1{opacity:0;animation:fadeUp .5s ease .05s forwards;}
        .a2{opacity:0;animation:fadeUp .5s ease .12s forwards;}
        .a3{opacity:0;animation:fadeUp .5s ease .20s forwards;}
        .a4{opacity:0;animation:fadeUp .5s ease .28s forwards;}
        .a5{opacity:0;animation:fadeUp .5s ease .36s forwards;}
        .a6{opacity:0;animation:fadeUp .5s ease .44s forwards;}
        .r1{opacity:0;animation:fadeUp .6s ease .08s forwards;}
        .r2{opacity:0;animation:fadeUp .6s ease .18s forwards;}
        .r3{opacity:0;animation:fadeUp .6s ease .28s forwards;}
        .r4{opacity:0;animation:fadeUp .6s ease .38s forwards;}
        .r5{opacity:0;animation:fadeUp .6s ease .48s forwards;}
        /* زر الدخول — أزرق وهاج مثل "ابدأ مع مِداد" */
        .btn-submit{
          width:100%;padding:16px;border-radius:13px;border:none;
          background:${B.gradBlue};color:#fff;
          font-size:16px;font-weight:900;font-family:${CAIRO};
          cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;
          box-shadow:${B.shadowBlue};
          animation:glow 3s ease-in-out infinite;
          transition:transform .18s,box-shadow .18s;
        }
        .btn-submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 44px rgba(37,99,235,0.65)!important;}
        .btn-submit:active:not(:disabled){transform:translateY(0);}
        .btn-submit:disabled{background:rgba(107,80,80,0.12)!important;color:rgba(107,80,80,0.4)!important;cursor:not-allowed!important;box-shadow:none!important;animation:none!important;}
        /* زر ثانوي */
        .btn-sec{transition:border-color .2s,color .2s,background .2s;font-family:${CAIRO};}
        .btn-sec:hover{border-color:${B.borderFocus}!important;color:${B.crimson}!important;background:rgba(150,30,45,0.05)!important;}
        /* بطاقات */
        .feat{transition:border-color .2s,background .2s,transform .2s;}
        .feat:hover{border-color:rgba(150,30,45,0.28)!important;background:rgba(150,30,45,0.05)!important;transform:translateY(-2px);}
        @media(max-width:820px){
          .right-side{display:none!important;}
          .left-side{width:100%!important;padding:36px 24px!important;}
        }
      `}</style>

      <PublicHeader activePage="login" />

      {/* المحتوى الرئيسي */}
      <div style={{ display:'flex', flex:1 }}>

      {/* ══ الجانب الأيمن — هوية مِداد ══ */}
      <div className="right-side" style={{
        flex:1, display:'flex', flexDirection:'column', justifyContent:'center',
        padding:'56px 64px', position:'relative', overflow:'hidden',
        background:`
          radial-gradient(circle at 80% 20%, rgba(225,135,60,0.11),transparent 32%),
          radial-gradient(circle at 15% 80%, rgba(150,30,45,0.07),transparent 28%),
          ${B.bg}
        `,
      }}>
        <div style={{ position:'relative', zIndex:2, maxWidth:520 }}>

          {/* الشعار الكبير العائم */}
          <div className="r1" style={{ marginBottom:38, animation:'float 4s ease-in-out infinite' }}>
            <Logo h={74} />
          </div>

          {/* العنوان بكاليبري */}
          <h1 className="r2" style={{
            fontSize:'clamp(34px,4.2vw,56px)', fontWeight:900,
            fontFamily:CALIBRI, lineHeight:1.22, color:B.text, marginBottom:14,
          }}>
            تعلّم، علِّم،<br />
            <span style={{
              background:B.gradWarm, backgroundSize:'200% auto',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              animation:'shimmer 4s linear infinite',
            }}>وارتقِ بالعربية.</span>
          </h1>

          <p className="r3" style={{ fontSize:16, fontFamily:CALIBRI, color:B.sub, lineHeight:1.9, marginBottom:18 }}>
            مخصص للمعلّم والمتعلّم في اللغة العربية
          </p>

          {/* نقاط الثقة */}
          <div className="r4" style={{ display:'flex', gap:18, marginBottom:36, flexWrap:'wrap' }}>
            {['شرح ذكي','اختبارات تفاعلية','متابعة الأداء'].map((t,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:7 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:B.amber, flexShrink:0, animation:'pulse 2s ease-in-out infinite' }} />
                <span style={{ fontSize:15, color:B.sub, fontWeight:600 }}>{t}</span>
              </div>
            ))}
          </div>

          {/* بطاقة كبيرة + 2 صغيرة */}
          <div className="r5" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="feat" style={{ gridColumn:'1/-1', display:'flex', alignItems:'center', gap:14, padding:'16px 18px', borderRadius:16, background:'rgba(255,255,255,0.70)', border:`1px solid ${B.border}`, boxShadow:B.shadow }}>
              <div style={{ width:46, height:46, borderRadius:12, background:`${B.crimson}14`, border:`1px solid ${B.crimson}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>💡</div>
              <div>
                <div style={{ fontSize:14, fontWeight:900, fontFamily:CALIBRI, color:B.text, marginBottom:3 }}>شرح ذكي للدروس</div>
                <div style={{ fontSize:13, color:B.sub }}>شرح + ورقة عمل + تصحيح فوري بالذكاء الاصطناعي</div>
              </div>
            </div>
            {[{icon:'🎯',t:'اختبارات تفاعلية',s:'8 أسئلة وتصحيح فوري'},{icon:'📊',t:'متابعة الأداء',s:'تحليلات للطرفين'}].map((f,i) => (
              <div key={i} className="feat" style={{ padding:'16px', borderRadius:14, background:'rgba(255,255,255,0.68)', border:`1px solid ${B.border}`, boxShadow:B.shadow }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{f.icon}</div>
                <div style={{ fontSize:13, fontWeight:900, fontFamily:CALIBRI, color:B.text, marginBottom:3 }}>{f.t}</div>
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
        <div style={{ position:'absolute', bottom:-50, left:-40, width:220, height:220, borderRadius:'50%', background:'rgba(150,30,45,0.05)', filter:'blur(60px)', pointerEvents:'none' }} />

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
              background: error.startsWith('✅') ? 'rgba(5,150,105,0.08)' : 'rgba(150,30,45,0.08)',
              border:`1.5px solid ${error.startsWith('✅') ? 'rgba(5,150,105,0.28)' : 'rgba(150,30,45,0.28)'}`,
              color: error.startsWith('✅') ? '#059669' : B.crimson,
            }}>{error}</div>
          )}

          <form onSubmit={isRegister ? handleRegister : handleLogin}
            style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {isRegister && (
              <div className="a2">
                <label style={{ fontSize:13, color:B.sub, display:'block', marginBottom:7, fontWeight:700 }}>الاسم الكامل</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', fontSize:17, pointerEvents:'none' }}>👤</span>
                  <input value={name} onChange={e=>setName(e.target.value)} placeholder="أدخل اسمك الكامل" required
                    onFocus={()=>setFocus('name')} onBlur={()=>setFocus('')} style={inp('name')} />
                </div>
              </div>
            )}

            <div className="a2">
              <label style={{ fontSize:13, color:B.sub, display:'block', marginBottom:7, fontWeight:700 }}>البريد الإلكتروني</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', fontSize:17, pointerEvents:'none' }}>📧</span>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="example@email.com" required
                  onFocus={()=>setFocus('email')} onBlur={()=>setFocus('')}
                  style={{ ...inp('email'), direction:'ltr', textAlign:'right' }} />
              </div>
            </div>

            <div className="a3">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                <label style={{ fontSize:13, color:B.sub, fontWeight:700 }}>كلمة المرور</label>
                {!isRegister && (
                  <button type="button" onClick={()=>setError('تواصل مع المدير لإعادة تعيين كلمة المرور')}
                    style={{ fontSize:12, color:B.crimson, background:'none', border:'none', cursor:'pointer', fontFamily:CAIRO, fontWeight:700 }}>
                    نسيت كلمة المرور؟
                  </button>
                )}
              </div>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', fontSize:17, pointerEvents:'none' }}>🔑</span>
                <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                  placeholder="••••••••" required
                  onFocus={()=>setFocus('pass')} onBlur={()=>setFocus('')}
                  style={{ ...inp('pass'), paddingLeft:44 }} />
                <button type="button" onClick={()=>setShowPass(s=>!s)}
                  style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:B.sub, padding:0 }}>
                  {showPass?'🙈':'👁️'}
                </button>
              </div>
            </div>

            {/* ══ زر الدخول الأزرق الوهاج ══ */}
            <button type="submit" disabled={loading || !email || !password}
              className="btn-submit a4" style={{ marginTop:4 }}>
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
            style={{ width:'100%', padding:'13px', borderRadius:12, border:`1.5px solid ${B.border}`, background:'rgba(255,255,255,0.68)', color:B.sub, fontSize:14, fontWeight:700, cursor:'pointer' }}>
            {isRegister ? '← العودة لتسجيل الدخول' : 'ليس لدي حساب — التسجيل ✨'}
          </button>

          <div className="a6" style={{ textAlign:'center', marginTop:16 }}>
            <button onClick={()=>router.push('/landing')}
              style={{ background:'none', border:'none', color:`${B.sub}70`, fontSize:13, cursor:'pointer', fontFamily:CAIRO, fontWeight:600 }}>
              ← الصفحة الرئيسية
            </button>
          </div>
          <p style={{ textAlign:'center', fontSize:12, color:`${B.sub}50`, marginTop:18 }}>مِداد • الكويت 🇰🇼</p>
        </div>
      </div>
      </div>
    </div>
  )
}