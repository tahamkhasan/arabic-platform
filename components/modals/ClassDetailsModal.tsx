'use client'

import type { CSSProperties, RefObject } from 'react'
import { BRAND } from '@/lib/constants/theme'

type ButtonStyleFn = (state?: boolean) => CSSProperties

type Props = {
  openClass: any
  setOpenClass: (value: any) => void
  loadingClassDetail: boolean
  availableStudentsForClass: any[]
  addingMember: boolean
  addToClass: (...args: any[]) => void
  removeFromClass: (...args: any[]) => void
  deleteClass: (...args: any[]) => void

  ui?: any
  smallCard?: CSSProperties
  ghostBtn?: ButtonStyleFn
  primaryBtn?: ButtonStyleFn

  fileRef?: RefObject<HTMLInputElement | null>
}

function LoadingBlock({
  text,
  sub,
  accent,
}: {
  text: string
  sub?: string
  accent?: string
}) {
  return (
    <div
      style={{
        minHeight: 220,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 24,
      }}
    >
      <div>
        <div
          style={{
            width: 34,
            height: 34,
            margin: '0 auto 12px',
            border: '3px solid rgba(255,255,255,0.18)',
            borderTopColor: accent ?? '#999',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <div style={{ fontSize: 14, fontWeight: 800, color: accent ?? 'inherit', marginBottom: 6 }}>
          {text}
        </div>
        {sub ? <div style={{ fontSize: 12, color: sub }}>{sub}</div> : null}
      </div>
    </div>
  )
}

export function ClassDetailsModal({
  openClass,
  setOpenClass,
  loadingClassDetail,
  availableStudentsForClass,
  addingMember,
  addToClass,
  removeFromClass,
  deleteClass,
  ui,
  smallCard,
  ghostBtn,
  primaryBtn,
}: Props) {
  if (!openClass) return null

  const safeUi = ui ?? {}
  const safeSmallCard = smallCard ?? {}
  const safeGhostBtn: ButtonStyleFn = typeof ghostBtn === 'function' ? ghostBtn : () => ({})
  const safePrimaryBtn: ButtonStyleFn = typeof primaryBtn === 'function' ? primaryBtn : () => ({})

  const classStudents = Array.isArray(openClass.students) ? openClass.students : []
  const classSubject = openClass.subject_name ?? openClass.subjectName ?? 'بلا مادة'
  const classLevel = openClass.level ? ` • ${openClass.level}` : ''

  return (
    <div className="modal-shell" onClick={() => setOpenClass(null)}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div
          style={{
            padding: '16px 18px',
            borderBottom: `1px solid ${safeUi.border ?? '#ddd'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: safeUi.text ?? '#111' }}>
              {openClass.name}
            </div>
            <div style={{ fontSize: 12, color: safeUi.sub ?? '#666', marginTop: 4 }}>
              {classSubject}
              {classLevel}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => deleteClass(openClass.id)}
              style={{
                ...safeGhostBtn(false),
                background: safeUi.dangerBg ?? 'rgba(180,40,40,0.10)',
                borderColor: safeUi.dangerBorder ?? 'rgba(180,40,40,0.28)',
                color: BRAND.crimson,
              }}
            >
              🗑️ حذف الفصل
            </button>

            <button
              type="button"
              onClick={() => setOpenClass(null)}
              style={safeGhostBtn(false)}
            >
              إغلاق
            </button>
          </div>
        </div>

        <div className="modal-body-scroll">
          {loadingClassDetail ? (
            <LoadingBlock
              text="جارٍ تحميل تفاصيل الفصل..."
              sub={safeUi.sub}
              accent={safeUi.themeColor}
            />
          ) : (
            <div className="split-grid">
              <div style={{ ...safeSmallCard, overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '12px 14px',
                    borderBottom: `1px solid ${safeUi.border ?? '#ddd'}`,
                    fontSize: 13,
                    fontWeight: 700,
                    color: safeUi.sub ?? '#666',
                  }}
                >
                  طلاب متاحون للإضافة ({availableStudentsForClass.length})
                </div>

                <div style={{ overflowY: 'auto', maxHeight: 500 }}>
                  {availableStudentsForClass.length === 0 ? (
                    <p style={{ color: safeUi.sub ?? '#666', fontSize: 13, padding: 14, margin: 0 }}>
                      لا يوجد طلاب متاحون حاليًا.
                    </p>
                  ) : (
                    availableStudentsForClass.map((s: any) => (
                      <div
                        key={s.id}
                        style={{
                          padding: '12px 14px',
                          borderBottom: `1px solid ${safeUi.border ?? '#ddd'}`,
                        }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 700, color: safeUi.text ?? '#111' }}>
                          {s.name}
                        </div>
                        <div style={{ fontSize: 11, color: safeUi.sub ?? '#666', marginTop: 2 }}>
                          {s.email}
                        </div>

                        <button
                          type="button"
                          onClick={() => addToClass(openClass.id, s.id)}
                          disabled={addingMember}
                          style={{
                            ...safeGhostBtn(true),
                            ...safePrimaryBtn(true),
                            marginTop: 8,
                            width: '100%',
                          }}
                        >
                          {addingMember ? 'جارٍ الإضافة...' : '＋ إضافة إلى الفصل'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ ...safeSmallCard, overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '12px 14px',
                    borderBottom: `1px solid ${safeUi.border ?? '#ddd'}`,
                    fontSize: 13,
                    fontWeight: 700,
                    color: safeUi.sub ?? '#666',
                  }}
                >
                  طلاب الفصل ({classStudents.length})
                </div>

                <div style={{ overflowY: 'auto', maxHeight: 500 }}>
                  {classStudents.length === 0 ? (
                    <p style={{ color: safeUi.sub ?? '#666', fontSize: 13, padding: 14, margin: 0 }}>
                      لا يوجد طلاب داخل هذا الفصل بعد.
                    </p>
                  ) : (
                    classStudents.map((s: any) => {
                      const memberId = s.member_id ?? s.memberId ?? s.id
                      const studentId = s.student_id ?? s.studentId ?? s.id
                      const fullName = s.full_name ?? s.fullName ?? s.name ?? 'طالب'
                      const email = s.email ?? s.student_email ?? ''

                      return (
                        <div
                          key={memberId}
                          style={{
                            padding: '12px 14px',
                            borderBottom: `1px solid ${safeUi.border ?? '#ddd'}`,
                          }}
                        >
                          <div style={{ fontSize: 14, fontWeight: 700, color: safeUi.text ?? '#111' }}>
                            {fullName}
                          </div>
                          <div style={{ fontSize: 11, color: safeUi.sub ?? '#666', marginTop: 2 }}>
                            {email}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromClass(openClass.id, studentId, memberId)}
                            disabled={addingMember}
                            style={{
                              ...safeGhostBtn(false),
                              marginTop: 8,
                              width: '100%',
                              background: safeUi.dangerBg ?? 'rgba(180,40,40,0.10)',
                              borderColor: safeUi.dangerBorder ?? 'rgba(180,40,40,0.28)',
                              color: BRAND.crimson,
                            }}
                          >
                            إزالة من الفصل
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}