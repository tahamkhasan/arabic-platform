// types/lesson-comment.ts

export type LessonCommentItem = {
  id: string
  lesson_id: string
  student_id: string
  student_name: string | null   // مُلحق فقط عند جلب المعلم/المدير لكل التعليقات
  content: string
  created_at: string | null
}

export type LessonCommentPayload = {
  content: string
}