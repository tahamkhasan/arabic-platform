import { NextRequest, NextResponse } from 'next/server'
import { generateWithGemini } from '@/lib/gemini'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { content, title, grade, subject, userId } = await req.json()

    if (!content) {
      return NextResponse.json({ error: 'المحتوى مطلوب' }, { status: 400 })
    }

    // ── مفتاح الكاش ──
    const cachePrompt = `visual-card:${title}:${grade}`
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // ── البحث في الكاش ──
    if (userId) {
      const { data: cached } = await supabaseAdmin
        .from('generations')
        .select('id, result')
        .eq('user_id', userId)
        .eq('tool', 'visual-card')
        .eq('prompt', cachePrompt)
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cached?.result) {
        console.log('[visual-card] Cache HIT')
        try {
          const cardData = JSON.parse(cached.result)
          return NextResponse.json({ cardData, title, grade, subject, cached: true })
        } catch { /* استمر إذا فشل التحليل */ }
      }
    }

    console.log('[visual-card] Cache MISS — توليد جديد')

    // ── Prompt توليد البطاقة ──
    const systemPrompt = `أنت متخصص في تلخيص المحتوى التعليمي بشكل مرئي منظم.
مهمتك: استخرج من المحتوى المرفق ملخصاً منظماً للبطاقة المرئية.
أجب بصيغة JSON فقط بدون أي نص إضافي أو backticks.

الصيغة المطلوبة:
{
  "mainConcept": "المفهوم الرئيسي في جملة واحدة",
  "definition": "التعريف الدقيق في جملتين",
  "points": ["نقطة 1","نقطة 2","نقطة 3","نقطة 4","نقطة 5"],
  "example": "مثال تطبيقي واحد واضح",
  "rule": "القاعدة الذهبية في جملة واحدة",
  "icon": "رمز تعبيري واحد يناسب الموضوع"
}`

    const userPrompt = `لخّص للبطاقة المرئية:\nالعنوان: ${title}\nالمادة: ${subject}\nالصف: ${grade}\n\n${content.slice(0, 3000)}`

    const result = await generateWithGemini(systemPrompt, userPrompt)

    const clean    = result.replace(/```json/g, '').replace(/```/g, '').trim()
    const cardData = JSON.parse(clean)

    // ── حفظ في الكاش ──
    if (userId) {
      await supabaseAdmin.from('generations').insert({
        user_id:   userId,
        tool:      'visual-card',
        grade:     grade || '',
        stage:     '',
        prompt:    cachePrompt,
        result:    JSON.stringify(cardData),
        is_cached: false,
      })
    }

    return NextResponse.json({ cardData, title, grade, subject, cached: false })

  } catch (error: any) {
    console.error('[visual-card] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}