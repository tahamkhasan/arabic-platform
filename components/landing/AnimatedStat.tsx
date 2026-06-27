'use client'

import { useEffect, useRef, useState } from 'react'
import { BRAND } from '@/lib/constants/theme'

// components/landing/AnimatedStat.tsx
// رقم يتصاعد بحركة سلسة عند ظهوره في الشاشة لأول مرة

type Props = {
  value: number
  label: string
  icon: string
  suffix?: string
  color?: string
}

export default function AnimatedStat({ value, label, icon, suffix = '+', color = BRAND.crimson }: Props) {
  const [display, setDisplay] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) setStarted(true)
      },
      { threshold: 0.4 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!started || value <= 0) return
    const duration = 1100
    const start = performance.now()

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [started, value])

  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 30, marginBottom: 6 }}>{icon}</div>
      <div
        style={{
          fontSize: 'clamp(28px,3.4vw,40px)',
          fontWeight: BRAND.weightBlack,
          fontFamily: BRAND.fontHeading,
          color,
          lineHeight: 1,
          marginBottom: 6,
        }}
      >
        {display}
        {value > 0 ? suffix : ''}
      </div>
      <div style={{ fontSize: 14, color: BRAND.sub, fontFamily: BRAND.fontBody, fontWeight: BRAND.weightSemibold }}>
        {label}
      </div>
    </div>
  )
}
