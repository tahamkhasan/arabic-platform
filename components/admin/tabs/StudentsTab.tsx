'use client'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'
import { T, inputStyle, sectionCard } from '../adminTheme'
import AdminUserCard from '../AdminUserCard'
import type { User } from '@/types/admin.types'

interface StudentsTabProps {
  studentsCount: number
  pendingCount: number
  searchQ: string
  onSearchChange: (v: string) => void
  statusFilter: 'all' | 'pending'
  onStatusFilterChange: (v: 'all' | 'pending') => void
  loading: boolean
  filteredStudents: User[]
  onAddStudent: () => void
  onApprove: (u: User) => void
  onSuspend: (u: User) => void
  onReactivate: (u: User) => void
  onPromoteToTeacher: (u: User) => void
  onOpenStageModal: (u: User) => void
  onOpenSubscriptionsModal: (u: User) => void
  onOpenAssignSubjects: (u: User) => void
  onOpenAssignScope: (u: User) => void
  onOpenRoleModal: (u: User) => void
  onDelete: (u: User) => void
}

export default function StudentsTab(props: StudentsTabProps) {
  const {
    studentsCount,
    pendingCount,
    searchQ,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    loading,
    filteredStudents,
    onAddStudent,
    ...cardHandlers
  } = props

  return (
    <div className="fade-in" style={sectionCard}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: BRAND.crimson, margin: '0 0 6px' }}>
            🎓 إدارة الطلاب
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: T.subCol }}>اعتماد الحسابات، تحديد الصف، وإدارة اشتراكات الطالب.</p>
        </div>
        <Button variant="primary" size="sm" onClick={onAddStudent}>
          ➕ إضافة طالب جديد مباشرة
        </Button>
      </div>

      <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'إجمالي الطلاب', value: studentsCount, color: BRAND.crimson, icon: '🎓' },
          { label: 'بانتظار الموافقة', value: pendingCount, color: BRAND.red, icon: '⏳' },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              padding: 18,
              borderRadius: BRAND.radiusMd,
              background: 'rgba(255,255,255,0.72)',
              border: `1.5px solid ${s.color}20`,
              boxShadow: T.shadow,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: BRAND.weightBlack, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: T.subCol }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={searchQ}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="🔍 بحث بالاسم أو البريد..."
          style={{ ...inputStyle, flex: 1, minWidth: 220 }}
        />
        <select
          value={statusFilter}
          onChange={e => onStatusFilterChange(e.target.value as any)}
          style={{ ...inputStyle, cursor: 'pointer', minWidth: 180 }}
        >
          <option value="all">الكل ({studentsCount})</option>
          <option value="pending">بانتظار الموافقة ({pendingCount})</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: T.subCol }}>⏳ جارٍ التحميل...</div>
      ) : filteredStudents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.72)', borderRadius: BRAND.radiusMd, border: `1px solid ${T.borderCol}`, color: T.subCol }}>
          لا يوجد طلاب
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredStudents.map(u => (
            <AdminUserCard key={u.id} u={u} {...cardHandlers} />
          ))}
        </div>
      )}
    </div>
  )
}