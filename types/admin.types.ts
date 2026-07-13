export type AssignedRole = {
  id: string
  key: string
  name: string
  description?: string | null
  permissions?: string[]
  is_active?: boolean
} | null

export interface User {
  id: string
  email: string
  role: string
  status: string
  user_type: string
  assigned_role_id?: string | null
  assigned_role?: AssignedRole
  is_active?: boolean
  allowed_grades?: string[]
  allowed_stages?: string[]
  track?: string | null
  avatar_url?: string | null
  current_term_id?: string | null
  created_at?: string
  created_by?: string | null
  last_seen_at?: string | null
  updated_at?: string | null
  permissions?: string[]
  approved?: boolean | null
  full_name?: string | null
  name?: string | null
}

export interface RoleItem {
  id: string | number
  key: string
  name: string
  description?: string | null
  permissions?: string[]
  is_active?: boolean
}

export type SubjectOffering = {
  stage: string
  grade: string
  track: 'scientific' | 'literary' | null
}

export type Subject = {
  id: string
  name: string
  grade?: string
  icon?: string
  offerings?: SubjectOffering[]
}

export interface SignalEvidenceStudent {
  class_name: string
  teacher_name: string
  teacher_id: string
  signals: {
    area_type: 'question_type' | 'bloom_level'
    area_label: string
    affected_count: number
    affected_student_names: string[]
    avg_accuracy: number
  }[]
}

export interface SignalEvidenceTeacher {
  teacher_name: string
  avg_response_hours: number
  overall_avg_hours: number
  graded_count: number
  ratio: number
}

export interface PlatformSignal {
  id: string
  signal_type: 'student_struggling' | 'teacher_slow_response'
  severity: 'info' | 'warning' | 'critical'
  subject_id: string
  subject_type: 'class' | 'teacher'
  evidence: SignalEvidenceStudent | SignalEvidenceTeacher
  status: 'pending' | 'dismissed' | 'action_taken'
  created_at: string
}

export type Tab = 'overview' | 'students' | 'teachers' | 'stages' | 'signals' | 'stats' | 'settings'
export type SubjectOccurrence = { subject: Subject; offering: SubjectOffering; isLegacy?: boolean }