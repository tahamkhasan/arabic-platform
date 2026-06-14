'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)
  const [userId, setUserId]       = useState('')

  useEffect(() => {
    // جلب الـ session من الرابط
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session?.user) {
        setUserId(session.user.id)
      }
    })
  }, [])

  async function handleReset() {
    if (!password) return setError('أدخل كلمة المرور الجديدة')
    if (password.length < 6) return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
    if (password !== confirm) return setError('كلمتا المرور غير متطابقتين')
    setLoading(true); setError('')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
      setTimeout(() => router.push('/'), 2000)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'linear-gradient(135deg,#0a0a1a,#0d1117,#0f1923)', fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 380, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', padding: '40px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: '#43e97b', fontWeight: 900, fontSize: 20, marginBottom: 12 }}>تم تغيير كلمة المرور!</h2>
        <p style={{ color: '#a0aec0', fontSize: 14 }}>سيتم تحويلك لصفحة الدخول...</p>
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
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 8px', background: 'linear-gradient(90deg,#f9d423,#ff4e50)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            تعيين كلمة مرور جديدة
          </h1>
          <p style={{ color: '#4a5568', fontSize: 13, margin: 0 }}>أدخل كلمة المرور الجديدة</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* كلمة المرور الجديدة */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔑</span>
            <input type={showPw ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="كلمة المرور الجديدة" className="input-field"
              style={{ width: '100%', padding: '14px 44px 14px 44px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', transition: 'all 0.3s' }} />
            <button onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 0 }}>{showPw ? '🙈' : '👁️'}</button>
          </div>

          {/* تأكيد كلمة المرور */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔒</span>
            <input type={showPw ? 'text' : 'password'} value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleReset()}
              placeholder="تأكيد كلمة المرور" className="input-field"
              style={{ width: '100%', padding: '14px 44px 14px 14px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', transition: 'all 0.3s' }} />
          </div>

          {/* مؤشر قوة كلمة المرور */}
          {password && (
            <div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, transition: 'all 0.3s', background: password.length >= i * 2 ? (password.length >= 8 ? '#43e97b' : password.length >= 6 ? '#f9d423' : '#fc8181') : 'rgba(255,255,255,0.1)' }} />
                ))}
              </div>
              <p style={{ fontSize: 11, color: password.length >= 8 ? '#43e97b' : password.length >= 6 ? '#f9d423' : '#fc8181', margin: 0 }}>
                {password.length >= 8 ? '✅ قوية' : password.length >= 6 ? '⚠️ مقبولة' : '❌ ضعيفة'}
              </p>
            </div>
          )}

          {error && <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.3)', color: '#fc8181', fontSize: 13, textAlign: 'center' }}>⚠️ {error}</div>}

          <button onClick={handleReset} disabled={loading} className="btn-main"
            style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#f9d423,#ff4e50)', color: loading ? '#4a5568' : '#1a1a2e', fontWeight: 900, fontSize: 15, fontFamily: 'inherit', transition: 'all 0.3s' }}>
            {loading ? '⏳ جارٍ الحفظ...' : 'حفظ كلمة المرور الجديدة ✅'}
          </button>
        </div>
      </div>
    </div>
  )
}