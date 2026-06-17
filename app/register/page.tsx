'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import MidadLogo from '@/components/MidadLogo'

const STAGES = [
  {
    id: 'primary',
    label: 'ابتدائي',
    shortLabel: 'ابتدائي',
    icon: '🌱',
    grades: ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس'],
    tone: '#5E8B55',
  },
  {
    id: 'middle',
    label: 'متوسط',
    shortLabel: 'متوسط',
    icon: '📚',
    grades: ['السادس', 'السابع', 'الثامن', 'التاسع'],
    tone: '#4F7A8A',
  },
  {
    id: 'high',
    label: 'ثانوي',
    shortLabel: 'ثانوي',
    icon: '🎓',
    grades: ['العاشر', 'الحادي عشر', 'الثاني عشر'],
    tone: '#9A6B39',
  },
] as const

type UserType = 'teacher' | 'student'

const C = {
  bg: '#F7F2EA',
  bgSoft: '#FCF8F2',
  surface: '#FDFAF6',
  surfaceSoft: 'rgba(255,255,255,0.60)',
  text: '#1F1720',
  sub: '#6F5B5B',
  muted: '#9B8A84',
  deep: '#7B1A1A',
  red: '#C0392B',
  redDark: '#9F2D22',
  orange: '#E07A24',
  gold: '#E7A93B',
  border: 'rgba(123,26,26,0.12)',
  borderStrong: 'rgba(123,26,26,0.22)',
  inputBg: 'rgba(123,26,26,0.04)',
  inputBgFocus: 'rgba(123,26,26,0.06)',
  primarySoft: 'rgba(192,57,43,0.10)',
  primarySofter: 'rgba(192,57,43,0.06)',
  successBg: 'rgba(67,122,34,0.10)',
  successBorder: 'rgba(67,122,34,0.20)',
  successText: '#437A22',
  dangerBg: 'rgba(161,53,68,0.10)',
  dangerBorder: 'rgba(161,53,68,0.18)',
  dangerText: '#A13544',
  primaryGrad: 'linear-gradient(135deg,#7B1A1A,#C0392B,#E07A24)',
  warmLine: 'linear-gradient(90deg,#7B1A1A,#C0392B,#E07A24,#E7A93B)',
  shadowCard: '0 24px 60px rgba(63,22,22,0.08)',
  shadowSoft: '0 18px 44px rgba(63,22,22,0.06)',
  shadowBtn: '0 14px 30px rgba(192,57,43,0.18)',
  greenBtn: '#437A22',
  greenBtnSoft: 'rgba(67,122,34,0.22)',
  greenShadow: '0 14px 24px rgba(67,122,34,0.18)',
}

export default function RegisterPage() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState<UserType>('teacher')
  const [selectedStages, setSelectedStages] = useState<string[]>([])
  const [selectedStageForGrade, setSelectedStageForGrade] = useState<string | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const canGoNext = name.trim().length >= 3 && emailIsValid && password.length >= 8
  const canSubmitTeacher = userType === 'teacher' && selectedStages.length > 0
  const canSubmitStudent = userType === 'student' && !!selectedStageForGrade && !!selectedGrade
  const canSubmit = userType === 'teacher' ? canSubmitTeacher : canSubmitStudent

  const selectedStageObject = useMemo(
    () => STAGES.find(stage => stage.id === selectedStageForGrade) || null,
    [selectedStageForGrade]
  )

  function toggleStage(stageId: string) {
    setSelectedStages(prev =>
      prev.includes(stageId) ? prev.filter(item => item !== stageId) : [...prev, stageId]
    )
  }

  function validateStepOne() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('أدخل جميع البيانات المطلوبة')
      return false
    }

    if (name.trim().length < 3) {
      setError('الاسم الكامل يجب أن يكون أوضح')
      return false
    }

    if (!emailIsValid) {
      setError('أدخل بريداً إلكترونياً صحيحاً')
      return false
    }

    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      return false
    }

    setError('')
    return true
  }

  function handleNext() {
    if (!validateStepOne()) return
    setStep(2)
  }

  async function handleRegister() {
    if (userType === 'teacher' && selectedStages.length === 0) {
      setError('اختر مرحلة دراسية واحدة على الأقل')
      return
    }

    if (userType === 'student' && (!selectedStageForGrade || !selectedGrade)) {
      setError('اختر المرحلة والصف الدراسي')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          userType,
          allowedStages: userType === 'teacher' ? selectedStages : [selectedStageForGrade],
          allowedGrades: userType === 'student' ? [selectedGrade] : [],
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'حدث خطأ أثناء إرسال الطلب')
        return
      }

      setSuccess(true)
    } catch {
      setError('تعذر إرسال الطلب الآن، حاول مرة أخرى بعد قليل')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '15px 16px',
    borderRadius: 16,
    border: `1.5px solid ${C.border}`,
    background: C.inputBg,
    color: C.text,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    transition: '0.18s ease',
  }

  if (success) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: '100vh',
          background: `
            radial-gradient(circle at 12% 18%, rgba(192,57,43,0.05), transparent 24%),
            radial-gradient(circle at 88% 78%, rgba(231,169,59,0.08), transparent 22%),
            ${C.bg}
          `,
          fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
          color: C.text,
          padding: '24px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <style>{`
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; background: ${C.bg}; }
          button, input { font-family: inherit; }
        `}</style>

        <div
          style={{
            width: '100%',
            maxWidth: 540,
            background: C.surface,
            border: `1.5px solid ${C.border}`,
            borderRadius: 30,
            padding: 32,
            boxShadow: C.shadowCard,
            textAlign: 'center',
            position: 'relative',
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

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <MidadLogo size={42} dark={false} />
          </div>

          <div
            style={{
              width: 84,
              height: 84,
              margin: '0 auto 18px',
              borderRadius: 24,
              background: C.successBg,
              border: `1px solid ${C.successBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
            }}
          >
            ✓
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 999,
              background: C.primarySofter,
              border: `1px solid ${C.border}`,
              color: C.red,
              fontSize: 12,
              fontWeight: 800,
              marginBottom: 14,
            }}
          >
            تم إرسال الطلب بنجاح
          </div>

          <h1
            style={{
              fontSize: 30,
              lineHeight: 1.3,
              margin: '0 0 10px',
              fontWeight: 900,
              color: C.text,
            }}
          >
            تم استلام طلب التسجيل
          </h1>

          <p style={{ fontSize: 14, lineHeight: 2, color: C.sub, margin: '0 0 8px' }}>
            طلبك الآن قيد المراجعة من إدارة المنصة قبل التفعيل.
          </p>

          <p style={{ fontSize: 14, lineHeight: 2, color: C.sub, margin: '0 0 20px' }}>
            ستصل نتيجة المراجعة إلى البريد التالي:
            <br />
            <span style={{ color: C.red, fontWeight: 900 }}>{email}</span>
          </p>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: 16,
              background: C.successBg,
              border: `1px solid ${C.successBorder}`,
              color: C.successText,
              fontSize: 13,
              lineHeight: 1.9,
              fontWeight: 700,
              marginBottom: 18,
            }}
          >
            بعد الموافقة ستتمكن من الدخول بحسب المرحلة أو الصف الذي حددته أثناء التسجيل.
          </div>

          <button
            onClick={() => router.push('/login')}
            style={{
              width: '100%',
              padding: '15px 16px',
              borderRadius: 16,
              border: 'none',
              background: C.primaryGrad,
              color: '#fff',
              fontSize: 15,
              fontWeight: 900,
              cursor: 'pointer',
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
        background: `
          radial-gradient(circle at 12% 18%, rgba(192,57,43,0.05), transparent 24%),
          radial-gradient(circle at 88% 78%, rgba(231,169,59,0.08), transparent 22%),
          ${C.bg}
        `,
        fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
        color: C.text,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: ${C.bg}; }
        button, input { font-family: inherit; }
        input::placeholder { color: ${C.muted}; }
        input:focus, button:focus { outline: none; }

        .register-shell {
          max-width: 1160px;
          margin: 0 auto;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.08fr 0.92fr;
          gap: 24px;
          align-items: center;
          padding: 28px 16px;
          position: relative;
          z-index: 2;
        }

        .soft-orb {
          position: absolute;
          border-radius: 999px;
          filter: blur(10px);
          pointer-events: none;
          opacity: 0.45;
        }

        .hover-up {
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
        }

        .hover-up:hover {
          transform: translateY(-2px);
        }

        .field input {
          width: 100%;
          padding: 15px 16px;
          border-radius: 16px;
          border: 1.5px solid ${C.border};
          background: ${C.inputBg};
          color: ${C.text};
          font-size: 14px;
          transition: border-color .18s, background .18s, box-shadow .18s;
        }

        .field input:focus {
          border-color: ${C.borderStrong};
          background: ${C.inputBgFocus};
          box-shadow: 0 0 0 4px rgba(192,57,43,0.08);
        }

        @media (max-width: 980px) {
          .register-shell {
            grid-template-columns: 1fr;
            gap: 18px;
            align-items: start;
            padding: 18px 14px 28px;
          }

          .hero-panel {
            min-height: auto !important;
            order: 2;
          }

          .form-panel {
            order: 1;
            max-width: 100% !important;
          }
        }

        @media (max-width: 640px) {
          .stage-grid-student {
            grid-template-columns: 1fr !important;
          }

          .account-grid {
            grid-template-columns: 1fr !important;
          }

          .hero-title {
            font-size: 30px !important;
          }

          .card-padding {
            padding: 22px !important;
          }
        }
      `}</style>

      <div
        className="soft-orb"
        style={{
          top: -70,
          right: -40,
          width: 260,
          height: 260,
          background: 'rgba(192,57,43,0.08)',
        }}
      />

      <div
        className="soft-orb"
        style={{
          bottom: 60,
          left: -60,
          width: 240,
          height: 240,
          background: 'rgba(90,120,110,0.08)',
        }}
      />

      <div className="register-shell">
        <section
          className="hero-panel card-padding"
          style={{
            background: `linear-gradient(180deg, ${C.surfaceSoft}, rgba(255,255,255,0.34))`,
            border: `1.5px solid ${C.border}`,
            borderRadius: 32,
            padding: 34,
            minHeight: 680,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: C.shadowSoft,
            backdropFilter: 'blur(8px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 18% 22%, rgba(192,57,43,0.06), transparent 28%), radial-gradient(circle at 76% 74%, rgba(231,169,59,0.08), transparent 24%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 22 }}>
              <MidadLogo size={40} dark={false} />
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 999,
                background: C.surface,
                border: `1px solid ${C.border}`,
                color: C.red,
                fontWeight: 900,
                fontSize: 13,
                marginBottom: 22,
              }}
            >
              منصة عربية للمعلّم والمتعلّم
            </div>

            <h1
              className="hero-title"
              style={{
                fontSize: 42,
                lineHeight: 1.28,
                margin: '0 0 14px',
                fontWeight: 900,
                color: C.text,
                letterSpacing: '-0.02em',
              }}
            >
              ابدأ حسابك
              <br />
              في تجربة عربية
              <br />
              هادئة وواضحة
            </h1>

            <p
              style={{
                fontSize: 16,
                lineHeight: 2,
                color: C.sub,
                margin: 0,
                maxWidth: 560,
              }}
            >
              سجّل كمعلم أو طالب بخطوتين فقط، ثم يُراجع طلبك قبل التفعيل حتى يظهر لك
              المحتوى المناسب بحسب مرحلتك أو صفك الدراسي.
            </p>
          </div>

          <div style={{ display: 'grid', gap: 14, marginTop: 28, position: 'relative', zIndex: 2 }}>
            {[
              [
                'للمعلم',
                'اختر مرحلة واحدة أو أكثر، ثم استخدم أدوات الشرح والاختبار والخطة وورقة العمل.',
                '👨‍🏫',
              ],
              [
                'للطالب',
                'ادخل إلى محتوى صفك فقط، بشكل أبسط وأوضح ومنظّم بحسب مرحلتك الدراسية.',
                '👨‍🎓',
              ],
              [
                'مراجعة قبل التفعيل',
                'كل طلب جديد يدخل للمراجعة أولاً للمحافظة على تنظيم الحسابات وجودة الوصول.',
                '✓',
              ],
            ].map(([title, desc, icon]) => (
              <div
                key={title}
                className="hover-up"
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 20,
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 15,
                    background: C.primarySoft,
                    color: C.red,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 900,
                      color: C.text,
                      marginBottom: 4,
                    }}
                  >
                    {title}
                  </div>

                  <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.9 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 26,
              paddingTop: 20,
              borderTop: `1px dashed ${C.border}`,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              position: 'relative',
              zIndex: 2,
            }}
          >
            {['شرح', 'اختبار', 'خطة درس', 'ورقة عمل', 'لعبة لغوية', 'محتوى بحسب الصف'].map(
              item => (
                <div
                  key={item}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    color: C.sub,
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {item}
                </div>
              )
            )}
          </div>
        </section>

        <section
          className="form-panel card-padding"
          style={{
            width: '100%',
            maxWidth: 500,
            margin: '0 auto',
            background: C.surface,
            border: `1.5px solid ${C.border}`,
            borderRadius: 32,
            padding: 30,
            boxShadow: C.shadowCard,
            position: 'relative',
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

          <div style={{ textAlign: 'center', marginBottom: 24, position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <MidadLogo size={36} dark={false} />
            </div>

            <div
              style={{
                width: 78,
                height: 78,
                margin: '0 auto 16px',
                borderRadius: 22,
                background: C.primarySoft,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 30,
              }}
            >
              {step === 1 ? '✍️' : userType === 'teacher' ? '👨‍🏫' : '👨‍🎓'}
            </div>

            <h2 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 900, color: C.text }}>
              {step === 1
                ? 'إنشاء حساب جديد'
                : userType === 'teacher'
                ? 'تحديد المراحل الدراسية'
                : 'تحديد المرحلة والصف'}
            </h2>

            <p style={{ margin: 0, color: C.sub, fontSize: 13, lineHeight: 1.9 }}>
              {step === 1
                ? 'ابدأ ببياناتك الأساسية، ثم أكمل تهيئة الحساب في الخطوة التالية'
                : userType === 'teacher'
                ? 'اختر المراحل التي ستعمل عليها داخل المنصة'
                : 'اختر مرحلة واحدة ثم حدد الصف الدراسي المناسب'}
            </p>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 18 }}>
              {[1, 2].map(item => (
                <div
                  key={item}
                  style={{
                    width: 82,
                    height: 8,
                    borderRadius: 999,
                    background: step >= item ? C.red : 'rgba(192,57,43,0.11)',
                    transition: '0.2s',
                  }}
                />
              ))}
            </div>
          </div>

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15, position: 'relative', zIndex: 2 }}>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    color: C.sub,
                    fontWeight: 800,
                    marginBottom: 8,
                  }}
                >
                  نوع الحساب
                </div>

                <div
                  className="account-grid"
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
                >
                  {[
                    {
                      id: 'teacher',
                      label: 'معلم',
                      icon: '👨‍🏫',
                      desc: 'إعداد المحتوى التعليمي للمراحل المحددة',
                    },
                    {
                      id: 'student',
                      label: 'طالب',
                      icon: '👨‍🎓',
                      desc: 'الوصول إلى المحتوى المناسب للمرحلة والصف',
                    },
                  ].map(option => {
                    const active = userType === option.id
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setUserType(option.id as UserType)
                          setSelectedStages([])
                          setSelectedStageForGrade(null)
                          setSelectedGrade(null)
                          setError('')
                        }}
                        className="hover-up"
                        style={{
                          textAlign: 'right',
                          padding: '16px 14px',
                          borderRadius: 18,
                          border: `1.5px solid ${active ? C.red : C.border}`,
                          background: active ? C.primarySoft : C.primarySofter,
                          color: active ? C.red : C.text,
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 6,
                            fontSize: 14,
                            fontWeight: 900,
                          }}
                        >
                          <span>{option.icon}</span>
                          <span>{option.label}</span>
                        </div>

                        <div style={{ fontSize: 12, color: active ? C.redDark : C.sub, lineHeight: 1.8 }}>
                          {option.desc}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="field">
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 800,
                    color: C.sub,
                    marginBottom: 7,
                  }}
                >
                  الاسم الكامل
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="اكتب اسمك الكامل"
                  style={inputStyle}
                />
              </div>

              <div className="field">
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 800,
                    color: C.sub,
                    marginBottom: 7,
                  }}
                >
                  البريد الإلكتروني
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
                />
              </div>

              <div className="field">
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 800,
                    color: C.sub,
                    marginBottom: 7,
                  }}
                >
                  كلمة المرور
                </label>

                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleNext()}
                    placeholder="8 أحرف على الأقل"
                    style={{ ...inputStyle, paddingLeft: 54 }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPw(prev => !prev)}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'transparent',
                      color: C.sub,
                      cursor: 'pointer',
                      fontSize: 18,
                    }}
                  >
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 16,
                  background: C.primarySofter,
                  border: `1px solid ${C.border}`,
                  color: C.sub,
                  fontSize: 12,
                  lineHeight: 1.9,
                }}
              >
                سيُراجع طلب التسجيل قبل التفعيل، ثم تصلك نتيجة المراجعة عبر البريد الإلكتروني.
              </div>

              {error && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 16,
                    background: C.dangerBg,
                    border: `1px solid ${C.dangerBorder}`,
                    color: C.dangerText,
                    fontSize: 13,
                    fontWeight: 800,
                    textAlign: 'center',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={handleNext}
                disabled={!canGoNext}
                style={{
                  width: '100%',
                  padding: '15px 16px',
                  borderRadius: 16,
                  border: 'none',
                  background: canGoNext ? C.primaryGrad : 'rgba(192,57,43,0.18)',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 900,
                  cursor: canGoNext ? 'pointer' : 'not-allowed',
                  boxShadow: canGoNext ? C.shadowBtn : 'none',
                }}
              >
                الانتقال إلى الخطوة التالية
              </button>

              <button
                onClick={() => router.push('/login')}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: 16,
                  border: `1.5px solid ${C.border}`,
                  background: 'transparent',
                  color: C.sub,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                لدي حساب بالفعل
              </button>
            </div>
          )}

          {step === 2 && userType === 'teacher' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 2 }}>
              {STAGES.map(stage => {
                const active = selectedStages.includes(stage.id)

                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => {
                      toggleStage(stage.id)
                      setError('')
                    }}
                    className="hover-up"
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: 20,
                      border: `1.5px solid ${active ? C.red : C.border}`,
                      background: active ? C.primarySoft : C.primarySofter,
                      color: C.text,
                      textAlign: 'right',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 16,
                        background: active ? 'rgba(192,57,43,0.16)' : C.surface,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        flexShrink: 0,
                      }}
                    >
                      {stage.icon}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 900,
                          color: active ? C.red : C.text,
                        }}
                      >
                        {stage.label}
                      </div>

                      <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>
                        من الصف {stage.grades[0]} إلى الصف {stage.grades[stage.grades.length - 1]}
                      </div>
                    </div>

                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 999,
                        border: `1.5px solid ${active ? C.red : C.border}`,
                        background: active ? C.red : 'transparent',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 900,
                        flexShrink: 0,
                      }}
                    >
                      {active ? '✓' : ''}
                    </div>
                  </button>
                )
              })}

              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 16,
                  background: C.primarySofter,
                  border: `1px solid ${C.border}`,
                }}
              >
                <div style={{ fontSize: 12, color: C.sub, marginBottom: 8, fontWeight: 800 }}>
                  ملخص الطلب
                </div>

                <div style={{ fontSize: 14, color: C.text, lineHeight: 1.9 }}>
                  <span style={{ color: C.red, fontWeight: 900 }}>نوع الحساب:</span> معلم
                  <br />
                  <span style={{ color: C.red, fontWeight: 900 }}>المراحل المختارة:</span>{' '}
                  {selectedStages.length
                    ? selectedStages
                        .map(id => STAGES.find(stage => stage.id === id)?.shortLabel)
                        .filter(Boolean)
                        .join('، ')
                    : 'لم يتم الاختيار بعد'}
                </div>
              </div>

              {error && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 16,
                    background: C.dangerBg,
                    border: `1px solid ${C.dangerBorder}`,
                    color: C.dangerText,
                    fontSize: 13,
                    fontWeight: 800,
                    textAlign: 'center',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={handleRegister}
                disabled={loading || !canSubmit}
                style={{
                  width: '100%',
                  padding: '15px 16px',
                  borderRadius: 16,
                  border: 'none',
                  background: loading || !canSubmit ? C.greenBtnSoft : C.greenBtn,
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 900,
                  cursor: loading || !canSubmit ? 'not-allowed' : 'pointer',
                  marginTop: 4,
                  boxShadow: !loading && canSubmit ? C.greenShadow : 'none',
                }}
              >
                {loading ? 'جارٍ إرسال الطلب...' : 'إرسال طلب التسجيل'}
              </button>

              <button
                onClick={() => {
                  setStep(1)
                  setError('')
                }}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: 14,
                  border: 'none',
                  background: 'transparent',
                  color: C.sub,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                رجوع إلى البيانات الأساسية
              </button>
            </div>
          )}

          {step === 2 && userType === 'student' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 2 }}>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    color: C.sub,
                    fontWeight: 800,
                    marginBottom: 8,
                  }}
                >
                  المرحلة الدراسية
                </div>

                <div
                  className="stage-grid-student"
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}
                >
                  {STAGES.map(stage => {
                    const active = selectedStageForGrade === stage.id

                    return (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => {
                          setSelectedStageForGrade(stage.id)
                          setSelectedGrade(null)
                          setError('')
                        }}
                        className="hover-up"
                        style={{
                          padding: '15px 10px',
                          borderRadius: 18,
                          border: `1.5px solid ${active ? C.red : C.border}`,
                          background: active ? C.primarySoft : C.primarySofter,
                          color: active ? C.red : C.text,
                          textAlign: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: 24, marginBottom: 6 }}>{stage.icon}</div>
                        <div style={{ fontSize: 13, fontWeight: 900 }}>{stage.label}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {selectedStageObject && (
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      color: C.sub,
                      fontWeight: 800,
                      marginBottom: 8,
                    }}
                  >
                    الصف الدراسي
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {selectedStageObject.grades.map(grade => {
                      const active = selectedGrade === grade

                      return (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => {
                            setSelectedGrade(grade)
                            setError('')
                          }}
                          className="hover-up"
                          style={{
                            padding: '10px 14px',
                            borderRadius: 14,
                            border: `1.5px solid ${active ? C.red : C.border}`,
                            background: active ? C.primarySoft : C.inputBg,
                            color: active ? C.red : C.text,
                            fontSize: 13,
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          الصف {grade}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 16,
                  background: C.primarySofter,
                  border: `1px solid ${C.border}`,
                }}
              >
                <div style={{ fontSize: 12, color: C.sub, marginBottom: 8, fontWeight: 800 }}>
                  ملخص الطلب
                </div>

                <div style={{ fontSize: 14, color: C.text, lineHeight: 1.9 }}>
                  <span style={{ color: C.red, fontWeight: 900 }}>نوع الحساب:</span> طالب
                  <br />
                  <span style={{ color: C.red, fontWeight: 900 }}>المرحلة:</span>{' '}
                  {selectedStageObject?.label || 'لم يتم الاختيار بعد'}
                  <br />
                  <span style={{ color: C.red, fontWeight: 900 }}>الصف:</span>{' '}
                  {selectedGrade ? `الصف ${selectedGrade}` : 'لم يتم الاختيار بعد'}
                </div>
              </div>

              {error && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 16,
                    background: C.dangerBg,
                    border: `1px solid ${C.dangerBorder}`,
                    color: C.dangerText,
                    fontSize: 13,
                    fontWeight: 800,
                    textAlign: 'center',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={handleRegister}
                disabled={loading || !canSubmit}
                style={{
                  width: '100%',
                  padding: '15px 16px',
                  borderRadius: 16,
                  border: 'none',
                  background: loading || !canSubmit ? C.greenBtnSoft : C.greenBtn,
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 900,
                  cursor: loading || !canSubmit ? 'not-allowed' : 'pointer',
                  boxShadow: !loading && canSubmit ? C.greenShadow : 'none',
                }}
              >
                {loading ? 'جارٍ إرسال الطلب...' : 'إرسال طلب التسجيل'}
              </button>

              <button
                onClick={() => {
                  setStep(1)
                  setError('')
                }}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: 14,
                  border: 'none',
                  background: 'transparent',
                  color: C.sub,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                رجوع إلى البيانات الأساسية
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}