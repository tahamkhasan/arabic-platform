import type { MetadataRoute } from 'next'

// ══════════════════════════════════════════════════════════════
// app/manifest.ts
// Next.js يولّد /manifest.webmanifest تلقائياً من هذا الملف —
// لا حاجة لملف manifest.json يدوي منفصل.
// ══════════════════════════════════════════════════════════════
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'مِداد — منصة تعليم اللغة العربية',
    short_name: 'مِداد',
    description: 'منصة تعليمية ذكية للغة العربية، مخصصة للمعلم والمتعلم في الكويت.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#780F1E',
    theme_color: '#780F1E',
    lang: 'ar',
    dir: 'rtl',
    icons: [
      { src: '/icons/icon-72.png',  sizes: '72x72',   type: 'image/png' },
      { src: '/icons/icon-96.png',  sizes: '96x96',   type: 'image/png' },
      { src: '/icons/icon-128.png', sizes: '128x128', type: 'image/png' },
      { src: '/icons/icon-144.png', sizes: '144x144', type: 'image/png' },
      { src: '/icons/icon-152.png', sizes: '152x152', type: 'image/png' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-384.png', sizes: '384x384', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      // ── Maskable: أندرويد يقصّها بشكل دائري/مستدير الحواف تلقائياً ──
      { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    categories: ['education'],
  }
}