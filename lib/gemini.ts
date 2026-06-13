const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

export async function generateWithGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\n${userPrompt}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'Gemini API error')
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'لم تُسترجع نتيجة.'
}

export function buildSystemPrompt(
  tool: string,
  grade: string,
  material: string
): string {
  const hasMaterial = material && material.trim().length > 0
  const materialBlock = hasMaterial
    ? `\n\n━━━━━━━━━━━━━━━━━━━━\n📌 المادة العلمية المرجعية — التزم بها حصراً:\n${material.trim()}\n━━━━━━━━━━━━━━━━━━━━\n⚠️ لا تخرج عن هذه المادة إطلاقاً.`
    : ''

  const prompts: Record<string, string> = {
    explain: `أنت معلم لغة عربية خبير للصف ${grade}. اشرح المادة بوضوح مع أمثلة وقواعد مرتبة وملخص نقطي.`,
    exam: `أنت متخصص في القياس والتقويم للصف ${grade}. أعدّ اختباراً متنوعاً: اختيار من متعدد، صواب وخطأ، ملء فراغ، مقالي، مع الدرجات والزمن.`,
    worksheet: `أنت متخصص في تصميم أوراق العمل للصف ${grade}. صمّم ورقة عمل تفاعلية متنوعة الأنشطة.`,
    game: `أنت مصمم ألعاب تعليمية لغوية للصف ${grade}. صمّم لعبة ممتعة تشمل الاسم والهدف والخطوات والأمثلة ونظام التقييم.`,
  }

  return (prompts[tool] || prompts.explain) + materialBlock
}