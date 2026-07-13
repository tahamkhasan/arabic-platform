'use client'
import { BRAND } from '@/lib/constants/theme'
import { T, sectionCard } from '../adminTheme'

interface OverviewTabProps {
  studentsCount: number
  teachersCount: number
  pendingCount: number
  subjectsCount: number
}

export default function OverviewTab({ studentsCount, teachersCount, pendingCount, subjectsCount }: OverviewTabProps) {
  const cards = [
    { label: 'الطلاب', value: studentsCount, icon: '🎓', color: BRAND.crimson },
    { label: 'المعلمون', value: teachersCount, icon: '👨‍🏫', color: BRAND.orange },
    { label: 'انتظار الموافقة', value: pendingCount, icon: '⏳', color: BRAND.red },
    { label: 'المواد', value: subjectsCount, icon: '📚', color: BRAND.deep },
  ]

  return (
    <section className="fade-in" style={{ ...sectionCard, marginBottom: 18 }}>
      <div
        className="hero-grid-admin"
        style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 22, alignItems: 'stretch' }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 999,
              background: 'rgba(140,20,40,0.08)',
              border: '1px solid rgba(140,20,40,0.16)',
              color: BRAND.crimson,
              fontSize: 13,
              fontWeight: BRAND.weightBlack,
              marginBottom: 16,
            }}
          >
            👑 مركز التحكم
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px,4vw,42px)',
              fontWeight: BRAND.weightBlack,
              fontFamily: BRAND.fontHeading,
              color: T.textCol,
              margin: '0 0 10px',
              lineHeight: 1.2,
            }}
          >
            إدارة المنصة من مكان واحد
          </h1>

          <p style={{ fontSize: 15, color: T.subCol, lineHeight: 1.95, margin: 0, maxWidth: 700 }}>
            راقب الطلاب والمعلمين، اعتمد الحسابات، وزّع الصلاحيات، وتابع المراحل والمواد والإشارات بسرعة وبنفس الهوية
            البصرية الأصلية للمنصة.
          </p>
        </div>

        <div
          className="overview-stats-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}
        >
          {cards.map(card => (
            <div
              key={card.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 10,
                background: 'rgba(255,255,255,0.76)',
                border: `1.5px solid ${card.color}22`,
                borderRadius: BRAND.radiusXl,
                padding: '26px 18px',
                boxShadow: T.shadow,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  background: `${card.color}14`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                }}
              >
                {card.icon}
              </div>
              <div style={{ fontSize: 36, fontWeight: BRAND.weightBlack, color: card.color, fontFamily: BRAND.fontHeading, lineHeight: 1 }}>
                {card.value}
              </div>
              <div style={{ fontSize: 14, color: T.subCol, fontWeight: BRAND.weightBold }}>{card.label}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .overview-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .overview-stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}