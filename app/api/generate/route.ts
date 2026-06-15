import { NextRequest, NextResponse } from 'next/server'
import { generateWithGemini, buildSystemPrompt } from '@/lib/gemini'
import { supabaseAdmin } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/rateLimit'

const CACHE_TTL_HOURS = 24

interface CachedGeneration {
  id:     string
  result: string
}

async function findCachedResult(
  userId: string,
  tool:   string,
  grade:  string,
  prompt: string
): Promise<CachedGeneration | null> {
  const cutoff = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabaseAdmin
    .from('generations')
    .select('id, result')
    .eq('user_id', userId)
    .eq('tool', tool)
    .eq('grade', grade)
    .eq('prompt', prompt)
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data as CachedGeneration
}

async function saveGeneration(params: {
  userId:   string
  tool:     string
  grade:    string
  stage:    string
  prompt:   string
  result:   string
  isCached: boolean
}): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('generations')
    .insert({
      user_id:   params.userId,
      tool:      params.tool,
      grade:     params.grade,
      stage:     params.stage,
      prompt:    params.prompt,
      result:    params.result,
      is_cached: params.isCached,
    })
    .select('id')
    .single()

  if (error) {
    console.error('saveGeneration error:', error)
    return null
  }
  return data.id
}

export async function POST(req: NextRequest) {
  try {
    const { tool, grade, stage, prompt, userId, material } = await req.json()

    // ── التحقق من المدخلات ──
    if (!tool || !grade || !prompt) {
      return NextResponse.json(
        { error: 'بيانات ناقصة: tool, grade, prompt مطلوبة' },
        { status: 400 }
      )
    }

    // ══════════════════════════════════
    // 0. Rate Limiting
    // ══════════════════════════════════
    if (userId) {
      const { allowed, remaining, resetAt } = await checkRateLimit(userId)

      if (!allowed) {
        const retryAfter = Math.ceil((resetAt.getTime() - Date.now()) / 1000)
        return NextResponse.json(
          {
            error: `تجاوزت الحد المسموح به (10 طلبات/دقيقة). حاول مرة أخرى بعد ${retryAfter} ثانية.`,
            remaining: 0,
            resetAt: resetAt.toISOString(),
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit':     '10',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset':     resetAt.toISOString(),
              'Retry-After':           String(retryAfter),
            },
          }
        )
      }

      console.log(`[RateLimit] user=${userId} remaining=${remaining}`)
    }

    // ══════════════════════════════════
    // 1. البحث في الكاش
    // ══════════════════════════════════
    if (userId) {
      const cached = await findCachedResult(userId, tool, grade, prompt)

      if (cached) {
        console.log(`[Cache HIT] generation_id=${cached.id}`)
        await supabaseAdmin
          .from('generations')
          .update({ is_cached: true })
          .eq('id', cached.id)

        return NextResponse.json({
          result:        cached.result,
          cached:        true,
          generation_id: cached.id,
        })
      }

      console.log('[Cache MISS] سيتم إرسال الطلب إلى Claude')
    }

    // ══════════════════════════════════
    // 2. إرسال الطلب إلى Claude
    // ══════════════════════════════════
    const systemPrompt = buildSystemPrompt(tool, grade, material || '', prompt)
    const result       = await generateWithGemini(systemPrompt, prompt)

    // ══════════════════════════════════
    // 3. حفظ النتيجة
    // ══════════════════════════════════
    let generationId: string | null = null

    if (userId) {
      generationId = await saveGeneration({
        userId,
        tool,
        grade,
        stage:    stage || '',
        prompt,
        result,
        isCached: false,
      })
    }

    return NextResponse.json({
      result,
      cached:        false,
      generation_id: generationId,
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    console.error('[generate] error:', message)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}