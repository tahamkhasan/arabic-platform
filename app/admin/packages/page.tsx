'use client'
import PackagesPageView from '@/components/packages/PackagesPageView'
import { useAdminGuard } from '@/hooks/useAdminGuard'
import { usePackagesPage } from '@/hooks/usePackagesPage'
import { BRAND } from '@/lib/constants/theme'

export default function AdminPackagesPage() {
  const { ready, accessToken, guardError, router } = useAdminGuard()

  const {
    packages,
    filteredPackages,
    loading,
    saving,
    deleting,
    msg,
    search,
    modalOpen,
    editingPackage,
    form,
    setSearch,
    loadPackages,
    openCreateModal,
    openEditModal,
    closeModal,
    updateForm,
    submitPackage,
    deletePackage,
  } = usePackagesPage({ accessToken: accessToken ?? '' })

  if (guardError) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: BRAND.bg,
          color: BRAND.text,
          fontFamily: BRAND.fontBody,
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
          background: BRAND.bg,
          color: BRAND.text,
          fontFamily: BRAND.fontBody,
          padding: 24,
        }}
      >
        جارٍ التحقق من صلاحيات الأدمن...
      </div>
    )
  }

  return (
    <PackagesPageView
      packages={packages}
      filteredPackages={filteredPackages}
      loading={loading}
      saving={saving}
      deleting={deleting}
      msg={msg}
      search={search}
      modalOpen={modalOpen}
      editingPackage={editingPackage}
      form={form}
      onBack={() => router.push('/admin')}
      onRefresh={() => loadPackages()}
      onCreate={openCreateModal}
      onEdit={openEditModal}
      onDelete={deletePackage}
      onCloseModal={closeModal}
      onSubmit={submitPackage}
      onSearchChange={setSearch}
      onFormChange={updateForm}
    />
  )
}
