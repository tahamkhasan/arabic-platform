import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, getServiceClient } from '@/lib/server/auth'
import { extractAllLessonTexts, type LessonExtractedTexts } from '@/lib/ai/extractLessonText'
import { getTemplate, type ArabicQuizType, type QuizSectionSpec } from '@/lib/ai/arabicQuizTemplates'

export const maxDuration = 300

// ══════════════════════════════════════════════════════════════
// app/api/quizzes/generate-arabic/route.ts
//
// ── مُعدَّل: استدعاءات متوازية (Promise.all) بدل استدعاء واحد ──
// كل قسم من أقسام الاختبار (فهم/بلاغة/نحو/تلخيص/تعبير) يُولَّد
// باستدعاء Anthropic مستقل، تُشغَّل جميعها بالتوازي.
//
// الفائدة:
//  - القصير (3 أقسام): ~20 ثانية بدل ~45 ثانية
//  - النهائي (5 أقسام، 25+ سؤال): ~25 ثانية بدل ~120 ثانية → لا 502
//
// كل استدعاء:
//  - max_tokens: 1500 (كافٍ لقسم واحد، يضمن عدم الاقتطاع)
//  - timeout: 55 ثانية (دون مهلة proxy البالغة 60 ثانية)
//  - يُرجع JSON لقسم واحد فقط، أسهل تحليلاً وأسرع توليداً
// ══════════════════════════════════════════════════════════════

// ── جلب نص النموذج الاحتذائي من إعدادات المنصة (key-value) ────
async function fetchTemplateText(quizType: ArabicQuizType): Promise<string | null> {
  try {
    const supabase = getServiceClient()
    const key = `${quizType}_quiz_template_text`
    const { data } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()
    const text = data?.value as string | null
    return text && text.trim().length > 50 ? text.trim() : null
  } catch {
    return null
  }
}
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const SECTION_TIMEOUT_MS = 55_000

interface GenerateArabicBody {
  quizType: ArabicQuizType
  lessonIds: string[]
  grade?: string
}

async function getUser(token: string) {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null
  const { data } = await supabaseAdmin
    .from('users').select('id, role, status').eq('id', user.id).single()
  if (!data || data.status !== 'approved') return null
  return data
}

function truncate(text: string | undefined, max = 800) {
  return text ? text.slice(0, max) : '(لا يوجد ملف مرفوع)'
}

function buildLessonsTextBlock(lessons: LessonExtractedTexts[]): string {
  return lessons.map((l, i) => [
    `### الدرس ${i + 1}: ${l.lessonName}`,
    `**الفهم والاستيعاب:**\n${truncate(l.comprehension)}`,
    `**الثروة اللغوية:**\n${truncate(l.tharwa)}`,
    `**البلاغة:**\n${truncate(l.balagha)}`,
    `**النحو:**\n${truncate(l.nahw)}`,
  ].join('\n\n')).join('\n\n---\n\n')
}

// ── تعليمات ثابتة لكل قسم — قواعد المعلم الدائمة ──────────────
const SECTION_RULES: Record<string, string> = {
  comprehension: `
## تعليمات إلزامية لأسئلة الفهم والاستيعاب والثروة اللغوية:

### النصوص المرجعية عند صياغة أسئلة الفهم:
- من النص القرآني: اختر 4 آيات بعينها.
- من النص النثري: اختر 5 أسطر متصلة.
- من القصيدة: اختر ما لا يقل عن 6 أبيات.
- يمكنك كتابة النص المرجعي كاملاً في السؤال، أو الاكتفاء بالإشارة الدقيقة إليه (رقم الآية / موضع الأسطر / أرقام الأبيات).

### محاور أسئلة الفهم الإلزامية:
1. المضمون: القيم والأفكار الرئيسية والدروس المستفادة من النص.
2. علاقات الجمل: اسأل عن علاقة جملة بما قبلها، والإجابة واحدة من: (نتيجة / تفصيل / إجمال / تعليل / تأكيد).
3. دلالات الألفاظ: اعتمد حصرياً على الكلمات الواردة في ملف الثروة اللغوية المرفق مع الدرس — لا تسأل عن كلمة غير واردة فيه.`,

  grammar: `
## تعليمات إلزامية لأسئلة النحو:
- في أسئلة الإعراب: ضع الكلمة أو العبارة المطلوب إعرابها بين قوسين () داخل الجملة، وصِغ السؤال دائماً بعبارة "أعرب ما بين القوسين" — لا تستخدم "ما تحته خط" إطلاقاً.
- استخرج الشواهد والجمل من نصوص الدروس المرفقة نفسها كلما أمكن.`,

  rhetoric: `
## تعليمات إلزامية لأسئلة البلاغة:
- الشواهد البلاغية تُستخرج من نصوص الدروس المقررة نفسها (القرآني/النثري/الشعري) — لا من خارجها.
- كل سؤال يطلب بيان أثر الصورة أو المحسّن في المعنى، لا مجرد التسمية.`,
}

// ── توليد قسم واحد باستدعاء مستقل ──────────────────────────────
async function generateSection(
  section: QuizSectionSpec,
  lessonsText: string,
  grade: string | undefined,
  quizType: ArabicQuizType,
  templateText: string | null   // ← نموذج احتذائي اختياري
): Promise<{ key: string; title: string; points: number; questions: unknown[] }> {

  // ── إضافة النموذج الاحتذائي إن وُجد ─────────────────────────
  const templateBlock = templateText
    ? `\n\n## نموذج اختبار سابق للاستئناس (اتبع أسلوبه وصياغته ومستواه):\n${templateText}\n---\nالآن أنشئ قسم "${section.title}" بنفس الأسلوب والصياغة، لكن بمحتوى مختلف مبني على الدروس أدناه.\n`
    : ''

  const systemPrompt = `أنت خبير في إعداد اختبارات اللغة العربية للمرحلة الثانوية وفق المنهج الكويتي.
مهمتك توليد قسم واحد فقط من اختبار "${quizType === 'final' ? 'نهاية الفصل' : 'قصير'}"، وهو قسم "${section.title}".
${grade ? `الصف الدراسي: ${grade}` : ''}${templateBlock}

## قواعد إلزامية:
1. ولّد بالضبط ${section.subQuestions.length} سؤال كما هو مُحدَّد — لا تزيد ولا تنقص.
2. اعتمد حصرياً على نصوص الدروس المرفقة — لا تخترع من خارجها.
3. أرجع JSON فقط، بلا أي نص تمهيدي أو علامات markdown.
${SECTION_RULES[section.key] ?? ''}

## صيغة الإخراج المطلوبة بالضبط:
{
  "key": "${section.key}",
  "title": "${section.title}",
  "points": ${section.defaultPoints},
  "questions": [
    {
      "id": "<معرّف فريد قصير مثل comp_1>",
      "type": "<short_answer | multiple_choice | essay>",
      "text": "<نص السؤال كاملاً>",
      "options": [{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."}],
      "correct_option_id": "<id الخيار الصحيح>",
      "points": <رقم>,
      "model_answer": "<إجابة نموذجية أو معيار تصحيح>"
    }
  ]
}
ملاحظة: حقلا "options" و"correct_option_id" يُضافان فقط للنوع multiple_choice وإلا يُحذفان.

## الأسئلة الفرعية المطلوبة بالضبط (${section.subQuestions.length} أسئلة):
${section.subQuestions.map((sq, i) => `${i + 1}. ${sq}`).join('\n')}`

  const userPrompt = `## محتوى الدروس المقررة:\n\n${lessonsText}`

  const controller = new AbortController()
  const timeoutId  = setTimeout(() => controller.abort(), SECTION_TIMEOUT_MS)

  try {
    const apiRes = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-5',
        // 4000 لكل قسم — الأقسام تعمل بالتوازي لذا الوقت الإجمالي
        // يساوي وقت أبطأ قسم وليس المجموع (~20-25 ثانية)
        max_tokens: 4000,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: userPrompt }],
      }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const apiData = await apiRes.json()
    if (!apiRes.ok) throw new Error(apiData.error?.message || 'Anthropic API error')

    const rawText = apiData.content?.[0]?.text || '{}'
    const cleaned = rawText.replace(/```json|```/g, '').trim()

    let parsed: any
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      // ── محاولة إصلاح JSON المقتطع (قد يحدث إن اكتملت التوكنز) ──
      // نحاول إغلاق كل الأقواس المفتوحة لاستعادة ما تم توليده
      let repaired = cleaned
      // أغلق السلاسل المفتوحة
      const quoteCount = (repaired.match(/"/g) || []).length
      if (quoteCount % 2 !== 0) repaired += '"'
      // أغلق الكائنات والمصفوفات المفتوحة
      const opens: Record<string, string> = { '{': '}', '[': ']' }
      const stack: string[] = []
      for (const ch of repaired) {
        if (ch === '{' || ch === '[') stack.push(opens[ch])
        else if (ch === '}' || ch === ']') stack.pop()
      }
      repaired += stack.reverse().join('')
      try {
        parsed = JSON.parse(repaired)
        console.warn(`قسم "${section.key}" جرى إصلاح JSON المقتطع — بعض الأسئلة قد تكون ناقصة.`)
      } catch {
        console.error(`قسم "${section.key}" — JSON غير قابل للإصلاح:\n`, cleaned.slice(0, 500))
        throw new Error(`تعذّر تحليل رد قسم "${section.title}" — زِد max_tokens أو أعد المحاولة.`)
      }
    }

    // ضمان وجود الحقول الأساسية
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error(`القسم "${section.title}" لم يُرجع مصفوفة أسئلة صالحة.`)
    }

    return {
      key:       parsed.key       ?? section.key,
      title:     parsed.title     ?? section.title,
      points:    parsed.points    ?? section.defaultPoints,
      questions: parsed.questions,
    }
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (err?.name === 'AbortError') {
      throw new Error(`انتهت مهلة توليد قسم "${section.title}" — حاول مرة أخرى.`)
    }
    throw err
  }
}

// ══════════════════════════════════════════════════════════════
// POST
// ══════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? null
  if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const userData = await getUser(token)
  if (!userData) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  if (userData.role !== 'teacher' && userData.role !== 'admin') {
    return NextResponse.json({ error: 'هذه الميزة للمعلمين فقط' }, { status: 403 })
  }

  try {
    const body = (await req.json()) as GenerateArabicBody
    const { quizType, lessonIds, grade } = body

    if (quizType !== 'short' && quizType !== 'final') {
      return NextResponse.json({ error: 'نوع الاختبار يجب أن يكون short أو final.' }, { status: 400 })
    }
    if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
      return NextResponse.json({ error: 'يجب اختيار درس واحد على الأقل.' }, { status: 400 })
    }

    const expectedCount = quizType === 'short' ? 2 : 5
    if (lessonIds.length !== expectedCount) {
      return NextResponse.json({
        error: quizType === 'short'
          ? `الاختبار القصير يتطلب درسين بالضبط (تم اختيار ${lessonIds.length}).`
          : `اختبار نهاية الفصل يتطلب خمسة دروس بالضبط (تم اختيار ${lessonIds.length}).`,
      }, { status: 400 })
    }

    // ── جلب بيانات الدروس ─────────────────────────────────────
    const { data: lessonRows, error: lessonsError } = await supabaseAdmin
      .from('lessons')
      .select('id, name, comprehension_file_url, tharwa_file_url, balagha_file_url, nahw_file_url')
      .in('id', lessonIds)

    if (lessonsError) return NextResponse.json({ error: lessonsError.message }, { status: 500 })
    if (!lessonRows || lessonRows.length !== lessonIds.length) {
      return NextResponse.json({ error: 'تعذر العثور على بعض الدروس المختارة.' }, { status: 404 })
    }

    const orderedLessons = lessonIds
      .map(id => lessonRows.find(l => l.id === id))
      .filter(Boolean) as typeof lessonRows

    // ── التحقق من اكتمال الملفات ──────────────────────────────
    const missingFiles: string[] = []
    for (const l of orderedLessons) {
      if (!l.comprehension_file_url) missingFiles.push(`${l.name}: فهم واستيعاب`)
      if (!l.tharwa_file_url)        missingFiles.push(`${l.name}: ثروة لغوية`)
      if (!l.balagha_file_url)       missingFiles.push(`${l.name}: بلاغة`)
      if (!l.nahw_file_url)          missingFiles.push(`${l.name}: نحو`)
    }
    if (missingFiles.length > 0) {
      return NextResponse.json({
        error: 'بعض الدروس تفتقد ملفات مطلوبة. أكمل رفعها أولاً ثم أعد المحاولة.',
        missingFiles,
      }, { status: 422 })
    }

    // ── استخراج النصوص من الملفات بالتوازي ───────────────────
    const [extractedLessons, templateText] = await Promise.all([
      Promise.all(orderedLessons.map(l => extractAllLessonTexts(l))),
      fetchTemplateText(quizType),   // ← جلب النموذج الاحتذائي بالتوازي
    ])
    const lessonsTextBlock = buildLessonsTextBlock(extractedLessons)

    if (templateText) {
      console.log(`✅ نموذج احتذائي (${quizType}) مُحمَّل — ${templateText.length} حرف`)
    } else {
      console.log(`ℹ️ لا يوجد نموذج احتذائي (${quizType}) — سيُولَّد بالقالب الافتراضي`)
    }

    // ── توليد كل قسم باستدعاء مستقل — جميعها بالتوازي ──────────
    const template = getTemplate(quizType)

    const sectionResults = await Promise.all(
      template.sections.map(section =>
        generateSection(section, lessonsTextBlock, grade, quizType, templateText)
      )
    )

    const quizDraft = {
      quiz_type: quizType,
      sections:  sectionResults,
    }

    return NextResponse.json({
      quiz:        quizDraft,
      lessonsUsed: orderedLessons.map(l => ({ id: l.id, name: l.name })),
    })

  } catch (err: any) {
    console.error('POST /api/quizzes/generate-arabic error:', err)
    return NextResponse.json({
      error: err?.message || 'حدث خطأ أثناء توليد الاختبار.',
    }, { status: 500 })
  }
}