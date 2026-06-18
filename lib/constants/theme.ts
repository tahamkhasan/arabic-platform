// lib/constants/theme.ts
// ══ هوية مِداد البصرية — مستخرجة من الشعار ══

export const BRAND = {
  // ── الألوان الأساسية ──────────────────────────────────────
  deep:       '#781414',   // عنابي عميق — أغمق الزهرة
  red:        '#8C1428',   // أحمر مِداد — الرئيسي
  crimson:    '#B42828',   // قرمزي
  orangeRed:  '#C86428',   // برتقالي أحمر
  orange:     '#DC6428',   // برتقالي
  gold:       '#DC8C3C',   // ذهبي دافئ

  // ── خلفيات ───────────────────────────────────────────────
  bg:         '#F7F2EA',   // كريمي عاجي — الرئيسي
  bgSoft:     '#FCF8F2',   // كريمي ناعم — البطاقات
  bgCard:     'rgba(255,255,255,0.72)',

  // ── نصوص ─────────────────────────────────────────────────
  text:       '#1F1215',   // أسود دافئ
  sub:        '#6F5B5B',   // رمادي دافئ
  muted:      '#A08888',   // خفيف

  // ── حدود ─────────────────────────────────────────────────
  border:     'rgba(140,20,40,0.12)',
  borderStrong:'rgba(140,20,40,0.24)',

  // ── تدرجات ───────────────────────────────────────────────
  gradMain:   'linear-gradient(135deg,#781414,#B42828,#DC6428)',
  gradWarm:   'linear-gradient(135deg,#781414,#8C1428,#DC8C3C)',
  gradGold:   'linear-gradient(135deg,#C86428,#DC8C3C)',
  gradBlue:   'linear-gradient(135deg,#2563EB,#1D4ED8)',  // CTA

  // ── ظلال ─────────────────────────────────────────────────
  shadow:     '0 20px 50px rgba(60,16,20,0.08)',
  shadowWarm: '0 8px 24px rgba(140,20,40,0.16)',
  shadowBlue: '0 8px 28px rgba(37,99,235,0.40)',

  // ── خطوط ─────────────────────────────────────────────────
  fontHeading: "'Calibri','Trebuchet MS','Gill Sans MT',Tahoma,sans-serif",
  fontBody:    "'Cairo','Segoe UI',Tahoma,Arial,sans-serif",
} as const

// ── ثيم التطبيق الداخلي ───────────────────────────────────
export const APP = {
  bg:        BRAND.bg,
  cardBg:    BRAND.bgSoft,
  textCol:   BRAND.text,
  subCol:    BRAND.sub,
  borderCol: BRAND.border,
  inputBg:   'rgba(140,20,40,0.04)',
  headerBg:  'rgba(247,242,234,0.97)',
  accent:    BRAND.red,
  gradient:  BRAND.gradMain,
  btnBlue:   BRAND.gradBlue,
  btnGlow:   BRAND.shadowBlue,
  shadow:    BRAND.shadow,
} as const