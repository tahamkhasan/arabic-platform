export interface User {
  id: string
  name: string
  role: string
  user_type: string
  status?: string
  theme_color?: string
  theme_mode?: string
}

export interface Subject {
  id: string
  name: string
  icon?: string
  grade?: string
  stage?: string
}

export interface Unit {
  id: string
  name: string
  icon?: string
}

export interface Lesson {
  id: string
  name: string
  content?: string
  file_urls?: string[]
  comprehension_file_urls?: string[]
  comprehension_file_names?: string[]
  tharwa_file_urls?: string[]
  tharwa_file_names?: string[]
  balagha_file_urls?: string[]
  balagha_file_names?: string[]
  nahw_file_urls?: string[]
  nahw_file_names?: string[]
}

export interface Exam {
  id: string
  name: string
  exam_type: 'short' | 'final'
}

export type ToolItem = {
  id: string
  icon: string
  label: string
  desc: string
}