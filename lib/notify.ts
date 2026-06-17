// lib/notify.ts — دالة مساعدة لإرسال الإشعارات

import { supabaseAdmin } from '@/lib/supabase'

interface NotifyParams {
  userId: string
  type:   'new_assignment' | 'new_grade' | 'new_message' | 'new_submission' | 'account_approved'
  title:  string
  body?:  string
  link?:  string
}

export async function notify(params: NotifyParams) {
  try {
    await supabaseAdmin.from('notifications').insert({
      user_id: params.userId,
      type:    params.type,
      title:   params.title,
      body:    params.body    ?? null,
      link:    params.link    ?? null,
      is_read: false,
    })
  } catch (e) {
    console.error('[notify] error:', e)
  }
}

// إشعار لعدة مستخدمين دفعة واحدة
export async function notifyMany(userIds: string[], params: Omit<NotifyParams, 'userId'>) {
  if (!userIds.length) return
  try {
    const rows = userIds.map(uid => ({
      user_id: uid,
      type:    params.type,
      title:   params.title,
      body:    params.body ?? null,
      link:    params.link ?? null,
      is_read: false,
    }))
    await supabaseAdmin.from('notifications').insert(rows)
  } catch (e) {
    console.error('[notifyMany] error:', e)
  }
}