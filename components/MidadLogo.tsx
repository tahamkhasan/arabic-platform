'use client'
// components/MidadLogo.tsx
// يقرأ الشعار من platform_settings أو يستخدم الافتراضي

import { useEffect, useState } from 'react'

interface Props {
  size?:    number
  variant?: 'full' | 'icon' | 'text'
  dark?:    boolean
}

// cache بسيط لتجنب طلبات متكررة
let cachedLogoUrl: string | null = null

export default function MidadLogo({ size = 40, dark = false }: Props) {
  const [logoUrl, setLogoUrl] = useState<string>(cachedLogoUrl ?? '/logo-midad.png')

  useEffect(() => {
    if (cachedLogoUrl) return // استخدم الـ cache

    fetch('/api/platform-settings')
      .then(r => r.json())
      .then(data => {
        const url = data.settings?.logo_url
        if (url) {
          cachedLogoUrl = url
          setLogoUrl(url)
        }
      })
      .catch(() => {}) // استمر بالافتراضي عند الخطأ
  }, [])

  const filter = dark
    ? 'brightness(0) invert(1)'
    : 'drop-shadow(0 2px 6px rgba(192,57,43,0.18))'

  return (
    <img
      src={logoUrl}
      alt="مِداد — تعلّم بذكاء"
      style={{
        height:     size,
        width:      'auto',
        objectFit:  'contain',
        display:    'block',
        filter,
        transition: 'filter 0.2s',
        flexShrink: 0,
      }}
    />
  )
}