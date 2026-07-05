'use client'

import { A, type RoleItem, type User } from './admin-utils'

type Props = {
  open: boolean
  user: User | null
  roles: RoleItem[]
  selectedRoleId: string
  onSelectedRoleIdChange: (value: string) => void
  rolesLoading: boolean
  assigning: boolean
  onAssign: () => void
  onRemove: () => void
  onClose: () => void
}

function modalBtnStyle(kind: 'primary' | 'ghost' | 'danger'): React.CSSProperties {
  const base: React.CSSProperties = {
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: A.weightBold,
    fontFamily: A.fontBody,
    cursor: 'pointer',
  }

  if (kind === 'primary') {
    return {
      ...base,
      border: 'none',
      background: A.gradMain,
      color: '#fff',
    }
  }

  if (kind === 'danger') {
    return {
      ...base,
      border: `1px solid rgba(140,20,40,0.18)`,
      background: 'rgba(140,20,40,0.06)',
      color: A.crimson,
    }
  }

  return {
    ...base,
    border: `1px solid ${A.border}`,
    background: '#fff',
    color: A.text,
  }
}

export default function RoleModal({
  open,
  user,
  roles,
  selectedRoleId,
  onSelectedRoleIdChange,
  rolesLoading,
  assigning,
  onAssign,
  onRemove,
  onClose,
}: Props) {
  if (!open || !user) return null

  const selectedRole = roles.find(r => String(r.id) === String(selectedRoleId))

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(24,18,20,0.42)',
        backdropFilter: 'blur(7px)',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 560,
          background: A.card,
          borderRadius: 22,
          border: `1px solid ${A.border}`,
          boxShadow: A.shadow,
          padding: 22,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 18,
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: A.weightBlack,
                color: A.text,
                fontFamily: A.fontHeading,
              }}
            >
              تعيين دور
            </h3>
            <div style={{ fontSize: 13, color: A.sub, marginTop: 6 }}>{user.email}</div>
          </div>

          <button onClick={onClose} disabled={assigning} style={modalBtnStyle('ghost')}>
            إغلاق
          </button>
        </div>

        <div
          style={{
            marginBottom: 14,
            padding: '12px 14px',
            borderRadius: 14,
            border: `1px solid ${A.border}`,
            background: '#fff',
            fontSize: 13,
            color: A.sub,
          }}
        >
          الدور الحالي:{' '}
          <span style={{ color: A.text, fontWeight: A.weightBlack }}>
            {user.assigned_role?.name || 'بدون دور'}
          </span>
        </div>

        <label
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: A.weightBold,
            color: A.text,
            marginBottom: 8,
          }}
        >
          اختر الدور
        </label>

        <select
          value={selectedRoleId}
          onChange={e => onSelectedRoleIdChange(e.target.value)}
          disabled={rolesLoading || assigning}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 12,
            border: `1px solid ${A.border}`,
            background: A.inputBg,
            color: A.text,
            fontFamily: A.fontBody,
            marginBottom: 14,
          }}
        >
          <option value="">اختر من القائمة</option>
          {roles.map(role => (
            <option key={role.id} value={role.id}>
              {role.name} ({role.key})
            </option>
          ))}
        </select>

        {selectedRole ? (
          <div
            style={{
              marginBottom: 18,
              padding: 14,
              borderRadius: 14,
              border: `1px solid ${A.border}`,
              background: '#fff',
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: A.weightBlack,
                color: A.text,
                marginBottom: 6,
              }}
            >
              {selectedRole.name}
            </div>

            {selectedRole.description ? (
              <div style={{ fontSize: 12, color: A.sub, marginBottom: 10 }}>
                {selectedRole.description}
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(selectedRole.permissions || []).length ? (
                selectedRole.permissions!.map(perm => (
                  <span
                    key={perm}
                    style={{
                      padding: '5px 8px',
                      borderRadius: 999,
                      fontSize: 11,
                      background: 'rgba(140,20,40,0.08)',
                      color: A.crimson,
                      fontWeight: A.weightBold,
                    }}
                  >
                    {perm}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 12, color: A.sub }}>لا توجد صلاحيات ظاهرة.</span>
              )}
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={onAssign}
            disabled={!selectedRoleId || assigning}
            style={modalBtnStyle('primary')}
          >
            {assigning ? 'جارٍ الحفظ...' : 'حفظ الدور'}
          </button>

          <button
            onClick={onRemove}
            disabled={!user.assigned_role_id || assigning}
            style={modalBtnStyle('danger')}
          >
            إزالة الدور
          </button>
        </div>
      </div>
    </div>
  )
}