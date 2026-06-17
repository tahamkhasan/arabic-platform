'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

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
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) setVisible(v => ({ ...v, [e.target.id]: true }))
      }),
      { threshold: 0.1 }
    )
    Object.values(refs.current).forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  function setRef(id: string) {
    return (el: HTMLElement | null) => { refs.current[id] = el }
  }

  const anim = (id: string, delay = 0): React.CSSProperties => ({
    opacity:    visible[id] ? 1 : 0,
    transform:  visible[id] ? 'translateY(0)' : 'translateY(28px)',
    transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
  })

  return (
    <div dir="rtl" style={{ background:'#07060f', color:'#e2e8f0', fontFamily:"'Segoe UI',Tahoma,Arial,sans-serif", overflowX:'hidden' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        @keyframes float  {0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
        @keyframes pulse  {0%,100%{opacity:1;}50%{opacity:0.4;}}
        @keyframes glow   {0%,100%{box-shadow:0 0 24px rgba(29,111,232,0.3);}50%{box-shadow:0 0 48px rgba(29,111,232,0.6);}}
        @keyframes spin   {from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes shimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
        .btn-primary{transition:transform 0.18s,box-shadow 0.18s;}
        .btn-primary:hover{transform:translateY(-3px)!important;box-shadow:0 14px 40px rgba(29,111,232,0.5)!important;}
        .btn-primary:active{transform:translateY(0)!important;}
        .btn-ghost{transition:border-color 0.2s,color 0.2s,background 0.2s;}
        .btn-ghost:hover{border-color:rgba(255,255,255,0.25)!important;color:#f1f5f9!important;background:rgba(255,255,255,0.05)!important;}
        .feat-card{transition:transform 0.25s,border-color 0.25s,background 0.25s;}
        .feat-card:hover{transform:translateY(-6px);border-color:rgba(29,111,232,0.4)!important;background:rgba(29,111,232,0.06)!important;}
        .role-card{transition:transform 0.25s,box-shadow 0.25s;}
        .role-card:hover{transform:translateY(-4px);box-shadow:0 12px 36px rgba(0,0,0,0.4)!important;}
        .nav-a{transition:color 0.2s;text-decoration:none;}
        .nav-a:hover{color:#93c5fd!important;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-track{background:#07060f;}
        ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:3px;}
        ::-webkit-scrollbar-thumb:hover{background:#334155;}
        @media(max-width:768px){
          .hide-mobile{display:none!important;}
          .hero-btns{flex-direction:column!important;align-items:center!important;}
          .grid-3{grid-template-columns:1fr!important;}
          .grid-2{grid-template-columns:1fr!important;}
          .steps-grid{grid-template-columns:1fr!important;}
          .nav-links{display:none!important;}
        }
      `}</style>

      {/* ══ الشريط العلوي ══ */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        background:  scrollY > 50 ? 'rgba(7,6,15,0.97)' : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
        borderBottom:   scrollY > 50 ? '1px solid rgba(255,255,255,0.06)' : 'none',
        padding:'0 48px', height:66,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        transition:'all 0.3s',
      }}>
        {/* الشعار */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{
            width:40, height:40, borderRadius:11,
            background:'linear-gradient(135deg,#1d6fe8,#7c3aed)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, flexShrink:0,
          }}>م</div>
          <div>
            <div style={{ fontSize:18, fontWeight:900, color:'#f1f5f9', lineHeight:1 }}>مِداد</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:600, lineHeight:1, marginTop:2 }}>العربية بذكاء</div>
          </div>
        </div>

        {/* الروابط */}
        <div className="nav-links" style={{ display:'flex', gap:32, alignItems:'center', position:'absolute', left:'50%', transform:'translateX(-50%)' }}>
          {[['#features','المزايا'],['#how','كيف تعمل'],['#who','لمن صُممت'],['#midad','لماذا مِداد؟']].map(([href,label]) => (
            <a key={href} href={href} className="nav-a" style={{ fontSize:15, color:'rgba(255,255,255,0.5)', fontWeight:600, whiteSpace:'nowrap' }}>{label}</a>
          ))}
        </div>

        {/* الأزرار */}
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button onClick={() => router.push('/login')} className="btn-ghost"
            style={{ padding:'9px 20px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.1)', background:'transparent', color:'rgba(255,255,255,0.6)', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
            تسجيل الدخول
          </button>
          <button onClick={() => router.push('/login')} className="btn-primary"
            style={{ padding:'9px 22px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#1d6fe8,#7c3aed)', color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
            ابدأ الآن ←
          </button>
        </div>
      </nav>

      {/* ══ ① القسم الافتتاحي ══ */}
      <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'120px 24px 80px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        {/* الخلفية */}
        <div style={{ position:'absolute', inset:0, zIndex:0 }}>
          <div style={{
            position:'absolute', inset:0,
            backgroundImage:`url(https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1600&q=55&auto=format&fit=crop)`,
            backgroundSize:'cover', backgroundPosition:'center',
            filter:'brightness(0.08) saturate(0.3)',
            transform:`translateY(${scrollY * 0.2}px)`,
          }} />
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 40%, rgba(29,111,232,0.08) 0%, transparent 65%)' }} />
          <div style={{ position:'absolute', top:'15%', left:'50%', transform:'translateX(-50%)', width:700, height:700, borderRadius:'50%', background:'rgba(29,111,232,0.04)', filter:'blur(130px)' }} />
        </div>

        <div style={{ position:'relative', zIndex:2, maxWidth:780, width:'100%', display:'flex', flexDirection:'column', alignItems:'center' }}>

          {/* شارة */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'7px 20px', borderRadius:24, background:'rgba(29,111,232,0.1)', border:'1px solid rgba(29,111,232,0.25)', marginBottom:28, fontSize:14, color:'#60a5fa', fontWeight:700 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#3b82f6', display:'inline-block', animation:'pulse 2s ease-in-out infinite', flexShrink:0 }} />
            للمعلّم والمتعلّم في اللغة العربية 🇰🇼
          </div>

          {/* العنوان الرئيسي */}
          <h1 style={{ fontSize:'clamp(40px,5.5vw,72px)', fontWeight:900, lineHeight:1.2, marginBottom:22, color:'#f8fafc', textAlign:'center' }}>
            تعلّم، علِّم،{' '}
            <span style={{
              background:'linear-gradient(135deg,#3b82f6,#7c3aed,#f59e0b)',
              backgroundSize:'200% auto',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              animation:'shimmer 4s linear infinite',
            }}>
              وارتقِ بالعربية.
            </span>
          </h1>

          {/* النص التعريفي */}
          <p style={{ fontSize:18, color:'rgba(255,255,255,0.5)', lineHeight:1.9, maxWidth:560, margin:'0 auto 40px', textAlign:'center' }}>
            منصة عربية ذكية تجمع الأصالة والإبداع، وتدعم المعلّم والمتعلّم في شرح الدروس، التدريب التفاعلي، وقياس التقدّم.
          </p>

          {/* الأزرار */}
          <div className="hero-btns" style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', marginBottom:48 }}>
            <button onClick={() => router.push('/login')} className="btn-primary"
              style={{ padding:'16px 48px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#1d6fe8,#7c3aed)', color:'#fff', fontSize:17, fontWeight:900, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 8px 32px rgba(29,111,232,0.4)', animation:'glow 3s ease-in-out infinite' }}>
              ابدأ الآن
            </button>
            <button onClick={() => router.push('/login')} className="btn-ghost"
              style={{ padding:'16px 36px', borderRadius:14, border:'1.5px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.03)', color:'rgba(255,255,255,0.6)', fontSize:16, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              اطلب تجربة ←
            </button>
          </div>

          {/* سطر الثقة */}
          <div style={{ display:'flex', gap:0, alignItems:'center', justifyContent:'center', flexWrap:'wrap' }}>
            {['شرح ذكي','اختبارات تفاعلية','متابعة أداء','تصدير عملي للمحتوى'].map((t,i,arr) => (
              <div key={i} style={{ display:'flex', alignItems:'center' }}>
                <span style={{ fontSize:14, color:'rgba(255,255,255,0.35)', fontWeight:600, padding:'0 14px' }}>{t}</span>
                {i < arr.length - 1 && <span style={{ color:'rgba(255,255,255,0.12)', fontSize:18 }}>·</span>}
              </div>
            ))}
          </div>

          {/* الأيقونة العائمة */}
          <div style={{ marginTop:56, fontSize:66, animation:'float 4s ease-in-out infinite', lineHeight:1 }}>م</div>
        </div>
      </section>

      {/* ══ ② المزايا الرئيسية — 3 بطاقات فقط ══ */}
      <section id="features" ref={setRef('features') as any} style={{ padding:'100px 24px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth:1060, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:60, ...anim('features') }}>
            <h2 style={{ fontSize:38, fontWeight:900, color:'#f1f5f9', marginBottom:14 }}>ماذا تقدّم مِداد؟</h2>
            <p style={{ fontSize:16, color:'rgba(255,255,255,0.4)', maxWidth:460, margin:'0 auto' }}>
              3 محاور أساسية تخدم المعلّم والمتعلّم في العربية
            </p>
          </div>

          <div className="grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:22 }}>
            {[
              {
                icon:'💡', color:'#3b82f6', num:'01',
                title:'شرح ذكي للدروس',
                desc:'نولّد للمعلم شرحاً منظماً، وأوراق عمل، وخططاً، ومحتوى قابلاً للاستخدام داخل الحصة وخارجها — من المادة العلمية مباشرة.',
              },
              {
                icon:'🎯', color:'#8b5cf6', num:'02',
                title:'تدريب واختبارات',
                desc:'يتدرّب المتعلّم على العربية عبر أسئلة تفاعلية، اختبارات قصيرة، ومهام تساعد على ترسيخ الفهم لا حفظ الإجابة فقط.',
              },
              {
                icon:'📊', color:'#f59e0b', num:'03',
                title:'متابعة أوضح للتقدّم',
                desc:'تمنح مِداد المعلم والمتعلم رؤية أوضح للأداء، من خلال التقييم، التغذية الراجعة، ومتابعة أثر التعلم بمرور الوقت.',
              },
            ].map((f,i) => (
              <div key={i} id={`feat-${i}`} ref={setRef(`feat-${i}`) as any} className="feat-card"
                style={{ padding:'32px 26px', borderRadius:20, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', ...anim(`feat-${i}`, i*0.1) }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
                  <div style={{ width:54, height:54, borderRadius:14, background:`${f.color}18`, border:`1px solid ${f.color}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>{f.icon}</div>
                  <span style={{ fontSize:13, fontWeight:800, color:'rgba(255,255,255,0.1)', letterSpacing:2 }}>{f.num}</span>
                </div>
                <h3 style={{ fontSize:19, fontWeight:800, color:'#f1f5f9', marginBottom:12, lineHeight:1.4 }}>{f.title}</h3>
                <p style={{ fontSize:15, color:'rgba(255,255,255,0.45)', lineHeight:1.85 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ③ كيف تعمل مِداد ══ */}
      <section id="how" ref={setRef('how') as any} style={{ padding:'100px 24px', background:'rgba(255,255,255,0.015)', borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:60, ...anim('how') }}>
            <h2 style={{ fontSize:38, fontWeight:900, color:'#f1f5f9', marginBottom:14 }}>كيف تعمل مِداد؟</h2>
            <p style={{ fontSize:16, color:'rgba(255,255,255,0.4)' }}>3 خطوات من المحتوى إلى النتيجة</p>
          </div>

          <div className="steps-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:40, position:'relative' }}>
            {/* خط التوصيل */}
            <div className="hide-mobile" style={{ position:'absolute', top:36, right:'17%', left:'17%', height:1, background:'linear-gradient(90deg,transparent,rgba(29,111,232,0.3),rgba(29,111,232,0.3),transparent)', zIndex:0 }} />

            {[
              { n:'١', icon:'📚', title:'اختر المادة والدرس', desc:'يختار المعلّم المادة والدرس أو يرفع المحتوى العلمي مباشرة في المنصة.' },
              { n:'٢', icon:'✨', title:'توليد فوري بالذكاء', desc:'تُنشئ مِداد شرحاً، نشاطاً، اختباراً، أو خطة درس بحسب الحاجة — في ثوانٍ.' },
              { n:'٣', icon:'🎯', title:'تفاعل ومتابعة', desc:'يتفاعل المتعلّم مع المحتوى ويحصل على تدريب وتغذية راجعة أوضح وأسرع.' },
            ].map((s,i) => (
              <div key={i} id={`step-${i}`} ref={setRef(`step-${i}`) as any}
                style={{ textAlign:'center', position:'relative', zIndex:1, ...anim(`step-${i}`, i*0.15) }}>
                <div style={{ width:72, height:72, borderRadius:'50%', margin:'0 auto 20px', background:'linear-gradient(135deg,rgba(29,111,232,0.15),rgba(124,58,237,0.15))', border:'1px solid rgba(29,111,232,0.22)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:30 }}>{s.icon}</span>
                </div>
                <div style={{ fontSize:12, fontWeight:800, color:'#3b82f6', letterSpacing:3, marginBottom:10 }}>STEP {s.n}</div>
                <h3 style={{ fontSize:17, fontWeight:800, color:'#f1f5f9', marginBottom:10, lineHeight:1.4 }}>{s.title}</h3>
                <p style={{ fontSize:15, color:'rgba(255,255,255,0.4)', lineHeight:1.8 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ④ لمن صُممت ══ */}
      <section id="who" ref={setRef('who') as any} style={{ padding:'100px 24px' }}>
        <div style={{ maxWidth:980, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:60, ...anim('who') }}>
            <h2 style={{ fontSize:38, fontWeight:900, color:'#f1f5f9', marginBottom:14 }}>مِداد صُممت لمن؟</h2>
            <p style={{ fontSize:16, color:'rgba(255,255,255,0.4)', maxWidth:440, margin:'0 auto' }}>منصة مرنة تخدم كل أطراف العملية التعليمية</p>
          </div>

          <div className="grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
            {[
              {
                icon:'👨‍🏫', title:'المعلّم',
                img:'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=500&q=70&auto=format&fit=crop',
                color:'#3b82f6',
                desc:'الذي يريد اختصار وقت التحضير ورفع جودة الشرح وإدارة طلابه في مكان واحد.',
                points:['شرح وأوراق عمل فورية','إرسال مهام ومتابعة الإجابات','تحليلات أداء واضحة'],
              },
              {
                icon:'👨‍🎓', title:'المتعلّم',
                img:'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=500&q=70&auto=format&fit=crop',
                color:'#8b5cf6',
                desc:'الذي يحتاج تدريباً أوضح ومساراً أبسط في تعلم العربية بطريقة تفاعلية وممتعة.',
                points:['شرح مخصص لدروسه','اختبارات تفاعلية وبطاقات حفظ','تتبع درجاته وتقدمه'],
              },
              {
                icon:'🏫', title:'الجهة التعليمية',
                img:'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=500&q=70&auto=format&fit=crop',
                color:'#f59e0b',
                desc:'التي تبحث عن تنظيم المحتوى والاختبارات والمتابعة في بيئة واحدة متكاملة.',
                points:['إدارة المعلمين والطلاب','تقارير أداء شاملة','محتوى موحّد ومنظم'],
              },
            ].map((r,i) => (
              <div key={i} id={`who-${i}`} ref={setRef(`who-${i}`) as any} className="role-card"
                style={{ borderRadius:20, overflow:'hidden', border:`1px solid ${r.color}18`, boxShadow:'0 4px 20px rgba(0,0,0,0.3)', ...anim(`who-${i}`, i*0.12) }}>
                {/* الصورة */}
                <div style={{ height:170, position:'relative', overflow:'hidden' }}>
                  <img src={r.img} alt={r.title} style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.3)' }} />
                  <div style={{ position:'absolute', inset:0, background:`linear-gradient(to top,rgba(7,6,15,0.95),transparent)` }} />
                  <div style={{ position:'absolute', bottom:18, right:18, display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:30 }}>{r.icon}</span>
                    <span style={{ fontSize:20, fontWeight:900, color:'#fff' }}>لل{r.title}</span>
                  </div>
                </div>
                {/* المحتوى */}
                <div style={{ padding:'22px 22px 26px', background:'rgba(255,255,255,0.02)' }}>
                  <p style={{ fontSize:14, color:'rgba(255,255,255,0.5)', lineHeight:1.8, marginBottom:18 }}>{r.desc}</p>
                  {r.points.map((p,j) => (
                    <div key={j} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:r.color, flexShrink:0 }} />
                      <span style={{ fontSize:14, color:'rgba(255,255,255,0.65)' }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ⑤ لماذا مِداد — معنى الاسم ══ */}
      <section id="midad" ref={setRef('midad') as any} style={{ padding:'100px 24px', background:'rgba(255,255,255,0.015)', borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth:820, margin:'0 auto', textAlign:'center' }}>
          <div style={{ ...anim('midad') }}>
            <h2 style={{ fontSize:38, fontWeight:900, color:'#f1f5f9', marginBottom:20 }}>لماذا مِداد؟</h2>
            <p style={{ fontSize:17, color:'rgba(255,255,255,0.5)', lineHeight:1.9, maxWidth:540, margin:'0 auto 48px' }}>
              مِداد اسم يجمع المعلّم والمتعلّم، ويعبّر عن دعمٍ يدوم، وأصالةٍ تمتزج بالإبداع، لينتهي إلى درايةٍ أعمق باللغة العربية.
            </p>
          </div>

          {/* حروف الاسم */}
          <div className="grid-2" id="letters" ref={setRef('letters') as any}
            style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, maxWidth:680, margin:'0 auto' }}>
            {[
              { letter:'م', words:'معلّم · متعلّم', color:'#3b82f6' },
              { letter:'د', words:'دعم · ديمومة',   color:'#8b5cf6' },
              { letter:'ا', words:'أصالة · إبداع',  color:'#f59e0b' },
              { letter:'د', words:'دراية · دقة',    color:'#10b981' },
            ].map((h,i) => (
              <div key={i} style={{ padding:'24px 16px', borderRadius:16, background:`${h.color}10`, border:`1px solid ${h.color}28`, textAlign:'center', ...anim('letters', i*0.1) }}>
                <div style={{ fontSize:42, fontWeight:900, color:h.color, marginBottom:10, lineHeight:1 }}>{h.letter}</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.7 }}>{h.words}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ⑥ الدعوة الأخيرة ══ */}
      <section id="cta" ref={setRef('cta') as any} style={{ padding:'120px 24px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center, rgba(29,111,232,0.07) 0%, transparent 65%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center bottom, rgba(124,58,237,0.05) 0%, transparent 60%)', pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:2, maxWidth:640, margin:'0 auto', ...anim('cta') }}>
          {/* شعار كبير */}
          <div style={{ fontSize:80, fontWeight:900, marginBottom:28, lineHeight:1,
            background:'linear-gradient(135deg,#3b82f6,#7c3aed)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            animation:'float 3.5s ease-in-out infinite',
          }}>مِ</div>

          <h2 style={{ fontSize:42, fontWeight:900, color:'#f1f5f9', marginBottom:16, lineHeight:1.3 }}>
            ابدأ رحلتك مع{' '}
            <span style={{ background:'linear-gradient(135deg,#3b82f6,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              مِداد
            </span>
          </h2>

          <p style={{ fontSize:17, color:'rgba(255,255,255,0.45)', lineHeight:1.9, marginBottom:44, maxWidth:520, margin:'0 auto 44px' }}>
            سواء كنت معلماً تبحث عن شرح أقوى، أو متعلماً يريد تدريباً أوضح،
            تمنحك مِداد بيئة عربية ذكية تنظّم التعلم وتدعم التقدم خطوة بخطوة.
          </p>

          <div className="hero-btns" style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => router.push('/login')} className="btn-primary"
              style={{ padding:'17px 56px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#1d6fe8,#7c3aed)', color:'#fff', fontSize:17, fontWeight:900, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 12px 40px rgba(29,111,232,0.4)' }}>
              أنشئ حسابك
            </button>
            <button onClick={() => router.push('/login')} className="btn-ghost"
              style={{ padding:'17px 40px', borderRadius:14, border:'1.5px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.03)', color:'rgba(255,255,255,0.6)', fontSize:16, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              جرّب مِداد الآن ←
            </button>
          </div>
        </div>
      </section>

      {/* ══ الفوتر ══ */}
      <footer style={{ padding:'32px 48px', borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#1d6fe8,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, fontWeight:900, color:'#fff' }}>م</div>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'rgba(255,255,255,0.5)' }}>مِداد</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)' }}>العربية بذكاء</div>
          </div>
        </div>
        <p style={{ fontSize:13, color:'rgba(255,255,255,0.2)' }}>
          الكويت 🇰🇼 • جميع الحقوق محفوظة {new Date().getFullYear()}
        </p>
        <div style={{ display:'flex', gap:20 }}>
          {[['#features','المزايا'],['#how','كيف تعمل'],['#who','لمن']].map(([href,label]) => (
            <a key={href} href={href} className="nav-a" style={{ fontSize:13, color:'rgba(255,255,255,0.25)', fontWeight:600 }}>{label}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}