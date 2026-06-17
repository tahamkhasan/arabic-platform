import { NextRequest, NextResponse } from 'next/server'

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
    const { lessonName, material, grade, count = 8 } = await req.json()

    if (!lessonName) {
      return NextResponse.json({ error: 'اسم الدرس مطلوب' }, { status: 400 })
    }

    const systemPrompt = `أنت أستاذ لغة عربية متخصص تصمم اختبارات تفاعلية.
يجب أن ترد بـ JSON فقط — لا نص قبله ولا بعده ولا backticks.

صمّم اختباراً من ${count} أسئلة للصف ${grade || ''} حول: "${lessonName}"
${material ? `\n══ المادة العلمية المرجعية (الأولوية القصوى) ══\n${material.slice(0, 2000)}\n══════════════════════════════════\n` : ''}

⚠️ قواعد صارمة:
1. التعريفات تُؤخذ حرفياً من المادة العلمية المرفقة فقط
2. لا تستخدم معرفتك العامة — المادة المرفقة هي المصدر الوحيد
3. إذا لم تجد معلومة في المادة — لا تخترعها
4. التعريفات دقيقة علمياً كما وردت في المادة
5. الأسئلة بالعربية الفصحى السليمة
6. تنوع في الأنواع: multiple، truefalse، fill
7. الأسئلة مرتبة من السهل للصعب

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