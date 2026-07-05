'use client'

import { STAGE_LABELS, TRACK_LABELS, type StageKey, type TrackKey } from '@/lib/constants/stages'
import { A, formatDate, type User } from './admin-utils'

type Props = {
  user: User
  onApprove: () => void
  onSuspend: () => void
  onReactivate: () => void
  onPromote: () => void
  onOpenStage: () => void
  onOpenSubscriptions: () => void
  onAssignSubjects: () => void
  onAssignScope: () => void
  onOpenRole: () => void
  onDelete: () => void
}

function actionBtnStyle(kind: 'primary' | 'ghost' | 'warn' | 'danger'): React.CSSProperties {
  const base: React.CSSProperties = {
    borderRadius: 10,
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: A.weightBold,
    fontFamily: A.fontBody,
    cursor: 'pointer',
  }

  if (kind === 'primary') {
    return {
      ...base,
      border: 'none',
      background: 'rgba(140,20,40,0.11)',
      color: A.crimson,
    }
  }

  if (kind === 'warn') {
    return {
      ...base,
      border: 'none',
      background: 'rgba(220,100,40,0.14)',
      color: A.orange,
    }
  }

  if (kind === 'danger') {
    return {
      ...base,
      border: `1px solid rgba(140,20,40,0.18)`,
      background: 'rgba(140,20,40,0.04)',
      color: A.crimson,
    }
  }

  return {
    ...base,
    border: `1px solid ${A.border}`,
    background: '#fff',
    color: A.sub,
  }
}

function statusView(status: string) {
  if (status === 'approved') {
    return {
      label: 'مقبول',
      bg: 'rgba(140,20,40,0.10)',
      color: A.crimson,
    }
  }

  if (status === 'pending') {
    return {
      label: 'بانتظار الموافقة',
      bg: 'rgba(220,100,40,0.16)',
      color: A.orange,
    }
  }

  return {
    label: 'معلّق',
    bg: 'rgba(120,120,120,0.14)',
    color: A.sub,
  }
}

export default function UserCard({
  user,
  onApprove,
  onSuspend,
  onReactivate,
  onPromote,
  onOpenStage,
  onOpenSubscriptions,
  onAssignSubjects,
  onAssignScope,
  onOpenRole,
  onDelete,
}: Props) {
  const status = statusView(user.status)
  const displayName = user.full_name?.trim() || user.email
  const stageId = user.allowed_stages?.[0] as StageKey | undefined
  const trackId = user.track as TrackKey | null
  const stageLabel = stageId ? STAGE_LABELS[stageId] : null
  const trackLabel = trackId ? TRACK_LABELS[trackId] : null
  const isTeacher = user.user_type === 'teacher' || user.role === 'teacher'

  return (
    <article
      style={{
        background: '#fff',
        border: `1px solid ${A.border}`,
        borderRadius: 18,
        boxShadow: A.shadow,
        padding: 18,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: '1 1 320px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 999,
                background: 'rgba(140,20,40,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              {user.user_type === 'student' ? '🎓' : user.role === 'admin' ? '👑' : '👨‍🏫'}
            </div>

            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: A.weightBlack,
                  fontFamily: A.fontHeading,
                  color: A.text,
                }}
              >
                {displayName}
              </div>
              <div style={{ fontSize: 12, color: A.sub }}>{user.email}</div>
            </div>

            <span
              style={{
                padding: '6px 10px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: A.weightBold,
                background: status.bg,
                color: status.color,
              }}
            >
              {status.label}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                padding: '5px 8px',
                borderRadius: 999,
                fontSize: 11,
                background: 'rgba(0,0,0,0.04)',
                color: A.sub,
              }}
            >
              {user.user_type === 'student' ? 'طالب' : user.role === 'admin' ? 'مدير' : 'معلم'}
            </span>

            {user.assigned_role ? (
              <span
                style={{
                  padding: '5px 8px',
                  borderRadius: 999,
                  fontSize: 11,
                  background: 'rgba(140,20,40,0.08)',
                  color: A.crimson,
                  fontWeight: A.weightBold,
                }}
              >
                {user.assigned_role.name}
              </span>
            ) : null}

            {user.allowed_grades?.[0] ? (
              <span
                style={{
                  padding: '5px 8px',
                  borderRadius: 999,
                  fontSize: 11,
                  background: 'rgba(220,100,40,0.10)',
                  color: A.orange,
                  fontWeight: A.weightBold,
                }}
              >
                {stageLabel ? `${stageLabel} • ` : ''}
                الصف {user.allowed_grades[0]}
                {trackLabel ? ` • ${trackLabel}` : ''}
              </span>
            ) : null}

            {user.created_at ? (
              <span
                style={{
                  padding: '5px 8px',
                  borderRadius: 999,
                  fontSize: 11,
                  background: 'rgba(0,0,0,0.04)',
                  color: A.sub,
                }}
              >
                {formatDate(user.created_at)}
              </span>
            ) : null}
          </div>
        </div>

        <div
          style={{
            flex: '1 1 320px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {user.status === 'pending' ? (
            <button onClick={onApprove} style={actionBtnStyle('primary')}>
              {user.user_type === 'student' ? 'موافقة + صف' : 'موافقة'}
            </button>
          ) : null}

          {user.status === 'approved' && user.role !== 'admin' ? (
            <button onClick={onSuspend} style={actionBtnStyle('warn')}>
              تعليق
            </button>
          ) : null}

          {user.status === 'suspended' ? (
            <button onClick={onReactivate} style={actionBtnStyle('primary')}>
              إعادة تفعيل
            </button>
          ) : null}

          {user.user_type === 'student' && user.role !== 'admin' ? (
            <button onClick={onPromote} style={actionBtnStyle('ghost')}>
              ترقية إلى معلم
            </button>
          ) : null}

          {user.user_type === 'student' ? (
            <button onClick={onOpenStage} style={actionBtnStyle('ghost')}>
              تحديد الصف
            </button>
          ) : null}

          {user.user_type === 'student' && user.allowed_stages?.length ? (
            <button onClick={onOpenSubscriptions} style={actionBtnStyle('primary')}>
              الاشتراكات
            </button>
          ) : null}

          {isTeacher ? (
            <button onClick={onAssignSubjects} style={actionBtnStyle('ghost')}>
              المواد
            </button>
          ) : null}

          {isTeacher ? (
            <button onClick={onAssignScope} style={actionBtnStyle('ghost')}>
              النطاقات
            </button>
          ) : null}

          {user.role !== 'admin' ? (
            <button onClick={onOpenRole} style={actionBtnStyle('primary')}>
              {user.assigned_role?.name || 'تعيين دور'}
            </button>
          ) : null}

          {user.role !== 'admin' ? (
            <button onClick={onDelete} style={actionBtnStyle('danger')}>
              حذف
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}