'use client'

import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'

type Props = {
  onBack: () => void
  onRefresh: () => void
  onCreate: () => void
}

export default function RolesToolbar({ onBack, onRefresh, onCreate }: Props) {
  return (
    <div
      style={{
        borderRadius: BRAND.radiusXl,
        boxShadow: BRAND.shadow,
        padding: 20,
        marginBottom: 18,
        background: `linear-gradient(180deg, ${BRAND.bgSoft} 0%, #FFFFFF 100%)`,
        fontFamily: BRAND.fontBody,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 30,
              fontWeight: BRAND.weightBlack,
              fontFamily: BRAND.fontHeading,
              color: BRAND.crimson,
              lineHeight: 1.2,
            }}
          >
            إدارة الأدوار
          </h1>
          <p
            style={{
              margin: '8px 0 0',
              color: BRAND.sub,
              fontSize: 14,
              lineHeight: 1.9,
              maxWidth: 720,
            }}
          >
            صفحة مركزية لإدارة أدوار المنصة وصلاحياتها، مع إمكانية الإنشاء والتعديل
            والحذف، تمهيدًا لربط كل دور بسلوك الواجهة والـ API داخل مِداد.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="ghost" onClick={onBack}>العودة إلى الأدمن</Button>
          <Button variant="ghost" onClick={onRefresh}>تحديث</Button>
          <Button variant="primary" onClick={onCreate}>إضافة دور جديد</Button>
        </div>
      </div>
    </div>
  )
}
