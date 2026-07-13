// components/admin/tabs/SettingsTab.tsx
'use client'
import { BRAND } from '@/lib/constants/theme'
import AdminSettingsPanel from '@/components/admin/AdminSettingsPanel'
import { sectionCard } from '../adminTheme'

interface SettingsTabProps {
  logoUrl: string
  onLogoUpdated: (url: string) => void
}

export default function SettingsTab({ logoUrl, onLogoUpdated }: SettingsTabProps) {
  return (
    <div className="fade-in" style={sectionCard}>
      <h2 style={{ fontSize: 22, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: BRAND.crimson, margin: '0 0 24px' }}>
        ⚙️ إعدادات المنصة
      </h2>
      <AdminSettingsPanel initialLogoUrl={logoUrl} onLogoUpdated={onLogoUpdated} />
    </div>
  )
}