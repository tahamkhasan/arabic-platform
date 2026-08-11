'use client'

import { useRouter } from 'next/navigation'
import { APP, BRAND } from '@/lib/constants/theme'

export function StudioActions() {
  const router = useRouter()

  return (
    <section
      aria-label="إجراءات سريعة"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: BRAND.spaceSm,
        marginBottom: BRAND.spaceMd,
      }}
    >
      <button
        type="button"
        onClick={() => router.push('/studio/projects/new')}
        style={{
          paddingInline: BRAND.spaceLg,
          paddingBlock: BRAND.spaceSm,
          borderRadius: BRAND.radiusPill,
          border: 'none',
          cursor: 'pointer',
          backgroundImage: APP.gradient, // تدرّج مِداد الرئيس
          color: '#FFFFFF',
          fontSize: 15,
          fontWeight: BRAND.weightBold,
          fontFamily: BRAND.fontHeading,
          boxShadow: APP.btnGlow, // ظل أزرار مِداد
        }}
      >
        + مشروع جديد
      </button>

      <button
        type="button"
        onClick={() => router.push('/studio')}
        style={{
          paddingInline: BRAND.spaceMd,
          paddingBlock: BRAND.spaceSm - 2,
          borderRadius: BRAND.radiusPill,
          border: `1px solid ${APP.borderCol}`,
          cursor: 'pointer',
          backgroundColor: '#FFFFFF',
          color: APP.textCol,
          fontSize: 14,
          fontFamily: BRAND.fontBody,
        }}
      >
        استعراض مشاريعي
      </button>
    </section>
  )
}