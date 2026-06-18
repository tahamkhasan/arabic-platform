'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const C = {
  bg:          '#F5F0E8',
  bgForm:      '#FDFAF5',
  text:        '#1A1221',
  sub:         '#6B5050',
  border:      'rgba(192,57,43,0.18)',
  borderFocus: 'rgba(192,57,43,0.5)',
  inputBg:     '#FFFFFF',
  red:         '#C0392B',
  orange:      '#E07020',
  gold:        '#F4A420',
  gradWarm:    'linear-gradient(135deg,#7B1A1A,#C0392B,#F4A420)',
  gradBlue:    'linear-gradient(135deg,#2563EB,#1D4ED8)',
  shadow:      '0 2px 12px rgba(192,57,43,0.10)',
  shadowCard:  '0 8px 32px rgba(192,57,43,0.10)',
}

const CALIBRI = "'Calibri','Trebuchet MS','Gill Sans MT',Tahoma,sans-serif"

export default function LoginPage() {
  const router = useRouter()
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [isRegister,  setIsRegister]  = useState(false)
  const [name,        setName]        = useState('')
  const [logoUrl,     setLogoUrl]     = useState('/logo-midad.png')
  const [focusedField,setFocusedField]= useState('')

  // جلب شعار المنصة
  useEffect(() => {
    fetch('/api/platform-settings')
      .then(r => r.json())
      .then(d => { if (d.settings?.logo_url) setLogoUrl(d.settings.logo_url) })
      .catch(() => {})
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res  = await fetch('/api/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'بيانات غير صحيحة'); return }
      localStorage.setItem('mosaed_user',    JSON.stringify(data.user))
      localStorage.setItem('mosaed_session', JSON.stringify(data.session))
      if (data.user?.role === 'admin')             router.push('/admin')
      else if (data.user?.user_type === 'student') router.push('/student')
      else                                          router.push('/dashboard')
    } catch { setError('تعذّر الاتصال بالخادم') }
    finally  { setLoading(false) }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res  = await fetch('/api/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', email, password, name }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'فشل التسجيل'); return }
      setIsRegister(false)
      setError('✅ تم التسجيل! انتظر موافقة المدير.')
    } catch { setError('تعذّر الاتصال بالخادم') }
    finally  { setLoading(false) }
  }

  const fieldStyle = (name: string): React.CSSProperties => ({
    width: '100%', padding: '14px 44px 14px 16px',
    borderRadius: 12,
    border: `1.5px solid ${focusedField === name ? C.borderFocus : C.border}`,
    background: C.inputBg,
    color: C.text, fontSize: 15,
    fontFamily: 'inherit',
    boxShadow: focusedField === name ? `0 0 0 3px rgba(192,57,43,0.08)` : 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none',
  })

  return (
    <div dir="rtl" style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
      background: C.bg,
    }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp {from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
        @keyframes float  {0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
        @keyframes spin   {from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes glow   {0%,100%{box-shadow:0 6px 22px rgba(37,99,235,0.38);}50%{box-shadow:0 10px 38px rgba(37,99,235,0.62);}}
        @keyframes shimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
        .a1{opacity:0;animation:fadeUp 0.55s ease 0.05s forwards;}
        .a2{opacity:0;animation:fadeUp 0.55s ease 0.12s forwards;}
        .a3{opacity:0;animation:fadeUp 0.55s ease 0.20s forwards;}
        .a4{opacity:0;animation:fadeUp 0.55s ease 0.28s forwards;}
        .a5{opacity:0;animation:fadeUp 0.55s ease 0.36s forwards;}
        .a6{opacity:0;animation:fadeUp 0.55s ease 0.44s forwards;}
        .a7{opacity:0;animation:fadeUp 0.55s ease 0.52s forwards;}
        .r1{opacity:0;animation:fadeUp 0.6s ease 0.1s  forwards;}
        .r2{opacity:0;animation:fadeUp 0.6s ease 0.2s  forwards;}
        .r3{opacity:0;animation:fadeUp 0.6s ease 0.3s  forwards;}
        .r4{opacity:0;animation:fadeUp 0.6s ease 0.4s  forwards;}
        .r5{opacity:0;animation:fadeUp 0.6s ease 0.5s  forwards;}
        .btn-blue{
          transition:transform 0.18s,box-shadow 0.18s;
          animation:glow 3s ease-in-out infinite;
        }
        .btn-blue:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 38px rgba(37,99,235,0.6)!important;}
        .btn-blue:active:not(:disabled){transform:translateY(0);}
        .btn-blue:disabled{background:rgba(107,80,80,0.12)!important;color:rgba(107,80,80,0.4)!important;cursor:not-allowed!important;box-shadow:none!important;animation:none!important;}
        .btn-sec{transition:border-color 0.2s,color 0.2s,background 0.2s;}
        .btn-sec:hover{border-color:rgba(192,57,43,0.4)!important;color:${C.red}!important;background:rgba(192,57,43,0.06)!important;}
        .feat-card{transition:transform 0.2s,border-color 0.2s,box-shadow 0.2s;}
        .feat-card:hover{transform:translateY(-3px);border-color:rgba(192,57,43,0.3)!important;box-shadow:0 8px 24px rgba(192,57,43,0.12)!important;}
        @media(max-width:820px){
          .right-side{display:none!important;}
          .left-side{width:100%!important;padding:36px 24px!important;}
        }
      `}</style>

      {/* ══ الجانب الأيمن — الهوية ══ */}
      <div className="right-side" style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '56px 64px',
        position: 'relative', overflow: 'hidden',
        background: C.bg,
      }}>
        {/* خلفية دافئة */}
        <div style={{ position:'absolute', inset:0,
          background:`radial-gradient(circle at 70% 20%, rgba(231,169,59,0.10), transparent 35%),
                      radial-gradient(circle at 20% 80%, rgba(192,57,43,0.07), transparent 30%),
                      ${C.bg}`,
          pointerEvents:'none'
        }} />

        <div style={{ position:'relative', zIndex:2, maxWidth:540 }}>

          {/* الشعار — نفس landing */}
          <div className="r1" style={{ marginBottom:36, animation:'float 4s ease-in-out infinite' }}>
            <img
              src={logoUrl}
              alt="مِداد"
              style={{
                height: 70, width: 'auto', objectFit: 'contain',
                filter: 'drop-shadow(0 4px 14px rgba(192,57,43,0.22))',
              }}
              onError={e => { (e.target as HTMLImageElement).src = '/logo-midad.png' }}
            />
          </div>

          {/* العنوان */}
          <h1 className="r2" style={{
            fontSize: 'clamp(36px,4.5vw,58px)', fontWeight: 900,
            fontFamily: CALIBRI,
            lineHeight: 1.22, color: C.text, marginBottom: 16,
          }}>
            تعلّم، علِّم،<br />
            <span style={{
              background: C.gradWarm, backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'shimmer 4s linear infinite',
            }}>
              وارتقِ بالعربية.
            </span>
          </h1>

          {/* الوصف */}
          <p className="r3" style={{
            fontSize: 16, color: C.sub, lineHeight: 1.85, fontFamily: CALIBRI,
            marginBottom: 18, maxWidth: 460,
          }}>
            مخصص للمعلّم والمتعلّم في اللغة العربية
          </p>

          {/* نقاط الثقة */}
          <div className="r4" style={{ display:'flex', gap:20, marginBottom:36, flexWrap:'wrap' }}>
            {['شرح ذكي','اختبارات تفاعلية','متابعة الأداء'].map((t,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:7 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:C.orange, flexShrink:0 }} />
                <span style={{ fontSize:15, color:C.sub, fontWeight:600 }}>{t}</span>
              </div>
            ))}
          </div>

          {/* بطاقة كبيرة */}
          <div className="r5 feat-card" style={{
            display:'flex', alignItems:'center', gap:16,
            padding:'18px 20px', borderRadius:16,
            background:'rgba(255,255,255,0.72)',
            border:`1.5px solid ${C.border}`,
            backdropFilter:'blur(12px)',
            marginBottom:12,
            boxShadow: C.shadowCard,
          }}>
            <div style={{
              width:48, height:48, borderRadius:13, flexShrink:0,
              background:'rgba(192,57,43,0.1)',
              border:`1px solid rgba(192,57,43,0.18)`,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:24,
            }}>💡</div>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:4 }}>شرح ذكي للدروس</div>
              <div style={{ fontSize:14, color:C.sub }}>شرح + ورقة عمل + تصحيح فوري بالذكاء الاصطناعي</div>
            </div>
          </div>

          {/* بطاقتان صغيرتان */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[
              { icon:'🎯', title:'اختبارات تفاعلية', sub:'8 أسئلة وتصحيح فوري' },
              { icon:'📊', title:'متابعة الأداء',    sub:'تحليلات للطرفين'     },
            ].map((f,i) => (
              <div key={i} className="feat-card" style={{
                padding:'16px', borderRadius:14,
                background:'rgba(255,255,255,0.65)',
                border:`1.5px solid ${C.border}`,
                backdropFilter:'blur(10px)',
                boxShadow: C.shadowCard,
              }}>
                <div style={{ fontSize:26, marginBottom:8 }}>{f.icon}</div>
                <div style={{ fontSize:14, fontWeight:800, color:C.text, marginBottom:3 }}>{f.title}</div>
                <div style={{ fontSize:13, color:C.sub, lineHeight:1.6 }}>{f.sub}</div>
              </div>
            ))}
          </div>

          <p style={{ fontSize:12, color:`${C.sub}70`, marginTop:24 }}>
            🇰🇼 منصة مِداد • الكويت
          </p>
        </div>
      </div>

      {/* فاصل عمودي */}
      <div style={{
        width: 1, flexShrink: 0,
        background: `linear-gradient(180deg,transparent,${C.border} 25%,${C.border} 75%,transparent)`,
      }} />

      {/* ══ الجانب الأيسر — النموذج ══ */}
      <div className="left-side" style={{
        width: 440, flexShrink: 0,
        background: C.bgForm,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '52px 44px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* شريط ملون علوي */}
        <div style={{
          position:'absolute', top:0, left:0, right:0, height:4,
          background:`linear-gradient(90deg,#7B1A1A,#C0392B,#E07020,#F4A420)`,
        }} />

        {/* ضوء خلفي */}
        <div style={{
          position:'absolute', bottom:-50, left:-40,
          width:220, height:220, borderRadius:'50%',
          background:'rgba(192,57,43,0.05)', filter:'blur(60px)',
          pointerEvents:'none',
        }} />

        <div style={{ width:'100%', maxWidth:320, position:'relative', zIndex:2 }}>

          {/* رأس النموذج */}
          <div className="a1" style={{ marginBottom:28 }}>
            <h2 style={{ fontSize:24, fontWeight:900, color:C.text, marginBottom:6 }}>
              {isRegister ? 'إنشاء حساب ✨' : 'مرحباً بك 👋'}
            </h2>
            <p style={{ fontSize:15, color:C.sub }}>
              {isRegister ? 'سجّل للانضمام لمِداد' : 'سجّل دخولك للمتابعة'}
            </p>
          </div>

          {/* رسالة الخطأ / النجاح */}
          {error && (
            <div className="a1" style={{
              padding: '12px 16px', borderRadius: 12, marginBottom: 18, fontSize: 14, fontWeight: 600,
              background: error.startsWith('✅') ? 'rgba(5,150,105,0.09)' : 'rgba(192,57,43,0.09)',
              border: `1.5px solid ${error.startsWith('✅') ? 'rgba(5,150,105,0.3)' : 'rgba(192,57,43,0.3)'}`,
              color: error.startsWith('✅') ? '#059669' : C.red,
            }}>
              {error}
            </div>
          )}

          {/* النموذج */}
          <form onSubmit={isRegister ? handleRegister : handleLogin}
            style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* الاسم — عند التسجيل */}
            {isRegister && (
              <div className="a2">
                <label style={{ fontSize:13, color:C.sub, display:'block', marginBottom:7, fontWeight:700 }}>
                  الاسم الكامل
                </label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', fontSize:17, pointerEvents:'none' }}>👤</span>
                  <input
                    value={name} onChange={e => setName(e.target.value)}
                    placeholder="أدخل اسمك الكامل" required
                    onFocus={() => setFocusedField('name')}
                    onBlur={()  => setFocusedField('')}
                    style={fieldStyle('name')}
                  />
                </div>
              </div>
            )}

            {/* البريد */}
            <div className="a2">
              <label style={{ fontSize:13, color:C.sub, display:'block', marginBottom:7, fontWeight:700 }}>
                البريد الإلكتروني
              </label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', fontSize:17, pointerEvents:'none' }}>📧</span>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="example@email.com" required
                  onFocus={() => setFocusedField('email')}
                  onBlur={()  => setFocusedField('')}
                  style={{ ...fieldStyle('email'), direction:'ltr', textAlign:'right' }}
                />
              </div>
            </div>

            {/* كلمة المرور */}
            <div className="a3">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                <label style={{ fontSize:13, color:C.sub, fontWeight:700 }}>كلمة المرور</label>
                {!isRegister && (
                  <button type="button" onClick={() => setError('تواصل مع المدير لإعادة تعيين كلمة المرور')}
                    style={{ fontSize:12, color:C.red, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
                    نسيت كلمة المرور؟
                  </button>
                )}
              </div>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', fontSize:17, pointerEvents:'none' }}>🔑</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  onFocus={() => setFocusedField('password')}
                  onBlur={()  => setFocusedField('')}
                  style={{ ...fieldStyle('password'), paddingLeft: 44 }}
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  style={{
                    position:'absolute', left:13, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer',
                    fontSize:16, color:C.sub, padding:0, lineHeight:1,
                  }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* ══ زر الدخول — أزرق متوهج ══ */}
            <button
              type="submit" disabled={loading || !email || !password}
              className="btn-blue a4"
              style={{
                width:'100%', padding:'15px', borderRadius:13,
                border:'none', marginTop:4,
                background: (email && password) ? C.gradBlue : 'rgba(107,80,80,0.12)',
                color: (email && password) ? '#fff' : 'rgba(107,80,80,0.4)',
                fontSize:16, fontWeight:900, cursor: (email && password) ? 'pointer' : 'not-allowed',
                fontFamily:'inherit',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}>
              {loading
                ? <><span style={{ width:17, height:17, border:'2.5px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.8s linear infinite' }} />جارٍ التحقق...</>
                : isRegister ? '✨ إنشاء الحساب' : 'دخول ←'
              }
            </button>
          </form>

          {/* فاصل */}
          <div className="a5" style={{ display:'flex', alignItems:'center', gap:10, margin:'20px 0' }}>
            <div style={{ flex:1, height:1, background:C.border }} />
            <span style={{ fontSize:12, color:`${C.sub}80` }}>أو</span>
            <div style={{ flex:1, height:1, background:C.border }} />
          </div>

          {/* زر التسجيل / العودة */}
          <button
            className="a6 btn-sec"
            onClick={() => { setIsRegister(r => !r); setError('') }}
            style={{
              width:'100%', padding:'13px', borderRadius:12,
              border:`1.5px solid ${C.border}`,
              background:'transparent', color:C.sub,
              fontSize:14, fontWeight:700,
              cursor:'pointer', fontFamily:'inherit',
            }}>
            {isRegister ? '← العودة لتسجيل الدخول' : 'ليس لدي حساب — التسجيل ✨'}
          </button>

          {/* رابط الرئيسية */}
          <div className="a7" style={{ textAlign:'center', marginTop:18 }}>
            <button onClick={() => router.push('/landing')}
              style={{
                background:'none', border:'none',
                color:`${C.sub}80`, fontSize:13,
                cursor:'pointer', fontFamily:'inherit', fontWeight:600,
              }}>
              ← العودة للصفحة الرئيسية
            </button>
          </div>

          <p style={{ textAlign:'center', fontSize:12, color:`${C.sub}50`, marginTop:18 }}>
            مِداد • الكويت 🇰🇼
          </p>
        </div>
      </div>
    </div>
  )
}