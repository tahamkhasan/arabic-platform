// ============================================================
// API: دردشة مداد — إرسال رسالة واستقبال رد
// POST: يرسل رسالة ويرجع الرد كـ Streaming (نص يتدفق تدريجياً)
// ============================================================

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateWithGemini } from '@/lib/gemini';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import { error } from '@/lib/api-response';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

// ---- System Prompt مخصص للدردشة ----
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

// ===== POST: إرسال رسالة =====
export async function POST(req: NextRequest) {
  try {
    // 1. تحقق من المستخدم
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return error('غير مصرح', 401);

    const userData = await getUser(token);
    if (!userData) return error('غير مصرح', 401);

    // 2. اقرأ الرسالة
    const body = await req.json();
    const { message, lesson_id, conversation_id } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return error('لا يمكن إرسال رسالة فارغة', 400);
    }

    if (message.length > 2000) {
      return error('الرسالة طويلة جداً (2000 حرف كحد أقصى)', 400);
    }

    // 3. أنشئ محادثة جديدة إن لم يُعطَ conversation_id
    let convId = conversation_id;
    if (!convId) {
      const title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
      const { data: newConv, error: convError } = await supabaseAdmin
        .from('chat_conversations')
        .insert({
          user_id: userData.id,
          lesson_id: lesson_id || null,
          title,
        })
        .select('id')
        .single();

      if (convError || !newConv) {
        console.error('Error creating conversation:', convError);
        return error('فشل إنشاء المحادثة', 500);
      }
      convId = newConv.id;
    }

    // 4. احفظ رسالة المستخدم
    await supabaseAdmin.from('chat_messages').insert({
      conversation_id: convId,
      role: 'user',
      content: message.trim(),
    });

    // 5. ابنِ سياق الدرس إن وُجد
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

    // 6. جلب آخر 10 رسائل من المحادثة كسياق
    const { data: history } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: false })
      .limit(10);

    // رتّب بترتيب زمني تصاعدي
    const chatHistory = (history || []).reverse();

    // 7. جلب نقاط ضعف الطالب الأخيرة (إن وُجدت)
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

    // 8. ابني System Prompt النهائي
    const finalSystemPrompt = CHAT_SYSTEM_PROMPT + lessonContext + weakPointsContext;

    // 9. ابنِ رسائل API
    const apiMessages: Array<{ role: string; content: string }> = [];

    // أضف آخر 6 رسائل كسياق (ليس كل الـ 10 لتوفير التكلفة)
    const recentHistory = chatHistory.slice(-6);
    for (const msg of recentHistory) {
      apiMessages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // أضف الرسالة الجديدة
    apiMessages.push({ role: 'user', content: message.trim() });

    // 10. استدعِ Claude API مع Streaming
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1500,
        system: finalSystemPrompt,
        messages: apiMessages,
        stream: true, // تفعيل Streaming
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error('Claude API error:', errData);
      return error('فشل الاستجابة من الذكاء الاصطناعي', 500);
    }

    // 11. اقرأ الرد كـ Stream وأرجعه
    const stream = response.body;
    if (!stream) {
      return error('لم يتم استلام رد من الذكاء الاصطناعي', 500);
    }

    // أنشئ Transform Stream لقراءة SSE من Anthropic
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              // Anthropic يُرجع content في هذا الشكل
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                controller.enqueue(encoder.encode(parsed.delta.text));
              }
            } catch {
              // تجاهل الأسطر غير الصالحة
            }
          }
        }
      },
    });

    // 12. في الخلفية: احفظ رد المساعد بالكامل
    // نحتاج قراءة الرد كاملاً لحفظه
    (async () => {
      try {
        const reader = stream.getReader();
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          
          // استخرج النص من SSE
          const lines = text.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  fullResponse += parsed.delta.text;
                }
              } catch {}
            }
          }
        }

        // احفظ رد المساعد
        if (fullResponse) {
          await supabaseAdmin.from('chat_messages').insert({
            conversation_id: convId,
            role: 'assistant',
            content: fullResponse,
          });

          // حدّث تاريخ المحادثة
          await supabaseAdmin
            .from('chat_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', convId);

          // سجّل في ذاكرة السياق إن كانت رسالة تعليمية
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
              lesson_id: lesson_id || convId, // نستخدم convId كـ fallback
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

    // 13. أرجع Stream للمستخدم
    return new Response(stream.pipeThrough(transformStream), {
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