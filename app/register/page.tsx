'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STAGES = [
  { id: 'primary', label: 'ابتدائي', icon: '🌱', grades: ['الأول','الثاني','الثالث','الرابع','الخامس'] },
  { id: 'middle',  label: 'متوسط',   icon: '📚', grades: ['السادس','السابع','الثامن','التاسع'] },
  { id: 'high',    label: 'ثانوي',   icon: '🎓', grades: ['العاشر','الحادي عشر','الثاني عشر'] },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep]               = useState(1) // 1: بيانات, 2: مرحلة/صف
  const [name, setName]               = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [userType, setUserType]       = useState('teacher')
  const [selectedStages, setSelectedStages] = useState<string[]>([])
  const [selectedGrade, setSelectedGrade]   = useState<string | null>(null)
  const [selectedStageForGrade, setSelectedStageForGrade] = useState<string | null>(null)
  const [showPw, setShowPw]           = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState(false)

  function toggleStage(stageId: string) {
    setSelectedStages(prev =>
      prev.includes(stageId) ? prev.filter(s => s !== stageId) : [...prev, stageId]
    )
  }

  function handleNext() {
    if (!name || !email || !password) return setError('أدخل جميع البيانات')
    if (password.length < 6) return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
    setError('')
    setStep(2)
  }

  async function handleRegister() {
    if (userType === 'teacher' && selectedStages.length === 0)
      return setError('اختر مرحلة دراسية واحدة على الأقل')
    if (userType === 'student' && (!selectedStageForGrade || !selectedGrade))
      return setError('اختر المرحلة والصف')

    setLoading(true); setError('')
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, password, userType,
          allowedStages: userType === 'teacher' ? selectedStages : [selectedStageForGrade],
          allowedGrades: userType === 'student' ? [selectedGrade] : [],
        }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'حدث خطأ')
      setSuccess(true)
    } catch { setError('حدث خطأ. حاول مرة أخرى.') }
    setLoading(false)
  }

  if (success) return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)' }}>
      <div className="w-full max-w-sm rounded-2xl p-8 text-center border border-white/10"
        style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-xl font-black text-green-400 mb-3">تم استلام طلبك!</h2>
        <p className="text-gray-400 text-sm leading-loose mb-2">
          طلب تسجيلك قيد المراجعة من قبل المدير.
        </p>
        <p className="text-gray-400 text-sm leading-loose mb-6">
          ستصلك رسالة على بريدك<br/>
          <span className="text-yellow-400 font-bold">{email}</span><br/>
          بعد الموافقة على طلبك.
        </p>
        <button onClick={() => router.push('/')}
          className="w-full py-3 rounded-xl font-black text-base"
          style={{ background: 'linear-gradient(135deg,#f9d423,#ff4e50)', color: '#1a1a2e' }}>
          العودة لتسجيل الدخول
        </button>
      </div>
    </div>
  )

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)' }}>
      <div className="w-full max-w-sm rounded-2xl p-8 border border-white/10"
        style={{ background: 'rgba(255,255,255,0.05)' }}>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">{step === 1 ? '📝' : userType === 'teacher' ? '👨‍🏫' : '👨‍🎓'}</div>
          <h1 className="text-xl font-black mb-1"
            style={{ background: 'linear-gradient(90deg,#f9d423,#ff4e50)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {step === 1 ? 'إنشاء حساب جديد' : userType === 'teacher' ? 'اختر مراحلك الدراسية' : 'اختر مرحلتك وصفك'}
          </h1>
          {/* Progress */}
          <div className="flex gap-2 justify-center mt-3">
            {[1,2].map(s => (
              <div key={s} className="h-1.5 w-16 rounded-full transition-all"
                style={{ background: step >= s ? '#f9d423' : 'rgba(255,255,255,0.1)' }} />
            ))}
          </div>
        </div>

        {/* Step 1: بيانات الحساب */}
        {step === 1 && (
          <div className="space-y-4">
            {/* نوع الحساب */}
            <div>
              <p className="text-xs text-gray-500 font-bold mb-2">نوع الحساب</p>
              <div className="flex gap-2">
                {[['teacher','👨‍🏫 معلم'],['student','👨‍🎓 طالب']].map(([type, label]) => (
                  <button key={type} onClick={() => setUserType(type)}
                    className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
                    style={{
                      background: userType === type ? 'linear-gradient(135deg,#f9d423,#ff4e50)' : 'rgba(255,255,255,0.07)',
                      color: userType === type ? '#1a1a2e' : '#718096',
                    }}>{label}</button>
                ))}
              </div>
            </div>

            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="الاسم الكامل"
              className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none border border-white/10"
              style={{ background: 'rgba(255,255,255,0.07)' }} />

            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none border border-white/10"
              style={{ background: 'rgba(255,255,255,0.07)' }} />

            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNext()}
                placeholder="كلمة المرور (6 أحرف على الأقل)"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none border border-white/10"
                style={{ background: 'rgba(255,255,255,0.07)' }} />
              <button onClick={() => setShowPw(p => !p)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>

            {error && <p className="text-red-400 text-xs text-center py-2 rounded-xl"
              style={{ background: 'rgba(252,129,129,0.08)' }}>⚠️ {error}</p>}

            <button onClick={handleNext}
              className="w-full py-3 rounded-xl font-black text-base transition-all"
              style={{ background: 'linear-gradient(135deg,#f9d423,#ff4e50)', color: '#1a1a2e' }}>
              التالي ←
            </button>

            <button onClick={() => router.push('/')}
              className="w-full py-3 rounded-xl font-bold text-sm text-gray-500 border border-white/10"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              لدي حساب — تسجيل الدخول
            </button>
          </div>
        )}

        {/* Step 2: للمعلم — اختيار المراحل */}
        {step === 2 && userType === 'teacher' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 text-center mb-2">
              يمكنك اختيار أكثر من مرحلة
            </p>
            <div className="space-y-3">
              {STAGES.map(s => {
                const active = selectedStages.includes(s.id)
                return (
                  <button key={s.id} onClick={() => toggleStage(s.id)}
                    className="w-full p-4 rounded-xl font-bold text-sm transition-all text-right flex items-center gap-3"
                    style={{
                      background: active ? 'rgba(249,212,35,0.12)' : 'rgba(255,255,255,0.05)',
                      border: active ? '2px solid #f9d423' : '2px solid rgba(255,255,255,0.1)',
                      color: active ? '#f9d423' : '#718096',
                    }}>
                    <span className="text-2xl">{s.icon}</span>
                    <div>
                      <p className="font-black">{s.label}</p>
                      <p className="text-xs opacity-60 font-normal">
                        {s.grades[0]} — {s.grades[s.grades.length-1]}
                      </p>
                    </div>
                    {active && <span className="mr-auto text-yellow-400">✓</span>}
                  </button>
                )
              })}
            </div>

            {error && <p className="text-red-400 text-xs text-center py-2 rounded-xl"
              style={{ background: 'rgba(252,129,129,0.08)' }}>⚠️ {error}</p>}

            <button onClick={handleRegister} disabled={loading}
              className="w-full py-3 rounded-xl font-black text-base transition-all"
              style={{
                background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#43e97b,#38f9d7)',
                color: loading ? '#4a5568' : '#1a1a2e',
              }}>
              {loading ? '⏳ جارٍ التسجيل...' : '✅ إرسال طلب التسجيل'}
            </button>

            <button onClick={() => setStep(1)}
              className="w-full py-2 rounded-xl font-bold text-sm text-gray-500">
              ← رجوع
            </button>
          </div>
        )}

        {/* Step 2: للطالب — اختيار المرحلة والصف */}
        {step === 2 && userType === 'student' && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 font-bold mb-2">المرحلة الدراسية</p>
              <div className="flex gap-2">
                {STAGES.map(s => (
                  <button key={s.id}
                    onClick={() => { setSelectedStageForGrade(s.id); setSelectedGrade(null) }}
                    className="flex-1 py-3 rounded-xl font-bold text-xs transition-all"
                    style={{
                      background: selectedStageForGrade === s.id ? 'linear-gradient(135deg,#4facfe,#00f2fe)' : 'rgba(255,255,255,0.07)',
                      color: selectedStageForGrade === s.id ? '#1a1a2e' : '#718096',
                    }}>
                    <div className="text-lg mb-1">{s.icon}</div>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedStageForGrade && (
              <div>
                <p className="text-xs text-gray-500 font-bold mb-2">الصف الدراسي</p>
                <div className="flex flex-wrap gap-2">
                  {STAGES.find(s => s.id === selectedStageForGrade)?.grades.map(g => (
                    <button key={g} onClick={() => setSelectedGrade(g)}
                      className="px-3 py-2 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: selectedGrade === g ? 'linear-gradient(135deg,#4facfe,#00f2fe)' : 'rgba(255,255,255,0.07)',
                        color: selectedGrade === g ? '#1a1a2e' : '#a0aec0',
                        border: selectedGrade === g ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      }}>الصف {g}</button>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-red-400 text-xs text-center py-2 rounded-xl"
              style={{ background: 'rgba(252,129,129,0.08)' }}>⚠️ {error}</p>}

            <button onClick={handleRegister} disabled={loading}
              className="w-full py-3 rounded-xl font-black text-base transition-all"
              style={{
                background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#43e97b,#38f9d7)',
                color: loading ? '#4a5568' : '#1a1a2e',
              }}>
              {loading ? '⏳ جارٍ التسجيل...' : '✅ إرسال طلب التسجيل'}
            </button>

            <button onClick={() => setStep(1)}
              className="w-full py-2 rounded-xl font-bold text-sm text-gray-500">
              ← رجوع
            </button>
          </div>
        )}
      </div>
    </div>
  )
}