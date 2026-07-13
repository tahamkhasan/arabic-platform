// components/admin/tabs/StatsTab.tsx
'use client'
import { BRAND } from '@/lib/constants/theme'
import { T, sectionCard } from '../adminTheme'

interface StatsTabProps {
  usersTotal: number
  studentsCount: number
  teachersCount: number
  pendingCount: number
  approvedCount: number
  subjectsCount: number
}

export default function StatsTab({ usersTotal, studentsCount, teachersCount, pendingCount, approvedCount, subjectsCount }: StatsTabProps) {
  return (
    <div className="fade-in" style={sectionCard}>
      <h2 style={{ fontSize: 22, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: BRAND.crimson, margin: '0 0 20px' }}>
        📊 إحصائيات النظام
      </h2>

      <div className="admin-stats-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
        {[
          { label: 'إجمالي المستخدمين', value: usersTotal, color: BRAND.deep, icon: '👥' },
          { label: 'طلاب مسجلون', value: studentsCount, color: BRAND.red, icon: '🎓' },
          { label: 'معلمون', value: teachersCount, color: BRAND.crimson, icon: '👨‍🏫' },
          { label: 'بانتظار الموافقة', value: pendingCount, color: BRAND.orangeRed, icon: '⏳' },
          { label: 'مستخدمون مفعّلون', value: approvedCount, color: BRAND.orange, icon: '✅' },
          { label: 'مواد دراسية', value: subjectsCount, color: BRAND.crimson, icon: '📚' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '20px', borderRadius: BRAND.radiusMd, background: 'rgba(255,255,255,0.72)', border: `1.5px solid ${s.color}20`, boxShadow: T.shadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: T.subCol, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 32, fontWeight: BRAND.weightBlack, color: s.color }}>{s.value}</div>
              </div>
              <div style={{ fontSize: 36, opacity: 0.6 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}