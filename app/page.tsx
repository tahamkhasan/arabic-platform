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
    <div dir="rtl" style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
      background: '#070612',
    }}>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }

        /* ── الحركات ── */
        @keyframes fadeUp   { from{opacity:0;transform:translateY(22px);}  to{opacity:1;transform:translateY(0);} }
        @keyframes fadeIn   { from{opacity:0;} to{opacity:1;} }
        @keyframes float    { 0%,100%{transform:translateY(0);}  50%{transform:translateY(-8px);} }
        @keyframes spin     { from{transform:rotate(0deg);}  to{transform:rotate(360deg);} }
        @keyframes panBg    { 0%{background-position:0% 50%;} 100%{background-position:100% 50%;} }

        /* ── ظهور متتالي للعناصر ── */
        .a1{opacity:0;animation:fadeUp 0.6s ease 0.05s forwards;}
        .a2{opacity:0;animation:fadeUp 0.6s ease 0.15s forwards;}
        .a3{opacity:0;animation:fadeUp 0.6s ease 0.25s forwards;}
        .a4{opacity:0;animation:fadeUp 0.6s ease 0.35s forwards;}
        .a5{opacity:0;animation:fadeUp 0.6s ease 0.45s forwards;}
        .a6{opacity:0;animation:fadeUp 0.6s ease 0.55s forwards;}
        .a7{opacity:0;animation:fadeUp 0.6s ease 0.65s forwards;}

        /* ── النموذج ── */
        .field input {
          width:100%; padding:14px 42px 14px 16px; border-radius:10px;
          border:1.5px solid rgba(255,255,255,0.09);
          background:rgba(255,255,255,0.05); color:#e2e8f0;
          font-size:14px; font-family:inherit;
          transition: border-color 0.2s, background 0.2s;
        }
        .field input:focus {
          outline:none;
          border-color:rgba(164,197,255,0.5) !important;
          background:rgba(164,197,255,0.06) !important;
        }
        .field input::placeholder { color:#334155; }

        /* ── زر الدخول ── */
        .btn-main {
          width:100%; padding:14px; border-radius:12px; border:none;
          background:linear-gradient(135deg,#1e6fd4,#7c3aed);
          color:#fff; font-size:15px; font-weight:800;
          font-family:inherit; cursor:pointer;
          box-shadow:0 6px 24px rgba(30,111,212,0.35);
          transition: transform 0.18s, box-shadow 0.18s;
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .btn-main:hover:not(:disabled) {
          transform:translateY(-2px);
          box-shadow:0 10px 32px rgba(30,111,212,0.5);
        }
        .btn-main:active:not(:disabled) { transform:translateY(0); }
        .btn-main:disabled { background:rgba(255,255,255,0.06); color:#475569; cursor:not-allowed; box-shadow:none; }

        /* ── بطاقات المزايا ── */
        .feat-card {
          padding:18px 20px; border-radius:14px;
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.06);
          transition: transform 0.2s, border-color 0.2s, background 0.2s;
        }
        .feat-card:hover {
          transform:translateY(-3px);
          border-color:rgba(164,197,255,0.2);
          background:rgba(164,197,255,0.05);
        }

        /* ── الجوال ── */
        @media(max-width:800px) {
          .right-side { display:none !important; }
          .left-side  { width:100% !important; padding:36px 24px !important; }
        }
      `}</style>

      {/* ══ الجانب الأيمن — الهوية البصرية ═══════════════════════ */}
      <div className="right-side" style={{
        flex:1, display:'flex', flexDirection:'column',
        justifyContent:'center', padding:'56px 60px',
        position:'relative', overflow:'hidden',
      }}>

        {/* خلفية هادئة — ليست بطلة المشهد */}
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:`url(https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1600&q=70&auto=format&fit=crop)`,
          backgroundSize:'cover', backgroundPosition:'center',
          filter:'brightness(0.12) saturate(0.6)',
        }} />
        {/* طبقة لون صافية فوق الصورة */}
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(160deg, rgba(7,6,18,0.92) 0%, rgba(14,22,55,0.88) 100%)',
        }} />
        {/* ضوء علوي كحلي خفيف */}
        <div style={{ position:'absolute', top:-120, right:'30%', width:500, height:500, borderRadius:'50%', background:'rgba(30,111,212,0.07)', filter:'blur(100px)', pointerEvents:'none' }} />

        {/* المحتوى */}
        <div style={{ position:'relative', zIndex:2, maxWidth:520 }}>

          {/* شعار + اسم المنصة */}
          <div className="a1" style={{ display:'flex', alignItems:'center', gap:14, marginBottom:40 }}>
            <div style={{
              width:52, height:52, borderRadius:14,
              background:'linear-gradient(135deg,#1e6fd4,#7c3aed)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:26, flexShrink:0,
              animation:'float 4s ease-in-out infinite',
            }}>🌙</div>
            <div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.35)', letterSpacing:2, fontWeight:600, marginBottom:2 }}>
                MOSAED
              </div>
              <div style={{ fontSize:15, color:'rgba(255,255,255,0.7)', fontWeight:700 }}>
                منصة مساعد اللغة العربية
              </div>
            </div>
          </div>

          {/* العنوان الرئيسي — هو البطل */}
          <h1 className="a2" style={{
            fontSize:46, fontWeight:900, lineHeight:1.25,
            color:'#f1f5f9', marginBottom:16,
          }}>
            تعلّم،{' '}
            <span style={{ color:'#60a5fa' }}>تدرّب،</span>
            <br />
            واختبر نفسك{' '}
            <span style={{
              background:'linear-gradient(135deg,#fbbf24,#f59e0b)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            }}>بذكاء.</span>
          </h1>

          {/* سطر فرعي مختصر */}
          <p className="a3" style={{ fontSize:16, color:'rgba(255,255,255,0.45)', lineHeight:1.7, marginBottom:12 }}>
            مخصص للمعلم والطالب في اللغة العربية
          </p>

          {/* مؤشر ثقة */}
          <div className="a4" style={{ display:'flex', gap:20, marginBottom:44 }}>
            {['شرح ذكي للدروس', 'اختبارات تفاعلية', 'مراجعة بالبطاقات'].map((t,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#60a5fa', flexShrink:0 }} />
                <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>{t}</span>
              </div>
            ))}
          </div>

          {/* بطاقة كبيرة + بطاقتان صغيرتان */}
          <div className="a5" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'auto auto', gap:12 }}>

            {/* بطاقة كبيرة — شرح ذكي */}
            <div className="feat-card" style={{ gridColumn:'1 / -1', display:'flex', alignItems:'center', gap:16 }}>
              <div style={{
                width:48, height:48, borderRadius:12, flexShrink:0,
                background:'rgba(30,111,212,0.18)', border:'1px solid rgba(30,111,212,0.25)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:24,
              }}>💡</div>
              <div>
                <div style={{ fontSize:15, fontWeight:800, color:'#e2e8f0', marginBottom:3 }}>شرح ذكي للدروس</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>
                  شرح مبسط + ورقة عمل + تصحيح فوري بالذكاء الاصطناعي
                </div>
              </div>
            </div>

            {/* بطاقة صغيرة — اختبارات */}
            <div className="feat-card">
              <div style={{ fontSize:22, marginBottom:10 }}>🎯</div>
              <div style={{ fontSize:13, fontWeight:800, color:'#e2e8f0', marginBottom:4 }}>اختبارات تفاعلية</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', lineHeight:1.6 }}>8 أسئلة متنوعة وتصحيح فوري</div>
            </div>

            {/* بطاقة صغيرة — متابعة */}
            <div className="feat-card">
              <div style={{ fontSize:22, marginBottom:10 }}>📊</div>
              <div style={{ fontSize:13, fontWeight:800, color:'#e2e8f0', marginBottom:4 }}>متابعة الأداء</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', lineHeight:1.6 }}>تحليلات وتقارير للمعلم والطالب</div>
            </div>
          </div>

          {/* الكويت */}
          <p className="a6" style={{ fontSize:11, color:'rgba(255,255,255,0.15)', marginTop:32 }}>
            🇰🇼 منصة مساعد اللغة العربية • الكويت
          </p>
        </div>
      </div>

      {/* فاصل عمودي */}
      <div style={{ width:1, background:'linear-gradient(180deg,transparent,rgba(255,255,255,0.08) 30%,rgba(255,255,255,0.08) 70%,transparent)', flexShrink:0 }} />

      {/* ══ الجانب الأيسر — لوحة الدخول ════════════════════════ */}
      <div className="left-side" style={{
        width:400, flexShrink:0,
        background:'#0c0a1a',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        padding:'48px 40px',
        position:'relative',
      }}>
        {/* ضوء بنفسجي خفيف */}
        <div style={{ position:'absolute', bottom:0, left:0, width:200, height:200, borderRadius:'50%', background:'rgba(124,58,237,0.05)', filter:'blur(60px)', pointerEvents:'none' }} />

        <div style={{ width:'100%', maxWidth:300, position:'relative', zIndex:2 }}>

          {/* العنوان */}
          <div className="a1" style={{ marginBottom:28 }}>
            <h2 style={{ fontSize:21, fontWeight:900, color:'#f1f5f9', marginBottom:6 }}>
              {isRegister ? 'إنشاء حساب جديد ✨' : 'مرحباً بك 👋'}
            </h2>
            <p style={{ fontSize:13, color:'#334155' }}>
              {isRegister ? 'سجّل للانضمام للمنصة' : 'سجّل دخولك للمتابعة'}
            </p>
          </div>

          {/* رسالة */}
          {error && (
            <div className="a1" style={{
              padding:'12px 14px', borderRadius:10, marginBottom:16, fontSize:13,
              background: error.startsWith('✅') ? 'rgba(67,233,123,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${error.startsWith('✅') ? 'rgba(67,233,123,0.25)' : 'rgba(239,68,68,0.25)'}`,
              color: error.startsWith('✅') ? '#4ade80' : '#f87171',
            }}>{error}</div>
          )}

          {/* النموذج */}
          <form onSubmit={isRegister ? handleRegister : handleLogin}
            style={{ display:'flex', flexDirection:'column', gap:14 }}>

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
                  style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:15, color:'#334155', padding:0, lineHeight:1 }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* زر الدخول */}
            <button type="submit" disabled={loading} className="btn-main a4" style={{ marginTop:4 }}>
              {loading
                ? <><span style={{ width:16, height:16, border:'2.5px solid rgba(255,255,255,0.2)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.8s linear infinite' }} />جارٍ التحقق...</>
                : isRegister ? '✨ إنشاء الحساب' : 'دخول ←'}
            </button>
          </form>

          {/* فاصل */}
          <div className="a5" style={{ display:'flex', alignItems:'center', gap:10, margin:'20px 0' }}>
            <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize:11, color:'#1e293b' }}>أو</span>
            <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }} />
          </div>

          {/* زر التسجيل */}
          <button className="a6" onClick={() => { setIsRegister(r => !r); setError('') }}
            style={{
              width:'100%', padding:'13px', borderRadius:12,
              border:'1.5px solid rgba(255,255,255,0.07)',
              background:'transparent', color:'#475569',
              fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
              transition:'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)'; (e.target as HTMLButtonElement).style.color = '#94a3b8' }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.target as HTMLButtonElement).style.color = '#475569' }}
          >
            {isRegister ? '← العودة لتسجيل الدخول' : 'ليس لدي حساب — التسجيل ✨'}
          </button>

          <p className="a7" style={{ textAlign:'center', fontSize:11, color:'#1e293b', marginTop:28 }}>
            منصة مساعد اللغة العربية • الكويت 🇰🇼
          </p>
        </div>
      </div>
    </div>
  )
}