'use client'

import { TeacherPageHeader } from '@/components/TeacherPageHeader'
import { TeacherSectionsRenderer } from '@/components/TeacherSectionsRenderer'
import { TeacherModalsContainer } from '@/components/TeacherModalsContainer'

import { useTeacherPageController } from '../../hooks/useTeacherPageController'
import { useTeacherPageStyles } from '../../hooks/useTeacherPageStyles'

import type { TeacherPageViewModel } from '@/types/teacher-page.types'

export default function TeacherPage() {
  const controller = useTeacherPageController()

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
        paddingBottom: 96,
      }}
    >
      <style>{styles.pageCss}</style>

      <TeacherPageHeader vm={vm} />
      <TeacherSectionsRenderer vm={vm} />

      <TeacherModalsContainer
        controller={vm}
        fileRef={vm.fileRef}
        availableStudentsForClass={vm.availableStudentsForClass}
      />
    </div>
  )
}