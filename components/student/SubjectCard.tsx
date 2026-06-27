'use client'
import { BRAND } from '@/lib/constants/theme'

export type StudentSubject = {
  id: string
  name: string
  icon?: string | null
  teacherName: string | null
  unitsCount: number
}

// ──────────────────────────────────────────────────────────────
// لون ثابت لشارة "X وحدة" — لا يتبع accentColor الشخصي الذي يختاره
// الطالب من مودال الإعدادات. هذا يمنع تكرار "التشوّه الذهبي" الذي
// عولج في /dashboard وفي شريط التبويبات السفلي لـ /student، ويطابق
// الأزرق المخصّص حصرياً لعناصر CTA في هوية مِداد (BRAND.gradBlue).
// ──────────────────────────────────────────────────────────────
const UNITS_BADGE_COLOR = '#2563EB'

function getSubjectImage(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('عرب') || n.includes('لغة'))
    return 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&q=80&auto=format&fit=crop'
  if (n.includes('قرآن') || n.includes('إسلام'))
    return 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&q=80&auto=format&fit=crop'
  if (n.includes('رياض') || n.includes('حساب'))
    return 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&q=80&auto=format&fit=crop'
  if (n.includes('علم') || n.includes('فيزياء'))
    return 'https://images.unsplash.com/photo-1532094349884-543559059c4a?w=800&q=80&auto=format&fit=crop'
  return 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80&auto=format&fit=crop'
}

export default function SubjectCard({
  subject,
  accentColor,
  onClick,
}: {
  subject: StudentSubject
  accentColor: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'right',
        padding: 0,
        borderRadius: 22,
        overflow: 'hidden',
        border: `1px solid ${BRAND.border}`,
        background: BRAND.bgSoft,
        boxShadow: BRAND.shadowWarm,
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ height: 130, overflow: 'hidden', position: 'relative' }}>
        <img
          src={getSubjectImage(subject.name)}
          alt={subject.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {subject.icon && (
          <span
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              fontSize: 26,
              background: 'rgba(255,255,255,0.85)',
              borderRadius: 12,
              padding: '4px 8px',
            }}
          >
            {subject.icon}
          </span>
        )}
      </div>

      <div style={{ padding: '14px 16px' }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: BRAND.weightBlack,
            fontFamily: BRAND.fontHeading,
            color: BRAND.text,
            marginBottom: 6,
          }}
        >
          {subject.name}
        </div>

        {subject.teacherName && (
          <div style={{ fontSize: 12, color: BRAND.sub, marginBottom: 4 }}>
            👨‍🏫 {subject.teacherName}
          </div>
        )}

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: BRAND.weightBold,
            color: UNITS_BADGE_COLOR,
            background: `${UNITS_BADGE_COLOR}10`,
            borderRadius: 999,
            padding: '4px 10px',
          }}
        >
          📖 {subject.unitsCount} وحدة
        </div>
      </div>
    </button>
  )
}
