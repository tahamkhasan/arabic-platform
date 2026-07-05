import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function getApprovedTeacherId(): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('user_type', 'teacher')
    .eq('status', 'approved')
    .limit(1)

  if (error) throw error
  return data?.[0]?.id ?? null
}

// GET /api/messages?userId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')?.trim()
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    if (!userId) {
      return NextResponse.json({ error: 'userId مطلوب' }, { status: 400 })
    }

    // أسرع مسار: جلب عدد غير المقروء فقط
    if (unreadOnly) {
      const { count, error } = await supabaseAdmin
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('to_id', userId)
        .eq('is_read', false)

      if (error) throw error

      return NextResponse.json({ unread: count ?? 0 })
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, user_type')
      .eq('id', userId)
      .single()

    if (userError) throw userError
    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    let teacherId: string | null = null

    if (user.user_type === 'student') {
      teacherId = await getApprovedTeacherId()
    }

    const otherId = user.user_type === 'student' ? teacherId : null

    let query = supabaseAdmin
      .from('messages')
      .select('id, from_id, to_id, content, image_url, is_read, created_at')
      .order('created_at', { ascending: true })

    if (otherId) {
      query = query.or(
        `and(from_id.eq.${userId},to_id.eq.${otherId}),and(from_id.eq.${otherId},to_id.eq.${userId})`
      )
    } else {
      query = query.or(`from_id.eq.${userId},to_id.eq.${userId}`)
    }

    const { data: messages, error: messagesError } = await query
    if (messagesError) throw messagesError

    const { error: updateError } = await supabaseAdmin
      .from('messages')
      .update({ is_read: true })
      .eq('to_id', userId)
      .eq('is_read', false)

    if (updateError) throw updateError

    return NextResponse.json({
      messages: messages ?? [],
      teacherId,
      unread: 0,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/messages — إرسال رسالة
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const fromId = body?.fromId
    const toId = body?.toId
    const imageUrl = body?.imageUrl ?? null
    const content = typeof body?.content === 'string' ? body.content.trim() : ''

    if (!fromId || !toId || (!content && !imageUrl)) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        from_id: fromId,
        to_id: toId,
        content: content || null,
        image_url: imageUrl,
        is_read: false,
      })
      .select('id, from_id, to_id, content, image_url, is_read, created_at')
      .single()

    if (error) throw error

    return NextResponse.json({ message: data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}