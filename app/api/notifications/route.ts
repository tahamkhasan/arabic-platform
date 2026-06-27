import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// userId قد يصل كسلسلة حرفية "undefined"/"null" (لا قيمة null فعلية) من واجهات
// لم تُمرِّر الخاصية بعد — هذا الفحص يصطاد تلك الحالة، بخلاف !userId وحدها
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function isValidUserId(userId: string | null): userId is string {
  return !!userId && userId !== 'undefined' && userId !== 'null' && UUID_RE.test(userId)
}

// GET /api/notifications?userId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId     = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    if (!isValidUserId(userId)) {
      return NextResponse.json({ notifications: [], unread: 0 })
    }

    // عدد غير المقروءة
    const { count } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (unreadOnly) return NextResponse.json({ unread: count ?? 0 })

    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ notifications: data ?? [], unread: count ?? 0 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/notifications — إنشاء إشعار
export async function POST(req: NextRequest) {
  try {
    const { userId, type, title, body, link } = await req.json()

    if (!isValidUserId(userId) || !type || !title) {
      return NextResponse.json({ error: 'بيانات ناقصة أو userId غير صالح' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({ user_id: userId, type, title, body: body ?? null, link: link ?? null })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ notification: data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH /api/notifications — تعليم كمقروء
export async function PATCH(req: NextRequest) {
  try {
    const { userId, notificationId } = await req.json()

    if (!isValidUserId(userId)) {
      return NextResponse.json({ error: 'userId مطلوب وصالح' }, { status: 400 })
    }

    let query = supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)

    // إذا حدد إشعاراً معيناً — وإلا علّم الكل
    if (notificationId) query = query.eq('id', notificationId)

    const { error } = await query
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}