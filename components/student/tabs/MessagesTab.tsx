'use client'
import { T, Empty, SectionCard, fmtDateTime } from '../studentTheme'
import type { Message } from '@/types/student.types'

interface MessagesTabProps {
  messages: Message[]
  teacherId: string | null
  currentUserId: string
  newMsg: string
  onNewMsgChange: (v: string) => void
  sendingMsg: boolean
  onSend: () => void
}

export default function MessagesTab({
  messages,
  teacherId,
  currentUserId,
  newMsg,
  onNewMsgChange,
  sendingMsg,
  onSend,
}: MessagesTabProps) {
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <SectionCard title="رسائل المعلم" sub="تابع الرسائل وأرسل استفساراتك" icon="💬" accent={T.blue}>
        {!teacherId && messages.length === 0 ? (
          <Empty icon="💬" title="لا توجد محادثة حالية" sub="عند بدء المراسلة مع المعلم ستظهر الرسائل هنا." />
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ maxHeight: 420, overflowY: 'auto', display: 'grid', gap: 10, padding: 4 }}>
              {messages.length === 0 ? (
                <div style={{ padding: 18, borderRadius: 16, background: T.cardSoft, color: T.subCol, fontSize: 14 }}>
                  لا توجد رسائل بعد. ابدأ بإرسال رسالة إلى معلمك.
                </div>
              ) : (
                messages.map(msg => {
                  const mine = msg.from_id === currentUserId
                  return (
                    <div
                      key={msg.id}
                      style={{
                        justifySelf: mine ? 'start' : 'end',
                        maxWidth: '85%',
                        background: mine ? `${T.blue}0F` : T.cardBg,
                        border: `1px solid ${mine ? `${T.blue}22` : T.borderCol}`,
                        borderRadius: 18,
                        padding: '12px 14px',
                        boxShadow: mine ? 'none' : T.shadowCard,
                      }}
                    >
                      <div style={{ fontSize: 14, color: T.textCol, lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                      <div style={{ fontSize: 11, color: T.mutedCol, marginTop: 8 }}>{fmtDateTime(msg.created_at)}</div>
                    </div>
                  )
                })
              )}
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <textarea
                value={newMsg}
                onChange={e => onNewMsgChange(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '13px 14px',
                  borderRadius: 14,
                  border: `1.5px solid ${T.inputBorder}`,
                  background: T.inputBg,
                  color: T.textCol,
                  fontSize: 14,
                  fontFamily: T.fontBody,
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: 110,
                }}
              />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={onSend}
                  disabled={!teacherId || !newMsg.trim() || sendingMsg}
                  style={{
                    padding: '12px 18px',
                    borderRadius: 14,
                    border: 'none',
                    background: !teacherId || !newMsg.trim() ? '#E8E2DB' : T.gradMain,
                    color: !teacherId || !newMsg.trim() ? T.subCol : '#fff',
                    fontWeight: 900,
                    cursor: !teacherId || !newMsg.trim() ? 'not-allowed' : 'pointer',
                    fontFamily: T.fontBody,
                  }}
                >
                  {sendingMsg ? 'جارٍ الإرسال...' : 'إرسال الرسالة'}
                </button>
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  )
}