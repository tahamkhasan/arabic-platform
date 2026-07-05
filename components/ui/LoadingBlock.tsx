'use client'

import { BRAND } from '@/lib/constants/theme'

export function LoadingBlock({
  text,
  sub,
  accent,
}: {
  text: string
  sub: string
  accent?: string
}) {
  return (
    <div style={{ textAlign: 'center', padding: '30px 20px' }}>
      <div
        style={{
          width: 28,
          height: 28,
          margin: '0 auto 12px',
          border: `3px solid ${accent ? `${accent}25` : 'rgba(140,20,40,0.12)'}`,
          borderTopColor: accent ?? BRAND.crimson,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <div style={{ fontSize: 14, fontWeight: 700, color: accent ?? BRAND.crimson, marginBottom: 4 }}>
        {text}
      </div>
      <div style={{ fontSize: 12, color: sub }}>يرجى الانتظار قليلًا...</div>
    </div>
  )
}