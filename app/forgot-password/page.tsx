'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleReset() {
    if (!email.trim()) {
      setError('أدخل بريدك الإلكتروني')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'حدث خطأ أثناء الإرسال')
        return
      }

      setSuccess(true)
    } catch {
      setError('تعذّر الإرسال حالياً، حاول مرة أخرى')
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
            radial-gradient(circle at 22% 20%, rgba(192,57,43,0.07), transparent 25%),
            radial-gradient(circle at 78% 78%, rgba(231,169,59,0.09), transparent 24%),
            ${C.bg}
          `,
          fontFamily: 'Calibri, Segoe UI, Tahoma, Arial, sans-serif',
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
              background: C.successBg,
              border: `1px solid ${C.successBorder}`,
              fontSize: 34,
            }}
          >
            📧
          </div>

          <h2 style={{ color: C.successText, fontWeight: 900, fontSize: 24, marginBottom: 10 }}>
            تم إرسال الرابط
          </h2>

          <p style={{ color: C.sub, fontSize: 14, lineHeight: 2, marginBottom: 24 }}>
            تحقق من بريدك الإلكتروني،
            <br />
            وقد أرسلنا رابط إعادة التعيين إلى:
            <br />
            <span style={{ color: C.red, fontWeight: 800 }}>{email}</span>
          </p>

          <button
            onClick={() => router.replace('/login')}
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
            العودة إلى تسجيل الدخول
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
          radial-gradient(circle at 22% 20%, rgba(192,57,43,0.07), transparent 25%),
          radial-gradient(circle at 78% 78%, rgba(231,169,59,0.09), transparent 24%),
          ${C.bg}
        `,
        fontFamily: 'Calibri, Segoe UI, Tahoma, Arial, sans-serif',
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
          padding:14px 46px 14px 14px;
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
              fontSize: 32,
            }}
          >
            🔑
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 900, color: C.text, marginBottom: 8 }}>
            نسيت كلمة المرور؟
          </h1>

          <p style={{ color: C.sub, fontSize: 14, lineHeight: 1.9, margin: 0 }}>
            أدخل بريدك الإلكتروني،
            <br />
            وسنرسل لك رابط إعادة التعيين
          </p>
        </div>

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
              ✉️
            </span>

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleReset()}
              placeholder="البريد الإلكتروني"
              className="input-field"
              style={{ direction: 'ltr', textAlign: 'right' }}
            />
          </div>

          {error && (
            <div
              className="a4"
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
            disabled={loading}
            className="btn-main a4"
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 14,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: C.primaryGrad,
              color: '#fff',
              fontWeight: 900,
              fontSize: 15,
              fontFamily: 'inherit',
              boxShadow: C.shadowBtn,
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
                جارٍ الإرسال...
              </>
            ) : (
              'إرسال رابط إعادة التعيين'
            )}
          </button>

          <button
            className="btn-sub a5"
            onClick={() => router.replace('/login')}
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