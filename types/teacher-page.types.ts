import type { RefObject } from 'react'
import type { TeacherStyles } from '@/lib/teacher/teacher.styles'
import type { TeacherPageController } from '@/hooks/useTeacherPageController'

export type TeacherPageViewModel = TeacherPageController & {
  styles: TeacherStyles
}

export type TeacherPageHeaderProps = {
  vm: TeacherPageViewModel
}

export type TeacherSectionsRendererProps = {
  vm: TeacherPageViewModel
}

export type TeacherModalsContainerProps = {
  controller: TeacherPageViewModel
  fileRef: RefObject<HTMLInputElement | null>
  availableStudentsForClass: TeacherPageController['availableStudentsForClass']
}