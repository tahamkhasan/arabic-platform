import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const maxDuration = 60

const MATERIALS_BUCKET = 'materials'
const MAX_SOURCE_TEXT_LENGTH = 24000
const TARGET_QUESTION_COUNT = 6

type StudioProject = {
  id: string
  title: string | null
  output_type: string | null
}

type ProjectMaterialLink = {
  material_id: string
}

type SubjectMaterialFile = {
  id: string
  title: string | null
  file_name: string | null
  file_path: string | null
  mime_type: string | null
  is_active: boolean | null
}

type QuizQuestion = {
  id: string
  question: string
  options: string[]
  correctAnswerIndex: number
}

type GeneratedQuizQuestion = {
  question: string
  options: string[]
  correctAnswerIndex: number
}

type GeneratedQuizResponse = {
  questions: GeneratedQuizQuestion[]
}

type GeminiCandidateDiagnostic = {
  finishReason: unknown
  finishMessage: unknown
  safetyRatings: unknown
  hasContent: boolean
  partsCount: number
  textLength: number
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function cleanText(value: string): string {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function getFileExtension(fileName: string | null): string {
  if (!fileName || !fileName.includes('.')) {
    return ''
  }

  return fileName.split('.').pop()?.trim().toLowerCase() || ''
}

function getCleanLessonTitle(projectTitle: string | null): string {
  const rawTitle = (projectTitle || 'الدرس').trim()

  return (
    rawTitle
      .replace(/^اختبار\s*(الدرس)?\s*[:\-–—]?\s*/i, '')
      .replace(/^ملخص\s+(الدرس|درس)\s*[:\-–—]?\s*/i, '')
      .replace(/^درس\s*[:\-–—]?\s*/i, '')
      .trim() || 'الدرس'
  )
}

function normalizeArabic(value: string): string {
  return value
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ًٌٍَُِّْـ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isDocxFile(material: SubjectMaterialFile): boolean {
  const extension = getFileExtension(material.file_name)

  return (
    extension === 'docx' ||
    material.mime_type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
}

function isPdfFile(material: SubjectMaterialFile): boolean {
  const extension = getFileExtension(material.file_name)

  return extension === 'pdf' || material.mime_type === 'application/pdf'
}

function isSupportedMaterial(material: SubjectMaterialFile): boolean {
  return Boolean(material.file_path) && (isDocxFile(material) || isPdfFile(material))
}

function hasArabicLetters(value: string): boolean {
  return /[\u0600-\u06FF]/.test(value)
}

function areUniqueOptions(options: string[]): boolean {
  const normalized = options.map((option) => normalizeArabic(option))
  return new Set(normalized).size === normalized.length
}

function isValidGeneratedQuestion(
  value: unknown
): value is GeneratedQuizQuestion {
  if (!value || typeof value !== 'object') {
    return false
  }

  const question = value as Partial<GeneratedQuizQuestion>

  if (
    typeof question.question !== 'string' ||
    question.question.trim().length < 12 ||
    !hasArabicLetters(question.question) ||
    !Array.isArray(question.options) ||
    question.options.length !== 4 ||
    typeof question.correctAnswerIndex !== 'number' ||
    !Number.isInteger(question.correctAnswerIndex) ||
    question.correctAnswerIndex < 0 ||
    question.correctAnswerIndex > 3
  ) {
    return false
  }

  const options = question.options.map((option) =>
    typeof option === 'string' ? option.trim() : ''
  )

  if (
    !options.every((option) => option.length >= 1 && hasArabicLetters(option)) ||
    !areUniqueOptions(options)
  ) {
    return false
  }

  return true
}

function validateGeneratedQuestions(value: unknown): QuizQuestion[] | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const parsed = value as Partial<GeneratedQuizResponse>

  if (!Array.isArray(parsed.questions)) {
    return null
  }

  const validQuestions = parsed.questions
    .filter(isValidGeneratedQuestion)
    .map((question, index) => ({
      id: `q-${index + 1}`,
      question: question.question.trim(),
      options: question.options.map((option) => option.trim()),
      correctAnswerIndex: question.correctAnswerIndex,
    }))

  if (validQuestions.length < 4) {
    return null
  }

  const uniqueQuestions = new Map<string, QuizQuestion>()

  for (const question of validQuestions) {
    const key = normalizeArabic(question.question)

    if (!uniqueQuestions.has(key)) {
      uniqueQuestions.set(key, question)
    }

    if (uniqueQuestions.size === TARGET_QUESTION_COUNT) {
      break
    }
  }

  const questions = [...uniqueQuestions.values()]
    .slice(0, TARGET_QUESTION_COUNT)
    .map((question, index) => ({
      ...question,
      id: `q-${index + 1}`,
    }))

  return questions.length >= 4 ? questions : null
}

async function setProjectStatus(
  projectId: string,
  status: 'processing' | 'completed' | 'error'
) {
  const { error } = await supabaseAdmin
    .from('studio_projects')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)

  if (error) {
    console.error(`generate-quiz: ${status} status update error:`, error)
  }

  return error
}

async function extractDocxText(fileBuffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({
    buffer: fileBuffer,
  })

  return result.value
}

async function extractPdfText(fileBuffer: Buffer): Promise<string> {
  const parser = new PDFParse({
    data: fileBuffer,
  })

  try {
    const result = await parser.getText()
    return result.text
  } finally {
    await parser.destroy()
  }
}

function safelyReadGeminiText(response: unknown): string {
  if (!response || typeof response !== 'object') {
    return ''
  }

  try {
    const value = Reflect.get(response, 'text')

    if (typeof value === 'string') {
      return value.trim()
    }

    if (typeof value === 'function') {
      const result = value.call(response)

      if (typeof result === 'string') {
        return result.trim()
      }
    }
  } catch (error) {
    console.warn('generate-quiz: unable to read Gemini response.text:', error)
  }

  return ''
}

function extractGeminiResponseText(response: unknown): string {
  const directText = safelyReadGeminiText(response)

  if (directText) {
    return directText
  }

  if (!response || typeof response !== 'object') {
    return ''
  }

  const payload = response as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: unknown
        }>
      }
    }>
  }

  const candidateText =
    payload.candidates
      ?.flatMap((candidate) => candidate.content?.parts || [])
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .filter(Boolean)
      .join('\n')
      .trim() || ''

  return candidateText
}

function getGeminiResponseDiagnostics(response: unknown) {
  if (!response || typeof response !== 'object') {
    return null
  }

  const payload = response as {
    promptFeedback?: unknown
    usageMetadata?: unknown
    modelVersion?: unknown
    responseId?: unknown
    candidates?: Array<{
      finishReason?: unknown
      finishMessage?: unknown
      safetyRatings?: unknown
      content?: {
        parts?: Array<{
          text?: unknown
          thought?: unknown
          inlineData?: unknown
          functionCall?: unknown
        }>
      }
    }>
  }

  const candidates: GeminiCandidateDiagnostic[] =
    payload.candidates?.map((candidate) => {
      const parts = candidate.content?.parts || []
      const textLength = parts.reduce((total, part) => {
        return total + (typeof part?.text === 'string' ? part.text.length : 0)
      }, 0)

      return {
        finishReason: candidate.finishReason || null,
        finishMessage: candidate.finishMessage || null,
        safetyRatings: candidate.safetyRatings || null,
        hasContent: Boolean(candidate.content),
        partsCount: parts.length,
        textLength,
      }
    }) || []

  return {
    responseId: payload.responseId || null,
    modelVersion: payload.modelVersion || null,
    promptFeedback: payload.promptFeedback || null,
    usageMetadata: payload.usageMetadata || null,
    candidates,
  }
}

function parseGeminiJsonResponse(rawResponseText: string): unknown {
  const responseText = rawResponseText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  try {
    return JSON.parse(responseText)
  } catch {
    const jsonStart = responseText.indexOf('{')
    const jsonEnd = responseText.lastIndexOf('}')

    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
      throw new Error('Gemini returned no JSON object.')
    }

    const jsonText = responseText.slice(jsonStart, jsonEnd + 1)

    try {
      return JSON.parse(jsonText)
    } catch (error) {
      console.error(
        'generate-quiz: Gemini JSON parse error:',
        error,
        '\nResponse preview:\n',
        jsonText.slice(0, 2000)
      )

      throw new Error('Gemini returned invalid JSON.')
    }
  }
}

async function generateQuizWithGemini(
  lessonTitle: string,
  sourceText: string
): Promise<QuizQuestion[]> {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  const model = process.env.GEMINI_MODEL?.trim()

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing.')
  }

  if (!model) {
    throw new Error('GEMINI_MODEL is missing.')
  }

  const ai = new GoogleGenAI({ apiKey })

  const quizSchema = {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        minItems: TARGET_QUESTION_COUNT,
        maxItems: TARGET_QUESTION_COUNT,
        items: {
          type: 'object',
          properties: {
            question: {
              type: 'string',
              description:
                'سؤال تعليمي باللغة العربية الفصحى مستند إلى النص المصدر فقط.',
            },
            options: {
              type: 'array',
              minItems: 4,
              maxItems: 4,
              items: {
                type: 'string',
              },
              description:
                'أربعة بدائل عربية متقاربة ومنطقية، مع بديل صحيح واحد فقط.',
            },
            correctAnswerIndex: {
              type: 'integer',
              minimum: 0,
              maximum: 3,
              description:
                'فهرس البديل الصحيح داخل options، ويبدأ من صفر.',
            },
          },
          required: ['question', 'options', 'correctAnswerIndex'],
        },
      },
    },
    required: ['questions'],
  }

  const prompt = `
أنشئ اختبار اختيار من متعدد في مادة اللغة العربية للمرحلة الثانوية في الكويت.

عنوان الدرس: ${lessonTitle}

المطلوب:
- أنشئ ستة أسئلة فقط.
- اكتب جميع الأسئلة والبدائل باللغة العربية الفصحى السليمة.
- اجعل الأسئلة متنوعة بين الفهم والاستيعاب، واستنتاج الفكرة، ومعاني المفردات في سياقها، والتذوق الفني إن كان النص مناسبًا، والقيم أو الدروس المستفادة عند وجودها.
- استند إلى النص المصدر فقط، ولا تضف معلومات أو أسماء أو أحداثًا غير مذكورة فيه.
- لكل سؤال أربعة بدائل فقط، متقاربة في الصياغة ومنطقية.
- يجب أن تكون هناك إجابة صحيحة واحدة فقط لكل سؤال.
- لا تضع أرقامًا للأسئلة، ولا حروفًا مثل أ/ب/ج/د قبل البدائل.
- لا تكرر السؤال نفسه أو الفكرة نفسها.
- لا تستخدم عبارات مثل: جميع ما سبق، لا شيء مما سبق.
- اجعل مستوى الأسئلة مناسبًا لطلاب المرحلة الثانوية.
- أعد JSON فقط مطابقًا للمخطط المطلوب، دون مقدمة أو شرح أو Markdown.

النص المصدر:
---
${sourceText}
---
`.trim()

  console.log('generate-quiz: Gemini request started:', {
    model,
    lessonTitle,
    promptLength: prompt.length,
    sourceTextLength: sourceText.length,
    targetQuestionCount: TARGET_QUESTION_COUNT,
  })

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: quizSchema,
      temperature: 0.35,
      maxOutputTokens: 4096,
    },
  })

  const rawResponseText = extractGeminiResponseText(response)

  if (!rawResponseText) {
    console.error(
      'generate-quiz: Gemini returned no readable text:',
      JSON.stringify(getGeminiResponseDiagnostics(response), null, 2)
    )

    throw new Error(
      'Gemini returned an empty response. Check finishReason, promptFeedback, and safety diagnostics in the server logs.'
    )
  }

  const parsed = parseGeminiJsonResponse(rawResponseText)

  const questions = validateGeneratedQuestions(parsed)

  if (!questions || questions.length < 4) {
    console.error(
      'generate-quiz: Gemini returned insufficient valid questions:',
      JSON.stringify(parsed, null, 2).slice(0, 8000)
    )

    throw new Error('Gemini returned insufficient valid quiz questions.')
  }

  return questions
}

async function extractTextFromMaterial(
  material: SubjectMaterialFile
): Promise<{ sourceText: string; isPdf: boolean }> {
  if (!material.file_path) {
    throw new Error('Material file path is missing.')
  }

  const isDocx = isDocxFile(material)
  const isPdf = isPdfFile(material)

  if (!isDocx && !isPdf) {
    throw new Error('Unsupported material type.')
  }

  const { data: file, error: downloadError } = await supabaseAdmin.storage
    .from(MATERIALS_BUCKET)
    .download(material.file_path)

  if (downloadError || !file) {
    throw new Error(
      `Unable to download source material: ${downloadError?.message || 'unknown error'}`
    )
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer())

  const extractedText = isDocx
    ? await extractDocxText(fileBuffer)
    : await extractPdfText(fileBuffer)

  const sourceText = cleanText(extractedText).slice(0, MAX_SOURCE_TEXT_LENGTH)

  if (sourceText.length < 80) {
    throw new Error('Extracted source text is too short.')
  }

  return {
    sourceText,
    isPdf,
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params

  if (!projectId) {
    return jsonError('لم يتم تمرير معرّف المشروع في المسار.', 400)
  }

  try {
    const { data: project, error: projectError } = await supabaseAdmin
      .from('studio_projects')
      .select('id, title, output_type')
      .eq('id', projectId)
      .single<StudioProject>()

    if (projectError || !project) {
      console.error('generate-quiz: project fetch error:', projectError)
      return jsonError('تعذر العثور على المشروع.', 404)
    }

    if (project.output_type !== 'mcq_quiz') {
      return jsonError(
        'نوع الناتج لهذا المشروع ليس اختبار اختيار من متعدد.',
        400
      )
    }

    const { data: materialLinks, error: linksError } = await supabaseAdmin
      .from('studio_project_materials')
      .select('material_id')
      .eq('project_id', projectId)

    if (linksError) {
      console.error('generate-quiz: material links error:', linksError)

      return jsonError(
        'تعذر جلب ملفات المادة المرتبطة بالمشروع.',
        500
      )
    }

    const materialIds = (materialLinks as ProjectMaterialLink[] | null || [])
      .map((item) => item.material_id)
      .filter(Boolean)

    if (materialIds.length === 0) {
      return jsonError('لا يوجد ملف مصدر مرتبط بالمشروع.', 400)
    }

    const { data: materials, error: materialsError } = await supabaseAdmin
      .from('subject_material_files')
      .select('id, title, file_name, file_path, mime_type, is_active')
      .in('id', materialIds)
      .eq('is_active', true)

    if (materialsError) {
      console.error('generate-quiz: materials fetch error:', materialsError)

      return jsonError('تعذر جلب بيانات ملف المادة.', 500)
    }

    const availableMaterials =
      (materials as SubjectMaterialFile[] | null) || []

    const supportedMaterials = availableMaterials.filter(isSupportedMaterial)

    if (supportedMaterials.length === 0) {
      return jsonError(
        'لم يتم العثور على ملف Word أو PDF صالح داخل المشروع.',
        404
      )
    }

    const processingError = await setProjectStatus(projectId, 'processing')

    if (processingError) {
      return jsonError(
        'تعذر تحديث حالة المشروع إلى قيد المعالجة.',
        500
      )
    }

    let sourceText = ''
    let selectedMaterial: SubjectMaterialFile | null = null
    let isPdf = false
    const materialErrors: string[] = []

    for (const material of supportedMaterials) {
      try {
        const result = await extractTextFromMaterial(material)

        sourceText = result.sourceText
        selectedMaterial = material
        isPdf = result.isPdf
        break
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown extraction error'

        materialErrors.push(
          `${material.file_name || material.title || material.id}: ${message}`
        )
      }
    }

    if (!sourceText || !selectedMaterial) {
      console.error(
        'generate-quiz: all linked materials failed extraction:',
        materialErrors
      )

      await setProjectStatus(projectId, 'error')

      return jsonError(
        'تعذر استخراج نص صالح من ملفات المشروع. تأكد أن ملف PDF قابل للنسخ أو استخدم ملف Word DOCX.',
        400
      )
    }

    console.log('generate-quiz: source material selected:', {
      materialId: selectedMaterial.id,
      fileName: selectedMaterial.file_name,
      type: isPdf ? 'pdf' : 'docx',
      sourceTextLength: sourceText.length,
    })

    let questions: QuizQuestion[]

    try {
      questions = await generateQuizWithGemini(
        getCleanLessonTitle(project.title),
        sourceText
      )
    } catch (error) {
      console.error('generate-quiz: Gemini generation error:', error)
      await setProjectStatus(projectId, 'error')

      return jsonError(
        'تعذر توليد أسئلة الاختبار بالذكاء الاصطناعي. راجع سجل الخادم لمعرفة التفاصيل، ثم تحقق من إعدادات Gemini وحاول مرة أخرى.',
        502
      )
    }

    if (questions.length < 4) {
      await setProjectStatus(projectId, 'error')

      return jsonError(
        'تعذر تكوين عدد كافٍ من أسئلة الاختبار من النص الحالي.',
        400
      )
    }

    const quizTitle = `اختبار: ${getCleanLessonTitle(project.title)}`

    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('studio_quizzes')
      .upsert(
        {
          project_id: projectId,
          title: quizTitle,
          questions,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'project_id',
        }
      )
      .select('id, project_id, title, questions, created_at, updated_at')
      .single()

    if (quizError) {
      console.error('generate-quiz: quiz save error:', quizError)
      await setProjectStatus(projectId, 'error')

      return jsonError(
        'تم إعداد الأسئلة لكن تعذر حفظ الاختبار.',
        500
      )
    }

    const completedError = await setProjectStatus(projectId, 'completed')

    return NextResponse.json(
      {
        message: `تم إنشاء اختبار من ${
          isPdf ? 'ملف PDF' : 'ملف Word'
        } وحفظه بنجاح.`,
        projectId,
        quiz,
        warning: completedError
          ? 'تم حفظ الاختبار لكن تعذر تحديث حالة المشروع إلى مكتمل.'
          : null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('generate-quiz: unexpected error:', error)
    await setProjectStatus(projectId, 'error')

    return jsonError(
      'حدث خطأ غير متوقع أثناء إنشاء الاختبار.',
      500
    )
  }
}