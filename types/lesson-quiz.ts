// types/lesson-quiz.ts

export type QuizQuestion = {
  id: number
  type: 'multiple' | 'truefalse' | 'fill'
  question: string
  options?: string[]              // مطلوب فقط لنوع multiple
  correct: string | number | boolean
  explanation: string
}

export type LessonQuizPayload = {
  title?: string | null
  questions: QuizQuestion[]
}

export type LessonQuizItem = {
  id: string
  lesson_id: string
  title: string | null
  questions: QuizQuestion[]
  created_at: string | null
  updated_at: string | null
}