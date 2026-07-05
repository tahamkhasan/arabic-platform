'use client'

import { useMemo, type ChangeEvent, type RefObject } from 'react'
import {
  STAGE_LABELS,
  GRADES_BY_STAGE,
  TRACK_LABELS,
  type StageKey,
  type TrackKey,
} from '@/lib/constants/stages'
import {
  A,
  formatDate,
  isTrackGrade,
  stageForLegacyGrade,
  type PlatformSignal,
  type Subject,
  type SubjectOccurrence,
} from './admin-utils'

function SectionCard({
  title,
  description,
  children,
}: {
  title?: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section
      style={{
        background: A.card,
        border: `1px solid ${A.border}`,
        borderRadius: 20,
        boxShadow: A.shadow,
        padding: 18,
      }}
    >
      {title ? (
        <div style={{ marginBottom: 14 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: A.weightBlack,
              color: A.text,
              fontFamily: A.fontHeading,
            }}
          >
            {title}
          </h2>
          {description ? (
            <p style={{ margin: '8px 0 0', fontSize: 13, color: A.sub, lineHeight: 1.8 }}>
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '42px 20px',
        background: '#fff',
        border: `1px dashed ${A.border}`,
        borderRadius: 18,
        color: A.sub,
        fontSize: 14,
      }}
    >
      {text}
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string
  value: number
  color: string
  icon: string
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${A.border}`,
        borderRadius: 18,
        boxShadow: A.shadow,
        padding: 18,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, color: A.sub, marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 30, color, fontWeight: A.weightBlack }}>{value}</div>
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: `${color}12`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

export function UsersPanel({
  title,
  description,
  totalCount,
  pendingCount,
  loading,
  searchQ,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  action,
  renderItems,
}: {
  title: string
  description: string
  totalCount: number
  pendingCount: number
  loading: boolean
  searchQ: string
  statusFilter: 'all' | 'pending'
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: 'all' | 'pending') => void
  action?: React.ReactNode
  renderItems: React.ReactNode
}) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
          gap: 14,
        }}
      >
        <StatCard label={`إجمالي ${title}`} value={totalCount} color={A.crimson} icon="👥" />
        <StatCard label="بانتظار الموافقة" value={pendingCount} color={A.orange} icon="⏳" />
      </div>

      <SectionCard title={title} description={description}>
        {action ? <div style={{ marginBottom: 14 }}>{action}</div> : null}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(220px,1fr) 180px',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <input
            value={searchQ}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            placeholder="ابحث بالاسم أو البريد أو الدور"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: `1px solid ${A.border}`,
              background: A.inputBg,
              color: A.text,
              fontFamily: A.fontBody,
            }}
          />

          <select
            value={statusFilter}
            onChange={e => onStatusFilterChange(e.target.value as 'all' | 'pending')}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: `1px solid ${A.border}`,
              background: A.inputBg,
              color: A.text,
              fontFamily: A.fontBody,
            }}
          >
            <option value="all">الكل ({totalCount})</option>
            <option value="pending">بانتظار الموافقة ({pendingCount})</option>
          </select>
        </div>

        {loading ? <EmptyState text="جارٍ التحميل..." /> : <div style={{ display: 'grid', gap: 12 }}>{renderItems}</div>}
      </SectionCard>
    </div>
  )
}

export function StagesPanel({
  subjects,
  activeStageTab,
  activeGrade,
  activeTrack,
  onStageChange,
  onGradeChange,
  onTrackChange,
  onOpenSubjects,
  onOpenPackages,
}: {
  subjects: Subject[]
  activeStageTab: StageKey
  activeGrade: string | null
  activeTrack: TrackKey | null
  onStageChange: (value: StageKey) => void
  onGradeChange: (value: string | null) => void
  onTrackChange: (value: TrackKey | null) => void
  onOpenSubjects: () => void
  onOpenPackages: () => void
}) {
  const occurrencesByStage = useMemo(() => {
    const map: Record<StageKey, SubjectOccurrence[]> = {
      primary: [],
      middle: [],
      secondary: [],
    }

    for (const subject of subjects) {
      const offerings = Array.isArray(subject.offerings) ? subject.offerings : []

      if (offerings.length > 0) {
        for (const offering of offerings) {
          const stage = offering.stage as StageKey
          if (map[stage]) map[stage].push({ subject, offering })
        }
      } else {
        const legacyStage = stageForLegacyGrade(subject.grade)
        if (legacyStage && subject.grade) {
          map[legacyStage].push({
            subject,
            offering: {
              stage: legacyStage,
              grade: String(subject.grade).trim(),
              track: null,
            },
            isLegacy: true,
          })
        }
      }
    }

    return map
  }, [subjects])

  const unassignedSubjects = useMemo(
    () =>
      subjects.filter(
        subject =>
          (!Array.isArray(subject.offerings) || subject.offerings.length === 0) &&
          !stageForLegacyGrade(subject.grade)
      ),
    [subjects]
  )

  const needsTrack = isTrackGrade(activeGrade)

  const gradeOccurrences = useMemo(() => {
    if (!activeGrade) return []
    return occurrencesByStage[activeStageTab].filter(item => {
      if (item.offering.grade !== activeGrade) return false
      if (!needsTrack) return true
      return item.offering.track === activeTrack || item.offering.track === null
    })
  }, [activeGrade, activeStageTab, activeTrack, needsTrack, occurrencesByStage])

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <SectionCard
        title="المراحل الدراسية"
        description="اختر المرحلة ثم الصف ثم التشعيب عند الحاجة لعرض المواد بدقة."
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {(Object.keys(STAGE_LABELS) as StageKey[]).map(stage => {
            const count = new Set(occurrencesByStage[stage].map(item => item.subject.id)).size
            const active = activeStageTab === stage

            return (
              <button
                key={stage}
                onClick={() => {
                  onStageChange(stage)
                  onGradeChange(null)
                  onTrackChange(null)
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: 14,
                  border: active ? `2px solid ${A.crimson}` : `1px solid ${A.border}`,
                  background: active ? 'rgba(140,20,40,0.08)' : '#fff',
                  color: active ? A.crimson : A.text,
                  fontWeight: active ? A.weightBlack : A.weightBold,
                  fontFamily: A.fontBody,
                  cursor: 'pointer',
                }}
              >
                {STAGE_LABELS[stage]} ({count})
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {GRADES_BY_STAGE[activeStageTab].map(grade => {
            const count = occurrencesByStage[activeStageTab].filter(
              item => item.offering.grade === grade.id
            ).length
            const active = activeGrade === grade.id

            return (
              <button
                key={grade.id}
                onClick={() => {
                  onGradeChange(active ? null : grade.id)
                  onTrackChange(null)
                }}
                style={{
                  padding: '10px 16px',
                  borderRadius: 999,
                  border: active ? `2px solid ${A.crimson}` : `1px solid ${A.border}`,
                  background: active ? 'rgba(140,20,40,0.08)' : '#fff',
                  color: active ? A.crimson : A.text,
                  fontWeight: A.weightBold,
                  fontFamily: A.fontBody,
                  cursor: 'pointer',
                }}
              >
                {grade.label} ({count})
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <button
            onClick={onOpenSubjects}
            style={{
              border: 'none',
              cursor: 'pointer',
              borderRadius: 12,
              padding: '10px 14px',
              fontFamily: A.fontBody,
              fontWeight: A.weightBold,
              fontSize: 13,
              background: A.gradMain,
              color: '#fff',
            }}
          >
            إدارة المواد
          </button>

          <button
            onClick={onOpenPackages}
            style={{
              border: `1px solid ${A.border}`,
              cursor: 'pointer',
              borderRadius: 12,
              padding: '10px 14px',
              fontFamily: A.fontBody,
              fontWeight: A.weightBold,
              fontSize: 13,
              background: '#fff',
              color: A.text,
            }}
          >
            إدارة الباقات
          </button>
        </div>

        {needsTrack ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {(Object.keys(TRACK_LABELS) as TrackKey[]).map(track => {
              const count = occurrencesByStage[activeStageTab].filter(
                item =>
                  item.offering.grade === activeGrade &&
                  (item.offering.track === track || item.offering.track === null)
              ).length

              const active = activeTrack === track

              return (
                <button
                  key={track}
                  onClick={() => onTrackChange(active ? null : track)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 999,
                    border: active ? `2px solid ${A.crimson}` : `1px solid ${A.border}`,
                    background: active ? 'rgba(140,20,40,0.08)' : '#fff',
                    color: active ? A.crimson : A.text,
                    fontWeight: A.weightBold,
                    fontFamily: A.fontBody,
                    cursor: 'pointer',
                  }}
                >
                  {TRACK_LABELS[track]} ({count})
                </button>
              )
            })}
          </div>
        ) : null}

        {!activeGrade ? (
          <EmptyState text={`اختر صفاً من ${STAGE_LABELS[activeStageTab]} لعرض المواد.`} />
        ) : needsTrack && !activeTrack ? (
          <EmptyState text="اختر التشعيب لعرض مواد هذا الصف." />
        ) : gradeOccurrences.length === 0 ? (
          <EmptyState text="لا توجد مواد لهذا الصف حالياً." />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
              gap: 12,
            }}
          >
            {gradeOccurrences.map((item, index) => (
              <div
                key={`${item.subject.id}-${item.offering.track ?? 'shared'}-${index}`}
                style={{
                  border: `1px solid ${A.border}`,
                  background: '#fff',
                  borderRadius: 18,
                  padding: 16,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 34, marginBottom: 8 }}>{item.subject.icon || '📚'}</div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: A.weightBlack,
                    color: A.text,
                    fontFamily: A.fontHeading,
                    marginBottom: 6,
                  }}
                >
                  {item.subject.name}
                </div>
                <div style={{ fontSize: 12, color: A.sub }}>
                  الصف {item.offering.grade}
                  {item.offering.track
                    ? ` • ${TRACK_LABELS[item.offering.track]}`
                    : needsTrack
                    ? item.isLegacy
                      ? ' • تشعيب غير محدد'
                      : ' • مشتركة'
                    : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {unassignedSubjects.length > 0 ? (
        <SectionCard title={`مواد بلا صف محدد (${unassignedSubjects.length})`}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
              gap: 12,
            }}
          >
            {unassignedSubjects.map(subject => (
              <div
                key={subject.id}
                style={{
                  border: `1px dashed ${A.border}`,
                  background: '#fff',
                  borderRadius: 18,
                  padding: 16,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 34, marginBottom: 8 }}>{subject.icon || '📚'}</div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: A.weightBlack,
                    color: A.text,
                    fontFamily: A.fontHeading,
                  }}
                >
                  {subject.name}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  )
}

export function SignalsPanel({
  signals,
  loading,
  resolvingSignalId,
  onResolve,
}: {
  signals: PlatformSignal[]
  loading: boolean
  resolvingSignalId: string | null
  onResolve: (signalId: string, status: 'dismissed' | 'action_taken') => void
}) {
  return (
    <SectionCard
      title="الإشارات"
      description="هذه التنبيهات للمراجعة الإدارية فقط، ولا تُنفذ أي خطوة تلقائياً."
    >
      {loading ? (
        <EmptyState text="جارٍ تحميل الإشارات..." />
      ) : signals.length === 0 ? (
        <EmptyState text="لا توجد إشارات حالياً." />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {signals.map(signal => {
            const isStudent = signal.signal_type === 'student_struggling'
            const evidence: any = signal.evidence
            const resolving = resolvingSignalId === signal.id

            return (
              <article
                key={signal.id}
                style={{
                  border: `1px solid ${isStudent ? 'rgba(220,100,40,0.30)' : 'rgba(140,20,40,0.30)'}`,
                  borderRadius: 18,
                  background: '#fff',
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 10,
                    flexWrap: 'wrap',
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: A.weightBlack,
                      color: A.text,
                      fontFamily: A.fontHeading,
                    }}
                  >
                    {isStudent ? 'تعثّر طلابي' : 'بطء في استجابة المعلم'}
                  </div>

                  <div style={{ fontSize: 11, color: A.sub }}>{formatDate(signal.created_at)}</div>
                </div>

                {isStudent ? (
                  <div style={{ fontSize: 13, color: A.text, lineHeight: 1.9, marginBottom: 14 }}>
                    <div style={{ marginBottom: 6 }}>
                      الفصل: <strong>{evidence.class_name}</strong> • المعلم:{' '}
                      <strong>{evidence.teacher_name}</strong>
                    </div>

                    {evidence.signals.map((item: any, index: number) => (
                      <div key={index} style={{ color: A.sub }}>
                        — {item.affected_count} طلاب متأثرون في <strong>{item.area_label}</strong>،
                        ومتوسط الدقة {item.avg_accuracy}٪
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: A.text, lineHeight: 1.9, marginBottom: 14 }}>
                    المعلم <strong>{evidence.teacher_name}</strong> متوسط استجابته{' '}
                    <strong>{evidence.avg_response_hours} ساعة</strong>، مقابل متوسط عام{' '}
                    {evidence.overall_avg_hours} ساعة، وبنسبة بطء تقارب {evidence.ratio}×.
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    disabled={resolving}
                    onClick={() => onResolve(signal.id, 'dismissed')}
                    style={{
                      borderRadius: 10,
                      padding: '8px 12px',
                      fontSize: 12,
                      fontWeight: A.weightBold,
                      fontFamily: A.fontBody,
                      cursor: resolving ? 'not-allowed' : 'pointer',
                      border: `1px solid ${A.border}`,
                      background: '#fff',
                      color: A.sub,
                    }}
                  >
                    تجاهل
                  </button>

                  <button
                    disabled={resolving}
                    onClick={() => onResolve(signal.id, 'action_taken')}
                    style={{
                      borderRadius: 10,
                      padding: '8px 12px',
                      fontSize: 12,
                      fontWeight: A.weightBold,
                      fontFamily: A.fontBody,
                      cursor: resolving ? 'not-allowed' : 'pointer',
                      border: 'none',
                      background: 'rgba(140,20,40,0.11)',
                      color: A.crimson,
                    }}
                  >
                    {resolving ? 'جارٍ الحفظ...' : 'تم التدخل'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}

export function StatsPanel({
  usersCount,
  studentsCount,
  teachersCount,
  pendingCount,
  subjectsCount,
}: {
  usersCount: number
  studentsCount: number
  teachersCount: number
  pendingCount: number
  subjectsCount: number
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
        gap: 14,
      }}
    >
      <StatCard label="إجمالي المستخدمين" value={usersCount} color={A.deep} icon="👥" />
      <StatCard label="الطلاب" value={studentsCount} color={A.red} icon="🎓" />
      <StatCard label="المعلمون" value={teachersCount} color={A.crimson} icon="👨‍🏫" />
      <StatCard label="بانتظار الموافقة" value={pendingCount} color={A.orangeRed} icon="⏳" />
      <StatCard label="المواد" value={subjectsCount} color={A.gold} icon="📚" />
    </div>
  )
}

export function SettingsPanel({
  logoUrl,
  logoFile,
  previewUrl,
  uploadMsg,
  uploading,
  logoInputRef,
  onPickClick,
  onFileChange,
  onUpload,
}: {
  logoUrl: string
  logoFile: File | null
  previewUrl: string
  uploadMsg: string
  uploading: boolean
  logoInputRef: RefObject<HTMLInputElement | null>
  onPickClick: () => void
  onFileChange: (file: File | null) => void
  onUpload: () => void
}) {
  return (
    <SectionCard title="إعدادات المنصة" description="رفع الشعار الحالي ومعاينته قبل الحفظ.">
      <div style={{ maxWidth: 560 }}>
        <div
          style={{
            textAlign: 'center',
            marginBottom: 20,
            padding: 24,
            borderRadius: 18,
            background: '#fff',
            border: `1px dashed ${A.border}`,
          }}
        >
          <img
            src={logoUrl}
            alt="الشعار الحالي"
            style={{ maxHeight: 84, maxWidth: '100%', objectFit: 'contain' }}
          />
          <div style={{ fontSize: 12, color: A.sub, marginTop: 10 }}>الشعار الحالي</div>
        </div>

        <input
          ref={logoInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          style={{ display: 'none' }}
          onChange={e => onFileChange(e.target.files?.[0] ?? null)}
        />

        <button
          onClick={onPickClick}
          style={{
            width: '100%',
            padding: 16,
            borderRadius: 16,
            border: `2px dashed ${logoFile ? A.crimson : A.border}`,
            background: logoFile ? 'rgba(140,20,40,0.06)' : 'transparent',
            color: logoFile ? A.crimson : A.sub,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: A.weightBold,
            fontFamily: A.fontBody,
            marginBottom: 14,
          }}
        >
          {logoFile ? `تم اختيار: ${logoFile.name}` : 'اختر ملف الشعار'}
        </button>

        {logoFile && previewUrl ? (
          <div
            style={{
              marginBottom: 14,
              padding: 14,
              borderRadius: 14,
              background: '#fff',
              border: `1px solid ${A.border}`,
            }}
          >
            <div style={{ fontSize: 12, color: A.sub, marginBottom: 8 }}>
              الحجم: {(logoFile.size / 1024).toFixed(1)} KB
            </div>
            <img
              src={previewUrl}
              alt="معاينة الشعار"
              style={{ maxHeight: 64, maxWidth: '100%', objectFit: 'contain' }}
            />
          </div>
        ) : null}

        {uploadMsg ? (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              marginBottom: 14,
              background: 'rgba(140,20,40,0.08)',
              border: `1px solid rgba(140,20,40,0.20)`,
              color: A.crimson,
              fontSize: 13,
              fontWeight: A.weightBold,
            }}
          >
            {uploadMsg}
          </div>
        ) : null}

        <button
          onClick={onUpload}
          disabled={uploading || !logoFile}
          style={{
            width: '100%',
            border: 'none',
            cursor: uploading || !logoFile ? 'not-allowed' : 'pointer',
            borderRadius: 12,
            padding: '12px 14px',
            fontFamily: A.fontBody,
            fontWeight: A.weightBold,
            fontSize: 13,
            background: A.gradMain,
            color: '#fff',
            opacity: uploading || !logoFile ? 0.6 : 1,
          }}
        >
          {uploading ? 'جارٍ الرفع...' : 'رفع الشعار'}
        </button>
      </div>
    </SectionCard>
  )
}