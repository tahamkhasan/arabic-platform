'use client'

import { A, type AdminTab } from './admin-utils'

type Props = {
  activeTab: AdminTab
  adminEmail: string
  onAddTeacher: () => void
  onOpenSettings: () => void
  onOpenSubjects: () => void
  onOpenDashboard: () => void
  onLogout: () => void
}

const TAB_TITLES: Record<AdminTab, string> = {
  students: 'الطلاب',
  teachers: 'المعلمون',
  stages: 'المراحل',
  signals: 'الإشارات',
  stats: 'الإحصاءات',
  settings: 'الإعدادات',
}

function headBtnStyle(kind: 'primary' | 'ghost' | 'danger'): React.CSSProperties {
  const base: React.CSSProperties = {
    border: 'none',
    cursor: 'pointer',
    borderRadius: 12,
    padding: '10px 14px',
    fontFamily: A.fontBody,
    fontWeight: A.weightBold,
    fontSize: 13,
  }

  if (kind === 'primary') {
    return {
      ...base,
      background: A.gradBlue,
      color: '#fff',
      boxShadow: '0 10px 24px rgba(37,99,235,0.22)',
    }
  }

  if (kind === 'danger') {
    return {
      ...base,
      background: 'rgba(140,20,40,0.10)',
      color: A.crimson,
      border: `1px solid rgba(140,20,40,0.18)`,
    }
  }

  return {
    ...base,
    background: '#fff',
    color: A.text,
    border: `1px solid ${A.border}`,
  }
}

export default function AdminHeader({
  activeTab,
  adminEmail,
  onAddTeacher,
  onOpenSettings,
  onOpenSubjects,
  onOpenDashboard,
  onLogout,
}: Props) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 60,
        background: A.headerBg,
        backdropFilter: 'blur(18px)',
        borderBottom: `1px solid ${A.border}`,
        boxShadow: A.shadow,
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: A.gradMain,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: A.weightBlack,
              fontFamily: A.fontHeading,
              fontSize: 20,
            }}
          >
            م
          </div>

          <div>
            <div
              style={{
                fontSize: 19,
                fontWeight: A.weightBlack,
                fontFamily: A.fontHeading,
                color: A.text,
                marginBottom: 3,
              }}
            >
              لوحة الأدمن
            </div>
            <div style={{ fontSize: 12, color: A.sub }}>
              {TAB_TITLES[activeTab]} • {adminEmail}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {activeTab === 'teachers' ? (
            <button onClick={onAddTeacher} style={headBtnStyle('primary')}>
              إضافة معلم
            </button>
          ) : null}

          <button onClick={onOpenSubjects} style={headBtnStyle('ghost')}>
            إدارة المواد
          </button>

          <button onClick={onOpenSettings} style={headBtnStyle('ghost')}>
            إعدادات المنصة
          </button>

          <button onClick={onOpenDashboard} style={headBtnStyle('ghost')}>
            لوحة المعلم
          </button>

          <button onClick={onLogout} style={headBtnStyle('danger')}>
            تسجيل الخروج
          </button>
        </div>
      </div>
    </header>
  )
}