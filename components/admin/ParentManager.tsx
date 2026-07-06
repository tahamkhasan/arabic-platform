'use client'
import { useState } from 'react'
import { BRAND } from '@/lib/constants/theme'

// ──────────────────────────────────────────────────────────────
// components/admin/ParentManager.tsx
// نفس نمط AddTeacherModal في TeacherManager.tsx تماماً، بتغيير
// المسار المستهدف فقط (/api/parents بدل /api/teachers) والنصوص.
// ربط الأبناء لا يتم هنا — يقوم به ولي الأمر بنفسه لاحقاً من
// داخل /parent عبر زر "+ ربط ابن" الموجود هناك أصلاً.
// ──────────────────────────────────────────────────────────────

const T = {
  cardBg: BRAND.bgSoft,
  text: BRAND.text,
  sub: BRAND.sub,
  border: BRAND.border,
  crimson: BRAND.crimson,
  shadow: BRAND.shadow,
}

export function AddParentModal({
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
      const res = await fetch('/api/parents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'فشل إنشاء حساب ولي الأمر.')
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
            👨‍👦 إضافة ولي أمر جديد
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.sub, fontSize: 22, cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
            <p style={{ color: BRAND.crimson, fontWeight: 800 }}>تم إنشاء حساب ولي الأمر بنجاح.</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: T.sub, marginBottom: 16, lineHeight: 1.8 }}>
              يُفعَّل الحساب فوراً. بعد تسجيل دخوله، يستطيع ولي الأمر ربط أبنائه بنفسه من داخل بوابته الخاصة.
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
                  placeholder="اسم ولي الأمر"
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
                  placeholder="parent@example.com"
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