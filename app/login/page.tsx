'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const C = {
  bg:'#F5F0E8', bgForm:'#FDFAF5', text:'#1A1221', sub:'#6B5050',
  border:'rgba(192,57,43,0.15)', inputBg:'rgba(192,57,43,0.04)',
  red:'#C0392B', orange:'#E07020', gold:'#F4A420',
  gradMain:'linear-gradient(135deg,#C0392B,#E07020)',
  gradWarm:'linear-gradient(135deg,#7B1A1A,#C0392B,#F4A420)',
  gradBlue:'linear-gradient(135deg,#2563EB,#1D4ED8)',
}

export default function LoginPage() {
  const router = useRouter()
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [name,       setName]       = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res  = await fetch('/api/auth', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ action:'login', email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'بيانات غير صحيحة'); return }

      // ── حفظ بالمفاتيح الموحدة mosaed_user و mosaed_session ──
      localStorage.setItem('mosaed_user',    JSON.stringify(data.user))
      localStorage.setItem('mosaed_session', JSON.stringify(data.session))

      // ── التوجيه الصحيح حسب الدور ──
      if (data.user?.role === 'admin')             router.push('/admin')
      else if (data.user?.user_type === 'student') router.push('/student')
      else                                          router.push('/dashboard')
    } catch { setError('تعذّر الاتصال بالخادم') } finally { setLoading(false) }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res  = await fetch('/api/auth', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ action:'register', email, password, name }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'فشل التسجيل'); return }
      setIsRegister(false); setError('✅ تم التسجيل! انتظر موافقة المدير.')
    } catch { setError('تعذّر الاتصال بالخادم') } finally { setLoading(false) }
  }

  return (
    <div dir="rtl" style={{ minHeight:'100vh', display:'flex', fontFamily:"'Segoe UI',Tahoma,Arial,sans-serif", background:C.bg }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}
        @keyframes float {0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
        @keyframes spin  {from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes glow  {0%,100%{box-shadow:0 6px 22px rgba(37,99,235,0.4);}50%{box-shadow:0 10px 38px rgba(37,99,235,0.65);}}
        @keyframes shimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
        @keyframes pulse {0%,100%{opacity:1;}50%{opacity:0.4;}}
        .a1{opacity:0;animation:fadeUp 0.55s ease 0.05s forwards;}
        .a2{opacity:0;animation:fadeUp 0.55s ease 0.15s forwards;}
        .a3{opacity:0;animation:fadeUp 0.55s ease 0.25s forwards;}
        .a4{opacity:0;animation:fadeUp 0.55s ease 0.35s forwards;}
        .a5{opacity:0;animation:fadeUp 0.55s ease 0.45s forwards;}
        .a6{opacity:0;animation:fadeUp 0.55s ease 0.55s forwards;}
        .a7{opacity:0;animation:fadeUp 0.55s ease 0.65s forwards;}
        .fi{opacity:0;animation:fadeUp 0.5s ease forwards;}
        .fi:nth-child(1){animation-delay:0.1s}
        .fi:nth-child(2){animation-delay:0.2s}
        .fi:nth-child(3){animation-delay:0.3s}
        .field input{width:100%;padding:14px 44px 14px 16px;border-radius:10px;border:1.5px solid rgba(192,57,43,0.18);background:rgba(192,57,43,0.04);color:#1A1221;font-size:15px;font-family:inherit;transition:border-color 0.2s,background 0.2s;}
        .field input:focus{outline:none;border-color:rgba(192,57,43,0.45)!important;background:rgba(192,57,43,0.07)!important;}
        .field input::placeholder{color:rgba(107,80,80,0.4);}
        .btn-blue{transition:transform 0.18s,box-shadow 0.18s;animation:glow 3s ease-in-out infinite;}
        .btn-blue:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 38px rgba(37,99,235,0.6)!important;}
        .btn-blue:active:not(:disabled){transform:translateY(0);}
        .btn-blue:disabled{background:rgba(107,80,80,0.12)!important;color:rgba(107,80,80,0.4)!important;cursor:not-allowed!important;box-shadow:none!important;animation:none!important;}
        .btn-sec{transition:border-color 0.2s,color 0.2s,background 0.2s;}
        .btn-sec:hover{border-color:rgba(192,57,43,0.35)!important;color:#C0392B!important;background:rgba(192,57,43,0.05)!important;}
        .feat-mini{transition:border-color 0.2s,background 0.2s;}
        .feat-mini:hover{border-color:rgba(192,57,43,0.25)!important;background:rgba(192,57,43,0.06)!important;}
        @media(max-width:800px){.right-side{display:none!important;}.left-side{width:100%!important;padding:36px 24px!important;}}
      `}</style>

      {/* ══ الجانب الأيمن — هوية مِداد ══ */}
      <div className="right-side" style={{ flex:1,display:'flex',flexDirection:'column',justifyContent:'center',padding:'60px 60px',position:'relative',overflow:'hidden',background:C.bg }}>
        <div style={{ position:'absolute',inset:0,backgroundImage:`url(https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1400&q=60&auto=format&fit=crop)`,backgroundSize:'cover',backgroundPosition:'center',filter:'brightness(0.07) saturate(0.2)' }} />
        <div style={{ position:'absolute',inset:0,background:`linear-gradient(160deg,rgba(245,240,232,0.95) 0%,rgba(245,240,232,0.88) 100%)` }} />
        <div style={{ position:'absolute',top:'15%',right:'20%',width:400,height:400,borderRadius:'50%',background:'rgba(192,57,43,0.06)',filter:'blur(100px)' }} />
        <div style={{ position:'absolute',bottom:'15%',left:'10%',width:320,height:320,borderRadius:'50%',background:'rgba(244,164,32,0.06)',filter:'blur(80px)' }} />

        <div style={{ position:'relative',zIndex:2,maxWidth:500 }}>
          {/* الشعار */}
          <div className="a1" style={{ marginBottom:48 }}>
            <img src="/logo-midad.png" alt="مِداد" style={{ height:70, width:'auto', objectFit:'contain', filter:'drop-shadow(0 4px 14px rgba(192,57,43,0.3))', animation:'float 4s ease-in-out infinite' }} />
          </div>

          {/* العنوان */}
          <h1 className="a2" style={{ fontSize:44,fontWeight:900,lineHeight:1.25,color:C.text,marginBottom:14 }}>
            تعلّم، علِّم،<br />
            <span style={{ background:C.gradWarm,backgroundSize:'200% auto',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',animation:'shimmer 4s linear infinite' }}>
              وارتقِ بالعربية.
            </span>
          </h1>

          <p className="a3" style={{ fontSize:16,color:C.sub,lineHeight:1.8,marginBottom:14 }}>مخصص للمعلّم والمتعلّم في اللغة العربية</p>

          <div className="a4" style={{ display:'flex',gap:18,marginBottom:44,flexWrap:'wrap' }}>
            {['شرح ذكي','اختبارات تفاعلية','متابعة الأداء'].map((t,i) => (
              <div key={i} style={{ display:'flex',alignItems:'center',gap:6 }}>
                <div style={{ width:6,height:6,borderRadius:'50%',background:C.orange,flexShrink:0 }} />
                <span style={{ fontSize:14,color:C.sub,fontWeight:600 }}>{t}</span>
              </div>
            ))}
          </div>

          {/* بطاقة كبيرة + 2 صغيرة */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div className="fi feat-mini" style={{ gridColumn:'1/-1',display:'flex',alignItems:'center',gap:16,padding:'16px 18px',borderRadius:14,background:'rgba(192,57,43,0.05)',border:`1px solid ${C.border}` }}>
              <div style={{ width:46,height:46,borderRadius:12,background:'rgba(192,57,43,0.1)',border:'1px solid rgba(192,57,43,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0 }}>💡</div>
              <div><div style={{ fontSize:14,fontWeight:800,color:C.text,marginBottom:3 }}>شرح ذكي للدروس</div><div style={{ fontSize:13,color:C.sub }}>شرح + ورقة عمل + تصحيح فوري</div></div>
            </div>
            {[{icon:'🎯',t:'اختبارات',s:'8 أسئلة وتصحيح فوري'},{icon:'📊',t:'متابعة',s:'تحليلات للطرفين'}].map((f,i) => (
              <div key={i} className="fi feat-mini" style={{ padding:'16px',borderRadius:14,background:'rgba(192,57,43,0.04)',border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:22,marginBottom:8 }}>{f.icon}</div>
                <div style={{ fontSize:14,fontWeight:800,color:C.text,marginBottom:3 }}>{f.t}</div>
                <div style={{ fontSize:12,color:C.sub,lineHeight:1.6 }}>{f.s}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize:12,color:`${C.sub}80`,marginTop:28 }}>🇰🇼 منصة مِداد • الكويت</p>
        </div>
      </div>

      {/* فاصل */}
      <div style={{ width:1,background:`linear-gradient(180deg,transparent,${C.border} 30%,${C.border} 70%,transparent)`,flexShrink:0 }} />

      {/* ══ الجانب الأيسر — النموذج ══ */}
      <div className="left-side" style={{ width:420,flexShrink:0,background:C.bgForm,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'48px 40px',position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,#7B1A1A,#C0392B,#E07020,#F4A420)` }} />
        <div style={{ position:'absolute',bottom:-40,left:-30,width:180,height:180,borderRadius:'50%',background:'rgba(192,57,43,0.05)',filter:'blur(50px)' }} />

        <div style={{ width:'100%',maxWidth:310,position:'relative',zIndex:2 }}>
          <div className="a1" style={{ marginBottom:28 }}>
            <h2 style={{ fontSize:22,fontWeight:900,color:C.text,marginBottom:6 }}>{isRegister?'إنشاء حساب جديد ✨':'مرحباً بك 👋'}</h2>
            <p style={{ fontSize:14,color:C.sub }}>{isRegister?'سجّل للانضمام لمِداد':'سجّل دخولك للمتابعة'}</p>
          </div>

          {error && (
            <div className="a1" style={{ padding:'11px 14px',borderRadius:10,marginBottom:16,fontSize:14,background:error.startsWith('✅')?'rgba(16,185,129,0.08)':'rgba(192,57,43,0.08)',border:`1px solid ${error.startsWith('✅')?'rgba(16,185,129,0.3)':'rgba(192,57,43,0.3)'}`,color:error.startsWith('✅')?'#059669':C.red }}>
              {error}
            </div>
          )}

          <form onSubmit={isRegister?handleRegister:handleLogin} style={{ display:'flex',flexDirection:'column',gap:14 }}>
            {isRegister && (
              <div className="field a2">
                <label style={{ fontSize:13,color:C.sub,display:'block',marginBottom:6,fontWeight:600 }}>الاسم الكامل</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',fontSize:16,pointerEvents:'none' }}>👤</span>
                  <input value={name} onChange={e=>setName(e.target.value)} placeholder="أدخل اسمك" required />
                </div>
              </div>
            )}
            <div className="field a2">
              <label style={{ fontSize:13,color:C.sub,display:'block',marginBottom:6,fontWeight:600 }}>البريد الإلكتروني</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',fontSize:16,pointerEvents:'none' }}>📧</span>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="example@email.com" required style={{ direction:'ltr',textAlign:'right' }} />
              </div>
            </div>
            <div className="field a3">
              <label style={{ fontSize:13,color:C.sub,display:'block',marginBottom:6,fontWeight:600 }}>كلمة المرور</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',fontSize:16,pointerEvents:'none' }}>🔑</span>
                <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required style={{ paddingLeft:42 }} />
                <button type="button" onClick={()=>setShowPass(s=>!s)} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:15,color:C.sub,padding:0,lineHeight:1 }}>
                  {showPass?'🙈':'👁️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-blue a4"
              style={{ width:'100%',padding:'14px',borderRadius:12,border:'none',marginTop:4,background:C.gradBlue,color:'#fff',fontSize:15,fontWeight:800,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
              {loading?<><span style={{ width:16,height:16,border:'2.5px solid rgba(255,255,255,0.25)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite' }} />جارٍ التحقق...</>
                :isRegister?'✨ إنشاء الحساب':'دخول ←'}
            </button>
          </form>

          <div className="a5" style={{ display:'flex',alignItems:'center',gap:10,margin:'18px 0' }}>
            <div style={{ flex:1,height:1,background:C.border }} />
            <span style={{ fontSize:12,color:`${C.sub}70` }}>أو</span>
            <div style={{ flex:1,height:1,background:C.border }} />
          </div>

          <button className="a6 btn-sec" onClick={()=>{ setIsRegister(r=>!r);setError('') }}
            style={{ width:'100%',padding:'13px',borderRadius:12,border:`1.5px solid ${C.border}`,background:'transparent',color:C.sub,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit' }}>
            {isRegister?'← العودة لتسجيل الدخول':'ليس لدي حساب — التسجيل ✨'}
          </button>

          <div className="a7" style={{ textAlign:'center',marginTop:16 }}>
            <button onClick={()=>router.push('/landing')} style={{ background:'none',border:'none',color:`${C.sub}80`,fontSize:13,cursor:'pointer',fontFamily:'inherit',fontWeight:600 }}>
              ← العودة للصفحة الرئيسية
            </button>
          </div>
          <p style={{ textAlign:'center',fontSize:12,color:`${C.sub}60`,marginTop:18 }}>مِداد • الكويت 🇰🇼</p>
        </div>
      </div>
    </div>
  )
}