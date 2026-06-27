import { NextRequest, NextResponse } from 'next/server'
import { generateWithGemini } from '@/lib/gemini'
import { buildSystemPrompt } from '@/lib/ai/prompts'
import { injectNahwRules } from '@/lib/ai/prompts/nahw'
import { supabaseAdmin } from '@/lib/supabase-admin'

// ──────────────────────────────────────────────────────────────
// app/api/quizzes/generate/route.ts (جديد)
//
// POST: توليد مسودة أسئلة اختبار بالذكاء الاصطناعي — لا تُحفَظ في
// قاعدة البيانات هنا، فقط تُرجَع للواجهة لمراجعة المعلم وتعديلها،
// ثم تُحفَظ عبر PATCH /api/quizzes/[id] (action: add_questions)
// تمامًا كأسئلة المحرر اليدوي — نفس المسار النهائي لكليهما.
//
// يدمج: buildSystemPrompt من lib/ai/prompts/index.ts (المصمَّم
// لإرجاع JSON منظَّم مطابق لـquestionSchema) + injectNahwRules
// عند طلب المعلم صريحاً (لا تلقائياً) + generateWithGemini من
// lib/gemini.ts (الاتصال الفعلي بـClaude، نفس المُستخدَم في /generate)
// ──────────────────────────────────────────────────────────────

type QuestionDistribution = Record<string, number>
type BloomLevels = Record<string, number>
type DifficultyLevels = { easy: number; medium: number; hard: number }

interface GenerateBody {
  lessonId?: string
  lessonName?: string
  material?: string
  grade?: string
  subjectName?: string
  questionDistribution: QuestionDistribution
  bloomLevels?: BloomLevels
  difficulty?: DifficultyLevels
  includeNahwRules?: boolean
  nahwTopics?: string[]
}

async function getUser(token: string) {
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return null
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('id, role, status')
    .eq('id', user.id)
    .single()
  if (!userData || userData.status !== 'approved') return null
  return userData
}

function totalQuestions(dist: QuestionDistribution): number {
  return Object.values(dist).reduce((sum, n) => sum + (n || 0), 0)
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const userData = await getUser(token)
  if (!userData) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  if (userData.role !== 'teacher' && userData.role !== 'admin') {
    return NextResponse.json({ error: 'هذه الميزة للمعلمين فقط' }, { status: 403 })
  }

  try {
    const body = (await req.json()) as GenerateBody
    const {
      lessonName, material, grade,
      questionDistribution, bloomLevels, difficulty,
      includeNahwRules, nahwTopics,
    } = body

    const count = totalQuestions(questionDistribution || {})
    if (count === 0) {
      return NextResponse.json({ error: 'حدّد عدد أسئلة لنوع واحد على الأقل.' }, { status: 400 })
    }
    if (count > 8) {
      return NextResponse.json(
        { error: 'الحد الأقصى 8 أسئلة في كل عملية توليد — لطلبات أكبر، وزّع التوليد على عدة مرات لضمان جودة الأسئلة واستقرار الاستجابة.' },
        { status: 400 },
      )
    }

    // ── بناء System Prompt من المكتبة المتخصصة ──────────────────
    // subject='general' بدل قيمة عربية ثابتة — المنصّة تدعم مواد
    // متعدّدة، واسم المادة الفعلي يُمرَّر عبر subjectName ──────────
    let systemPrompt = buildSystemPrompt({
      task: 'generate_quiz',
      subject: includeNahwRules ? 'nahw' : 'general',
      subjectName: includeNahwRules ? undefined : (body.subjectName || 'المادة الدراسية'),
      lessonTitle: lessonName,
      grade,
      difficulty: difficulty
        ? (Object.entries(difficulty).sort((a, b) => b[1] - a[1])[0]?.[0] as 'easy' | 'medium' | 'hard' | undefined)
        : undefined,
    })

    // ── حقن توزيع الأسئلة الدقيق + مستويات بلوم (طلب المعلم) ──────
    systemPrompt += `\n\n## التوزيع المطلوب بدقة (يجب التطابق التام):\n`
    systemPrompt += `### عدد الأسئلة حسب النوع:\n`
    for (const [type, n] of Object.entries(questionDistribution)) {
      if (n > 0) systemPrompt += `- ${type}: ${n} سؤال\n`
    }
    if (bloomLevels && Object.values(bloomLevels).some(n => n > 0)) {
      systemPrompt += `\n### توزيع مستويات بلوم المعرفية:\n`
      for (const [level, n] of Object.entries(bloomLevels)) {
        if (n > 0) systemPrompt += `- ${level}: ${n} سؤال\n`
      }
      systemPrompt += `حدّد حقل bloom_level لكل سؤال يطابق توزيعه أعلاه.\n`
    }
    systemPrompt += `\n**الإجمالي المطلوب: ${count} سؤال بالضبط — لا أكثر ولا أقل.**\n`

    // ── حقن قواعد النحو فقط إن طلب المعلم صريحاً ──────────────────
    if (includeNahwRules) {
      systemPrompt += injectNahwRules(nahwTopics)
    }

    const userPrompt = material?.trim()
      ? `الدرس: ${lessonName ?? ''}\n\nالمادة العلمية:\n${material.trim()}`
      : `الدرس: ${lessonName ?? ''} (لا توجد مادة علمية مرفقة — استخدم معرفتك العلمية الموثوقة بحذر)`

    const rawResult = await generateWithGemini(systemPrompt, userPrompt)

    // ── تحليل JSON من رد الذكاء الاصطناعي ─────────────────────────
    let questions: unknown
    try {
      const cleaned = rawResult.replace(/```json|```/g, '').trim()
      questions = JSON.parse(cleaned)
    } catch {
      // ── جديد: تسجيل الرد الخام كاملاً في طرفية السيرفر للتشخيص —
      // بلا هذا، يستحيل معرفة أين انحرف رد الذكاء الاصطناعي عن
      // صيغة JSON الصارمة المطلوبة. ────────────────────────────────
      console.error('AI raw response (failed JSON parse):\n', rawResult)
      return NextResponse.json(
        { error: 'تعذّر تحليل رد الذكاء الاصطناعي كـJSON صالح. حاول مرة أخرى.' },
        { status: 502 },
      )
    }

    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'رد الذكاء الاصطناعي لم يكن قائمة أسئلة كما هو متوقَّع.' },
        { status: 502 },
      )
    }

    return NextResponse.json({ questions })
  } catch (err) {
    console.error('POST /api/quizzes/generate error:', err)
    return NextResponse.json({ error: 'حدث خطأ أثناء توليد الأسئلة.' }, { status: 500 })
  }
}