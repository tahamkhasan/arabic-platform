'use client'

import { useEffect, useState, useCallback } from 'react'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'
import { STAGE_LABELS, GRADES_BY_STAGE, TRACK_LABELS, StageKey, TrackKey } from '@/lib/constants/stages'

type Subject = { id: string; name: string; icon?: string | null }
type Package = { id: string; name: string; description?: string | null; subjects: Subject[] }

type SubscriptionItem = {
  id: string
  subscription_type: 'subject' | 'package'
  subject_id: string | null
  package_id: string | null
  subjects: Subject | null
  subject_packages: { id: string; name: string } | null
  assigned_at: string
}

type Props = {
  studentId: string
  studentEmail: string
  studentName?: string | null
  stage: StageKey | null
  grade: string | null
  track: TrackKey | null
  accessToken: string
  onClose: () => void
}

export default function StudentSubscriptionsModal({
  studentId,
  studentEmail,
  studentName,
  stage,
  grade,
  track,
  accessToken,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([])
  const [availablePackages, setAvailablePackages] = useState<Package[]>([])

  const [pickSubjectId, setPickSubjectId] = useState('')
  const [pickPackageId, setPickPackageId] = useState('')

  const hasStage = Boolean(stage && grade)

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  }

  const loadAll = useCallback(async () => {
    if (!hasStage) {
      setLoading(false)
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const params = new URLSearchParams({ stage: stage as string, grade: grade as string })
      if (track) params.set('track', track)

      const [subsRes, subjectsRes, packagesRes] = await Promise.all([
        fetch(`/api/students/${studentId}/subscriptions`, { headers: authHeaders }),
        fetch(`/api/subjects?${params.toString()}`),
        fetch(`/api/subject-packages?${params.toString()}`),
      ])

      const subsData = await subsRes.json().catch(() => null)
      const subjectsData = await subjectsRes.json().catch(() => null)
      const packagesData = await packagesRes.json().catch(() => null)

      setSubscriptions(subsData?.items ?? [])
      setAvailableSubjects(subjectsData?.subjects ?? [])
      setAvailablePackages(packagesData?.items ?? [])
    } catch {
      setMessage('❌ تعذر تحميل بيانات الاشتراكات.')
    } finally {
      setLoading(false)
    }
  }, [studentId, stage, grade, track, accessToken, hasStage])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // المواد المُغطّاة فعلياً (مباشرة أو عبر باقة) — تُستبعَد من قائمة "إسناد مادة"
  const coveredSubjectIds = new Set<string>()
  for (const sub of subscriptions) {
    if (sub.subject_id) coveredSubjectIds.add(sub.subject_id)
  }
  const assignableSubjects = availableSubjects.filter(s => !coveredSubjectIds.has(s.id))

  const assignedPackageIds = new Set(subscriptions.filter(s => s.package_id).map(s => s.package_id))
  const assignablePackages = availablePackages.filter(p => !assignedPackageIds.has(p.id))

  async function assignSubject() {
    if (!pickSubjectId || !stage || !grade) return
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch(`/api/students/${studentId}/subscriptions`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ type: 'subject', subjectId: pickSubjectId, stage, grade, track }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setMessage(`❌ ${data?.error || 'فشل الإسناد.'}`)
        return
      }
      setPickSubjectId('')
      setMessage('✅ تم إسناد المادة بنجاح.')
      await loadAll()
    } catch {
      setMessage('❌ تعذر الاتصال.')
    } finally {
      setSaving(false)
    }
  }

  async function assignPackage() {
    if (!pickPackageId || !stage || !grade) return
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch(`/api/students/${studentId}/subscriptions`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ type: 'package', packageId: pickPackageId, stage, grade, track }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setMessage(`❌ ${data?.error || 'فشل الإسناد.'}`)
        return
      }
      setPickPackageId('')
      setMessage('✅ تم إسناد الباقة بنجاح.')
      await loadAll()
    } catch {
      setMessage('❌ تعذر الاتصال.')
    } finally {
      setSaving(false)
    }
  }

  async function removeSubscription(subscriptionId: string) {
    if (!confirm('إزالة هذا الاشتراك؟')) return
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch(`/api/students/${studentId}/subscriptions`, {
        method: 'DELETE',
        headers: authHeaders,
        body: JSON.stringify({ subscriptionId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setMessage(`❌ ${data?.error || 'فشل الإزالة.'}`)
        return
      }
      await loadAll()
    } catch {
      setMessage('❌ تعذر الاتصال.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(31,18,21,0.4)',
        backdropFilter: 'blur(6px)',
        zIndex: 130,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 600,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: BRAND.bgSoft,
          borderRadius: BRAND.radiusXl,
          border: `1.5px solid ${BRAND.border}`,
          boxShadow: BRAND.shadow,
          padding: 22,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: BRAND.text, marginBottom: 4 }}>
              📚 اشتراكات الطالب
            </div>
            <div style={{ fontSize: 13, color: BRAND.sub }}>{studentName || studentEmail}</div>
          </div>
          <Button variant="ghost" size="sm" disabled={saving} onClick={onClose}>إغلاق</Button>
        </div>

        {/* شريط المرحلة/الصف/التشعيب — عرض فقط */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            padding: '12px 14px',
            borderRadius: BRAND.radiusMd,
            background: 'rgba(140,20,40,0.05)',
            border: `1px solid ${BRAND.border}`,
            marginBottom: 18,
          }}
        >
          {hasStage ? (
            <>
              <span style={{ padding: '5px 12px', borderRadius: 999, background: 'rgba(140,20,40,0.08)', color: BRAND.crimson, fontWeight: BRAND.weightBold, fontSize: 12 }}>
                {STAGE_LABELS[stage as StageKey]}
              </span>
              <span style={{ padding: '5px 12px', borderRadius: 999, background: 'rgba(140,20,40,0.08)', color: BRAND.crimson, fontWeight: BRAND.weightBold, fontSize: 12 }}>
                {GRADES_BY_STAGE[stage as StageKey]?.find(g => g.id === grade)?.label ?? `الصف ${grade}`}
              </span>
              {track && (
                <span style={{ padding: '5px 12px', borderRadius: 999, background: 'rgba(140,20,40,0.08)', color: BRAND.crimson, fontWeight: BRAND.weightBold, fontSize: 12 }}>
                  {TRACK_LABELS[track]}
                </span>
              )}
            </>
          ) : (
            <span style={{ fontSize: 13, color: BRAND.orange, fontWeight: BRAND.weightBold }}>
              ⚠️ لم تُحدَّد مرحلة/صف هذا الطالب بعد — حدِّدها أولاً (زر "تعيين الصف") قبل إسناد أي اشتراك.
            </span>
          )}
        </div>

        {message && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: BRAND.radiusSm,
              marginBottom: 16,
              fontSize: 13,
              fontWeight: BRAND.weightBold,
              background: message.startsWith('✅') ? 'rgba(220,140,60,0.10)' : 'rgba(140,20,40,0.08)',
              color: message.startsWith('✅') ? BRAND.gold : BRAND.crimson,
            }}
          >
            {message}
          </div>
        )}

        {!hasStage ? null : loading ? (
          <p style={{ textAlign: 'center', color: BRAND.sub, padding: '30px 0' }}>⏳ جارٍ التحميل...</p>
        ) : (
          <>
            {/* الاشتراكات الحالية */}
            <div style={{ fontSize: 14, fontWeight: BRAND.weightBlack, color: BRAND.text, marginBottom: 10 }}>
              الاشتراكات الحالية ({subscriptions.length})
            </div>
            {subscriptions.length === 0 ? (
              <p style={{ fontSize: 13, color: BRAND.sub, marginBottom: 20 }}>لا يوجد أي اشتراك فعلي حتى الآن.</p>
            ) : (
              <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
                {subscriptions.map(sub => (
                  <div
                    key={sub.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: BRAND.radiusSm,
                      background: '#fff',
                      border: `1px solid ${BRAND.border}`,
                    }}
                  >
                    <div style={{ fontSize: 13, color: BRAND.text, fontWeight: BRAND.weightSemibold }}>
                      {sub.subscription_type === 'subject' ? '📘' : '📦'}{' '}
                      {sub.subscription_type === 'subject'
                        ? sub.subjects?.name ?? 'مادة محذوفة'
                        : `باقة: ${sub.subject_packages?.name ?? 'باقة محذوفة'}`}
                    </div>
                    <button
                      onClick={() => removeSubscription(sub.id)}
                      disabled={saving}
                      style={{ background: 'none', border: 'none', color: BRAND.crimson, cursor: 'pointer', fontSize: 12, fontWeight: BRAND.weightBold, fontFamily: 'inherit' }}
                    >
                      🗑️ إزالة
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* إسناد مادة */}
            <div style={{ fontSize: 14, fontWeight: BRAND.weightBlack, color: BRAND.text, marginBottom: 10 }}>
              إسناد مادة مفردة
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <select
                value={pickSubjectId}
                onChange={e => setPickSubjectId(e.target.value)}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: BRAND.radiusSm,
                  border: `1px solid ${BRAND.border}`, background: '#fff', color: BRAND.text,
                  fontSize: 13, fontFamily: 'inherit',
                }}
              >
                <option value="">
                  {assignableSubjects.length === 0 ? 'لا توجد مواد متاحة للإسناد' : 'اختر مادة'}
                </option>
                {assignableSubjects.map(s => (
                  <option key={s.id} value={s.id}>{s.icon ? `${s.icon} ` : ''}{s.name}</option>
                ))}
              </select>
              <Button variant="primary" size="sm" disabled={!pickSubjectId || saving} onClick={assignSubject}>
                إسناد
              </Button>
            </div>

            {/* إسناد باقة */}
            <div style={{ fontSize: 14, fontWeight: BRAND.weightBlack, color: BRAND.text, marginBottom: 10 }}>
              إسناد باقة كاملة
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={pickPackageId}
                onChange={e => setPickPackageId(e.target.value)}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: BRAND.radiusSm,
                  border: `1px solid ${BRAND.border}`, background: '#fff', color: BRAND.text,
                  fontSize: 13, fontFamily: 'inherit',
                }}
              >
                <option value="">
                  {assignablePackages.length === 0 ? 'لا توجد باقات متاحة لهذا الصف' : 'اختر باقة'}
                </option>
                {assignablePackages.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.subjects.length} مادة)</option>
                ))}
              </select>
              <Button variant="primary" size="sm" disabled={!pickPackageId || saving} onClick={assignPackage}>
                إسناد
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
