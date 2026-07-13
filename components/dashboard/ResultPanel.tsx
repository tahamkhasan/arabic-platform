'use client'
import type { CSSProperties } from 'react'
import { BRAND } from '@/lib/constants/theme'
import FeedbackButtons from '@/components/FeedbackButtons'
import PrintButton from '@/components/PrintButton'
import SpeechButton from '@/components/SpeechButton'
import WordExportButton from '@/components/WordExportButton'
import PptxButton from '@/components/PptxButton'
import VisualCard from '@/components/VisualCard'
import MarkdownRendererRaw from '@/components/MarkdownRenderer'
import { smallBtn, type ThemePalette } from './dashboardTheme'
import type { User, Subject, Lesson, Exam, ToolItem } from '@/types/dashboard.types'

const MarkdownRenderer = MarkdownRendererRaw as any

export default function ResultPanel({
  T,
  themeColor,
  isEditing,
  isModified,
  editSaved,
  copied,
  displayText,
  editedText,
  savingEdit,
  textareaRef,
  toolData,
  selLesson,
  selExam,
  selSubject,
  user,
  genId,
  onStartEditing,
  onCopy,
  onRestoreOriginal,
  onCancelEditing,
  onSaveEdit,
  onEditedTextChange,
}: {
  T: ThemePalette
  themeColor: string
  isEditing: boolean
  isModified: boolean
  editSaved: boolean
  copied: boolean
  displayText: string
  editedText: string
  savingEdit: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  toolData?: ToolItem
  selLesson: Lesson | null
  selExam: Exam | null
  selSubject: Subject | null
  user: User
  genId: string
  onStartEditing: () => void
  onCopy: () => void
  onRestoreOriginal: () => void
  onCancelEditing: () => void
  onSaveEdit: () => void
  onEditedTextChange: (value: string) => void
}) {
  return (
    <div
      className="result-fade"
      style={{
        borderRadius: 20,
        padding: 24,
        background: T.cardBg,
        border: `1px solid ${isEditing ? `${themeColor}66` : T.borderCol}`,
        marginBottom: 28,
        boxShadow: T.shadowCard,
        transition: 'border-color 0.3s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: themeColor,
              background: `${themeColor}14`,
              display: 'inline-block',
              padding: '3px 12px',
              borderRadius: 8,
              margin: 0,
              fontFamily: BRAND.fontHeading,
            }}
          >
            {toolData?.icon} {toolData?.label}
            {selLesson && ` — ${selLesson.name}`}
            {selExam && ` — ${selExam.name}`}
          </h3>

          {isModified && !isEditing && (
            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, background: `${themeColor}18`, color: themeColor, fontWeight: 800 }}>
              ✏️ معدّل
            </span>
          )}

          {editSaved && (
            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, background: 'rgba(180,40,40,0.16)', color: T.crimson, fontWeight: 800 }}>
              ✅ تم الحفظ
            </span>
          )}
        </div>

        {!isEditing && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={onStartEditing} style={smallBtn(`${themeColor}15`, themeColor, `1px solid ${themeColor}44`)}>
              ✏️ تعديل
            </button>

            <button
              type="button"
              onClick={onCopy}
              style={smallBtn(copied ? 'rgba(180,40,40,0.15)' : 'transparent', copied ? T.crimson : T.subCol, `1px solid ${copied ? T.crimson : T.borderCol}`)}
            >
              {copied ? '✅ تم النسخ' : '📋 نسخ'}
            </button>

            <PrintButton
              content={displayText}
              title={selExam?.name ?? `${toolData?.label ?? ''}${selLesson ? ` — ${selLesson.name}` : ''}`}
              grade={selSubject?.grade}
              subject={selSubject?.name}
              themeColor={themeColor}
            />

            <WordExportButton
              content={displayText}
              title={selExam?.name ?? `${toolData?.label ?? ''}${selLesson ? ` — ${selLesson.name}` : ''}`}
              grade={selSubject?.grade}
              subject={selSubject?.name}
              themeColor={themeColor}
            />

            <PptxButton
              content={displayText}
              title={selExam?.name ?? `${toolData?.label ?? ''}${selLesson ? ` — ${selLesson.name}` : ''}`}
              grade={selSubject?.grade}
              subject={selSubject?.name}
              themeColor={themeColor}
            />
          </div>
        )}
      </div>

      {isEditing ? (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, padding: '10px 14px', borderRadius: 12, background: T.inputBg, border: `1px solid ${T.borderCol}`, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: T.subCol, fontWeight: 800 }}>✏️ وضع التحرير</span>
            <div style={{ flex: 1 }} />
            <button type="button" onClick={onRestoreOriginal} style={smallBtn('transparent', T.subCol, `1px solid ${T.borderCol}`)}>
              🔄 استعادة الأصل
            </button>
            <button type="button" onClick={onCancelEditing} style={smallBtn('rgba(200,90,84,0.08)', T.danger, '1px solid rgba(200,90,84,0.3)')}>
              ❌ إلغاء
            </button>
            <button
              type="button"
              onClick={onSaveEdit}
              disabled={savingEdit}
              style={{
                padding: '6px 16px',
                borderRadius: 10,
                border: 'none',
                background: savingEdit ? `${themeColor}55` : themeColor,
                color: '#fff',
                cursor: savingEdit ? 'not-allowed' : 'pointer',
                fontSize: 12,
                fontWeight: 900,
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {savingEdit ? (
                <>
                  <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  جارٍ الحفظ...
                </>
              ) : (
                '💾 حفظ التعديل'
              )}
            </button>
          </div>

          <textarea
            ref={textareaRef}
            value={editedText}
            onChange={e => onEditedTextChange(e.target.value)}
            rows={20}
            style={{
              width: '100%',
              borderRadius: 14,
              padding: '16px',
              background: T.inputBg,
              border: `1px solid ${themeColor}66`,
              color: T.textCol,
              fontSize: 15,
              fontFamily: BRAND.fontBody,
              resize: 'vertical',
              lineHeight: 1.9,
            }}
          />

          <div style={{ textAlign: 'left', marginTop: 6, fontSize: 11, color: T.subCol }}>{editedText.length} حرف</div>
        </div>
      ) : (
        <div style={{ marginBottom: 12 }}>
          <MarkdownRenderer text={displayText} textCol={T.textCol} subCol={T.subCol} fontSize={15} />
        </div>
      )}

      {!isEditing && (
        <>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.borderCol}` }}>
            <SpeechButton text={displayText} themeColor={themeColor} />
          </div>

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.borderCol}` }}>
            <VisualCard
              content={displayText}
              title={selExam?.name ?? `${toolData?.label ?? ''}${selLesson ? ` — ${selLesson.name}` : ''}`}
              grade={selSubject?.grade}
              subject={selSubject?.name}
              themeColor={themeColor}
            />
          </div>

          {genId && user && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.borderCol}` }}>
              <FeedbackButtons generationId={genId} userId={user.id} themeColor={themeColor} />
            </div>
          )}
        </>
      )}
    </div>
  )
}