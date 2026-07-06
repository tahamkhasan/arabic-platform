import { AIGenerateParams, AIProvider, AIProviderError } from './types'

// ── الافتراضي الثابت في الكود: gemini-3.5-flash (مجاني بالكامل،
// لا يتطلب فوترة). متغير البيئة GEMINI_MODEL يُستخدَم فقط إن
// أردت لاحقاً رفع الجودة عمداً (مثلاً gemini-3.1-pro-preview بعد
// تفعيل الفوترة) — لكن حتى لو نُسي ضبط المتغير في أي بيئة، الكود
// لن يستدعي أبداً نموذجاً مدفوعاً بالخطأ. ──────────────────────
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

function buildContents(params: AIGenerateParams): Array<{ role: string; parts: { text: string }[] }> {
  if (params.messages && params.messages.length > 0) {
    return params.messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user', // Gemini يسمّي دور المساعد "model"
      parts: [{ text: m.content }],
    }))
  }
  return [{ role: 'user', parts: [{ text: params.userPrompt ?? '' }] }]
}

async function callGemini(params: AIGenerateParams, streaming: boolean): Promise<Response> {
  const controller = new AbortController()
  const timeoutMs = params.timeoutMs ?? 90_000
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  const method = streaming ? 'streamGenerateContent' : 'generateContent'
  const url = `${BASE_URL}/${GEMINI_MODEL}:${method}${streaming ? '?alt=sse' : ''}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: buildContents(params),
        systemInstruction: { parts: [{ text: params.systemPrompt }] },
        generationConfig: {
          maxOutputTokens: params.maxTokens,
          ...(params.temperature != null ? { temperature: params.temperature } : {}),
          ...(params.jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new AIProviderError(errData?.error?.message || `خطأ من Gemini API (${response.status})`, true, 'gemini')
    }
    return response
  } catch (err) {
    if (err instanceof AIProviderError) throw err
    if (err instanceof Error && err.name === 'AbortError') {
      throw new AIProviderError(`انتهت مهلة الاتصال بـ Gemini (${timeoutMs / 1000} ثانية)`, true, 'gemini')
    }
    throw new AIProviderError(err instanceof Error ? err.message : 'خطأ اتصال غير معروف بـ Gemini', true, 'gemini')
  } finally {
    clearTimeout(timeoutId)
  }
}

export const geminiProvider: AIProvider = {
  name: 'gemini',

  async generate(params) {
    const response = await callGemini(params, false)
    const data = await response.json()
    const parts = data?.candidates?.[0]?.content?.parts || []
    return parts.map((p: any) => p.text || '').join('')
  },

  async generateStream(params) {
    const response = await callGemini(params, true)
    const rawBody = response.body
    if (!rawBody) throw new AIProviderError('لم يُستلَم أي بث من Gemini', true, 'gemini')

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const transform = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true })
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (!data) continue
          try {
            const parsed = JSON.parse(data)
            const parts = parsed?.candidates?.[0]?.content?.parts || []
            const pieceText = parts.map((p: any) => p.text || '').join('')
            if (pieceText) controller.enqueue(encoder.encode(pieceText))
          } catch {
            // تجاهل الأسطر غير الصالحة
          }
        }
      },
    })

    return rawBody.pipeThrough(transform)
  },
}