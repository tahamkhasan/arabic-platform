import { NextRequest, NextResponse } from 'next/server'
import { generateWithGemini, buildSystemPrompt } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const { content, title, grade, subject, tool } = await req.json()

    if (!content) {
      return NextResponse.json({ error: 'المحتوى مطلوب' }, { status: 400 })
    }

    // Prompt مخصص لتوليد ملخص البطاقة المرئية
    const systemPrompt = `أنت متخصص في تلخيص المحتوى التعليمي بشكل مرئي منظم.
مهمتك: استخرج من المحتوى المرفق ملخصاً منظماً للبطاقة المرئية.

القواعد الصارمة:
- أجب بصيغة JSON فقط بدون أي نص إضافي.
- لا تضف markdown أو backticks.
- الملخص يجب أن يكون دقيقاً وعلمياً.

الصيغة المطلوبة:
{
  "mainConcept": "المفهوم الرئيسي في جملة واحدة",
  "definition": "التعريف الدقيق في جملتين",
  "points": [
    "النقطة الأولى",
    "النقطة الثانية",
    "النقطة الثالثة",
    "النقطة الرابعة",
    "النقطة الخامسة"
  ],
  "example": "مثال تطبيقي واحد واضح",
  "rule": "القاعدة الذهبية أو الخلاصة في جملة واحدة",
  "icon": "رمز تعبيري واحد يناسب الموضوع"
}`

    const userPrompt = `لخّص هذا المحتوى التعليمي للبطاقة المرئية:\n\nالعنوان: ${title}\nالمادة: ${subject}\nالصف: ${grade}\n\nالمحتوى:\n${content.slice(0, 3000)}`

    const result = await generateWithGemini(systemPrompt, userPrompt)

    // تنظيف الاستجابة وتحويلها لـ JSON
    const clean = result
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    const cardData = JSON.parse(clean)

    return NextResponse.json({ cardData, title, grade, subject })
  } catch (error: any) {
    console.error('[visual-card] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}