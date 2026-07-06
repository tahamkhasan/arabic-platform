import { AIGenerateParams, AIProvider, AIProviderError } from './types'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL = 'claude-sonnet-4-5'

function buildMessages(params: AIGenerateParams): Array<{ role: string; content: string }> {
  if (params.messages && params.messages.length > 0) {
    return params.messages.map(m => ({ role: m.role, content: m.content }))
  }
  return [{ role: 'user', content: params.userPrompt ?? '' }]
}

async function callAnthropic(params: AIGenerateParams, stream: boolean): Promise<Response> {
  const controller = new AbortController()
  const timeoutMs = params.timeoutMs ?? 90_000
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: params.maxTokens,
        system: params.systemPrompt,
        messages: buildMessages(params),
        ...(params.temperature != null ? { temperature: params.temperature } : {}),
        stream,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new AIProviderError(errData?.error?.message || `خطأ من Claude API (${response.status})`, true, 'claude')
    }
    return response
  } catch (err) {
    if (err instanceof AIProviderError) throw err
    if (err instanceof Error && err.name === 'AbortError') {
      throw new AIProviderError(`انتهت مهلة الاتصال بـ Claude (${timeoutMs / 1000} ثانية)`, true, 'claude')
    }
    throw new AIProviderError(err instanceof Error ? err.message : 'خطأ اتصال غير معروف بـ Claude', true, 'claude')
  } finally {
    clearTimeout(timeoutId)
  }
}

export const claudeProvider: AIProvider = {
  name: 'claude',

  async generate(params) {
    const response = await callAnthropic(params, false)
    const data = await response.json()
    return data.content?.[0]?.text || ''
  },

  async generateStream(params) {
    const response = await callAnthropic(params, true)
    const rawBody = response.body
    if (!rawBody) throw new AIProviderError('لم يُستلَم أي بث من Claude', true, 'claude')

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    // ── تحويل تنسيق SSE الخاص بـ Anthropic إلى نص خام موحَّد،
    // بحيث لا يحتاج أي مستهلك (route الدردشة مثلاً) معرفة أي
    // تفاصيل عن أي مزوّد يعمل خلف الكواليس. ──────────────────
    const transform = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true })
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]' || !data) continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              controller.enqueue(encoder.encode(parsed.delta.text))
            }
          } catch {
            // تجاهل الأسطر غير الصالحة
          }
        }
      },
    })

    return rawBody.pipeThrough(transform)
  },
}