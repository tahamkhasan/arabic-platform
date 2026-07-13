'use client'
import { BRAND } from '@/lib/constants/theme'
import { T, StatPill } from './studentTheme'

interface StudentHeroProps {
  userName?: string
  stageLabel: string
  gradeLabel: string
  trackLabel: string
  subjectName: string
  lessonName: string
  pendingCount: number
  completedCount: number
  unreadCount: number
  subjectsCount: number
  quizzesCount: number
  hasSelectedLesson: boolean
  onGoHome: () => void
  onGoAssignments: () => void
  onGoPractice: () => void
}

export default function StudentHero({
  userName,
  stageLabel,
  gradeLabel,
  trackLabel,
  subjectName,
  lessonName,
  pendingCount,
  completedCount,
  unreadCount,
  subjectsCount,
  quizzesCount,
  hasSelectedLesson,
  onGoHome,
  onGoAssignments,
  onGoPractice,
}: StudentHeroProps) {
  const accentColor = BRAND.deep

  return (
    <div
      style={{
        background: T.gradWarm,
        borderRadius: 30,
        border: `1px solid ${accentColor}18`,
        boxShadow: T.shadowSoft,
        padding: '24px 24px 20px',
        marginBottom: 22,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -40,
          left: -30,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: `${accentColor}10`,
          filter: 'blur(10px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -45,
          right: -25,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'rgba(37,99,235,0.08)',
          filter: 'blur(10px)',
        }}
      />

      <div
        className="hero-grid"
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '1.25fr .75fr',
          gap: 18,
          alignItems: 'stretch',
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
              background: '#fff',
              border: `1px solid ${accentColor}18`,
              color: accentColor,
              fontSize: 12,
              fontWeight: 800,
              marginBottom: 14,
            }}
          >
            ✨ رحلة تعلمك اليوم
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(25px, 4vw, 36px)',
              fontWeight: 900,
              color: T.titleCol,
              fontFamily: T.fontHeading,
              lineHeight: 1.25,
            }}
          >
            أهلاً {userName?.split(' ')[0] || 'بك'} 👋
          </h1>

          <p style={{ margin: '10px 0 0', fontSize: 14, color: T.subCol, lineHeight: 1.9 }}>
            {stageLabel || 'مرحبًا بك'}
            {gradeLabel ? ` • ${gradeLabel}` : ''}
            {trackLabel ? ` • ${trackLabel}` : ''} • {subjectName}
          </p>

          <p style={{ margin: '8px 0 0', fontSize: 14, color: T.mutedCol, lineHeight: 1.9 }}>
            الدرس الحالي: {lessonName}
          </p>
        </div>

        <div className="summary-grid" style={{ display: 'grid', gap: 10 }}>
          <div
            style={{
              background: 'rgba(255,255,255,0.76)',
              border: `1px solid ${BRAND.crimson}16`,
              borderRadius: 20,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  background: `${BRAND.crimson}12`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                📝
              </div>
              <div>
                <div style={{ fontSize: 13, color: T.subCol }}>بانتظارك</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: BRAND.crimson, fontFamily: T.fontHeading }}>
                  {pendingCount}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: T.mutedCol }}>مهام جديدة</div>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.76)',
              border: `1px solid ${T.green}16`,
              borderRadius: 20,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  background: `${T.green}12`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                ✅
              </div>
              <div>
                <div style={{ fontSize: 13, color: T.subCol }}>أنجزت</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: T.green, fontFamily: T.fontHeading }}>
                  {completedCount}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: T.mutedCol }}>مهام مكتملة</div>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.76)',
              border: `1px solid ${T.blue}16`,
              borderRadius: 20,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  background: `${T.blue}12`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                💬
              </div>
              <div>
                <div style={{ fontSize: 13, color: T.subCol }}>رسائل</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: T.blue, fontFamily: T.fontHeading }}>
                  {unreadCount}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: T.mutedCol }}>غير مقروءة</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
        <StatPill icon="📚" label="المواد" value={subjectsCount} color={accentColor} onClick={onGoHome} />
        <StatPill icon="🎯" label="اختبارات" value={quizzesCount} color={T.blue} onClick={onGoAssignments} />
        <StatPill
          icon="✨"
          label="تدرّب"
          value={hasSelectedLesson ? 'جاهز' : 'اختر درسًا'}
          color={BRAND.orange}
          onClick={onGoPractice}
        />
      </div>
    </div>
  )
}