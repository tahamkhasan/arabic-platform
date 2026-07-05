export type SubjectOffering = {
  stage: string
  grade: string
  track: 'scientific' | 'literary' | null
}

export type SubjectItem = {
  id: string
  name: string
  icon: string
  description: string | null
  content_overview: string | null
  curriculum: string | null
  teacher_intro_video_url: string | null
  is_active: boolean
  stage?: string | null
  grade?: string | null
  created_at?: string | null
  offerings: SubjectOffering[]
  // ── جديد: اسم المعلم المُعيَّن للمادة (من teacher_subjects) ──
  teacherName?: string | null
}

export type SubjectFormState = {
  name: string
  icon: string
  description: string
  content_overview: string
  curriculum: string
  teacher_intro_video_url: string
  is_active: boolean
  offerings: SubjectOffering[]
}

export const emptySubjectForm: SubjectFormState = {
  name: '',
  icon: '📚',
  description: '',
  content_overview: '',
  curriculum: '',
  teacher_intro_video_url: '',
  is_active: true,
  offerings: [],
}

export function formFromSubject(subject: SubjectItem): SubjectFormState {
  return {
    name: subject.name || '',
    icon: subject.icon || '📚',
    description: subject.description || '',
    content_overview: subject.content_overview || '',
    curriculum: subject.curriculum || '',
    teacher_intro_video_url: subject.teacher_intro_video_url || '',
    is_active: subject.is_active !== false,
    offerings: subject.offerings || [],
  }
}

export const STAGE_GRADES: Record<string, string[]> = {
  'ابتدائي': ['1', '2', '3', '4', '5', '6'],
  'متوسط': ['7', '8', '9'],
  'ثانوي': ['10', '11', '12'],
}

export const TRACK_LABELS: Record<string, string> = {
  scientific: 'علمي',
  literary: 'أدبي',
}