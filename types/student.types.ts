import type { StageKey, TrackKey } from '@/lib/constants/stages'

export interface User {
  id: string
  name: string
  role: string
  user_type: string
  status?: string
  theme_color?: string
  allowed_grades?: string[]
  allowed_stages?: string[]
  track?: string | null
}

export interface Subject {
  id: string
  name: string
  icon?: string
  grade?: string
  stage?: string
  teacherName?: string | null
  unitsCount?: number
}

export interface Unit {
  id: string
  name: string
  icon?: string
  semester?: number
}

export interface Lesson {
  id: string
  name: string
  content?: string
  video_url?: string | null
  video_embed_url?: string | null
  file_urls?: string[]
}

export interface Assignment {
  id: string
  title: string
  content?: string
  tool?: string
  deadline?: string
  due_date?: string | null
  max_grade?: number
  subject_id?: string
  submitted?: boolean
  grade?: number | null
  score?: number | null
  description?: string | null
  quiz_id?: string | null
  created_at?: string
}

export interface QuizAvailable {
  id: string
  title: string
  description?: string
  time_limit_minutes?: number
  attempts_allowed: number
  questions_count: number
  attempts_used: number
  last_score: number | null
  has_active_attempt: boolean
  can_attempt: boolean
}

export interface Message {
  id: string
  from_id: string
  to_id: string
  content: string
  image_url?: string
  is_read: boolean
  created_at: string
}

export interface Media {
  id: string
  title: string
  type: 'video' | 'audio'
  url: string
  embed_url?: string
  link_type: string
  thumbnail?: string
}

export interface QuizQuestion {
  id: number
  type: 'multiple' | 'truefalse' | 'fill'
  question: string
  options?: string[]
  correct: string | number | boolean
  explanation: string
}

export interface QuizData {
  title: string
  questions: QuizQuestion[]
}

export interface FlashcardsData {
  title: string
  lessonType: string
  cards: {
    id: number
    category: string
    front: string
    back: string
    example?: string | null
  }[]
}

export type Tab = 'home' | 'assignments' | 'lessons' | 'practice' | 'messages' | 'media'

export const PRACTICE_TOOLS = [
  { id: 'explain', icon: '💡', label: 'شرح الدرس', desc: 'شرح مبسط مع أمثلة' },
  { id: 'worksheet', icon: '📋', label: 'ورقة عمل', desc: 'أنشطة وتدريبات' },
  { id: 'quiz', icon: '🎯', label: 'اختبار تفاعلي', desc: 'أسئلة وتصحيح فوري' },
  { id: 'flashcards', icon: '🃏', label: 'بطاقات الحفظ', desc: 'راجع بسرعة وذكاء' },
] as const

export type { StageKey, TrackKey }