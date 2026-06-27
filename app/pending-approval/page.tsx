'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BRAND } from '@/lib/constants/theme'

interface User {
  id: string
  name?: string
  email?: string
  status?: string
  user_type?: string
}

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
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('mosaed_user')
    if (!saved) {
      router.replace('/')
      return
    }
    try {
      const u = JSON.parse(saved) as User
      // ── إذا أصبح الحساب فعّالاً فعلياً (موافَق عليه)، لا معنى
      // لإبقائه في صفحة الانتظار — يُعاد توجيهه لمساره الصحيح فوراً.
      if (u.status === 'approved') {
        router.replace(u.user_type === 'student' ? '/student' : '/dashboard')
        return
      }
      setUser(u)
    } catch {
      router.replace('/')
    }
  }, [router])

  function handleLogout() {
    localStorage.removeItem('mosaed_user')
    localStorage.removeItem('mosaed_session')
    router.replace('/')
  }

  // ── تحديث دوري بسيط: يتحقّق من حالة الحساب كل دقيقة عبر إعادة
  // تحميل الصفحة، بلا اعتماد على API مخصّص لم نتأكد من وجوده ──
  useEffect(() => {
    const iv = setInterval(() => {
      window.location.reload()
    }, 60000)
    return () => clearInterval(iv)
  }, [])

  if (!user) return null

  const isSuspended = user.status === 'suspended'

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
          maxWidth: 460,
          background: T.cardBg,
          borderRadius: 24,
          border: `1px solid ${T.border}`,
          boxShadow: T.shadow,
          padding: '40px 32px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 18 }}>{isSuspended ? '🔒' : '⏳'}</div>

        <h1
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: T.text,
            marginBottom: 12,
            fontFamily: BRAND.fontHeading,
          }}
        >
          {isSuspended ? 'حسابك معلَّق حالياً' : 'حسابك بانتظار الموافقة'}
        </h1>

        <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.9, marginBottom: 8 }}>
          {isSuspended
            ? 'تم تعليق هذا الحساب من قِبل إدارة المنصة. تواصل مع إدارة المنصة لمزيد من التفاصيل.'
            : 'لم يوافق المدير على حسابك بعد. بمجرد الموافقة، ستتمكن من الوصول إلى المنصة بالكامل تلقائياً.'}
        </p>

        {user.email && (
          <p style={{ fontSize: 13, color: T.sub, marginBottom: 28, direction: 'ltr', display: 'inline-block' }}>
            {user.email}
          </p>
        )}

        <button
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
