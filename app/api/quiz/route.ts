import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { extractLessonFileText } from '@/lib/ai/extractLessonText'

interface Question {
  id:          number
  type:        'multiple' | 'truefalse' | 'fill'
  question:    string
  options?:    string[]
  correct:     string | number | boolean
  explanation: string
}

interface QuizData {
  title:     string
  questions: Question[]
}

export async function POST(req: NextRequest) {
  try {
    const { lessonId, lessonName, material, grade, count = 8 } = await req.json()

    if (!lessonName) {
      return NextResponse.json({ error: 'اسم الدرس مطلوب' }, { status: 400 })
    }

    // ── جديد: إن لم تصل مادة نصية (شائع الآن لدروس اللغة العربية،
    // التي تخزّن محتواها في ملف "فهم واستيعاب" المرفوع بدل حقل
    // content القديم)، نجلب الدرس من قاعدة البيانات ونستخرج نص
    // ملف الفهم والاستيعاب تلقائياً ليكون المادة المرجعية الفعلية.
    // بدون هذا، يولّد الذكاء الاصطناعي أسئلة من معرفته العامة عن
    // الموضوع كاملاً بدل الالتزام بالجزء المقرر فقط. ─────────────
    let finalMaterial = typeof material === 'string' ? material.trim() : ''

    if (!finalMaterial && lessonId) {
      const { data: lessonRow } = await supabaseAdmin
        .from('lessons')
        .select('comprehension_file_url, content')
        .eq('id', lessonId)
        .maybeSingle()

      if (lessonRow?.comprehension_file_url) {
        const extracted = await extractLessonFileText(lessonRow.comprehension_file_url)
        if (extracted && !extracted.startsWith('[')) {
          finalMaterial = extracted
        }
      }
      if (!finalMaterial && lessonRow?.content) {
        finalMaterial = String(lessonRow.content).trim()
      }
    }

    const systemPrompt = `أنت أستاذ لغة عربية متخصص تصمم اختبارات تفاعلية.
يجب أن ترد بـ JSON فقط — لا نص قبله ولا بعده ولا backticks.

صمّم اختباراً من ${count} أسئلة للصف ${grade || ''} حول: "${lessonName}"
${finalMaterial ? `\n══ المادة العلمية المرجعية (الأولوية القصوى) ══\n${finalMaterial.slice(0, 6000)}\n══════════════════════════════════\n` : ''}

⚠️ قواعد صارمة:
1. التزم حصراً بالجزء المقرر الوارد في "المادة العلمية المرجعية" أعلاه — لا تتجاوزه إلى أي محتوى آخر (مثلاً: إن كانت المادة آيات محددة من سورة، لا تسأل عن آيات أخرى من نفس السورة غير واردة في المادة).
2. التعريفات والأمثلة تُؤخذ حرفياً من المادة العلمية المرفقة فقط
3. لا تستخدم معرفتك العامة لتوسيع نطاق المحتوى — المادة المرفقة هي المصدر الوحيد والحدود القصوى
4. إذا لم تجد معلومة في المادة — لا تخترعها، ولا تستعض عنها بمعرفة عامة عن الموضوع
5. التعريفات دقيقة علمياً كما وردت في المادة
6. الأسئلة بالعربية الفصحى السليمة
7. تنوع في الأنواع: multiple، truefalse، fill
8. الأسئلة مرتبة من السهل للصعب

أعد JSON بهذا الشكل بالضبط:
{
  "title": "اختبار ذاتي: [اسم الدرس]",
  "questions": [
    {
      "id": 1,
      "type": "multiple",
      "question": "نص السؤال؟",
      "options": ["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"],
      "correct": 0,
      "explanation": "شرح مستند للمادة العلمية المرفقة"
    },
    {
      "id": 2,
      "type": "truefalse",
      "question": "عبارة للحكم عليها",
      "correct": true,
      "explanation": "سبب مستند للمادة العلمية"
    },
    {
      "id": 3,
      "type": "fill",
      "question": "أكمل: النعت هو ___",
      "correct": "تابع يبين صفة من صفات المتبوع",
      "explanation": "التعريف كما ورد في المادة العلمية"
    }
  ]
}

ملاحظة: في الاختيار المتعدد، correct هو رقم index الإجابة الصحيحة (0-3)`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:       'claude-sonnet-4-5',
        max_tokens:  3000,
        temperature: 0.2,
        system:      systemPrompt,
        messages:    [{ role: 'user', content: 'أنشئ الاختبار الآن' }],
      }),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'خطأ في Claude API')

    const rawText = data.content?.[0]?.text ?? '{}'
    const clean   = rawText.replace(/```json|```/g, '').trim()

    let quiz: QuizData
    try {
      quiz = JSON.parse(clean)
    } catch {
      const match = clean.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('لم يُعد الذكاء الاصطناعي JSON صحيحاً')
      quiz = JSON.parse(match[0])
    }

    if (!quiz.questions || !Array.isArray(quiz.questions)) {
      throw new Error('بنية الاختبار غير صحيحة')
    }

    return NextResponse.json({ quiz })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}