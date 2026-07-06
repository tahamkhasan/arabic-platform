import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateStream } from '@/lib/ai/providers/router';
import { error } from '@/lib/api-response';

const CHAT_SYSTEM_PROMPT = `أنت "مداد"، مساعد ذكي ودود متخصص في تعليم اللغة العربية للمرحلة الثانوية في دولة الكويت.

## شخصيتك:
- ودود ومشجّع — تستخدم الإيموجي باعتدال (📖 ✨ 🎯 💡)
- تتحدث بلغة عربية فصحى بسيطة مناسبة لطالب ثانوي
- لا تكن جامداً — كن كأستاذ محبوب يشرح بصبر

## قواعد صارمة:
1. **لا تُعطِ الإجابة مباشرة أبداً** — اسأل الطالب أولاً: "ما رأيك؟" أو "حاول أولاً"
2. أجب بأسئلة مُوجّهة تقود الطالب لاكتشاف الإجابة بنفسه
3. **لا تخرج عن نطاق اللغة العربية** — إن سُئلت عن شيء خارج نطاقك، رد: "هذا خارج تخصصي في اللغة العربية، اسأل معلمك عنه"
4. أجب باختصار — لا تكتب مقالات طويلة (3-5 أسطر كحد أقصى عادة)
5. إن لاحظت أن الطالب يُكرر نفس الخطأ 3 مرات: غيّر طريقة الشرح بالكامل
6. كل إعراب تذكره: نبّه "يرجى مراجعة المعلم للتأكد"

## أنواع الأسئلة وكيفية الرد:
- سؤال عن تعريف: "ما رأيك؟ حاول أن تعرّفها بكلماتك"
- سؤال عن إعراب: "أنتِ عرّفنا الإعراب — ما نوع هذه الكلمة؟"
- سؤال "ما الفرق بين X وY": "فكّر... ما المشترك بينهما أولاً؟"
- طلب شرح: اشرح باختصار ثم اسأل "هل وضحت؟"
- طلب أمثلة: أعطِ مثالين ثم اسأل "أعطني مثالاً أنت"

## تنسيق الرد:
- استخدم **نقاط** قصيرة عند تعداد الأشياء
- استخدم **الخط العريض** للمصطلحات المهمة هكذا: **المبتدأ**
- لا تستخدم جداول أو HTML
- لا تستخدم عبارات مثل "تحتها خط" — استخدم قوسين: (الكلمة)`;

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

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    const body = await req.json();
    const { message, lesson_id, conversation_id } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return error('لا يمكن إرسال رسالة فارغة', 400);
    }
    if (message.length > 2000) {
      return error('الرسالة طويلة جداً (2000 حرف كحد أقصى)', 400);
    }

    let convId = conversation_id;
    if (!convId) {
      const title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
      const { data: newConv, error: convError } = await supabaseAdmin
        .from('chat_conversations')
        .insert({ user_id: userData.id, lesson_id: lesson_id || null, title })
        .select('id')
        .single();

      if (convError || !newConv) {
        console.error('Error creating conversation:', convError);
        return error('فشل إنشاء المحادثة', 500);
      }
      convId = newConv.id;
    }

    await supabaseAdmin.from('chat_messages').insert({
      conversation_id: convId,
      role: 'user',
      content: message.trim(),
    });

    let lessonContext = '';
    if (lesson_id) {
      const { data: lesson } = await supabaseAdmin
        .from('lessons')
        .select('title, description')
        .eq('id', lesson_id)
        .single();

      if (lesson) {
        lessonContext = `\n\n📚 الدرس الحالي: ${lesson.title}`;
        if (lesson.description) {
          lessonContext += `\n${lesson.description.substring(0, 500)}`;
        }
      }
    }

    const { data: history } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: false })
      .limit(10);

    const chatHistory = (history || []).reverse();

    let weakPointsContext = '';
    const { data: mistakes } = await supabaseAdmin
      .from('context_memory')
      .select('content_summary')
      .eq('user_id', userData.id)
      .eq('interaction_type', 'mistake')
      .order('created_at', { ascending: false })
      .limit(3);

    if (mistakes && mistakes.length > 0) {
      weakPointsContext = '\n\n⚠️ نقاط ضعف سابقة للطالب (ركّز عليها إن لزم):\n';
      mistakes.forEach((m, i) => {
        weakPointsContext += `${i + 1}. ${m.content_summary}\n`;
      });
    }

    const finalSystemPrompt = CHAT_SYSTEM_PROMPT + lessonContext + weakPointsContext;

    const recentHistory = chatHistory.slice(-6);
    const apiMessages = recentHistory.map(msg => ({
      role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.content,
    }));
    apiMessages.push({ role: 'user', content: message.trim() });

    // ── مُعدَّل: استدعاء الراوتر الموحَّد بدل fetch مباشر لـ Anthropic.
    // الراوتر يُرجع نصاً خاماً موحَّداً بلا أي تنسيق SSE — Claude أو
    // Gemini، لا فرق من منظور هذا الملف. ─────────────────────────────
    const { stream: rawStream, providerUsed } = await generateStream({
      systemPrompt: finalSystemPrompt,
      messages: apiMessages,
      maxTokens: 1500,
      timeoutMs: 55_000,
    });

    if (providerUsed === 'gemini') {
      console.log(`ℹ️ محادثة (${convId}) تُخدَّم عبر Gemini الاحتياطي.`);
    }

    // ── نفس منطق tee() الأصلي — نسخة للمستخدم، ونسخة للحفظ في الخلفية.
    // الفرق الوحيد: forSaving الآن نص خام مباشرة، لا حاجة لتفكيك SSE ──
    const [forUser, forSaving] = rawStream.tee();

    (async () => {
      try {
        const reader = forSaving.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullResponse += decoder.decode(value, { stream: true });
        }

        if (fullResponse) {
          await supabaseAdmin.from('chat_messages').insert({
            conversation_id: convId,
            role: 'assistant',
            content: fullResponse,
          });

          await supabaseAdmin
            .from('chat_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', convId);

          const isEducational =
            message.includes('ما') ||
            message.includes('كيف') ||
            message.includes('لماذا') ||
            message.includes('اشرح') ||
            message.includes('ما الفرق') ||
            message.includes('أعرب') ||
            message.includes('مثال');

          if (isEducational) {
            await supabaseAdmin.from('context_memory').insert({
              user_id: userData.id,
              lesson_id: lesson_id || convId,
              interaction_type: 'chat_question',
              content_summary: `سأل: ${message.substring(0, 100)}`,
              performance_signal: 0,
            });
          }
        }
      } catch (err) {
        console.error('Error saving assistant message:', err);
      }
    })();

    return new Response(forUser, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (err: any) {
    console.error('Chat error:', err);
    return error('خطأ داخلي', 500);
  }
}