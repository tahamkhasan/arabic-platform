'use client'

import { useState } from 'react'

import { TeacherPageHeader } from '@/components/TeacherPageHeader'
import { TeacherSectionsRenderer } from '@/components/TeacherSectionsRenderer'
import { TeacherModalsContainer } from '@/components/TeacherModalsContainer'
import { TeacherSidebar } from '@/components/TeacherSidebar'

import { useTeacherPageController } from '../../hooks/useTeacherPageController'
import { useTeacherPageStyles } from '../../hooks/useTeacherPageStyles'

import type { TeacherPageViewModel } from '@/types/teacher-page.types'

export default function TeacherPage() {
  const controller = useTeacherPageController()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isHome, setIsHome] = useState(true)

  const styles = useTeacherPageStyles({
    ui: controller.ui,
    isDark: controller.isDark,
    themeMode: controller.themeMode,
  })

  if (controller.loading) return null
  if (!controller.authorized || !controller.user) return null

  const vm: TeacherPageViewModel = {
    ...controller,
    styles,
    isHome,
  } as TeacherPageViewModel & { isHome: boolean }

  function handleTabChange(id: any) {
    setIsHome(false)
    controller.setTab(id)
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: `
          radial-gradient(circle at 82% 8%, ${controller.isDark ? 'rgba(217,119,6,0.08)' : 'rgba(225,135,60,0.10)'}, transparent 24%),
          radial-gradient(circle at 10% 86%, ${controller.isDark ? 'rgba(140,20,40,0.08)' : 'rgba(150,30,45,0.08)'}, transparent 24%),
          ${controller.ui.bg}
        `,
        color: controller.ui.text,
        fontFamily: controller.BRAND.fontBody,
      }}
    >
      <style>{styles.pageCss}</style>
      <style>{`
        .teacher-app-shell { display: flex; min-height: 100vh; }
        .teacher-sidebar { display: flex; }
        .teacher-mobile-nav { display: none; }
        @media (max-width: 900px) {
          .teacher-sidebar { display: none !important; }
          .teacher-mobile-nav { display: flex !important; }
          .teacher-main-area { padding-bottom: 96px !important; }
        }
      `}</style>

      <TeacherPageHeader vm={vm} />

      <div className="teacher-app-shell">
        <TeacherSidebar
          tabs={vm.tabs}
          tab={vm.tab}
          isHome={isHome}
          onSelectHome={() => setIsHome(true)}
          onTabChange={handleTabChange}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(v => !v)}
          onGoQuizBank={() => vm.router.push('/teacher/quizzes')}
          ui={vm.ui}
          userId={vm.user?.id ?? ''}
        />

        <div className="teacher-main-area" style={{ flex: 1, minWidth: 0 }}>
          <TeacherSectionsRenderer vm={vm} />
        </div>
      </div>

      <TeacherModalsContainer
        controller={vm}
        fileRef={vm.fileRef}
        availableStudentsForClass={vm.availableStudentsForClass}
      />
    </div>
  )
}