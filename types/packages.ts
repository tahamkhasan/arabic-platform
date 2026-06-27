// types/packages.ts

export type PackageItem = {
  id: string
  name: string
  stage: string
  grade: string
  track: string | null
  description: string | null
  is_active: boolean
  created_at: string
  // محسوبة دائماً من subject_offerings عند الجلب — لا قائمة مُخزَّنة
  subjects: { id: string; name: string; icon?: string | null }[]
}

export type PackageFormState = {
  name: string
  stage: string
  grade: string
  track: string | null
  description: string
  is_active: boolean
}