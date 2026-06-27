// ============================================================
// API: قائمة محادثات الدردشة
// GET: جلب محادثات المستخدم (مع آخر رسالة لكل محادثة)
// DELETE: حذف محادثة قديمة
// ============================================================

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { success, error, paginated } from '@/lib/api-response';
import { paginationSchema } from '@/lib/validators';

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

// ===== GET: قائمة المحادثات =====
export async function GET(req: NextRequest) {
  try {
    // 1. تحقق من المستخدم
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    // 2. استخرج معاملات التصفح
    const { searchParams } = new URL(req.url);
    const pagination = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      page_size: searchParams.get('page_size') || '20',
    });

    // 3. جلب المحادثات مرتبة بالتحديث (الأحدث أولاً)
    const from = (pagination.page - 1) * pagination.page_size;
    const to = from + pagination.page_size - 1;

    const { data: conversations, count, error: queryError } = await supabaseAdmin
      .from('chat_conversations')
      .select('id, title, lesson_id, created_at, updated_at')
      .eq('user_id', userData.id)
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (queryError) {
      console.error('Error fetching conversations:', queryError);
      return error('فشل جلب المحادثات', 500);
    }

    if (!conversations || conversations.length === 0) {
      return paginated([], 0, pagination.page, pagination.page_size);
    }

    // 4. لكل محادثة: جلب آخر رسالة وعدد الرسائل
    const convIds = conversations.map(c => c.id);

    // آخر رسالة لكل محادثة
    const { data: lastMessages } = await supabaseAdmin
      .from('chat_messages')
      .select('conversation_id, content, created_at')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false });

    // عدد الرسائل لكل محادثة
    const { data: messageCounts } = await supabaseAdmin
      .from('chat_messages')
      .select('conversation_id')
      .in('conversation_id', convIds);

    // 5. ابنِ خريطة للمعلومات السريعة
    const lastMessageMap: Record<string, any> = {};
    if (lastMessages) {
      for (const msg of lastMessages) {
        if (!lastMessageMap[msg.conversation_id]) {
          lastMessageMap[msg.conversation_id] = msg;
        }
      }
    }

    const countMap: Record<string, number> = {};
    if (messageCounts) {
      for (const msg of messageCounts) {
        countMap[msg.conversation_id] = (countMap[msg.conversation_id] || 0) + 1;
      }
    }

    // 6. أعد النتائج
    const items = conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      lesson_id: conv.lesson_id,
      last_message: lastMessageMap[conv.id]?.content
        ? lastMessageMap[conv.id].content.substring(0, 80) + (lastMessageMap[conv.id].content.length > 80 ? '...' : '')
        : null,
      last_message_time: lastMessageMap[conv.id]?.created_at || null,
      messages_count: countMap[conv.id] || 0,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
    }));

    return paginated(items, count || 0, pagination.page, pagination.page_size);

  } catch (err: any) {
    console.error('Conversations list error:', err);
    return error('خطأ داخلي', 500);
  }
}

// ===== DELETE: حذف محادثة =====
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    // اقرأ conversation_id من الـ body
    const body = await req.json();
    const { conversation_id } = body;

    if (!conversation_id) {
      return error('معرّف المحادثة مطلوب', 400);
    }

    // تحقق أن المحادثة لهذا المستخدم
    const { data: conv } = await supabaseAdmin
      .from('chat_conversations')
      .select('id, user_id')
      .eq('id', conversation_id)
      .single();

    if (!conv) {
      return error('المحادثة غير موجودة', 404);
    }

    if (conv.user_id !== userData.id) {
      return error('هذه ليست محادثتك', 403);
    }

    // حذف المحادثة (CASCADE سيحذف الرسائل تلقائياً)
    const { error: deleteError } = await supabaseAdmin
      .from('chat_conversations')
      .delete()
      .eq('id', conversation_id);

    if (deleteError) {
      console.error('Error deleting conversation:', deleteError);
      return error('فشل حذف المحادثة', 500);
    }

    return success({ message: 'تم حذف المحادثة' });

  } catch (err: any) {
    console.error('Conversation delete error:', err);
    return error('خطأ داخلي', 500);
  }
}