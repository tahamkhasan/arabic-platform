'use client'

import {
  STAGE_LABELS,
  GRADES_BY_STAGE,
  TRACK_LABELS,
  type StageKey,
  type TrackKey,
} from '@/lib/constants/stages'
import { A, isTrackGrade, type User } from './admin-utils'

type Props = {
  open: boolean
  user: User | null
  stage: StageKey | null
  grade: string | null
  track: TrackKey | null
  saving: boolean
  onStageChange: (value: StageKey) => void
  onGradeChange: (value: string) => void
  onTrackChange: (value: TrackKey) => void
  onSave: () => void
  onClose: () => void
}

function chip(active: boolean): React.CSSProperties {
  return {
    padding: '10px 16px',
    borderRadius: 999,
    border: active ? `2px solid ${A.crimson}` : `1px solid ${A.border}`,
    background: active ? 'rgba(140,20,40,0.08)' : '#fff',
    color: active ? A.crimson : A.text,
    fontWeight: A.weightBold,
    fontFamily: A.fontBody,
    cursor: 'pointer',
  }
}

function btn(kind: 'primary' | 'ghost'): React.CSSProperties {
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

  return {
    ...base,
    border: `1px solid ${A.border}`,
    background: '#fff',
    color: A.text,
  }
}

export default function StageModal({
  open,
  user,
  stage,
  grade,
  track,
  saving,
  onStageChange,
  onGradeChange,
  onTrackChange,
  onSave,
  onClose,
}: Props) {
  if (!open || !user) return null

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
          maxWidth: 620,
          maxHeight: '90vh',
          overflowY: 'auto',
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
              تحديد المرحلة والصف
            </h3>
            <div style={{ fontSize: 13, color: A.sub, marginTop: 6 }}>{user.email}</div>
          </div>

          <button onClick={onClose} disabled={saving} style={btn('ghost')}>
            إغلاق
          </button>
        </div>

        <div style={{ fontSize: 13, color: A.sub, fontWeight: A.weightBold, marginBottom: 10 }}>
          المرحلة
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {(Object.keys(STAGE_LABELS) as StageKey[]).map(item => (
            <button key={item} onClick={() => onStageChange(item)} style={chip(stage === item)}>
              {STAGE_LABELS[item]}
            </button>
          ))}
        </div>

        {stage ? (
          <>
            <div
              style={{ fontSize: 13, color: A.sub, fontWeight: A.weightBold, marginBottom: 10 }}
            >
              الصف
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              {GRADES_BY_STAGE[stage].map(item => (
                <button
                  key={item.id}
                  onClick={() => onGradeChange(item.id)}
                  style={chip(grade === item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </>
        ) : null}

        {isTrackGrade(grade) ? (
          <>
            <div
              style={{ fontSize: 13, color: A.sub, fontWeight: A.weightBold, marginBottom: 10 }}
            >
              التشعيب
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {(Object.keys(TRACK_LABELS) as TrackKey[]).map(item => (
                <button
                  key={item}
                  onClick={() => onTrackChange(item)}
                  style={chip(track === item)}
                >
                  {TRACK_LABELS[item]}
                </button>
              ))}
            </div>
          </>
        ) : null}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={onSave} disabled={saving || !stage || !grade} style={btn('primary')}>
            {saving ? 'جارٍ الحفظ...' : user.status === 'pending' ? 'حفظ واعتماد' : 'حفظ'}
          </button>

          <button onClick={onClose} disabled={saving} style={btn('ghost')}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}