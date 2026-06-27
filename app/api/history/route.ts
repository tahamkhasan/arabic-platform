import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// ══════════════════════════════════════════════════════
// GET /api/history
// ══════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId   = searchParams.get('userId')
    const tool     = searchParams.get('tool')
    const search   = searchParams.get('search')
    const favorite = searchParams.get('favorite')
    const page     = parseInt(searchParams.get('page') ?? '1')
    const limit    = 12

    if (!userId) return NextResponse.json({ error: 'userId مطلوب' }, { status: 400 })

    let query = supabaseAdmin
      .from('generations')
      .select(`
        id, tool, grade, stage, result, result_edited,
        title, is_favorite, is_cached, rating, created_at, prompt
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (tool && tool !== 'all')  query = query.eq('tool', tool)
    if (favorite === 'true')     query = query.eq('is_favorite', true)
    if (search && search.trim()) query = query.or(`result.ilike.%${search}%,prompt.ilike.%${search}%`)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      items:      data ?? [],
      total:      count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ══════════════════════════════════════════════════════
// PATCH /api/history
// actions: favorite | rename | edit
// ══════════════════════════════════════════════════════
export async function PATCH(req: NextRequest) {
  try {
    const { id, userId, action, value } = await req.json()

    if (!id || !userId) return NextResponse.json({ error: 'id و userId مطلوبان' }, { status: 400 })

    const { data: gen } = await supabaseAdmin
      .from('generations')
      .select('id, is_favorite, title, result_edited')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!gen) return NextResponse.json({ error: 'السجل غير موجود' }, { status: 404 })

    let updateData: Record<string, unknown> = {}

    if (action === 'favorite') {
      updateData = { is_favorite: !gen.is_favorite }
    } else if (action === 'rename' && typeof value === 'string') {
      updateData = { title: value.trim() }
    } else if (action === 'edit' && typeof value === 'string') {
      // ✅ حفظ النص المعدَّل — النص الأصلي يبقى محفوظاً في result
      updateData = { result_edited: value.trim() || null }
    }

    const { error } = await supabaseAdmin
      .from('generations')
      .update(updateData)
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true, ...updateData })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ══════════════════════════════════════════════════════
// DELETE /api/history
// ══════════════════════════════════════════════════════
export async function DELETE(req: NextRequest) {
  try {
    const { id, userId } = await req.json()

    if (!id || !userId) return NextResponse.json({ error: 'id و userId مطلوبان' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('generations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}