// ============================================================
// API: رسائل محادثة واحدة
// GET: جلب كل رسائل محادثة (مرتبة زمنياً)
// DELETE: حذف محادثة (بالمعرّف من URL)
// ============================================================

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { success, error, requireValidId } from '@/lib/api-response';

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

// ===== GET: رسائل محادثة =====
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;

    // 1. تحقق من UUID
    try { requireValidId(conversationId, 'conversation_id'); } catch (e: any) {
      return error(e.message, 400);
    }

    // 2. تحقق من المستخدم
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    // 3. تحقق أن المحادثة لهذا المستخدم
    const { data: conv, error: convError } = await supabaseAdmin
      .from('chat_conversations')
      .select('id, user_id, title, lesson_id, created_at, updated_at')
      .eq('id', conversationId)
      .single();

    if (convError || !conv) {
      return error('المحادثة غير موجودة', 404);
    }

    if (conv.user_id !== userData.id) {
      return error('هذه ليست محادثتك', 403);
    }

    // 4. جلب الرسائل مرتبة تصاعدياً (الأقدم أولاً)
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('Error fetching messages:', msgError);
      return error('فشل جلب الرسائل', 500);
    }

    // 5. أرجع المحادثة مع رسائلها
    return success({
      id: conv.id,
      title: conv.title,
      lesson_id: conv.lesson_id,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      messages_count: messages?.length || 0,
      messages: messages || [],
    });

  } catch (err: any) {
    console.error('Conversation messages error:', err);
    return error('خطأ داخلي', 500);
  }
}

// ===== DELETE: حذف محادثة بالمعرّف من URL =====
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;

    try { requireValidId(conversationId, 'conversation_id'); } catch (e: any) {
      return error(e.message, 400);
    }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    // تحقق الملكية
    const { data: conv } = await supabaseAdmin
      .from('chat_conversations')
      .select('id, user_id')
      .eq('id', conversationId)
      .single();

    if (!conv) return error('المحادثة غير موجودة', 404);
    if (conv.user_id !== userData.id) return error('هذه ليست محادثتك', 403);

    // حذف (CASCADE يحذف الرسائل تلقائياً)
    const { error: deleteError } = await supabaseAdmin
      .from('chat_conversations')
      .delete()
      .eq('id', conversationId);

    if (deleteError) {
      console.error('Error deleting conversation:', deleteError);
      return error('فشل حذف المحادثة', 500);
    }

    return success({ message: 'تم حذف المحادثة وكل رسائلها' });

  } catch (err: any) {
    console.error('Conversation delete error:', err);
    return error('خطأ داخلي', 500);
  }
}