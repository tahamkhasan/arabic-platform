'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import PublicHeader from '@/components/PublicHeader'

// ══ هوية مِداد — الألوان المستخرجة من الشعار ══
const B = {
  deep:        '#780F1E',
  red:         '#961E2D',
  crimson:     '#C32D2D',
  orange:      '#D2692D',
  amber:       '#E1782D',
  gold:        '#E1873C',
  text:        '#231B19',
  sub:         '#6B5050',
  muted:       '#9A8080',
  bg:          '#F7F2EA',
  bgSoft:      '#FCF8F2',
  card:        'rgba(255,255,255,0.72)',
  border:      'rgba(150,30,45,0.12)',
  borderStrong:'rgba(150,30,45,0.24)',
  gradMain:    'linear-gradient(135deg,#780F1E,#C32D2D,#D2692D)',
  gradWarm:    'linear-gradient(135deg,#780F1E,#961E2D,#E1873C)',
  gradGold:    'linear-gradient(135deg,#D2692D,#E1873C)',
  gradBlue:    'linear-gradient(135deg,#2563EB,#1D4ED8)',
  shadow:      '0 20px 50px rgba(120,15,30,0.08)',
  shadowWarm:  '0 8px 24px rgba(150,30,45,0.18)',
  shadowBlue:  '0 8px 28px rgba(37,99,235,0.42)',
}
const CALIBRI = "'Calibri','Trebuchet MS','Gill Sans MT',Tahoma,sans-serif"
const CAIRO   = "'Cairo','Segoe UI',Tahoma,Arial,sans-serif"

export default function LandingPage() {
  const router = useRouter()
  const [scrollY, setScrollY] = useState(0)
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [logoUrl, setLogoUrl] = useState('/logo-midad.png')
  const refs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    fetch('/api/platform-settings')
      .then(r => r.json())
      .then(d => { if (d.settings?.logo_url) setLogoUrl(d.settings.logo_url) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) setVisible(v => ({ ...v, [e.target.id]: true }))
      }),
      { threshold: 0.1 }
    )
    Object.values(refs.current).forEach(el => el && obs.observe(el))
    return () => obs.disconnect()
  }, [])

  function setRef(id: string) {
    return (el: HTMLElement | null) => { refs.current[id] = el }
  }

  const anim = (id: string, delay = 0): React.CSSProperties => ({
    opacity:    visible[id] ? 1 : 0,
    transform:  visible[id] ? 'translateY(0)' : 'translateY(22px)',
    transition: `all 700ms ease ${delay}s`,
  })

  const Logo = ({ h = 44 }: { h?: number }) => (
    <img
      src={logoUrl} alt="مِداد" height={h}
      style={{ height: h, width: 'auto', objectFit: 'contain', display: 'block' }}
      onError={e => { (e.target as HTMLImageElement).src = '/logo-midad.png' }}
    />
  )

  return (
    <div dir="rtl" style={{
      background: `
        radial-gradient(circle at 85% 15%, rgba(225,135,60,0.10), transparent 30%),
        radial-gradient(circle at 15% 85%, rgba(150,30,45,0.07), transparent 28%),
        ${B.bg}
      `,
      color: B.text, fontFamily: CAIRO, overflowX: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{background:${B.bg}}
        a{text-decoration:none}
        @keyframes float  {0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
        @keyframes pulse  {0%,100%{opacity:1;}50%{opacity:0.4;}}
        @keyframes glow   {0%,100%{box-shadow:${B.shadowBlue};}50%{box-shadow:0 14px 44px rgba(37,99,235,0.65);}}
        @keyframes shimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
        @keyframes spin   {from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        .container{max-width:1160px;margin:0 auto;padding:0 28px}
        .section{padding:96px 0}
        .glass{background:rgba(255,255,255,0.75);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid ${B.border};box-shadow:${B.shadow};}
        .btn{border:none;cursor:pointer;font-family:${CAIRO};transition:transform .18s,box-shadow .18s;}
        .btn:hover{transform:translateY(-2px)}
        .btn-brand{background:${B.gradMain};color:#fff;box-shadow:${B.shadowWarm};}
        .btn-brand:hover{box-shadow:0 14px 40px rgba(150,30,45,0.30)!important;}
        .btn-ghost{background:rgba(255,255,255,0.72);color:${B.text};border:1.5px solid ${B.borderStrong};}
        .btn-ghost:hover{background:#fff!important;border-color:${B.crimson}!important;}
        .btn-blue{background:${B.gradBlue};color:#fff;box-shadow:${B.shadowBlue};animation:glow 3s ease-in-out infinite;}
        .btn-blue:hover{box-shadow:0 14px 44px rgba(37,99,235,0.65)!important;}
        .card{background:${B.card};border:1px solid ${B.border};box-shadow:${B.shadow};transition:transform .22s,border-color .22s,box-shadow .22s;}
        .card:hover{transform:translateY(-5px);border-color:${B.borderStrong};box-shadow:0 28px 60px rgba(120,15,30,0.10);}
        .nav-a{color:${B.sub};font-size:15px;font-weight:700;text-decoration:none;transition:color .18s;}
        .nav-a:hover{color:${B.crimson}}
        .dot{width:8px;height:8px;border-radius:50%;background:${B.amber};display:inline-block;animation:pulse 2s ease-in-out infinite;}
        .tiny-label{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:999px;background:rgba(150,30,45,0.08);border:1px solid rgba(150,30,45,0.16);color:${B.crimson};font-size:14px;font-weight:800;}
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

            {/* ══ HERO ══ */}
      <section className="section" style={{ paddingTop:52 }}>
        <div className="container hero-grid">

          {/* النص */}
          <div>
            <div className="tiny-label" style={{ marginBottom:26 }}>
              <span className="dot" />
              للمعلم والمتعلم في اللغة العربية 🇰🇼
            </div>

            <h1 style={{
              fontSize: 'clamp(36px,4.8vw,64px)',
              fontFamily: CALIBRI, fontWeight: 900, lineHeight: 1.2,
              color: B.text, marginBottom: 20,
            }}>
              منصة عربية ذكية
              <span style={{ color: B.crimson }}> تنظّم الشرح </span>
              وتدعم التدريب
              <span style={{ color: B.amber }}> وتوضّح التقدّم</span>
            </h1>

            <p style={{
              fontSize: 17, fontFamily: CALIBRI,
              lineHeight: 1.95, color: B.sub,
              maxWidth: 620, marginBottom: 30,
            }}>
              مِداد منصة تعليمية متخصصة للغة العربية، تمكّن المعلم من إعداد الشرح والخطة
              والاختبار وورقة العمل، وتمنح المتعلم تدريباً أوضح وتجربة أكثر تفاعلاً.
            </p>

            <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:28 }}>
              <button onClick={() => router.push('/login')} className="btn btn-blue"
                style={{ padding:'15px 30px', borderRadius:14, fontSize:16, fontWeight:900 }}>
                ابدأ مع مِداد
              </button>
              <button onClick={() => router.push('/login')} className="btn btn-ghost"
                style={{ padding:'15px 24px', borderRadius:14, fontSize:15, fontWeight:800 }}>
                دخول المستخدمين
              </button>
            </div>

            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {['شرح ذكي','اختبارات تفاعلية','خطة درس','تصدير Word وPDF'].map(item => (
                <span key={item} style={{
                  padding:'9px 14px', borderRadius:999, fontSize:13, fontWeight:700,
                  background:'rgba(255,255,255,0.65)', border:`1px solid ${B.border}`, color:B.sub,
                }}>{item}</span>
              ))}
            </div>
          </div>

          {/* البطاقة */}
          <div>
            <div className="glass" style={{
              borderRadius:28, padding:28,
              minHeight:480, display:'flex', flexDirection:'column', justifyContent:'space-between',
              position:'relative', overflow:'hidden',
            }}>
              <div style={{
                position:'absolute', inset:0, borderRadius:28, pointerEvents:'none',
                background:`
                  radial-gradient(circle at 20% 20%, rgba(225,135,60,0.12),transparent 28%),
                  radial-gradient(circle at 80% 30%, rgba(150,30,45,0.08),transparent 24%)
                `,
              }} />
              <div style={{ position:'relative', zIndex:1, textAlign:'center', animation:'float 4s ease-in-out infinite' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
                  <Logo h={64} />
                </div>
              </div>
              <div style={{ position:'relative', zIndex:1, display:'grid', gap:12 }}>
                {[
                  { title:'المعلّم',  desc:'يولّد الشرح والخطط والأنشطة بسرعة أكبر وجودة أعلى.', c:B.crimson },
                  { title:'المتعلّم', desc:'يتدرّب ويتابع تقدمه في بيئة أبسط وأكثر وضوحاً.',     c:B.amber   },
                  { title:'المدرسة', desc:'تنظم المحتوى والاختبارات في بيئة واحدة متكاملة.',        c:B.gold    },
                ].map(item => (
                  <div key={item.title} style={{
                    display:'flex', alignItems:'flex-start', gap:12,
                    padding:'13px 16px', borderRadius:14,
                    background:'rgba(255,255,255,0.65)', border:`1px solid ${B.border}`,
                  }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:item.c, flexShrink:0, marginTop:5 }} />
                    <div>
                      <div style={{ fontSize:14, fontWeight:900, color:B.text, marginBottom:3, fontFamily:CALIBRI }}>{item.title}</div>
                      <div style={{ fontSize:13, color:B.sub, lineHeight:1.7 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ المزايا ══ */}
      <section id="features" ref={setRef('features') as any} className="section" style={{ background:'rgba(255,255,255,0.28)' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:52, ...anim('features') }}>
            <h2 style={{ fontSize:38, fontWeight:900, fontFamily:CALIBRI, marginBottom:12 }}>ما الذي تقدّمه مِداد؟</h2>
            <p style={{ fontSize:16, color:B.sub, maxWidth:540, margin:'0 auto', lineHeight:1.9 }}>
              ثلاثة محاور أساسية تخدم المعلّم والمتعلّم في اللغة العربية
            </p>
          </div>
          <div className="grid-3">
            {[
              { icon:'💡', c:B.crimson, num:'01', title:'شرح وخطة وورقة عمل',
                desc:'للمعلم أدوات جاهزة لإعداد الشرح والخطة والأنشطة التعليمية بطريقة أسرع وأكثر تنظيماً.' },
              { icon:'🎯', c:B.orange,  num:'02', title:'اختبارات وتدريب تفاعلي',
                desc:'للمتعلم تجربة تدريب أقرب للفهم والتطبيق، لا مجرد قراءة جامدة أو حفظ مباشر.' },
              { icon:'📊', c:B.gold,    num:'03', title:'متابعة أوضح للتقدّم',
                desc:'التقييم والتغذية الراجعة ومتابعة أثر التعلم تجتمع في مكان واحد لدعم القرار.' },
            ].map((f,i) => (
              <div key={f.title} id={`f${i}`} ref={setRef(`f${i}`) as any}
                className="card" style={{ borderRadius:24, padding:28, ...anim(`f${i}`, i*0.1) }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
                  <div style={{ width:54, height:54, borderRadius:15, background:`${f.c}14`, border:`1px solid ${f.c}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>{f.icon}</div>
                  <span style={{ fontSize:13, fontWeight:800, color:`${f.c}35`, letterSpacing:2 }}>{f.num}</span>
                </div>
                <h3 style={{ fontSize:19, fontWeight:900, fontFamily:CALIBRI, marginBottom:10 }}>{f.title}</h3>
                <p style={{ color:B.sub, lineHeight:1.9, fontSize:15 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ كيف تعمل ══ */}
      <section id="how" ref={setRef('how') as any} className="section">
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:52, ...anim('how') }}>
            <h2 style={{ fontSize:38, fontWeight:900, fontFamily:CALIBRI, marginBottom:12 }}>كيف تعمل مِداد؟</h2>
            <p style={{ fontSize:16, color:B.sub }}>مسار بسيط من المحتوى إلى التعلم</p>
          </div>
          <div className="grid-3">
            {[
              { n:'١', icon:'📚', title:'اختر المادة والدرس', desc:'المعلم أو الطالب يختار المرحلة والصف والمحتوى المتاح له.' },
              { n:'٢', icon:'✨', title:'ولّد المحتوى',       desc:'شرح، اختبار، خطة، أو ورقة عمل — بحسب الحاجة في ثوانٍ.' },
              { n:'٣', icon:'🎯', title:'تابع وتقدّم',        desc:'تغذية راجعة فورية ومتابعة الأداء لكل المعلم والمتعلم.' },
            ].map((s,i) => (
              <div key={s.title} id={`s${i}`} ref={setRef(`s${i}`) as any}
                style={{ textAlign:'center', ...anim(`s${i}`, i*0.12) }}>
                <div style={{ width:72, height:72, margin:'0 auto 20px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.80)', border:`1.5px solid ${B.borderStrong}`, boxShadow:B.shadow, fontSize:28 }}>
                  {s.icon}
                </div>
                <div style={{ fontSize:12, color:B.crimson, fontWeight:800, letterSpacing:3, marginBottom:10 }}>STEP {s.n}</div>
                <h3 style={{ fontSize:19, fontWeight:900, fontFamily:CALIBRI, marginBottom:10 }}>{s.title}</h3>
                <p style={{ color:B.sub, fontSize:15, lineHeight:1.9, maxWidth:280, margin:'0 auto' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ لمن صُممت ══ */}
      <section id="roles" ref={setRef('roles') as any} className="section" style={{ background:'rgba(255,255,255,0.28)' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:52, ...anim('roles') }}>
            <h2 style={{ fontSize:38, fontWeight:900, fontFamily:CALIBRI, marginBottom:12 }}>صُممت لمن؟</h2>
            <p style={{ fontSize:16, color:B.sub, maxWidth:500, margin:'0 auto', lineHeight:1.9 }}>
              مِداد تخدم المعلم والمتعلم، وتتوسع لتشمل المدرسة كاملاً
            </p>
          </div>
          <div className="grid-3">
            {[
              { title:'للمعلّم',  c:B.crimson, desc:'إعداد أسرع للشرح والخطة والاختبار مع مخرجات قابلة للتصدير مباشرة.',
                pts:['شرح وأوراق عمل فورية','إرسال مهام للطلاب','تحليلات أداء واضحة'] },
              { title:'للمتعلّم', c:B.amber,   desc:'تجربة تدريب أبسط وأكثر تفاعلاً ضمن محتوى موجّه ومرتب.',
                pts:['شرح مخصص لدروسه','اختبارات وبطاقات حفظ','تتبع درجاته وتقدمه'] },
              { title:'للمدرسة', c:B.gold,    desc:'هيكل منظم لإدارة المحتوى والاختبارات ومتابعة الأداء.',
                pts:['إدارة المعلمين والطلاب','تقارير شاملة','محتوى موحّد ومنظم'] },
            ].map((r,i) => (
              <div key={r.title} id={`r${i}`} ref={setRef(`r${i}`) as any}
                className="card" style={{ borderRadius:24, padding:26, ...anim(`r${i}`, i*0.1) }}>
                <div style={{ width:28, height:28, borderRadius:999, background:r.c, marginBottom:18, boxShadow:`0 4px 12px ${r.c}40` }} />
                <h3 style={{ fontSize:22, fontWeight:900, fontFamily:CALIBRI, marginBottom:10 }}>{r.title}</h3>
                <p style={{ color:B.sub, lineHeight:1.9, fontSize:15, marginBottom:18 }}>{r.desc}</p>
                <div style={{ display:'grid', gap:10 }}>
                  {r.pts.map(p => (
                    <div key={p} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ width:7, height:7, borderRadius:'50%', background:B.amber, flexShrink:0 }} />
                      <span style={{ fontSize:14, color:B.text }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ لماذا مِداد ══ */}
      <section id="why" ref={setRef('why') as any} className="section">
        <div className="container" style={{ maxWidth:800, textAlign:'center' }}>
          <div style={{ ...anim('why') }}>
            <h2 style={{ fontSize:38, fontWeight:900, fontFamily:CALIBRI, marginBottom:18 }}>لماذا مِداد؟</h2>
            <p style={{ fontSize:17, color:B.sub, lineHeight:1.95, marginBottom:48, fontFamily:CALIBRI }}>
              مِداد اسم يجمع المعلّم والمتعلّم، ويعبّر عن دعمٍ يدوم وأصالةٍ تمتزج بالإبداع.
            </p>
          </div>
          <div id="letters" ref={setRef('letters') as any}
            style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, maxWidth:680, margin:'0 auto' }}>
            {[
              { l:'م', w:'معلّم · متعلّم', c:B.deep    },
              { l:'د', w:'دعم · ديمومة',   c:B.crimson },
              { l:'ا', w:'أصالة · إبداع',  c:B.amber   },
              { l:'د', w:'دراية · دقة',    c:B.gold    },
            ].map((h,i) => (
              <div key={i} style={{
                padding:'24px 14px', borderRadius:18, textAlign:'center',
                background:`${h.c}09`, border:`1.5px solid ${h.c}22`,
                boxShadow:B.shadow,
                ...anim('letters', i*0.1),
              }}>
                <div style={{ fontSize:44, fontWeight:900, color:h.c, marginBottom:10, lineHeight:1, fontFamily:CALIBRI }}>{h.l}</div>
                <div style={{ fontSize:13, color:B.sub, lineHeight:1.7, fontWeight:600 }}>{h.w}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section id="cta" ref={setRef('cta') as any} className="section">
        <div className="container">
          <div className="glass" style={{ borderRadius:32, padding:'48px 28px', textAlign:'center', ...anim('cta') }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:24, animation:'float 3.5s ease-in-out infinite' }}>
              <Logo h={72} />
            </div>
            <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:900, fontFamily:CALIBRI, marginBottom:16 }}>
              ابدأ رحلتك مع مِداد
            </h2>
            <p style={{ color:B.sub, fontSize:17, fontFamily:CALIBRI, lineHeight:1.95, maxWidth:600, margin:'0 auto 32px' }}>
              سواء كنت معلماً تبحث عن شرح أقوى، أو متعلماً يريد تدريباً أوضح، تمنحك مِداد
              بيئة عربية ذكية تنظّم التعلم وتواكب التطور وتراقب التقدم خطوة بخطوة.
            </p>
            <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
              <button onClick={() => router.push('/login')} className="btn btn-blue"
                style={{ padding:'16px 36px', borderRadius:14, fontSize:16, fontWeight:900 }}>
                أنشئ حسابك مجاناً
              </button>
              <button onClick={() => router.push('/login')} className="btn btn-ghost"
                style={{ padding:'16px 26px', borderRadius:14, fontSize:15, fontWeight:800 }}>
                تسجيل الدخول
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ الفوتر ══ */}
      <div style={{ height:3, background:B.gradMain }} />
      <footer style={{ background:B.bgSoft, borderTop:`1px solid ${B.border}`, padding:'28px 0 36px' }}>
        <div className="container" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:18, flexWrap:'wrap' }}>
          <Logo h={38} />
          <div style={{ color:B.sub, fontSize:13 }}>الكويت 🇰🇼 • منصة تعليمية عربية • {new Date().getFullYear()}</div>
          <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
            {[['#features','المزايا'],['#how','كيف تعمل'],['#roles','لمن'],['#cta','ابدأ']].map(([href,label]) => (
              <a key={href} href={href} className="nav-a" style={{ fontSize:14 }}>{label}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}