import type { TeacherTabItem } from './teacher.types'

export function buildTeacherTabs(params: {
  pendingReviews: number
  unread: number
}): TeacherTabItem[] {
  const { pendingReviews, unread } = params

  return [
    { id: 'assignments', icon: '📝', label: 'المهام' },
    { id: 'classes', icon: '🏫', label: 'الفصول' },
    { id: 'scope_students', icon: '📚', label: 'إدارة المادة' },
    { id: 'submissions', icon: '📬', label: 'الإجابات', badge: pendingReviews },
    { id: 'media', icon: '🎥', label: 'الوسائط' },
    { id: 'messages', icon: '💬', label: 'الرسائل', badge: unread },
    { id: 'students', icon: '👤', label: 'الطلاب' },
    { id: 'stats', icon: '📊', label: 'التحليلات' },
  ]
}