// lib/constants/theme.ts
// ══ هوية مِداد البصرية — مستخرجة من الشعار ══

export const BRAND = {
  // ── الألوان الأساسية ──────────────────────────────────────
  deep: '#a20404',
  red: '#c62a44',
  crimson: '#B42828',
  orangeRed: '#C86428',
  orange: '#e38557d8',
  gold: '#3B82F6',

  // ── خلفيات ───────────────────────────────────────────────
  bg: '#F7F2EA',
  bgSoft: '#f8f7f5',
  bgCard: 'rgba(251, 238, 238, 0.72)',

  // ── نصوص ─────────────────────────────────────────────────
  text: '#1d1f12',
  sub: '#af2020',
  muted: '#A08888',

  // ── حدود ─────────────────────────────────────────────────
  border: 'rgba(219, 49, 77, 0.89)',
  borderStrong: 'rgba(140,20,40,0.24)',

  // ── تدرجات ───────────────────────────────────────────────
  gradMain: 'linear-gradient(135deg,#781414,#B42828,#DC6428)',
  gradWarm: 'linear-gradient(135deg,#781414,#8C1428,#DC8C3C)',
  gradGold: 'linear-gradient(135deg,#3B82F6,#2563EB)',
  gradBlue: 'linear-gradient(135deg,#2563EB,#1D4ED8)',

  // ── ظلال ─────────────────────────────────────────────────
  shadow: '0 20px 50px rgba(60,16,20,0.08)',
  shadowWarm: '0 8px 24px rgba(140,20,40,0.16)',
  shadowBlue: '0 8px 28px rgba(37,99,235,0.40)',

  // ── خطوط ─────────────────────────────────────────────────
   fontHeading: 'var(--font-cairo), system-ui, sans-serif',
  fontBody: 'var(--font-cairo), var(--font-inter), system-ui, sans-serif',
  fontEn: 'var(--font-inter), system-ui, sans-serif',


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