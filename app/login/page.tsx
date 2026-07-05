'use client'

import { useRouteGuard } from '@/hooks/useRouteGuard'
import { useEffect, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import PublicHeader from '@/components/PublicHeader'
import { supabase } from '@/lib/supabase'
import { BRAND } from '@/lib/constants/theme'
import { resolveUserHome } from '@/lib/auth/auth.routes'

const B = {
  deep: BRAND.deep,
  crimson: BRAND.crimson,
  orange: BRAND.orange,
  amber: BRAND.orangeRed,
  text: BRAND.text,
  sub: BRAND.sub,
  bg: BRAND.bg,
  bgForm: BRAND.bgSoft,
  border: BRAND.border,
  borderFocus: BRAND.borderStrong,
  inputBg: '#FFFFFF',
  gradWarm: BRAND.gradWarm,
  gradBlue: BRAND.gradBlue,
  shadow: BRAND.shadow,
  shadowBlue: BRAND.shadowBlue,
}

const HEADING = BRAND.fontHeading
const BODY = BRAND.fontBody

type LoginPayload =
  | { email: string; password: string }
  | { phone: string; password: string }

export default function LoginPage() {
  const router = useRouter()

  const [identifier, setIdentifier] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('/logo-midad.png')
  const [focus, setFocus] = useState('')

  const { loading: guardLoading, authorized } = useRouteGuard('guest')

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        await supabase.auth.signOut()
      } catch {}

      if (typeof window !== 'undefined') {
        localStorage.removeItem('mosaed_user')
        localStorage.removeItem('mosaed_session')
        sessionStorage.clear()
      }

      try {
        const res = await fetch('/api/platform-settings')
        const data = await res.json()
        if (mounted && data?.settings?.logo_url) {
          setLogoUrl(data.settings.logo_url)
        }
      } catch {}
    })()

    return () => {
      mounted = false
    }
  }, [])

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      try {
        await supabase.auth.signOut()
      } catch {}

      if (typeof window !== 'undefined') {
        localStorage.removeItem('mosaed_user')
        localStorage.removeItem('mosaed_session')
        sessionStorage.clear()
      }

      const raw = identifier.trim()
      const clean = raw.toLowerCase()

      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)
      const isPhone = /^\+?\d{8,15}$/.test(raw)

      let loginPayload: LoginPayload

      if (isEmail) {
        loginPayload = { email: clean, password }
      } else if (isPhone) {
        loginPayload = {
          phone: raw.startsWith('+') ? raw : `+${raw}`,
          password,
        }
      } else {
        const res = await fetch('/api/auth/resolve-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: raw }),
        })

        const data = await res.json().catch(() => null)

        if (!res.ok) {
          setError(data?.error || 'اسم المستخدم غير صحيح')
          return
        }

        if (data?.email) {
          loginPayload = {
            email: String(data.email).toLowerCase(),
            password,
          }
        } else if (data?.phone) {
          loginPayload = {
            phone: String(data.phone),
            password,
          }
        } else {
          setError('تعذر تحديد وسيلة الدخول لهذا المستخدم')
          return
        }
      }

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword(loginPayload)

      if (authError) {
        setError(authError.message || 'بيانات غير صحيحة')
        return
      }

      const session = authData.session
      const authUser = authData.user

      if (!session || !authUser) {
        setError('لم يتم إنشاء جلسة تسجيل دخول صالحة')
        return
      }

      const meRes = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const meData = await meRes.json().catch(() => null)

      if (!meRes.ok) {
        setError(meData?.error || 'تعذر تحميل بيانات المستخدم')
        return
      }

      const appUser = meData?.user ?? null

      if (!appUser) {
        setError('تعذر تحديد بيانات المستخدم بعد تسجيل الدخول')
        return
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('mosaed_user', JSON.stringify(appUser))
        localStorage.setItem(
          'mosaed_session',
          JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
          }),
        )
      }

      const nextRoute = resolveUserHome(appUser)
      router.replace(nextRoute)
      router.refresh()
    } catch {
      setError('تعذّر الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const cleanEmail = email.trim().toLowerCase()

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: cleanEmail,
          password,
          userType: 'student',
          allowedStages: [],
          allowedGrades: [],
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'فشل التسجيل')
        return
      }

      setIsRegister(false)
      setName('')
      setEmail('')
      setPassword('')
      setIdentifier('')
      setError('✅ تم التسجيل بنجاح! انتظر موافقة المدير ثم سجّل الدخول.')
    } catch {
      setError('تعذّر الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  const inp = (n: string): CSSProperties => ({
    width: '100%',
    padding: '14px 46px 14px 16px',
    borderRadius: 12,
    border: `1.5px solid ${focus === n ? B.borderFocus : B.border}`,
    background: B.inputBg,
    color: B.text,
    fontSize: 15,
    fontFamily: BODY,
    boxShadow: focus === n ? `0 0 0 3px rgba(150,30,45,0.08)` : 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none',
  })

  const Logo = ({ h = 56 }: { h?: number }) => (
    <img
      src={logoUrl}
      alt="مِداد"
      height={h}
      style={{ height: h, width: 'auto', objectFit: 'contain', display: 'block' }}
      onError={e => {
        ;(e.target as HTMLImageElement).src = '/logo-midad.png'
      }}
    />
  )

  const isSubmitDisabled =
    loading ||
    (isRegister
      ? !name.trim() || !email.trim() || !password
      : !identifier.trim() || !password)

  const submitBtnStyle: CSSProperties = {
    all: 'unset',
    boxSizing: 'border-box',
    width: '100%',
    minHeight: 56,
    padding: '16px 18px',
    marginTop: 10,
    borderRadius: 13,
    border: 'none',
    background: isSubmitDisabled ? 'rgba(107,80,80,0.12)' : B.gradBlue,
    color: isSubmitDisabled ? 'rgba(107,80,80,0.45)' : '#ffffff',
    fontSize: 16,
    fontWeight: 900,
    fontFamily: BODY,
    lineHeight: 1,
    cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    textAlign: 'center',
    boxShadow: isSubmitDisabled ? 'none' : B.shadowBlue,
    transition: 'transform .18s, box-shadow .18s, opacity .18s',
    opacity: 1,
    visibility: 'visible',
    position: 'relative',
    zIndex: 5,
    WebkitAppearance: 'none',
    appearance: 'none',
  }

  const heroCardStyle: CSSProperties = {
    background: 'rgba(255,255,255,0.76)',
    border: `1px solid ${B.border}`,
    borderRadius: 24,
    boxShadow: B.shadow,
    padding: 26,
    backdropFilter: 'blur(14px)',
  }

  const miniCardStyle: CSSProperties = {
    background: 'rgba(255,255,255,0.82)',
    border: `1px solid ${B.border}`,
    borderRadius: 16,
    boxShadow: B.shadow,
    padding: 18,
    minHeight: 126,
  }

  if (guardLoading) return null
  if (!authorized) return null

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: BODY,
        background: `
          radial-gradient(circle at 85% 10%, rgba(225,135,60,0.10), transparent 28%),
          radial-gradient(circle at 10% 80%, rgba(150,30,45,0.08), transparent 26%),
          ${B.bg}
        `,
      }}
    >
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{margin:0;background:${B.bg}}
        @keyframes fadeUp {from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
        @keyframes float {0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
        @keyframes spin {from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes shimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
        @keyframes pulse {0%,100%{opacity:1;}50%{opacity:0.4;}}
        .a1{opacity:0;animation:fadeUp .5s ease .05s forwards;}
        .a2{opacity:0;animation:fadeUp .5s ease .12s forwards;}
        .a3{opacity:0;animation:fadeUp .5s ease .20s forwards;}
        .a4{opacity:0;animation:fadeUp .5s ease .28s forwards;}
        .a5{opacity:0;animation:fadeUp .5s ease .36s forwards;}
        .a6{opacity:0;animation:fadeUp .5s ease .44s forwards;}
        .r1{opacity:0;animation:fadeUp .6s ease .08s forwards;}
        .r2{opacity:0;animation:fadeUp .6s ease .18s forwards;}
        .r3{opacity:0;animation:fadeUp .6s ease .28s forwards;}
        .r4{opacity:0;animation:fadeUp .6s ease .38s forwards;}
        .r5{opacity:0;animation:fadeUp .6s ease .48s forwards;}
        .btn-submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 44px rgba(37,99,235,0.45) !important;}
        .btn-submit:active:not(:disabled){transform:translateY(0);}
        .btn-sec{transition:border-color .2s,color .2s,background .2s;font-family:${BODY};}
        .btn-sec:hover{border-color:${B.borderFocus} !important;color:${B.crimson} !important;background:rgba(150,30,45,0.05) !important;}
        .feat{transition:border-color .2s,background .2s,transform .2s;}
        .feat:hover{border-color:rgba(150,30,45,0.28) !important;background:rgba(150,30,45,0.05) !important;transform:translateY(-2px);}
        .login-shell{
          width:100%;
          max-width:1180px;
          margin:0 auto;
          padding:28px 16px 40px;
        }
        .auth-grid{
          display:grid;
          grid-template-columns:1.08fr .92fr;
          gap:18px;
          align-items:stretch;
        }
        .mini-grid{
          display:grid;
          grid-template-columns:repeat(2,1fr);
          gap:12px;
        }
        .left-panel{
          min-width:0;
        }
        .form-panel{
          min-width:0;
        }
        @media(max-width:980px){
          .auth-grid{
            grid-template-columns:1fr;
          }
        }
        @media(max-width:640px){
          .mini-grid{
            grid-template-columns:1fr;
          }
        }
      `}</style>

      <PublicHeader activePage="login" />

      <main className="login-shell">
        <section style={heroCardStyle}>
          <div className="auth-grid">
            <div
              className="left-panel"
              style={{
                ...heroCardStyle,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 18,
                background: 'rgba(255,255,255,0.72)',
              }}
            >
              <div>
                <div
                  className="r1"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    borderRadius: 999,
                    background: 'rgba(140,20,40,0.08)',
                    border: '1px solid rgba(140,20,40,0.16)',
                    color: B.crimson,
                    fontSize: 13,
                    fontWeight: 900,
                    marginBottom: 16,
                  }}
                >
                  ✨ دخول موحد للمنصة
                </div>

                <div
                  className="r2"
                  style={{ marginBottom: 18, animation: 'float 4s ease-in-out infinite' }}
                >
                  <Logo h={64} />
                </div>

                <h1
                  className="r3"
                  style={{
                    fontSize: 'clamp(30px,4.2vw,54px)',
                    fontWeight: 900,
                    fontFamily: HEADING,
                    lineHeight: 1.18,
                    color: B.text,
                    marginBottom: 12,
                  }}
                >
                  ابدأ من مكان واضح
                  <br />
                  <span
                    style={{
                      background: B.gradWarm,
                      backgroundSize: '200% auto',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      animation: 'shimmer 4s linear infinite',
                    }}
                  >
                    وادخل إلى أدواتك بسرعة.
                  </span>
                </h1>

                <p
                  className="r4"
                  style={{
                    fontSize: 15,
                    color: B.sub,
                    lineHeight: 1.95,
                    marginBottom: 18,
                    maxWidth: 620,
                  }}
                >
                  سجّل دخولك للوصول إلى الدروس والاختبارات والأنشطة وسجل الأداء داخل واجهة موحّدة
                  بنفس الهوية البصرية للمنصة.
                </p>

                <div
                  className="r4"
                  style={{ display: 'flex', gap: 18, marginBottom: 28, flexWrap: 'wrap' }}
                >
                  {['شرح ذكي', 'اختبارات تفاعلية', 'متابعة الأداء'].map(t => (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: B.amber,
                          flexShrink: 0,
                          animation: 'pulse 2s ease-in-out infinite',
                        }}
                      />
                      <span style={{ fontSize: 14, color: B.sub, fontWeight: 700 }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mini-grid r5">
                {[
                  { icon: '📚', title: 'دروس منظمة', sub: 'محتوى مرتب حسب المرحلة والصف' },
                  { icon: '📝', title: 'اختبارات جاهزة', sub: 'توليد سريع وتصحيح فوري' },
                  { icon: '🎯', title: 'متابعة الأداء', sub: 'تحليلات مفيدة للطالب والمعلم' },
                  { icon: '⚡', title: 'وصول سريع', sub: 'توجيه مباشر بعد تسجيل الدخول' },
                ].map(item => (
                  <div key={item.title} className="feat" style={miniCardStyle}>
                    <div style={{ fontSize: 24, marginBottom: 10 }}>{item.icon}</div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 900,
                        fontFamily: HEADING,
                        color: B.text,
                        marginBottom: 5,
                      }}
                    >
                      {item.title}
                    </div>
                    <div style={{ fontSize: 12, color: B.sub, lineHeight: 1.8 }}>
                      {item.sub}
                    </div>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: 12, color: `${B.sub}70`, marginTop: 4 }}>
                🇰🇼 منصة مِداد • الكويت
              </p>
            </div>

            <div
              className="form-panel"
              style={{
                ...heroCardStyle,
                background: 'rgba(255,255,255,0.84)',
                padding: 26,
              }}
            >
              <div style={{ width: '100%', maxWidth: 360, margin: '0 auto' }}>
                <div className="a1" style={{ marginBottom: 22 }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 12px',
                      borderRadius: 999,
                      background: 'rgba(225,135,60,0.10)',
                      border: '1px solid rgba(225,135,60,0.18)',
                      color: B.orange,
                      fontSize: 12,
                      fontWeight: 900,
                      marginBottom: 14,
                    }}
                  >
                    🔐 دخول آمن
                  </div>

                  <h2
                    style={{
                      fontSize: 24,
                      fontWeight: 900,
                      fontFamily: HEADING,
                      color: isRegister ? B.text : B.crimson,
                      marginBottom: 6,
                    }}
                  >
                    {isRegister ? 'إنشاء حساب طالب ✨' : 'مرحباً بك 👋'}
                  </h2>

                  <p style={{ fontSize: 15, color: B.sub, lineHeight: 1.8 }}>
                    {isRegister ? 'سجّل للانضمام إلى مِداد كطالب' : 'سجّل دخولك للمتابعة إلى حسابك'}
                  </p>

                  {isRegister && (
                    <p
                      style={{
                        fontSize: 12,
                        color: `${B.sub}90`,
                        marginTop: 8,
                        lineHeight: 1.8,
                      }}
                    >
                      حسابات المعلمين تُنشأ فقط من قِبل إدارة المنصة. إن كنت معلماً، تواصل مع إدارة
                      المنصة لإنشاء حسابك.
                    </p>
                  )}
                </div>

                {error && (
                  <div
                    className="a1"
                    style={{
                      padding: '12px 16px',
                      borderRadius: 11,
                      marginBottom: 18,
                      fontSize: 14,
                      fontWeight: 600,
                      background: error.startsWith('✅')
                        ? 'rgba(5,150,105,0.08)'
                        : 'rgba(150,30,45,0.08)',
                      border: `1.5px solid ${
                        error.startsWith('✅')
                          ? 'rgba(5,150,105,0.28)'
                          : 'rgba(150,30,45,0.28)'
                      }`,
                      color: error.startsWith('✅') ? '#059669' : B.crimson,
                    }}
                  >
                    {error}
                  </div>
                )}

                <form
                  onSubmit={isRegister ? handleRegister : handleLogin}
                  style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                  {!isRegister && (
                    <div className="a2">
                      <label
                        style={{
                          fontSize: 13,
                          color: B.sub,
                          display: 'block',
                          marginBottom: 7,
                          fontWeight: 700,
                        }}
                      >
                        اسم المستخدم أو البريد أو رقم الهاتف
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span
                          style={{
                            position: 'absolute',
                            right: 14,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: 17,
                            pointerEvents: 'none',
                          }}
                        >
                          👤
                        </span>
                        <input
                          value={identifier}
                          onChange={e => setIdentifier(e.target.value)}
                          placeholder="اسم المستخدم أو البريد أو رقم الهاتف"
                          required
                          onFocus={() => setFocus('identifier')}
                          onBlur={() => setFocus('')}
                          style={{
                            ...inp('identifier'),
                            direction: 'rtl',
                            textAlign: 'right',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {isRegister && (
                    <>
                      <div className="a2">
                        <label
                          style={{
                            fontSize: 13,
                            color: B.sub,
                            display: 'block',
                            marginBottom: 7,
                            fontWeight: 700,
                          }}
                        >
                          الاسم الكامل
                        </label>
                        <div style={{ position: 'relative' }}>
                          <span
                            style={{
                              position: 'absolute',
                              right: 14,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              fontSize: 17,
                              pointerEvents: 'none',
                            }}
                          >
                            👤
                          </span>
                          <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="الاسم الكامل"
                            required
                            onFocus={() => setFocus('name')}
                            onBlur={() => setFocus('')}
                            style={{ ...inp('name'), direction: 'rtl', textAlign: 'right' }}
                          />
                        </div>
                      </div>

                      <div className="a2">
                        <label
                          style={{
                            fontSize: 13,
                            color: B.sub,
                            display: 'block',
                            marginBottom: 7,
                            fontWeight: 700,
                          }}
                        >
                          البريد الإلكتروني
                        </label>
                        <div style={{ position: 'relative' }}>
                          <span
                            style={{
                              position: 'absolute',
                              right: 14,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              fontSize: 17,
                              pointerEvents: 'none',
                            }}
                          >
                            📧
                          </span>
                          <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="example@email.com"
                            required
                            onFocus={() => setFocus('email')}
                            onBlur={() => setFocus('')}
                            style={{ ...inp('email'), direction: 'ltr', textAlign: 'right' }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="a3">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 7,
                        gap: 10,
                        flexWrap: 'wrap',
                      }}
                    >
                      <label style={{ fontSize: 13, color: B.sub, fontWeight: 700 }}>
                        كلمة المرور
                      </label>

                      {!isRegister && (
                        <button
                          type="button"
                          onClick={() => router.push('/forgot-password')}
                          style={{
                            all: 'unset',
                            fontSize: 12,
                            color: B.crimson,
                            cursor: 'pointer',
                            fontFamily: BODY,
                            fontWeight: 700,
                          }}
                        >
                          نسيت كلمة المرور؟
                        </button>
                      )}
                    </div>

                    <div style={{ position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          right: 14,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: 17,
                          pointerEvents: 'none',
                        }}
                      >
                        🔑
                      </span>

                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={8}
                        onFocus={() => setFocus('pass')}
                        onBlur={() => setFocus('')}
                        style={{ ...inp('pass'), paddingLeft: 44 }}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPass(s => !s)}
                        aria-label={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        style={{
                          all: 'unset',
                          position: 'absolute',
                          left: 13,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          cursor: 'pointer',
                          fontSize: 16,
                          color: B.sub,
                          lineHeight: 1,
                        }}
                      >
                        {showPass ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitDisabled}
                    className="btn-submit a4"
                    style={submitBtnStyle}
                  >
                    {loading ? (
                      <>
                        <span
                          style={{
                            width: 17,
                            height: 17,
                            border: '2.5px solid rgba(255,255,255,0.3)',
                            borderTopColor: '#fff',
                            borderRadius: '50%',
                            display: 'inline-block',
                            animation: 'spin 0.8s linear infinite',
                          }}
                        />
                        {isRegister ? 'جارٍ إنشاء الحساب...' : 'جارٍ التحقق...'}
                      </>
                    ) : isRegister ? (
                      '✨ إنشاء الحساب'
                    ) : (
                      'تسجيل الدخول'
                    )}
                  </button>
                </form>

                <div
                  className="a5"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}
                >
                  <div style={{ flex: 1, height: 1, background: B.border }} />
                  <span style={{ fontSize: 12, color: `${B.sub}80` }}>أو</span>
                  <div style={{ flex: 1, height: 1, background: B.border }} />
                </div>

                <button
                  type="button"
                  className="a5 btn-sec"
                  onClick={() => {
                    setIsRegister(r => !r)
                    setError('')
                    setPassword('')
                    setShowPass(false)
                  }}
                  style={{
                    all: 'unset',
                    boxSizing: 'border-box',
                    width: '100%',
                    padding: '13px 16px',
                    borderRadius: 12,
                    border: `1.5px solid ${B.border}`,
                    background: 'rgba(255,255,255,0.74)',
                    color: B.sub,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}
                >
                  {isRegister ? '← العودة لتسجيل الدخول' : 'ليس لدي حساب — التسجيل ✨'}
                </button>

                <div className="a6" style={{ textAlign: 'center', marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => router.push('/landing')}
                    style={{
                      all: 'unset',
                      color: `${B.sub}75`,
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: BODY,
                      fontWeight: 600,
                    }}
                  >
                    ← الصفحة الرئيسية
                  </button>
                </div>

                <p
                  style={{
                    textAlign: 'center',
                    fontSize: 12,
                    color: `${B.sub}50`,
                    marginTop: 18,
                  }}
                >
                  مِداد • الكويت 🇰🇼
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}