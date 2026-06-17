'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const IMAGES = {
  loginBg:    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1920&q=80&auto=format&fit=crop',
  calligraphy:'https://images.unsplash.com/photo-1594392175511-30eca83d51c8?w=800&q=80&auto=format&fit=crop',
  books:      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80&auto=format&fit=crop',
}

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [name,     setName]     = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'بيانات غير صحيحة'); return }
      localStorage.setItem('mosaed_user',    JSON.stringify(data.user))
      localStorage.setItem('mosaed_session', JSON.stringify(data.session))
      if (data.user?.role === 'admin')         router.push('/admin')
      else if (data.user?.user_type === 'student') router.push('/student')
      else                                          router.push('/dashboard')
    } catch { setError('تعذّر الاتصال بالخادم') }
    finally  { setLoading(false) }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', email, password, name }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'فشل التسجيل'); return }
      setIsRegister(false)
      setError('✅ تم التسجيل! انتظر موافقة المدير للدخول.')
    } catch { setError('تعذّر الاتصال بالخادم') }
    finally  { setLoading(false) }
  }

  return (
    <div dir="rtl" style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float  { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes spin   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:focus { outline: none; }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
      `}</style>

      {/* ══ الجانب الأيسر — الصورة ══════════════════════════════ */}
      <div style={{
        flex: 1, display: 'none',
        position: 'relative', overflow: 'hidden',
      }}
        className="left-panel"
      >
        {/* خلفية الصورة */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${IMAGES.loginBg})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'brightness(0.4)',
        }} />

        {/* طبقة تدرج */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg,rgba(79,172,254,0.3),rgba(168,139,250,0.3))',
        }} />

        {/* المحتوى */}
        <div style={{
          position: 'relative', zIndex: 2,
          height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px', color: '#fff', textAlign: 'center',
        }}>
          {/* أيقونة عائمة */}
          <div style={{
            fontSize: 80, marginBottom: 24,
            animation: 'float 3s ease-in-out infinite',
          }}>🌙</div>

          <h1 style={{
            fontSize: 36, fontWeight: 900, marginBottom: 16,
            background: 'linear-gradient(135deg,#f9d423,#ff4e50)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            منصة مساعد اللغة العربية
          </h1>
          <p style={{ fontSize: 18, opacity: 0.9, lineHeight: 1.8, maxWidth: 400, marginBottom: 40 }}>
            منصة تعليمية متكاملة مدعومة بالذكاء الاصطناعي لتعلم اللغة العربية
          </p>

          {/* ميزات */}
          {[
            { icon: '🎯', text: 'اختبارات تفاعلية ذكية' },
            { icon: '🃏', text: 'بطاقات حفظ حسب نوع الدرس' },
            { icon: '📝', text: 'مهام مع تصحيح فوري بالذكاء الاصطناعي' },
            { icon: '📊', text: 'تحليلات أداء متقدمة' },
          ].map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: 14, fontSize: 16,
              animation: `fadeUp 0.6s ease ${i * 0.15}s forwards`,
              opacity: 0,
            }}>
              <span style={{ fontSize: 24 }}>{f.icon}</span>
              <span style={{ opacity: 0.9 }}>{f.text}</span>
            </div>
          ))}

          {/* صورة الكتب */}
          <div style={{
            marginTop: 40, width: 200, height: 140, borderRadius: 16,
            overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}>
            <img src={IMAGES.books} alt="كتب" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </div>

      {/* ══ الجانب الأيمن — نموذج الدخول ═══════════════════════ */}
      <div style={{
        width: '100%', maxWidth: 480,
        background: '#0d0b1e',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 32px',
        position: 'relative', overflow: 'hidden',
      }}>

        {/* نقاط زخرفية */}
        <div style={{ position: 'absolute', top: 40, right: 40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(79,172,254,0.08)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: 40, left: 40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(168,139,250,0.08)', filter: 'blur(50px)' }} />

        <div style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 2 }} className="fade-up">

          {/* الشعار */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: 'linear-gradient(135deg,#4facfe,#a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(79,172,254,0.3)',
            }}>🌙</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9', marginBottom: 6 }}>
              منصة مساعد اللغة العربية
            </h2>
            <p style={{ fontSize: 14, color: '#64748b' }}>
              {isRegister ? 'إنشاء حساب جديد' : 'مدعوم بالذكاء الاصطناعي 🤖'}
            </p>
          </div>

          {/* رسالة الخطأ / النجاح */}
          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: 12, marginBottom: 20, fontSize: 14,
              background: error.startsWith('✅') ? 'rgba(67,233,123,0.12)' : 'rgba(252,129,129,0.12)',
              border: `1px solid ${error.startsWith('✅') ? 'rgba(67,233,123,0.3)' : 'rgba(252,129,129,0.3)'}`,
              color: error.startsWith('✅') ? '#43e97b' : '#fc8181',
            }}>
              {error}
            </div>
          )}

          {/* النموذج */}
          <form onSubmit={isRegister ? handleRegister : handleLogin}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {isRegister && (
              <div>
                <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6, fontWeight: 600 }}>
                  👤 الاسم الكامل
                </label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="أدخل اسمك الكامل"
                  required
                  style={{
                    width: '100%', padding: '13px 16px', borderRadius: 12,
                    border: '1.5px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.06)', color: '#f1f5f9',
                    fontSize: 15, fontFamily: 'inherit',
                  }}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6, fontWeight: 600 }}>
                📧 البريد الإلكتروني
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: 12,
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.06)', color: '#f1f5f9',
                  fontSize: 15, fontFamily: 'inherit', direction: 'ltr', textAlign: 'right',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6, fontWeight: 600 }}>
                🔑 كلمة المرور
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', padding: '13px 48px 13px 16px', borderRadius: 12,
                    border: '1.5px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.06)', color: '#f1f5f9',
                    fontSize: 15, fontFamily: 'inherit',
                  }}
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
                  }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* زر الدخول */}
            <button type="submit" disabled={loading}
              style={{
                padding: '14px', borderRadius: 14, border: 'none', marginTop: 6,
                background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#4facfe,#a78bfa)',
                color: loading ? '#4facfe' : '#fff',
                fontSize: 16, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : '0 8px 20px rgba(79,172,254,0.3)',
                transition: 'all 0.2s',
              }}>
              {loading
                ? <><span style={{ width: 18, height: 18, border: '3px solid rgba(79,172,254,0.3)', borderTopColor: '#4facfe', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />جارٍ التحقق...</>
                : isRegister ? '✨ إنشاء الحساب' : 'دخول ←'
              }
            </button>
          </form>

          {/* رابط التبديل */}
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button onClick={() => { setIsRegister(r => !r); setError('') }}
              style={{ background: 'none', border: 'none', color: '#4facfe', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', fontWeight: 600 }}>
              {isRegister ? '← العودة لتسجيل الدخول' : 'ليس لدي حساب — التسجيل الجديد ✨'}
            </button>
          </div>

          {/* الذيل */}
          <p style={{ textAlign: 'center', fontSize: 12, color: '#334155', marginTop: 32 }}>
            منصة مساعد اللغة العربية • الكويت 🇰🇼
          </p>
        </div>
      </div>

      {/* CSS للشاشات الكبيرة */}
      <style>{`
        @media (min-width: 768px) {
          .left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  )
}