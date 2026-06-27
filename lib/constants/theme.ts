// lib/constants/theme.ts
// ══ هوية مِداد البصرية — مستخرجة من الشعار ══

export const BRAND = {
  // ── الألوان الأساسية ──────────────────────────────────────
  deep: '#781414', // عنابي عميق — أغمق الزهرة
  red: '#8C1428', // أحمر مِداد — الرئيسي
  crimson: '#B42828', // قرمزي
  orangeRed: '#C86428', // برتقالي أحمر
  orange: '#e38557d8', // برتقالي
  // ── مُعدَّل: gold كانت فعلياً أحمر زاهٍ ('#f00707e4') رغم اسمها —
  // أصبحت الآن درجة أزرق مميّزة (أفتح/أزهى من BRAND.blue الأساسي)،
  // لتمييز العناصر الثانوية (أزرار الإرسال/التوكيد) بصرياً عن
  // الروابط العادية التي تستخدم BRAND.blue نفسها. الاسم "gold" بقي
  // كما هو عمداً لتفادي تعديل عشرات الاستخدامات في كل الملفات —
  // فقط القيمة تغيّرت. ──────────────────────────────────────────
  gold: '#eddf62db', // 🔵 أزرق مميَّز (بدل الأحمر الذي كان مسمّى "gold" خطأً)

  // ── خلفيات ───────────────────────────────────────────────
  bg: '#F7F2EA', // كريمي عاجي — الرئيسي
  bgSoft: '#f8f7f5', // كريمي ناعم — البطاقات
  bgCard: 'rgba(251, 238, 238, 0.72)',

  // ── نصوص ─────────────────────────────────────────────────
  text: '#1F1215', // أسود دافئ
  sub: '#6F5B5B', // رمادي دافئ
  muted: '#A08888', // خفيف

  // ── حدود ─────────────────────────────────────────────────
  border: 'rgba(219, 49, 77, 0.89)',
  borderStrong: 'rgba(140,20,40,0.24)',

  // ── تدرجات ───────────────────────────────────────────────
  gradMain: 'linear-gradient(135deg,#781414,#B42828,#DC6428)',
  gradWarm: 'linear-gradient(135deg,#781414,#8C1428,#DC8C3C)',
  // ── مُعدَّل: gradGold كانت برتقالي/ذهبي فعلي (#C86428→#DC8C3C) —
  // أصبحت تدرّج أزرق ليطابق gold الجديدة بصرياً، فلا يظهر تناقض بين
  // عنصر يستخدم gold (أزرق) وعنصر آخر يستخدم gradGold (برتقالي) ──
  gradGold: 'linear-gradient(135deg,#3B82F6,#2563EB)',
  gradBlue: 'linear-gradient(135deg,#2563EB,#1D4ED8)',

  // ── ظلال ─────────────────────────────────────────────────
  shadow: '0 20px 50px rgba(60,16,20,0.08)',
  shadowWarm: '0 8px 24px rgba(140,20,40,0.16)',
  shadowBlue: '0 8px 28px rgba(37,99,235,0.40)',

  // ── خطوط ─────────────────────────────────────────────────
  fontHeading: "var(--font-cairo), var(--font-inter), system-ui, sans-serif",
  fontBody:    "var(--font-cairo), var(--font-inter), system-ui, sans-serif",
  fontEn:      "var(--font-inter), system-ui, sans-serif",

  // ── أوزان الخطوط ──────────────────────────────────────────
  weightRegular: 400,
  weightSemibold: 600,
  weightBold: 700,
  weightBlack: 900,

  // ── حدود الانحناء ─────────────────────────────────────────
  radiusSm: 10,
  radiusMd: 14,
  radiusLg: 18,
  radiusXl: 24,
  radiusPill: 999,

  // ── المسافات ─────────────────────────────────────────────
  spaceXs: 6,
  spaceSm: 10,
  spaceMd: 16,
  spaceLg: 24,
  spaceXl: 32,
  spaceXxl: 48,
} as const

// ── ثيم التطبيق الداخلي ───────────────────────────────────
export const APP = {
  bg: BRAND.bg,
  cardBg: BRAND.bgSoft,
  textCol: BRAND.text,
  subCol: BRAND.sub,
  borderCol: BRAND.border,
  inputBg: 'rgba(140,20,40,0.04)',
  headerBg: 'rgba(247,242,234,0.97)',
  accent: BRAND.red,
  gradient: BRAND.gradMain,
  btnBlue: BRAND.gradBlue,
  btnGlow: BRAND.shadowBlue,
  shadow: BRAND.shadow,
} as const