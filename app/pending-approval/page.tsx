'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useRouteGuard } from '@/hooks/useRouteGuard'
import { BRAND } from '@/lib/constants/theme'

const T = {
  bg: BRAND.bg,
  cardBg: BRAND.bgSoft,
  text: BRAND.text,
  sub: BRAND.sub,
  border: BRAND.border,
  shadow: BRAND.shadow,
  gradMain: BRAND.gradMain,
}

export default function PendingApprovalPage() {
  const router = useRouter()
  const { loading, authorized, user } = useRouteGuard('pending-only')

  useEffect(() => {
    if (loading || !authorized || !user) return

    const intervalId = window.setInterval(() => {
      window.location.reload()
    }, 60000)

    return () => window.clearInterval(intervalId)
  }, [loading, authorized, user])

  function handleLogout() {
    localStorage.removeItem('mosaed_user')
    localStorage.removeItem('mosaed_session')
    router.replace('/login')
  }

  if (loading) return null
  if (!authorized || !user) return null

  const displayName =
    (user as any)?.fullname ??
    (user as any)?.name ??
    user.email ??
    'المستخدم'

  const isSuspended = user.status === 'suspended'

  const title = isSuspended ? 'حسابك معلّق حالياً' : 'حسابك بانتظار الموافقة'
  const message = isSuspended
    ? 'تم تعليق هذا الحساب من قبل إدارة المنصة. يرجى التواصل مع الإدارة لمعرفة السبب وآلية إعادة التفعيل.'
    : 'لم تتم الموافقة على حسابك بعد. بعد اعتماد الحساب من المدير، سيتم نقلك تلقائياً إلى واجهتك داخل المنصة.'
  const badgeText = isSuspended ? 'الحالة: موقوف' : 'الحالة: قيد المراجعة'
  const icon = isSuspended ? '🔒' : '⏳'

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: T.bg,
        fontFamily: BRAND.fontBody,
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: T.cardBg,
          borderRadius: 24,
          border: `1px solid ${T.border}`,
          boxShadow: T.shadow,
          padding: '40px 32px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 18 }}>{icon}</div>

        <div
          style={{
            display: 'inline-block',
            marginBottom: 14,
            padding: '6px 12px',
            borderRadius: 999,
            background: isSuspended ? 'rgba(180,40,40,0.10)' : 'rgba(217,119,6,0.12)',
            color: isSuspended ? '#9f1239' : '#b45309',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {badgeText}
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: T.text,
            marginBottom: 12,
            fontFamily: BRAND.fontHeading,
          }}
        >
          {title}
        </h1>

        <p
          style={{
            fontSize: 14,
            color: T.sub,
            lineHeight: 1.9,
            marginBottom: 12,
          }}
        >
          {message}
        </p>

        <div
          style={{
            marginBottom: 10,
            fontSize: 13,
            fontWeight: 800,
            color: T.text,
          }}
        >
          {displayName}
        </div>

        {user.email ? (
          <p
            style={{
              fontSize: 13,
              color: T.sub,
              marginBottom: 28,
              direction: 'ltr',
              display: 'inline-block',
            }}
          >
            {user.email}
          </p>
        ) : null}

        <p
          style={{
            fontSize: 12,
            color: T.sub,
            marginBottom: 24,
            lineHeight: 1.8,
          }}
        >
          يتم تحديث الحالة تلقائياً كل دقيقة.
        </p>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 14,
            border: 'none',
            background: T.gradMain,
            color: '#fff',
            fontWeight: 900,
            fontSize: 15,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          🚪 تسجيل الخروج
        </button>

        <p style={{ fontSize: 12, color: T.sub, marginTop: 18 }}>
          <Link href="/landing" style={{ color: T.sub, textDecoration: 'underline' }}>
            العودة إلى الصفحة الرئيسية
          </Link>
        </p>
      </div>
    </div>
  )
}