'use client'

import type { CSSProperties } from 'react'
import type { UITheme } from '../teacher.types'
import { SectionTitle } from '../ui/SectionTitle'

export function MessagesSection({
  ui,
  sectionCard,
  smallCard,
  inputStyle,
  primaryBtn,
  students,
  selStudent,
  setSelStudent,
  msgList,
  newMsg,
  setNewMsg,
  sendingMsg,
  sendMessage,
  currentUserId,
}: {
  ui: UITheme
  sectionCard: CSSProperties
  smallCard: CSSProperties
  inputStyle: CSSProperties
  primaryBtn: (enabled?: boolean) => CSSProperties
  students: any[]
  selStudent: any
  setSelStudent: (student: any) => void
  msgList: any[]
  newMsg: string
  setNewMsg: (value: string) => void
  sendingMsg: boolean
  sendMessage: () => void
  currentUserId: string
}) {
  return (
    <section className="fade-in" style={{ ...sectionCard, padding: 22 }}>
      <SectionTitle icon="💬" title="الرسائل" ui={ui} />

      <div className="teacher-split-grid">
        <div style={{ ...smallCard, overflow: 'hidden' }}>
          <div
            style={{
              padding: '12px 14px',
              borderBottom: `1px solid ${ui.border}`,
              fontSize: 13,
              fontWeight: 700,
              color: ui.sub,
            }}
          >
            الطلاب ({students.length})
          </div>

          <div style={{ overflowY: 'auto', maxHeight: 500 }}>
            {students.length === 0 ? (
              <p style={{ color: ui.sub, fontSize: 13, padding: 14, margin: 0 }}>لا يوجد طلاب</p>
            ) : (
              students.map((s: any) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelStudent(s)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    textAlign: 'right',
                    background: selStudent?.id === s.id ? `${ui.themeColor}10` : 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${ui.border}`,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    color: selStudent?.id === s.id ? ui.themeColor : ui.text,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: ui.sub, marginTop: 2 }}>{s.email}</div>
                </button>
              ))
            )}
          </div>
        </div>

        <div style={{ ...smallCard, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selStudent ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: ui.sub,
                fontSize: 14,
              }}
            >
              اختر طالبًا لفتح المحادثة
            </div>
          ) : (
            <>
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: `1px solid ${ui.border}`,
                  fontSize: 14,
                  fontWeight: 700,
                  color: ui.themeColor,
                  background: `${ui.themeColor}08`,
                }}
              >
                {selStudent.name}
              </div>

              <div
                style={{
                  flex: 1,
                  padding: 14,
                  overflowY: 'auto',
                  maxHeight: 360,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {msgList.length === 0 ? (
                  <p style={{ color: ui.sub, fontSize: 13, textAlign: 'center', margin: 'auto' }}>لا توجد رسائل بعد.</p>
                ) : (
                  msgList.map((msg: any) => {
                    const isMe = msg.from_id === currentUserId

                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          justifyContent: isMe ? 'flex-start' : 'flex-end',
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '76%',
                            padding: '10px 14px',
                            borderRadius: isMe ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                            background: isMe ? `${ui.themeColor}14` : ui.inputBg,
                            border: `1px solid ${isMe ? ui.borderAccent : ui.border}`,
                          }}
                        >
                          <p style={{ fontSize: 14, color: ui.text, margin: 0, lineHeight: 1.7 }}>{msg.content}</p>
                          <p style={{ fontSize: 10, color: ui.sub, margin: '4px 0 0' }}>
                            {new Date(msg.created_at).toLocaleTimeString('ar-KW', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderTop: `1px solid ${ui.border}`,
                  display: 'flex',
                  gap: 8,
                }}
              >
                <input
                  value={newMsg ?? ''}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') sendMessage()
                  }}
                  placeholder="اكتب رسالتك هنا..."
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={sendingMsg || !(newMsg ?? '').trim()}
                  style={{ ...primaryBtn(Boolean((newMsg ?? '').trim())), padding: '10px 16px', minWidth: 68 }}
                >
                  {sendingMsg ? '...' : 'إرسال'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}