'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRouteGuard } from '@/hooks/useRouteGuard'
import { signOutApp } from '@/lib/auth/auth.session'
import { BRAND } from '@/lib/constants/theme'
import type { Tab } from '@/types/admin.types'
import { useAdminUsers } from '@/hooks/useAdminUsers'
import { useAdminSubjects } from '@/hooks/useAdminSubjects'
import { useAdminSignals } from '@/hooks/useAdminSignals'
import { useAdminModals } from '@/hooks/useAdminModals'
import { T } from '@/components/admin/adminTheme'
import AdminSidebar from '@/components/admin/AdminSidebar'
import OverviewTab from '@/components/admin/tabs/OverviewTab'
import StudentsTab from '@/components/admin/tabs/StudentsTab'
import TeachersTab from '@/components/admin/tabs/TeachersTab'
import StagesTab from '@/components/admin/tabs/StagesTab'
import SignalsTab from '@/components/admin/tabs/SignalsTab'
import StatsTab from '@/components/admin/tabs/StatsTab'
import SettingsTab from '@/components/admin/tabs/SettingsTab'
import AdminModals from '@/components/admin/AdminModals'

export default function AdminPage() {
  const router = useRouter()

  const {
    user: admin,
    accessToken: adminAccessToken,
    loading: authChecking,
    authorized,
  } = useRouteGuard('admin')

  const adminName = (admin as any)?.full_name ?? (admin as any)?.name ?? (admin as any)?.email ?? 'المدير'

  const [tab, setTab] = useState<Tab>('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [actionMsg, setActionMsg] = useState('')
  const [logoUrl, setLogoUrl] = useState('/logo-midad.png')

  useEffect(() => {
    fetch('/api/platform-settings')
      .then(r => r.json())
      .then(d => {
        if (d.settings?.logo_url) setLogoUrl(d.settings.logo_url)
      })
      .catch(() => {})
  }, [])

  const usersHook = useAdminUsers({ authorized, admin, adminAccessToken, tab, router, setActionMsg })
  const subjectsHook = useAdminSubjects({ authorized, admin })
  const signalsHook = useAdminSignals({ authorized, admin, adminAccessToken, tab, setActionMsg })
  const modals = useAdminModals({
    adminAccessToken,
    users: usersHook.users,
    setUsers: usersHook.setUsers,
    roles: usersHook.roles,
    router,
    setActionMsg,
    reloadUsers: usersHook.reloadUsers,
  })

  async function handleLogout() {
    await signOutApp()
    router.replace('/login')
  }

  const teacherPendingCount = usersHook.teacherUsers.filter(u => u.status === 'pending').length

  const cardHandlers = {
    onApprove: (u: any) => usersHook.updateUser(u.id, { status: 'approved' }),
    onSuspend: (u: any) => usersHook.updateUser(u.id, { status: 'suspended' }),
    onReactivate: (u: any) => usersHook.updateUser(u.id, { status: 'approved' }),
    onPromoteToTeacher: (u: any) => usersHook.updateUser(u.id, { role: 'teacher', user_type: 'teacher' }),
    onOpenStageModal: modals.openStageModal,
    onOpenSubscriptionsModal: modals.openSubscriptionsModal,
    onOpenAssignSubjects: modals.setAssignSubjectsFor,
    onOpenAssignScope: modals.setAssignScopeFor,
    onOpenRoleModal: modals.openRoleModal,
    onDelete: (u: any) => usersHook.deleteUser(u.id),
  }

  if (authChecking) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, color: T.subCol, fontFamily: BRAND.fontBody }}>
        ⏳ جارٍ التحقق من الجلسة...
      </div>
    )
  }

  if (!authorized || !admin) return null

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: `radial-gradient(circle at 85% 10%, rgba(225,135,60,0.10), transparent 28%), radial-gradient(circle at 10% 80%, rgba(150,30,45,0.08), transparent 26%), ${T.bg}`,
        color: T.textCol,
        fontFamily: BRAND.fontBody,
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: ${T.bg}; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn .32s ease; }
        input:focus, select:focus { outline: none; border-color: rgba(140,20,40,0.40) !important; box-shadow: 0 0 0 3px rgba(140,20,40,0.08); }
        select option { background: ${BRAND.bg} !important; color: ${BRAND.text} !important; }
        select { color-scheme: light; }
        .admin-app-shell { display: flex; min-height: 100vh; }
        .admin-sidebar { display: flex; }
        .admin-mobile-nav { display: none; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(140,20,40,0.20); border-radius: 999px; }
        @media (max-width: 900px) {
          .hero-grid-admin { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 760px) {
          .admin-stats-grid { grid-template-columns: 1fr !important; }
          .admin-stats-grid-2 { grid-template-columns: 1fr !important; }
          .admin-sidebar { display: none !important; }
          .admin-mobile-nav { display: flex !important; }
          .admin-main-area { padding-bottom: 96px !important; }
        }
      `}</style>

      <div className="admin-app-shell">
        <AdminSidebar
          tab={tab}
          onTabChange={setTab}
          pendingCount={usersHook.pendingCount}
          signalsCount={signalsHook.signals.length}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(v => !v)}
          onLogout={handleLogout}
          adminEmail={(admin as any)?.email ?? ''}
          onGoSettings={() => router.push('/admin/settings')}
          onGoSubjects={() => router.push('/admin/subjects')}
          onGoGenerator={() => router.push('/admin/generator')}
          onGoDelegations={() => router.push('/admin/delegations')}
          onAddParent={() => modals.setShowAddParent(true)}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <main className="admin-main-area" style={{ maxWidth: 1180, margin: '0 auto', padding: '22px 16px' }}>
            {actionMsg && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: BRAND.radiusSm,
                  marginBottom: 16,
                  fontSize: 14,
                  fontWeight: BRAND.weightBold,
                  textAlign: 'center',
                  background: 'rgba(140,20,40,0.10)',
                  border: '1px solid rgba(140,20,40,0.3)',
                  color: BRAND.crimson,
                }}
              >
                {actionMsg}
              </div>
            )}

            {tab === 'overview' && (
              <OverviewTab
                studentsCount={usersHook.studentsCount}
                teachersCount={usersHook.teachersCount}
                pendingCount={usersHook.pendingCount}
                subjectsCount={subjectsHook.subjects.length}
              />
            )}

            {tab === 'students' && (
              <StudentsTab
                studentsCount={usersHook.studentsCount}
                pendingCount={usersHook.studentUsers.filter(u => u.status === 'pending').length}
                searchQ={usersHook.searchQ}
                onSearchChange={usersHook.setSearchQ}
                statusFilter={usersHook.statusFilter}
                onStatusFilterChange={usersHook.setStatusFilter}
                loading={usersHook.loading}
                filteredStudents={usersHook.filteredStudents}
                onAddStudent={() => modals.setShowAddStudent(true)}
                {...cardHandlers}
              />
            )}

            {tab === 'teachers' && (
              <TeachersTab
                teachersCount={usersHook.teachersCount}
                teacherPendingCount={teacherPendingCount}
                searchQ={usersHook.searchQ}
                onSearchChange={usersHook.setSearchQ}
                statusFilter={usersHook.statusFilter}
                onStatusFilterChange={usersHook.setStatusFilter}
                loading={usersHook.loading}
                filteredTeachers={usersHook.filteredTeachers}
                onAddTeacher={() => modals.setShowAddTeacher(true)}
                {...cardHandlers}
              />
            )}

            {tab === 'stages' && (
              <StagesTab
                occurrencesByStage={subjectsHook.occurrencesByStage}
                unassignedSubjects={subjectsHook.unassignedSubjects}
                activeStageTab={subjectsHook.activeStageTab}
                setActiveStageTab={subjectsHook.setActiveStageTab}
                activeGrade={subjectsHook.activeGrade}
                setActiveGrade={subjectsHook.setActiveGrade}
                activeTrack={subjectsHook.activeTrack}
                setActiveTrack={subjectsHook.setActiveTrack}
              />
            )}

            {tab === 'signals' && (
              <SignalsTab
                signals={signalsHook.signals}
                signalsLoading={signalsHook.signalsLoading}
                resolvingSignalId={signalsHook.resolvingSignalId}
                onResolve={signalsHook.resolveSignal}
              />
            )}

            {tab === 'stats' && (
              <StatsTab
                usersTotal={usersHook.users.length}
                studentsCount={usersHook.studentsCount}
                teachersCount={usersHook.teachersCount}
                pendingCount={usersHook.pendingCount}
                approvedCount={usersHook.users.filter(u => u.status === 'approved').length}
                subjectsCount={subjectsHook.subjects.length}
              />
            )}

            {tab === 'settings' && <SettingsTab logoUrl={logoUrl} onLogoUpdated={setLogoUrl} />}
          </main>
        </div>
      </div>

      <AdminModals
        roleModalOpen={modals.roleModalOpen}
        selectedUser={modals.selectedUser}
        selectedRoleId={modals.selectedRoleId}
        setSelectedRoleId={modals.setSelectedRoleId}
        roles={usersHook.roles}
        rolesLoading={usersHook.rolesLoading}
        assigningRole={modals.assigningRole}
        closeRoleModal={modals.closeRoleModal}
        assignRoleToUser={modals.assignRoleToUser}
        removeAssignedRole={modals.removeAssignedRole}
        stageModalOpen={modals.stageModalOpen}
        stageModalUser={modals.stageModalUser}
        modalStage={modals.modalStage}
        setModalStage={modals.setModalStage}
        modalGrade={modals.modalGrade}
        setModalGrade={modals.setModalGrade}
        modalTrack={modals.modalTrack}
        setModalTrack={modals.setModalTrack}
        savingStage={modals.savingStage}
        closeStageModal={modals.closeStageModal}
        saveStageAssignment={modals.saveStageAssignment}
        subscriptionsModalUser={modals.subscriptionsModalUser}
        subscriptionsAccessToken={modals.subscriptionsAccessToken}
        closeSubscriptionsModal={modals.closeSubscriptionsModal}
        showAddTeacher={modals.showAddTeacher}
        setShowAddTeacher={modals.setShowAddTeacher}
        showAddStudent={modals.showAddStudent}
        setShowAddStudent={modals.setShowAddStudent}
        showAddParent={modals.showAddParent}
        setShowAddParent={modals.setShowAddParent}
        assignSubjectsFor={modals.assignSubjectsFor}
        setAssignSubjectsFor={modals.setAssignSubjectsFor}
        assignScopeFor={modals.assignScopeFor}
        setAssignScopeFor={modals.setAssignScopeFor}
        adminAccessToken={adminAccessToken}
        onUsersReload={usersHook.reloadUsers}
        setActionMsg={setActionMsg}
      />
    </div>
  )
}