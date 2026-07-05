import type { Metadata, Viewport } from 'next'
import { Cairo, Inter } from 'next/font/google'
import './globals.css'
import PWARegister from '@/components/PWARegister'

const cairo = Cairo({
  variable: '--font-cairo',
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'مِداد — تعلّم بذكاء',
  description:
    'منصة مِداد التعليمية — شرح ذكي، اختبارات تفاعلية، بطاقات حفظ، ومتابعة أداء للمعلم والطالب',
  manifest: '/manifest.webmanifest',
  // ── دعم آيفون: iOS لا يقرأ manifest.json بالكامل، يحتاج meta/link مخصصة ──
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'مِداد',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

// ── لون شريط المتصفح/الحالة عند فتح التطبيق (عنابي الهوية) ──────
export const viewport: Viewport = {
  themeColor: '#780F1E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body">
        {children}
        <PWARegister />
      </body>
    </html>
  )
}
