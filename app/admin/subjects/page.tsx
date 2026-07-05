'use client'
import SubjectsPageView from '@/components/subjects/SubjectsPageView'
import { useAdminGuard } from '@/hooks/useAdminGuard'
import { useSubjectsPage } from '@/hooks/useSubjectsPage'
import { BRAND } from '@/lib/constants/theme'

export default function AdminSubjectsPage() {
  const { ready, accessToken, guardError, router } = useAdminGuard()

  const {
    subjects,
    filteredSubjects,
    loading,
    saving,
    deleting,
    msg,
    search,
    modalOpen,
    editingSubject,
    form,
    setSearch,
    loadSubjects,
    openCreateModal,
    openEditModal,
    closeModal,
    updateForm,
    submitSubject,
    deleteSubject,
  } = useSubjectsPage({ accessToken })

  if (guardError) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: BRAND.bg, color: BRAND.text, fontFamily: BRAND.fontBody, padding: 24 }}>
        {guardError}
      </div>
    )
  }

  if (!ready) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: BRAND.bg, color: BRAND.text, fontFamily: BRAND.fontBody, padding: 24 }}>
        جارٍ التحقق من صلاحيات الأدمن...
      </div>
    )
  }

  return (
    <SubjectsPageView
      subjects={subjects}
      filteredSubjects={filteredSubjects}
      loading={loading}
      saving={saving}
      deleting={deleting}
      msg={msg}
      search={search}
      modalOpen={modalOpen}
      editingSubject={editingSubject}
      form={form}
      accessToken={accessToken ?? ''}
      onBack={() => router.push('/admin')}
      onRefresh={() => loadSubjects()}
      onCreate={openCreateModal}
      onEdit={openEditModal}
      onDelete={deleteSubject}
      onCloseModal={closeModal}
      onSubmit={submitSubject}
      onSearchChange={setSearch}
      onFormChange={updateForm}
    />
  )
}
