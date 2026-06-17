// lib/constants/theme.ts
// ألوان هوية منصة مِداد — مستمدة من الشعار

export const MIDAD_COLORS = {
  // ── الخلفيات ──────────────────────────────────────────────
  bgCream:      '#F5F0E8',   // خلفية الصفحات الخارجية
  bgDark:       '#0E0A0A',   // خلفية التطبيق الداخلي
  bgCard:       '#1A1210',   // بطاقات التطبيق
  bgSurface:    '#241810',   // طبقة ثانية

  // ── الألوان الرئيسية من الشعار ────────────────────────────
  deepRed:      '#7B1A1A',   // عنابي عميق
  crimson:      '#C0392B',   // أحمر قرمزي
  orangeRed:    '#CC4422',   // برتقالي أحمر
  orange:       '#E07020',   // برتقالي
  gold:         '#F4A420',   // ذهبي عنبري
  amber:        '#F8C050',   // كهرماني فاتح

  // ── تدرج العلامة التجارية ─────────────────────────────────
  gradientMain: 'linear-gradient(135deg, #C0392B, #E07020)',
  gradientWarm: 'linear-gradient(135deg, #7B1A1A, #C0392B, #F4A420)',
  gradientGold: 'linear-gradient(135deg, #E07020, #F4A420)',

  // ── النصوص ────────────────────────────────────────────────
  textDark:     '#1A1221',   // نص داكن على الكريمي
  textLight:    '#F5F0E8',   // نص فاتح على الداكن
  textMuted:    '#6B5050',   // نص ثانوي على الكريمي
  textMutedDark:'#94847A',   // نص ثانوي على الداكن

  // ── زر الدعوة — أزرق متوهج (مميز عن بقية الألوان) ────────
  btnBlue:      '#2563EB',
  btnBlueDark:  '#1D4ED8',
  btnGlow:      'rgba(37,99,235,0.45)',
  gradientBtn:  'linear-gradient(135deg, #2563EB, #1D4ED8)',

  // ── الحدود ────────────────────────────────────────────────
  borderLight:  'rgba(192,57,43,0.18)',
  borderDark:   'rgba(255,255,255,0.08)',
  borderGold:   'rgba(244,164,32,0.25)',
} as const

// الثيم الداخلي للتطبيق (داكن + عنابي)
export const APP_THEME = {
  bg:         '#0E0A0A',
  cardBg:     'rgba(255,255,255,0.06)',
  textCol:    '#F5EDE8',
  subCol:     '#94847A',
  borderCol:  'rgba(192,57,43,0.15)',
  inputBg:    'rgba(255,255,255,0.05)',
  headerBg:   'rgba(14,10,10,0.97)',
  primary:    '#E07020',
  gradient:   'linear-gradient(135deg,#C0392B,#E07020)',
  btnBlue:    'linear-gradient(135deg,#2563EB,#1D4ED8)',
  btnGlow:    '0 8px 24px rgba(37,99,235,0.4)',
} as const