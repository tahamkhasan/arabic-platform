'use client'
import { BRAND } from '@/lib/constants/theme'

// components/ui/Button.tsx
// مكوّن الأزرار الموحَّد لمنصة مِداد — كل زر جديد في المشروع يجب أن
// يستخدم هذا المكوّن بدل تعريف أنماط جديدة مباشرة.

export type ButtonVariant = 'primary' | 'cta' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = {
  children: React.ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  fullWidth?: boolean
  title?: string
}

const SIZE_STYLES: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '8px 14px', fontSize: 13 },
  md: { padding: '12px 20px', fontSize: 14 },
  lg: { padding: '14px 28px', fontSize: 16 },
}

// كل المتغيرات داخل لوحة الألوان المعتمدة فقط — الأزرق حصرياً لـ CTA
const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  // أساسي — التدرج الأحمر/القرمزي، للأفعال الرئيسية في سياق المحتوى
  primary: {
    background: BRAND.gradMain,
    color: '#fff',
    boxShadow: BRAND.shadowWarm,
  },
  // CTA — أزرق، حصرياً للدعوات التي تحتاج تمييزاً حاداً (تسجيل، بدء تجربة)
  cta: {
    background: BRAND.gradBlue,
    color: '#fff',
    boxShadow: BRAND.shadowBlue,
  },
  // ثانوي — حدّ قرمزي بلا تعبئة، للأفعال العادية (تعديل، فتح)
  secondary: {
    background: 'transparent',
    color: BRAND.crimson,
    border: `1.5px solid ${BRAND.crimson}`,
  },
  // شفّاف — للأفعال الخفيفة (إغلاق، تخطّي، إعدادات)
  ghost: {
    background: 'transparent',
    color: BRAND.sub,
    border: `1px solid ${BRAND.border}`,
  },
  // خطر — حذف/إلغاء/خروج
  danger: {
    background: 'rgba(140,20,40,0.06)',
    color: BRAND.crimson,
    border: `1px solid ${BRAND.borderStrong}`,
  },
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
  fullWidth = false,
  title,
}: ButtonProps) {
  const base: React.CSSProperties = {
    borderRadius: BRAND.radiusMd,
    fontFamily: BRAND.fontBody,
    fontWeight: BRAND.weightBold,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    width: fullWidth ? '100%' : 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'opacity 0.15s',
    opacity: disabled ? 0.5 : 1,
    ...SIZE_STYLES[size],
    ...VARIANT_STYLES[variant],
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title} style={base}>
      {children}
    </button>
  )
}
