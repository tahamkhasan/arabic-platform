// types/curriculum.ts

export type CurriculumLesson = {
  id: string
  name: string
  description: string | null
  video_url: string | null
  order_num: number
  has_quiz: boolean
}

export type CurriculumUnit = {
  id: string
  name: string
  description: string | null
  order_num: number
  icon: string | null
  lessons: CurriculumLesson[]
}

export type CurriculumSubject = {
  id: string
  name: string
  description: string | null
  stage: string | null
  grade: string | null
  icon: string | null
  is_active: boolean
}

export type CurriculumResponse = {
  subject: CurriculumSubject
  units: CurriculumUnit[]
}