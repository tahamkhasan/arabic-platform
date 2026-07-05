'use client'
import type { LessonFormState, LessonItem } from '@/types/lessons'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'
import LessonCard from './LessonCard'
import LessonFormModal from './LessonFormModal'

type Props = {
  unitName: string
  isArabic: boolean
  lessons: LessonItem[]
  filteredLessons: LessonItem[]
  loading: boolean
  saving: boolean
  deleting: boolean
  msg: string
  search: string
  modalOpen: boolean
  editingLesson: LessonItem | null
  form: LessonFormState
  onBack: () => void
  onRefresh: () => void
  onCreate: () => void
  onEdit: (lesson: LessonItem) => void
  onDelete: (lesson: LessonItem) => void
  onToggleActive: (lesson: LessonItem) => void
  onCloseModal: () => void
  onSubmit: () => void
  onSearchChange: (value: string) => void
  onFormChange: <K extends keyof LessonFormState>(key: K, value: LessonFormState[K]) => void
}

export default function LessonsPageView(props: Props) {
  const {
    unitName,
    isArabic,
    lessons,
    filteredLessons,
    loading,
    saving,
    deleting,
    msg,
    search,
    modalOpen,
    editingLesson,
    form,
    onBack,
    onRefresh,
    onCreate,
    onEdit,
    onDelete,
    onToggleActive,
    onCloseModal,
    onSubmit,
    onSearchChange,
    onFormChange,
  } = props

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: BRAND.bg,
        color: BRAND.text,
        fontFamily: BRAND.fontBody,
        padding: '24px 16px 60px',
      }}
    >
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 13, color: BRAND.sub, marginBottom: 4 }}>دروس وحدة</div>
            <div style={{ fontSize: 24, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: BRAND.crimson }}>
              📝 {unitName}
            </div>
            <div style={{ fontSize: 13, color: BRAND.sub, marginTop: 4 }}>{lessons.length} درس</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="ghost" size="sm" onClick={onBack}>← رجوع للوحدات</Button>
            <Button variant="ghost" size="sm" onClick={onRefresh}>↻ تحديث</Button>
            <Button variant="primary" size="sm" onClick={onCreate}>＋ درس جديد</Button>
          </div>
        </div>

        {msg ? (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: BRAND.radiusSm,
              marginBottom: 16,
              fontSize: 14,
              fontWeight: BRAND.weightBold,
              background: msg.startsWith('تم') ? 'rgba(220,140,60,0.10)' : 'rgba(140,20,40,0.08)',
              color: msg.startsWith('تم') ? BRAND.gold : BRAND.crimson,
              border: `1px solid ${msg.startsWith('تم') ? 'rgba(220,140,60,0.3)' : 'rgba(140,20,40,0.25)'}`,
            }}
          >
            {msg}
          </div>
        ) : null}

        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="🔍 ابحث باسم الدرس..."
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: BRAND.radiusMd,
            border: `1.5px solid ${BRAND.border}`,
            background: 'rgba(140,20,40,0.04)',
            color: BRAND.text,
            fontSize: 14,
            fontFamily: 'inherit',
            marginBottom: 20,
          }}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: BRAND.sub }}>جارٍ تحميل الدروس...</div>
        ) : filteredLessons.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 60,
              background: BRAND.bgSoft,
              borderRadius: BRAND.radiusLg,
              border: `1px solid ${BRAND.border}`,
              color: BRAND.sub,
            }}
          >
            لا توجد دروس. اضغط "＋ درس جديد" لإضافة أول درس.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {filteredLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                isArabic={isArabic}
                deleting={deleting}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleActive={onToggleActive}
              />
            ))}
          </div>
        )}

        <LessonFormModal
          open={modalOpen}
          isArabic={isArabic}
          form={form}
          editingLesson={editingLesson}
          saving={saving}
          deleting={deleting}
          onClose={onCloseModal}
          onSubmit={onSubmit}
          onChange={onFormChange}
        />
      </div>
    </div>
  )
}
