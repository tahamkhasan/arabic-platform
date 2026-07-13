'use client'
import { useEffect } from 'react'
import { BRAND } from '@/lib/constants/theme'
import { ar } from '@/lib/constants/ar'
import { StepSection, Chip, Empty, type ThemePalette } from './dashboardTheme'
import ResultPanel from './ResultPanel'
import { LESSON_BRANCHES, isArabicSubject, getAvailableBranches, type BranchKey } from '@/lib/dashboard/lessonBranches'
import type { Subject, Unit, Lesson, Exam, ToolItem, User } from '@/types/dashboard.types'

const t = ar.dashboard

interface BranchMaterialState {
  material: string
  loading: boolean
  error: string
  skippedFiles: string[]
}

interface GeneratorPanelProps {
  T: ThemePalette
  themeColor: string
  toolData?: ToolItem

  subjects: Subject[]
  selSubject: Subject | null
  onSelectSubject: (s: Subject) => void

  units: Unit[]
  selUnit: Unit | null
  onSelectUnit: (u: Unit) => void

  lessons: Lesson[]
  selLesson: Lesson | null
  onSelectLesson: (l: Lesson) => void

  isExamTool: boolean
  examType: 'short' | 'final'
  onExamTypeChange: (t: 'short' | 'final') => void
  exams: Exam[]
  selExam: Exam | null
  onSelectExam: (e: Exam) => void

  details: string
  onDetailsChange: (v: string) => void

  selectedBranch: BranchKey
  onSelectBranch: (b: BranchKey) => void
  branchMaterial: BranchMaterialState

  canGenerate: boolean
  loading: boolean
  onGenerate: () => void

  error: string
  output: string
  genId: string
  isEditing: boolean
  isModified: boolean
  editSaved: boolean
  copied: boolean
  displayText: string
  editedText: string
  savingEdit: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  user: User
  onStartEditing: () => void
  onCopy: () => void
  onRestoreOriginal: () => void
  onCancelEditing: () => void
  onSaveEdit: () => void
  onEditedTextChange: (value: string) => void
}

export default function GeneratorPanel(props: GeneratorPanelProps) {
  const {
    T, themeColor, toolData,
    subjects, selSubject, onSelectSubject,
    units, selUnit, onSelectUnit,
    lessons, selLesson, onSelectLesson,
    isExamTool, examType, onExamTypeChange, exams, selExam, onSelectExam,
    details, onDetailsChange,
    selectedBranch, onSelectBranch, branchMaterial,
    canGenerate, loading, onGenerate,
    error, output,
  } = props

  const showBranchSelector =
    !isExamTool && isArabicSubject(selSubject?.name) && !!selLesson && getAvailableBranches(selLesson).length > 1
// ── مزامنة احتياطية: إن كان الفرع المختار حالياً غير متاح فعلياً
  // لهذا الدرس (مثل "عام" في درسٍ بلا محتوى عام)، اختر أول فرع متاح
  // تلقائياً — يضمن تطابقاً دائماً بين ما يظهر مُحدَّداً بصرياً وما
  // يُستخدَم فعلياً عند الضغط على "توليد". ──────────────────────
  useEffect(() => {
    if (!showBranchSelector || !selLesson) return
    const available = getAvailableBranches(selLesson)
    const stillValid = available.some(b => b.key === selectedBranch)
    if (!stillValid && available.length > 0) {
      onSelectBranch(available[0].key)
    }
  }, [showBranchSelector, selLesson, selectedBranch, onSelectBranch])
  
  return (
    <>
      <StepSection step="①" title="اختر المادة" themeColor={themeColor} T={T}>
        {subjects.length === 0 ? (
          <Empty text={t.noSubjects} subCol={T.subCol} />
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {subjects.map(subject => (
              <Chip
                key={subject.id}
                label={`${subject.icon ?? '📚'} ${subject.name}${subject.grade ? ` — الصف ${subject.grade}` : ''}`}
                active={selSubject?.id === subject.id}
                color={themeColor}
                subCol={T.subCol}
                borderCol={T.borderCol}
                onClick={() => onSelectSubject(subject)}
              />
            ))}
          </div>
        )}
      </StepSection>

      {selSubject && !isExamTool && (
        <StepSection step="②" title="اختر الوحدة" themeColor={themeColor} T={T}>
          {units.length === 0 ? (
            <Empty text="لا توجد وحدات لهذه المادة" subCol={T.subCol} />
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {units.map(unit => (
                <Chip
                  key={unit.id}
                  label={`${unit.icon ?? '📖'} ${unit.name}`}
                  active={selUnit?.id === unit.id}
                  color={themeColor}
                  subCol={T.subCol}
                  borderCol={T.borderCol}
                  onClick={() => onSelectUnit(unit)}
                />
              ))}
            </div>
          )}
        </StepSection>
      )}

      {selUnit && !isExamTool && (
        <StepSection step="③" title="اختر الدرس" themeColor={themeColor} T={T}>
          {lessons.length === 0 ? (
            <Empty text="لا توجد دروس لهذه الوحدة" subCol={T.subCol} />
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {lessons.map(lesson => (
                <Chip
                  key={lesson.id}
                  label={`✏️ ${lesson.name}${lesson.file_urls?.length ? ' 📎' : ''}`}
                  active={selLesson?.id === lesson.id}
                  color={themeColor}
                  subCol={T.subCol}
                  borderCol={T.borderCol}
                  onClick={() => onSelectLesson(lesson)}
                />
              ))}
            </div>
          )}
        </StepSection>
      )}

      {showBranchSelector && (
        <StepSection step="④" title="اختر الفرع" themeColor={themeColor} T={T}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: branchMaterial.error ? 12 : 0 }}>
            {getAvailableBranches(selLesson!).map(branch => (
              <Chip
                key={branch.key}
                label={`${branch.icon} ${branch.label}`}
                active={selectedBranch === branch.key}
                color={themeColor}
                subCol={T.subCol}
                borderCol={T.borderCol}
                onClick={() => onSelectBranch(branch.key)}
              />
            ))}
          </div>

          {branchMaterial.loading && (
            <div style={{ fontSize: 13, color: T.subCol, marginTop: 10 }}>⏳ جارٍ استخراج نص الفرع...</div>
          )}

          {branchMaterial.error && (
            <div
              style={{
                marginTop: 10,
                padding: '10px 14px',
                borderRadius: 12,
                background: `${BRAND.crimson}10`,
                border: `1px solid ${BRAND.crimson}22`,
                color: BRAND.crimson,
                fontSize: 13,
              }}
            >
              ⚠️ {branchMaterial.error}
            </div>
          )}

          {branchMaterial.skippedFiles.length > 0 && (
            <div style={{ fontSize: 12, color: T.subCol, marginTop: 8 }}>
              تعذّر استخراج: {branchMaterial.skippedFiles.join('، ')} (ملفات غير مدعومة حالياً — Word فقط)
            </div>
          )}
        </StepSection>
      )}

      {isExamTool && selSubject && (
        <StepSection step="②" title="بيانات الاختبار" themeColor={themeColor} T={T}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.subCol, marginBottom: 12 }}>نوع الاختبار:</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {(['short', 'final'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => onExamTypeChange(type)}
                style={{
                  padding: '9px 20px',
                  borderRadius: 12,
                  border: `1px solid ${examType === type ? themeColor : T.borderCol}`,
                  background: examType === type ? `${themeColor}14` : 'transparent',
                  color: examType === type ? themeColor : T.subCol,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 800,
                  fontFamily: 'inherit',
                }}
              >
                {type === 'short' ? t.exams.short : t.exams.final}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 14, fontWeight: 800, color: T.subCol, marginBottom: 10 }}>{t.exams.title}</div>

          {exams.length === 0 ? (
            <Empty text={t.exams.noneOfType} subCol={T.subCol} />
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {exams.map(exam => (
                <Chip
                  key={exam.id}
                  label={exam.name}
                  active={selExam?.id === exam.id}
                  color={themeColor}
                  subCol={T.subCol}
                  borderCol={T.borderCol}
                  onClick={() => onSelectExam(exam)}
                />
              ))}
            </div>
          )}
        </StepSection>
      )}

      {canGenerate && (
        <StepSection step={isExamTool ? '③' : '⑤'} title="تفاصيل إضافية" themeColor={themeColor} T={T}>
          <textarea
            value={details}
            onChange={e => onDetailsChange(e.target.value)}
            placeholder={t.placeholders.default}
            rows={4}
            style={{
              width: '100%',
              borderRadius: 14,
              padding: '14px 16px',
              background: T.inputBg,
              border: `1px solid ${T.inputBorder}`,
              color: T.textCol,
              fontSize: 15,
              fontFamily: 'inherit',
              resize: 'vertical',
              lineHeight: 1.8,
            }}
          />
        </StepSection>
      )}

      {canGenerate && (
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <button
            type="button"
            onClick={onGenerate}
            disabled={loading || branchMaterial.loading}
            style={{
              padding: '16px 44px',
              borderRadius: 16,
              border: 'none',
              background: (loading || branchMaterial.loading) ? T.borderCol : T.gradMain,
              color: (loading || branchMaterial.loading) ? T.subCol : '#fff',
              fontSize: 18,
              fontWeight: 900,
              cursor: (loading || branchMaterial.loading) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.3s',
              minWidth: 240,
              boxShadow: loading ? 'none' : `0 8px 24px ${themeColor}33`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              margin: '0 auto',
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    flexShrink: 0,
                    border: `3px solid ${themeColor}33`,
                    borderTopColor: themeColor,
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <span>جارٍ التوليد...</span>
              </>
            ) : (
              `✨ توليد ${toolData?.label ?? ''}`
            )}
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            marginBottom: 20,
            padding: '14px 18px',
            borderRadius: 14,
            background: T.bg === '#1A1612' ? 'rgba(224,114,114,0.12)' : '#FFF4F1',
            border: '1px solid rgba(200,90,84,0.28)',
            color: T.danger,
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {output && (
        <ResultPanel
          T={props.T}
          themeColor={props.themeColor}
          isEditing={props.isEditing}
          isModified={props.isModified}
          editSaved={props.editSaved}
          copied={props.copied}
          displayText={props.displayText}
          editedText={props.editedText}
          savingEdit={props.savingEdit}
          textareaRef={props.textareaRef}
          toolData={props.toolData}
          selLesson={selLesson}
          selExam={selExam}
          selSubject={selSubject}
          user={props.user}
          genId={props.genId}
          onStartEditing={props.onStartEditing}
          onCopy={props.onCopy}
          onRestoreOriginal={props.onRestoreOriginal}
          onCancelEditing={props.onCancelEditing}
          onSaveEdit={props.onSaveEdit}
          onEditedTextChange={props.onEditedTextChange}
        />
      )}
    </>
  )
}