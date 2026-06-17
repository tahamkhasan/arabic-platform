// lib/constants/theme.ts
// هوية منصة مِداد — ثيم موحد ثابت بدون وضع داكن/فاتح

export const MIDAD_COLORS = {
  // ── الخلفيات الموحدة ─────────────────────────────────────
  bgBase:       '#F5F0E8',   // الخلفية العامة لكل الصفحات الداخلية
  bgPage:       '#F7F2EA',   // خلفية الصفحات
  bgSection:    '#FBF8F2',   // أقسام داخلية
  bgCard:       '#FFFDF9',   // بطاقات
  bgSurface:    '#F1E8DD',   // طبقة ثانية / شريط جانبي / هيدر

  // ── ألوان هوية مِداد ─────────────────────────────────────
  deepRed:      '#7B1A1A',
  crimson:      '#C0392B',
  orangeRed:    '#CC4422',
  orange:       '#E07020',
  gold:         '#F4A420',
  amber:        '#F8C050',

  // ── التدرجات ─────────────────────────────────────────────
  gradientMain: 'linear-gradient(135deg, #C0392B, #E07020)',
  gradientWarm: 'linear-gradient(135deg, #7B1A1A, #C0392B, #F4A420)',
  gradientGold: 'linear-gradient(135deg, #E07020, #F4A420)',

  // ── النصوص ───────────────────────────────────────────────
  textPrimary:  '#211C17',   // النص الرئيسي
  textDark:     '#1A1221',   // العناوين الداكنة
  textSecondary:'#6E6258',   // النص الثانوي
  textMuted:    '#8A7B70',   // النص المساعد
  textOnBrand:  '#FFF9F3',   // نص فوق الأزرار/الخلفيات الملونة

  // ── الأزرار والتمييز ─────────────────────────────────────
  primary:      '#D96B2B',   // اللون الأساسي لزرار مِداد
  primaryHover: '#BF5A20',
  primarySoft:  '#F3E0D2',

  btnBlue:      '#2563EB',
  btnBlueDark:  '#1D4ED8',
  btnGlow:      'rgba(37,99,235,0.18)',
  gradientBtn:  'linear-gradient(135deg, #2563EB, #1D4ED8)',

  // ── الحدود والظلال ───────────────────────────────────────
  borderLight:  '#E8DDCF',
  borderWarm:   'rgba(192,57,43,0.16)',
  borderGold:   'rgba(244,164,32,0.22)',
  shadowSoft:   '0 8px 30px rgba(73, 44, 24, 0.08)',
  shadowCard:   '0 10px 24px rgba(60, 35, 20, 0.06)',
} as const

// ثيم التطبيق الموحد — للمعلم والطالب والمدير
export const APP_THEME = {
  bg:         '#F5F0E8',
  pageBg:     '#F7F2EA',
  cardBg:     '#FFFDF9',
  surfaceBg:  '#FBF8F2',
  sidebarBg:  '#F1E8DD',
  headerBg:   'rgba(245,240,232,0.94)',

  textCol:    '#211C17',
  titleCol:   '#1A1221',
  subCol:     '#6E6258',
  mutedCol:   '#8A7B70',

  borderCol:  '#E8DDCF',
  inputBg:    '#FFF9F3',
  inputBorder:'#E5D7C8',

  primary:    '#D96B2B',
  primaryHover:'#BF5A20',
  primarySoft:'#F3E0D2',
  gradient:   'linear-gradient(135deg,#C0392B,#E07020)',

  btnBlue:    'linear-gradient(135deg,#2563EB,#1D4ED8)',
  btnGlow:    '0 8px 24px rgba(37,99,235,0.18)',

  success:    '#4D7C3A',
  warning:    '#C9831C',
  danger:     '#B6432E',

  shadowSoft: '0 8px 30px rgba(73, 44, 24, 0.08)',
  shadowCard: '0 10px 24px rgba(60, 35, 20, 0.06)',
} as const