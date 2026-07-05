'use client'

import { useEffect, useRef, useState } from 'react'
import PublicHeader from '@/components/PublicHeader'
import { BRAND } from '@/lib/constants/theme'
import CurriculumExplorer from '@/components/landing/CurriculumExplorer'
import AnimatedStat from '@/components/landing/AnimatedStat'
import PlanPicker from '@/components/landing/PlanPicker'
import Button from '@/components/ui/Button'

const B = {
  deep: BRAND.deep,
  crimson: BRAND.crimson,
  orange: BRAND.orange,
  amber: BRAND.orangeRed,
  text: BRAND.text,
  sub: BRAND.sub,
  bg: BRAND.bg,
  bgSoft: BRAND.bgSoft,
  card: BRAND.bgCard,
  border: BRAND.border,
  borderStrong: BRAND.borderStrong,
  gradMain: BRAND.gradMain,
  shadow: BRAND.shadow,
}

const HEADING = BRAND.fontHeading
const BODY = BRAND.fontBody

type PublicStats = {
  subjects: number
  lessons: number
  teachers: number
}

export default function LandingPage() {
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [logoUrl, setLogoUrl] = useState('/logo-midad.png')
  const [stats, setStats] = useState<PublicStats>({ subjects: 0, lessons: 0, teachers: 0 })
  const refs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    fetch('/api/platform-settings')
      .then(r => r.json())
      .then(d => {
        if (d.settings?.logo_url) setLogoUrl(d.settings.logo_url)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/public-stats')
      .then(r => r.json())
      .then(d =>
        setStats({
          subjects: d.subjects ?? 0,
          lessons: d.lessons ?? 0,
          teachers: d.teachers ?? 0,
        })
      )
      .catch(() => {})
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries =>
        entries.forEach(e => {
          if (e.isIntersecting) setVisible(v => ({ ...v, [e.target.id]: true }))
        }),
      { threshold: 0.1 }
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
    transform: visible[id] ? 'translateY(0)' : 'translateY(22px)',
    transition: `all 700ms ease ${delay}s`,
  })

  const Logo = ({ h = 44 }: { h?: number }) => (
    <img
      src={logoUrl}
      alt="مِدَاد"
      height={h}
      style={{ height: h, width: 'auto', objectFit: 'contain', display: 'block' }}
      onError={e => {
        ;(e.target as HTMLImageElement).src = '/logo-midad.png'
      }}
    />
  )

  return (
    <div
      dir="rtl"
      style={{
        background: `
          radial-gradient(circle at 85% 15%, rgba(225,135,60,0.10), transparent 30%),
          radial-gradient(circle at 15% 85%, rgba(150,30,45,0.07), transparent 28%),
          ${B.bg}
        `,
        color: B.text,
        fontFamily: BODY,
        overflowX: 'hidden',
      }}
    >
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{background:${B.bg}}
        a{text-decoration:none}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .container{max-width:1160px;margin:0 auto;padding:0 28px}
        .section{padding:96px 0}
        .glass{
          background:rgba(255,255,255,0.75);
          backdrop-filter:blur(18px);
          -webkit-backdrop-filter:blur(18px);
          border:1px solid ${B.border};
          box-shadow:${B.shadow};
        }
        .card{
          background:${B.card};
          border:1px solid ${B.border};
          box-shadow:${B.shadow};
          transition:transform .22s,border-color .22s,box-shadow .22s;
        }
        .card:hover{
          transform:translateY(-5px);
          border-color:${B.borderStrong};
          box-shadow:0 28px 60px rgba(120,15,30,0.10);
        }
        .nav-a{
          color:${B.sub};
          font-size:15px;
          font-weight:700;
          text-decoration:none;
          transition:color .18s;
        }
        .nav-a:hover{color:${B.crimson}}
        .dot{
          width:8px;
          height:8px;
          border-radius:50%;
          background:${B.amber};
          display:inline-block;
          animation:pulse 2s ease-in-out infinite;
        }
        .tiny-label{
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:10px 18px;
          border-radius:999px;
          background:rgba(150,30,45,0.08);
          border:1px solid rgba(150,30,45,0.16);
          color:${B.crimson};
          font-size:14px;
          font-weight:800;
        }
        .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
        .hero-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:36px;align-items:center}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:${B.bg}}
        ::-webkit-scrollbar-thumb{background:rgba(150,30,45,0.25);border-radius:3px}
        @media(max-width:980px){
          .hero-grid,.grid-3{grid-template-columns:1fr}
          .hide-mobile{display:none!important}
          .section{padding:72px 0}
        }
      `}</style>

      <PublicHeader activePage="landing" />

      <section className="section" style={{ paddingTop: 52 }}>
        <div className="container hero-grid">
          <div>
            <div className="tiny-label" style={{ marginBottom: 26 }}>
              <span className="dot" />
              للمُعلِّم والمُتعلِّم
            </div>

            <h1
              style={{
                fontSize: 'clamp(36px,4.8vw,64px)',
                fontFamily: HEADING,
                fontWeight: 900,
                lineHeight: 1.2,
                color: B.text,
                marginBottom: 20,
              }}
            >
              منصةٌ ذكية
              <span style={{ color: B.crimson }}> شروحٌ وافية </span>
              تدريبٌ مستمر
              <span style={{ color: B.amber }}> متابعةٌ دقيقةٌ </span>
            </h1>

            <p
              style={{
                fontSize: 17,
                fontFamily: BODY,
                lineHeight: 1.95,
                color: B.sub,
                maxWidth: 620,
                marginBottom: 30,
              }}
            >
              مِداد منصة تعليمية، تمكّن المُعلمَ من إعداد الشروح والخطط والاختبارات وأوراق العمل، وتمنحُ
              المُتعلمَ تدريباً مستمراً وتجربةً أكثرَ تفاعلاً.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
              <Button
                type="button"
                variant="cta"
                size="lg"
                title="ابدأ مع مِدَاد"
                onClick={() => {
                  document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                ابدأ مع مِدَاد
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="lg"
                title="استكشف المنهج أولاً"
                onClick={() => {
                  document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                🔍 استكشف المنهج أولاً
              </Button>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['شرح ذكي', 'اختبارات تفاعلية', 'خطة درس', 'تصدير Word وPDF'].map(item => (
                <span
                  key={item}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 700,
                    background: 'rgba(255,255,255,0.65)',
                    border: `1px solid ${B.border}`,
                    color: B.sub,
                    fontFamily: BODY,
                  }}
                >
                  {item}
                </span>
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
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 28,
                  pointerEvents: 'none',
                  background: `
                    radial-gradient(circle at 20% 20%, rgba(225,135,60,0.12),transparent 28%),
                    radial-gradient(circle at 80% 30%, rgba(150,30,45,0.08),transparent 24%)
                  `,
                }}
              />
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  textAlign: 'center',
                  animation: 'float 4s ease-in-out infinite',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <Logo h={64} />
                </div>
              </div>

              <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 12 }}>
                {[
                  { title: 'المعلّم', desc: 'يولّد الشرح والخطط والأنشطة بسرعة أكبر وجودة أعلى.', c: B.crimson },
                  { title: 'المتعلّم', desc: 'يتدرّب ويتابع تقدمه في بيئة أبسط وأكثر وضوحاً.', c: B.amber },
                  { title: 'المدرسة', desc: 'تنظم المحتوى والاختبارات في بيئة واحدة متكاملة.', c: B.deep },
                ].map(item => (
                  <div
                    key={item.title}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '13px 16px',
                      borderRadius: 14,
                      background: 'rgba(255,255,255,0.65)',
                      border: `1px solid ${B.border}`,
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: item.c,
                        flexShrink: 0,
                        marginTop: 5,
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 900,
                          color: B.text,
                          marginBottom: 3,
                          fontFamily: HEADING,
                        }}
                      >
                        {item.title}
                      </div>
                      <div style={{ fontSize: 13, color: B.sub, lineHeight: 1.7, fontFamily: BODY }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="explore"
        ref={setRef('explore') as any}
        className="section"
        style={{ paddingTop: 40, background: 'rgba(255,255,255,0.28)' }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 44, ...anim('explore') }}>
            <div className="tiny-label" style={{ marginBottom: 18 }}>
              <span className="dot" />
              بلا تسجيل، بلا انتظار
            </div>
            <h2 style={{ fontSize: 38, fontWeight: 900, fontFamily: HEADING, marginBottom: 12 }}>
              تصفّح المنهج بنفسك الآن
            </h2>
            <p
              style={{
                fontSize: 16,
                color: B.sub,
                maxWidth: 560,
                margin: '0 auto',
                lineHeight: 1.9,
                fontFamily: BODY,
              }}
            >
              اختر مرحلتك، وتجوّل في المواد والوحدات والدروس الحقيقية المتاحة على المنصة — قبل أن تُنشئ
              حسابك.
            </p>
          </div>
          <CurriculumExplorer />
        </div>
      </section>

      <section id="plans" ref={setRef('plans') as any} className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 44, ...anim('plans') }}>
            <div className="tiny-label" style={{ marginBottom: 18 }}>
              <span className="dot" />
              الخطوة الأولى نحو حسابك
            </div>
            <h2 style={{ fontSize: 38, fontWeight: 900, fontFamily: HEADING, marginBottom: 12 }}>
              اختر باقتك أو مادتك أولاً
            </h2>
            <p
              style={{
                fontSize: 16,
                color: B.sub,
                maxWidth: 580,
                margin: '0 auto',
                lineHeight: 1.9,
                fontFamily: BODY,
              }}
            >
              حدّد الباقة الشاملة أو المادة المستقلة التي تناسبك، وسننتقل بك مباشرة لإنشاء حسابك بهذا
              الاختيار محفوظاً تلقائياً — دون أي خطوة إضافية لاحقاً.
            </p>
          </div>
          <PlanPicker />
        </div>
      </section>

      <section className="section" style={{ paddingTop: 20, paddingBottom: 56 }}>
        <div className="container">
          <div
            className="glass"
            style={{
              borderRadius: 28,
              padding: '40px 28px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3,1fr)',
              gap: 24,
              background: 'rgba(255,255,255,0.82)',
              border: `1.5px solid ${B.border}`,
              boxShadow: B.shadow,
            }}
          >
            <AnimatedStat icon="📚" value={stats.subjects} label="مادة متاحة" color={B.crimson} />
            <AnimatedStat icon="📖" value={stats.lessons} label="درس جاهز" color={B.amber} />
            <AnimatedStat icon="👨‍🏫" value={stats.teachers} label="معلم متخصص" color={B.deep} />
          </div>
        </div>
      </section>

      <section id="features" ref={setRef('features') as any} className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 52, ...anim('features') }}>
            <h2 style={{ fontSize: 38, fontWeight: 900, fontFamily: HEADING, marginBottom: 12 }}>
              ما الذي تقدّمه مِدَاد؟
            </h2>
            <p
              style={{
                fontSize: 16,
                color: B.sub,
                maxWidth: 540,
                margin: '0 auto',
                lineHeight: 1.9,
                fontFamily: BODY,
              }}
            >
              ثلاثة محاور أساسية تخدم المُعَلِّم والمُتَعَلِّم
            </p>
          </div>

          <div className="grid-3">
            {[
              {
                icon: '💡',
                c: B.crimson,
                num: '01',
                title: 'الشروح والخطط وأوراق العمل',
                desc: 'للمعلم أدوات جاهزة لإعداد الشرح والخطة والأنشطة التعليمية بطريقة أسرع وأكثر تنظيماً.',
              },
              {
                icon: '🎯',
                c: B.orange,
                num: '02',
                title: 'الاختبارات والتدريبات التفاعلية',
                desc: 'للمتعلم تجربة تعينك على الفهم من خلال التطبيق، لا مجرد قراءة جامدة أو حفظ مباشر.',
              },
              {
                icon: '📊',
                c: B.deep,
                num: '03',
                title: 'متابعة دقيقة لتقدم الطالب وتطور مستواه',
                desc: 'التقييم والتغذية الراجعة ومتابعة أثر التعلم تجتمع في مكان واحد لدعم القرار.',
              },
            ].map((f, i) => (
              <div
                key={f.title}
                id={`f${i}`}
                ref={setRef(`f${i}`) as any}
                className="card"
                style={{ borderRadius: 24, padding: 28, ...anim(`f${i}`, i * 0.1) }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 22,
                  }}
                >
                  <div
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 15,
                      background: `${f.c}14`,
                      border: `1px solid ${f.c}28`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 26,
                    }}
                  >
                    {f.icon}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: `${f.c}35`, letterSpacing: 2 }}>
                    {f.num}
                  </span>
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 900, fontFamily: HEADING, marginBottom: 10 }}>
                  {f.title}
                </h3>
                <p style={{ color: B.sub, lineHeight: 1.9, fontSize: 15, fontFamily: BODY }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how"
        ref={setRef('how') as any}
        className="section"
        style={{ background: 'rgba(255,255,255,0.28)' }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 52, ...anim('how') }}>
            <h2 style={{ fontSize: 38, fontWeight: 900, fontFamily: HEADING, marginBottom: 12 }}>
              كيف تعمل مِداد؟
            </h2>
            <p style={{ fontSize: 16, color: B.sub, fontFamily: BODY }}>مسار بسيط من المحتوى إلى التعلم</p>
          </div>

          <div className="grid-3">
            {[
              {
                n: '1',
                icon: '📚',
                title: 'اختر المادة والدرس',
                desc: 'المعلم أو الطالب يختار المرحلة والصف والمحتوى المتاح له.',
              },
              {
                n: '2',
                icon: '✨',
                title: 'ولّد المحتوى',
                desc: 'شرح، اختبار، خطة، أو ورقة عمل — بحسب الحاجة في ثوانٍ.',
              },
              {
                n: '3',
                icon: '🎯',
                title: 'تابع وتقدّم',
                desc: 'تغذية راجعة فورية ومتابعة الأداء لكل المعلم والمتعلم.',
              },
            ].map((s, i) => (
              <div
                key={s.title}
                id={`s${i}`}
                ref={setRef(`s${i}`) as any}
                style={{ textAlign: 'center', ...anim(`s${i}`, i * 0.12) }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    margin: '0 auto 20px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.80)',
                    border: `1.5px solid ${B.borderStrong}`,
                    boxShadow: B.shadow,
                    fontSize: 28,
                  }}
                >
                  {s.icon}
                </div>
                <div style={{ fontSize: 12, color: B.crimson, fontWeight: 800, letterSpacing: 3, marginBottom: 10 }}>
                  STEP {s.n}
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 900, fontFamily: HEADING, marginBottom: 10 }}>{s.title}</h3>
                <p
                  style={{
                    color: B.sub,
                    fontSize: 15,
                    lineHeight: 1.9,
                    maxWidth: 280,
                    margin: '0 auto',
                    fontFamily: BODY,
                  }}
                >
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" ref={setRef('roles') as any} className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 52, ...anim('roles') }}>
            <h2 style={{ fontSize: 38, fontWeight: 900, fontFamily: HEADING, marginBottom: 12 }}>
              صُممت لمن؟
            </h2>
            <p
              style={{
                fontSize: 16,
                color: B.sub,
                maxWidth: 500,
                margin: '0 auto',
                lineHeight: 1.9,
                fontFamily: BODY,
              }}
            >
              مِدَاد تَخدم المعلمََ والمتعلمَ، وتتوسع لتشملَ الإدارة المدرسية
            </p>
          </div>

          <div className="grid-3">
            {[
              {
                title: 'للمعلّم',
                c: B.crimson,
                desc: 'إعداد أسرع للشرح والخطة والاختبار مع مخرجات قابلة للتصدير مباشرة.',
                pts: ['شرح وأوراق عمل فورية', 'إرسال مهام للطلاب', 'تحليلات أداء واضحة'],
              },
              {
                title: 'للمتعلّم',
                c: B.amber,
                desc: 'تجربة تدريب أبسط وأكثر تفاعلاً ضمن محتوى موجّه ومرتب.',
                pts: ['شرح مخصص لدروسه', 'اختبارات وبطاقات حفظ', 'تتبع درجاته وتقدمه'],
              },
              {
                title: 'للمدرسة',
                c: B.deep,
                desc: 'هيكل منظم لإدارة المحتوى والاختبارات ومتابعة الأداء.',
                pts: ['إدارة المعلمين والطلاب', 'تقارير شاملة', 'محتوى موحّد ومنظم'],
              },
            ].map((r, i) => (
              <div
                key={r.title}
                id={`r${i}`}
                ref={setRef(`r${i}`) as any}
                className="card"
                style={{ borderRadius: 24, padding: 26, ...anim(`r${i}`, i * 0.1) }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    background: r.c,
                    marginBottom: 18,
                    boxShadow: `0 4px 12px ${r.c}40`,
                  }}
                />
                <h3 style={{ fontSize: 22, fontWeight: 900, fontFamily: HEADING, marginBottom: 10 }}>{r.title}</h3>
                <p style={{ color: B.sub, lineHeight: 1.9, fontSize: 15, marginBottom: 18, fontFamily: BODY }}>
                  {r.desc}
                </p>
                <div style={{ display: 'grid', gap: 10 }}>
                  {r.pts.map(p => (
                    <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: B.amber,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 14, color: B.text, fontFamily: BODY }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="why" ref={setRef('why') as any} className="section">
        <div className="container" style={{ maxWidth: 800, textAlign: 'center' }}>
          <div style={{ ...anim('why') }}>
            <h2 style={{ fontSize: 38, fontWeight: 900, fontFamily: HEADING, marginBottom: 18 }}>
              لماذا مِدَاد؟
            </h2>
            <p
              style={{
                fontSize: 17,
                color: B.sub,
                lineHeight: 1.95,
                marginBottom: 48,
                fontFamily: BODY,
              }}
            >
              مِدَاد اسم يجمع المُعَلِّم والمُتَعَلِّم، ويعبّر عن دعمٍ يدوم وأصالةٍ تمتزجُ بالإبداع.
            </p>
          </div>

          <div
            id="letters"
            ref={setRef('letters') as any}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))',
              gap: 16,
              maxWidth: 680,
              margin: '0 auto',
            }}
          >
            {[
              { l: 'م', w: 'معلّم · متعلّم', c: B.deep },
              { l: 'د', w: 'دعمٌ · ديمومة', c: B.crimson },
              { l: 'ا', w: 'أصالةٌ · إبداع', c: B.amber },
              { l: 'د', w: 'درايةٌ · دقة', c: B.orange },
            ].map((h, i) => (
              <div
                key={i}
                style={{
                  padding: '24px 14px',
                  borderRadius: 18,
                  textAlign: 'center',
                  background: `${h.c}0d`,
                  border: `1px solid ${h.c}2a`,
                  boxShadow: B.shadow,
                  ...anim('letters', i * 0.1),
                }}
              >
                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 900,
                    color: h.c,
                    marginBottom: 10,
                    lineHeight: 1,
                    fontFamily: HEADING,
                  }}
                >
                  {h.l}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: B.sub,
                    lineHeight: 1.7,
                    fontWeight: 600,
                    fontFamily: BODY,
                  }}
                >
                  {h.w}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ height: 3, background: B.gradMain }} />

      <footer style={{ background: B.bgSoft, borderTop: `1px solid ${B.border}`, padding: '28px 0 36px' }}>
        <div
          className="container"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}
        >
          <Logo h={38} />
          <div style={{ color: B.sub, fontSize: 13, fontFamily: BODY }}>
            الكويت 🇰🇼 • منصة تعليمية • {new Date().getFullYear()}
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              ['#explore', 'استكشف المنهج'],
              ['#plans', 'اختر باقتك'],
              ['#features', 'المزايا'],
              ['#how', 'كيف تعمل'],
              ['#roles', 'لمن'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="nav-a" style={{ fontSize: 14, fontFamily: BODY }}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}