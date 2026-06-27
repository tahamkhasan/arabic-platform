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
  onBack: () => void
  onRefresh: () => void
  onCreate: () => void
  onEdit: (unit: UnitItem) => void
  onDelete: (unit: UnitItem) => void
  onOpenLessons: (unit: UnitItem) => void
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
    onBack,
    onRefresh,
    onCreate,
    onEdit,
    onDelete,
    onOpenLessons,
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
            <div style={{ fontSize: 13, color: BRAND.sub, marginBottom: 4 }}>وحدات مادة</div>
            <div style={{ fontSize: 24, fontWeight: BRAND.weightBlack, fontFamily: BRAND.fontHeading, color: BRAND.crimson }}>
              📖 {subjectName}
            </div>
            <div style={{ fontSize: 13, color: BRAND.sub, marginTop: 4 }}>{units.length} وحدة</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="ghost" size="sm" onClick={onBack}>← رجوع للمواد</Button>
            <Button variant="ghost" size="sm" onClick={onRefresh}>↻ تحديث</Button>
            <Button variant="primary" size="sm" onClick={onCreate}>＋ وحدة جديدة</Button>
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
            لا توجد وحدات. اضغط "＋ وحدة جديدة" لإضافة أول وحدة.
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
