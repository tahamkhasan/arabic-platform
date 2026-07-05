'use client'
import { useRouter } from 'next/navigation'
import type { SubjectItem } from '@/types/subjects'
import { TRACK_LABELS, STAGE_GRADES } from '@/types/subjects'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'

function legacyStageLabel(grade?: string | null): string | null {
  if (!grade) return null
  const g = String(grade).trim()
  for (const [stageLabel, grades] of Object.entries(STAGE_GRADES)) {
    if (grades.includes(g)) return stageLabel
  }
  return null
}

export default function SubjectCard({
  subject, deleting, onEdit, onDelete,
}: {
  subject: SubjectItem
  deleting: boolean
  onEdit: (subject: SubjectItem) => void
  onDelete: (subject: SubjectItem) => void
}) {
  const router = useRouter()
  const hasOfferings = (subject.offerings || []).length > 0
  const legacyStage = !hasOfferings ? legacyStageLabel(subject.grade) : null

  return (
    <div style={{
      background: BRAND.bgSoft, borderRadius: BRAND.radiusLg,
      border: `1.5px solid ${BRAND.border}`, padding: 18, boxShadow: BRAND.shadow,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 28 }}>{subject.icon || '📚'}</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: BRAND.text }}>
              {subject.name}
            </div>
            {/* ── اسم المعلم المُعيَّن ── */}
            {subject.teacherName ? (
              <div style={{ fontSize: 12, color: BRAND.crimson, marginTop: 3, fontWeight: BRAND.weightBold, fontFamily: BRAND.fontBody }}>
                👨‍🏫 {subject.teacherName}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: BRAND.muted, marginTop: 3, fontFamily: BRAND.fontBody }}>
                لم يُعيَّن معلم بعد
              </div>
            )}
            {subject.description ? (
              <div style={{ fontSize: 12, color: BRAND.sub, marginTop: 2, lineHeight: 1.6, fontFamily: BRAND.fontBody }}>
                {subject.description}
              </div>
            ) : null}
          </div>
        </div>
        {!subject.is_active ? (
          <span style={{
            fontSize: 11, padding: '3px 8px', borderRadius: 8,
            background: 'rgba(220,100,40,0.12)', color: BRAND.orange,
            fontWeight: BRAND.weightBold, flexShrink: 0, fontFamily: BRAND.fontBody,
          }}>
            معطّلة
          </span>
        ) : null}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {hasOfferings ? (
          subject.offerings.map((o, i) => (
            <span key={i} style={{
              fontSize: 11, padding: '4px 10px', borderRadius: BRAND.radiusPill,
              background: 'rgba(140,20,40,0.07)', color: BRAND.crimson,
              fontWeight: BRAND.weightBold, fontFamily: BRAND.fontBody,
            }}>
              {o.stage} • الصف {o.grade}
              {o.track ? ` • ${TRACK_LABELS[o.track] || o.track}` : ''}
            </span>
          ))
        ) : legacyStage ? (
          <span style={{
            fontSize: 11, padding: '4px 10px', borderRadius: BRAND.radiusPill,
            background: 'rgba(220,140,60,0.14)', color: '#B8550E',
            fontWeight: BRAND.weightBold, fontFamily: BRAND.fontBody,
            border: '1px solid rgba(220,140,60,0.4)',
          }}>
            {legacyStage} • الصف {subject.grade} (بيانات قديمة — حدِّثها من "تعديل")
          </span>
        ) : (
          <span style={{ fontSize: 11, color: BRAND.sub, fontFamily: BRAND.fontBody }}>بلا مرحلة/صف محدّد</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button variant="primary" size="sm" fullWidth
          onClick={() => router.push(`/admin/subjects/${subject.id}/units?subjectName=${encodeURIComponent(subject.name)}`)}>
          📖 الوحدات
        </Button>
        <Button variant="secondary" size="sm" fullWidth onClick={() => onEdit(subject)}>
          ✏️ تعديل
        </Button>
        <Button variant="danger" size="sm" disabled={deleting} onClick={() => onDelete(subject)}>
          🗑️
        </Button>
      </div>
    </div>
  )
}
