'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const FLOATING_WORDS = [
  { text: 'نحو',    size: 36, opacity: 0.25, top: '8%',  left: '5%'  },
  { text: 'بلاغة', size: 28, opacity: 0.22, top: '15%', left: '70%' },
  { text: 'أدب',   size: 42, opacity: 0.28, top: '25%', left: '85%' },
  { text: 'صرف',   size: 30, opacity: 0.20, top: '40%', left: '3%'  },
  { text: 'شعر',   size: 38, opacity: 0.26, top: '55%', left: '75%' },
  { text: 'نثر',   size: 26, opacity: 0.20, top: '65%', left: '15%' },
  { text: 'قراءة', size: 32, opacity: 0.23, top: '75%', left: '60%' },
  { text: 'كتابة', size: 40, opacity: 0.27, top: '82%', left: '30%' },
  { text: 'تعبير', size: 30, opacity: 0.21, top: '10%', left: '40%' },
  { text: 'إملاء', size: 34, opacity: 0.24, top: '45%', left: '88%' },
  { text: 'خط',    size: 48, opacity: 0.30, top: '30%', left: '50%' },
  { text: 'لغة',   size: 52, opacity: 0.32, top: '70%', left: '45%' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [mounted, setMounted]   = useState(false)

  useEffect(() => { setMounted(true) }, [])

  async function handleLogin() {
    if (!email || !password) return setError('أدخل البريد الإلكتروني وكلمة المرور')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'خطأ في تسجيل الدخول')
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('session', JSON.stringify(data.session))
      if (data.user?.role === 'admin') router.push('/admin')
      else router.push('/dashboard')
    } catch { setError('حدث خطأ. حاول مرة أخرى.') }
    finally { setLoading(false) }
  }

  return (
    <div dir="rtl" style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg,#0a0a1a,#0d1117,#0f1923)',
      fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
    }}>

      {/* خلفية متحركة */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>

        {/* دوائر متوهجة */}
        {mounted && [
          { w: 700, h: 700, top: '-20%', right: '-15%', c1: '#f9d42340', c2: '#ff4e5015' },
          { w: 500, h: 500, bottom: '-15%', left: '-10%', c1: '#4facfe30', c2: '#00f2fe10' },
          { w: 350, h: 350, top: '35%', left: '25%', c1: '#43e97b20', c2: '#38f9d710' },
        ].map((c, i) => (
          <div key={i} style={{
            position: 'absolute', width: c.w, height: c.h,
            top: c.top, bottom: c.bottom, right: c.right, left: c.left,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${c.c1}, ${c.c2}, transparent)`,
            animation: `pulse ${3 + i}s ease-in-out infinite alternate`,
          }} />
        ))}

        {/* كلمات عائمة — أكثر وضوحاً */}
        {mounted && FLOATING_WORDS.map((word, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: word.left,
            top: word.top,
            color: `rgba(249,212,35,${word.opacity})`,
            fontSize: word.size,
            fontWeight: 900,
            animation: `float ${5 + (i % 3)}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.4}s`,
            userSelect: 'none',
            textShadow: `0 0 20px rgba(249,212,35,${word.opacity * 0.5})`,
            letterSpacing: '2px',
          }}>{word.text}</div>
        ))}

        {/* خطوط ديكورية */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.05 }}>
          {mounted && Array.from({ length: 6 }).map((_, i) => (
            <line key={i}
              x1={`${i * 20}%`} y1="0"
              x2={`${(i * 20 + 40) % 100}%`} y2="100%"
              stroke="#f9d423" strokeWidth="1" />
          ))}
        </svg>
      </div>

      {/* CSS */}
      <style>{`
        @keyframes float {
          from { transform: translateY(0px) rotate(-3deg) scale(1); }
          to   { transform: translateY(-25px) rotate(3deg) scale(1.05); }
        }
        @keyframes pulse {
          from { transform: scale(1); opacity: 0.6; }
          to   { transform: scale(1.15); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .card-animate  { animation: slideUp 0.6s ease forwards; }
        .input-field   { transition: all 0.3s; }
        .input-field:focus { border-color: rgba(249,212,35,0.6) !important; box-shadow: 0 0 0 3px rgba(249,212,35,0.12) !important; }
        .btn-main:hover    { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(249,212,35,0.45) !important; }
        .btn-main:active   { transform: translateY(0px); }
        .btn-secondary:hover { border-color: rgba(255,255,255,0.25) !important; color: #e2e8f0 !important; background: rgba(255,255,255,0.06) !important; }
        .btn-forgot:hover  { color: #f9d423 !important; }
      `}</style>

      {/* البطاقة الرئيسية */}
      <div className="card-animate" style={{
        width: '100%', maxWidth: 400, position: 'relative', zIndex: 10,
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px)',
        borderRadius: 28,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '40px 32px',
        boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}>

        {/* شعار */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px',
            background: 'linear-gradient(135deg,#f9d423,#ff4e50)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, boxShadow: '0 8px 30px rgba(249,212,35,0.5)',
            animation: 'pulse 2.5s ease-in-out infinite alternate',
          }}>🌙</div>

          <h1 style={{
            fontSize: 22, fontWeight: 900, margin: '0 0 6px',
            background: 'linear-gradient(90deg,#f9d423,#ff4e50,#f9d423)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'shimmer 3s linear infinite',
          }}>منصة مساعد اللغة العربية</h1>

          <p style={{ color: '#4a5568', fontSize: 12, margin: 0 }}>مدعوم بالذكاء الاصطناعي 🤖</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 0' }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,rgba(249,212,35,0.4))' }} />
            <span style={{ color: '#f9d423', fontSize: 14 }}>✦</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(249,212,35,0.4),transparent)' }} />
          </div>
        </div>

        {/* النموذج */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* البريد */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>📧</span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني" className="input-field"
              style={{ width: '100%', padding: '14px 44px 14px 14px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.07)', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>

          {/* كلمة المرور */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔑</span>
            <input type={showPw ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="كلمة المرور" className="input-field"
              style={{ width: '100%', padding: '14px 44px 14px 44px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.07)', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <button onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 0 }}>
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>

          {/* نسيت كلمة المرور */}
          <div style={{ textAlign: 'left' }}>
            <button onClick={() => router.push('/forgot-password')} className="btn-forgot"
              style={{ background: 'none', border: 'none', color: '#4a5568', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.2s' }}>
              نسيت كلمة المرور؟ 🔑
            </button>
          </div>

          {/* رسالة الخطأ */}
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.3)', color: '#fc8181', fontSize: 13, textAlign: 'center', animation: 'slideUp 0.3s ease' }}>
              ⚠️ {error}
            </div>
          )}

          {/* زر الدخول */}
          <button onClick={handleLogin} disabled={loading} className="btn-main" style={{
            width: '100%', padding: '14px', borderRadius: 14, border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#f9d423,#ff4e50)',
            color: loading ? '#4a5568' : '#1a1a2e', fontWeight: 900, fontSize: 16,
            fontFamily: 'inherit', transition: 'all 0.3s',
            boxShadow: loading ? 'none' : '0 6px 20px rgba(249,212,35,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {loading ? (
              <>
                <span style={{ width: 18, height: 18, border: '2px solid #4a5568', borderTopColor: '#718096', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                جارٍ الدخول...
              </>
            ) : 'دخول ←'}
          </button>

          {/* فاصل */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: '#4a5568', fontSize: 12 }}>أو</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* زر التسجيل */}
          <button onClick={() => router.push('/register')} className="btn-secondary" style={{
            width: '100%', padding: '13px', borderRadius: 14,
            border: '1.5px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.03)', color: '#718096',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
            fontFamily: 'inherit', transition: 'all 0.3s',
          }}>
            ليس لدي حساب — التسجيل الجديد ✨
          </button>
        </div>

        <p style={{ textAlign: 'center', color: '#2d3748', fontSize: 11, marginTop: 24, marginBottom: 0 }}>
          منصة مساعد اللغة العربية • الكويت 🇰🇼
        </p>
      </div>
    </div>
  )
}