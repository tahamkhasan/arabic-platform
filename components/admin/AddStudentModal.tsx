'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import { BRAND } from '@/lib/constants/theme'
import {
  GRADES_BY_STAGE,
  TRACK_LABELS,
  type StageKey,
  type TrackKey,
} from '@/lib/constants/stages'

type CreatedStudent = {
  id: string
  email: string | null
  phone?: string | null
  username?: string | null
  full_name?: string | null
  role?: string | null
  user_type?: string | null
  status?: string | null
  approved?: boolean | null
  allowed_stages?: string[]
  allowed_grades?: string[]
  track?: string | null
}

type AddStudentModalProps = {
  open: boolean
  accessToken: string
  onClose: () => void
  onCreated?: (student: CreatedStudent) => void
}

const T = {
  bg: BRAND.bg,
  cardBg: BRAND.bgSoft,
  textCol: BRAND.text,
  subCol: BRAND.sub,
  borderCol: BRAND.border,
  inputBg: 'rgba(140,20,40,0.04)',
  shadow: BRAND.shadow,
}

export default function AddStudentModal({
  open,
  accessToken,
  onClose,
  onCreated,
}: AddStudentModalProps) {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [stage, setStage] = useState<StageKey | ''>('')
  const [grade, setGrade] = useState('')
  const [track, setTrack] = useState<TrackKey | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setFullName('')
      setUsername('')
      setEmail('')
      setPhone('')
      setPassword('')
      setStage('')
      setGrade('')
      setTrack('')
      setError('')
      setSubmitting(false)
    }
  }, [open])

  const grades = useMemo(() => {
    if (!stage) return []
    return GRADES_BY_STAGE[stage] ?? []
  }, [stage])

  const needsTrack = grade === '11' || grade === '12'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return

    setError('')

    const cleanFullName = fullName.trim()
    const cleanUsername = username.trim().toLowerCase()
    const cleanEmail = email.trim().toLowerCase()
    const cleanPhone = phone.trim()
    const cleanPassword = password

    if (!cleanFullName) {
      setError('الاسم الكامل مطلوب.')
      return
    }

    if (!cleanUsername) {
      setError('اسم المستخدم مطلوب.')
      return
    }

    if (!/^[a-z0-9._-]{3,30}$/i.test(cleanUsername)) {
      setError('اسم المستخدم يجب أن يكون من 3 إلى 30 حرفًا/رقمًا، مع السماح بـ . _ - فقط.')
      return
    }

    if (!cleanEmail && !cleanPhone) {
      setError('أدخل البريد الإلكتروني أو رقم الهاتف على الأقل.')
      return
    }

    if (cleanPassword.length < 8) {
      setError('كلمة المرور يجب ألا تقل عن 8 أحرف.')
      return
    }

    if (!stage || !grade) {
      setError('اختر المرحلة والصف.')
      return
    }

    if (needsTrack && !track) {
      setError('الصف 11 أو 12 يتطلب تحديد التشعيب.')
      return
    }

    try {
      setSubmitting(true)

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          full_name: cleanFullName,
          username: cleanUsername,
          email: cleanEmail || null,
          phone: cleanPhone || null,
          password: cleanPassword,
          allowed_stages: stage ? [stage] : [],
          allowed_grades: grade ? [grade] : [],
          track: needsTrack ? track : null,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'تعذر إنشاء الطالب.')
        return
      }

      if (data?.item) {
        onCreated?.(data.item as CreatedStudent)
      }

      onClose()
    } catch {
      setError('تعذر الاتصال بالخادم.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: BRAND.radiusSm,
    border: `1.5px solid ${T.borderCol}`,
    background: T.inputBg,
    color: T.textCol,
    fontSize: 14,
    fontFamily: 'inherit',
  }

  return (
    <div
      onClick={() => {
        if (!submitting) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(31,18,21,0.42)',
        backdropFilter: 'blur(6px)',
        zIndex: 140,
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
          maxWidth: 760,
          background: T.cardBg,
          borderRadius: BRAND.radiusXl,
          border: `1.5px solid ${T.borderCol}`,
          boxShadow: T.shadow,
          padding: 22,
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 18,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: BRAND.weightBlack,
                fontFamily: BRAND.fontHeading,
                color: T.textCol,
                marginBottom: 6,
              }}
            >
              ➕ إضافة طالب جديد
            </div>
            <div style={{ fontSize: 13, color: T.subCol, lineHeight: 1.8 }}>
              أنشئ حساب الطالب، ثم سيدخل باسم المستخدم أو البريد أو الهاتف مع كلمة المرور.
            </div>
          </div>

          <Button variant="ghost" size="sm" disabled={submitting} onClick={onClose}>
            إغلاق
          </Button>
        </div>

        {error ? (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 14px',
              borderRadius: BRAND.radiusMd,
              border: '1px solid rgba(140,20,40,0.22)',
              background: 'rgba(140,20,40,0.08)',
              color: BRAND.crimson,
              fontSize: 13,
              fontWeight: BRAND.weightBold,
            }}
          >
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14,
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 13,
                  fontWeight: BRAND.weightBlack,
                  color: T.textCol,
                }}
              >
                الاسم الكامل
              </label>
              <input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="مثال: أحمد محمد"
                style={inputStyle}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 13,
                  fontWeight: BRAND.weightBlack,
                  color: T.textCol,
                }}
              >
                اسم المستخدم
              </label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="ahmad_10"
                style={{ ...inputStyle, direction: 'ltr' }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 13,
                  fontWeight: BRAND.weightBlack,
                  color: T.textCol,
                }}
              >
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="student@example.com"
                style={{ ...inputStyle, direction: 'ltr' }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 13,
                  fontWeight: BRAND.weightBlack,
                  color: T.textCol,
                }}
              >
                رقم الهاتف
              </label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+9655xxxxxxx"
                style={{ ...inputStyle, direction: 'ltr' }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 13,
                  fontWeight: BRAND.weightBlack,
                  color: T.textCol,
                }}
              >
                كلمة المرور
              </label>
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="كلمة مرور مؤقتة"
                style={{ ...inputStyle, direction: 'ltr' }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 13,
                  fontWeight: BRAND.weightBlack,
                  color: T.textCol,
                }}
              >
                المرحلة
              </label>
              <select
                value={stage}
                onChange={e => {
                  setStage((e.target.value as StageKey) || '')
                  setGrade('')
                  setTrack('')
                }}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">اختر المرحلة</option>
                <option value="primary">ابتدائي</option>
                <option value="middle">متوسط</option>
                <option value="secondary">ثانوي</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 13,
                  fontWeight: BRAND.weightBlack,
                  color: T.textCol,
                }}
              >
                الصف
              </label>
              <select
                value={grade}
                onChange={e => {
                  setGrade(e.target.value)
                  setTrack('')
                }}
                disabled={!stage}
                style={{
                  ...inputStyle,
                  cursor: stage ? 'pointer' : 'not-allowed',
                  opacity: stage ? 1 : 0.65,
                }}
              >
                <option value="">اختر الصف</option>
                {grades.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            {needsTrack ? (
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: 13,
                    fontWeight: BRAND.weightBlack,
                    color: T.textCol,
                  }}
                >
                  التشعيب
                </label>
                <select
                  value={track}
                  onChange={e => setTrack((e.target.value as TrackKey) || '')}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">اختر التشعيب</option>
                  <option value="scientific">{TRACK_LABELS.scientific}</option>
                  <option value="literary">{TRACK_LABELS.literary}</option>
                </select>
              </div>
            ) : null}
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: BRAND.radiusMd,
              background: 'rgba(255,255,255,0.7)',
              border: `1px solid ${T.borderCol}`,
              fontSize: 12,
              color: T.subCol,
              lineHeight: 1.9,
            }}
          >
            يمكن إدخال البريد أو الهاتف أو كليهما، لكن يجب تعبئة واحد منهما على الأقل.
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Button variant="ghost" disabled={submitting} onClick={onClose}>
              إلغاء
            </Button>

            <Button variant="primary" disabled={submitting} type="submit">
              {submitting ? 'جارٍ إنشاء الطالب...' : 'حفظ الطالب'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}