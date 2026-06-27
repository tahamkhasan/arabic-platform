// ============================================================
// مُتحققات Zod للمهام الشائعة
// كل بيانات من العميل تمر من هنا قبل الوصول لقاعدة البيانات
// تمنع البيانات الخاطئة أو الضارة من الدخول
// ============================================================

import { z } from 'zod';

// ---- إنشاء اختبار جديد ----
export const createQuizSchema = z.object({
  title: z
    .string()
    .min(3, 'عنوان الاختبار قصير جداً (3 أحرف على الأقل)')
    .max(200, 'عنوان الاختبار طويل جداً (200 حرف كحد أقصى)'),
  description: z
    .string()
    .max(1000, 'الوصف طويل جداً')
    .optional(),
  lesson_ids: z
    .array(z.string().uuid('معرّف الدرس غير صالح'))
    .min(1, 'اختر درساً واحداً على الأقل')
    .max(20, 'الحد الأقصى 20 درساً'),
  config: z
    .object({
      question_distribution: z.object({
        multiple_choice: z.number().int().min(0),
        true_false: z.number().int().min(0),
        fill_blank: z.number().int().min(0),
        matching: z.number().int().min(0),
        ordering: z.number().int().min(0),
        syntax_analysis: z.number().int().min(0),
        extraction: z.number().int().min(0),
        essay: z.number().int().min(0),
      }),
      bloom_levels: z.object({
        remember: z.number().int().min(0),
        understand: z.number().int().min(0),
        apply: z.number().int().min(0),
        analyze: z.number().int().min(0),
        evaluate: z.number().int().min(0),
        create: z.number().int().min(0),
      }),
      difficulty: z.object({
        easy: z.number().int().min(0),
        medium: z.number().int().min(0),
        hard: z.number().int().min(0),
      }),
      include_quran_examples: z.boolean().default(false),
      include_poetry_examples: z.boolean().default(false),
      include_common_mistakes: z.boolean().default(false),
    }),
  time_limit_minutes: z
    .number()
    .int()
    .min(1, 'الحد الأدنى دقيقة واحدة')
    .max(180, 'الحد الأقصى 180 دقيقة')
    .optional(),
  shuffle_questions: z.boolean().default(true),
  shuffle_options: z.boolean().default(true),
  class_id: z.string().uuid('معرّف الفصل غير صالح').optional(),
  attempts_allowed: z
    .number()
    .int()
    .min(1, 'محاولة واحدة على الأقل')
    .max(10, 'الحد الأقصى 10 محاولات')
    .default(1),
});

// ---- تسليم إجابات اختبار ----
export const submitQuizSchema = z.object({
  attempt_id: z.string().uuid('معرّف المحاولة غير صالح'),
  answers: z.record(
    z.string(),
    z.union([z.string(), z.array(z.string())])
  ),
  time_spent_seconds: z.number().int().min(0).optional(),
});

// ---- إنشاء فصل جديد ----
export const createClassSchema = z.object({
  name: z
    .string()
    .min(2, 'اسم الفصل قصير جداً')
    .max(100, 'اسم الفصل طويل جداً'),
  grade: z.string().min(1, 'اختر الصف'),
  section: z.string().max(20).optional(),
  academic_year: z
    .string()
    .regex(
      /^\d{4}-\d{4}$/,
      'صيغة العام الدراسي غير صحيحة (مثال: 2026-2027)'
    ),
});

// ---- تعديل فصل ----
export const updateClassSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  section: z.string().max(20).optional(),
});

// ---- إنشاء مهمة جديدة ----
export const createAssignmentSchema = z.object({
  title: z
    .string()
    .min(3, 'عنوان المهمة قصير جداً')
    .max(200, 'عنوان المهمة طويل جداً'),
  description: z.string().max(2000).optional(),
  type: z.enum(['worksheet', 'quiz', 'reading', 'writing', 'other'], {
    message: 'نوع المهمة غير صالح',
  }),
  class_id: z.string().uuid('معرّف الفصل غير صالح'),
  due_date: z.string().datetime('صيغة التاريخ غير صحيحة').optional(),
  content_ref: z.record(z.string(), z.unknown()).optional(),
});

// ---- تسليم مهمة ----
export const submitAssignmentSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
});

// ---- تصحيح مهمة ----
export const gradeAssignmentSchema = z.object({
  submission_id: z.string().uuid('معرّف التسليم غير صالح'),
  score: z
    .number()
    .min(0, 'الدرجة لا يمكن أن تكون أقل من صفر')
    .max(100, 'الدرجة لا يمكن أن تتجاوز 100'),
  feedback: z.string().max(2000, 'التغذية الراجعة طويلة جداً').optional(),
});

// ---- رسالة دردشة ----
export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'لا يمكن إرسال رسالة فارغة')
    .max(2000, 'الرسالة طويلة جداً (2000 حرف كحد أقصى)'),
  lesson_id: z.string().uuid().optional(),
  conversation_id: z.string().uuid().optional(),
});

// ---- إضافة طلاب لفصل (دفعة واحدة) ----
export const bulkAddStudentsSchema = z.object({
  student_ids: z
    .array(z.string().uuid('معرّف طالب غير صالح'))
    .min(1, 'اختر طالباً واحداً على الأقل')
    .max(50, 'الحد الأقصى 50 طالباً في المرة الواحدة'),
});

// ---- إضافة طالب واحد لفصل ----
export const addStudentSchema = z.object({
  student_id: z.string().uuid('معرّف الطالب غير صالح'),
});

// ---- توليد محتوى بالذكاء الاصطناعي ----
export const generateContentSchema = z.object({
  type: z.enum([
    'lesson',
    'worksheet',
    'quiz',
    'game',
    'presentation',
    'flashcards',
  ], {
    message: 'نوع التوليد غير صالح',
  }),
  lesson_id: z.string().uuid('معرّف الدرس غير صالح'),
  options: z.record(z.string(), z.unknown()).optional(),
});

// ---- التحقق من صفحة (للتصفح) ----
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

// ---- نوع مساعد: ناتج التحقق ----
// يُستخدم هكذا:
//   const result = createClassSchema.safeParse(body);
//   if (!result.success) return error(result.error.errors[0].message, 422);
export type SafeParseResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  errors: z.ZodError;
};

// ---- دالة مساعدة: تُرجع أول رسالة خطأ من Zod ----
// الاستخدام:
//   const result = schema.safeParse(body);
//   if (!result.success) return error(getFirstError(result.error), 422);
export function getFirstError(zodError: z.ZodError): string {
  return zodError.issues[0]?.message || 'بيانات غير صالحة';
}