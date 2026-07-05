'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'

type User = {
  id: string
  email: string
  role: string
  user_type: string
  full_name?: string | null
}

type GeneratorCard = {
  id: string
  icon: string
  title: string
  desc: string
  status: 'جاهز' | 'قريبًا'
  href?: string
  accent: string
}

const T = {
  bg: BRAND.bg,
  cardBg: BRAND.bgSoft,
  textCol: BRAND.text,
  subCol: BRAND.sub,
  borderCol: BRAND.border,
  headerBg: 'rgba(247,242,234,0.92)',
  shadow: BRAND.shadow,
}

export default function AdminGeneratorPage() {
  const router = useRouter()

  const [admin, setAdmin] = useState<User | null>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [logoUrl, setLogoUrl] = useState('/logo-midad.png')

  useEffect(() => {
    let mounted = true

    async function checkAuth() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError || !session?.access_token) {
          localStorage.removeItem('mosaed_user')
          router.replace('/login')
          return
        }

        const meRes = await fetch('/api/auth/me', {
          method: 'GET',
          headers: { Authorization: `Bearer ${session.access_token}` },
        })

        const meData = await meRes.json().catch(() => null)

        if (!meRes.ok || !meData?.user) {
          localStorage.removeItem('mosaed_user')
          router.replace('/login')
          return
        }

        const appUser = meData.user as User

        if (appUser.role !== 'admin') {
          if (appUser.user_type === 'student') router.replace('/student')
          else router.replace('/dashboard')
          return
        }

        if (!mounted) return
        setAdmin(appUser)
      } catch {
        localStorage.removeItem('mosaed_user')
        router.replace('/login')
      } finally {
        if (mounted) setAuthChecking(false)
      }
    }

    checkAuth()

    return () => {
      mounted = false
    }
  }, [router])

  useEffect(() => {
    fetch('/api/platform-settings')
      .then(r => r.json())
      .then(d => {
        if (d.settings?.logo_url) setLogoUrl(d.settings.logo_url)
      })
      .catch(() => {})
  }, [])

  const cards = useMemo<GeneratorCard[]>(
    () => [
      {
        id: 'quiz-generator',
        icon: '🧪',
        title: 'توليد الاختبارات',
        desc: 'مدخل موحّد لأدوات التوليد الخاصة بالاختبارات والنماذج والضبط العام.',
        status: 'جاهز',
        href: '/admin',
        accent: BRAND.crimson,
      },
      {
        id: 'prompt-governance',
        icon: '🧭',
        title: 'ضبط التعليمات الثابتة',
        desc: 'مكان واضح لاحقاً لإدارة قواعد الفهم والنحو والبلاغة والتعبير.',
        status: 'قريبًا',
        accent: BRAND.orange,
      },
      {
        id: 'exemplary-models',
        icon: '📄',
        title: 'النماذج الاحتذائية',
        desc: 'واجهة مخصصة لاحقاً لرفع النماذج القصيرة والنهائية وتتبع آخر تحديث.',
        status: 'قريبًا',
        accent: BRAND.gold,
      },
      {
        id: 'generation-audit',
        icon: '📊',
        title: 'مراجعة المخرجات',
        desc: 'مساحة مستقبلية لمقارنة النتائج قبل وبعد التعديلات ومعاينة الجودة.',
        status: 'قريبًا',
        accent: BRAND.deep,
      },
    ],
    []
  )

  function Logo({ h = 42 }: { h?: number }) {
    return (
      <img
        src={logoUrl}
        alt="مِداد"
        height={h}
        style={{ height: h, width: 'auto', objectFit: 'contain', display: 'block' }}
        onError={e => {
          ;(e.target as HTMLImageElement).src = '/logo-midad.png'
        }}
      />
    )
  }

  async function handleLogout() {
    localStorage.removeItem('mosaed_user')
    localStorage.removeItem('mosaed_session')
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (authChecking) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: T.bg,
          color: T.subCol,
          fontFamily: BRAND.fontBody,
        }}
      >
        ⏳ جارٍ التحقق من الجلسة...
      </div>
    )
  }

  if (!admin) return null

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: `
          radial-gradient(circle at 85% 10%, rgba(225,135,60,0.10), transparent 28%),
          radial-gradient(circle at 10% 80%, rgba(150,30,45,0.08), transparent 26%),
          ${T.bg}
        `,
        color: T.textCol,
        fontFamily: BRAND.fontBody,
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: ${T.bg}; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeIn .32s ease; }
        @media (max-width: 760px) {
          .generator-grid { grid-template-columns: 1fr !important; }
          .hero-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 60,
          background: 'rgba(247,242,234,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${T.borderCol}`,
          padding: '14px 20px',
          boxShadow: T.shadow,
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                padding: 10,
                borderRadius: BRAND.radiusMd,
                background: 'rgba(255,255,255,0.78)',
                border: `1px solid ${T.borderCol}`,
                boxShadow: T.shadow,
              }}
            >
              <Logo h={40} />
            </div>

            <div>
              <div
                style={{
                  fontSize: 19,
                  fontWeight: BRAND.weightBlack,
                  fontFamily: BRAND.fontHeading,
                  color: T.textCol,
                  marginBottom: 4,
                }}
              >
                مِداد — مركز التوليد
              </div>
              <div style={{ fontSize: 12, color: T.subCol }}>
                ✨ أدوات الضبط والإشراف على التوليد • {admin.full_name || admin.email}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin')}>
              ← الرجوع إلى لوحة الأدمن
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/subjects')}>
              📚 إدارة المواد
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/settings')}>
              ⚙️ الإعدادات
            </Button>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              🚪 خروج
            </Button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '22px 16px 32px' }}>
        <section
          className="fade-in"
          style={{
            background: 'rgba(255,255,255,0.68)',
            border: `1px solid ${T.borderCol}`,
            borderRadius: BRAND.radiusXl,
            boxShadow: T.shadow,
            padding: 24,
            backdropFilter: 'blur(14px)',
            marginBottom: 18,
          }}
        >
          <div
            className="hero-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.15fr .85fr',
              gap: 18,
              alignItems: 'stretch',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: 'rgba(140,20,40,0.08)',
                  border: '1px solid rgba(140,20,40,0.16)',
                  color: BRAND.crimson,
                  fontSize: 13,
                  fontWeight: BRAND.weightBlack,
                  marginBottom: 16,
                }}
              >
                ✨ لوحة مخصّصة للتوليد
              </div>

              <h1
                style={{
                  fontSize: 'clamp(28px,4vw,42px)',
                  fontWeight: BRAND.weightBlack,
                  fontFamily: BRAND.fontHeading,
                  color: T.textCol,
                  margin: '0 0 10px',
                  lineHeight: 1.2,
                }}
              >
                اضبط أدوات التوليد من مكان واضح
              </h1>

              <p
                style={{
                  fontSize: 15,
                  color: T.subCol,
                  lineHeight: 1.95,
                  margin: 0,
                  maxWidth: 620,
                }}
              >
                هذه الصفحة تجعل أعمال التوليد والإعدادات المرتبطة بها أقرب للمدير، وتقلل تشتتها داخل صفحة الأدمن
                العامة.
              </p>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
                <Button variant="primary" onClick={() => router.push('/admin')}>
                  فتح الإدارة الحالية
                </Button>
                <Button variant="secondary" onClick={() => router.push('/admin/settings')}>
                  فتح إعدادات المنصة
                </Button>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2,1fr)',
                gap: 12,
              }}
            >
              {[
                { label: 'محور منفصل', value: '1', icon: '🧭', color: BRAND.crimson },
                { label: 'عناصر جاهزة', value: '1', icon: '✅', color: BRAND.orange },
                { label: 'عناصر قادمة', value: '3', icon: '🛠️', color: BRAND.gold },
                { label: 'هوية موحّدة', value: '100%', icon: '🎨', color: BRAND.deep },
              ].map(card => (
                <div
                  key={card.label}
                  style={{
                    background: 'rgba(255,255,255,0.76)',
                    border: `1px solid ${T.borderCol}`,
                    borderRadius: BRAND.radiusMd,
                    padding: 16,
                    boxShadow: T.shadow,
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{card.icon}</div>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: BRAND.weightBlack,
                      color: card.color,
                      marginBottom: 4,
                    }}
                  >
                    {card.value}
                  </div>
                  <div style={{ fontSize: 12, color: T.subCol }}>{card.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className="generator-grid fade-in"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2,1fr)',
            gap: 16,
          }}
        >
          {cards.map(card => (
            <div
              key={card.id}
              style={{
                background: 'rgba(255,255,255,0.72)',
                border: `1px solid ${T.borderCol}`,
                borderRadius: BRAND.radiusXl,
                boxShadow: T.shadow,
                padding: 22,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{card.icon}</div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 10,
                  flexWrap: 'wrap',
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: BRAND.weightBlack,
                    fontFamily: BRAND.fontHeading,
                    color: T.textCol,
                  }}
                >
                  {card.title}
                </h2>

                <span
                  style={{
                    fontSize: 11,
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontWeight: BRAND.weightBlack,
                    background: card.status === 'جاهز' ? 'rgba(140,20,40,0.10)' : 'rgba(225,135,60,0.14)',
                    color: card.status === 'جاهز' ? BRAND.crimson : BRAND.orange,
                  }}
                >
                  {card.status}
                </span>
              </div>

              <p
                style={{
                  margin: '0 0 16px',
                  fontSize: 14,
                  color: T.subCol,
                  lineHeight: 1.9,
                }}
              >
                {card.desc}
              </p>

              {card.href ? (
                <Button variant="primary" onClick={() => router.push(card.href!)}>
                  فتح
                </Button>
              ) : (
                <Button variant="ghost" disabled>
                  قريبًا
                </Button>
              )}
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}