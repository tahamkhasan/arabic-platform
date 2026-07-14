'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BRAND } from '@/lib/constants/theme'

const B = {
  bg: BRAND.bg,
  text: BRAND.text,
  sub: BRAND.sub,
  border: BRAND.border,
  borderStrong: BRAND.borderStrong,
  crimson: BRAND.crimson,
  gradBlue: BRAND.gradBlue,
  shadowBlue: BRAND.shadowBlue,
}

const BODY = BRAND.fontBody

interface Props {
  activePage?: 'landing' | 'login'
  logoUrl?: string
}

export default function PublicHeader({ activePage = 'landing', logoUrl = '/logo-midad.png' }: Props) {
  const router = useRouter()
  const [scrollY, setScrollY] = useState(0)
  const [logo, setLogo] = useState(logoUrl)

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    fetch('/api/platform-settings')
      .then(r => r.json())
      .then(d => {
        if (d.settings?.logo_url) setLogo(d.settings.logo_url)
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <style>{`
        @keyframes glow-hdr{
          0%,100%{box-shadow:${B.shadowBlue};}
          50%{box-shadow:0 10px 36px rgba(37,99,235,0.62);}
        }

        .hdr-btn{
          border:none;
          cursor:pointer;
          font-family:${BODY};
          transition:transform .18s,box-shadow .18s,background .18s,border-color .18s,color .18s;
        }

        .hdr-btn:hover{transform:translateY(-2px)}

        .hdr-link{
          color:${B.sub};
          font-size:15px;
          font-weight:700;
          text-decoration:none;
          transition:color .18s;
          font-family:${BODY};
        }

        .hdr-link:hover{color:${B.crimson}}
        .hdr-link.active{color:${B.crimson}}

        .hdr-logo-btn{
          all:unset;
          cursor:pointer;
          display:flex;
          align-items:center;
          flex-shrink:0;
        }

        @media(max-width:820px){
          .hdr-links{display:none!important;}
          .hdr-btn-login{display:none!important;}
        }
      `}</style>

      <nav
        dir="rtl"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          gap: 16,
          background:
            scrollY > 30 || activePage === 'login'
              ? 'rgba(247,242,234,0.96)'
              : 'rgba(247,242,234,0.78)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${scrollY > 30 || activePage === 'login' ? B.border : 'transparent'}`,
          transition: 'all 0.3s',
          fontFamily: BODY,
        }}
      >
        <button
          type="button"
          className="hdr-logo-btn"
          onClick={() => router.push('/landing')}
          aria-label="الانتقال إلى الصفحة الرئيسية"
        >
          <img
            src={logo}
            alt="مِداد"
            style={{ height: 42, width: 'auto', objectFit: 'contain', display: 'block' }}
            onError={e => {
              ;(e.target as HTMLImageElement).src = '/logo-midad.png'
            }}
          />
        </button>

        <div
          className="hdr-links"
          style={{
            display: 'flex',
            gap: 28,
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          {activePage === 'landing' ? (
            <>
              <a href="#features" className="hdr-link">
                المزايا
              </a>
              <a href="#how" className="hdr-link">
                كيف تعمل
              </a>
              <a href="#roles" className="hdr-link">
                لمن صُممت
              </a>
              <a href="#cta" className="hdr-link">
                ابدأ
              </a>
            </>
          ) : (
            <>
              <a href="/landing#features" className="hdr-link">
                المزايا
              </a>
              <a href="/landing#how" className="hdr-link">
                كيف تعمل
              </a>
              <a href="/landing#roles" className="hdr-link">
                لمن صُممت
              </a>
              <a href="/landing" className="hdr-link">
                الرئيسية
              </a>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <button
            type="button"
            className="hdr-btn hdr-btn-login"
            onClick={() => router.push('/login')}
            style={{
              padding: '10px 18px',
              borderRadius: 11,
              fontSize: 14,
              fontWeight: 800,
              background: activePage === 'login' ? 'rgba(150,30,45,0.10)' : 'rgba(255,255,255,0.72)',
              color: activePage === 'login' ? B.crimson : B.text,
              border:
                activePage === 'login'
                  ? '1.5px solid rgba(150,30,45,0.30)'
                  : `1.5px solid ${B.borderStrong}`,
            }}
          >
            تسجيل الدخول
          </button>

          <button
            type="button"
            className="hdr-btn"
            onClick={() => router.push('/register')}
            style={{
              padding: '10px 22px',
              borderRadius: 11,
              fontSize: 14,
              fontWeight: 900,
              background: B.gradBlue,
              color: '#fff',
              boxShadow: B.shadowBlue,
              animation: 'glow-hdr 3s ease-in-out infinite',
            }}
          >
            اطلب حساباً
          </button>
        </div>
      </nav>
    </>
  )
}