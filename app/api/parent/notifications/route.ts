// ============================================================
// API: إشعارات ولي الأمر
// GET: جلب إشعارات ولي الأمر (إشعاراته الشخصية + إشعارات أبنائه)
// PATCH: تعليم إشعار كمقروء
// PATCH (batch): تعليم كل الإشعارات كمقروءة
// ============================================================

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { success, error, paginated } from '@/lib/api-response';
import { paginationSchema } from '@/lib/validators';
import { z } from 'zod';

// ---- شكل تعليم إشعار واحد ----
const markOneSchema = z.object({
  notification_id: z.string().uuid('معرّف الإشعار غير صالح'),
});

// ---- شكل تعليم الكل ----
const markAllSchema = z.object({
  mark_all_read: z.literal(true),
  child_id: z.string().uuid().optional(), // إن وُحد: إشعارات ابن محدد فقط
});

// ---- دالة مساعدة ----
async function getUser(token: string) {
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return null;
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('id, role, status')
    .eq('id', user.id)
    .single();
  if (!userData || userData.status !== 'approved') return null;
  return userData;
}

// ===== GET: إشعارات ولي الأمر =====
export async function GET(req: NextRequest) {
  try {
    // 1. تحقق من المستخدم
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    if (userData.role !== 'parent') {
      return error('هذا المسار لأولياء الأمور فقط', 403);
    }

    // 2. استخرج المعاملات
    const { searchParams } = new URL(req.url);
    const pagination = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      page_size: searchParams.get('page_size') || '20',
    });
    const unreadOnly = searchParams.get('unread') === 'true';
    const childId = searchParams.get('child_id');

    // 3. جلب أبناء ولي الأمر
    const { data: links } = await supabaseAdmin
      .from('parent_children')
      .select('child_id')
      .eq('parent_id', userData.id);

    const childIds = (links || []).map((l: any) => l.child_id);

    if (childIds.length === 0) {
      return paginated([], 0, pagination.page, pagination.page_size);
    }

    // 4. ابني الاستعلام: إشعاراتي الشخصية + إشعارات الأبناء
    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .in('user_id', [userData.id, ...childIds])
      .order('created_at', { ascending: false });

    // فلتر: غير مقروء فقط
    if (unreadOnly) {
      query = query.eq('read', false);
    }

    // فلتر: ابن محدد
    if (childId) {
      query = query.eq('user_id', childId);
    }

    // التصفح
    const from = (pagination.page - 1) * pagination.page_size;
    const to = from + pagination.page_size - 1;
    query = query.range(from, to);

    const { data: notifications, count, error: queryError } = await query;

    if (queryError) {
      console.error('Error fetching notifications:', queryError);
      return error('فشل جلب الإشعارات', 500);
    }

    // 5. أضف معلومة: هل الإشعار لولي الأمر أم لابن؟
    const childNames: Record<string, string> = {};
    if (childIds.length > 0) {
      const { data: children } = await supabaseAdmin
        .from('users')
        .select('id, full_name')
        .in('id', childIds);

      if (children) {
        for (const c of children) {
          childNames[c.id] = c.full_name;
        }
      }
    }

    const items = (notifications || []).map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      data: n.data,
      read: n.read,
      created_at: n.created_at,
      // معلومة إضافية
      is_for_child: n.user_id !== userData.id,
      child_name: n.user_id !== userData.id ? childNames[n.user_id] || 'ابنك' : null,
      child_id: n.user_id !== userData.id ? n.user_id : null,
    }));

    // 6. عد الإشعارات غير المقروءة
    const { count: unreadCount } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .in('user_id', [userData.id, ...childIds])
      .eq('read', false);

    return success({
      items,
      total: count || 0,
      page: pagination.page,
      page_size: pagination.page_size,
      total_pages: Math.ceil((count || 0) / pagination.page_size),
      unread_count: unreadCount || 0,
    });

  } catch (err: any) {
    console.error('Notifications error:', err);
    return error('خطأ داخلي', 500);
  }
}

// ===== PATCH: تعليم إشعار / تعليم الكل =====
export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    if (userData.role !== 'parent') {
      return error('هذا المسار لأولياء الأمور فقط', 403);
    }

    // جلب أبناء ولي الأمر
    const { data: links } = await supabaseAdmin
      .from('parent_children')
      .select('child_id')
      .eq('parent_id', userData.id);

    const childIds = (links || []).map((l: any) => l.child_id);
    const allUserIds = [userData.id, ...childIds];

    const body = await req.json();

    // ---- حالة 1: تعليم الكل ----
    const allValidation = markAllSchema.safeParse(body);
    if (allValidation.success) {
      let query = supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('read', false);

      // إن حُدد ابن: إشعارات هذا الابن فقط
      if (body.child_id) {
        query = query.eq('user_id', body.child_id);
      } else {
        query = query.in('user_id', allUserIds);
      }

      const { error: updateError } = await query;

      if (updateError) {
        console.error('Error marking all read:', updateError);
        return error('فشل تعليم الإشعارات', 500);
      }

      return success({ message: 'تم تعليم كل الإشعارات' });
    }

    // ---- حالة 2: تعليم إشعار واحد ----
    const oneValidation = markOneSchema.safeParse(body);
    if (oneValidation.success) {
      const { notification_id } = oneValidation.data;

      // تحقق أن الإشعار لهذا المستخدم أو لأحد أبنائه
      const { data: notification } = await supabaseAdmin
        .from('notifications')
        .select('id, user_id')
        .eq('id', notification_id)
        .single();

      if (!notification) {
        return error('الإشعار غير موجود', 404);
      }

      if (!allUserIds.includes(notification.user_id)) {
        return error('هذا الإشعار ليس لك ولا لأحد أبنائك', 403);
      }

      const { error: updateError } = await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('id', notification_id);

      if (updateError) {
        console.error('Error marking read:', updateError);
        return error('فشل تعليم الإشعار', 500);
      }

      return success({ message: 'تم تعليم الإشعار' });
    }

    // لم يتطابق مع أي schema
    return error('الإجراء غير معروف — استخدم notification_id أو mark_all_read: true', 400);

  } catch (err: any) {
    console.error('Mark notification error:', err);
    return error('خطأ داخلي', 500);
  }
}