'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleLogin() {
    if (!email || !password) return setError('أدخل البريد الإلكتروني وكلمة المرور')
    setLoading(true)
    setError('')
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

      console.log('User data:', data.user)
      if (data.user?.role === 'admin') router.push('/admin')
      else router.push('/dashboard')

    } catch {
      setError('حدث خطأ. حاول مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)' }}>
      <div className="w-full max-w-sm rounded-2xl p-8 border border-white/10"
        style={{ background: 'rgba(255,255,255,0.05)' }}>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌙</div>
          <h1 className="text-2xl font-black mb-1"
            style={{ background: 'linear-gradient(90deg,#f9d423,#ff4e50)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            منصة مساعد اللغة العربية
          </h1>
          <p className="text-xs text-gray-500">مدعوم بالذكاء الاصطناعي</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني"
            className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none border border-white/10"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          />

          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="كلمة المرور"
              className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none border border-white/10"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            />
            <button onClick={() => setShowPw(p => !p)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center py-2 rounded-xl"
              style={{ background: 'rgba(252,129,129,0.08)' }}>
              ⚠️ {error}
            </p>
          )}

          <button onClick={handleLogin} disabled={loading}
            className="w-full py-3 rounded-xl font-black text-base transition-all"
            style={{
              background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#f9d423,#ff4e50)',
              color: loading ? '#4a5568' : '#1a1a2e',
            }}>
            {loading ? '⏳ جارٍ الدخول...' : 'دخول ←'}
          </button>

          <button onClick={() => router.push('/register')}
            className="w-full py-3 rounded-xl font-bold text-sm text-gray-400 border border-white/10"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            ليس لدي حساب — التسجيل الجديد
          </button>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          منصة مساعد اللغة العربية • الكويت
        </p>
      </div>
    </div>
  )
}