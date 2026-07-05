'use client'

import type { CSSProperties } from 'react'
import { BRAND } from '@/lib/constants/theme'
import type { UITheme } from '../teacher.types'

export function TeacherInsightsSection({
  ui,
  isDark,
  sectionCard,
  smallCard,
  insights,
  onDismiss,
}: {
  ui: UITheme
  isDark: boolean
  sectionCard: CSSProperties
  smallCard: CSSProperties
  insights: any[]
  onDismiss: () => void
}) {
  if (!insights.length) return null

  return (
    <section
      className="fade-in"
      style={{
        ...sectionCard,
        marginBottom: 18,
        padding: 18,
        background: isDark ? 'rgba(217,119,6,0.07)' : 'rgba(217,119,6,0.06)',
        borderColor: ui.warnBorder,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 900,
            color: BRAND.orange,
            margin: 0,
            fontFamily: BRAND.fontHeading,
          }}
        >
          🔎 إشارات تستحق الانتباه
        </h3>

        <button
          type="button"
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', color: ui.sub, fontSize: 18, cursor: 'pointer' }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {insights.map((ci: any) => (
          <div key={ci.class_id} style={{ ...smallCard, padding: '14px 16px' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: ui.text, marginBottom: 10 }}>{ci.class_name}</div>

            {ci.signals.length > 0 && (
              <div style={{ display: 'grid', gap: 8, marginBottom: ci.struggling_students.length > 0 ? 12 : 0 }}>
                {ci.signals.map((s: any, i: number) => (
                  <div key={i} style={{ fontSize: 13, color: ui.text, lineHeight: 1.8 }}>
                    <strong>{s.affected_count}</strong> طالبًا يحتاجون دعمًا في <strong>{s.area_label}</strong> بمتوسط
                    دقة {s.avg_accuracy}%
                  </div>
                ))}
              </div>
            )}

            {ci.struggling_students.length > 0 && (
              <div style={{ fontSize: 13, color: BRAND.crimson, lineHeight: 1.8 }}>
                أبرز الطلاب المحتاجين للدعم:{' '}
                <strong>{ci.struggling_students.map((s: any) => s.name).join('، ')}</strong>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}