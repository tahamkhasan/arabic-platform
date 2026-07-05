'use client'
import { useEffect, useState } from 'react'

// ══════════════════════════════════════════════════════════════
// components/PWARegister.tsx
//
// يُضاف مرة واحدة في app/layout.tsx (داخل <body>، أي مكان).
// وظيفتان:
//  1. تسجيل Service Worker بصمت في الخلفية عند تحميل أي صفحة
//  2. اعتراض حدث "beforeinstallprompt" وعرض زر تثبيت أنيق بدل
//     الاعتماد على قائمة المتصفح الافتراضية (تجربة أفضل وأوضح)
// ══════════════════════════════════════════════════════════════

// نوع الحدث غير موجود في TypeScript افتراضياً
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWARegister() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // ── تسجيل Service Worker ──────────────────────────────────
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // فشل التسجيل لا يكسر التطبيق — يعمل بلا PWA فقط
      })
    }

    // ── هل المستخدم ثبّت التطبيق مسبقاً؟ (لا نُظهر البانر حينها) ──
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    setInstalled(isStandalone)

    // ── هل أُغلق البانر سابقاً؟ (لا نُزعج المستخدم مراراً) ──────
    const dismissed = localStorage.getItem('midad_pwa_dismissed')

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
      if (!dismissed && !isStandalone) {
        setShowBanner(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  async function handleInstall() {
    if (!installEvent) return
    await installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    if (outcome === 'accepted') {
      setInstalled(true)
    }
    setShowBanner(false)
    setInstallEvent(null)
  }

  function handleDismiss() {
    setShowBanner(false)
    localStorage.setItem('midad_pwa_dismissed', '1')
  }

  if (!showBanner || installed) return null

  return (
    <div
      dir="rtl"
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        maxWidth: 420,
        margin: '0 auto',
        zIndex: 200,
        background: '#FCF8F2',
        border: '1.5px solid rgba(150,30,45,0.22)',
        borderRadius: 18,
        padding: '16px 18px',
        boxShadow: '0 16px 40px rgba(120,15,30,0.22)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: "'Cairo',Tahoma,sans-serif",
      }}
    >
      <img
        src="/icons/icon-96.png"
        alt="مِداد"
        style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#231B19', marginBottom: 2 }}>
          أضف مِداد لشاشتك الرئيسية
        </div>
        <div style={{ fontSize: 12, color: '#6B5050', lineHeight: 1.5 }}>
          وصول أسرع بلا فتح متصفح
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          onClick={handleInstall}
          style={{
            padding: '9px 16px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg,#780F1E,#C32D2D,#D2692D)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          تثبيت
        </button>
        <button
          onClick={handleDismiss}
          style={{
            padding: '9px 12px',
            borderRadius: 10,
            border: '1px solid rgba(150,30,45,0.2)',
            background: 'transparent',
            color: '#6B5050',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
