'use client'

import type { CSSProperties } from 'react'
import { Banner } from '../ui/Banner'
import { Field } from '../ui/Field'
import { BaseModal } from './BaseModal'
import type { UITheme } from '../teacher.types'

export function NewClassModal({
  ui,
  show,
  onClose,
  creatingG,
  gDone,
  classError,
  gName,
  setGName,
  gSubject,
  setGSubject,
  gLevel,
  setGLevel,
  createClass,
  subjects,
  inputStyle,
  primaryBtn,
  ghostBtn,
}: {
  ui: UITheme
  show: boolean
  onClose: () => void
  creatingG: boolean
  gDone: boolean
  classError: string
  gName: string
  setGName: (value: string) => void
  gSubject: string
  setGSubject: (value: string) => void
  gLevel: string
  setGLevel: (value: string) => void
  createClass: () => void
  subjects: any[]
  inputStyle: CSSProperties
  primaryBtn: (enabled?: boolean) => CSSProperties
  ghostBtn: (active?: boolean) => CSSProperties
}) {
  if (!show) return null

  return (
    <BaseModal
      ui={ui}
      title="إنشاء فصل جديد"
      onClose={() => {
        if (!creatingG) onClose()
      }}
      maxWidth={640}
      headerActions={
        <button
          type="button"
          onClick={() => {
            if (!creatingG) onClose()
          }}
          style={{ ...ghostBtn(false), padding: '6px 10px' }}
        >
          ✕
        </button>
      }
    >
      {gDone ? <Banner type="success" ui={ui} text="تم إنشاء الفصل بنجاح." /> : null}
      {classError ? <Banner type="error" ui={ui} text={classError} /> : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="اسم الفصل" sub={ui.sub}>
          <input
            value={gName ?? ''}
            onChange={e => setGName(e.target.value)}
            placeholder="مثال: عاشر 1"
            style={inputStyle}
          />
        </Field>

        <Field label="المادة" sub={ui.sub}>
          <select value={gSubject ?? ''} onChange={e => setGSubject(e.target.value)} style={inputStyle}>
            <option value="">-- اختر مادة --</option>
            {subjects.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="المرحلة/المستوى" sub={ui.sub}>
          <input
            value={gLevel ?? ''}
            onChange={e => setGLevel(e.target.value)}
            placeholder="مثال: الصف العاشر"
            style={inputStyle}
          />
        </Field>

        <button
          type="button"
          onClick={createClass}
          disabled={creatingG || !(gName ?? '').trim()}
          style={primaryBtn(Boolean((gName ?? '').trim()))}
        >
          {creatingG ? 'جارٍ الإنشاء...' : 'إنشاء الفصل'}
        </button>
      </div>
    </BaseModal>
  )
}