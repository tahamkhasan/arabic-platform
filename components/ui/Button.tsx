'use client'

import { useMemo, useState } from 'react'
import { BRAND } from '@/lib/constants/theme'

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
  sm: {
    padding: '8px 14px',
    fontSize: 13,
    minHeight: 36,
  },
  md: {
    padding: '12px 20px',
    fontSize: 14,
    minHeight: 44,
  },
  lg: {
    padding: '14px 28px',
    fontSize: 16,
    minHeight: 50,
  },
}

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: BRAND.gradMain,
    color: '#fff',
    boxShadow: BRAND.shadowWarm,
    border: 'none',
  },
  cta: {
    background: BRAND.gradBlue,
    color: '#fff',
    boxShadow: BRAND.shadowBlue,
    border: 'none',
  },
  secondary: {
    background: 'rgba(255,255,255,0.82)',
    color: BRAND.crimson,
    border: `1.5px solid ${BRAND.crimson}`,
    boxShadow: 'none',
  },
  ghost: {
    background: 'transparent',
    color: BRAND.sub,
    border: `1px solid ${BRAND.border}`,
    boxShadow: 'none',
  },
  danger: {
    background: BRAND.gradMain,
    color: '#fff',
    boxShadow: BRAND.shadowWarm,
    border: 'none',
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
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [focused, setFocused] = useState(false)

  const variantStyle = VARIANT_STYLES[variant]
  const sizeStyle = SIZE_STYLES[size]

  const transform = useMemo(() => {
    if (disabled) return 'translateY(0)'
    if (pressed) return 'translateY(0)'
    if (hovered) return 'translateY(-1px)'
    return 'translateY(0)'
  }, [disabled, hovered, pressed])

  const shadow = useMemo(() => {
    if (disabled) return 'none'
    if (pressed) {
      if (variant === 'cta') return '0 6px 18px rgba(37, 99, 235, 0.28)'
      if (variant === 'primary' || variant === 'danger') return '0 6px 18px rgba(140, 20, 40, 0.18)'
      if (variant === 'secondary') return '0 4px 14px rgba(120, 20, 30, 0.06)'
      return 'none'
    }
    if (hovered) {
      if (variant === 'cta') return '0 12px 32px rgba(37, 99, 235, 0.42)'
      if (variant === 'primary' || variant === 'danger') return '0 12px 30px rgba(140, 20, 40, 0.22)'
      if (variant === 'secondary') return '0 8px 20px rgba(120, 20, 30, 0.08)'
      return '0 8px 18px rgba(20, 20, 20, 0.05)'
    }
    return variantStyle.boxShadow ?? 'none'
  }, [disabled, hovered, pressed, variant, variantStyle.boxShadow])

  const background = useMemo(() => {
    if (!disabled) return variantStyle.background

    if (variant === 'primary' || variant === 'cta' || variant === 'danger') {
      return 'rgba(190,180,180,0.38)'
    }

    if (variant === 'secondary') {
      return 'rgba(255,255,255,0.62)'
    }

    return 'transparent'
  }, [disabled, variant, variantStyle.background])

  const color = useMemo(() => {
    if (!disabled) return variantStyle.color

    if (variant === 'primary' || variant === 'cta' || variant === 'danger') {
      return 'rgba(95,85,85,0.92)'
    }

    return BRAND.muted
  }, [disabled, variant, variantStyle.color])

  const border = useMemo(() => {
    if (!disabled) return variantStyle.border

    if (variant === 'primary' || variant === 'cta' || variant === 'danger') {
      return `1px solid ${BRAND.borderStrong}`
    }

    if (variant === 'secondary') {
      return `1.5px solid ${BRAND.borderStrong}`
    }

    return `1px solid ${BRAND.border}`
  }, [disabled, variant, variantStyle.border])

  const focusRing = focused && !disabled ? `0 0 0 3px rgba(180, 40, 40, 0.16)` : undefined

  const base: React.CSSProperties = {
    borderRadius: BRAND.radiusMd,
    fontFamily: BRAND.fontBody,
    fontWeight: 800,
    width: fullWidth ? '100%' : 'auto',
    minWidth: fullWidth ? '100%' : undefined,
    display: fullWidth ? 'flex' : 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    gap: 8,
    whiteSpace: 'nowrap',
    userSelect: 'none',
    textDecoration: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition:
      'transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease, background 0.18s ease, border-color 0.18s ease, color 0.18s ease',
    transform,
    boxShadow: focusRing ? `${shadow}, ${focusRing}` : shadow,
    opacity: disabled ? 0.92 : 1,
    background,
    color,
    border,
    ...sizeStyle,
  }

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
      style={base}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false)
        setPressed(false)
      }}
      onMouseDown={() => {
        if (!disabled) setPressed(true)
      }}
      onMouseUp={() => setPressed(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        setPressed(false)
      }}
    >
      {children}
    </button>
  )
}