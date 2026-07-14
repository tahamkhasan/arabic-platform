'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BRAND } from '@/lib/constants/theme'

const B = {
  bg: BRAND.bg,
  cardBg: BRAND.bgCard,
  text: BRAND.text,
  sub: BRAND.sub,
  border: BRAND.border,
  borderFocus: BRAND.borderStrong,
  inputBg: 'rgba(150,30,45,0.04)',
  headerBg: 'rgba(247,242,234,0.97)',
  shadow: BRAND.shadow,
  gradMain: BRAND.gradMain,
  gradBlue: BRAND.gradBlue,
  shadowBlue: BRAND.shadowBlue,
  crimson: BRAND.crimson,
}

const HEADING = BRAND.fontHeading
const BODY = BRAND.fontBody

const STAGE_OPTIONS = [
  { label: 'ابتدائي', value: 'primary' },
  { label: 'متوسط', value: 'middle' },
  { label: 'ثانوي', value: 'secondary' },
] as const

const STAGE_GRADES: Record<string, string[]> = {
  primary: ['1', '2', '3', '4', '5'],
  middle: ['6', '7', '8', '9'],
  secondary: ['10', '11', '12'],
}

const SECONDARY_TRACKS = [
  { label: 'علمي', value: 'scientific' },
  { label: 'أدبي', value: 'literary' },
] as const

type SelectionType = 'package' | 'subjects'

type OfferingInput = {
  stage: string
  grade: string
  track?: string | null
}

interface SubjectOption {
  id: string
  name: string
  stage?: string | null
  grade?: string | null
  track?: string | null
  offerings?: OfferingInput[]
}

function getStageLabel(value: string) {
  return STAGE_OPTIONS.find(item => item.value === value)?.label ?? value
}

function getTrackLabel(value: string) {
  return SECONDARY_TRACKS.find(item => item.value === value)?.label ?? value
}

function subjectMatchesSelection(
  subject: SubjectOption,
  stage: string,
  grade: string,
  track: string,
  needsTrack: boolean
) {
  const offerings = Array.isArray(subject.offerings) ? subject.offerings : []

  if (offerings.length > 0) {
    return offerings.some(off => {
      const sameStage = String(off.stage ?? '').trim() === String(stage ?? '').trim()
      const sameGrade = String(off.grade ?? '').trim() === String(grade ?? '').trim()
      if (!sameStage || !sameGrade) return false

      if (!needsTrack) return true

      return String(off.track ?? '').trim() === String(track ?? '').trim()
    })
  }

  const sameStage = String(subject.stage ?? '').trim() === String(stage ?? '').trim()
  const sameGrade = String(subject.grade ?? '').trim() === String(grade ?? '').trim()

  if (!sameStage || !sameGrade) return false
  if (!needsTrack) return true

  return String(subject.track ?? '').trim() === String(track ?? '').trim()
}

function RegisterForm() {
  const searchParams = useSearchParams()

  const [step, setStep] = useState(1)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  const [stage, setStage] = useState('')
  const [grade, setGrade] = useState('')
  const [track, setTrack] = useState('')

  const [selectionType, setSelectionType] = useState<SelectionType | ''>('')
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([])

  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const [subjectsError, setSubjectsError] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [focusField, setFocusField] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const urlType = searchParams.get('type')
  const urlId = searchParams.get('id')

  const needsTrack = stage === 'secondary' && (grade === '11' || grade === '12')
  const totalSteps = needsTrack ? 5 : 4
  const selectionStep = needsTrack ? 4 : 3

  useEffect(() => {
    if (!stage || !grade) {
      setSubjects([])
      setSelectedSubjectIds([])
      return
    }

    if (needsTrack && !track) {
      setSubjects([])
      setSelectedSubjectIds([])
      return
    }

    let mounted = true
    setSubjectsLoading(true)
    setSubjectsError('')

    fetch('/api/subjects')
      .then(r => r.json())
      .then(data => {
        if (!mounted) return

        const list = Array.isArray(data?.subjects) ? data.subjects : []

        const filtered = list.filter((item: SubjectOption) =>
          subjectMatchesSelection(item, stage, grade, track, needsTrack)
        )

        setSubjects(filtered)
      })
      .catch(() => {
        if (mounted) {
          setSubjectsError('تعذّر تحميل المواد الآن. حاول مرة أخرى.')
        }
      })
      .finally(() => {
        if (mounted) setSubjectsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [stage, grade, track, needsTrack])

  useEffect(() => {
    if (!needsTrack) {
      setTrack('')
    }
  }, [needsTrack])

  useEffect(() => {
    if (step > totalSteps) {
      setStep(totalSteps)
    }
  }, [step, totalSteps])

  useEffect(() => {
    if (urlType || urlId) {
      setSelectionType('package')
    }
  }, [urlType, urlId])

  const selectedSubjects = useMemo(
    () => subjects.filter(item => selectedSubjectIds.includes(item.id)),
    [subjects, selectedSubjectIds]
  )

  function validateField(field: string, value: string) {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'الاسم الكامل مطلوب'
        if (value.trim().length < 3) return 'الاسم يجب أن يكون 3 أحرف على الأقل'
        return ''

      case 'email':
        if (!value.trim()) return 'البريد الإلكتروني مطلوب'
        if (!/^\S+@\S+\.\S+$/.test(value)) return 'البريد الإلكتروني غير صحيح'
        return ''

      case 'password':
        if (!value) return 'كلمة المرور مطلوبة'
        if (value.length < 8) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
        return ''

      case 'confirmPassword':
        if (!value) return 'تأكيد كلمة المرور مطلوب'
        if (value !== password) return 'كلمتا المرور غير متطابقتين'
        return ''

      default:
        return ''
    }
  }

  function validateCurrentStep(): string | null {
    const newErrors: Record<string, string> = {}

    if (step === 1 && !stage) {
      newErrors.stage = 'يرجى اختيار المرحلة التعليمية'
    }

    if (step === 2 && !grade) {
      newErrors.grade = 'يرجى اختيار الصف الدراسي'
    }

    if (needsTrack && step === 3 && !track) {
      newErrors.track = 'يرجى اختيار التشعيب'
    }

    if (step === selectionStep) {
      if (!selectionType) {
        newErrors.selectionType = 'يرجى اختيار نوع الاشتراك'
      } else {
        if (subjectsLoading) {
          setError('يرجى الانتظار حتى يكتمل تحميل المواد')
          return 'يرجى الانتظار حتى يكتمل تحميل المواد'
        }

        if (subjects.length === 0) {
          setError(
            needsTrack
              ? 'لا توجد مواد متاحة حالياً لهذا الصف وهذا التشعيب'
              : 'لا توجد مواد متاحة حالياً لهذا الصف'
          )
          return needsTrack
            ? 'لا توجد مواد متاحة حالياً لهذا الصف وهذا التشعيب'
            : 'لا توجد مواد متاحة حالياً لهذا الصف'
        }

        if (selectionType === 'subjects' && selectedSubjectIds.length === 0) {
          newErrors.subjectIds = 'يرجى اختيار مادة واحدة على الأقل'
        }
      }
    }

    if (step === totalSteps) {
      const nameError = validateField('name', name)
      const emailError = validateField('email', email)
      const passwordError = validateField('password', password)
      const confirmPasswordError = validateField('confirmPassword', confirmPassword)

      if (nameError) newErrors.name = nameError
      if (emailError) newErrors.email = emailError
      if (passwordError) newErrors.password = passwordError
      if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError
    }

    setErrors(prev => ({ ...prev, ...newErrors }))

    return Object.keys(newErrors).length > 0 ? 'يرجى تصحيح الحقول المطلوبة' : null
  }

  function validateForm() {
    const newErrors: Record<string, string> = {}

    if (!stage) newErrors.stage = 'يرجى اختيار المرحلة التعليمية'
    if (!grade) newErrors.grade = 'يرجى اختيار الصف الدراسي'
    if (needsTrack && !track) newErrors.track = 'يرجى اختيار التشعيب'

    if (!selectionType) {
      newErrors.selectionType = 'يرجى اختيار نوع الاشتراك'
    } else {
      if (subjects.length === 0) {
        setError(
          needsTrack
            ? 'لا توجد مواد متاحة حالياً لهذا الصف وهذا التشعيب'
            : 'لا توجد مواد متاحة حالياً لهذا الصف'
        )
      }

      if (selectionType === 'subjects' && selectedSubjectIds.length === 0) {
        newErrors.subjectIds = 'يرجى اختيار مادة واحدة على الأقل'
      }
    }

    const nameError = validateField('name', name)
    const emailError = validateField('email', email)
    const passwordError = validateField('password', password)
    const confirmPasswordError = validateField('confirmPassword', confirmPassword)

    if (nameError) newErrors.name = nameError
    if (emailError) newErrors.email = emailError
    if (passwordError) newErrors.password = passwordError
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0 && subjects.length > 0
  }

  function handleBlurValidation(fieldName: string, value: string) {
    const message = validateField(fieldName, value)
    setErrors(prev => ({
      ...prev,
      [fieldName]: message,
    }))
  }

  function clearError(key: string) {
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  function handleStageChange(value: string) {
    setStage(value)
    setGrade('')
    setTrack('')
    setSelectionType('')
    setSubjects([])
    setSelectedSubjectIds([])
    setSubjectsError('')
    setError('')
    setErrors(prev => ({
      ...prev,
      stage: '',
      grade: '',
      track: '',
      selectionType: '',
      subjectIds: '',
    }))
  }

  function handleGradeChange(value: string) {
    setGrade(value)
    setTrack('')
    setSelectionType('')
    setSelectedSubjectIds([])
    setSubjectsError('')
    setError('')
    setErrors(prev => ({
      ...prev,
      grade: '',
      track: '',
      selectionType: '',
      subjectIds: '',
    }))
  }

  function handleTrackChange(value: string) {
    setTrack(value)
    setSelectionType('')
    setSelectedSubjectIds([])
    setSubjectsError('')
    setError('')
    setErrors(prev => ({
      ...prev,
      track: '',
      selectionType: '',
      subjectIds: '',
    }))
  }

  function handleSelectionTypeChange(value: SelectionType) {
    setSelectionType(value)
    setSelectedSubjectIds([])
    setError('')
    setErrors(prev => ({
      ...prev,
      selectionType: '',
      subjectIds: '',
    }))
  }

  function toggleSubject(id: string) {
    setSelectedSubjectIds(prev => {
      const updated = prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]

      setErrors(current => ({
        ...current,
        subjectIds: updated.length > 0 ? '' : current.subjectIds,
      }))

      return updated
    })
  }

  function goNext() {
    setError('')
    const validationError = validateCurrentStep()
    if (validationError) {
      if (validationError !== 'يرجى تصحيح الحقول المطلوبة') {
        setError(validationError)
      }
      return
    }
    if (step < totalSteps) setStep(prev => prev + 1)
  }

  function goBack() {
    setError('')
    if (step > 1) setStep(prev => prev - 1)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const isValid = validateForm()
    if (!isValid) {
      if (!error) {
        setError('يرجى تصحيح الحقول المطلوبة قبل إنشاء الحساب')
      }
      return
    }

    setLoading(true)

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        userType: 'student',
        allowedStages: stage ? [stage] : [],
        allowedGrades: grade ? [grade] : [],
        allowedTracks: needsTrack && track ? [track] : [],
        subscriptionType: selectionType,
        subjectIds: selectionType === 'package' ? subjects.map(item => item.id) : selectedSubjectIds,
      }

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'حدث خطأ أثناء إنشاء الحساب')
        return
      }

      setSuccess(true)
    } catch {
      setError('تعذّر الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (field: string): CSSProperties => ({
    width: '100%',
    padding: '13px 44px 13px 16px',
    borderRadius: 12,
    border: `1.5px solid ${errors[field] ? '#c62828' : focusField === field ? B.borderFocus : B.border}`,
    background: B.inputBg,
    color: B.text,
    fontSize: 14,
    fontFamily: BODY,
    boxShadow: focusField === field ? '0 0 0 3px rgba(150,30,45,0.08)' : 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none',
  })

  const stepTitle =
    step === 1
      ? 'اختر المرحلة التعليمية'
      : step === 2
        ? 'اختر الصف الدراسي'
        : needsTrack && step === 3
          ? 'اختر التشعيب'
          : step === selectionStep
            ? 'اختر نوع الاشتراك والمواد'
            : 'أدخل بيانات الحساب'

  const stepHint =
    step === 1
      ? 'ابدأ بتحديد المرحلة التعليمية المناسبة.'
      : step === 2
        ? 'الآن اختر الصف الدراسي التابع للمرحلة.'
        : needsTrack && step === 3
          ? 'اختر التشعيب المناسب قبل عرض المواد.'
          : step === selectionStep
            ? 'اختر بين الباقة الشاملة أو المواد المنفصلة.'
            : 'أكمل بياناتك لإنشاء الحساب.'

  if (success) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: B.bg,
          fontFamily: BODY,
          padding: 20,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 500,
            background: B.cardBg,
            borderRadius: 22,
            border: `1px solid ${B.border}`,
            boxShadow: B.shadow,
            padding: '40px 32px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: B.text, marginBottom: 10, fontFamily: HEADING }}>
            تم إنشاء حسابك بنجاح
          </h1>
          <p style={{ fontSize: 14, color: B.sub, lineHeight: 1.9, marginBottom: 18, fontFamily: BODY }}>
            بانتظار موافقة المدير على حسابك. سيصلك إشعار عند التفعيل.
          </p>

          <div
            style={{
              textAlign: 'right',
              padding: '14px 16px',
              borderRadius: 14,
              background: 'rgba(37,99,235,0.06)',
              border: '1.5px solid rgba(37,99,235,0.20)',
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', marginBottom: 5, fontFamily: BODY }}>
              ملخص الاشتراك
            </div>
            <div style={{ fontSize: 13, color: B.sub, lineHeight: 1.9, fontFamily: BODY }}>
              المرحلة: {getStageLabel(stage)} · الصف: {grade}
              {needsTrack ? ` · التشعيب: ${getTrackLabel(track)}` : ''}
            </div>
            <div style={{ fontSize: 13, color: B.text, marginTop: 6, fontWeight: 700, fontFamily: BODY }}>
              {selectionType === 'package'
                ? `باقة شاملة تشمل ${subjects.length} مادة`
                : `مواد منفصلة: ${selectedSubjects.map(item => item.name).join('، ')}`}
            </div>
          </div>

          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              background: B.gradBlue,
              color: '#fff',
              fontWeight: 900,
              fontSize: 15,
              fontFamily: BODY,
              textDecoration: 'none',
              boxShadow: B.shadowBlue,
            }}
          >
            الذهاب إلى تسجيل الدخول ←
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: B.bg,
        color: B.text,
        fontFamily: BODY,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes glow {
          0%, 100% { box-shadow: ${B.shadowBlue}; }
          50% { box-shadow: 0 12px 38px rgba(37,99,235,0.62); }
        }
        select option {
          background: ${B.bg} !important;
          color: ${B.text} !important;
        }
        input:focus, select:focus { outline: none; }
      `}</style>

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: B.headerBg,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${B.border}`,
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: B.shadow,
        }}
      >
        <Link href="/landing" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: B.gradMain,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 900,
              color: '#fff',
              fontFamily: HEADING,
            }}
          >
            م
          </div>
          <span style={{ fontSize: 15, fontWeight: 900, color: B.text, fontFamily: HEADING }}>مِداد</span>
        </Link>

        <Link
          href="/login"
          style={{
            padding: '8px 16px',
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: BODY,
            border: `1.5px solid ${B.border}`,
            color: B.sub,
            textDecoration: 'none',
          }}
        >
          لدي حساب؟ تسجيل الدخول
        </Link>
      </header>

      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            width: '100%',
            maxWidth: 620,
            background: B.cardBg,
            borderRadius: 22,
            border: `1px solid ${B.border}`,
            boxShadow: B.shadow,
            padding: '32px 28px',
          }}
        >
          <h1
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: B.text,
              marginBottom: 6,
              textAlign: 'center',
              fontFamily: HEADING,
            }}
          >
            إنشاء حساب طالب جديد ✨
          </h1>

          <p style={{ fontSize: 14, color: B.sub, textAlign: 'center', marginBottom: 18, fontFamily: BODY }}>
            التسجيل هنا مخصص للطلاب فقط
          </p>

          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'center',
              marginBottom: 22,
              flexWrap: 'wrap',
            }}
          >
            {Array.from({ length: totalSteps }, (_, index) => index + 1).map(item => {
              const isActive = step === item
              const isDone = step > item
              return (
                <div
                  key={item}
                  style={{
                    minWidth: 44,
                    height: 44,
                    padding: '0 14px',
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isActive ? B.gradBlue : isDone ? 'rgba(37,99,235,0.10)' : 'transparent',
                    color: isActive ? '#fff' : isDone ? '#2563EB' : B.sub,
                    border: `1.5px solid ${isActive ? 'transparent' : isDone ? 'rgba(37,99,235,0.30)' : B.border}`,
                    fontWeight: 800,
                    fontSize: 13,
                    fontFamily: BODY,
                  }}
                >
                  {isDone ? '✓' : `خطوة ${item}`}
                </div>
              )
            })}
          </div>

          {error && (
            <div
              style={{
                padding: '11px 14px',
                borderRadius: 10,
                marginBottom: 16,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: BODY,
                background: 'rgba(150,30,45,0.08)',
                border: '1.5px solid rgba(150,30,45,0.28)',
                color: B.crimson,
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              marginBottom: 18,
              padding: '14px 16px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.6)',
              border: `1px solid ${B.border}`,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: B.crimson, marginBottom: 6, fontFamily: BODY }}>
              {`الخطوة ${step} من ${totalSteps}`}
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: B.text, marginBottom: 4, fontFamily: HEADING }}>
              {stepTitle}
            </div>
            <div style={{ fontSize: 13, color: B.sub, lineHeight: 1.8, fontFamily: BODY }}>{stepHint}</div>
          </div>

          {subjectsError && (
            <div
              style={{
                marginBottom: 16,
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(150,30,45,0.06)',
                border: '1.5px solid rgba(150,30,45,0.25)',
                color: B.crimson,
                fontSize: 13,
                lineHeight: 1.8,
                fontFamily: BODY,
              }}
            >
              ⚠️ {subjectsError}
            </div>
          )}

          {step === 1 && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: B.sub, display: 'block', marginBottom: 6, fontFamily: BODY }}>
                المرحلة التعليمية
              </label>

              <select
                value={stage}
                onChange={e => handleStageChange(e.target.value)}
                style={{ ...inputStyle('stage'), cursor: 'pointer' }}
              >
                <option value="">اختر المرحلة</option>
                {STAGE_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              {errors.stage && (
                <p style={{ color: '#c62828', fontSize: 12, marginTop: 6, fontFamily: BODY }}>
                  {errors.stage}
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: B.sub, display: 'block', marginBottom: 6, fontFamily: BODY }}>
                الصف الدراسي
              </label>

              <select
                value={grade}
                onChange={e => handleGradeChange(e.target.value)}
                disabled={!stage}
                style={{
                  ...inputStyle('grade'),
                  cursor: stage ? 'pointer' : 'not-allowed',
                  opacity: stage ? 1 : 0.5,
                }}
              >
                <option value="">{stage ? 'اختر الصف' : 'اختر المرحلة أولاً'}</option>
                {stage &&
                  STAGE_GRADES[stage].map(g => (
                    <option key={g} value={g}>
                      الصف {g}
                    </option>
                  ))}
              </select>

              {errors.grade && (
                <p style={{ color: '#c62828', fontSize: 12, marginTop: 6, fontFamily: BODY }}>
                  {errors.grade}
                </p>
              )}
            </div>
          )}

          {needsTrack && step === 3 && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: B.sub, display: 'block', marginBottom: 8, fontFamily: BODY }}>
                التشعيب
              </label>

              <div style={{ display: 'flex', gap: 10 }}>
                {SECONDARY_TRACKS.map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleTrackChange(item.value)}
                    style={{
                      flex: 1,
                      padding: '14px 10px',
                      borderRadius: 12,
                      border: `2px solid ${
                        track === item.value ? B.crimson : errors.track ? '#c62828' : B.border
                      }`,
                      background: track === item.value ? 'rgba(150,30,45,0.08)' : 'transparent',
                      color: track === item.value ? B.crimson : B.sub,
                      cursor: 'pointer',
                      fontFamily: BODY,
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {errors.track && (
                <p style={{ color: '#c62828', fontSize: 12, marginTop: 6, fontFamily: BODY }}>
                  {errors.track}
                </p>
              )}
            </div>
          )}

          {step === selectionStep && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: B.sub, display: 'block', marginBottom: 8, fontFamily: BODY }}>
                  نوع الاشتراك
                </label>

                <div style={{ display: 'flex', gap: 10 }}>
                  {([
                    { id: 'package' as SelectionType, label: '📦 باقة شاملة' },
                    { id: 'subjects' as SelectionType, label: '📚 مواد منفصلة' },
                  ]).map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectionTypeChange(opt.id)}
                      style={{
                        flex: 1,
                        padding: '13px 10px',
                        borderRadius: 12,
                        border: `2px solid ${selectionType === opt.id ? B.crimson : errors.selectionType ? '#c62828' : B.border}`,
                        background: selectionType === opt.id ? 'rgba(150,30,45,0.08)' : 'transparent',
                        color: selectionType === opt.id ? B.crimson : B.sub,
                        cursor: 'pointer',
                        fontFamily: BODY,
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {errors.selectionType && (
                  <p style={{ color: '#c62828', fontSize: 12, marginTop: 6, fontFamily: BODY }}>
                    {errors.selectionType}
                  </p>
                )}
              </div>

              {subjectsLoading ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    minHeight: 90,
                    borderRadius: 14,
                    border: `1px solid ${B.border}`,
                    background: 'rgba(37,99,235,0.04)',
                    color: B.sub,
                    fontSize: 13,
                    fontFamily: BODY,
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: '2px solid rgba(37,99,235,0.3)',
                      borderTopColor: '#2563EB',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  جارٍ تحميل المواد...
                </div>
              ) : (
                <>
                  {selectionType === 'package' && (
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: 16,
                        background: 'rgba(37,99,235,0.07)',
                        border: '1.5px solid rgba(37,99,235,0.22)',
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', marginBottom: 6, fontFamily: BODY }}>
                        الباقة الشاملة
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: B.text, marginBottom: 6, fontFamily: HEADING }}>
                        سيتم تسجيلك في جميع المواد المتاحة لهذا الصف{needsTrack ? ' وهذا التشعيب' : ''}
                      </div>
                      <div style={{ fontSize: 13, color: B.sub, lineHeight: 1.9, fontFamily: BODY }}>
                        عدد المواد المشمولة: {subjects.length}
                      </div>

                      {subjects.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                          {subjects.map(item => (
                            <span
                              key={item.id}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 999,
                                background: 'rgba(255,255,255,0.82)',
                                border: `1px solid ${B.border}`,
                                fontSize: 12,
                                color: B.text,
                                fontFamily: BODY,
                              }}
                            >
                              {item.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectionType === 'subjects' && (
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: B.sub, display: 'block', marginBottom: 8, fontFamily: BODY }}>
                        اختر مادة أو عدة مواد
                      </label>

                      {subjects.length === 0 ? (
                        <div
                          style={{
                            padding: '14px 16px',
                            borderRadius: 14,
                            background: 'rgba(255,255,255,0.62)',
                            border: `1px solid ${B.border}`,
                            color: B.sub,
                            fontSize: 13,
                            fontFamily: BODY,
                          }}
                        >
                          {needsTrack ? 'لا توجد مواد متاحة حالياً لهذا الصف وهذا التشعيب.' : 'لا توجد مواد متاحة حالياً لهذا الصف.'}
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gap: 10 }}>
                          {subjects.map(item => {
                            const checked = selectedSubjectIds.includes(item.id)
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => toggleSubject(item.id)}
                                style={{
                                  width: '100%',
                                  textAlign: 'right',
                                  padding: '14px 16px',
                                  borderRadius: 14,
                                  border: `2px solid ${checked ? B.crimson : B.border}`,
                                  background: checked ? 'rgba(150,30,45,0.08)' : 'rgba(255,255,255,0.65)',
                                  color: checked ? B.text : B.sub,
                                  cursor: 'pointer',
                                  fontFamily: BODY,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 12,
                                }}
                              >
                                <span style={{ fontSize: 14, fontWeight: 700 }}>{item.name}</span>
                                <span
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    border: `2px solid ${checked ? B.crimson : B.border}`,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 12,
                                    color: checked ? B.crimson : 'transparent',
                                    flexShrink: 0,
                                  }}
                                >
                                  ✓
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {errors.subjectIds && (
                        <p style={{ color: '#c62828', fontSize: 12, marginTop: 8, fontFamily: BODY }}>
                          {errors.subjectIds}
                        </p>
                      )}

                      {selectedSubjects.length > 0 && (
                        <div
                          style={{
                            marginTop: 12,
                            padding: '14px 16px',
                            borderRadius: 14,
                            background: 'rgba(255,255,255,0.62)',
                            border: `1px solid ${B.border}`,
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 700, color: B.crimson, marginBottom: 6, fontFamily: BODY }}>
                            المواد المختارة
                          </div>
                          <div style={{ fontSize: 13, color: B.text, lineHeight: 1.9, fontFamily: BODY }}>
                            {selectedSubjects.map(item => item.name).join('، ')}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {step === totalSteps && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: B.sub, display: 'block', marginBottom: 6, fontFamily: BODY }}>
                  الاسم الكامل
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 16,
                      pointerEvents: 'none',
                    }}
                  >
                    👤
                  </span>
                  <input
                    value={name}
                    onChange={e => {
                      setName(e.target.value)
                      if (errors.name) {
                        setErrors(prev => ({ ...prev, name: validateField('name', e.target.value) }))
                      }
                    }}
                    onBlur={() => handleBlurValidation('name', name)}
                    onFocus={() => setFocusField('name')}
                    placeholder="أدخل اسمك الكامل"
                    style={inputStyle('name')}
                  />
                </div>
                {errors.name && (
                  <p style={{ color: '#c62828', fontSize: 12, marginTop: 6, fontFamily: BODY }}>
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: B.sub, display: 'block', marginBottom: 6, fontFamily: BODY }}>
                  البريد الإلكتروني
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 16,
                      pointerEvents: 'none',
                    }}
                  >
                    📧
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value)
                      if (errors.email) {
                        setErrors(prev => ({ ...prev, email: validateField('email', e.target.value) }))
                      }
                    }}
                    onBlur={() => handleBlurValidation('email', email)}
                    onFocus={() => setFocusField('email')}
                    placeholder="example@email.com"
                    style={{ ...inputStyle('email'), direction: 'ltr', textAlign: 'right' }}
                  />
                </div>
                {errors.email && (
                  <p style={{ color: '#c62828', fontSize: 12, marginTop: 6, fontFamily: BODY }}>
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: B.sub, display: 'block', marginBottom: 6, fontFamily: BODY }}>
                  كلمة المرور
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 16,
                      pointerEvents: 'none',
                    }}
                  >
                    🔑
                  </span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => {
                      const value = e.target.value
                      setPassword(value)

                      setErrors(prev => ({
                        ...prev,
                        password: prev.password ? validateField('password', value) : prev.password,
                        confirmPassword: confirmPassword ? validateField('confirmPassword', confirmPassword) : prev.confirmPassword,
                      }))
                    }}
                    onBlur={() => handleBlurValidation('password', password)}
                    onFocus={() => setFocusField('password')}
                    placeholder="٨ أحرف على الأقل"
                    style={{ ...inputStyle('password'), paddingLeft: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    aria-label={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    style={{
                      position: 'absolute',
                      left: 13,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 15,
                      color: B.sub,
                      padding: 0,
                    }}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && (
                  <p style={{ color: '#c62828', fontSize: 12, marginTop: 6, fontFamily: BODY }}>
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: B.sub, display: 'block', marginBottom: 6, fontFamily: BODY }}>
                  تأكيد كلمة المرور
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 16,
                      pointerEvents: 'none',
                    }}
                  >
                    🔒
                  </span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => {
                      const value = e.target.value
                      setConfirmPassword(value)
                      if (errors.confirmPassword) {
                        setErrors(prev => ({ ...prev, confirmPassword: validateField('confirmPassword', value) }))
                      }
                    }}
                    onBlur={() => handleBlurValidation('confirmPassword', confirmPassword)}
                    onFocus={() => setFocusField('confirmPassword')}
                    placeholder="أعد كتابة كلمة المرور"
                    style={inputStyle('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword && (
                  <p style={{ color: '#c62828', fontSize: 12, marginTop: 6, fontFamily: BODY }}>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  background: 'rgba(37,99,235,0.06)',
                  border: '1.5px solid rgba(37,99,235,0.20)',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', marginBottom: 5, fontFamily: BODY }}>
                  ملخص اختيارك
                </div>
                <div style={{ fontSize: 12, color: B.sub, lineHeight: 1.8, fontFamily: BODY }}>
                  المرحلة: {getStageLabel(stage)} · الصف: {grade}
                  {needsTrack ? ` · التشعيب: ${getTrackLabel(track)}` : ''}
                </div>
                <div style={{ fontSize: 13, color: B.text, marginTop: 6, lineHeight: 1.9, fontWeight: 700, fontFamily: BODY }}>
                  {selectionType === 'package'
                    ? `باقة شاملة تشمل جميع المواد المتاحة وعددها ${subjects.length}`
                    : `مواد منفصلة: ${selectedSubjects.map(item => item.name).join('، ')}`}
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: 10,
              marginTop: 22,
              justifyContent: step > 1 ? 'space-between' : 'flex-end',
              flexWrap: 'wrap',
            }}
          >
            {step > 1 && (
              <button
                type="button"
                onClick={goBack}
                style={{
                  minWidth: 120,
                  padding: '13px 18px',
                  borderRadius: 12,
                  border: `1.5px solid ${B.border}`,
                  background: 'transparent',
                  color: B.sub,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: BODY,
                }}
              >
                السابق
              </button>
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={goNext}
                style={{
                  minWidth: 140,
                  padding: '13px 18px',
                  borderRadius: 12,
                  border: 'none',
                  background: B.gradBlue,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontFamily: BODY,
                  boxShadow: B.shadowBlue,
                }}
              >
                التالي
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                style={{
                  minWidth: 160,
                  padding: '15px 18px',
                  borderRadius: 13,
                  border: 'none',
                  background: loading ? 'rgba(107,80,80,0.12)' : B.gradBlue,
                  color: loading ? 'rgba(107,80,80,0.5)' : '#fff',
                  fontSize: 15,
                  fontWeight: 900,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: BODY,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  animation: loading ? 'none' : 'glow 3s ease-in-out infinite',
                }}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        border: '2.5px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    جارٍ إنشاء الحساب...
                  </>
                ) : (
                  '✨ إنشاء الحساب'
                )}
              </button>
            )}
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: B.sub, marginTop: 20, fontFamily: BODY }}>
            بإنشائك الحساب، أنت توافق على{' '}
            <Link href="/landing" style={{ color: B.crimson, textDecoration: 'none', fontWeight: 700, fontFamily: BODY }}>
              شروط استخدام مِداد
            </Link>
          </p>
        </form>
      </main>
    </div>
  )
}

function RegisterFormFallback() {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: B.bg,
        fontFamily: BODY,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: `4px solid ${B.border}`,
          borderTopColor: B.crimson,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFormFallback />}>
      <RegisterForm />
    </Suspense>
  )
}