// ──────────────────────────────────────────────────────────────
// lib/ai/extractLessonText.ts
//
// استخراج نص خام من ملفات Word (.docx) المرفوعة لكل درس —
// يُستخدَم لتغذية مولد الاختبارات الذكي بالمحتوى الفعلي بدل
// الاعتماد على لصق يدوي. يدعم أيضاً .pdf كاحتياط بسيط (نص فقط،
// بلا تنسيق) إن وُجد ملف PDF بدل Word.
// ──────────────────────────────────────────────────────────────

import mammoth from 'mammoth'

export type LessonFileKind = 'comprehension' | 'tharwa' | 'balagha' | 'nahw'

// ── جلب ملف من رابط عام (Supabase Storage public URL) كـ Buffer ──
async function fetchAsBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`تعذر تحميل الملف من الرابط (${res.status}): ${url}`)
  }
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// ── استخراج نص من ملف .docx واحد عبر mammoth ─────────────────
export async function extractTextFromDocxUrl(url: string): Promise<string> {
  const buffer = await fetchAsBuffer(url)
  const result = await mammoth.extractRawText({ buffer })
  return result.value.trim()
}

// ── استخراج ذكي: يحدد الامتداد من الرابط نفسه ────────────────
// حالياً ندعم .docx فقط بجودة كاملة (mammoth). لو كان الرابط
// لملف .pdf نُعيد رسالة تنبيه بدل فشل صامت، لأن استخراج نص PDF
// يحتاج مكتبة مختلفة (pdf-parse) لم تُدمَج بعد في هذا المسار.
export async function extractLessonFileText(url: string | null | undefined): Promise<string> {
  if (!url) return ''

  const lower = url.toLowerCase()
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
    try {
      return await extractTextFromDocxUrl(url)
    } catch (err: any) {
      console.error('extractLessonFileText (docx) error:', err)
      return `[تعذر استخراج نص هذا الملف: ${err?.message || 'خطأ غير معروف'}]`
    }
  }

  if (lower.endsWith('.pdf')) {
    return '[ملف PDF — استخراج النص منه غير مدعوم حالياً. يُرجى رفع ملف Word (.docx) لهذا الحقل.]'
  }

  return `[نوع ملف غير مدعوم للاستخراج التلقائي: ${url}]`
}

// ── دمج الملفات الأربعة لدرس واحد في كائن نصوص منظَّم ─────────
export type LessonExtractedTexts = {
  lessonId: string
  lessonName: string
  comprehension: string
  tharwa: string
  balagha: string
  nahw: string
}

type LessonRowForExtraction = {
  id: string
  name: string
  comprehension_file_url?: string | null
  tharwa_file_url?: string | null
  balagha_file_url?: string | null
  nahw_file_url?: string | null
}

export async function extractAllLessonTexts(
  lesson: LessonRowForExtraction
): Promise<LessonExtractedTexts> {
  const [comprehension, tharwa, balagha, nahw] = await Promise.all([
    extractLessonFileText(lesson.comprehension_file_url),
    extractLessonFileText(lesson.tharwa_file_url),
    extractLessonFileText(lesson.balagha_file_url),
    extractLessonFileText(lesson.nahw_file_url),
  ])

  return {
    lessonId: lesson.id,
    lessonName: lesson.name,
    comprehension,
    tharwa,
    balagha,
    nahw,
  }
}