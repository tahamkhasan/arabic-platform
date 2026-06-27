// components/admin/AdminLayout.tsx
'use client'

import { useRouter } from 'next/navigation'
import { BRAND } from '@/lib/constants/theme'
import { useState } from 'react'

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
}

export default function AdminLayout({ children, title = 'لوحة التحكم' }: AdminLayoutProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const menuItems = [
    { icon: '👥', label: 'المستخدمون', path: '/admin' },
    { icon: '📚', label: 'المواد', path: '/admin/subjects' },
    { icon: '📊', label: 'الإحصائيات', path: '/admin/stats' },
    { icon: '⚙️', label: 'الإعدادات', path: '/admin/settings' },
  ]

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: BRAND.bg,
        color: BRAND.text,
        fontFamily: BRAND.fontBody,
      }}
    >
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(247,242,234,0.97)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${BRAND.border}`,
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: BRAND.shadow,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: BRAND.radiusSm,
              background: BRAND.gradMain,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: BRAND.weightBlack,
              color: '#fff',
            }}
          >
            م
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading }}>
              مِداد
            </div>
            <div style={{ fontSize: 12, color: BRAND.sub }}>لوحة المدير</div>
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          style={{
            padding: '8px 14px',
            borderRadius: BRAND.radiusSm,
            border: 'none',
            background: 'rgba(140,20,40,0.1)',
            color: BRAND.crimson,
            fontWeight: BRAND.weightBold,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 13,
          }}
        >
          ✨ أدوات التوليد
        </button>
      </header>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)' }}>
        {/* Sidebar - Desktop */}
        <aside
          className="admin-sidebar"
          style={{
            width: 240,
            background: BRAND.bgSoft,
            borderLeft: `1px solid ${BRAND.border}`,
            padding: 24,
          }}
        >
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                style={{
                  padding: '12px 16px',
                  borderRadius: BRAND.radiusMd,
                  border: 'none',
                  background: 'transparent',
                  color: BRAND.text,
                  fontWeight: BRAND.weightBold,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'right',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 14,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(140,20,40,0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main
          style={{
            flex: 1,
            padding: 24,
            maxWidth: 1200,
            margin: '0 auto',
            width: '100%',
          }}
        >
          {title && (
            <h1
              style={{
                fontSize: 24,
                fontWeight: BRAND.weightBlack,
                fontFamily: BRAND.fontHeading,
                color: BRAND.crimson,
                marginBottom: 24,
                marginTop: 0,
              }}
            >
              {title}
            </h1>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}