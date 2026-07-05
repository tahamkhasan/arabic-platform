'use client'
import { useEffect, useState } from 'react'
import { BRAND } from '@/lib/constants/theme'
import {
       STAGE_LABELS,
       GRADES_BY_STAGE,
       TRACK_LABELS,
       StageKey,
       TrackKey,
     } from '@/lib/constants/stages'
  
// ──────────────────────────────────────────────────────────────
// components/admin/TeacherManager.tsx (جديد)
//
// مكوّن مستقل يضم:
// 1) AddTeacherModal — مودال إنشاء حساب معلم مباشرة (اسم/بريد/كلمة سر)
// 2) AssignSubjectsModal — مودال تخصيص مواد متعددة لمعلم (checkboxes)
//
// يُستورَد ويُستخدَم من app/admin/page.tsx مباشرة، بدل تضخيم الملف
// الرئيسي. كلا المودالين يتطلبان accessToken (Supabase session)
// لأن نقطتي الـ API الخلفيتين (/api/teachers و /api/teacher-subjects)
// محميتان بـ requireAdminOrPermission('create_teachers').
// ──────────────────────────────────────────────────────────────

const T = {
  cardBg: BRAND.bgSoft,
  text: BRAND.text,
  sub: BRAND.sub,
  border: BRAND.border,
  crimson: BRAND.crimson,
  shadow: BRAND.shadow,
}

type Subject = {
  id: string
  name: string
  grade?: string
  icon?: string
}

// ════════════════════════════════════════════════════════════
// مودال إضافة معلم جديد
// ════════════════════════════════════════════════════════════
export function AddTeacherModal({
  accessToken,
  onClose,
  onCreated,
}: {
  accessToken: string
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit() {
    setError('')
    if (!name.trim() || !email.trim() || !password) {
      setError('يرجى تعبئة جميع الحقول.')
      return
    }
    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'فشل إنشاء حساب المعلم.')
        return
      }

      setDone(true)
      onCreated()
      setTimeout(onClose, 1400)
    } catch {
      setError('تعذّر الاتصال بالخادم.')
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
          maxWidth: 440,
          background: T.cardBg,
          borderRadius: BRAND.radiusXl,
          border: `1.5px solid ${T.border}`,
          boxShadow: BRAND.shadow,
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, fontFamily: BRAND.fontHeading, color: T.text, margin: 0 }}>
            ➕ إضافة معلم جديد
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.sub, fontSize: 22, cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
            <p style={{ color: BRAND.crimson, fontWeight: 800 }}>تم إنشاء حساب المعلم بنجاح.</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: T.sub, marginBottom: 16, lineHeight: 1.8 }}>
              يُفعَّل الحساب فوراً — لا حاجة لموافقة لاحقة لأنك أنشأته بنفسك.
            </p>

            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  marginBottom: 14,
                  fontSize: 13,
                  background: 'rgba(140,20,40,0.08)',
                  border: '1px solid rgba(140,20,40,0.25)',
                  color: BRAND.crimson,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: T.sub, display: 'block', marginBottom: 6 }}>
                  الاسم الكامل
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="اسم المعلم"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${T.border}`,
                    background: '#fff',
                    color: T.text,
                    fontSize: 14,
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: T.sub, display: 'block', marginBottom: 6 }}>
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="teacher@example.com"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${T.border}`,
                    background: '#fff',
                    color: T.text,
                    fontSize: 14,
                    fontFamily: 'inherit',
                    direction: 'ltr',
                    textAlign: 'right',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: T.sub, display: 'block', marginBottom: 6 }}>
                  كلمة المرور
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="8 أحرف على الأقل"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${T.border}`,
                    background: '#fff',
                    color: T.text,
                    fontSize: 14,
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 12,
                border: 'none',
                background: saving ? T.border : BRAND.gradMain,
                color: '#fff',
                fontWeight: 900,
                fontSize: 15,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {saving ? 'جارٍ الإنشاء...' : '✅ إنشاء الحساب'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// مودال تخصيص المواد لمعلم (اختيار متعدد)
// ════════════════════════════════════════════════════════════
export function AssignSubjectsModal({
  teacherId,
  teacherEmail,
  accessToken,
  onClose,
}: {
  teacherId: string
  teacherEmail: string
  accessToken: string
  onClose: () => void
}) {
  const [allSubjects, setAllSubjects] = useState<Subject[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)

    Promise.all([
      fetch('/api/subjects').then(r => r.json()),
      fetch(`/api/teacher-subjects?teacherId=${teacherId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(r => r.json()),
    ])
      .then(([subjectsRes, assignedRes]) => {
        if (!mounted) return
        setAllSubjects(subjectsRes?.subjects ?? [])
        setSelected(new Set(assignedRes?.subjectIds ?? []))
      })
      .catch(() => {
        if (mounted) setError('تعذّر تحميل المواد.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [teacherId, accessToken])

  function toggle(subjectId: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(subjectId)) next.delete(subjectId)
      else next.add(subjectId)
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/teacher-subjects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ teacherId, subjectIds: Array.from(selected) }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'فشل حفظ المواد.')
        return
      }

      setDone(true)
      setTimeout(onClose, 1200)
    } catch {
      setError('تعذّر الاتصال بالخادم.')
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
          maxWidth: 520,
          maxHeight: '85vh',
          overflowY: 'auto',
          background: T.cardBg,
          borderRadius: BRAND.radiusXl,
          border: `1.5px solid ${T.border}`,
          boxShadow: BRAND.shadow,
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 900, fontFamily: BRAND.fontHeading, color: T.text, margin: 0 }}>
              📚 تخصيص المواد
            </h3>
            <p style={{ fontSize: 13, color: T.sub, margin: '4px 0 0' }}>{teacherEmail}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.sub, fontSize: 22, cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              marginBottom: 14,
              fontSize: 13,
              background: 'rgba(140,20,40,0.08)',
              border: '1px solid rgba(140,20,40,0.25)',
              color: BRAND.crimson,
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: T.sub }}>⏳ جارٍ التحميل...</div>
        ) : done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
            <p style={{ color: BRAND.crimson, fontWeight: 800 }}>تم حفظ المواد بنجاح.</p>
          </div>
        ) : allSubjects.length === 0 ? (
          <p style={{ color: T.sub, fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
            لا توجد مواد متاحة في المنصة بعد.
          </p>
        ) : (
          <>
            <p style={{ fontSize: 12, color: T.sub, marginBottom: 12 }}>
              {selected.size} مادة محدَّدة — اختر كل المواد التي يدرّسها هذا المعلم، بصرف النظر عن الصف أو الشعبة.
            </p>

            <div
              style={{
                maxHeight: 320,
                overflowY: 'auto',
                border: `1.5px solid ${T.border}`,
                borderRadius: 12,
                padding: 6,
                marginBottom: 18,
              }}
            >
              {allSubjects.map(s => {
                const isChecked = selected.has(s.id)
                return (
                  <label
                    key={s.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: isChecked ? 'rgba(140,20,40,0.07)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(s.id)}
                      style={{ width: 17, height: 17, accentColor: BRAND.crimson }}
                    />
                    <span style={{ fontSize: 14, color: T.text, fontWeight: isChecked ? 700 : 400 }}>
                      {s.icon ?? '📚'} {s.name}
                      {s.grade ? ` — الصف ${s.grade}` : ''}
                    </span>
                  </label>
                )
              })}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 12,
                border: 'none',
                background: saving ? T.border : BRAND.gradMain,
                color: '#fff',
                fontWeight: 900,
                fontSize: 15,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {saving ? 'جارٍ الحفظ...' : '💾 حفظ المواد المخصَّصة'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// مودال تخصيص نطاقات التدريس لمعلم (مرحلة + صف + تشعيب)
// ════════════════════════════════════════════════════════════
// يُلصَق هذا المكوّن في نفس ملف components/admin/TeacherManager.tsx
// (بعد AssignSubjectsModal مباشرة)، ويستخدم نفس الـimports الموجودة
// فعلياً في أعلى الملف (useEffect, useState, BRAND) — لا حاجة
// لاستيرادات إضافية باستثناء STAGE_LABELS/GRADES_BY_STAGE/TRACK_LABELS
// من lib/constants/stages، المُضافة في أعلى هذا المقتطف فقط للوضوح.
//
// الطلاب يُحسَبون تلقائياً (عبر students_count من الـAPI) — لا اختيار
// يدوي لأي طالب بالاسم، تماشياً مع التصميم المتَّفق عليه: الأدمن
// يُخصِّص نطاقاً (مرحلة+صف+تشعيب)، والمنصة تُطابق الطلاب تلقائياً.
// ════════════════════════════════════════════════════════════

// (STAGE_LABELS, GRADES_BY_STAGE, TRACK_LABELS, StageKey, TrackKey)
// are already imported at the top of this file; avoid duplicate import here.

interface TeacherScope {
  id: string
  stage: StageKey
  grade: string
  track: TrackKey | null
  subject_id: string | null
  subjects?: { name: string } | null
  students_count: number
  created_at: string
}

export function AssignScopeModal({
  teacherId,
  teacherEmail,
  accessToken,
  onClose,
}: {
  teacherId: string
  teacherEmail: string
  accessToken: string
  onClose: () => void
}) {
  const [scopes, setScopes] = useState<TeacherScope[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ── نموذج إضافة نطاق جديد ──────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false)
  const [newStage, setNewStage] = useState<StageKey | null>(null)
  const [newGrade, setNewGrade] = useState<string | null>(null)
  const [newTrack, setNewTrack] = useState<TrackKey | null>(null)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function loadScopes() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/teacher-scopes?teacherId=${teacherId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'تعذّر تحميل نطاقات التدريس.')
        return
      }
      setScopes(data?.data?.items ?? data?.items ?? [])
    } catch {
      setError('تعذّر الاتصال بالخادم.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScopes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId])

  function resetAddForm() {
    setNewStage(null)
    setNewGrade(null)
    setNewTrack(null)
    setAddError('')
    setShowAddForm(false)
  }

  async function handleAddScope() {
    if (!newStage || !newGrade) {
      setAddError('اختر المرحلة والصف على الأقل.')
      return
    }
    const needsTrack = newGrade === '11' || newGrade === '12'
    if (needsTrack && !newTrack) {
      setAddError('هذا الصف يتطلب تحديد التشعيب (علمي/أدبي).')
      return
    }

    setAdding(true)
    setAddError('')
    try {
      const res = await fetch('/api/teacher-scopes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          teacher_id: teacherId,
          stage: newStage,
          grade: newGrade,
          track: needsTrack ? newTrack : null,
        }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setAddError(data?.error || 'فشل إضافة النطاق.')
        return
      }

      resetAddForm()
      await loadScopes()
    } catch {
      setAddError('تعذّر الاتصال بالخادم.')
    } finally {
      setAdding(false)
    }
  }

  async function handleDeleteScope(scopeId: string) {
    if (!confirm('هل تريد حذف هذا النطاق؟ سيفقد المعلم رؤية طلاب هذا النطاق.')) return
    setDeletingId(scopeId)
    try {
      const res = await fetch('/api/teacher-scopes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ scope_id: scopeId }),
      })
      if (res.ok) {
        setScopes(prev => prev.filter(s => s.id !== scopeId))
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.error || 'فشل حذف النطاق.')
      }
    } catch {
      setError('تعذّر الاتصال بالخادم.')
    } finally {
      setDeletingId(null)
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
          maxWidth: 560,
          maxHeight: '88vh',
          overflowY: 'auto',
          background: T.cardBg,
          borderRadius: BRAND.radiusXl,
          border: `1.5px solid ${T.border}`,
          boxShadow: BRAND.shadow,
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 900, fontFamily: BRAND.fontHeading, color: T.text, margin: 0 }}>
              🎓 نطاقات التدريس
            </h3>
            <p style={{ fontSize: 13, color: T.sub, margin: '4px 0 0' }}>{teacherEmail}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.sub, fontSize: 22, cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        <p style={{ fontSize: 12, color: T.sub, marginBottom: 16, lineHeight: 1.8 }}>
          كل طالب مسجَّل بنفس المرحلة/الصف/التشعيب يظهر تلقائياً ضمن طلاب هذا المعلم — بلا تحديد أسماء. المعلم يستطيع لاحقاً تقسيم طلابه لمجموعات فرعية بحسب المستوى من صفحته الخاصة.
        </p>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              marginBottom: 14,
              fontSize: 13,
              background: 'rgba(140,20,40,0.08)',
              border: '1px solid rgba(140,20,40,0.25)',
              color: BRAND.crimson,
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: T.sub }}>⏳ جارٍ التحميل...</div>
        ) : (
          <>
            {scopes.length === 0 ? (
              <p style={{ color: T.sub, fontSize: 14, textAlign: 'center', padding: '16px 0' }}>
                لا توجد نطاقات تدريس مُخصَّصة لهذا المعلم بعد.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {scopes.map(scope => {
                  const needsTrackLabel = scope.grade === '11' || scope.grade === '12'
                  return (
                    <div
                      key={scope.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'rgba(140,20,40,0.05)',
                        border: `1px solid ${T.border}`,
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                          📚 {STAGE_LABELS[scope.stage]} • الصف {scope.grade}
                          {scope.track && needsTrackLabel ? ` • ${TRACK_LABELS[scope.track]}` : ''}
                        </span>
                        <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>
                          👥 {scope.students_count} طالب مطابق حالياً
                        </div>
                      </div>
                      <button
                        disabled={deletingId === scope.id}
                        onClick={() => handleDeleteScope(scope.id)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: '1px solid rgba(140,20,40,0.3)',
                          background: 'rgba(140,20,40,0.06)',
                          color: BRAND.crimson,
                          cursor: deletingId === scope.id ? 'not-allowed' : 'pointer',
                          fontSize: 12,
                          fontFamily: 'inherit',
                        }}
                      >
                        {deletingId === scope.id ? '...' : '🗑️'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 12,
                  border: `2px dashed ${T.border}`,
                  background: 'transparent',
                  color: T.sub,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ＋ إضافة نطاق تدريس جديد
              </button>
            ) : (
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: 'rgba(140,20,40,0.04)',
                  border: `1.5px solid ${T.border}`,
                }}
              >
                {addError && (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      marginBottom: 12,
                      fontSize: 12,
                      background: 'rgba(140,20,40,0.08)',
                      color: BRAND.crimson,
                    }}
                  >
                    {addError}
                  </div>
                )}

                <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 8 }}>المرحلة</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                  {(Object.keys(STAGE_LABELS) as StageKey[]).map(stage => (
                    <button
                      key={stage}
                      onClick={() => { setNewStage(stage); setNewGrade(null); setNewTrack(null) }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 999,
                        border: newStage === stage ? `2px solid ${BRAND.crimson}` : `1px solid ${T.border}`,
                        background: newStage === stage ? 'rgba(140,20,40,0.08)' : 'transparent',
                        color: newStage === stage ? BRAND.crimson : T.text,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 13,
                      }}
                    >
                      {STAGE_LABELS[stage]}
                    </button>
                  ))}
                </div>

                {newStage && (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 8 }}>الصف</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                      {GRADES_BY_STAGE[newStage].map(g => (
                        <button
                          key={g.id}
                          onClick={() => { setNewGrade(g.id); setNewTrack(null) }}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 999,
                            border: newGrade === g.id ? `2px solid ${BRAND.crimson}` : `1px solid ${T.border}`,
                            background: newGrade === g.id ? 'rgba(140,20,40,0.08)' : 'transparent',
                            color: newGrade === g.id ? BRAND.crimson : T.text,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: 13,
                          }}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {(newGrade === '11' || newGrade === '12') && (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 8 }}>التشعيب</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                      {(Object.keys(TRACK_LABELS) as TrackKey[]).map(t => (
                        <button
                          key={t}
                          onClick={() => setNewTrack(t)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 999,
                            border: newTrack === t ? `2px solid ${BRAND.crimson}` : `1px solid ${T.border}`,
                            background: newTrack === t ? 'rgba(140,20,40,0.08)' : 'transparent',
                            color: newTrack === t ? BRAND.crimson : T.text,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: 13,
                          }}
                        >
                          {TRACK_LABELS[t]}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleAddScope}
                    disabled={adding || !newStage || !newGrade}
                    style={{
                      flex: 1,
                      padding: '11px',
                      borderRadius: 10,
                      border: 'none',
                      background: (adding || !newStage || !newGrade) ? T.border : BRAND.gradMain,
                      color: '#fff',
                      fontWeight: 900,
                      fontSize: 14,
                      cursor: (adding || !newStage || !newGrade) ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {adding ? 'جارٍ الإضافة...' : '✅ إضافة'}
                  </button>
                  <button
                    onClick={resetAddForm}
                    disabled={adding}
                    style={{
                      padding: '11px 16px',
                      borderRadius: 10,
                      border: `1px solid ${T.border}`,
                      background: 'transparent',
                      color: T.sub,
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: adding ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
