import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(req: NextRequest) {
  try {
    const { generationId, rating, userId } = await req.json() as {
      generationId: string
      rating:       1 | -1
      userId:       string
    }

    if (!generationId || !userId) {
      return NextResponse.json(
        { error: 'generationId و userId مطلوبان' },
        { status: 400 }
      )
    }

    if (rating !== 1 && rating !== -1) {
      return NextResponse.json(
        { error: 'التقييم يجب أن يكون 1 أو -1 فقط' },
        { status: 400 }
      )
    }

    const { data: generation, error: fetchError } = await supabaseAdmin
      .from('generations')
      .select('id, user_id, rating')
      .eq('id', generationId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !generation) {
      return NextResponse.json(
        { error: 'السجل غير موجود أو غير مصرح لك' },
        { status: 404 }
      )
    }

    const { error: updateError } = await supabaseAdmin
      .from('generations')
      .update({ rating })
      .eq('id', generationId)
      .eq('user_id', userId)

    if (updateError) throw updateError

    return NextResponse.json({
      success:  true,
      previous: generation.rating,
      current:  rating,
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    console.error('[feedback] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}