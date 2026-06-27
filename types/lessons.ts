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
}

export type LessonFormState = {
  name: string
  description: string
  content: string
  order_num: number
  is_active: boolean
  currentVideoUrl: string | null   // الفيديو الحالي (عرض فقط)
  videoLink: string                 // رابط جديد — يستبدل الحالي إن أُدخل
  videoFile: File | null            // ملف جديد — يستبدل الحالي إن أُرفع
  removeVideo: boolean              // علم لإزالة الفيديو الحالي
  existingFileUrls: string[]        // الملفات المصاحبة الحالية (قابلة للحذف الفردي)
  newFiles: File[]                  // ملفات مصاحبة جديدة لإضافتها
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
}

export function formFromLesson(lesson: LessonItem): LessonFormState {
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
  }
}