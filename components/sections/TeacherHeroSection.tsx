'use client'

import type { CSSProperties } from 'react'
import { BRAND } from '@/lib/constants/theme'
import type { UITheme } from '../teacher.types'
import { SummaryStatCard } from '../cards/SummaryStatCard'

export function TeacherHeroSection({
  ui,
  isDark,
  sectionCard,
  smallCard,
  summaryCards,
  platformName,
  userName,
}: {
  ui: UITheme
  isDark: boolean
  sectionCard: CSSProperties
  smallCard: CSSProperties
  summaryCards: Array<{
    icon: string
    label: string
    value: number | string
    color: string
  }>
  platformName: string
  userName: string
}) {
  return (
    <section className="teacher-hero-grid" style={{ ...sectionCard, padding: 20, marginBottom: 18 }}>
      <div
        style={{
          ...smallCard,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 18,
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.76)',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 999,
              background: isDark ? 'rgba(140,20,40,0.10)' : 'rgba(140,20,40,0.08)',
              border: `1px solid ${ui.borderAccent}`,
              color: ui.themeColor,
              fontSize: 13,
              fontWeight: 900,
              marginBottom: 16,
            }}
          >
            ✍️ مساحة المعلم لإنتاج المحتوى
          </div>

          <h1
            style={{
              fontSize: 'clamp(30px,4vw,54px)',
              lineHeight: 1.16,
              margin: '0 0 12px',
              fontFamily: BRAND.fontHeading,
              fontWeight: 900,
              color: ui.text,
            }}
          >
            أهلاً {userName}،
            <span
              style={{
                color: ui.themeColor,
                background: isDark ? 'rgba(140,20,40,0.10)' : 'rgba(140,20,40,0.07)',
                padding: '0 8px',
                borderRadius: 10,
                marginRight: 8,
                display: 'inline-block',
              }}
            >
              أنشئ شرحك واختبارك
            </span>
            <br />
            <span style={{ color: ui.accent2 }}>وخططك</span> من مكان واحد.
          </h1>

          <p style={{ fontSize: 15, color: ui.sub, lineHeight: 1.95, margin: 0, maxWidth: 680 }}>
            {platformName} يوفّر للمعلم لوحة يومية لإرسال المهام، وإدارة الفصول، ومتابعة الإجابات، وإضافة
            الوسائط، ومراجعة الأداء داخل واجهة أوضح وأكثر هدوءًا.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          {[
            'إرسال المهام بسرعة',
            'متابعة الفصول والطلاب',
            'مراجعة الإجابات وتقديرها',
            'إدارة الوسائط والرسائل',
          ].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: ui.accent2,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 14, color: ui.sub, fontWeight: 700 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="teacher-stats-grid">
        {summaryCards.map(card => (
          <SummaryStatCard
            key={card.label}
            ui={ui}
            cardStyle={smallCard}
            icon={card.icon}
            label={card.label}
            value={card.value}
            color={card.color}
          />
        ))}
      </div>
    </section>
  )
}