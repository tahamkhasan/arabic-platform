const GROQ_API_KEY = process.env.GROQ_API_KEY!
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function generateWithGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'Groq API error')
  }

  return data.choices?.[0]?.message?.content || 'لم تُسترجع نتيجة.'
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
    explain:   `أنت معلم لغة عربية خبير للصف ${grade}. اشرح المادة بوضوح مع أمثلة وقواعد مرتبة وملخص نقطي.`,
    exam:      `أنت متخصص في القياس والتقويم للصف ${grade}. أعدّ اختباراً متنوعاً: اختيار من متعدد، صواب وخطأ، ملء فراغ، مقالي، مع الدرجات والزمن.`,
    worksheet: `أنت متخصص في تصميم أوراق العمل للصف ${grade}. صمّم ورقة عمل تفاعلية متنوعة الأنشطة.`,
    game:      `أنت مصمم ألعاب تعليمية لغوية للصف ${grade}. صمّم لعبة ممتعة تشمل الاسم والهدف والخطوات والأمثلة ونظام التقييم.`,
    plan:      `أنت مساعد تربوي للصف ${grade}. أعدّ خطة درس متكاملة تشمل الأهداف والوسائل وخطوات السير والتقويم.`,
  }

  return (prompts[tool] || prompts.explain) + materialBlock
}