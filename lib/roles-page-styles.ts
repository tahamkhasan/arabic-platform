import { CSSProperties } from 'react'
import { BRAND } from '@/lib/constants/theme'

// lib/roles-page-styles.ts
// نفس أسماء المفاتيح القديمة عمداً — كل استخدام T.xxx في الملفات الأخرى يتبع تلقائياً
export const T = {
  bg: BRAND.bg,
  cardBg: BRAND.bgSoft,
  textCol: BRAND.text,
  subCol: BRAND.sub,
  borderCol: BRAND.border,
  inputBg: 'rgba(140,20,40,0.04)',
  shadow: BRAND.shadow,
  primary: BRAND.crimson,
  primaryDark: BRAND.deep,
  blue: '#1D4ED8', // CTA حصرياً — لم نجد استخداماً فعلياً له بعد في الملفات المُرسَلة
  blueBg: 'rgba(37,99,235,0.08)',
  green: BRAND.gold, // لا أخضر خارج سياق تصحيح الاختبارات — استُبدل بالذهبي (دور "نشط/إيجابي")
  greenBg: 'rgba(220,140,60,0.10)',
  danger: BRAND.crimson,
  dangerBg: 'rgba(140,20,40,0.08)',
}

export const pageWrap: CSSProperties = {
  minHeight: '100vh',
  background: T.bg,
  color: T.textCol,
  fontFamily: BRAND.fontBody, // كان Calibri مباشرة على كل نص الصفحة — Calibri للعناوين فقط
  padding: '24px 16px 40px',
}

export const cardStyle: CSSProperties = {
  background: T.cardBg,
  borderRadius: BRAND.radiusXl,
  border: `1px solid ${T.borderCol}`,
  boxShadow: T.shadow,
}

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: BRAND.radiusMd,
  border: `1.5px solid ${T.borderCol}`,
  background: 'rgba(140,20,40,0.04)',
  color: T.textCol,
  outline: 'none',
  fontSize: 14,
  fontFamily: 'inherit',
}

export const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: 8,
  fontSize: 13,
  fontWeight: BRAND.weightBlack,
  color: T.textCol,
}