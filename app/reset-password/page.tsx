'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import MidadLogo from '@/components/MidadLogo'

const C = {
  bg: '#F7F2EA',
  surface: '#FDFAF6',
  text: '#1F1720',
  sub: '#6F5B5B',
  red: '#C0392B',
  deep: '#7B1A1A',
  orange: '#E07A24',
  gold: '#E7A93B',
  green: '#437A22',
  border: 'rgba(123,26,26,0.12)',
  borderStrong: 'rgba(123,26,26,0.22)',
  inputBg: 'rgba(123,26,26,0.04)',
  inputBgFocus: 'rgba(123,26,26,0.07)',
  primaryGrad: 'linear-gradient(135deg,#7B1A1A,#C0392B,#E07A24)',
  warmLine: 'linear-gradient(90deg,#7B1A1A,#C0392B,#E07A24,#E7A93B)',
  successBg: 'rgba(67,122,34,0.10)',
  successBorder: 'rgba(67,122,34,0.24)',
  successText: '#437A22',
  dangerBg: 'rgba(161,53,68,0.10)',
  dangerBorder: 'rgba(161,53,68,0.20)',
  dangerText: '#A13544',
  shadowCard: '0 18px 50px rgba(123,26,26,0.08)',
  shadowBtn: '0 12px 28px rgba(192,57,43,0.22)',
}

function getPasswordStrength(password: string) {
  let score = 0

  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) || /[أ-ي]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9أ-ي]/.test(password)) score++

  if (!password) {
    return { label: 'أدخل كلمة المرور الجديدة', color: C.sub, width: '0%' }
  }
  if (score <= 2) {
    return { label: 'ضعيفة', color: '#A13544', width: '33%' }
  }
  if (score <= 4) {
    return { label: 'متوسطة', color: '#E07A24', width: '66%' }
  }
  return { label: 'قوية', color: '#437A22', width: '100%' }
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const strength = useMemo(() => getPasswordStrength(password), [password])

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword

  async function handleReset() {
    if (!token) {
      setError('رابط إعادة التعيين غير صالح أو منتهي')
      return
    }

    if (!password.trim()) {
      setError('أدخل كلمة المرور الجديدة')
      return
    }

    if (password.length < 8) {
      setError('يجب أن تكون كلمة المرور 8 أحرف على الأقل')
      return
    }

    if (!confirmPassword.trim()) {
      setError('أعد كتابة كلمة المرور')
      return
    }

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'تعذر إعادة تعيين كلمة المرور')
        return
      }

      setSuccess(true)

      setTimeout(() => {
        router.push('/login')
      }, 1800)
    } catch {
      setError('حدث خطأ غير متوقع، حاول مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          background: `
            radial-gradient(circle at 20% 20%, rgba(192,57,43,0.07), transparent 25%),
            radial-gradient(circle at 80% 80%, rgba(231,169,59,0.09), transparent 24%),
            ${C.bg}
          `,
          fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          body{margin:0}
          @keyframes fadeUp{
            from{opacity:0;transform:translateY(16px)}
            to{opacity:1;transform:translateY(0)}
          }
          .fade-up{opacity:0;animation:fadeUp .55s ease forwards}
        `}</style>

        <div
          className="fade-up"
          style={{
            width: '100%',
            maxWidth: 440,
            background: C.surface,
            borderRadius: 28,
            border: `1px solid ${C.border}`,
            boxShadow: C.shadowCard,
            padding: '38px 30px',
            textAlign: 'center',
            position: 'relative',
            zIndex: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              left: 0,
              height: 3,
              background: C.warmLine,
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <MidadLogo size={40} dark={false} />
          </div>

          <div
            style={{
              width: 72,
              height: 72,
              margin: '0 auto 18px',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(67,122,34,0.10)',
              border: `1px solid ${C.successBorder}`,
              fontSize: 34,
            }}
          >
            ✅
          </div>

          <h2 style={{ color: C.successText, fontWeight: 900, fontSize: 24, marginBottom: 10 }}>
            تم تحديث كلمة المرور
          </h2>

          <p style={{ color: C.sub, fontSize: 14, lineHeight: 2, marginBottom: 24 }}>
            تم حفظ كلمة المرور الجديدة بنجاح،
            <br />
            وسيتم تحويلك الآن إلى صفحة تسجيل الدخول
          </p>

          <button
            onClick={() => router.push('/login')}
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 14,
              border: 'none',
              cursor: 'pointer',
              background: C.primaryGrad,
              color: '#fff',
              fontWeight: 800,
              fontSize: 15,
              fontFamily: 'inherit',
              boxShadow: C.shadowBtn,
            }}
          >
            الذهاب إلى تسجيل الدخول
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: `
          radial-gradient(circle at 20% 20%, rgba(192,57,43,0.07), transparent 25%),
          radial-gradient(circle at 80% 80%, rgba(231,169,59,0.09), transparent 24%),
          ${C.bg}
        `,
        fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{margin:0}
        @keyframes fadeUp{
          from{opacity:0;transform:translateY(16px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes spin{
          from{transform:rotate(0deg)}
          to{transform:rotate(360deg)}
        }
        .a1{opacity:0;animation:fadeUp .55s ease .05s forwards}
        .a2{opacity:0;animation:fadeUp .55s ease .15s forwards}
        .a3{opacity:0;animation:fadeUp .55s ease .25s forwards}
        .a4{opacity:0;animation:fadeUp .55s ease .35s forwards}
        .a5{opacity:0;animation:fadeUp .55s ease .45s forwards}

        .input-field{
          width:100%;
          padding:14px 48px 14px 44px;
          border-radius:14px;
          border:1.5px solid ${C.border};
          background:${C.inputBg};
          color:${C.text};
          font-size:14px;
          box-sizing:border-box;
          font-family:inherit;
          transition:border-color .18s, background .18s, box-shadow .18s;
        }

        .input-field:focus{
          outline:none;
          border-color:${C.borderStrong};
          background:${C.inputBgFocus};
          box-shadow:0 0 0 4px rgba(192,57,43,0.08);
        }

        .input-field::placeholder{
          color:rgba(107,80,80,0.52);
        }

        .btn-main{
          transition:transform .18s, box-shadow .18s, opacity .18s;
        }

        .btn-main:hover:not(:disabled){
          transform:translateY(-1px);
          box-shadow:0 18px 32px rgba(192,57,43,0.28)!important;
        }

        .btn-main:disabled{
          cursor:not-allowed!important;
          opacity:.65;
          box-shadow:none!important;
        }

        .btn-sub{
          transition:border-color .18s, background .18s, color .18s;
        }

        .btn-sub:hover{
          border-color:${C.borderStrong}!important;
          background:rgba(192,57,43,0.05)!important;
          color:${C.red}!important;
        }

        .toggle-btn{
          position:absolute;
          left:12px;
          top:50%;
          transform:translateY(-50%);
          border:none;
          background:transparent;
          color:${C.sub};
          cursor:pointer;
          font-size:12px;
          font-weight:800;
          font-family:inherit;
          padding:4px 6px;
        }
      `}</style>

      <div
        className="a1"
        style={{
          width: '100%',
          maxWidth: 440,
          background: C.surface,
          borderRadius: 28,
          border: `1px solid ${C.border}`,
          boxShadow: C.shadowCard,
          padding: '38px 30px',
          position: 'relative',
          zIndex: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            left: 0,
            height: 3,
            background: C.warmLine,
          }}
        />

        <div className="a2" style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <MidadLogo size={38} dark={false} />
          </div>

          <div
            style={{
              width: 68,
              height: 68,
              margin: '0 auto 14px',
              borderRadius: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(192,57,43,0.08)',
              border: `1px solid ${C.border}`,
              fontSize: 30,
            }}
          >
            🔒
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 900, color: C.text, marginBottom: 8 }}>
            إعادة تعيين كلمة المرور
          </h1>

          <p style={{ color: C.sub, fontSize: 14, lineHeight: 1.9, margin: 0 }}>
            أدخل كلمة مرور جديدة وآمنة لحسابك
          </p>
        </div>

        {!token && (
          <div
            className="a3"
            style={{
              marginBottom: 14,
              padding: '11px 14px',
              borderRadius: 14,
              background: C.dangerBg,
              border: `1px solid ${C.dangerBorder}`,
              color: C.dangerText,
              fontSize: 13,
              textAlign: 'center',
              lineHeight: 1.8,
            }}
          >
            الرابط غير مكتمل، تأكد من فتح الصفحة من البريد الإلكتروني
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="a3" style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                right: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16,
                pointerEvents: 'none',
              }}
            >
              🔑
            </span>

            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="كلمة المرور الجديدة"
              className="input-field"
            />

            <button
              type="button"
              className="toggle-btn"
              onClick={() => setShowPass(prev => !prev)}
            >
              {showPass ? 'إخفاء' : 'إظهار'}
            </button>
          </div>

          <div className="a4" style={{ marginTop: -4 }}>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: 'rgba(192,57,43,0.08)',
                overflow: 'hidden',
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: strength.width,
                  height: '100%',
                  borderRadius: 999,
                  background: strength.color,
                  transition: 'all .25s ease',
                }}
              />
            </div>

            <div style={{ fontSize: 12, color: strength.color, fontWeight: 800 }}>
              قوة كلمة المرور: {strength.label}
            </div>
          </div>

          <div className="a4" style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                right: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16,
                pointerEvents: 'none',
              }}
            >
              🔐
            </span>

            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleReset()}
              placeholder="تأكيد كلمة المرور"
              className="input-field"
            />

            <button
              type="button"
              className="toggle-btn"
              onClick={() => setShowConfirm(prev => !prev)}
            >
              {showConfirm ? 'إخفاء' : 'إظهار'}
            </button>
          </div>

          {passwordsMatch && (
            <div
              className="a4"
              style={{
                padding: '10px 14px',
                borderRadius: 14,
                background: C.successBg,
                border: `1px solid ${C.successBorder}`,
                color: C.successText,
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              كلمتا المرور متطابقتان
            </div>
          )}

          {passwordsMismatch && (
            <div
              className="a4"
              style={{
                padding: '10px 14px',
                borderRadius: 14,
                background: C.dangerBg,
                border: `1px solid ${C.dangerBorder}`,
                color: C.dangerText,
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              كلمتا المرور غير متطابقتين
            </div>
          )}

          {error && (
            <div
              className="a5"
              style={{
                padding: '11px 14px',
                borderRadius: 14,
                background: C.dangerBg,
                border: `1px solid ${C.dangerBorder}`,
                color: C.dangerText,
                fontSize: 13,
                textAlign: 'center',
                lineHeight: 1.8,
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleReset}
            disabled={loading || !token}
            className="btn-main a5"
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 14,
              border: 'none',
              cursor: loading || !token ? 'not-allowed' : 'pointer',
              background: loading || !token ? 'rgba(192,57,43,0.18)' : C.primaryGrad,
              color: '#fff',
              fontWeight: 900,
              fontSize: 15,
              fontFamily: 'inherit',
              boxShadow: !loading && token ? C.shadowBtn : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    border: '2.5px solid rgba(255,255,255,0.28)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin .8s linear infinite',
                  }}
                />
                جارٍ الحفظ...
              </>
            ) : (
              'حفظ كلمة المرور الجديدة'
            )}
          </button>

          <button
            className="btn-sub a5"
            onClick={() => router.push('/login')}
            style={{
              width: '100%',
              padding: 13,
              borderRadius: 14,
              border: `1.5px solid ${C.border}`,
              background: 'transparent',
              color: C.sub,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            العودة إلى تسجيل الدخول
          </button>
        </div>
      </div>
    </div>
  )
}