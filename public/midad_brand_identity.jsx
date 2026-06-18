import { useState } from "react"

const B = {
  deep:      '#780F1E',
  red:       '#961E2D',
  crimson:   '#C32D2D',
  orange:    '#D2692D',
  amber:     '#E1872D',
  gold:      '#E1873C',
  text:      '#231B19',
  sub:       '#6B5050',
  bg:        '#F7F2EA',
  bgSoft:    '#FCF8F2',
  border:    'rgba(150,30,45,0.14)',
  gradMain:  'linear-gradient(135deg,#780F1E,#C32D2D,#D2692D)',
  gradWarm:  'linear-gradient(135deg,#780F1E,#961E2D,#E1873C)',
  gradGold:  'linear-gradient(135deg,#D2692D,#E1873C)',
  gradBlue:  'linear-gradient(135deg,#2563EB,#1D4ED8)',
  shadow:    '0 16px 48px rgba(120,15,30,0.10)',
  shadowBlue:'0 8px 28px rgba(37,99,235,0.42)',
}

const CALIBRI = "'Calibri','Trebuchet MS','Gill Sans MT',Tahoma,sans-serif"
const CAIRO   = "'Cairo','Segoe UI',Tahoma,Arial,sans-serif"

const COLORS = [
  { name:'عنابي عميق',   hex:'#780F1E', rgb:'rgb(120,15,30)',   role:'أغمق الزهرة — التدرج' },
  { name:'أحمر مِداد',   hex:'#961E2D', rgb:'rgb(150,30,45)',   role:'اللون الرئيسي' },
  { name:'قرمزي',        hex:'#C32D2D', rgb:'rgb(195,45,45)',   role:'اللون الثانوي' },
  { name:'برتقالي أحمر', hex:'#D2692D', rgb:'rgb(210,105,45)',  role:'لون التدرج' },
  { name:'برتقالي',      hex:'#E1782D', rgb:'rgb(225,120,45)',  role:'لون الإبراز' },
  { name:'ذهبي دافئ',   hex:'#E1873C', rgb:'rgb(225,135,60)',  role:'أفتح نقطة الزهرة' },
  { name:'نص داكن',      hex:'#231B19', rgb:'rgb(35,27,25)',    role:'النصوص الرئيسية' },
  { name:'كريمي عاجي',  hex:'#F7F2EA', rgb:'rgb(247,242,234)', role:'الخلفية الرسمية' },
  { name:'أزرق CTA',    hex:'#2563EB', rgb:'rgb(37,99,235)',   role:'أزرار الدعوة — متمايز' },
]

const FONTS = [
  { name:'Calibri', role:'العناوين H1–H3', weight:'900 Bold', note:'يعكس أسلوب خط "مِداد" — أكاديمي دافئ', sample:'منصة مِداد التعليمية' },
  { name:'Cairo',   role:'نصوص الواجهة والمحتوى', weight:'400 / 600 / 700', note:'خط عربي رقمي سهل القراءة على الشاشات', sample:'تعلّم بذكاء مع مِداد' },
  { name:'Inter',   role:'الإنجليزية والأرقام', weight:'400 / 600', note:'متناسق مع Cairo في الواجهات المزدوجة', sample:'Midad Platform 2024' },
]

const RULES = [
  { title:'المسافة الآمنة', icon:'📐', desc:'حول الشعار من كل جهة مسافة تساوي ارتفاع حرف "م" × 1.5 — لا يُوضع أي عنصر داخل هذه المسافة.' },
  { title:'الحد الأدنى للشاشات', icon:'📱', desc:'32px ارتفاعاً للشعار الكامل • 24px للزهرة وحدها (Favicon) • أقل من ذلك يضيع التفاصيل.' },
  { title:'الحد الأدنى للطباعة', icon:'🖨️', desc:'25mm عرضاً للشعار الكامل • 12mm للزهرة وحدها • بدقة 300dpi على الأقل.' },
  { title:'الخلفيات المسموحة', icon:'🎨', desc:'كريمي #F7F2EA (الأفضل) • أبيض #FFFFFF (مقبول) • داكن مع filter:invert للعرض العكسي.' },
  { title:'الخلفيات الممنوعة', icon:'🚫', desc:'أي خلفية ملونة تتقاطع مع ألوان الشعار (برتقالي، أحمر) — تضيع الزهرة وتفقد الهوية وضوحها.' },
]

const APPS = [
  { title:'شاشة التطبيق الجوال',    icon:'📱', color: B.red,    desc:'Hero screen مع الشعار كبيراً + زر "ابدأ" أزرق' },
  { title:'غلاف تويتر/إنستغرام',    icon:'🐦', color: B.orange, desc:'1500×500 — شعار يمين + عنوان + تدرج دافئ' },
  { title:'بطاقة عمل',              icon:'💼', color: B.crimson, desc:'شعار + اسم + بريد + موقع على خلفية كريمية' },
  { title:'بنر دعائي إلكتروني',     icon:'📣', color: B.gold,   desc:'728×90 — شعار + "ابدأ مجاناً" + خلفية دافئة' },
]

export default function BrandIdentity() {
  const [tab, setTab] = useState('colors')
  const tabs = [
    { id:'colors', label:'🎨 نظام الألوان' },
    { id:'fonts',  label:'✏️ نظام الخطوط' },
    { id:'rules',  label:'📏 قواعد الشعار' },
    { id:'apps',   label:'📱 التطبيقات' },
    { id:'tokens', label:'💻 CSS Variables' },
  ]

  return (
    <div dir="rtl" style={{ minHeight:'100vh', background:B.bg, fontFamily:CAIRO, color:B.text, padding:'0 0 60px' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
        @keyframes shimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
        .card{background:rgba(255,255,255,0.72);border:1px solid rgba(150,30,45,0.12);border-radius:18px;padding:22px;transition:transform .2s,box-shadow .2s;}
        .card:hover{transform:translateY(-3px);box-shadow:0 12px 36px rgba(120,15,30,0.10);}
        .tab{transition:all .18s;border:none;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;padding:10px 18px;border-radius:10px;}
        .tab.active{background:${B.gradMain};color:#fff;box-shadow:0 4px 16px rgba(150,30,45,0.3);}
        .tab:not(.active){background:rgba(255,255,255,0.65);color:${B.sub};}
        .tab:not(.active):hover{background:rgba(255,255,255,0.9);color:${B.crimson};}
        .swatch{width:100%;height:64px;border-radius:12px;cursor:pointer;transition:transform .15s;}
        .swatch:hover{transform:scale(1.04);}
        .copy-badge{position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.5);color:#fff;font-size:10px;padding:2px 7px;border-radius:5px;opacity:0;transition:opacity .2s;}
        .swatch-wrap:hover .copy-badge{opacity:1;}
        .swatch-wrap{position:relative;}
      `}</style>

      {/* الهيدر */}
      <div style={{
        background:`radial-gradient(circle at 80% 50%, rgba(225,135,60,0.12),transparent 40%),radial-gradient(circle at 20% 50%, rgba(150,30,45,0.08),transparent 35%), ${B.bgSoft}`,
        borderBottom:`1px solid ${B.border}`,
        padding:'48px 32px 36px',
        textAlign:'center',
      }}>
        <div style={{ animation:'float 4s ease-in-out infinite', marginBottom:24 }}>
          <img src="/logo-midad.png" alt="مِداد" style={{ height:80, width:'auto', objectFit:'contain', margin:'0 auto', display:'block', filter:'drop-shadow(0 6px 18px rgba(150,30,45,0.25))' }}
            onError={e=>{ e.target.style.display='none' }} />
          {/* Fallback */}
          <div style={{ background:B.gradMain, color:'#fff', fontFamily:CALIBRI, fontSize:32, fontWeight:900, padding:'12px 28px', borderRadius:14, display:'inline-block', marginTop:4 }}>
            مِداد
          </div>
        </div>
        <h1 style={{ fontSize:32, fontWeight:900, fontFamily:CALIBRI, marginBottom:10,
          background:B.gradWarm, backgroundSize:'200% auto',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          animation:'shimmer 4s linear infinite',
        }}>
          الهوية البصرية الكاملة
        </h1>
        <p style={{ fontSize:16, color:B.sub, maxWidth:480, margin:'0 auto' }}>
          مستخرجة حصرياً من شعار مِداد — للمعلم والمتعلم في اللغة العربية 🇰🇼
        </p>
      </div>

      {/* التبويبات */}
      <div style={{ display:'flex', gap:10, padding:'24px 32px 0', flexWrap:'wrap', justifyContent:'center' }}>
        {tabs.map(t => (
          <button key={t.id} className={`tab${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:1000, margin:'28px auto 0', padding:'0 24px' }}>

        {/* ── الألوان ── */}
        {tab==='colors' && (
          <div>
            <h2 style={{ fontSize:22, fontWeight:900, fontFamily:CALIBRI, marginBottom:20 }}>🎨 نظام الألوان</h2>

            {/* الألوان الرئيسية */}
            <h3 style={{ fontSize:15, fontWeight:700, color:B.sub, marginBottom:14 }}>الألوان المستخرجة من الشعار</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:14, marginBottom:32 }}>
              {COLORS.map(c => (
                <div key={c.hex} className="card" style={{ padding:16 }}>
                  <div className="swatch-wrap">
                    <div className="swatch" style={{ background:c.hex, border:'1px solid rgba(0,0,0,0.06)' }} onClick={()=>navigator.clipboard?.writeText(c.hex)} />
                    <span className="copy-badge">نسخ</span>
                  </div>
                  <div style={{ marginTop:12, fontSize:14, fontWeight:800, color:B.text }}>{c.name}</div>
                  <div style={{ fontSize:12, color:B.sub, marginTop:3, fontFamily:'monospace' }}>{c.hex}</div>
                  <div style={{ fontSize:11, color:B.sub, marginTop:1 }}>{c.rgb}</div>
                  <div style={{ fontSize:11, color:B.crimson, marginTop:5, fontWeight:600 }}>{c.role}</div>
                </div>
              ))}
            </div>

            {/* التدرجات */}
            <h3 style={{ fontSize:15, fontWeight:700, color:B.sub, marginBottom:14 }}>التدرجات الرسمية</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
              {[
                { name:'تدرج مِداد الرئيسي', grad:B.gradMain,  vars:'#780F1E → #C32D2D → #D2692D' },
                { name:'تدرج دافئ كامل',    grad:B.gradWarm,  vars:'#780F1E → #961E2D → #E1873C' },
                { name:'تدرج ذهبي',         grad:B.gradGold,  vars:'#D2692D → #E1873C' },
                { name:'أزرار CTA (أزرق)',   grad:B.gradBlue,  vars:'#2563EB → #1D4ED8' },
              ].map(g => (
                <div key={g.name} className="card" style={{ padding:0, overflow:'hidden' }}>
                  <div style={{ height:56, background:g.grad }} />
                  <div style={{ padding:'12px 14px' }}>
                    <div style={{ fontSize:14, fontWeight:800 }}>{g.name}</div>
                    <div style={{ fontSize:11, color:B.sub, marginTop:4, fontFamily:'monospace' }}>{g.vars}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── الخطوط ── */}
        {tab==='fonts' && (
          <div>
            <h2 style={{ fontSize:22, fontWeight:900, fontFamily:CALIBRI, marginBottom:20 }}>✏️ نظام الخطوط</h2>
            <div style={{ display:'grid', gap:16 }}>
              {FONTS.map(f => (
                <div key={f.name} className="card">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:800, color:B.crimson, marginBottom:4 }}>{f.role}</div>
                      <div style={{ fontSize:13, color:B.sub, marginBottom:12 }}>{f.note}</div>
                      <div style={{ fontSize:11, color:B.sub, background:'rgba(150,30,45,0.06)', padding:'3px 10px', borderRadius:6, display:'inline-block', fontFamily:'monospace' }}>
                        {f.weight}
                      </div>
                    </div>
                    <div style={{ fontSize:28, fontWeight:900,
                      fontFamily: f.name==='Calibri'?CALIBRI:f.name==='Cairo'?CAIRO:'Inter,sans-serif',
                      color:B.text, maxWidth:400, lineHeight:1.4,
                    }}>
                      {f.sample}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* التراتبية */}
            <h3 style={{ fontSize:15, fontWeight:700, color:B.sub, margin:'28px 0 14px' }}>التراتبية النصية</h3>
            <div className="card">
              {[
                { tag:'H1', size:'56–64px', weight:'900', font:CALIBRI, sample:'منصة مِداد التعليمية' },
                { tag:'H2', size:'36–42px', weight:'900', font:CALIBRI, sample:'ما الذي تقدّمه مِداد؟' },
                { tag:'H3', size:'22–26px', weight:'900', font:CALIBRI, sample:'شرح ذكي للدروس' },
                { tag:'Body', size:'15–17px', weight:'400', font:CAIRO, sample:'مِداد منصة تعليمية متخصصة للغة العربية تمكّن المعلم من إعداد الشرح.' },
                { tag:'Label', size:'13–14px', weight:'700', font:CAIRO, sample:'البريد الإلكتروني' },
                { tag:'Caption', size:'11–12px', weight:'400', font:CAIRO, sample:'الكويت 🇰🇼 • منصة تعليمية عربية' },
              ].map((t,i) => (
                <div key={t.tag} style={{ display:'flex', alignItems:'baseline', gap:16, padding:'12px 0', borderBottom: i<5?`1px solid ${B.border}`:'none' }}>
                  <div style={{ width:56, fontSize:12, fontWeight:800, color:B.crimson, flexShrink:0, fontFamily:'monospace' }}>{t.tag}</div>
                  <div style={{ width:80, fontSize:11, color:B.sub, flexShrink:0 }}>{t.size} / {t.weight}</div>
                  <div style={{ fontSize:t.tag==='H1'?28:t.tag==='H2'?22:t.tag==='H3'?18:t.tag==='Body'?15:t.tag==='Label'?13:11, fontFamily:t.font, fontWeight:parseInt(t.weight), color:B.text }}>
                    {t.sample}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── القواعد ── */}
        {tab==='rules' && (
          <div>
            <h2 style={{ fontSize:22, fontWeight:900, fontFamily:CALIBRI, marginBottom:20 }}>📏 قواعد استخدام الشعار</h2>
            <div style={{ display:'grid', gap:14, marginBottom:28 }}>
              {RULES.map(r => (
                <div key={r.title} className="card" style={{ display:'flex', gap:16 }}>
                  <div style={{ fontSize:28, flexShrink:0 }}>{r.icon}</div>
                  <div>
                    <div style={{ fontSize:16, fontWeight:900, color:B.text, marginBottom:6, fontFamily:CALIBRI }}>{r.title}</div>
                    <div style={{ fontSize:14, color:B.sub, lineHeight:1.8 }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* عرض الخلفيات */}
            <h3 style={{ fontSize:15, fontWeight:700, color:B.sub, marginBottom:14 }}>عرض الشعار على الخلفيات</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
              {[
                { bg:'#F7F2EA', label:'كريمي ✅ الأفضل',   filter:'none' },
                { bg:'#FFFFFF', label:'أبيض ✅ مقبول',     filter:'none' },
                { bg:'#231B19', label:'داكن — عكسي',      filter:'brightness(0) invert(1)' },
              ].map(x => (
                <div key={x.bg} style={{ borderRadius:16, overflow:'hidden', border:`1px solid ${B.border}` }}>
                  <div style={{ background:x.bg, padding:24, textAlign:'center', minHeight:100, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div style={{
                      background: B.gradMain, color:'#fff',
                      fontFamily:CALIBRI, fontSize:20, fontWeight:900,
                      padding:'8px 18px', borderRadius:10,
                      filter: x.filter,
                    }}>
                      مِداد
                    </div>
                  </div>
                  <div style={{ padding:'10px 14px', background:B.bgSoft }}>
                    <div style={{ fontSize:13, fontWeight:700, color:B.text }}>{x.label}</div>
                    <div style={{ fontSize:11, color:B.sub, fontFamily:'monospace' }}>{x.bg}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── التطبيقات ── */}
        {tab==='apps' && (
          <div>
            <h2 style={{ fontSize:22, fontWeight:900, fontFamily:CALIBRI, marginBottom:20 }}>📱 أمثلة تطبيقية</h2>

            {/* موبايل */}
            <h3 style={{ fontSize:15, fontWeight:700, color:B.sub, marginBottom:14 }}>شاشة تطبيق الجوال</h3>
            <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:20, maxWidth:320, margin:'0 auto 24px' }}>
              <div style={{ background:B.gradMain, padding:'32px 24px 28px', textAlign:'center' }}>
                <div style={{ fontSize:42, fontWeight:900, color:'rgba(255,255,255,0.2)', fontFamily:CALIBRI, marginBottom:8 }}>مِداد</div>
                <div style={{ fontSize:14, color:'rgba(255,255,255,0.85)', lineHeight:1.7 }}>منصة تعليم اللغة العربية</div>
              </div>
              <div style={{ padding:'24px 20px', background:B.bgSoft }}>
                {['شرح الدروس','الاختبارات','بطاقات الحفظ','مهامي'].map((item,i) => (
                  <div key={item} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, marginBottom:8, background:'rgba(255,255,255,0.8)', border:`1px solid ${B.border}` }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:[B.crimson,B.orange,B.amber,B.gold][i], flexShrink:0 }} />
                    <span style={{ fontSize:14, fontWeight:700 }}>{item}</span>
                  </div>
                ))}
                <div style={{ marginTop:16, padding:'13px', borderRadius:12, background:B.gradBlue, color:'#fff', textAlign:'center', fontSize:15, fontWeight:900, boxShadow:'0 6px 20px rgba(37,99,235,0.4)' }}>
                  ابدأ الآن ←
                </div>
              </div>
            </div>

            {/* غلاف تويتر */}
            <h3 style={{ fontSize:15, fontWeight:700, color:B.sub, marginBottom:14 }}>غلاف تويتر / إنستغرام</h3>
            <div style={{ borderRadius:18, overflow:'hidden', marginBottom:24, boxShadow:B.shadow }}>
              <div style={{
                background:`radial-gradient(circle at 80% 50%, rgba(225,135,60,0.25),transparent 45%), ${B.gradMain}`,
                padding:'32px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:20,
              }}>
                <div>
                  <div style={{ fontSize:36, fontWeight:900, color:'#fff', fontFamily:CALIBRI, marginBottom:8 }}>مِداد</div>
                  <div style={{ fontSize:16, color:'rgba(255,255,255,0.8)' }}>تعلّم بذكاء • منصة اللغة العربية</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', marginTop:6 }}>🇰🇼 الكويت | midad.edu</div>
                </div>
                <div style={{ textAlign:'left' }}>
                  {['للمعلم','للطالب','للمدرسة'].map((t,i) => (
                    <div key={t} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:[B.gold,B.amber,B.orange][i] }} />
                      <span style={{ color:'rgba(255,255,255,0.85)', fontSize:14, fontWeight:600 }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* بطاقة عمل */}
            <h3 style={{ fontSize:15, fontWeight:700, color:B.sub, marginBottom:14 }}>بطاقة عمل</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
              <div style={{ borderRadius:16, overflow:'hidden', boxShadow:B.shadow }}>
                <div style={{ background:B.bgSoft, padding:'24px 22px', border:`1px solid ${B.border}`, borderRadius:16 }}>
                  <div style={{ fontSize:24, fontWeight:900, fontFamily:CALIBRI, marginBottom:4, background:B.gradMain, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>مِداد</div>
                  <div style={{ fontSize:12, color:B.sub, marginBottom:16, fontFamily:CALIBRI }}>تعلّم بذكاء</div>
                  <div style={{ height:1, background:B.border, marginBottom:14 }} />
                  <div style={{ fontSize:13, color:B.text, fontWeight:700, marginBottom:4 }}>اسم المعلم</div>
                  <div style={{ fontSize:12, color:B.sub }}>مُعلِّم اللغة العربية</div>
                  <div style={{ fontSize:11, color:B.sub, marginTop:6 }}>📧 name@midad.edu</div>
                  <div style={{ fontSize:11, color:B.sub, marginTop:2 }}>🌐 midad.edu.kw</div>
                </div>
              </div>
              {/* البنر الدعائي */}
              <div style={{ borderRadius:16, overflow:'hidden', boxShadow:B.shadow }}>
                <div style={{ background:`radial-gradient(circle at 30% 50%, rgba(225,135,60,0.15),transparent 40%), ${B.bgSoft}`, padding:'20px', height:'100%', border:`1px solid ${B.border}`, borderRadius:16, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:11, color:B.crimson, fontWeight:800, letterSpacing:2, marginBottom:6 }}>MIDAD PLATFORM</div>
                    <div style={{ fontSize:18, fontWeight:900, fontFamily:CALIBRI, color:B.text, lineHeight:1.3 }}>ابدأ رحلتك<br />مع اللغة العربية</div>
                  </div>
                  <div style={{ padding:'9px 16px', borderRadius:10, background:B.gradBlue, color:'#fff', fontSize:13, fontWeight:900, textAlign:'center', boxShadow:'0 4px 14px rgba(37,99,235,0.4)' }}>
                    جرّب مجاناً ←
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CSS Variables ── */}
        {tab==='tokens' && (
          <div>
            <h2 style={{ fontSize:22, fontWeight:900, fontFamily:CALIBRI, marginBottom:20 }}>💻 CSS Variables & Tokens</h2>
            <div className="card" style={{ background:'#1F1215', border:'none' }}>
              <pre style={{ color:'#E1873C', fontSize:13, lineHeight:1.9, overflowX:'auto', fontFamily:'monospace', whiteSpace:'pre-wrap' }}>{`:root {
  /* ── الألوان الأساسية (من الشعار) ── */
  --midad-deep:       #780F1E;  /* عنابي عميق   rgb(120,15,30)  */
  --midad-red:        #961E2D;  /* أحمر مِداد   rgb(150,30,45)  */
  --midad-crimson:    #C32D2D;  /* قرمزي        rgb(195,45,45)  */
  --midad-orange:     #D2692D;  /* برتقالي أحمر rgb(210,105,45) */
  --midad-amber:      #E1782D;  /* برتقالي      rgb(225,120,45) */
  --midad-gold:       #E1873C;  /* ذهبي دافئ   rgb(225,135,60) */

  /* ── الخلفيات ── */
  --midad-bg:         #F7F2EA;  /* كريمي عاجي */
  --midad-bg-soft:    #FCF8F2;  /* كريمي ناعم */
  --midad-card:       rgba(255,255,255,0.72);

  /* ── النصوص ── */
  --midad-text:       #231B19;
  --midad-sub:        #6B5050;

  /* ── التدرجات ── */
  --grad-main:  linear-gradient(135deg,#780F1E,#C32D2D,#D2692D);
  --grad-warm:  linear-gradient(135deg,#780F1E,#961E2D,#E1873C);
  --grad-blue:  linear-gradient(135deg,#2563EB,#1D4ED8);

  /* ── الخطوط ── */
  --font-heading: 'Calibri','Trebuchet MS','Gill Sans MT',Tahoma,sans-serif;
  --font-body:    'Cairo','Segoe UI',Tahoma,Arial,sans-serif;

  /* ── الظلال ── */
  --shadow-main: 0 20px 50px rgba(120,15,30,0.08);
  --shadow-blue: 0 8px 28px rgba(37,99,235,0.42);

  /* ── الحدود ── */
  --border-main:   rgba(150,30,45,0.14);
  --border-strong: rgba(150,30,45,0.26);
}`}</pre>
            </div>

            {/* JS Theme Object */}
            <div className="card" style={{ background:'#1F1215', border:'none', marginTop:14 }}>
              <pre style={{ color:'#DC8C3C', fontSize:13, lineHeight:1.9, overflowX:'auto', fontFamily:'monospace', whiteSpace:'pre-wrap' }}>{`// lib/constants/theme.ts
export const BRAND = {
  deep:     '#780F1E',   // عنابي
  red:      '#961E2D',   // أحمر مِداد
  crimson:  '#C32D2D',   // قرمزي
  orange:   '#D2692D',   // برتقالي أحمر
  amber:    '#E1782D',   // برتقالي
  gold:     '#E1873C',   // ذهبي
  bg:       '#F7F2EA',   // خلفية
  text:     '#231B19',   // نص
  sub:      '#6B5050',   // ثانوي
  gradMain: 'linear-gradient(135deg,#780F1E,#C32D2D,#D2692D)',
  gradWarm: 'linear-gradient(135deg,#780F1E,#961E2D,#E1873C)',
  gradBlue: 'linear-gradient(135deg,#2563EB,#1D4ED8)',
  fontH:    "'Calibri','Trebuchet MS',Tahoma,sans-serif",
  fontB:    "'Cairo','Segoe UI',Tahoma,Arial,sans-serif",
}`}</pre>
            </div>
          </div>
        )}
      </div>

      {/* الفوتر */}
      <div style={{ textAlign:'center', marginTop:40, color:B.sub, fontSize:13, padding:'0 24px' }}>
        <div style={{ width:40, height:3, background:B.gradMain, borderRadius:2, margin:'0 auto 14px' }} />
        منصة مِداد — الهوية البصرية الكاملة 🇰🇼
      </div>
    </div>
  )
}
