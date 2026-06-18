'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const C = {
  bg:           '#F7F2EA',
  bgSoft:       '#FCF8F2',
  text:         '#1F1720',
  sub:          '#6F5B5B',
  deep:         '#7B1A1A',
  red:          '#C0392B',
  orange:       '#E07A24',
  gold:         '#E7A93B',
  border:       'rgba(123,26,26,0.12)',
  borderStrong: 'rgba(123,26,26,0.22)',
  card:         'rgba(255,255,255,0.72)',
  primaryGrad:  'linear-gradient(135deg,#7B1A1A,#C0392B,#E07A24)',
  blueGrad:     'linear-gradient(135deg,#2563EB,#1D4ED8)',
  shadow:       '0 20px 50px rgba(60,24,24,0.08)',
  shadowBtn:    '0 14px 32px rgba(192,57,43,0.18)',
  shadowBlue:   '0 8px 28px rgba(37,99,235,0.40)',
}

// خط كاليبري للعناوين
const CALIBRI = "'Calibri','Trebuchet MS','Gill Sans MT',Tahoma,sans-serif"

export default function LandingPage() {
  const router = useRouter()
  const [scrollY,  setScrollY]  = useState(0)
  const [visible,  setVisible]  = useState<Record<string, boolean>>({})
  const [logoUrl,  setLogoUrl]  = useState('/logo-midad.png')
  const refs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // جلب شعار المنصة ديناميكياً
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
    transform:  visible[id] ? 'translateY(0)' : 'translateY(18px)',
    transition: `all 650ms ease ${delay}s`,
  })

  // مكوّن الشعار
  const Logo = ({ h = 44 }: { h?: number }) => (
    <img
      src={logoUrl}
      alt="مِداد"
      height={h}
      style={{ height: h, width: 'auto', objectFit: 'contain', display: 'block' }}
      onError={e => { (e.target as HTMLImageElement).src = '/logo-midad.png' }}
    />
  )

  return (
    <div dir="rtl" style={{
      background: `
        radial-gradient(circle at top right, rgba(231,169,59,0.09), transparent 28%),
        radial-gradient(circle at top left,  rgba(192,57,43,0.05),  transparent 24%),
        ${C.bg}
      `,
      color: C.text,
      fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
      overflowX: 'hidden',
    }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{background:${C.bg}}
        a{text-decoration:none}
        @keyframes float {0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
        @keyframes pulse {0%,100%{opacity:1;}50%{opacity:0.45;}}
        @keyframes glow  {0%,100%{box-shadow:0 6px 22px rgba(37,99,235,0.38);}50%{box-shadow:0 12px 40px rgba(37,99,235,0.62);}}
        .container{max-width:1160px;margin:0 auto;padding:0 24px}
        .section{padding:92px 0}
        .glass{background:rgba(255,255,255,0.72);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid ${C.border};box-shadow:${C.shadow};}
        .btn{border:none;cursor:pointer;font-family:inherit;transition:transform .18s ease,box-shadow .18s ease,background .18s ease;}
        .btn:hover{transform:translateY(-2px)}
        .btn-primary{background:${C.primaryGrad};color:#fff;box-shadow:${C.shadowBtn};}
        .btn-primary:hover{box-shadow:0 18px 40px rgba(192,57,43,0.28)!important;}
        .btn-secondary{background:rgba(255,255,255,0.68);color:${C.text};border:1.5px solid ${C.borderStrong};}
        .btn-blue{background:${C.blueGrad};color:#fff;box-shadow:${C.shadowBlue};animation:glow 3s ease-in-out infinite;}
        .btn-blue:hover{box-shadow:0 14px 44px rgba(37,99,235,0.6)!important;}
        .card{background:${C.card};border:1px solid ${C.border};box-shadow:${C.shadow};transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease;}
        .card:hover{transform:translateY(-4px);border-color:${C.borderStrong};box-shadow:0 24px 54px rgba(60,24,24,0.10);}
        .nav-link{color:${C.sub};font-size:15px;font-weight:700;transition:color .18s ease;}
        .nav-link:hover{color:${C.red}}
        .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
        .hero-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:32px;align-items:center}
        .role-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
        .tiny-label{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:999px;background:rgba(192,57,43,0.08);border:1px solid rgba(192,57,43,0.16);color:${C.red};font-size:14px;font-weight:800;}
        .dot{width:8px;height:8px;border-radius:50%;background:${C.orange};display:inline-block;animation:pulse 2s ease-in-out infinite;}
        @media(max-width:980px){
          .hero-grid,.role-grid,.grid-3{grid-template-columns:1fr}
          .hide-mobile{display:none!important}
          .section{padding:68px 0}
        }
      `}</style>

      {/* ══ الشريط العلوي ══ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrollY > 24 ? 'rgba(247,242,234,0.94)' : 'rgba(247,242,234,0.75)',
        backdropFilter: 'blur(18px)',
        borderBottom: `1px solid ${scrollY > 24 ? C.border : 'transparent'}`,
        transition: 'all 0.3s',
      }}>
        <div className="container" style={{
          minHeight: 72, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          {/* الشعار */}
          <div onClick={() => router.push('/landing')} style={{ cursor:'pointer' }}>
            <Logo h={40} />
          </div>

          {/* الروابط — وسط */}
          <div className="hide-mobile" style={{ display:'flex', gap:28 }}>
            {[['#features','المزايا'],['#roles','لمن صُممت'],['#steps','كيف تعمل'],['#cta','ابدأ']].map(([href,label]) => (
              <a key={href} href={href} className="nav-link">{label}</a>
            ))}
          </div>

          {/* الأزرار */}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => router.push('/login')} className="btn btn-secondary"
              style={{ padding:'10px 18px', borderRadius:11, fontSize:14, fontWeight:800 }}>
              تسجيل الدخول
            </button>
            <button onClick={() => router.push('/login')} className="btn btn-blue"
              style={{ padding:'10px 20px', borderRadius:11, fontSize:14, fontWeight:900 }}>
              اطلب حساباً
            </button>
          </div>
        </div>
      </nav>

      {/* ══ Hero ══ */}
      <section className="section" style={{ paddingTop: 56 }}>
        <div className="container hero-grid">

          {/* النص — اليمين */}
          <div>
            <div className="tiny-label" style={{ marginBottom:24 }}>
              <span className="dot" />
              للمعلم والمتعلم في اللغة العربية 🇰🇼
            </div>

            {/* العنوان بخط كاليبري */}
            <h1 style={{
              fontSize: 'clamp(36px,4.8vw,64px)',
              fontFamily: CALIBRI,
              fontWeight: 900, lineHeight: 1.22,
              marginBottom: 20, maxWidth: 700,
            }}>
              منصة عربية ذكية
              <span style={{ color: C.red }}> تنظّم الشرح </span>
              وتدعم التدريب
              <span style={{ color: C.orange }}> وتوضّح التقدّم</span>
            </h1>

            {/* الوصف بكاليبري */}
            <p style={{
              fontSize: 17, fontFamily: CALIBRI,
              lineHeight: 1.95, color: C.sub,
              maxWidth: 620, marginBottom: 28,
            }}>
              مِداد منصة تعليمية متخصصة للغة العربية، تمكّن المعلم من إعداد الشرح والخطة والاختبار
              وورقة العمل، وتمنح المتعلم تدريباً أوضح وتجربة أكثر تفاعلاً ضمن مسار منظم.
            </p>

            {/* الأزرار */}
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:28 }}>
              <button onClick={() => router.push('/login')} className="btn btn-blue"
                style={{ padding:'15px 28px', borderRadius:14, fontSize:16, fontWeight:900 }}>
                ابدأ مع مِداد
              </button>
              <button onClick={() => router.push('/login')} className="btn btn-secondary"
                style={{ padding:'15px 24px', borderRadius:14, fontSize:15, fontWeight:800 }}>
                دخول المستخدمين
              </button>
            </div>

            {/* بطاقات الميزات */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {['شرح ذكي','اختبارات تفاعلية','خطة درس','تصدير Word وPDF'].map(item => (
                <div key={item} style={{
                  padding:'9px 14px', borderRadius:999,
                  background:'rgba(255,255,255,0.60)',
                  border:`1px solid ${C.border}`,
                  color: C.sub, fontSize:13, fontWeight:700,
                }}>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* البطاقة — اليسار */}
          <div>
            <div className="glass" style={{
              borderRadius:28, padding:28,
              minHeight:460,
              display:'flex', flexDirection:'column', justifyContent:'space-between',
              position:'relative',
            }}>
              <div style={{
                position:'absolute', inset:0, borderRadius:28, pointerEvents:'none',
                background:`
                  radial-gradient(circle at 20% 20%, rgba(231,169,59,0.10), transparent 26%),
                  radial-gradient(circle at 80% 30%, rgba(192,57,43,0.07), transparent 24%),
                  radial-gradient(circle at 50% 100%, rgba(224,122,36,0.07), transparent 26%)
                `,
              }} />

              {/* الشعار + الوصف */}
              <div style={{ position:'relative', zIndex:1, textAlign:'center', animation:'float 4s ease-in-out infinite' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
                  <Logo h={56} />
                </div>
              </div>

              {/* الأدوار */}
              <div style={{ position:'relative', zIndex:1, display:'grid', gap:11 }}>
                {[
                  { title:'المعلّم',  desc:'يولّد الشرح والخطط والأنشطة بسرعة أكبر.', color: C.red    },
                  { title:'المتعلّم', desc:'يتدرّب ويتابع تقدمه بصورة أبسط.',         color: C.orange },
                  { title:'المدرسة', desc:'تنظم المحتوى والاختبارات في بيئة واحدة.',   color: C.gold   },
                ].map(item => (
                  <div key={item.title} style={{
                    display:'flex', alignItems:'flex-start', gap:12,
                    padding:'13px 16px', borderRadius:14,
                    background:'rgba(255,255,255,0.62)',
                    border:`1px solid ${C.border}`,
                  }}>
                    <div style={{
                      width:11, height:11, borderRadius:'50%',
                      background: item.color, flexShrink:0, marginTop:5,
                    }} />
                    <div>
                      <div style={{ fontSize:14, fontWeight:900, color:C.text, marginBottom:3 }}>{item.title}</div>
                      <div style={{ fontSize:13, color:C.sub, lineHeight:1.75 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ المزايا ══ */}
      <section id="features" className="section" ref={setRef('features') as any}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:44, ...anim('features') }}>
            <h2 style={{ fontSize:36, fontWeight:900, fontFamily:CALIBRI, marginBottom:12 }}>
              ما الذي تقدّمه مِداد؟
            </h2>
            <p style={{ color:C.sub, fontSize:16, fontFamily:CALIBRI, maxWidth:580, margin:'0 auto', lineHeight:1.9 }}>
              المنصة تجمع بين إعداد المحتوى، التدريب، وقياس الأثر داخل تجربة عربية واحدة أكثر وضوحاً.
            </p>
          </div>
          <div className="grid-3">
            {[
              { icon:'💡', color:C.red,    title:'شرح وخطة وورقة عمل',    desc:'للمعلم أدوات جاهزة لإعداد الشرح والخطة والأنشطة التعليمية بطريقة أسرع وأكثر تنظيماً.'     },
              { icon:'🎯', color:C.orange, title:'اختبارات وتدريب تفاعلي', desc:'للمتعلم تجربة تدريب أقرب للفهم والتطبيق، لا مجرد قراءة جامدة أو حفظ مباشر.'               },
              { icon:'📊', color:C.gold,   title:'متابعة أوضح للأداء',    desc:'المحتوى والاختبارات والتغذية الراجعة تجتمع في مكان واحد لدعم القرار التعليمي.'               },
            ].map((item,i) => (
              <div key={item.title} id={`f-${i}`} ref={setRef(`f-${i}`) as any}
                className="card" style={{ borderRadius:24, padding:28, ...anim(`f-${i}`, i*0.08) }}>
                <div style={{
                  width:52, height:52, borderRadius:16, marginBottom:18,
                  background:`${item.color}14`, border:`1px solid ${item.color}28`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:26,
                }}>{item.icon}</div>
                <h3 style={{ fontSize:19, fontWeight:900, fontFamily:CALIBRI, marginBottom:10 }}>{item.title}</h3>
                <p style={{ color:C.sub, lineHeight:1.95, fontSize:15 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ كيف تعمل ══ */}
      <section id="steps" className="section" style={{ background:'rgba(255,255,255,0.28)' }} ref={setRef('steps') as any}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:44, ...anim('steps') }}>
            <h2 style={{ fontSize:36, fontWeight:900, fontFamily:CALIBRI, marginBottom:12 }}>كيف تعمل المنصة؟</h2>
            <p style={{ color:C.sub, fontSize:16 }}>مسار بسيط من المحتوى إلى التعلم ثم المتابعة.</p>
          </div>
          <div className="grid-3">
            {[
              ['١','📚','اختر المرحلة والدرس',   'المعلم أو الطالب يبدأ من المرحلة والصف والمحتوى المتاح له.'],
              ['٢','✨','ولّد المحتوى المناسب',   'شرح، اختبار، خطة، لعبة، أو ورقة عمل بحسب الحاجة التعليمية.'],
              ['٣','🎯','تابع النتيجة والأداء',   'تجربة أكثر وضوحاً في الاستخدام والتقييم والتغذية الراجعة.'],
            ].map(([n,icon,title,desc],i) => (
              <div key={title} id={`s-${i}`} ref={setRef(`s-${i}`) as any}
                style={{ textAlign:'center', padding:'8px', ...anim(`s-${i}`, i*0.1) }}>
                <div style={{
                  width:72, height:72, margin:'0 auto 18px', borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background:'rgba(255,255,255,0.74)',
                  border:`1.5px solid ${C.borderStrong}`,
                  boxShadow: C.shadow, fontSize:28,
                }}>
                  {icon}
                </div>
                <div style={{ fontSize:12, color:C.red, fontWeight:800, letterSpacing:2, marginBottom:8 }}>
                  STEP {n}
                </div>
                <h3 style={{ fontSize:19, fontWeight:900, fontFamily:CALIBRI, marginBottom:10 }}>{title}</h3>
                <p style={{ color:C.sub, fontSize:15, lineHeight:1.9, maxWidth:280, margin:'0 auto' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ لمن صُممت ══ */}
      <section id="roles" className="section" ref={setRef('roles') as any}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:44, ...anim('roles') }}>
            <h2 style={{ fontSize:36, fontWeight:900, fontFamily:CALIBRI, marginBottom:12 }}>صُممت لمن؟</h2>
            <p style={{ color:C.sub, fontSize:16, maxWidth:560, margin:'0 auto', lineHeight:1.9 }}>
              مِداد تخدم المعلم والمتعلم، وتتوسع لاحقاً لتشمل المدرسة كبيئة منظمة.
            </p>
          </div>
          <div className="role-grid">
            {[
              { title:'للمعلّم',  color:C.red,    desc:'إعداد أسرع للشرح، والخطة، والاختبار، مع مخرجات قابلة للتصدير والاستخدام مباشرة.' },
              { title:'للمتعلّم', color:C.orange, desc:'تجربة أكثر بساطة في الفهم والتدريب والتفاعل، ضمن محتوى موجّه ومرتب.' },
              { title:'للمدرسة', color:C.gold,   desc:'هيكل منظم لإدارة المحتوى، والاختبارات، ومتابعة الاستخدام عبر الأدوار.' },
            ].map((item,i) => (
              <div key={item.title} id={`r-${i}`} ref={setRef(`r-${i}`) as any}
                className="card" style={{ borderRadius:24, padding:26, ...anim(`r-${i}`, i*0.08) }}>
                <div style={{ width:28, height:28, borderRadius:999, background:item.color, marginBottom:16 }} />
                <h3 style={{ fontSize:22, fontWeight:900, fontFamily:CALIBRI, marginBottom:10 }}>{item.title}</h3>
                <p style={{ color:C.sub, lineHeight:1.95, fontSize:15, marginBottom:18 }}>{item.desc}</p>
                <div style={{ display:'grid', gap:10 }}>
                  {['واجهة أوضح','قيمة عملية مباشرة','تجربة قابلة للتوسع'].map(point => (
                    <div key={point} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:C.orange, flexShrink:0 }} />
                      <span style={{ color:C.text, fontSize:14 }}>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section id="cta" className="section" ref={setRef('cta') as any}>
        <div className="container">
          <div className="glass" style={{
            borderRadius:32, padding:'44px 28px',
            textAlign:'center', ...anim('cta'),
          }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:22, animation:'float 3.5s ease-in-out infinite' }}>
              <Logo h={64} />
            </div>
            <h2 style={{ fontSize:'clamp(28px,3.8vw,44px)', fontWeight:900, fontFamily:CALIBRI, marginBottom:14 }}>
              ابدأ رحلتك مع مِداد
            </h2>
            <p style={{ color:C.sub, fontSize:17, fontFamily:CALIBRI, lineHeight:1.95, maxWidth:640, margin:'0 auto 30px' }}>
            </p>
            <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
              <button onClick={() => router.push('/login')} className="btn btn-blue"
                style={{ padding:'16px 32px', borderRadius:14, fontSize:16, fontWeight:900 }}>
                أنشئ حسابك
              </button>
              <button onClick={() => router.push('/login')} className="btn btn-secondary"
                style={{ padding:'16px 26px', borderRadius:14, fontSize:15, fontWeight:800 }}>
                تسجيل الدخول
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ الفوتر ══ */}
      <footer style={{ borderTop:`1px solid ${C.border}`, padding:'28px 0 36px' }}>
        <div className="container" style={{
          display:'flex', justifyContent:'space-between',
          alignItems:'center', gap:18, flexWrap:'wrap',
        }}>
          <Logo h={36} />
          <div style={{ color:C.sub, fontSize:13 }}>الكويت 🇰🇼 • منصة تعليمية عربية • {new Date().getFullYear()}</div>
          <div style={{ display:'flex', gap:22, flexWrap:'wrap' }}>
            {[['#features','المزايا'],['#roles','لمن'],['#cta','ابدأ']].map(([href,label]) => (
              <a key={href} href={href} className="nav-link" style={{ fontSize:14 }}>{label}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}