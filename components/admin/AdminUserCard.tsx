'use client'
import { BRAND } from '@/lib/constants/theme'
import { STAGE_LABELS, type StageKey } from '@/lib/constants/stages'
import { T } from './adminTheme'
import type { User } from '@/types/admin.types'

interface AdminUserCardProps {
  u: User
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

export default function AdminUserCard({
  u,
  onApprove,
  onSuspend,
  onReactivate,
  onPromoteToTeacher,
  onOpenStageModal,
  onOpenSubscriptionsModal,
  onOpenAssignSubjects,
  onOpenAssignScope,
  onOpenRoleModal,
  onDelete,
}: AdminUserCardProps) {
  const displayName = u.full_name || u.name || u.email || 'بدون بريد'
  const isTeacher = u.user_type === 'teacher' || u.role === 'teacher'

  function handleDeleteClick() {
    const accountLabel =
      u.user_type === 'student'
        ? 'الطالب'
        : u.user_type === 'teacher' || u.role === 'teacher'
        ? 'المعلم'
        : 'الموظف'

    const ok = window.confirm(
      `هل أنت متأكد من حذف حساب ${accountLabel} "${displayName}"؟\n\nلا يمكن التراجع عن هذا الإجراء بعد الحذف.`
    )

    if (!ok) return
    onDelete(u)
  }

  return (
    <div
      style={{
        padding: '16px 18px',
        borderRadius: BRAND.radiusMd,
        background: 'rgba(255,255,255,0.72)',
        border: `1.5px solid ${u.status === 'pending' ? 'rgba(140,20,40,0.28)' : T.borderCol}`,
        boxShadow: T.shadow,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 18 }}>{u.user_type === 'student' ? '🎓' : u.role === 'admin' ? '👑' : '👨‍🏫'}</span>
            <span style={{ fontSize: 15, fontWeight: BRAND.weightBold, color: T.textCol }}>{displayName}</span>
            <span
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 999,
                fontWeight: BRAND.weightBold,
                background:
                  u.status === 'approved'
                    ? 'rgba(140,20,40,0.10)'
                    : u.status === 'pending'
                    ? 'rgba(220,100,40,0.15)'
                    : 'rgba(140,20,40,0.10)',
                color: u.status === 'approved' ? BRAND.crimson : u.status === 'pending' ? BRAND.orange : BRAND.crimson,
              }}
            >
              {u.status === 'approved' ? '✅ مفعّل' : u.status === 'pending' ? '⏳ انتظار' : '❌ موقوف'}
            </span>
          </div>

          <div style={{ fontSize: 13, color: T.subCol, marginBottom: 6 }}>{u.email}</div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: T.subCol }}>
              {u.user_type === 'student' ? 'طالب' : u.role === 'admin' ? 'مدير' : 'معلم'}
            </span>

            {u.assigned_role ? (
              <span style={{ fontSize: 11, color: BRAND.crimson, fontWeight: BRAND.weightBold }}>
                الدور المعيّن: {u.assigned_role.name} ({u.assigned_role.key})
              </span>
            ) : null}

            {u.allowed_grades?.length ? (
              <span style={{ fontSize: 11, color: BRAND.crimson, fontWeight: BRAND.weightSemibold }}>
                الصف {u.allowed_grades.join('، ')}
              </span>
            ) : null}

            {u.created_at ? (
              <span style={{ fontSize: 11, color: T.subCol }}>
                {new Date(u.created_at).toLocaleDateString('ar-KW', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            ) : null}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {u.status === 'pending' && (
            <button
              onClick={() => (u.user_type === 'student' ? onOpenStageModal(u) : onApprove(u))}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: 'none',
                background: 'rgba(140,20,40,0.14)',
                color: BRAND.crimson,
                fontWeight: BRAND.weightBold,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {u.user_type === 'student' ? '✅ موافقة + تحديد الصف' : '✅ موافقة'}
            </button>
          )}

          {u.status === 'approved' && u.role !== 'admin' && (
            <button
              onClick={() => onSuspend(u)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: 'none',
                background: 'rgba(220,100,40,0.14)',
                color: BRAND.orange,
                fontWeight: BRAND.weightBold,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              🔒 تعليق
            </button>
          )}

          {u.status === 'suspended' && (
            <button
              onClick={() => onReactivate(u)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: 'none',
                background: 'rgba(140,20,40,0.12)',
                color: BRAND.crimson,
                fontWeight: BRAND.weightBold,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              🔓 إعادة تفعيل
            </button>
          )}

          {u.user_type === 'student' && u.role !== 'admin' && (
            <button
              onClick={() => onPromoteToTeacher(u)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: `1px solid ${T.borderCol}`,
                background: 'transparent',
                color: T.subCol,
                fontWeight: BRAND.weightBold,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              ترقية لمعلم
            </button>
          )}

          {u.user_type === 'student' && (
            <button
              onClick={() => onOpenStageModal(u)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: `1px solid ${u.allowed_stages?.length ? 'rgba(140,20,40,0.22)' : 'rgba(220,100,40,0.4)'}`,
                background: u.allowed_stages?.length ? 'rgba(140,20,40,0.07)' : 'rgba(220,100,40,0.12)',
                color: u.allowed_stages?.length ? BRAND.crimson : BRAND.orange,
                fontWeight: BRAND.weightBold,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {u.allowed_stages?.length
                ? `📚 ${STAGE_LABELS[u.allowed_stages[0] as StageKey] ?? u.allowed_stages[0]} • ${u.allowed_grades?.[0] ?? '؟'}`
                : '⚠️ لم يُحدَّد الصف'}
            </button>
          )}

          {u.user_type === 'student' && u.allowed_stages?.length ? (
            <button
              onClick={() => onOpenSubscriptionsModal(u)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: '1px solid rgba(140,20,40,0.35)',
                background: 'rgba(140,20,40,0.10)',
                color: BRAND.crimson,
                fontWeight: BRAND.weightBold,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              📦 الاشتراكات
            </button>
          ) : null}

          {isTeacher && (
            <button
              onClick={() => onOpenAssignSubjects(u)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: '1px solid rgba(140,20,40,0.22)',
                background: 'rgba(140,20,40,0.07)',
                color: BRAND.crimson,
                fontWeight: BRAND.weightBold,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              📚 تخصيص المواد
            </button>
          )}

          {isTeacher && (
            <button
              onClick={() => onOpenAssignScope(u)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: '1px solid rgba(140,20,40,0.22)',
                background: 'rgba(140,20,40,0.07)',
                color: BRAND.crimson,
                fontWeight: BRAND.weightBold,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              🎓 نطاقات التدريس
            </button>
          )}

          {u.role !== 'admin' && (
            <button
              onClick={() => onOpenRoleModal(u)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: '1px solid rgba(140,20,40,0.22)',
                background: 'rgba(140,20,40,0.07)',
                color: BRAND.crimson,
                fontWeight: BRAND.weightBold,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {u.assigned_role?.name || u.assigned_role?.key || 'تعيين دور'}
            </button>
          )}

          {u.role !== 'admin' && (
            <button
              onClick={handleDeleteClick}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid rgba(140,20,40,0.3)',
                background: 'rgba(140,20,40,0.06)',
                color: BRAND.crimson,
                fontWeight: BRAND.weightBold,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              title="حذف الحساب"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  )
}