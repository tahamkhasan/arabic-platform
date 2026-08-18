import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

const MATERIALS_BUCKET = 'materials'
const MAX_SOURCE_TEXT_LENGTH = 24000

type StudioProject = {
  id: string
  title: string | null
  output_type: string | null
  source_type: string | null
  status: string | null
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

type SentenceCandidate = {
  text: string
  score: number
}

const ARABIC_STOP_WORDS = new Set([
  'هذا',
  'هذه',
  'ذلك',
  'تلك',
  'الذي',
  'التي',
  'الذين',
  'اللذين',
  'اللاتي',
  'اللواتي',
  'على',
  'إلى',
  'من',
  'في',
  'عن',
  'مع',
  'ثم',
  'قد',
  'كان',
  'كانت',
  'يكون',
  'تكون',
  'أن',
  'إن',
  'لا',
  'ما',
  'لم',
  'لن',
  'هو',
  'هي',
  'هم',
  'هن',
  'كما',
  'بعد',
  'قبل',
  'بين',
  'كل',
  'أي',
  'أو',
  'وهو',
  'وهي',
  'ضمن',
  'عند',
  'حتى',
  'حيث',
  'فإن',
  'فقد',
  'وقد',
  'لكن',
  'غير',
  'إلا',
  'إذا',
  'إذ',
  'به',
  'بها',
  'له',
  'لها',
  'عليه',
  'عليها',
  'فيه',
  'فيها',
  'منه',
  'منها',
  'عنه',
  'عنها',
  'إليه',
  'إليها',
  'عليهم',
  'عليهن',
])

const VALUE_WORDS = [
  'الله',
  'الإيمان',
  'الإخلاص',
  'الصدق',
  'الأمانة',
  'الرحمة',
  'الصبر',
  'الشكر',
  'التعاون',
  'الإحسان',
  'العفو',
  'العدل',
  'الكرم',
  'التواضع',
  'الوفاء',
  'البر',
  'الخير',
  'التقوى',
  'المحبة',
  'العلم',
  'العمل',
  'المسؤولية',
]

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function getFileExtension(fileName: string | null): string {
  if (!fileName || !fileName.includes('.')) {
    return ''
  }

  return fileName.split('.').pop()?.trim().toLowerCase() || ''
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

function getCleanLessonTitle(projectTitle: string | null): string {
  const rawTitle = (projectTitle || 'الدرس').trim()

  return (
    rawTitle
      .replace(/^ملخص\s+(الدرس|درس)\s*[:：-]?\s*/i, '')
      .replace(/^درس\s*[:：-]?\s*/i, '')
      .trim() || 'الدرس'
  )
}

function normalizeArabicWord(value: string): string {
  return value
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ًٌٍَُِّْـ]/g, '')
    .trim()
}

function getWords(value: string): string[] {
  return cleanText(value)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3)
}

function getKeywords(text: string, maximum = 8): string[] {
  const counts = new Map<string, { original: string; count: number }>()

  for (const word of getWords(text)) {
    const normalized = normalizeArabicWord(word)

    if (
      normalized.length < 4 ||
      ARABIC_STOP_WORDS.has(normalized) ||
      /^\d+$/.test(normalized)
    ) {
      continue
    }

    const current = counts.get(normalized)

    counts.set(normalized, {
      original: current?.original || word,
      count: (current?.count || 0) + 1,
    })
  }

  return [...counts.values()]
    .sort((first, second) => {
      if (second.count !== first.count) {
        return second.count - first.count
      }

      return first.original.localeCompare(second.original, 'ar')
    })
    .slice(0, maximum)
    .map((item) => item.original)
}

function splitIntoSentences(text: string): string[] {
  return cleanText(text)
    .split(/\n+|(?<=[.!؟])\s+/u)
    .map((item) => item.trim())
    .filter((item) => item.length >= 24)
    .filter((item) => item.length <= 260)
    .filter((item) => !/^(page|صفحة)\s*\d+/iu.test(item))
    .filter((item) => !/^\d+$/u.test(item))
    .filter((item) => !/^[-–—]/u.test(item))
}

function isDialogueLikeSentence(sentence: string): boolean {
  const dialogueSignals = [
    'قال',
    'قلت',
    'يقول',
    'فقال',
    'فقلت',
    'فقالوا',
    'قالوا',
    'فقالت',
    'يا ',
    'أيها',
  ]

  const matches = dialogueSignals.filter((signal) =>
    sentence.includes(signal)
  ).length

  return matches >= 2 || (sentence.includes('قال') && sentence.includes(':'))
}

function rankSentences(text: string, keywords: string[]): SentenceCandidate[] {
  const sentences = splitIntoSentences(text)
  const normalizedKeywords = keywords.map(normalizeArabicWord)

  return sentences
    .filter((sentence) => !isDialogueLikeSentence(sentence))
    .map((sentence, index) => {
      const normalizedSentence = normalizeArabicWord(sentence)

      const keywordScore = normalizedKeywords.reduce(
        (total, keyword) =>
          normalizedSentence.includes(keyword) ? total + 3 : total,
        0
      )

      const positionScore = index < 4 ? 3 : index < 10 ? 1 : 0
      const lengthScore =
        sentence.length >= 60 && sentence.length <= 180 ? 3 : 1

      const valueScore = VALUE_WORDS.some((value) =>
        normalizedSentence.includes(normalizeArabicWord(value))
      )
        ? 2
        : 0

      return {
        text: sentence,
        score: keywordScore + positionScore + lengthScore + valueScore,
      }
    })
    .sort((first, second) => second.score - first.score)
}

function selectKeyIdeas(text: string, keywords: string[]): string[] {
  const ranked = rankSentences(text, keywords)
  const selected: string[] = []

  for (const item of ranked) {
    const isSimilar = selected.some((existing) => {
      const existingWords = new Set(
        getWords(existing).map(normalizeArabicWord)
      )

      const currentWords = getWords(item.text).map(normalizeArabicWord)

      const overlap = currentWords.filter((word) =>
        existingWords.has(word)
      ).length

      return overlap >= Math.min(5, Math.ceil(currentWords.length * 0.5))
    })

    if (!isSimilar) {
      selected.push(item.text)
    }

    if (selected.length === 4) {
      break
    }
  }

  return selected
}

function getValues(text: string): string[] {
  const normalizedText = normalizeArabicWord(text)

  return VALUE_WORDS.filter((value) =>
    normalizedText.includes(normalizeArabicWord(value))
  ).slice(0, 5)
}

function createGeneralIdea(
  projectTitle: string | null,
  ideas: string[],
  keywords: string[]
): string {
  const lessonTitle = getCleanLessonTitle(projectTitle)
  const mainTopic = keywords.slice(0, 3).join('، ')

  if (mainTopic) {
    return `يتناول درس «${lessonTitle}» موضوع ${mainTopic}، ويعرض أفكاره بأسلوب يساعد المتعلم على فهم المعاني واستخلاص الدروس والقيم المرتبطة بها.`
  }

  if (ideas[0]) {
    return `يتناول درس «${lessonTitle}» موضوعًا تربويًا وفكريًا، ويعرض أبرز معانيه بما يعين المتعلم على فهم النص واستخلاص ما يتضمنه من دروس وقيم.`
  }

  return `يتناول درس «${lessonTitle}» موضوعًا تعليميًا يهدف إلى تنمية الفهم والتحليل واستخلاص القيم من النص.`
}

function createVocabulary(keywords: string[]): string {
  if (keywords.length === 0) {
    return 'يُراجع المتعلم مفردات النص وتراكيبه، ويستنتج دلالاتها من السياق.'
  }

  return keywords
    .slice(0, 6)
    .map((word) => `- ${word}: تُفهم دلالتها من سياق النص.`)
    .join('\n')
}

function createReviewQuestions(
  projectTitle: string | null,
  keywords: string[],
  values: string[]
): string[] {
  const lessonTitle = getCleanLessonTitle(projectTitle)
  const firstKeyword = keywords[0] || 'الفكرة الرئيسة'
  const secondKeyword = keywords[1] || 'المعاني الواردة'
  const firstValue = values[0] || 'القيمة التربوية'

  return [
    `ما الفكرة العامة التي يعرضها درس «${lessonTitle}»؟`,
    `كيف أسهمت فكرة «${firstKeyword}» في بناء معنى النص؟`,
    `استخرج من النص ما يدل على «${secondKeyword}».`,
    `ما ${firstValue} التي تستفيدها من النص؟`,
  ]
}

function buildSummaryFromSource(
  projectTitle: string | null,
  sourceText: string,
  fileTitle: string | null
): string {
  const lessonTitle = getCleanLessonTitle(projectTitle)
  const cleanedSource = cleanText(sourceText)
  const keywords = getKeywords(cleanedSource)
  const keyIdeas = selectKeyIdeas(cleanedSource, keywords)
  const values = getValues(cleanedSource)
  const generalIdea = createGeneralIdea(projectTitle, keyIdeas, keywords)
  const sourceLabel = fileTitle?.trim() || 'ملف المادة المرتبط بالمشروع'

  const keyIdeasSection =
    keyIdeas.length > 0
      ? keyIdeas.map((idea) => `- ${idea}`).join('\n')
      : `- قراءة النص قراءة واعية وربط عنوانه بمضمونه.
- تحديد الأفكار الرئيسة وتسلسلها.
- استنتاج القيم والمعاني الواردة في النص.`

  const valuesSection =
    values.length > 0
      ? values.map((value) => `- الدعوة إلى ${value}.`).join('\n')
      : `- التأمل في معاني النص واستخلاص العبرة.
- تطبيق القيم الإيجابية في الحياة اليومية.`

  const questionsSection = createReviewQuestions(
    projectTitle,
    keywords,
    values
  )
    .map((question, index) => `${index + 1}. ${question}`)
    .join('\n')

  return `ملخص درس: ${lessonTitle}

أولًا: الفكرة العامة
${generalIdea}

ثانيًا: الأفكار الرئيسة
${keyIdeasSection}

ثالثًا: القيم والاتجاهات
${valuesSection}

رابعًا: مفردات ومحاور مهمة
${createVocabulary(keywords)}

خامسًا: أسئلة للمراجعة
${questionsSection}

مصدر الملخص: ${sourceLabel}`
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
    console.error(`generate-summary: ${status} status update error:`, error)
  }

  return error
}

async function extractDocxText(fileBuffer: Buffer): Promise<string> {
  const extraction = await mammoth.extractRawText({
    buffer: fileBuffer,
  })

  return extraction.value
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

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params

  if (!projectId) {
    return jsonError('لم يتم تمرير معرّف المشروع في المسار.', 400)
  }

  try {
    const { data: project, error: projectError } = await supabaseAdmin
      .from('studio_projects')
      .select('id, title, output_type, source_type, status')
      .eq('id', projectId)
      .single<StudioProject>()

    if (projectError) {
      console.error('generate-summary: project fetch error:', projectError)

      return jsonError('تعذر جلب المشروع قبل توليد الملخص.', 500)
    }

    if (!project) {
      return jsonError('المشروع غير موجود.', 404)
    }

    if (project.output_type !== 'lesson_summary') {
      return jsonError(
        'نوع الناتج لهذا المشروع ليس ملخص درس، لذلك لا يمكن تشغيل مولد الملخص.',
        400
      )
    }

    const { data: materialLinks, error: linksError } = await supabaseAdmin
      .from('studio_project_materials')
      .select('material_id')
      .eq('project_id', projectId)

    if (linksError) {
      console.error('generate-summary: project material links error:', linksError)

      return jsonError('تعذر جلب ملفات المادة المرتبطة بالمشروع.', 500)
    }

    const materialIds = (materialLinks as ProjectMaterialLink[] | null || [])
      .map((link) => link.material_id)
      .filter(Boolean)

    if (materialIds.length === 0) {
      return jsonError(
        'لا يوجد ملف مصدر مرتبط بهذا المشروع. أنشئ مشروعًا جديدًا بعد اختيار ملف Word أو PDF.',
        400
      )
    }

    const { data: materials, error: materialsError } = await supabaseAdmin
      .from('subject_material_files')
      .select('id, title, file_name, file_path, mime_type, is_active')
      .in('id', materialIds)
      .eq('is_active', true)

    if (materialsError) {
      console.error('generate-summary: materials fetch error:', materialsError)

      return jsonError('تعذر جلب بيانات ملفات المادة.', 500)
    }

    const availableMaterials = (materials as SubjectMaterialFile[] | null || [])

    const material =
      availableMaterials.find(isDocxFile) ||
      availableMaterials.find(isPdfFile) ||
      availableMaterials.find((item) => Boolean(item.file_path))

    if (!material || !material.file_path) {
      return jsonError(
        'لم يتم العثور على ملف مصدر نشط صالح للقراءة داخل المشروع.',
        404
      )
    }

    const isDocx = isDocxFile(material)
    const isPdf = isPdfFile(material)

    if (!isDocx && !isPdf) {
      return jsonError(
        `صيغة الملف الحالي (${material.file_name || 'غير معروف'}) غير مدعومة. استخدم Word DOCX أو PDF.`,
        400
      )
    }

    const processingError = await setProjectStatus(projectId, 'processing')

    if (processingError) {
      return jsonError('تعذر تحديث حالة المشروع إلى قيد المعالجة.', 500)
    }

    const { data: downloadedFile, error: downloadError } =
      await supabaseAdmin.storage
        .from(MATERIALS_BUCKET)
        .download(material.file_path)

    if (downloadError || !downloadedFile) {
      console.error('generate-summary: source download error:', downloadError)

      await setProjectStatus(projectId, 'error')

      return jsonError('تعذر تنزيل ملف المادة من مساحة التخزين.', 500)
    }

    const arrayBuffer = await downloadedFile.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    let extractedText = ''

    try {
      extractedText = isDocx
        ? await extractDocxText(fileBuffer)
        : await extractPdfText(fileBuffer)
    } catch (extractionError) {
      console.error('generate-summary: text extraction error:', extractionError)

      await setProjectStatus(projectId, 'error')

      return jsonError(
        'تعذر استخراج النص من الملف. تأكد أن PDF غير محمي ويحتوي نصًا قابلًا للتحديد، أو استخدم ملف Word DOCX.',
        400
      )
    }

    const sourceText = cleanText(extractedText).slice(
      0,
      MAX_SOURCE_TEXT_LENGTH
    )

    if (sourceText.length < 80) {
      await setProjectStatus(projectId, 'error')

      const fileTypeLabel = isPdf ? 'ملف PDF' : 'ملف Word'

      return jsonError(
        `تعذر استخراج نص كافٍ من ${fileTypeLabel}. تأكد أن الملف يحتوي نصًا قابلًا للنسخ وليس صورًا ممسوحة فقط.`,
        400
      )
    }

    const summaryText = buildSummaryFromSource(
      project.title,
      sourceText,
      material.title || material.file_name
    )

    const { data: summary, error: summaryError } = await supabaseAdmin
      .from('studio_summaries')
      .upsert(
        {
          project_id: projectId,
          content: summaryText,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'project_id',
        }
      )
      .select('id, project_id, content, created_at, updated_at')
      .single()

    if (summaryError) {
      console.error('generate-summary: save summary error:', summaryError)

      await setProjectStatus(projectId, 'error')

      return jsonError('تم استخراج النص لكن تعذر حفظ الملخص.', 500)
    }

    const completedError = await setProjectStatus(projectId, 'completed')

    if (completedError) {
      return NextResponse.json(
        {
          message:
            'تم حفظ الملخص المستخرج من الملف، لكن تعذر تحديث حالة المشروع إلى مكتمل.',
          projectId,
          summary,
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        message: `تم استخراج النص من ملف ${
          isPdf ? 'PDF' : 'Word'
        } وتوليد ملخص الدرس وحفظه بنجاح.`,
        projectId,
        source: {
          materialId: material.id,
          title: material.title,
          fileName: material.file_name,
          fileType: isPdf ? 'pdf' : 'docx',
        },
        summary,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('generate-summary: unexpected error:', error)

    await setProjectStatus(projectId, 'error')

    return jsonError('حدث خطأ غير متوقع أثناء توليد ملخص الدرس.', 500)
  }
}