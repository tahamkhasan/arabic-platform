// lib/constants/stages.ts

// المرحلة الدراسية
export type StageKey = 'primary' | 'middle' | 'secondary'

export const STAGE_LABELS: Record<StageKey, string> = {
  primary: 'الابتدائية',
  middle: 'المتوسطة',
  secondary: 'الثانوية',
}

/**
 * الصفوف لكل مرحلة:
 * - الابتدائية: 1–5
 * - المتوسطة: 6–9
 * - الثانوية: 10–12
 */
export const GRADES_BY_STAGE: Record<StageKey, { id: string; label: string }[]> = {
  primary: [
    { id: '1', label: 'الصف الأول' },
    { id: '2', label: 'الصف الثاني' },
    { id: '3', label: 'الصف الثالث' },
    { id: '4', label: 'الصف الرابع' },
    { id: '5', label: 'الصف الخامس' },
  ],
  middle: [
    { id: '6', label: 'الصف السادس' },
    { id: '7', label: 'الصف السابع' },
    { id: '8', label: 'الصف الثامن' },
    { id: '9', label: 'الصف التاسع' },
  ],
  secondary: [
    { id: '10', label: 'الصف العاشر' },
    { id: '11', label: 'الصف الحادي عشر' },
    { id: '12', label: 'الصف الثاني عشر' },
  ],
}

// التشعيب للمرحلة الثانوية فقط (حادي عشر وثاني عشر)
export type TrackKey = 'scientific' | 'literary'

export const TRACK_LABELS: Record<TrackKey, string> = {
  scientific: 'علمي',
  literary: 'أدبي',
}