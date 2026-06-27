'use client'

import type { AdminUserItem, AdminRoleOption } from '@/types/users-admin'

type Theme = {
  cardBg: string
  borderCol: string
  textCol: string
  subCol: string
  inputBg: string
}

type Props = {
  open: boolean
  user: AdminUserItem | null
  roles: AdminRoleOption[]
  rolesLoading: boolean
  assigningRole: boolean
  selectedRoleId: string
  setSelectedRoleId: (value: string) => void
  onClose: () => void
  onAssign: () => void
  onRemove: () => void
  T: Theme
  inputStyle: React.CSSProperties
}

export default function AssignRoleModal({
  open,
  user,
  roles,
  rolesLoading,
  assigningRole,
  selectedRoleId,
  setSelectedRoleId,
  onClose,
  onAssign,
  onRemove,
  T,
  inputStyle,
}: Props) {
  if (!open || !user) return null

  const selectedRole = roles.find((r) => r.id === selectedRoleId)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26,18,33,0.34)',
        backdropFilter: 'blur(6px)',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          background: T.cardBg,
          borderRadius: 18,
          border: `1.5px solid ${T.borderCol}`,
          boxShadow: '0 18px 40px rgba(26,18,33,0.16)',
          padding: 22,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: T.textCol, marginBottom: 6 }}>
              تعيين دور للمستخدم
            </div>
            <div style={{ fontSize: 13, color: T.subCol }}>
              {user.email}
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={assigningRole}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: `1px solid ${T.borderCol}`,
              background: 'transparent',
              color: T.subCol,
              fontWeight: 700,
              fontSize: 12,
              cursor: assigningRole ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            إغلاق
          </button>
        </div>

        <div
          style={{
            marginBottom: 14,
            padding: '12px 14px',
            borderRadius: 12,
            background: 'rgba(37,99,235,0.05)',
            border: '1px solid rgba(37,99,235,0.14)',
            fontSize: 13,
            color: T.subCol,
          }}
        >
          الدور الحالي:{' '}
          <span style={{ color: T.textCol, fontWeight: 800 }}>
            {user.assigned_role?.name || user.assigned_role?.key || 'بدون دور معيّن'}
          </span>
        </div>

        <label
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 800,
            color: T.textCol,
            marginBottom: 8,
          }}
        >
          اختر الدور
        </label>

        <select
          value={selectedRoleId}
          onChange={(e) => setSelectedRoleId(e.target.value)}
          disabled={rolesLoading || assigningRole}
          style={{
            ...inputStyle,
            width: '100%',
            minWidth: '100%',
            cursor: rolesLoading || assigningRole ? 'not-allowed' : 'pointer',
            marginBottom: 14,
          }}
        >
          <option value="">اختر من قائمة الأدوار</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name} ({role.key})
            </option>
          ))}
        </select>

        {selectedRole ? (
          <div
            style={{
              marginBottom: 18,
              padding: '12px 14px',
              borderRadius: 12,
              background: T.inputBg,
              border: `1px solid ${T.borderCol}`,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: T.textCol, marginBottom: 6 }}>
              {selectedRole.name}
            </div>

            {selectedRole.description ? (
              <div style={{ fontSize: 12, color: T.subCol, marginBottom: 8 }}>
                {selectedRole.description}
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(selectedRole.permissions || []).length ? (
                (selectedRole.permissions || []).map((perm: string) => (
                  <span
                    key={perm}
                    style={{
                      fontSize: 11,
                      padding: '4px 8px',
                      borderRadius: 999,
                      background: 'rgba(192,57,43,0.08)',
                      color: '#C0392B',
                      fontWeight: 700,
                    }}
                  >
                    {perm}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 12, color: T.subCol }}>
                  لا توجد صلاحيات ظاهرة لهذا الدور.
                </span>
              )}
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={onAssign}
            disabled={!selectedRoleId || assigningRole}
            style={{
              flex: 1,
              minWidth: 170,
              padding: '12px 14px',
              borderRadius: 12,
              border: 'none',
              background:
                !selectedRoleId || assigningRole
                  ? 'rgba(107,80,80,0.12)'
                  : 'linear-gradient(135deg,#2563EB,#1D4ED8)',
              color: !selectedRoleId || assigningRole ? '#6B5050' : '#fff',
              fontWeight: 900,
              fontSize: 14,
              cursor: !selectedRoleId || assigningRole ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              boxShadow:
                !selectedRoleId || assigningRole
                  ? 'none'
                  : '0 8px 20px rgba(37,99,235,0.28)',
            }}
          >
            {assigningRole ? 'جارٍ الحفظ...' : 'حفظ الدور'}
          </button>

          <button
            onClick={onRemove}
            disabled={!user.assigned_role_id || assigningRole}
            style={{
              minWidth: 150,
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid rgba(192,57,43,0.24)',
              background: 'rgba(192,57,43,0.06)',
              color: !user.assigned_role_id || assigningRole ? T.subCol : '#C0392B',
              fontWeight: 800,
              fontSize: 13,
              cursor:
                !user.assigned_role_id || assigningRole ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            إزالة الدور
          </button>
        </div>
      </div>
    </div>
  )
}