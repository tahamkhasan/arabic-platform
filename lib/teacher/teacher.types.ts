export type TeacherTab =
  | 'assignments'
  | 'classes'
  | 'scope_students'
  | 'submissions'
  | 'media'
  | 'messages'
  | 'students'
  | 'stats'

export interface Subject {
  id: string
  name: string
  icon?: string
  grade?: string
}

export interface Student {
  id: string
  name: string
  email: string
  allowed_grades?: string[]
}

export interface ClassStudent {
  member_id: string
  student_id: string
  full_name: string
  email: string | null
  grade: string | null
  avg_score?: number | null
  joined_at: string
}

export interface ClassItem {
  id: string
  name: string
  level: string | null
  subject_id: string | null
  subject_name: string | null
  students_count: number
  open_assignments?: number
  created_at: string
}

export interface ScopeStudent {
  id: string
  name: string
  email: string
}

export interface TeacherScopeGroup {
  scope_id: string
  stage_label: string
  grade: string
  track_label: string | null
  subject_name: string | null
  students: ScopeStudent[]
}

export interface ClassDetail extends ClassItem {
  students: ClassStudent[]
}

export interface QuizOption {
  id: string
  title: string
  published: boolean
  questions_count: number
}

export type AssignmentTarget = 'all' | 'class' | 'student'

export interface Assignment {
  id: string
  title: string
  description?: string | null
  quiz_id: string
  quiz_title?: string | null
  questions_count?: number
  target_type: AssignmentTarget
  due_date?: string | null
  created_at: string
}

export interface Submission {
  id: string
  assignment_id: string
  student_id: string
  answer_text: string
  submitted_at: string
  ai_grade?: number | null
  ai_feedback?: string | null
  teacher_grade?: number | null
  teacher_feedback?: string | null
  status: string
  users?: {
    name: string
    email: string
  }
}

export interface Media {
  id: string
  title: string
  type: 'video' | 'audio'
  url: string

  embed_url?: string | null
  embedUrl?: string | null
  embedurl?: string | null

  link_type?: 'upload' | 'link' | string
  linkType?: 'upload' | 'link' | string
  linktype?: 'upload' | 'link' | string

  thumbnail?: string | null

  subject_id?: string | null
  subjectId?: string | null

  created_at: string
  createdAt?: string
}

export interface Message {
  id: string
  from_id: string
  to_id: string
  content: string
  image_url?: string | null
  is_read: boolean
  created_at: string
}

export interface InsightSignal {
  area_type: 'question_type' | 'bloom_level'
  area_key: string
  area_label: string
  affected_count: number
  affected_student_names: string[]
  avg_accuracy: number
}

export interface ClassInsight {
  class_id: string
  class_name: string
  signals: InsightSignal[]
  struggling_students: {
    id: string
    name: string
    overall_accuracy: number | null
  }[]
}

export interface StatsSummary {
  totalAssignments: number
  totalStudents: number
  totalSubmissions: number
  avgGrade: number
  pendingReview: number
  responseRate: number
  reviewedSubs: number
}

export interface StatsStudentRow {
  id: string
  name: string
  email: string
  grades: string[]
  submitted: number
  graded: number
  avgGrade: number | null
  pending: number
  responseRate: number
}

export interface StatsAssignmentRow {
  id: string
  title: string
  maxGrade: number
  submitted: number
  graded: number
  avgGrade: number | null
  avgPercent: number | null
  pending: number
}

export interface Stats {
  summary: StatsSummary
  studentStats: StatsStudentRow[]
  assignmentStats: StatsAssignmentRow[]
}

export interface TeacherTabItem {
  id: TeacherTab
  icon: string
  label: string
  badge?: number
}