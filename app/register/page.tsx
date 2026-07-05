'use client'

import { Suspense, useEffect, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BRAND } from '@/lib/constants/theme'

const B = {
  bg: BRAND.bg,
  cardBg: BRAND.bgCard,
  text: BRAND.text,
  sub: BRAND.sub,
  border: BRAND.border,
  borderFocus: BRAND.borderStrong,
  inputBg: 'rgba(150,30,45,0.04)',
  headerBg: 'rgba(247,242,234,0.97)',
  shadow: BRAND.shadow,
  gradMain: BRAND.gradMain,
  gradBlue: BRAND.gradBlue,
  shadowBlue: BRAND.shadowBlue,
  crimson: BRAND.crimson,
}

const HEADING = BRAND.fontHeading
const BODY = BRAND.fontBody

const STAGE_GRADES: Record<string, string[]> = {
  'ابتدائي': ['1', '2', '3', '4', '5'],
  'متوسط': ['6', '7', '8', '9'],
  'ثانوي': ['10', '11', '12'],
}

type RegisterType = 'staff' | 'student'
type PlanType = 'package' | 'subject'

interface SelectedPlan {
  id: string
  name: string
  stage?: string | null
  grade?: string | null
  track?: string | null
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [registerType, setRegisterType] = useState<RegisterType>('student')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  const [stage, setStage] = useState('')
  const [grade, setGrade] = useState('')

  const planType = searchParams.get('type') as PlanType | null
  const planId = searchParams.get('id')
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null)
  const [planLoading, setPlanLoading] = useState(Boolean(planType && planId))
  const [planError, setPlanError] = useState('')

  const hasPreselectedPlan = Boolean(planType && planId)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [focusField, setFocusField] = useState('')

  useEffect(() => {
    if (!planType || !planId) {
      setPlanLoading(false)
      return
    }

    let mounted = true
    setPlanLoading(true)
    setPlanError('')

    const endpoint =
      planType === 'package' ? '/api/subject-packages' : '/api/subjects'

    fetch(endpoint)
      .then(r => r.json())
      .then(data => {
        if (!mounted) return
        const list =
          planType === 'package'
            ? data?.items ?? data?.packages ?? []
            : data?.subjects ?? []
        const found = list.find((item: any) => item.id === planId)
        if (found) {
          setSelectedPlan({
            id: found.id,
            name: found.name,
            stage: found.stage ?? null,
            grade: found.grade ?? null,
            track: found.track ?? null,
          })
        } else {
          setPlanError('تعذّر العثور على هذا الاختيار — قد يكون قد أُزيل. يمكنك التسجيل واختيار المرحلة يدوياً، أو العودة لصفحة الهبوط لاختيار آخر.')
        }
      })
      .catch(() => {
        if (mounted) {
          setPlanError('تعذّر تحميل تفاصيل الاختيار. يمكنك التسجيل واختيار المرحلة يدوياً.')
        }
      })
      .finally(() => {
        if (mounted) setPlanLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [planType, planId])

  function handleStageChange(value: string) {
    setStage(value)
    setGrade('')
  }

  function validate(): string | null {
    if (!name.trim()) return 'يرجى إدخال الاسم الكامل'
    if (!email.trim()) return 'يرجى إدخال البريد الإلكتروني'
    if (!password) return 'يرجى إدخال كلمة المرور'
    if (password.length < 8) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
    if (password !== confirmPassword) return 'كلمتا المرور غير متطابقتين'

    if (registerType === 'student') {
      if (!hasPreselectedPlan || !selectedPlan) {
        if (!stage) return 'يرجى اختيار المرحلة الدراسية'
        if (!grade) return 'يرجى اختيار الصف'
      }
    }

    return null
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const usePreselected = hasPreselectedPlan && Boolean(selectedPlan)

      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        userType: registerType === 'student' ? 'student' : 'teacher',
        allowedStages:
          registerType === 'student'
            ? usePreselected
              ? selectedPlan?.stage ? [selectedPlan.stage] : []
              : stage ? [stage] : []
            : [],
        allowedGrades:
          registerType === 'student'
            ? usePreselected
              ? selectedPlan?.grade ? [selectedPlan.grade] : []
              : grade ? [grade] : []
            : [],
        ...(registerType === 'student' && usePreselected
          ? { planType, planId }
          : {}),
      }

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'حدث خطأ أثناء إنشاء الحساب')
        return
      }

      setSuccess(true)
    } catch {
      setError('تعذّر الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (field: string): CSSProperties => ({
    width: '100%',
    padding: '13px 44px 13px 16px',
    borderRadius: 12,
    border: `1.5px solid ${focusField === field ? B.borderFocus : B.border}`,
    background: B.inputBg,
    color: B.text,
    fontSize: 14,
    fontFamily: BODY,
    boxShadow: focusField === field ? '0 0 0 3px rgba(150,30,45,0.08)' : 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none',
  })

  if (success) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: B.bg,
          fontFamily: BODY,
          padding: 20,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 460,
            background: B.cardBg,
            borderRadius: 22,
            border: `1px solid ${B.border}`,
            boxShadow: B.shadow,
            padding: '40px 32px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: B.text, marginBottom: 10, fontFamily: HEADING }}>
            تم إنشاء حسابك بنجاح
          </h1>
          <p style={{ fontSize: 14, color: B.sub, lineHeight: 1.9, marginBottom: 28, fontFamily: BODY }}>
            {registerType === 'student'
              ? hasPreselectedPlan && selectedPlan
                ? `تم حفظ اختيارك (${selectedPlan.name}) مع حسابك. بانتظار موافقة المدير على حسابك. سيصلك إشعار عند التفعيل.`
                : 'بانتظار موافقة المدير على حسابك. سيصلك إشعار عند التفعيل.'
              : 'بانتظار موافقة المدير وتعيين دورك (معلم / مشرف / مدخل بيانات). سيصلك إشعار عند التفعيل.'}
          </p>
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              background: B.gradBlue,
              color: '#fff',
              fontWeight: 900,
              fontSize: 15,
              fontFamily: BODY,
              textDecoration: 'none',
              boxShadow: B.shadowBlue,
            }}
          >
            الذهاب إلى تسجيل الدخول ←
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: B.bg,
        color: B.text,
        fontFamily: BODY,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes glow {
          0%, 100% { box-shadow: ${B.shadowBlue}; }
          50% { box-shadow: 0 12px 38px rgba(37,99,235,0.62); }
        }
        select option {
          background: ${B.bg} !important;
          color: ${B.text} !important;
        }
        select { color-scheme: light; }
        input:focus, select:focus { outline: none; }
      `}</style>

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: B.headerBg,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${B.border}`,
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: B.shadow,
        }}
      >
        <Link
          href="/landing"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: B.gradMain,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 900,
              color: '#fff',
              fontFamily: HEADING,
            }}
          >
            م
          </div>
          <span style={{ fontSize: 15, fontWeight: 900, color: B.text, fontFamily: HEADING }}>مِداد</span>
        </Link>

        <Link
          href="/login"
          style={{
            padding: '8px 16px',
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: BODY,
            border: `1.5px solid ${B.border}`,
            color: B.sub,
            textDecoration: 'none',
          }}
        >
          لدي حساب؟ تسجيل الدخول
        </Link>
      </header>

      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            width: '100%',
            maxWidth: 480,
            background: B.cardBg,
            borderRadius: 22,
            border: `1px solid ${B.border}`,
            boxShadow: B.shadow,
            padding: '32px 28px',
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 900, color: B.text, marginBottom: 6, textAlign: 'center', fontFamily: HEADING }}>
            إنشاء حساب جديد ✨
          </h1>
          <p style={{ fontSize: 14, color: B.sub, textAlign: 'center', marginBottom: 24, fontFamily: BODY }}>
            انضم إلى منصة مِداد
          </p>

          {hasPreselectedPlan && registerType === 'student' && (
            <div
              style={{
                marginBottom: 20,
                padding: '14px 16px',
                borderRadius: 14,
                background: planError ? 'rgba(150,30,45,0.06)' : 'rgba(37,99,235,0.07)',
                border: `1.5px solid ${planError ? 'rgba(150,30,45,0.25)' : 'rgba(37,99,235,0.25)'}`,
              }}
            >
              {planLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: B.sub, fontFamily: BODY }}>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: '2px solid rgba(37,99,235,0.3)',
                      borderTopColor: '#2563EB',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  جارٍ تحميل تفاصيل اختيارك...
                </div>
              ) : planError ? (
                <div style={{ fontSize: 13, color: B.crimson, lineHeight: 1.8, fontFamily: BODY }}>
                  ⚠️ {planError}
                </div>
              ) : selectedPlan ? (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', marginBottom: 4, fontFamily: BODY }}>
                    {planType === 'package' ? '📦 باقتك المختارة' : '📚 مادتك المختارة'}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: B.text, marginBottom: 6, fontFamily: HEADING }}>
                    {selectedPlan.name}
                  </div>
                  <Link
                    href="/landing#plans"
                    style={{ fontSize: 12, color: B.sub, textDecoration: 'underline', fontFamily: BODY }}
                  >
                    تغيير الاختيار
                  </Link>
                </div>
              ) : null}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: B.sub, display: 'block', marginBottom: 8, fontFamily: BODY }}>
              نوع الحساب
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {([
                { id: 'student' as RegisterType, icon: '👨‍🎓', label: 'طالب' },
                { id: 'staff' as RegisterType, icon: '👨‍🏫', label: 'موظف بالمنصة' },
              ]).map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRegisterType(opt.id)}
                  style={{
                    flex: 1,
                    padding: '14px 10px',
                    borderRadius: 12,
                    border: `2px solid ${registerType === opt.id ? B.crimson : B.border}`,
                    background: registerType === opt.id ? 'rgba(150,30,45,0.08)' : 'transparent',
                    color: registerType === opt.id ? B.crimson : B.sub,
                    cursor: 'pointer',
                    fontFamily: BODY,
                    fontWeight: 700,
                    fontSize: 13,
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{opt.icon}</div>
                  {opt.label}
                </button>
              ))}
            </div>
            {registerType === 'staff' && (
              <p style={{ fontSize: 12, color: B.sub, marginTop: 8, lineHeight: 1.7, fontFamily: BODY }}>
                سيحدد المدير دورك بدقة (معلم / مشرف / مدخل بيانات) بعد الموافقة على حسابك.
              </p>
            )}
          </div>

          {error && (
            <div
              style={{
                padding: '11px 14px',
                borderRadius: 10,
                marginBottom: 16,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: BODY,
                background: 'rgba(150,30,45,0.08)',
                border: '1.5px solid rgba(150,30,45,0.28)',
                color: B.crimson,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: B.sub, display: 'block', marginBottom: 6, fontFamily: BODY }}>
                الاسم الكامل
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>
                  👤
                </span>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onFocus={() => setFocusField('name')}
                  onBlur={() => setFocusField('')}
                  placeholder="أدخل اسمك الكامل"
                  style={inputStyle('name')}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: B.sub, display: 'block', marginBottom: 6, fontFamily: BODY }}>
                البريد الإلكتروني
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>
                  📧
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusField('email')}
                  onBlur={() => setFocusField('')}
                  placeholder="example@email.com"
                  style={{ ...inputStyle('email'), direction: 'ltr', textAlign: 'right' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: B.sub, display: 'block', marginBottom: 6, fontFamily: BODY }}>
                كلمة المرور
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>
                  🔑
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusField('password')}
                  onBlur={() => setFocusField('')}
                  placeholder="٨ أحرف على الأقل"
                  style={{ ...inputStyle('password'), paddingLeft: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  aria-label={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  style={{
                    position: 'absolute',
                    left: 13,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 15,
                    color: B.sub,
                    padding: 0,
                  }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: B.sub, display: 'block', marginBottom: 6, fontFamily: BODY }}>
                تأكيد كلمة المرور
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>
                  🔒
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusField('confirmPassword')}
                  onBlur={() => setFocusField('')}
                  placeholder="أعد كتابة كلمة المرور"
                  style={inputStyle('confirmPassword')}
                />
              </div>
            </div>

            {registerType === 'student' && !(hasPreselectedPlan && selectedPlan) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: B.sub, display: 'block', marginBottom: 6, fontFamily: BODY }}>
                    المرحلة
                  </label>
                  <select
                    value={stage}
                    onChange={e => handleStageChange(e.target.value)}
                    style={{ ...inputStyle('stage'), cursor: 'pointer' }}
                  >
                    <option value="">اختر المرحلة</option>
                    {Object.keys(STAGE_GRADES).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: B.sub, display: 'block', marginBottom: 6, fontFamily: BODY }}>
                    الصف
                  </label>
                  <select
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    disabled={!stage}
                    style={{
                      ...inputStyle('grade'),
                      cursor: stage ? 'pointer' : 'not-allowed',
                      opacity: stage ? 1 : 0.5,
                    }}
                  >
                    <option value="">{stage ? 'اختر الصف' : 'اختر المرحلة أولاً'}</option>
                    {stage && STAGE_GRADES[stage].map(g => (
                      <option key={g} value={g}>الصف {g}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: 13,
                border: 'none',
                marginTop: 6,
                background: loading ? 'rgba(107,80,80,0.12)' : B.gradBlue,
                color: loading ? 'rgba(107,80,80,0.5)' : '#fff',
                fontSize: 15,
                fontWeight: 900,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: BODY,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                animation: loading ? 'none' : 'glow 3s ease-in-out infinite',
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: '2.5px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  جارٍ إنشاء الحساب...
                </>
              ) : (
                '✨ إنشاء الحساب'
              )}
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: B.sub, marginTop: 20, fontFamily: BODY }}>
            بإنشائك الحساب، أنت توافق على{' '}
            <Link href="/landing" style={{ color: B.crimson, textDecoration: 'none', fontWeight: 700, fontFamily: BODY }}>
              شروط استخدام مِداد
            </Link>
          </p>
        </form>
      </main>
    </div>
  )
}

function RegisterFormFallback() {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: B.bg,
        fontFamily: BODY,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: `4px solid ${B.border}`,
          borderTopColor: B.crimson,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFormFallback />}>
      <RegisterForm />
    </Suspense>
  )
}