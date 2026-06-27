// types/lesson-note.ts

export type LessonNoteItem = {
  id: string
  lesson_id: string
  student_id: string
  content: string
  updated_at: string | null
}

export type LessonNotePayload = {
  content: string
}