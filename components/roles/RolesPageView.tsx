'use client'

import { pageWrap, cardStyle } from '@/lib/roles-page-styles'
import type { RoleFormState, RoleItem } from '@/types/roles'
import { BRAND } from '@/lib/constants/theme'
import RoleCard from './RoleCard'
import RoleFormModal from './RoleFormModal'
import RolesStatsBar from './RolesStatsBar'
import RolesToolbar from './RolesToolbar'

type Props = {
  roles: RoleItem[]
  filteredRoles: RoleItem[]
  loading: boolean
  saving: boolean
  deleting: boolean
  msg: string
  search: string
  modalOpen: boolean
  editingRole: RoleItem | null
  form: RoleFormState
  onBack: () => void
  onRefresh: () => void
  onCreate: () => void
  onEdit: (role: RoleItem) => void
  onDelete: (role: RoleItem) => void
  onCloseModal: () => void
  onSubmit: () => void
  onSearchChange: (value: string) => void
  onFormChange: <K extends keyof RoleFormState>(key: K, value: RoleFormState[K]) => void
}

export default function RolesPageView(props: Props) {
  const {
    roles,
    filteredRoles,
    loading,
    saving,
    deleting,
    msg,
    search,
    modalOpen,
    editingRole,
    form,
    onBack,
    onRefresh,
    onCreate,
    onEdit,
    onDelete,
    onCloseModal,
    onSubmit,
    onSearchChange,
    onFormChange,
  } = props

  return (
    <div dir="rtl" style={pageWrap}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <RolesToolbar onBack={onBack} onRefresh={onRefresh} onCreate={onCreate} />

        {msg ? (
          <div
            style={{
              ...cardStyle,
              marginBottom: 16,
              padding: '12px 16px',
              color: BRAND.crimson,
              fontWeight: BRAND.weightBold,
              background: 'rgba(140,20,40,0.07)',
            }}
          >
            {msg}
          </div>
        ) : null}

        <RolesStatsBar
          search={search}
          onSearchChange={onSearchChange}
          total={roles.length}
          filtered={filteredRoles.length}
        />

        {loading ? (
          <div style={{ ...cardStyle, padding: 22 }}>جارٍ تحميل الأدوار...</div>
        ) : filteredRoles.length === 0 ? (
          <div style={{ ...cardStyle, padding: 24, color: BRAND.sub }}>
            لا توجد أدوار مطابقة حاليًا.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
            }}
          >
            {filteredRoles.map((role) => (
              <RoleCard
                key={String(role.id)}
                role={role}
                deleting={deleting}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}

        <RoleFormModal
          open={modalOpen}
          form={form}
          editingRole={editingRole}
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
