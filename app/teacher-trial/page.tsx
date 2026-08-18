'use client'

import Link from 'next/link'
import { useState, type CSSProperties, type FormEvent } from 'react'
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

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function TeacherTrialPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [trialEndsAt, setTrialEndsAt] = useState('')

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '13px 44px 13px 16px',
    borderRadius: 12,
    border: `1.5px solid ${B.border}`,
    background: B.inputBg,
    color: B.text,
    fontSize: 14,
    fontFamily: BODY,
    outline: 'none',
  }

  function validate() {
    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()
    const cleanUsername = username.trim().toLowerCase()

    if (cleanName.length < 3) {
      return 'يرجى إدخال الاسم الكامل، على ألا يقل عن 3 أحرف'
    }

    if (!EMAIL_RE.test(cleanEmail)) {
      return 'يرجى إدخال بريد إلكتروني صحيح'
    }

    if (!USERNAME_RE.test(cleanUsername)) {
      return 'اسم المستخدم من 3 إلى 30 حرفًا إنجليزيًا أو رقمًا أو شرطة سفلية فقط'
    }

    if (password.length < 8) {
      return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
    }

    if (password !== confirmPassword) {
      return 'كلمتا المرور غير متطابقتين'
    }

    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const validationError = validate()

    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/teacher-trial/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          username: username.trim().toLowerCase(),
          password,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setError(data?.error || 'تعذر إنشاء حساب التجربة حاليًا')
        return
      }

      setTrialEndsAt(data?.trial?.endsAt || '')
      setSuccess(true)
    } catch {
      setError('تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    const formattedEndDate = trialEndsAt
      ? new Intl.DateTimeFormat('ar-KW', {
          dateStyle: 'long',
          timeZone: 'Asia/Kuwait',
        }).format(new Date(trialEndsAt))
      : 'بعد 7 أيام'

    return (
      <main
        dir="rtl"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          background: B.bg,
          fontFamily: BODY,
        }}
      >
        <section
          style={{
            width: '100%',
            maxWidth: 520,
            padding: '40px 32px',
            textAlign: 'center',
            background: B.cardBg,
            border: `1px solid ${B.border}`,
            borderRadius: 22,
            boxShadow: B.shadow,
          }}
        >
          <div style={{ fontSize: 54, marginBottom: 14 }}>🎉</div>

          <h1
            style={{
              margin: '0 0 10px',
              color: B.text,
              fontFamily: HEADING,
              fontSize: 23,
              fontWeight: 900,
            }}
          >
            تم إنشاء حساب التجربة
          </h1>

          <p
            style={{
              margin: '0 0 20px',
              color: B.sub,
              fontFamily: BODY,
              fontSize: 14,
              lineHeight: 1.9,
            }}
          >
            يمكنك الآن تسجيل الدخول إلى حساب المعلم المستقل وبدء تجربة مِداد.
          </p>

          <div
            style={{
              marginBottom: 24,
              padding: '15px 16px',
              textAlign: 'right',
              border: '1.5px solid rgba(37,99,235,0.22)',
              borderRadius: 14,
              background: 'rgba(37,99,235,0.06)',
            }}
          >
            <div
              style={{
                marginBottom: 6,
                color: '#2563EB',
                fontFamily: BODY,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              تفاصيل التجربة المجانية
            </div>

            <div
              style={{
                color: B.sub,
                fontFamily: BODY,
                fontSize: 13,
                lineHeight: 2,
              }}
            >
              7 أيام مجانية، مادة واحدة، 3 عمليات توليد، وخطة درس أو اختبار قصير أو نشاط صفي.
            </div>

            <div
              style={{
                marginTop: 6,
                color: B.text,
                fontFamily: BODY,
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              تنتهي التجربة في: {formattedEndDate}
            </div>
          </div>

          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 14,
              color: '#fff',
              background: B.gradBlue,
              borderRadius: 12,
              boxShadow: B.shadowBlue,
              fontFamily: BODY,
              fontSize: 15,
              fontWeight: 900,
              textDecoration: 'none',
            }}
          >
            تسجيل الدخول إلى حساب المعلم
          </Link>
        </section>
      </main>
    )
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        color: B.text,
        background: B.bg,
        fontFamily: BODY,
      }}
    >
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: B.headerBg,
          borderBottom: `1px solid ${B.border}`,
          boxShadow: B.shadow,
          backdropFilter: 'blur(20px)',
        }}
      >
        <Link
          href="/landing"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: B.text,
            fontFamily: HEADING,
            fontSize: 15,
            fontWeight: 900,
            textDecoration: 'none',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              background: B.gradMain,
              borderRadius: 10,
            }}
          >
            م
          </span>
          مِداد
        </Link>

        <Link
          href="/login"
          style={{
            padding: '8px 16px',
            color: B.sub,
            border: `1.5px solid ${B.border}`,
            borderRadius: 9,
            fontFamily: BODY,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          تسجيل الدخول
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
            maxWidth: 560,
            padding: '32px 28px',
            background: B.cardBg,
            border: `1px solid ${B.border}`,
            borderRadius: 22,
            boxShadow: B.shadow,
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>✨</div>
            <h1
              style={{
                margin: '0 0 7px',
                color: B.text,
                fontFamily: HEADING,
                fontSize: 23,
                fontWeight: 900,
              }}
            >
              تجربة المعلم المجانية
            </h1>
            <p
              style={{
                margin: 0,
                color: B.sub,
                fontFamily: BODY,
                fontSize: 14,
                lineHeight: 1.8,
              }}
            >
              أنشئ حسابك المستقل وجرّب أدوات مِداد لمدة 7 أيام.
            </p>
          </div>

          <div
            style={{
              marginBottom: 22,
              padding: '14px 16px',
              background: 'rgba(37,99,235,0.06)',
              border: '1.5px solid rgba(37,99,235,0.20)',
              borderRadius: 14,
            }}
          >
            <div
              style={{
                marginBottom: 7,
                color: '#2563EB',
                fontFamily: BODY,
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              ما الذي تتضمنه التجربة؟
            </div>
            <div
              style={{
                color: B.sub,
                fontFamily: BODY,
                fontSize: 13,
                lineHeight: 1.9,
              }}
            >
              مادة تعليمية واحدة، 3 عمليات توليد، وخطة درس أو اختبار قصير أو نشاط صفي.
            </div>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                marginBottom: 16,
                padding: '11px 14px',
                color: B.crimson,
                background: 'rgba(150,30,45,0.08)',
                border: '1.5px solid rgba(150,30,45,0.28)',
                borderRadius: 10,
                fontFamily: BODY,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gap: 14 }}>
            <label
              style={{
                display: 'block',
                color: B.sub,
                fontFamily: BODY,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              الاسم الكامل
              <input
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="اكتب اسمك الكامل"
                autoComplete="name"
                style={{ ...inputStyle, marginTop: 6 }}
              />
            </label>

            <label
              style={{
                display: 'block',
                color: B.sub,
                fontFamily: BODY,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              البريد الإلكتروني
              <input
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="example@email.com"
                autoComplete="email"
                dir="ltr"
                style={{ ...inputStyle, marginTop: 6, textAlign: 'right' }}
              />
            </label>

            <label
              style={{
                display: 'block',
                color: B.sub,
                fontFamily: BODY,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              اسم المستخدم
              <input
                value={username}
                onChange={event =>
                  setUsername(
                    event.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_]/g, '')
                  )
                }
                placeholder="مثال: teacher_ahmad"
                autoComplete="username"
                dir="ltr"
                style={{ ...inputStyle, marginTop: 6, textAlign: 'right' }}
              />
              <span
                style={{
                  display: 'block',
                  marginTop: 5,
                  color: B.sub,
                  fontFamily: BODY,
                  fontSize: 11,
                  fontWeight: 400,
                }}
              >
                من 3 إلى 30 حرفًا إنجليزيًا أو رقمًا أو شرطة سفلية.
              </span>
            </label>

            <label
              style={{
                display: 'block',
                color: B.sub,
                fontFamily: BODY,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              كلمة المرور
              <div style={{ position: 'relative', marginTop: 6 }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="8 أحرف على الأقل"
                  autoComplete="new-password"
                  style={{ ...inputStyle, paddingLeft: 46 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(value => !value)}
                  style={{
                    position: 'absolute',
                    left: 13,
                    top: '50%',
                    padding: 0,
                    color: B.sub,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: BODY,
                    fontSize: 12,
                    transform: 'translateY(-50%)',
                  }}
                >
                  {showPassword ? 'إخفاء' : 'إظهار'}
                </button>
              </div>
            </label>

            <label
              style={{
                display: 'block',
                color: B.sub,
                fontFamily: BODY,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              تأكيد كلمة المرور
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                placeholder="أعد كتابة كلمة المرور"
                autoComplete="new-password"
                style={{ ...inputStyle, marginTop: 6 }}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              marginTop: 24,
              padding: '15px 18px',
              color: loading ? 'rgba(107,80,80,0.55)' : '#fff',
              background: loading ? 'rgba(107,80,80,0.12)' : B.gradBlue,
              border: 'none',
              borderRadius: 13,
              boxShadow: loading ? 'none' : B.shadowBlue,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: BODY,
              fontSize: 15,
              fontWeight: 900,
            }}
          >
            {loading ? 'جارٍ إنشاء حساب التجربة...' : 'ابدأ تجربتك المجانية'}
          </button>

          <p
            style={{
              margin: '18px 0 0',
              color: B.sub,
              fontFamily: BODY,
              fontSize: 12,
              lineHeight: 1.8,
              textAlign: 'center',
            }}
          >
            لديك حساب بالفعل؟{' '}
            <Link
              href="/login"
              style={{
                color: B.crimson,
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              سجّل الدخول
            </Link>
          </p>
        </form>
      </main>
    </div>
  )
}