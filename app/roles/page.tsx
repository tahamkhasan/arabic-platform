'use client'

import RolesPageView from '../../components/roles/RolesPageView'
import { useAdminGuard } from '../../hooks/useAdminGuard'
import { useRolesPage } from '../../hooks/useRolesPage'

export default function RolesPage() {
  const { ready, accessToken, guardError, router } = useAdminGuard()

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
    setSearch,
    loadRoles,
    openCreateModal,
    openEditModal,
    closeModal,
    updateForm,
    submitRole,
    deleteRole,
  } = useRolesPage({ accessToken })

  if (guardError) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#F5F0E8',
          color: '#1A1221',
          fontFamily: 'Calibri, Segoe UI, Tahoma, Arial, sans-serif',
          padding: 24,
        }}
      >
        {guardError}
      </div>
    )
  }

  if (!ready) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#F5F0E8',
          color: '#1A1221',
          fontFamily: 'Calibri, Segoe UI, Tahoma, Arial, sans-serif',
          padding: 24,
        }}
      >
        جارٍ التحقق من صلاحيات الأدمن...
      </div>
    )
  }

  return (
    <RolesPageView
      roles={roles}
      filteredRoles={filteredRoles}
      loading={loading}
      saving={saving}
      deleting={deleting}
      msg={msg}
      search={search}
      modalOpen={modalOpen}
      editingRole={editingRole}
      form={form}
      onBack={() => router.push('/admin')}
      onRefresh={() => loadRoles()}
      onCreate={openCreateModal}
      onEdit={openEditModal}
      onDelete={deleteRole}
      onCloseModal={closeModal}
      onSubmit={submitRole}
      onSearchChange={setSearch}
      onFormChange={updateForm}
    />
  )
}