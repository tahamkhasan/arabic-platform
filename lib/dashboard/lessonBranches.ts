export type BranchKey = 'general' | 'comprehension' | 'tharwa' | 'balagha' | 'nahw'

export interface BranchOption {
  key: BranchKey
  label: string
  icon: string
  urlsField:
    | 'comprehension_file_urls'
    | 'tharwa_file_urls'
    | 'balagha_file_urls'
    | 'nahw_file_urls'
    | null
}

export const LESSON_BRANCHES: BranchOption[] = [
  { key: 'general', label: 'المادة العلمية', icon: '📖', urlsField: null },
  { key: 'comprehension', label: 'فهم واستيعاب', icon: '🧠', urlsField: 'comprehension_file_urls' },
  { key: 'tharwa', label: 'ثروة لغوية', icon: '💎', urlsField: 'tharwa_file_urls' },
  { key: 'balagha', label: 'بلاغة', icon: '🎭', urlsField: 'balagha_file_urls' },
  { key: 'nahw', label: 'نحو', icon: '📐', urlsField: 'nahw_file_urls' },
]

export function isArabicSubject(subjectName?: string | null): boolean {
  return !!subjectName && subjectName.includes('اللغة العربية')
}

// ── هل يحتوي الدرس ملفات فعلية لهذا الفرع؟ (لإخفاء الفروع الفارغة) ──
export function branchHasFiles(lesson: any, branch: BranchOption): boolean {
  if (branch.key === 'general') return !!lesson?.content?.trim()
  if (!branch.urlsField) return false
  const urls = lesson?.[branch.urlsField]
  return Array.isArray(urls) && urls.length > 0
}

export function getAvailableBranches(lesson: any): BranchOption[] {
  return LESSON_BRANCHES.filter(b => branchHasFiles(lesson, b))
}