'use client'
import { useEffect, useState } from 'react'
import { BRAND } from '@/lib/constants/theme'

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
