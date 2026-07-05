'use client'
import { Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import LessonsPageView from '@/components/lessons/LessonsPageView'
import { useAdminGuard } from '@/hooks/useAdminGuard'
import { useLessonsPage } from '@/hooks/useLessonsPage'

// ══════════════════════════════════════════════════════════════
// useSearchParams() يتطلب حد Suspense صريح في Next.js — نفس
// الإصلاح المُطبَّق على reset-password و admin/subjects/[id]/units
// ══════════════════════════════════════════════════════════════
function AdminUnitLessonsContent() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()

  const unitId = params.id
  const unitName = searchParams.get('unitName') || 'الوحدة'
  const subjectName = searchParams.get('subjectName') || ''
  const isArabic = subjectName.includes('اللغة العربية')

  const { ready, accessToken, guardError } = useAdminGuard()

  const {
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
    setSearch,
    loadLessons,
    openCreateModal,
    openEditModal,
    closeModal,
    updateForm,
    submitLesson,
    deleteLesson,
    toggleLessonActive,
  } = useLessonsPage({ unitId, accessToken })

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
    <LessonsPageView
      unitName={unitName}
      isArabic={isArabic}
      lessons={lessons}
      filteredLessons={filteredLessons}
      loading={loading}
      saving={saving}
      deleting={deleting}
      msg={msg}
      search={search}
      modalOpen={modalOpen}
      editingLesson={editingLesson}
      form={form}
      onBack={() => router.back()}
      onRefresh={() => loadLessons()}
      onCreate={openCreateModal}
      onEdit={openEditModal}
      onDelete={deleteLesson}
      onToggleActive={toggleLessonActive}
      onCloseModal={closeModal}
      onSubmit={submitLesson}
      onSearchChange={setSearch}
      onFormChange={updateForm}
    />
  )
}

function LessonsFallback() {
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

export default function AdminUnitLessonsPage() {
  return (
    <Suspense fallback={<LessonsFallback />}>
      <AdminUnitLessonsContent />
    </Suspense>
  )
}
