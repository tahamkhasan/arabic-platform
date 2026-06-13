import { NextRequest, NextResponse } from 'next/server'
import { generateWithGemini, buildSystemPrompt } from '@/lib/gemini'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { tool, grade, stage, prompt, userId, material } = await req.json()

    if (!tool || !grade || !prompt) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    // بناء الـ prompt وإرساله لـ Gemini
    const systemPrompt = buildSystemPrompt(tool, grade, material || '')
    const result = await generateWithGemini(systemPrompt, prompt)

    // حفظ السجل في قاعدة البيانات
    if (userId) {
      await supabaseAdmin.from('generations').insert({
        user_id: userId,
        tool,
        grade,
        stage,
        prompt,
        result,
      })

      // تحديث الإحصائيات
      await supabaseAdmin.rpc('increment_stats')
    }

    return NextResponse.json({ result })
  } catch (error: any) {
    console.error('Generate error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ' },
      { status: 500 }
    )
  }
}