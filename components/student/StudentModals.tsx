'use client'
import type { CSSProperties } from 'react'
import { BRAND } from '@/lib/constants/theme'
import QuizPlayer from '@/components/QuizPlayer'
import FlashcardPlayer from '@/components/FlashcardPlayer'
import { T, getEmbedUrl } from './studentTheme'
import type { Assignment, QuizData, FlashcardsData, Media } from '@/types/student.types'

interface StudentModalsProps {
  openAssign: Assignment | null
  onCloseAssign: () => void
  submitDone: boolean
  answerText: string
  onAnswerChange: (v: string) => void
  submitting: boolean
  onSubmitAssignment: () => void

  showQuiz: boolean
  quizData: QuizData | null
  onCloseQuiz: () => void

  showFlash: boolean
  flashData: FlashcardsData | null
  onCloseFlash: () => void

  openMedia: Media | null
  onCloseMedia: () => void

  accentColor: string
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 110,
  background: 'rgba(37,24,18,0.58)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
}

function modalStyle(width = 900): CSSProperties {
  return {
    width: '100%',
    maxWidth: width,
    maxHeight: '90vh',
    borderRadius: 28,
    background: T.cardBg,
    border: `1px solid ${T.borderCol}`,
    boxShadow: '0 24px 60px rgba(37,24,18,0.18)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  }
}

function modalHeaderStyle(accent: string): CSSProperties {
  return {
    padding: '18px 20px',
    borderBottom: `1px solid ${T.borderCol}`,
    background: `${accent}08`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  }
}

const closeBtnStyle: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 14,
  border: `1px solid ${T.borderCol}`,
  background: T.cardBg,
  color: T.textCol,
  fontSize: 18,
  cursor: 'pointer',
  fontFamily: T.fontBody,
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  borderRadius: 14,
  border: `1.5px solid ${T.inputBorder}`,
  background: T.inputBg,
  color: T.textCol,
  fontSize: 14,
  fontFamily: T.fontBody,
  outline: 'none',
}

export default function StudentModals({
  openAssign,
  onCloseAssign,
  submitDone,
  answerText,
  onAnswerChange,
  submitting,
  onSubmitAssignment,
  showQuiz,
  quizData,
  onCloseQuiz,
  showFlash,
  flashData,
  onCloseFlash,
  openMedia,
  onCloseMedia,
  accentColor,
}: StudentModalsProps) {
  return (
    <>
      {openAssign && (
        <div style={overlayStyle} onClick={onCloseAssign}>
          <div style={modalStyle(760)} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle(BRAND.crimson)}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: T.titleCol, fontFamily: T.fontHeading }}>
                  {openAssign.title}
                </div>
                <div style={{ fontSize: 13, color: T.subCol, marginTop: 4 }}>
                  {openAssign.description || openAssign.content || 'أدخل إجابتك ثم أرسلها.'}
                </div>
              </div>
              <button onClick={onCloseAssign} style={closeBtnStyle}>
                ✕
              </button>
            </div>

            <div style={{ padding: 20, overflowY: 'auto' }}>
              {submitDone ? (
                <div
                  style={{
                    padding: 18,
                    borderRadius: 18,
                    background: `${T.green}12`,
                    border: `1px solid ${T.green}22`,
                    color: T.green,
                    fontSize: 15,
                    fontWeight: 900,
                  }}
                >
                  تم إرسال الواجب بنجاح.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 14 }}>
                  <textarea
                    value={answerText}
                    onChange={e => onAnswerChange(e.target.value)}
                    placeholder="اكتب إجابتك هنا..."
                    rows={10}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 220 }}
                  />

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      onClick={onSubmitAssignment}
                      disabled={!answerText.trim() || submitting}
                      style={{
                        padding: '12px 18px',
                        borderRadius: 14,
                        border: 'none',
                        background: !answerText.trim() ? '#E8E2DB' : T.gradMain,
                        color: !answerText.trim() ? T.subCol : '#fff',
                        fontWeight: 900,
                        cursor: !answerText.trim() ? 'not-allowed' : 'pointer',
                        fontFamily: T.fontBody,
                      }}
                    >
                      {submitting ? 'جارٍ الإرسال...' : 'إرسال الإجابة'}
                    </button>

                    <button
                      onClick={onCloseAssign}
                      style={{
                        padding: '12px 18px',
                        borderRadius: 14,
                        border: `1px solid ${T.borderCol}`,
                        background: T.cardBg,
                        color: T.textCol,
                        fontWeight: 800,
                        cursor: 'pointer',
                        fontFamily: T.fontBody,
                      }}
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showQuiz && quizData && (
        <div style={overlayStyle} onClick={onCloseQuiz}>
          <div style={modalStyle(980)} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle(T.blue)}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: T.titleCol, fontFamily: T.fontHeading }}>
                  {quizData.title}
                </div>
                <div style={{ fontSize: 13, color: T.subCol, marginTop: 4 }}>اختبار تفاعلي على الدرس الحالي</div>
              </div>
              <button onClick={onCloseQuiz} style={closeBtnStyle}>
                ✕
              </button>
            </div>

            <div style={{ padding: 20, overflowY: 'auto' }}>
              <QuizPlayer
                quiz={quizData as any}
                themeColor={accentColor}
                textCol={T.textCol}
                subCol={T.subCol}
                cardBg={T.cardBg}
                borderCol={T.borderCol}
                inputBg={T.inputBg}
                isDark={false}
                onClose={onCloseQuiz}
              />
            </div>
          </div>
        </div>
      )}

      {showFlash && flashData && (
        <div style={overlayStyle} onClick={onCloseFlash}>
          <div style={modalStyle(980)} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle(BRAND.orange)}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: T.titleCol, fontFamily: T.fontHeading }}>
                  {flashData.title}
                </div>
                <div style={{ fontSize: 13, color: T.subCol, marginTop: 4 }}>بطاقات مراجعة تفاعلية</div>
              </div>
              <button onClick={onCloseFlash} style={closeBtnStyle}>
                ✕
              </button>
            </div>

            <div style={{ padding: 20, overflowY: 'auto' }}>
              <FlashcardPlayer
                data={flashData as any}
                themeColor={accentColor}
                textCol={T.textCol}
                subCol={T.subCol}
                cardBg={T.cardBg}
                borderCol={T.borderCol}
                isDark={false}
                onClose={onCloseFlash}
              />
            </div>
          </div>
        </div>
      )}

      {openMedia && (
        <div style={overlayStyle} onClick={onCloseMedia}>
          <div style={modalStyle(1100)} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle(BRAND.orange)}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: T.titleCol, fontFamily: T.fontHeading }}>
                  {openMedia.title}
                </div>
                <div style={{ fontSize: 13, color: T.subCol, marginTop: 4 }}>
                  {openMedia.type === 'video' ? 'محتوى مرئي' : 'محتوى صوتي'}
                </div>
              </div>
              <button onClick={onCloseMedia} style={closeBtnStyle}>
                ✕
              </button>
            </div>

            <div style={{ padding: 20, overflowY: 'auto' }}>
              {openMedia.type === 'video' ? (
                <div style={{ borderRadius: 20, overflow: 'hidden', background: '#000' }}>
                  <iframe
                    src={openMedia.embed_url || getEmbedUrl(openMedia.url) || openMedia.url}
                    title={openMedia.title}
                    style={{ width: '100%', height: '62vh', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <audio controls style={{ width: '100%' }}>
                  <source src={openMedia.url} />
                </audio>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}