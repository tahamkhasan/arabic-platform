'use client'

import { supabase } from '@/lib/supabase'
import { BRAND } from '@/lib/constants/theme'
import { GRADES_BY_STAGE, type StageKey, type TrackKey } from '@/lib/constants/stages'

export const A = {
  bg: BRAND.bg,
  surface: BRAND.bgSoft,
  card: BRAND.bgSoft,
  text: BRAND.text,
  sub: BRAND.sub,
  border: BRAND.border,
  inputBg: 'rgba(140,20,40,0.04)',
  headerBg: 'rgba(247,242,234,0.94)',
  shadow: BRAND.shadow,
  gradMain: BRAND.gradMain,
  gradBlue: BRAND.gradBlue,
  crimson: BRAND.crimson,
  red: BRAND.red,
  orange: BRAND.orange,
  orangeRed: BRAND.orangeRed,
  gold: BRAND.gold,
  deep: BRAND.deep,
  fontHeading: BRAND.fontHeading,
  fontBody: BRAND.fontBody,
  weightSemibold: BRAND.weightSemibold,
  weightBold: BRAND.weightBold,
  weightBlack: BRAND.weightBlack,
} as const

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
  track: TrackKey | null
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

export type AdminTab =
  | 'students'
  | 'teachers'
  | 'stages'
  | 'signals'
  | 'stats'
  | 'settings'

export type SubjectOccurrence = {
  subject: Subject
  offering: SubjectOffering
  isLegacy?: boolean
}

export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function stageForLegacyGrade(grade?: string | null): StageKey | null {
  if (!grade) return null
  for (const stage of Object.keys(GRADES_BY_STAGE) as StageKey[]) {
    if (GRADES_BY_STAGE[stage].some(g => g.id === String(grade).trim())) return stage
  }
  return null
}

export function isTrackGrade(grade?: string | null) {
  return grade === '11' || grade === '12'
}

export function formatDate(date?: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('ar-KW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function normalizeError(error: unknown, fallback = 'حدث خطأ غير متوقع') {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

export async function getSessionToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    throw new ApiError('انتهت جلسة تسجيل الدخول.', 401)
  }

  return session.access_token
}

export async function fetchJson<T>(url: string, init: RequestInit = {}) {
  const res = await fetch(url, init)
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiError(data?.error || 'فشل الطلب.', res.status)
  }

  return data as T
}

export async function authJson<T>(url: string, init: RequestInit = {}) {
  const token = await getSessionToken()
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData

  const res = await fetch(url, {
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiError(data?.error || 'فشل الطلب.', res.status)
  }

  return data as T
}