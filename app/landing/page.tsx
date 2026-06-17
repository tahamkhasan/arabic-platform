'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import MidadLogo from '@/components/MidadLogo'

const C = {
  bg: '#F7F2EA',
  bgSoft: '#FCF8F2',
  text: '#1F1720',
  sub: '#6F5B5B',
  deep: '#7B1A1A',
  red: '#C0392B',
  orange: '#E07A24',
  gold: '#E7A93B',
  border: 'rgba(123,26,26,0.12)',
  borderStrong: 'rgba(123,26,26,0.22)',
  card: 'rgba(255,255,255,0.72)',
  primaryGrad: 'linear-gradient(135deg,#7B1A1A,#C0392B,#E07A24)',
  shadow: '0 20px 50px rgba(60,24,24,0.08)',
  shadowBtn: '0 14px 32px rgba(192,57,43,0.18)',
}

export default function LandingPage() {
  const router = useRouter()
  const [scrollY, setScrollY] = useState(0)
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const refs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisible(v => ({ ...v, [entry.target.id]: true }))
          }
        })
      },
      { threshold: 0.12 }
    )

    Object.values(refs.current).forEach(el => el && obs.observe(el))
    return () => obs.disconnect()
  }, [])

  function setRef(id: string) {
    return (el: HTMLElement | null) => {
      refs.current[id] = el
    }
  }

  const anim = (id: string, delay = 0): React.CSSProperties => ({
    opacity: visible[id] ? 1 : 0,
    transform: visible[id] ? 'translateY(0)' : 'translateY(18px)',
    transition: `all 650ms ease ${delay}s`,
  })

  return (
    <div
      dir="rtl"
      style={{
        background: `
          radial-gradient(circle at top right, rgba(231,169,59,0.08), transparent 28%),
          radial-gradient(circle at top left, rgba(192,57,43,0.05), transparent 24%),
          ${C.bg}
        `,
        color: C.text,
        fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
        overflowX: 'hidden',
      }}
    >
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{background:${C.bg}}
        a{text-decoration:none}
        .container{max-width:1180px;margin:0 auto;padding:0 24px}
        .section{padding:96px 0}
        .glass{
          background:rgba(255,255,255,0.72);
          backdrop-filter:blur(16px);
          -webkit-backdrop-filter:blur(16px);
          border:1px solid ${C.border};
          box-shadow:${C.shadow};
        }
        .btn{
          border:none;
          cursor:pointer;
          font-family:inherit;
          transition:transform .18s ease, box-shadow .18s ease, background .18s ease, border-color .18s ease, color .18s ease;
        }
        .btn:hover{transform:translateY(-2px)}
        .btn-primary{
          background:${C.primaryGrad};
          color:#fff;
          box-shadow:${C.shadowBtn};
        }
        .btn-secondary{
          background:rgba(255,255,255,0.68);
          color:${C.text};
          border:1px solid ${C.borderStrong};
        }
        .card{
          background:${C.card};
          border:1px solid ${C.border};
          box-shadow:${C.shadow};
          transition:transform .2s ease, border-color .2s ease, box-shadow .2s ease;
        }
        .card:hover{
          transform:translateY(-4px);
          border-color:${C.borderStrong};
          box-shadow:0 24px 54px rgba(60,24,24,0.10);
        }
        .nav-link{
          color:${C.sub};
          font-size:15px;
          font-weight:700;
          transition:color .18s ease;
        }
        .nav-link:hover{color:${C.red}}
        .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
        .hero-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:34px;align-items:center}
        .role-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
        .tiny-label{
          display:inline-flex;align-items:center;gap:8px;
          padding:10px 16px;border-radius:999px;
          background:rgba(192,57,43,0.07);
          border:1px solid rgba(192,57,43,0.14);
          color:${C.red};font-size:14px;font-weight:800;
        }
        .dot{
          width:8px;height:8px;border-radius:50%;background:${C.orange};display:inline-block;
          box-shadow:0 0 0 6px rgba(224,122,36,.12);
        }
        @media(max-width:980px){
          .hero-grid,.role-grid,.grid-3{grid-template-columns:1fr}
          .hide-mobile{display:none!important}
          .section{padding:76px 0}
        }
      `}</style>

      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: scrollY > 24 ? 'rgba(247,242,234,0.9)' : 'rgba(247,242,234,0.72)',
          backdropFilter: 'blur(18px)',
          borderBottom: `1px solid ${scrollY > 24 ? C.border : 'transparent'}`,
        }}
      >
        <div
          className="container"
          style={{
            minHeight: 76,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={() => router.push('/login')}
              className="btn btn-secondary"
              style={{ padding: '11px 18px', borderRadius: 12, fontSize: 14, fontWeight: 800 }}
            >
              تسجيل الدخول
            </button>

            <button
              onClick={() => router.push('/register')}
              className="btn btn-primary"
              style={{ padding: '11px 20px', borderRadius: 12, fontSize: 14, fontWeight: 900 }}
            >
              اطلب حساباً
            </button>
          </div>

          <div className="hide-mobile" style={{ display: 'flex', gap: 28 }}>
            <a href="#features" className="nav-link">المزايا</a>
            <a href="#roles" className="nav-link">لمن صُممت</a>
            <a href="#steps" className="nav-link">كيف تعمل</a>
            <a href="#cta" className="nav-link">ابدأ</a>
          </div>

          <div
            onClick={() => router.push('/landing')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <MidadLogo size={36} dark={false} />
          </div>
        </div>
      </nav>

      <section className="section" style={{ paddingTop: 54 }}>
        <div className="container hero-grid">
          <div>
            <div className="tiny-label" style={{ marginBottom: 22 }}>
              <span className="dot" />
              للمعلم والمتعلم في اللغة العربية
            </div>

            <h1
              style={{
                fontSize: 'clamp(38px, 5vw, 66px)',
                lineHeight: 1.18,
                fontWeight: 900,
                marginBottom: 18,
                maxWidth: 720,
              }}
            >
              منصة عربية ذكية
              <span style={{ color: C.red }}> تنظّم الشرح </span>
              وتدعم التدريب
              <span style={{ color: C.orange }}> وتوضح التقدم</span>
            </h1>

            <p
              style={{
                fontSize: 18,
                lineHeight: 1.95,
                color: C.sub,
                maxWidth: 650,
                marginBottom: 28,
              }}
            >
              مِداد منصة تعليمية متخصصة للغة العربية، تمكّن المعلم من إعداد الشرح والخطة والاختبار
              وورقة العمل، وتمنح المتعلم تدريباً أوضح وتجربة أكثر تفاعلاً ضمن مسار منظم.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 30 }}>
              <button
                onClick={() => router.push('/register')}
                className="btn btn-primary"
                style={{ padding: '16px 28px', borderRadius: 16, fontSize: 16, fontWeight: 900 }}
              >
                ابدأ مع مِداد
              </button>

              <button
                onClick={() => router.push('/login')}
                className="btn btn-secondary"
                style={{ padding: '16px 24px', borderRadius: 16, fontSize: 16, fontWeight: 800 }}
              >
                دخول المستخدمين
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['شرح ذكي', 'اختبارات تفاعلية', 'خطة درس', 'تصدير Word وPDF وPowerPoint'].map((item) => (
                <div
                  key={item}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.56)',
                    border: `1px solid ${C.border}`,
                    color: C.sub,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div
              className="glass"
              style={{
                borderRadius: 28,
                padding: 28,
                minHeight: 480,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `
                    radial-gradient(circle at 20% 20%, rgba(231,169,59,0.10), transparent 24%),
                    radial-gradient(circle at 80% 30%, rgba(192,57,43,0.08), transparent 22%),
                    radial-gradient(circle at 50% 100%, rgba(224,122,36,0.08), transparent 25%)
                  `,
                  borderRadius: 28,
                  pointerEvents: 'none',
                }}
              />

              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
                  <MidadLogo size={44} dark={false} />
                </div>

                <p style={{ color: C.sub, fontSize: 15, lineHeight: 1.9, maxWidth: 320, margin: '0 auto' }}>
                  هوية هادئة ودافئة تعبّر عن العربية، وتمنح المنصة حضوراً تعليمياً أكثر نضجاً وثقة.
                </p>
              </div>

              <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 12 }}>
                {[
                  ['المعلم', 'يولد الشرح والخطط والأنشطة بسرعة أكبر.'],
                  ['المتعلم', 'يتدرّب ويتابع تقدمه بصورة أبسط.'],
                  ['المدرسة', 'تنظم المحتوى والاختبارات داخل بيئة واحدة.'],
                ].map(([title, desc]) => (
                  <div
                    key={title}
                    style={{
                      display: 'flex',
                      alignItems: 'start',
                      gap: 12,
                      padding: '14px 16px',
                      borderRadius: 16,
                      background: 'rgba(255,255,255,0.62)',
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: C.orange,
                        flexShrink: 0,
                        marginTop: 6,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: C.text, marginBottom: 4 }}>{title}</div>
                      <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.8 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="section" ref={setRef('features') as any}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 42, ...anim('features') }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12 }}>ما الذي تقدمه مِداد؟</h2>
            <p style={{ color: C.sub, fontSize: 16, maxWidth: 620, margin: '0 auto', lineHeight: 1.9 }}>
              المنصة تجمع بين إعداد المحتوى، التدريب، وقياس الأثر داخل تجربة عربية واحدة أكثر وضوحاً.
            </p>
          </div>

          <div className="grid-3">
            {[
              {
                title: 'شرح وخطة وورقة عمل',
                desc: 'للمعلم أدوات جاهزة لإعداد الشرح والخطة والأنشطة التعليمية بطريقة أسرع وأكثر تنظيماً.',
              },
              {
                title: 'اختبارات وتدريب تفاعلي',
                desc: 'للمتعلم تجربة تدريب أقرب للفهم والتطبيق، لا مجرد قراءة جامدة أو حفظ مباشر.',
              },
              {
                title: 'متابعة أوضح للأداء',
                desc: 'المحتوى والاختبارات والتغذية الراجعة تجتمع في مكان واحد لدعم القرار التعليمي.',
              },
            ].map((item, i) => (
              <div
                key={item.title}
                id={`f-${i}`}
                ref={setRef(`f-${i}`) as any}
                className="card"
                style={{ borderRadius: 24, padding: 26, ...anim(`f-${i}`, i * 0.08) }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    marginBottom: 18,
                    background: 'rgba(192,57,43,0.10)',
                    border: `1px solid ${C.border}`,
                  }}
                />
                <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 10 }}>{item.title}</h3>
                <p style={{ color: C.sub, lineHeight: 1.95, fontSize: 15 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="steps" className="section" style={{ background: 'rgba(255,255,255,0.28)' }} ref={setRef('steps') as any}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 42, ...anim('steps') }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12 }}>كيف تعمل المنصة؟</h2>
            <p style={{ color: C.sub, fontSize: 16 }}>مسار بسيط من المحتوى إلى التعلم ثم المتابعة.</p>
          </div>

          <div className="grid-3">
            {[
              ['1', 'اختر المرحلة والدرس', 'المعلم أو الطالب يبدأ من المرحلة والصف والمحتوى المتاح له.'],
              ['2', 'ولّد المحتوى المناسب', 'شرح، اختبار، خطة، لعبة، أو ورقة عمل بحسب الحاجة التعليمية.'],
              ['3', 'تابع النتيجة والأداء', 'تجربة أكثر وضوحاً في الاستخدام والتقييم والتغذية الراجعة.'],
            ].map(([n, title, desc], i) => (
              <div
                key={title}
                id={`s-${i}`}
                ref={setRef(`s-${i}`) as any}
                style={{ textAlign: 'center', padding: '8px 8px', ...anim(`s-${i}`, i * 0.1) }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    margin: '0 auto 18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.74)',
                    border: `1px solid ${C.borderStrong}`,
                    boxShadow: C.shadow,
                  }}
                >
                  <span style={{ fontSize: 22, fontWeight: 900, color: C.red }}>{n}</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 10 }}>{title}</h3>
                <p style={{ color: C.sub, fontSize: 15, lineHeight: 1.9, maxWidth: 300, margin: '0 auto' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="section" ref={setRef('roles') as any}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 42, ...anim('roles') }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12 }}>صُممت لمن؟</h2>
            <p style={{ color: C.sub, fontSize: 16, maxWidth: 580, margin: '0 auto', lineHeight: 1.9 }}>
              مِداد تخدم المعلم والمتعلم، ويمكن أن تتوسع لاحقاً لتخدم المدرسة كبيئة منظمة للمحتوى والمتابعة.
            </p>
          </div>

          <div className="role-grid">
            {[
              {
                title: 'للمعلم',
                desc: 'إعداد أسرع للشرح، والخطة، والاختبار، مع مخرجات قابلة للتصدير والاستخدام مباشرة.',
              },
              {
                title: 'للمتعلم',
                desc: 'تجربة أكثر بساطة في الفهم والتدريب والتفاعل، ضمن محتوى موجّه ومرتب.',
              },
              {
                title: 'للمدرسة',
                desc: 'هيكل منظم لإدارة المحتوى، والاختبارات، ومتابعة الاستخدام عبر الأدوار المختلفة.',
              },
            ].map((item, i) => (
              <div
                key={item.title}
                id={`r-${i}`}
                ref={setRef(`r-${i}`) as any}
                className="card"
                style={{ borderRadius: 26, padding: 26, ...anim(`r-${i}`, i * 0.08) }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    background: i === 0 ? C.red : i === 1 ? C.orange : C.gold,
                    marginBottom: 16,
                  }}
                />
                <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>{item.title}</h3>
                <p style={{ color: C.sub, lineHeight: 1.95, fontSize: 15, marginBottom: 16 }}>{item.desc}</p>
                <div style={{ display: 'grid', gap: 10 }}>
                  {['واجهة أوضح', 'قيمة عملية مباشرة', 'تجربة قابلة للتوسع'].map((point) => (
                    <div key={point} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: C.orange,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ color: C.text, fontSize: 14 }}>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cta" className="section" ref={setRef('cta') as any}>
        <div className="container">
          <div
            className="glass"
            style={{
              borderRadius: 32,
              padding: '42px 28px',
              textAlign: 'center',
              ...anim('cta'),
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <MidadLogo size={42} dark={false} />
            </div>

            <h2 style={{ fontSize: 'clamp(30px,4vw,44px)', fontWeight: 900, marginBottom: 14 }}>
              ابدأ رحلتك مع مِداد
            </h2>

            <p
              style={{
                color: C.sub,
                fontSize: 17,
                lineHeight: 1.95,
                maxWidth: 680,
                margin: '0 auto 28px',
              }}
            >
              منصة عربية تعليمية أكثر هدوءاً ووضوحاً، تساعد على تنظيم المحتوى ودعم التعلم
              وتقديم تجربة أقرب لاحتياج المعلم والمتعلم.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => router.push('/register')}
                className="btn btn-primary"
                style={{ padding: '16px 28px', borderRadius: 16, fontSize: 16, fontWeight: 900 }}
              >
                أنشئ حسابك
              </button>

              <button
                onClick={() => router.push('/login')}
                className="btn btn-secondary"
                style={{ padding: '16px 24px', borderRadius: 16, fontSize: 16, fontWeight: 800 }}
              >
                تسجيل الدخول
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '28px 0 34px' }}>
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <MidadLogo size={34} dark={false} />
          </div>

          <div style={{ color: C.sub, fontSize: 13 }}>
            الكويت • منصة تعليمية عربية • {new Date().getFullYear()}
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <a className="nav-link" href="#features">المزايا</a>
            <a className="nav-link" href="#roles">لمن صُممت</a>
            <a className="nav-link" href="#cta">ابدأ الآن</a>
          </div>
        </div>
      </footer>
    </div>
  )
}