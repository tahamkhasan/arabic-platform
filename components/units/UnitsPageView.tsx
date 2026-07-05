'use client'
import type { UnitFormState, UnitItem } from '@/types/units'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'
import UnitCard from './UnitCard'
import UnitFormModal from './UnitFormModal'

type Props = {
  subjectName: string
  units: UnitItem[]
  filteredUnits: UnitItem[]
  loading: boolean
  saving: boolean
  deleting: boolean
  msg: string
  search: string
  modalOpen: boolean
  editingUnit: UnitItem | null
  form: UnitFormState
  activeSemesterTab: 1 | 2
  onSemesterTabChange: (semester: 1 | 2) => void
  onBack: () => void
  onRefresh: () => void
  onCreate: () => void
  onEdit: (unit: UnitItem) => void
  onDelete: (unit: UnitItem) => void
  onOpenLessons: (unit: UnitItem) => void
  onToggleActive: (unit: UnitItem) => void
  onCloseModal: () => void
  onSubmit: () => void
  onSearchChange: (value: string) => void
  onFormChange: <K extends keyof UnitFormState>(key: K, value: UnitFormState[K]) => void
}

export default function UnitsPageView(props: Props) {
  const {
    subjectName,
    units,
    filteredUnits,
    loading,
    saving,
    deleting,
    msg,
    search,
    modalOpen,
    editingUnit,
    form,
    activeSemesterTab,
    onSemesterTabChange,
    onBack,
    onRefresh,
    onCreate,
    onEdit,
    onDelete,
    onOpenLessons,
    onToggleActive,
    onCloseModal,
    onSubmit,
    onSearchChange,
    onFormChange,
  } = props

  const semester1Count = units.filter((u) => (u.semester === 2 ? 2 : 1) === 1).length
  const semester2Count = units.filter((u) => (u.semester === 2 ? 2 : 1) === 2).length

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
            <div style={{ fontSize: 13, color: BRAND.sub, marginBottom: 4 }}>الفصول الدراسية لمادة</div>
            <div style={{ fontSize: 24, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: BRAND.crimson }}>
              📖 {subjectName}
            </div>
            <div style={{ fontSize: 13, color: BRAND.sub, marginTop: 4 }}>{units.length} وحدة إجمالاً</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="ghost" size="sm" onClick={onBack}>← رجوع للمواد</Button>
            <Button variant="ghost" size="sm" onClick={onRefresh}>↻ تحديث</Button>
            <Button variant="primary" size="sm" onClick={onCreate}>＋ وحدة جديدة</Button>
          </div>
        </div>

        {/* ── تبويبا الفصل الدراسي — ثابتان دائماً، للتنقل الإداري فقط ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {([[1, 'الفصل الدراسي الأول', semester1Count], [2, 'الفصل الدراسي الثاني', semester2Count]] as const).map(
            ([val, label, count]) => (
              <button
                key={val}
                onClick={() => onSemesterTabChange(val)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: BRAND.radiusMd,
                  border: `2px solid ${activeSemesterTab === val ? BRAND.crimson : BRAND.border}`,
                  background: activeSemesterTab === val ? 'rgba(140,20,40,0.08)' : BRAND.bgSoft,
                  color: activeSemesterTab === val ? BRAND.crimson : BRAND.sub,
                  fontWeight: BRAND.weightBlack,
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {label}
                <span style={{ fontSize: 12, fontWeight: BRAND.weightSemibold, marginRight: 6, opacity: 0.7 }}>
                  ({count})
                </span>
              </button>
            )
          )}
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
          placeholder="🔍 ابحث باسم الوحدة..."
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
          <div style={{ textAlign: 'center', padding: 60, color: BRAND.sub }}>جارٍ تحميل الوحدات...</div>
        ) : filteredUnits.length === 0 ? (
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
            لا توجد وحدات في هذا الفصل. اضغط "＋ وحدة جديدة" لإضافة أول وحدة.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {filteredUnits.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                deleting={deleting}
                onEdit={onEdit}
                onDelete={onDelete}
                onOpenLessons={onOpenLessons}
                onToggleActive={onToggleActive}
              />
            ))}
          </div>
        )}

        <UnitFormModal
          open={modalOpen}
          form={form}
          editingUnit={editingUnit}
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
