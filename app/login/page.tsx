'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

  return (
    <div dir="rtl" style={{ minHeight:'100vh', display:'flex', fontFamily:"'Segoe UI',Tahoma,Arial,sans-serif", background:'#070612' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}
        @keyframes float {0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
        @keyframes spin  {from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes glow  {0%,100%{box-shadow:0 0 20px rgba(59,130,246,0.25);}50%{box-shadow:0 0 40px rgba(59,130,246,0.5);}}
        @keyframes pulse {0%,100%{opacity:1;}50%{opacity:0.5;}}
        .a1{opacity:0;animation:fadeUp 0.6s ease 0.05s forwards;}
        .a2{opacity:0;animation:fadeUp 0.6s ease 0.15s forwards;}
        .a3{opacity:0;animation:fadeUp 0.6s ease 0.25s forwards;}
        .a4{opacity:0;animation:fadeUp 0.6s ease 0.35s forwards;}
        .a5{opacity:0;animation:fadeUp 0.6s ease 0.45s forwards;}
        .a6{opacity:0;animation:fadeUp 0.6s ease 0.55s forwards;}
        .a7{opacity:0;animation:fadeUp 0.6s ease 0.65s forwards;}
        .fi{opacity:0;animation:fadeUp 0.5s ease forwards;}
        .fi:nth-child(1){animation-delay:0.1s}
        .fi:nth-child(2){animation-delay:0.2s}
        .fi:nth-child(3){animation-delay:0.3s}
        .field input{
          width:100%; padding:14px 42px 14px 16px; border-radius:10px;
          border:1.5px solid rgba(255,255,255,0.09);
          background:rgba(255,255,255,0.04); color:#e2e8f0;
          font-size:14px; font-family:inherit;
          transition:border-color 0.2s,background 0.2s;
        }
        .field input:focus{outline:none;border-color:rgba(59,130,246,0.55)!important;background:rgba(59,130,246,0.06)!important;}
        .field input::placeholder{color:#1e293b;}
        .btn-main{transition:transform 0.18s,box-shadow 0.18s;}
        .btn-main:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 36px rgba(59,130,246,0.45)!important;}
        .btn-main:active:not(:disabled){transform:translateY(0);}
        .btn-main:disabled{background:rgba(255,255,255,0.05)!important;color:#334155!important;cursor:not-allowed!important;box-shadow:none!important;}
        .btn-sec{transition:border-color 0.2s,color 0.2s;}
        .btn-sec:hover{border-color:rgba(255,255,255,0.18)!important;color:#94a3b8!important;}
        .feat-mini{transition:border-color 0.2s,background 0.2s;}
        .feat-mini:hover{border-color:rgba(59,130,246,0.25)!important;background:rgba(59,130,246,0.06)!important;}
        @media(max-width:800px){.right-side{display:none!important;}.left-side{width:100%!important;}}
      `}</style>

      {/* ══ الجانب الأيمن — الهوية ══ */}
      <div className="right-side" style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 56px', position:'relative', overflow:'hidden' }}>

        {/* خلفية هادئة */}
        <div style={{ position:'absolute', inset:0, backgroundImage:`url(https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1600&q=65&auto=format&fit=crop)`, backgroundSize:'cover', backgroundPosition:'center', filter:'brightness(0.12) saturate(0.5)' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,rgba(7,6,18,0.94) 0%,rgba(10,18,50,0.88) 100%)' }} />
        <div style={{ position:'absolute', top:-80, right:'25%', width:400, height:400, borderRadius:'50%', background:'rgba(59,130,246,0.06)', filter:'blur(100px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-80, left:'10%', width:320, height:320, borderRadius:'50%', background:'rgba(139,92,246,0.05)', filter:'blur(80px)', pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:2, maxWidth:500 }}>

          {/* الشعار */}
          <div className="a1" style={{ display:'flex', alignItems:'center', gap:12, marginBottom:44 }}>
            <div style={{ width:48, height:48, borderRadius:13, background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, animation:'float 4s ease-in-out infinite', flexShrink:0 }}>🌙</div>
            <div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', letterSpacing:3, fontWeight:700, marginBottom:1 }}>MOSAED</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.6)', fontWeight:700 }}>منصة مساعد اللغة العربية</div>
            </div>
          </div>

          {/* العنوان */}
          <h1 className="a2" style={{ fontSize:44, fontWeight:900, lineHeight:1.25, color:'#f1f5f9', marginBottom:14 }}>
            تعلّم،{' '}
            <span style={{ color:'#60a5fa' }}>تدرّب،</span><br />
            واختبر نفسك{' '}
            <span style={{ background:'linear-gradient(135deg,#fbbf24,#f97316)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>بذكاء.</span>
          </h1>

          <p className="a3" style={{ fontSize:15, color:'rgba(255,255,255,0.4)', lineHeight:1.8, marginBottom:12 }}>
            مخصص للمعلم والطالب في اللغة العربية
          </p>

          {/* مؤشرات ثقة */}
          <div className="a4" style={{ display:'flex', gap:20, marginBottom:44, flexWrap:'wrap' }}>
            {['شرح ذكي للدروس','اختبارات تفاعلية','مراجعة بالبطاقات'].map((t,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#60a5fa', flexShrink:0 }} />
                <span style={{ fontSize:13, color:'rgba(255,255,255,0.45)', fontWeight:600 }}>{t}</span>
              </div>
            ))}
          </div>

          {/* بطاقة كبيرة + 2 صغيرة */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>

            {/* كبيرة */}
            <div className="fi feat-mini" style={{ gridColumn:'1/-1', display:'flex', alignItems:'center', gap:16, padding:'16px 18px', borderRadius:14, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.22)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>💡</div>
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:'#e2e8f0', marginBottom:3 }}>شرح ذكي للدروس</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>شرح + ورقة عمل + تصحيح فوري بالذكاء الاصطناعي</div>
              </div>
            </div>

            {/* صغيرة 1 */}
            <div className="fi feat-mini" style={{ padding:'16px 16px', borderRadius:14, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize:22, marginBottom:8 }}>🎯</div>
              <div style={{ fontSize:13, fontWeight:800, color:'#e2e8f0', marginBottom:3 }}>اختبارات تفاعلية</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', lineHeight:1.6 }}>8 أسئلة وتصحيح فوري</div>
            </div>

            {/* صغيرة 2 */}
            <div className="fi feat-mini" style={{ padding:'16px 16px', borderRadius:14, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize:22, marginBottom:8 }}>📊</div>
              <div style={{ fontSize:13, fontWeight:800, color:'#e2e8f0', marginBottom:3 }}>متابعة الأداء</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', lineHeight:1.6 }}>تحليلات للمعلم والطالب</div>
            </div>
          </div>

          <p style={{ fontSize:11, color:'rgba(255,255,255,0.15)', marginTop:28 }}>🇰🇼 منصة مساعد اللغة العربية • الكويت</p>
        </div>
      </div>

      {/* فاصل */}
      <div style={{ width:1, background:'linear-gradient(180deg,transparent,rgba(255,255,255,0.07) 30%,rgba(255,255,255,0.07) 70%,transparent)', flexShrink:0 }} />

      {/* ══ الجانب الأيسر — النموذج ══ */}
      <div className="left-side" style={{ width:400, flexShrink:0, background:'#0c0a1a', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 40px', position:'relative', overflow:'hidden' }}>

        {/* شريط ملون علوي */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#3b82f6,#8b5cf6,#f59e0b)' }} />
        {/* ضوء خلفي */}
        <div style={{ position:'absolute', bottom:-40, left:-30, width:180, height:180, borderRadius:'50%', background:'rgba(139,92,246,0.05)', filter:'blur(50px)', pointerEvents:'none' }} />

        <div style={{ width:'100%', maxWidth:300, position:'relative', zIndex:2 }}>

          {/* رأس النموذج */}
          <div className="a1" style={{ marginBottom:28 }}>
            <h2 style={{ fontSize:22, fontWeight:900, color:'#f1f5f9', marginBottom:6 }}>
              {isRegister ? 'إنشاء حساب جديد ✨' : 'مرحباً بك 👋'}
            </h2>
            <p style={{ fontSize:13, color:'#334155' }}>
              {isRegister ? 'سجّل للانضمام للمنصة' : 'سجّل دخولك للمتابعة'}
            </p>
          </div>

          {/* رسالة خطأ/نجاح */}
          {error && (
            <div className="a1" style={{
              padding:'11px 14px', borderRadius:10, marginBottom:16, fontSize:13,
              background: error.startsWith('✅') ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              border:`1px solid ${error.startsWith('✅') ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
              color: error.startsWith('✅') ? '#4ade80' : '#f87171',
            }}>{error}</div>
          )}

          {/* النموذج */}
          <form onSubmit={isRegister ? handleRegister : handleLogin} style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {isRegister && (
              <div className="field a2">
                <label style={{ fontSize:12, color:'#475569', display:'block', marginBottom:6, fontWeight:600 }}>الاسم الكامل</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', fontSize:15, pointerEvents:'none' }}>👤</span>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="أدخل اسمك" required />
                </div>
              </div>
            )}

            <div className="field a2">
              <label style={{ fontSize:12, color:'#475569', display:'block', marginBottom:6, fontWeight:600 }}>البريد الإلكتروني</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', fontSize:15, pointerEvents:'none' }}>📧</span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" required style={{ direction:'ltr', textAlign:'right' }} />
              </div>
            </div>

            <div className="field a3">
              <label style={{ fontSize:12, color:'#475569', display:'block', marginBottom:6, fontWeight:600 }}>كلمة المرور</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', fontSize:15, pointerEvents:'none' }}>🔑</span>
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ paddingLeft:42 }} />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:15, color:'#334155', padding:0, lineHeight:1 }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* زر الدخول */}
            <button type="submit" disabled={loading} className="btn-main a4"
              style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', marginTop:4, background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 6px 24px rgba(59,130,246,0.3)', animation:'glow 3s ease-in-out infinite' }}>
              {loading
                ? <><span style={{ width:16, height:16, border:'2.5px solid rgba(255,255,255,0.25)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.8s linear infinite' }} />جارٍ التحقق...</>
                : isRegister ? '✨ إنشاء الحساب' : 'دخول ←'}
            </button>
          </form>

          {/* فاصل */}
          <div className="a5" style={{ display:'flex', alignItems:'center', gap:10, margin:'18px 0' }}>
            <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize:11, color:'#1e293b' }}>أو</span>
            <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }} />
          </div>

          {/* زر التسجيل */}
          <button className="a6 btn-sec" onClick={() => { setIsRegister(r => !r); setError('') }}
            style={{ width:'100%', padding:'13px', borderRadius:12, border:'1.5px solid rgba(255,255,255,0.07)', background:'transparent', color:'#475569', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            {isRegister ? '← العودة لتسجيل الدخول' : 'ليس لدي حساب — التسجيل ✨'}
          </button>

          {/* رابط العودة للرئيسية */}
          <div className="a7" style={{ textAlign:'center', marginTop:20 }}>
            <button onClick={() => router.push('/landing')} style={{ background:'none', border:'none', color:'#334155', fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
              ← العودة للصفحة الرئيسية
            </button>
          </div>

          <p style={{ textAlign:'center', fontSize:11, color:'#1e293b', marginTop:20 }}>
            منصة مساعد اللغة العربية • الكويت 🇰🇼
          </p>
        </div>
      </div>
    </div>
  )
}