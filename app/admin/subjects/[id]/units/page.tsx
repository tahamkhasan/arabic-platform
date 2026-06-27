'use client'
import { Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import UnitsPageView from '@/components/units/UnitsPageView'
import { useAdminGuard } from '@/hooks/useAdminGuard'
import { useUnitsPage } from '@/hooks/useUnitsPage'
import type { UnitItem } from '@/types/units'

// ══════════════════════════════════════════════════════════════
// useSearchParams() يتطلب حد Suspense صريح في Next.js — نفس
// الإصلاح الذي طبّقناه على app/reset-password/page.tsx سابقاً
// ══════════════════════════════════════════════════════════════
function AdminSubjectUnitsContent() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()

  const subjectId = params.id
  const subjectName = searchParams.get('subjectName') || 'المادة'

  const { ready, accessToken, guardError } = useAdminGuard()

  const {
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
    setSearch,
    loadUnits,
    openCreateModal,
    openEditModal,
    closeModal,
    updateForm,
    submitUnit,
    deleteUnit,
  } = useUnitsPage({ subjectId, accessToken })

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
    <UnitsPageView
      subjectName={subjectName}
      units={units}
      filteredUnits={filteredUnits}
      loading={loading}
      saving={saving}
      deleting={deleting}
      msg={msg}
      search={search}
      modalOpen={modalOpen}
      editingUnit={editingUnit}
      form={form}
      onBack={() => router.push('/admin/subjects')}
      onRefresh={() => loadUnits()}
      onCreate={openCreateModal}
      onEdit={openEditModal}
      onDelete={deleteUnit}
      onOpenLessons={(unit: UnitItem) =>
        router.push(`/admin/units/${unit.id}/lessons?unitName=${encodeURIComponent(unit.name)}`)
      }
      onCloseModal={closeModal}
      onSubmit={submitUnit}
      onSearchChange={setSearch}
      onFormChange={updateForm}
    />
  )
}

function UnitsFallback() {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#F5F0E8',
        color: '#6B5050',
        fontFamily: 'Calibri, Segoe UI, Tahoma, Arial, sans-serif',
      }}
    >
      ⏳ جارٍ التحميل...
    </div>
  )
}

export default function AdminSubjectUnitsPage() {
  return (
    <Suspense fallback={<UnitsFallback />}>
      <AdminSubjectUnitsContent />
    </Suspense>
  )
}
