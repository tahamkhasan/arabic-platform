'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// ── ألوان مِداد من الشعار ──────────────────────────────────
const C = {
  bg:         '#F5F0E8',   // كريمي عاجي
  bgDark:     '#0E0A0A',
  text:       '#1A1221',   // أسود دافئ
  sub:        '#6B5050',   // رمادي دافئ
  deep:       '#7B1A1A',   // عنابي
  red:        '#C0392B',   // أحمر
  orange:     '#E07020',   // برتقالي
  gold:       '#F4A420',   // ذهبي
  border:     'rgba(192,57,43,0.15)',
  card:       'rgba(192,57,43,0.05)',
  blue:       '#2563EB',   // زر CTA
  blueGlow:   '0 8px 32px rgba(37,99,235,0.45)',
  gradMain:   'linear-gradient(135deg,#C0392B,#E07020)',
  gradWarm:   'linear-gradient(135deg,#7B1A1A,#C0392B,#F4A420)',
  gradBlue:   'linear-gradient(135deg,#2563EB,#1D4ED8)',
}

export default function LandingPage() {
  const router = useRouter()
  const [scrollY, setScrollY] = useState(0)
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const refs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
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
    transform:  visible[id] ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
  })

  return (
    <div dir="rtl" style={{ background: C.bg, color: C.text, fontFamily:"'Segoe UI',Tahoma,Arial,sans-serif", overflowX:'hidden' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        @keyframes float  {0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
        @keyframes pulse  {0%,100%{opacity:1;}50%{opacity:0.4;}}
        @keyframes glow   {0%,100%{box-shadow:0 0 20px rgba(37,99,235,0.35);}50%{box-shadow:0 0 44px rgba(37,99,235,0.65);}}
        @keyframes shimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
        @keyframes spin   {from{transform:rotate(0deg);}to{transform:rotate(360deg);}}

        /* زر CTA أزرق متوهج */
        .btn-blue{
          transition:transform 0.18s,box-shadow 0.18s;
          box-shadow:0 6px 24px rgba(37,99,235,0.4);
        }
        .btn-blue:hover{transform:translateY(-3px)!important;box-shadow:0 14px 44px rgba(37,99,235,0.6)!important;}
        .btn-blue:active{transform:translateY(0)!important;}

        /* زر ثانوي */
        .btn-outline{transition:background 0.2s,border-color 0.2s,color 0.2s;}
        .btn-outline:hover{background:rgba(192,57,43,0.08)!important;border-color:rgba(192,57,43,0.4)!important;color:${C.red}!important;}

        /* البطاقات */
        .feat-card{transition:transform 0.25s,box-shadow 0.25s,border-color 0.25s;}
        .feat-card:hover{transform:translateY(-5px);box-shadow:0 12px 36px rgba(192,57,43,0.12)!important;border-color:rgba(192,57,43,0.3)!important;}

        .role-card{transition:transform 0.25s,box-shadow 0.25s;}
        .role-card:hover{transform:translateY(-4px);box-shadow:0 14px 40px rgba(192,57,43,0.15)!important;}

        .nav-a{transition:color 0.2s;text-decoration:none;}
        .nav-a:hover{color:${C.red}!important;}

        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-track{background:${C.bg};}
        ::-webkit-scrollbar-thumb{background:rgba(192,57,43,0.25);border-radius:3px;}
        ::-webkit-scrollbar-thumb:hover{background:rgba(192,57,43,0.45);}

        @media(max-width:768px){
          .hide-mobile{display:none!important;}
          .hero-btns{flex-direction:column!important;align-items:stretch!important;}
          .grid-3{grid-template-columns:1fr!important;}
          .grid-4{grid-template-columns:1fr 1fr!important;}
          .steps-grid{grid-template-columns:1fr!important;}
          .nav-links{display:none!important;}
          .footer-inner{flex-direction:column!important;align-items:center!important;text-align:center!important;}
        }
      `}</style>

      {/* ══ الشريط العلوي ══ */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        background: scrollY > 50
          ? 'rgba(245,240,232,0.97)'
          : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 50 ? `1px solid ${C.border}` : 'none',
        padding:'0 48px', height:66,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        transition:'all 0.3s',
      }}>
        {/* الشعار */}
        <div style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }} onClick={() => router.push('/')}>
          <img src="/logo-midad.png" alt="مِداد" style={{ height:44, width:'auto', objectFit:'contain', filter:'drop-shadow(0 2px 8px rgba(192,57,43,0.25))' }} />
        </div>

        {/* الروابط */}
        <div className="nav-links" style={{ display:'flex', gap:32, position:'absolute', left:'50%', transform:'translateX(-50%)' }}>
          {[['#features','المزايا'],['#how','كيف تعمل'],['#who','لمن'],['#midad','لماذا مِداد؟']].map(([href,label]) => (
            <a key={href} href={href} className="nav-a" style={{ fontSize:15, color: C.sub, fontWeight:600, whiteSpace:'nowrap' }}>{label}</a>
          ))}
        </div>

        {/* الأزرار */}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => router.push('/login')} className="btn-outline"
            style={{ padding:'9px 20px', borderRadius:10, border:`1.5px solid ${C.border}`, background:'transparent', color: C.sub, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            تسجيل الدخول
          </button>
          <button onClick={() => router.push('/login')} className="btn-blue"
            style={{ padding:'9px 24px', borderRadius:10, border:'none', background: C.gradBlue, color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
            ابدأ الآن ←
          </button>
        </div>
      </nav>

      {/* ══ ① Hero ══ */}
      <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'120px 24px 80px', textAlign:'center', position:'relative', overflow:'hidden' }}>

        {/* خلفية ناعمة */}
        <div style={{ position:'absolute', inset:0, zIndex:0 }}>
          {/* صورة ضبابية جداً */}
          <div style={{
            position:'absolute', inset:0,
            backgroundImage:`url(https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1600&q=50&auto=format&fit=crop)`,
            backgroundSize:'cover', backgroundPosition:'center',
            filter:'brightness(0.06) saturate(0.2)',
            transform:`translateY(${scrollY*0.2}px)`,
          }} />
          {/* تدرج كريمي */}
          <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 50% 40%, rgba(224,112,32,0.06) 0%, transparent 65%)` }} />
          {/* دوائر ضوئية دافئة */}
          <div style={{ position:'absolute', top:'20%', left:'20%', width:500, height:500, borderRadius:'50%', background:'rgba(192,57,43,0.04)', filter:'blur(120px)' }} />
          <div style={{ position:'absolute', bottom:'20%', right:'15%', width:400, height:400, borderRadius:'50%', background:'rgba(244,164,32,0.04)', filter:'blur(100px)' }} />
        </div>

        <div style={{ position:'relative', zIndex:2, maxWidth:800, width:'100%', display:'flex', flexDirection:'column', alignItems:'center' }}>

          {/* شارة */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'7px 20px', borderRadius:24, background:'rgba(192,57,43,0.08)', border:`1px solid rgba(192,57,43,0.2)`, marginBottom:30, fontSize:14, color: C.red, fontWeight:700 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background: C.orange, display:'inline-block', animation:'pulse 2s ease-in-out infinite', flexShrink:0 }} />
            للمعلّم والمتعلّم في اللغة العربية 🇰🇼
          </div>

          {/* العنوان */}
          <h1 style={{ fontSize:'clamp(40px,5.5vw,72px)', fontWeight:900, lineHeight:1.2, marginBottom:22, color: C.text, textAlign:'center' }}>
            تعلّم، علِّم،{' '}
            <span style={{
              background: C.gradWarm,
              backgroundSize:'200% auto',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              animation:'shimmer 4s linear infinite',
            }}>
              وارتقِ بالعربية.
            </span>
          </h1>

          {/* الوصف */}
          <p style={{ fontSize:18, color: C.sub, lineHeight:1.9, maxWidth:560, margin:'0 auto 42px', textAlign:'center' }}>
            منصة عربية ذكية تجمع الأصالة والإبداع، وتدعم المعلّم والمتعلّم في شرح الدروس، التدريب التفاعلي، وقياس التقدّم.
          </p>

          {/* الأزرار */}
          <div className="hero-btns" style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', marginBottom:48 }}>
            <button onClick={() => router.push('/login')} className="btn-blue"
              style={{ padding:'17px 52px', borderRadius:14, border:'none', background: C.gradBlue, color:'#fff', fontSize:17, fontWeight:900, cursor:'pointer', fontFamily:'inherit', animation:'glow 3s ease-in-out infinite' }}>
              ابدأ الآن
            </button>
            <button onClick={() => router.push('/login')} className="btn-outline"
              style={{ padding:'17px 38px', borderRadius:14, border:`1.5px solid ${C.border}`, background:'transparent', color: C.sub, fontSize:16, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              اطلب تجربة ←
            </button>
          </div>

          {/* سطر الثقة */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flexWrap:'wrap', gap:4 }}>
            {['شرح ذكي','اختبارات تفاعلية','متابعة أداء','تصدير عملي للمحتوى'].map((t,i,arr) => (
              <div key={i} style={{ display:'flex', alignItems:'center' }}>
                <span style={{ fontSize:14, color: C.sub, fontWeight:600, padding:'0 12px' }}>{t}</span>
                {i < arr.length-1 && <span style={{ color:`${C.orange}60`, fontSize:18 }}>·</span>}
              </div>
            ))}
          </div>

          {/* شعار عائم */}
          <div style={{ marginTop:56, animation:'float 4s ease-in-out infinite' }}>
            <img src="/logo-midad.png" alt="مِداد" style={{ height:90, width:'auto', objectFit:'contain', filter:'drop-shadow(0 8px 20px rgba(192,57,43,0.3))' }} />
          </div>
        </div>
      </section>

      {/* فاصل زخرفي */}
      <div style={{ height:2, background:`linear-gradient(90deg,transparent,${C.orange}40,${C.gold}60,${C.orange}40,transparent)` }} />

      {/* ══ ② المزايا ══ */}
      <section id="features" ref={setRef('features') as any} style={{ padding:'100px 24px', background: C.bg }}>
        <div style={{ maxWidth:1060, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:60, ...anim('features') }}>
            <h2 style={{ fontSize:38, fontWeight:900, color: C.text, marginBottom:14 }}>ماذا تقدّم مِداد؟</h2>
            <p style={{ fontSize:16, color: C.sub, maxWidth:440, margin:'0 auto' }}>3 محاور أساسية تخدم المعلّم والمتعلّم في العربية</p>
          </div>

          <div className="grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:22 }}>
            {[
              { icon:'💡', color: C.red,    num:'01', title:'شرح ذكي للدروس',        desc:'نولّد للمعلم شرحاً منظماً، وأوراق عمل، وخططاً، ومحتوى قابلاً للاستخدام داخل الحصة وخارجها.' },
              { icon:'🎯', color: C.orange, num:'02', title:'تدريب واختبارات',        desc:'يتدرّب المتعلّم عبر أسئلة تفاعلية، اختبارات قصيرة، ومهام تساعد على ترسيخ الفهم لا حفظ الإجابة.' },
              { icon:'📊', color: C.gold,   num:'03', title:'متابعة أوضح للتقدّم',   desc:'تمنح مِداد المعلم والمتعلم رؤية أوضح للأداء، من خلال التقييم والتغذية الراجعة ومتابعة أثر التعلم.' },
            ].map((f,i) => (
              <div key={i} id={`feat-${i}`} ref={setRef(`feat-${i}`) as any} className="feat-card"
                style={{ padding:'32px 26px', borderRadius:20, background:`${f.color}06`, border:`1px solid ${f.color}20`, boxShadow:'0 2px 12px rgba(0,0,0,0.04)', ...anim(`feat-${i}`, i*0.1) }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
                  <div style={{ width:54, height:54, borderRadius:14, background:`${f.color}15`, border:`1px solid ${f.color}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>{f.icon}</div>
                  <span style={{ fontSize:13, fontWeight:800, color:`${f.color}40`, letterSpacing:2 }}>{f.num}</span>
                </div>
                <h3 style={{ fontSize:19, fontWeight:800, color: C.text, marginBottom:12, lineHeight:1.4 }}>{f.title}</h3>
                <p style={{ fontSize:15, color: C.sub, lineHeight:1.85 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* فاصل */}
      <div style={{ height:1, background:`linear-gradient(90deg,transparent,${C.border},transparent)` }} />

      {/* ══ ③ كيف تعمل ══ */}
      <section id="how" ref={setRef('how') as any} style={{ padding:'100px 24px', background:'rgba(192,57,43,0.025)' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:60, ...anim('how') }}>
            <h2 style={{ fontSize:38, fontWeight:900, color: C.text, marginBottom:14 }}>كيف تعمل مِداد؟</h2>
            <p style={{ fontSize:16, color: C.sub }}>3 خطوات من المحتوى إلى النتيجة</p>
          </div>

          <div className="steps-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:40, position:'relative' }}>
            <div className="hide-mobile" style={{ position:'absolute', top:36, right:'17%', left:'17%', height:1, background:`linear-gradient(90deg,transparent,${C.orange}30,${C.orange}30,transparent)`, zIndex:0 }} />
            {[
              { n:'١', icon:'📚', title:'اختر المادة والدرس',   desc:'يختار المعلّم المادة والدرس أو يرفع المحتوى العلمي مباشرة في المنصة.' },
              { n:'٢', icon:'✨', title:'توليد فوري بالذكاء',   desc:'تُنشئ مِداد شرحاً، نشاطاً، اختباراً، أو خطة درس بحسب الحاجة — في ثوانٍ.' },
              { n:'٣', icon:'🎯', title:'تفاعل ومتابعة',        desc:'يتفاعل المتعلّم مع المحتوى ويحصل على تدريب وتغذية راجعة أوضح وأسرع.' },
            ].map((s,i) => (
              <div key={i} id={`step-${i}`} ref={setRef(`step-${i}`) as any}
                style={{ textAlign:'center', position:'relative', zIndex:1, ...anim(`step-${i}`, i*0.15) }}>
                <div style={{ width:72, height:72, borderRadius:'50%', margin:'0 auto 20px', background:`rgba(192,57,43,0.08)`, border:`1.5px solid rgba(192,57,43,0.2)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:30 }}>{s.icon}</div>
                <div style={{ fontSize:12, fontWeight:800, color: C.orange, letterSpacing:3, marginBottom:10 }}>STEP {s.n}</div>
                <h3 style={{ fontSize:17, fontWeight:800, color: C.text, marginBottom:10, lineHeight:1.4 }}>{s.title}</h3>
                <p style={{ fontSize:15, color: C.sub, lineHeight:1.8 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* فاصل */}
      <div style={{ height:1, background:`linear-gradient(90deg,transparent,${C.border},transparent)` }} />

      {/* ══ ④ لمن صُممت ══ */}
      <section id="who" ref={setRef('who') as any} style={{ padding:'100px 24px', background: C.bg }}>
        <div style={{ maxWidth:980, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:60, ...anim('who') }}>
            <h2 style={{ fontSize:38, fontWeight:900, color: C.text, marginBottom:14 }}>مِداد صُممت لمن؟</h2>
            <p style={{ fontSize:16, color: C.sub, maxWidth:420, margin:'0 auto' }}>منصة مرنة تخدم كل أطراف العملية التعليمية</p>
          </div>

          <div className="grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
            {[
              { icon:'👨‍🏫', title:'المعلّم',          color: C.red,
                img:'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=500&q=70&auto=format&fit=crop',
                desc:'الذي يريد اختصار وقت التحضير ورفع جودة الشرح وإدارة طلابه في مكان واحد.',
                points:['شرح وأوراق عمل فورية','إرسال مهام ومتابعة الإجابات','تحليلات أداء واضحة'] },
              { icon:'👨‍🎓', title:'المتعلّم',         color: C.orange,
                img:'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=500&q=70&auto=format&fit=crop',
                desc:'الذي يحتاج تدريباً أوضح ومساراً أبسط في تعلم العربية بطريقة تفاعلية.',
                points:['شرح مخصص لدروسه','اختبارات تفاعلية وبطاقات حفظ','تتبع درجاته وتقدمه'] },
              { icon:'🏫',  title:'الجهة التعليمية', color: C.gold,
                img:'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=500&q=70&auto=format&fit=crop',
                desc:'التي تبحث عن تنظيم المحتوى والاختبارات والمتابعة في بيئة واحدة متكاملة.',
                points:['إدارة المعلمين والطلاب','تقارير أداء شاملة','محتوى موحّد ومنظم'] },
            ].map((r,i) => (
              <div key={i} id={`who-${i}`} ref={setRef(`who-${i}`) as any} className="role-card"
                style={{ borderRadius:20, overflow:'hidden', border:`1px solid ${r.color}20`, boxShadow:'0 4px 20px rgba(0,0,0,0.06)', ...anim(`who-${i}`, i*0.12) }}>
                <div style={{ height:170, position:'relative', overflow:'hidden' }}>
                  <img src={r.img} alt={r.title} style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.55) saturate(0.7)' }} />
                  <div style={{ position:'absolute', inset:0, background:`linear-gradient(to top,${C.bg} 0%,transparent 60%)` }} />
                  <div style={{ position:'absolute', bottom:18, right:18, display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:28 }}>{r.icon}</span>
                    <span style={{ fontSize:18, fontWeight:900, color: C.text }}>لل{r.title}</span>
                  </div>
                </div>
                <div style={{ padding:'20px 22px 24px', background: C.bg }}>
                  <p style={{ fontSize:14, color: C.sub, lineHeight:1.8, marginBottom:16 }}>{r.desc}</p>
                  {r.points.map((p,j) => (
                    <div key={j} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background: r.color, flexShrink:0 }} />
                      <span style={{ fontSize:14, color: C.text, opacity:0.7 }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* فاصل */}
      <div style={{ height:1, background:`linear-gradient(90deg,transparent,${C.border},transparent)` }} />

      {/* ══ ⑤ لماذا مِداد ══ */}
      <section id="midad" ref={setRef('midad') as any} style={{ padding:'100px 24px', background:'rgba(192,57,43,0.025)' }}>
        <div style={{ maxWidth:820, margin:'0 auto', textAlign:'center' }}>
          <div style={{ ...anim('midad') }}>
            <h2 style={{ fontSize:38, fontWeight:900, color: C.text, marginBottom:20 }}>لماذا مِداد؟</h2>
            <p style={{ fontSize:17, color: C.sub, lineHeight:1.9, maxWidth:520, margin:'0 auto 52px' }}>
              مِداد اسم يجمع المعلّم والمتعلّم، ويعبّر عن دعمٍ يدوم، وأصالةٍ تمتزج بالإبداع، لينتهي إلى درايةٍ أعمق باللغة العربية.
            </p>
          </div>

          <div className="grid-4" id="letters" ref={setRef('letters') as any}
            style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, maxWidth:700, margin:'0 auto' }}>
            {[
              { letter:'م', words:'معلّم · متعلّم', color: C.deep   },
              { letter:'د', words:'دعم · ديمومة',   color: C.red    },
              { letter:'ا', words:'أصالة · إبداع',  color: C.orange },
              { letter:'د', words:'دراية · دقة',    color: C.gold   },
            ].map((h,i) => (
              <div key={i} style={{ padding:'26px 16px', borderRadius:18, background:`${h.color}08`, border:`1.5px solid ${h.color}25`, textAlign:'center', ...anim('letters', i*0.1) }}>
                <div style={{ fontSize:44, fontWeight:900, color: h.color, marginBottom:10, lineHeight:1 }}>{h.letter}</div>
                <div style={{ fontSize:13, color: C.sub, lineHeight:1.7, fontWeight:600 }}>{h.words}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ⑥ الدعوة الأخيرة ══ */}
      <section id="cta" ref={setRef('cta') as any} style={{ padding:'120px 24px', textAlign:'center', position:'relative', overflow:'hidden', background: C.bg }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center, rgba(192,57,43,0.05) 0%, transparent 65%)' }} />

        <div style={{ position:'relative', zIndex:2, maxWidth:640, margin:'0 auto', ...anim('cta') }}>
          <div style={{ margin:'0 auto 28px', animation:'float 3.5s ease-in-out infinite' }}>
            <img src="/logo-midad.png" alt="مِداد" style={{ height:100, width:'auto', objectFit:'contain', filter:'drop-shadow(0 10px 24px rgba(192,57,43,0.35))' }} />
          </div>

          <h2 style={{ fontSize:42, fontWeight:900, color: C.text, marginBottom:16, lineHeight:1.3 }}>
            ابدأ رحلتك مع{' '}
            <span style={{ background: C.gradWarm, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              مِداد
            </span>
          </h2>

          <p style={{ fontSize:17, color: C.sub, lineHeight:1.9, marginBottom:44, maxWidth:520, margin:'0 auto 44px' }}>
            سواء كنت معلماً تبحث عن شرح أقوى، أو متعلماً يريد تدريباً أوضح، تمنحك مِداد بيئة عربية ذكية تنظّم التعلم وتدعم التقدم خطوة بخطوة.
          </p>

          <div className="hero-btns" style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => router.push('/login')} className="btn-blue"
              style={{ padding:'17px 56px', borderRadius:14, border:'none', background: C.gradBlue, color:'#fff', fontSize:17, fontWeight:900, cursor:'pointer', fontFamily:'inherit', boxShadow:`0 10px 36px rgba(37,99,235,0.45)` }}>
              أنشئ حسابك
            </button>
            <button onClick={() => router.push('/login')} className="btn-outline"
              style={{ padding:'17px 40px', borderRadius:14, border:`1.5px solid ${C.border}`, background:'transparent', color: C.sub, fontSize:16, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              جرّب مِداد الآن ←
            </button>
          </div>
        </div>
      </section>

      {/* ══ الفوتر ══ */}
      <div style={{ height:2, background:`linear-gradient(90deg,transparent,${C.orange}40,${C.gold}60,${C.orange}40,transparent)` }} />
      <footer style={{ padding:'32px 48px', background: C.bg, borderTop:`1px solid ${C.border}` }}>
        <div className="footer-inner" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <img src="/logo-midad.png" alt="مِداد" style={{ height:34, width:'auto', objectFit:'contain' }} />
            <div>
              <div style={{ fontSize:15, fontWeight:800, color: C.text }}>مِداد</div>
              <div style={{ fontSize:11, color: C.sub }}>العربية بذكاء</div>
            </div>
          </div>
          <p style={{ fontSize:13, color: C.sub }}>الكويت 🇰🇼 • جميع الحقوق محفوظة {new Date().getFullYear()}</p>
          <div style={{ display:'flex', gap:24 }}>
            {[['#features','المزايا'],['#how','كيف تعمل'],['#who','لمن']].map(([href,label]) => (
              <a key={href} href={href} className="nav-a" style={{ fontSize:13, color: C.sub, fontWeight:600 }}>{label}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}