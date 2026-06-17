import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/messages?userId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId     = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    if (!userId) return NextResponse.json({ error: 'userId مطلوب' }, { status: 400 })

    // إيجاد المعلم المرتبط بالطالب (أول معلم في subjects مشتركة)
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role, user_type')
      .eq('id', userId)
      .single()

    let teacherId: string | null = null

    if (user?.user_type === 'student') {
      const { data: teachers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('user_type', 'teacher')
        .eq('status', 'approved')
        .limit(1)
      teacherId = teachers?.[0]?.id ?? null
    }

    if (unreadOnly) {
      const { count } = await supabaseAdmin
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('to_id', userId)
        .eq('is_read', false)
      return NextResponse.json({ unread: count ?? 0 })
    }

    // جلب الرسائل بين الطالب ومعلمه
    const otherId = user?.user_type === 'student' ? teacherId : null

    let query = supabaseAdmin
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })

    if (otherId) {
      query = query.or(`and(from_id.eq.${userId},to_id.eq.${otherId}),and(from_id.eq.${otherId},to_id.eq.${userId})`)
    } else {
      query = query.or(`from_id.eq.${userId},to_id.eq.${userId}`)
    }

    const { data, error } = await query
    if (error) throw error

    // تمييز الرسائل كمقروءة
    await supabaseAdmin
      .from('messages')
      .update({ is_read: true })
      .eq('to_id', userId)
      .eq('is_read', false)

    const { count: unread } = await supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('to_id', userId)
      .eq('is_read', false)

    return NextResponse.json({
      messages:  data ?? [],
      teacherId,
      unread:    unread ?? 0,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/messages — إرسال رسالة
export async function POST(req: NextRequest) {
  try {
    const { fromId, toId, content, imageUrl } = await req.json()

    if (!fromId || !toId || !content?.trim()) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        from_id:   fromId,
        to_id:     toId,
        content:   content.trim(),
        image_url: imageUrl ?? null,
        is_read:   false,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ message: data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}