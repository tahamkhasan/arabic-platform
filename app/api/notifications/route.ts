import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidUserId(userId: string | null): userId is string {
  return !!userId && userId !== 'undefined' && userId !== 'null' && UUID_RE.test(userId)
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'خطأ غير معروف'
}

function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    if (!isValidUserId(userId)) {
      return unreadOnly ? ok({ unread: 0 }) : ok({ notifications: [], unread: 0 })
    }

    const { count, error: countError } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (countError) {
      console.error('notifications.GET.countError', countError)
      return unreadOnly ? ok({ unread: 0 }) : ok({ notifications: [], unread: 0 })
    }

    if (unreadOnly) {
      return ok({ unread: count ?? 0 })
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('id, user_id, type, title, body, link, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) {
      console.error('notifications.GET.listError', error)
      return ok({ notifications: [], unread: count ?? 0 })
    }

    return ok({
      notifications: data ?? [],
      unread: count ?? 0,
    })
  } catch (error: unknown) {
    console.error('notifications.GET.fatal', error)
    return ok({ notifications: [], unread: 0 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const userId = typeof body?.userId === 'string' ? body.userId.trim() : null
    const type = typeof body?.type === 'string' ? body.type.trim() : ''
    const title = typeof body?.title === 'string' ? body.title.trim() : ''
    const messageBody = typeof body?.body === 'string' ? body.body.trim() : null
    const link = typeof body?.link === 'string' ? body.link.trim() : null

    if (!isValidUserId(userId) || !type || !title) {
      return ok({ error: 'بيانات ناقصة أو userId غير صالح' }, 400)
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        body: messageBody || null,
        link: link || null,
        is_read: false,
      })
      .select('id, user_id, type, title, body, link, is_read, created_at')
      .single()

    if (error) {
      console.error('notifications.POST.error', error)
      throw error
    }

    return ok({ notification: data })
  } catch (error: unknown) {
    return ok({ error: getErrorMessage(error) }, 500)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()

    const userId = typeof body?.userId === 'string' ? body.userId.trim() : null
    const notificationId =
      typeof body?.notificationId === 'string' ? body.notificationId.trim() : null

    if (!isValidUserId(userId)) {
      return ok({ error: 'userId مطلوب وصالح' }, 400)
    }

    let query = supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)

    if (notificationId) {
      query = query.eq('id', notificationId)
    }

    const { error } = await query

    if (error) {
      console.error('notifications.PATCH.error', error)
      throw error
    }

    return ok({ success: true })
  } catch (error: unknown) {
    return ok({ error: getErrorMessage(error) }, 500)
  }
}