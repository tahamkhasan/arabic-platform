export type LessonItem = {
  id: string
  unit_id: string
  subject_id: string | null
  name: string
  description: string | null
  content: string | null
  video_url: string | null
  video_embed_url: string | null
  file_urls: string[] | null
  order_num: number
  is_active: boolean
  created_at?: string | null

  // ── ملفات اللغة العربية — أعمدة قديمة (للتوافق الخلفي) ──────
  comprehension_file_url: string | null
  comprehension_file_name: string | null
  tharwa_file_url: string | null
  tharwa_file_name: string | null
  balagha_file_url: string | null
  balagha_file_name: string | null
  nahw_file_url: string | null
  nahw_file_name: string | null

  // ── ملفات اللغة العربية — أعمدة جديدة (متعددة) ───────────────
  comprehension_file_urls: string[]
  comprehension_file_names: string[]
  tharwa_file_urls: string[]
  tharwa_file_names: string[]
  balagha_file_urls: string[]
  balagha_file_names: string[]
  nahw_file_urls: string[]
  nahw_file_names: string[]
}

export type LessonFormState = {
  name: string
  description: string
  content: string
  order_num: number
  is_active: boolean

  // ── الفيديو ────────────────────────────────────────────────
  currentVideoUrl: string | null
  videoLink: string
  videoFile: File | null
  removeVideo: boolean

  // ── الملفات المصاحبة العامة ────────────────────────────────
  existingFileUrls: string[]
  newFiles: File[]

  // ── ملفات اللغة العربية الأربعة (متعددة لكل فرع) ───────────
  // كل فرع: URLs الحالية (قابلة للحذف الفردي) + ملفات جديدة لإضافتها
  comprehensionFileUrls:  string[]
  comprehensionFileNames: string[]
  newComprehensionFiles:  File[]

  tharwaFileUrls:  string[]
  tharwaFileNames: string[]
  newTharwaFiles:  File[]

  balaghaFileUrls:  string[]
  balaghaFileNames: string[]
  newBalaghaFiles:  File[]

  nahwFileUrls:  string[]
  nahwFileNames: string[]
  newNahwFiles:  File[]
}

export const emptyLessonForm: LessonFormState = {
  name: '',
  description: '',
  content: '',
  order_num: 1,
  is_active: true,
  currentVideoUrl: null,
  videoLink: '',
  videoFile: null,
  removeVideo: false,
  existingFileUrls: [],
  newFiles: [],

  comprehensionFileUrls:  [],
  comprehensionFileNames: [],
  newComprehensionFiles:  [],

  tharwaFileUrls:  [],
  tharwaFileNames: [],
  newTharwaFiles:  [],

  balaghaFileUrls:  [],
  balaghaFileNames: [],
  newBalaghaFiles:  [],

  nahwFileUrls:  [],
  nahwFileNames: [],
  newNahwFiles:  [],
}

export function formFromLesson(lesson: LessonItem): LessonFormState {
  // ── دمج الأعمدة القديمة (ملف واحد) مع الجديدة (مصفوفة) ───────
  // الأولوية للأعمدة الجديدة إن كانت ممتلئة، وإلا نُهاجر القديمة
  function mergeUrls(newUrls: string[], oldUrl: string | null): string[] {
    if (newUrls && newUrls.length > 0) return newUrls
    if (oldUrl) return [oldUrl]
    return []
  }
  function mergeNames(newNames: string[], oldName: string | null): string[] {
    if (newNames && newNames.length > 0) return newNames
    if (oldName) return [oldName]
    return []
  }

  return {
    name: lesson.name || '',
    description: lesson.description || '',
    content: lesson.content || '',
    order_num: lesson.order_num ?? 1,
    is_active: lesson.is_active !== false,
    currentVideoUrl: lesson.video_url || null,
    videoLink: '',
    videoFile: null,
    removeVideo: false,
    existingFileUrls: lesson.file_urls || [],
    newFiles: [],

    comprehensionFileUrls:  mergeUrls(lesson.comprehension_file_urls, lesson.comprehension_file_url),
    comprehensionFileNames: mergeNames(lesson.comprehension_file_names, lesson.comprehension_file_name),
    newComprehensionFiles:  [],

    tharwaFileUrls:  mergeUrls(lesson.tharwa_file_urls, lesson.tharwa_file_url),
    tharwaFileNames: mergeNames(lesson.tharwa_file_names, lesson.tharwa_file_name),
    newTharwaFiles:  [],

    balaghaFileUrls:  mergeUrls(lesson.balagha_file_urls, lesson.balagha_file_url),
    balaghaFileNames: mergeNames(lesson.balagha_file_names, lesson.balagha_file_name),
    newBalaghaFiles:  [],

    nahwFileUrls:  mergeUrls(lesson.nahw_file_urls, lesson.nahw_file_url),
    nahwFileNames: mergeNames(lesson.nahw_file_names, lesson.nahw_file_name),
    newNahwFiles:  [],
  }
}