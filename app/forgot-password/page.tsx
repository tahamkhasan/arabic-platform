'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  async function handleReset() {
    if (!email) return setError('أدخل بريدك الإلكتروني')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'حدث خطأ')
      setSuccess(true)
    } catch { setError('حدث خطأ. حاول مرة أخرى.') }
    finally { setLoading(false) }
  }

  if (success) return (
    <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'linear-gradient(135deg,#0a0a1a,#0d1117,#0f1923)', fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 380, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', padding: '40px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>📧</div>
        <h2 style={{ color: '#43e97b', fontWeight: 900, fontSize: 20, marginBottom: 12 }}>تم إرسال الرابط!</h2>
        <p style={{ color: '#a0aec0', fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
          تحقق من بريدك الإلكتروني<br/>
          <span style={{ color: '#f9d423', fontWeight: 700 }}>{email}</span><br/>
          وانقر على الرابط لإعادة تعيين كلمة المرور
        </p>
        <button onClick={() => router.push('/')} style={{ width: '100%', padding: 13, borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#f9d423,#ff4e50)', color: '#1a1a2e', fontWeight: 900, fontSize: 15, fontFamily: 'inherit' }}>
          العودة لتسجيل الدخول
        </button>
      </div>
    </div>
  )

  return (
    <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'linear-gradient(135deg,#0a0a1a,#0d1117,#0f1923)', fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif" }}>
      <style>{`
        .input-field:focus { border-color: rgba(249,212,35,0.5) !important; outline: none; box-shadow: 0 0 0 3px rgba(249,212,35,0.1); }
        .btn-main:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(249,212,35,0.4) !important; }
      `}</style>
      <div style={{ width: '100%', maxWidth: 380, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔑</div>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 8px', background: 'linear-gradient(90deg,#f9d423,#ff4e50)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            نسيت كلمة المرور؟
          </h1>
          <p style={{ color: '#4a5568', fontSize: 13, margin: 0 }}>
            أدخل بريدك وسنرسل لك رابط إعادة التعيين
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>📧</span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleReset()}
              placeholder="البريد الإلكتروني" className="input-field"
              style={{ width: '100%', padding: '14px 44px 14px 14px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', transition: 'all 0.3s' }} />
          </div>

          {error && <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.3)', color: '#fc8181', fontSize: 13, textAlign: 'center' }}>⚠️ {error}</div>}

          <button onClick={handleReset} disabled={loading} className="btn-main"
            style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#f9d423,#ff4e50)', color: loading ? '#4a5568' : '#1a1a2e', fontWeight: 900, fontSize: 15, fontFamily: 'inherit', transition: 'all 0.3s' }}>
            {loading ? '⏳ جارٍ الإرسال...' : 'إرسال رابط إعادة التعيين 📧'}
          </button>

          <button onClick={() => router.push('/')}
            style={{ width: '100%', padding: 13, borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#718096', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.3s' }}>
            ← العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    </div>
  )
}