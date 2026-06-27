'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const T = {
  bg: '#F5F0E8',
  cardBg: '#FDFAF5',
  textCol: '#1A1221',
  subCol: '#6B5050',
  borderCol: 'rgba(192,57,43,0.15)',
  borderFocus: 'rgba(192,57,43,0.45)',
  inputBg: 'rgba(192,57,43,0.05)',
  headerBg: 'rgba(245,240,232,0.97)',
  shadow: '0 2px 12px rgba(192,57,43,0.08)',
  gradMain: 'linear-gradient(135deg,#C0392B,#E07020)',
  gradBlue: 'linear-gradient(135deg,#2563EB,#1D4ED8)',
  shadowBlue: '0 8px 28px rgba(37,99,235,0.40)',
}

// ── المرحلة والصف — يختارهما الطالب مباشرة عند التسجيل ─────────
// (فقط حين لا توجد باقة/مادة محدَّدة مسبقاً من صفحة الهبوط)
const STAGE_GRADES: Record<string, string[]> = {
  'ابتدائي': ['1', '2', '3', '4', '5'],
  'متوسط':   ['6', '7', '8', '9'],
  'ثانوي':   ['10', '11', '12'],
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

  // خاصة بالطالب فقط — مرحلة وصف واحد، لا أدوار ولا roleId هنا
  // (تُستخدَم فقط في حال عدم وجود باقة/مادة محدَّدة من الهبوط)
  const [stage, setStage] = useState('')
  const [grade, setGrade] = useState('')

  // ── جديد: الباقة أو المادة المختارة من صفحة الهبوط ──────────
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

  // ── جلب تفاصيل الباقة/المادة المختارة لعرضها كتأكيد ─────────
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
            ? (data?.items ?? data?.packages ?? [])
            : (data?.subjects ?? [])
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
    setGrade('') // إعادة ضبط الصف عند تغيير المرحلة
  }

  function validate(): string | null {
    if (!name.trim()) return 'يرجى إدخال الاسم الكامل'
    if (!email.trim()) return 'يرجى إدخال البريد الإلكتروني'
    if (!password) return 'يرجى إدخال كلمة المرور'
    if (password.length < 8) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
    if (password !== confirmPassword) return 'كلمتا المرور غير متطابقتين'

    if (registerType === 'student') {
      // المرحلة/الصف اليدويان مطلوبان فقط حين لا توجد باقة/مادة
      // محدَّدة مسبقاً تُستنتج منها هاتان القيمتان تلقائياً.
      if (!hasPreselectedPlan || !selectedPlan) {
        if (!stage) return 'يرجى اختيار المرحلة الدراسية'
        if (!grade) return 'يرجى اختيار الصف'
      }
    }

    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      // ══ الحمولة المُرسلة — بدون roleId / roleKey / assigned_role_key ══
      // userType فقط: 'teacher' (موظف) أو 'student' (طالب).
      // تخصيص الدور الدقيق (معلم/مشرف/مدير/مدخل بيانات) يتم لاحقاً
      // من لوحة المدير عبر assigned_role_id — لا علاقة لهذا الفورم به.
      //
      // جديد — planType/planId: إن وُجد اختيار باقة/مادة من صفحة
      // الهبوط، تُرسَل المعرّفات ليكتب /api/register الاشتراك مباشرة
      // عند إنشاء الحساب، ويُستنتج allowedStages/allowedGrades من
      // الباقة/المادة نفسها بدل الحقول اليدوية.
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

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    padding: '13px 44px 13px 16px',
    borderRadius: 12,
    border: `1.5px solid ${focusField === field ? T.borderFocus : T.borderCol}`,
    background: T.inputBg,
    color: T.textCol,
    fontSize: 14,
    fontFamily: 'inherit',
    boxShadow: focusField === field ? '0 0 0 3px rgba(192,57,43,0.08)' : 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none',
  })

  // ══ شاشة النجاح ══
  if (success) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: T.bg,
          fontFamily: 'Calibri, Segoe UI, Tahoma, Arial, sans-serif',
          padding: 20,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 460,
            background: T.cardBg,
            borderRadius: 22,
            border: `1px solid ${T.borderCol}`,
            boxShadow: T.shadow,
            padding: '40px 32px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: T.textCol, marginBottom: 10 }}>
            تم إنشاء حسابك بنجاح
          </h1>
          <p style={{ fontSize: 14, color: T.subCol, lineHeight: 1.9, marginBottom: 28 }}>
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
              background: T.gradBlue,
              color: '#fff',
              fontWeight: 900,
              fontSize: 15,
              textDecoration: 'none',
              boxShadow: T.shadowBlue,
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
        background: T.bg,
        color: T.textCol,
        fontFamily: 'Calibri, Segoe UI, Tahoma, Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes glow {
          0%, 100% { box-shadow: ${T.shadowBlue}; }
          50% { box-shadow: 0 12px 38px rgba(37,99,235,0.62); }
        }
        select option {
          background: #F5F0E8 !important;
          color: #1A1221 !important;
        }
        select { color-scheme: light; }
        input:focus, select:focus { outline: none; }
      `}</style>

      {/* ══ شريط علوي مبسّط ══ */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: T.headerBg,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${T.borderCol}`,
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: T.shadow,
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
              background: T.gradMain,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 900,
              color: '#fff',
            }}
          >
            م
          </div>
          <span style={{ fontSize: 15, fontWeight: 900, color: T.textCol }}>مِداد</span>
        </Link>

        <Link
          href="/login"
          style={{
            padding: '8px 16px',
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 700,
            border: `1.5px solid ${T.borderCol}`,
            color: T.subCol,
            textDecoration: 'none',
          }}
        >
          لدي حساب؟ تسجيل الدخول
        </Link>
      </header>

      {/* ══ النموذج ══ */}
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
            background: T.cardBg,
            borderRadius: 22,
            border: `1px solid ${T.borderCol}`,
            boxShadow: T.shadow,
            padding: '32px 28px',
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 900, color: T.textCol, marginBottom: 6, textAlign: 'center' }}>
            إنشاء حساب جديد ✨
          </h1>
          <p style={{ fontSize: 14, color: T.subCol, textAlign: 'center', marginBottom: 24 }}>
            انضم إلى منصة مِداد
          </p>

          {/* ── جديد: شريط تأكيد الباقة/المادة المختارة من الهبوط ── */}
          {hasPreselectedPlan && registerType === 'student' && (
            <div
              style={{
                marginBottom: 20,
                padding: '14px 16px',
                borderRadius: 14,
                background: planError ? 'rgba(192,57,43,0.06)' : 'rgba(37,99,235,0.07)',
                border: `1.5px solid ${planError ? 'rgba(192,57,43,0.25)' : 'rgba(37,99,235,0.25)'}`,
              }}
            >
              {planLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: T.subCol }}>
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
                <div style={{ fontSize: 13, color: '#C0392B', lineHeight: 1.8 }}>
                  ⚠️ {planError}
                </div>
              ) : selectedPlan ? (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', marginBottom: 4 }}>
                    {planType === 'package' ? '📦 باقتك المختارة' : '📚 مادتك المختارة'}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: T.textCol, marginBottom: 6 }}>
                    {selectedPlan.name}
                  </div>
                  <Link
                    href="/landing#plans"
                    style={{ fontSize: 12, color: T.subCol, textDecoration: 'underline' }}
                  >
                    تغيير الاختيار
                  </Link>
                </div>
              ) : null}
            </div>
          )}

          {/* ── نوع الحساب ── */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: T.subCol, display: 'block', marginBottom: 8 }}>
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
                    border: `2px solid ${registerType === opt.id ? '#C0392B' : T.borderCol}`,
                    background: registerType === opt.id ? 'rgba(192,57,43,0.08)' : 'transparent',
                    color: registerType === opt.id ? '#C0392B' : T.subCol,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
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
              <p style={{ fontSize: 12, color: T.subCol, marginTop: 8, lineHeight: 1.7 }}>
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
                background: 'rgba(192,57,43,0.08)',
                border: '1.5px solid rgba(192,57,43,0.28)',
                color: '#C0392B',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* الاسم */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: T.subCol, display: 'block', marginBottom: 6 }}>
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

            {/* البريد */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: T.subCol, display: 'block', marginBottom: 6 }}>
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

            {/* كلمة المرور */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: T.subCol, display: 'block', marginBottom: 6 }}>
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
                  style={{
                    position: 'absolute',
                    left: 13,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 15,
                    color: T.subCol,
                    padding: 0,
                  }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* تأكيد كلمة المرور */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: T.subCol, display: 'block', marginBottom: 6 }}>
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

            {/* المرحلة والصف — للطالب فقط، اختيار مباشر بدون أدوار
                يُعرَض فقط حين لا توجد باقة/مادة محدَّدة مسبقاً من الهبوط،
                لأن المرحلة/الصف تُستنتج تلقائياً من الاختيار في هذه الحالة. */}
            {registerType === 'student' && !(hasPreselectedPlan && selectedPlan) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: T.subCol, display: 'block', marginBottom: 6 }}>
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
                  <label style={{ fontSize: 13, fontWeight: 700, color: T.subCol, display: 'block', marginBottom: 6 }}>
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

            {/* زر الإنشاء — أزرق وهاج */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: 13,
                border: 'none',
                marginTop: 6,
                background: loading ? 'rgba(107,80,80,0.12)' : T.gradBlue,
                color: loading ? 'rgba(107,80,80,0.5)' : '#fff',
                fontSize: 15,
                fontWeight: 900,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
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

          <p style={{ textAlign: 'center', fontSize: 12, color: T.subCol, marginTop: 20 }}>
            بإنشائك الحساب، أنت توافق على{' '}
            <Link href="/landing" style={{ color: '#C0392B', textDecoration: 'none', fontWeight: 700 }}>
              شروط استخدام مِداد
            </Link>
          </p>
        </form>
      </main>
    </div>
  )
}

// ══ غلاف Suspense إلزامي لأن RegisterForm يستخدم useSearchParams() ══
// (متطلب Next.js App Router لأي مكوّن client يقرأ من searchParams)
function RegisterFormFallback() {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: T.bg,
        fontFamily: 'Calibri, Segoe UI, Tahoma, Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: `4px solid ${T.borderFocus}`,
          borderTopColor: '#C0392B',
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
