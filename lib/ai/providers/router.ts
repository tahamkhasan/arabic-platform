import { claudeProvider } from './claudeProvider'
import { geminiProvider } from './geminiProvider'
import { AIGenerateParams } from './types'
import { isClaudeOverLimit, recordClaudeUsage } from '../usageTracker'
import { repairAndParseJson } from '../jsonRepair'

export type ProviderName = 'claude' | 'gemini'

export interface AIGenerateResult { text: string; providerUsed: ProviderName; fellBack: boolean }
export interface AIStreamResult   { stream: ReadableStream<Uint8Array>; providerUsed: ProviderName; fellBack: boolean }

// ══════════════════════════════════════════════════════
// نقطة الدخول الوحيدة لكل استدعاءات الذكاء الاصطناعي في
// المنصة. Claude أولاً دائماً، إلا عند بلوغ الحد اليومي —
// وعندها Gemini مباشرة. أي فشل من Claude (اتصال/مهلة/خطأ
// خادم) يُحوَّل تلقائياً لـ Gemini بنفس المدخلات حرفياً. ──
// ══════════════════════════════════════════════════════

export async function generate(params: AIGenerateParams): Promise<AIGenerateResult> {
  const overLimit = await isClaudeOverLimit().catch(() => false)

  if (!overLimit) {
    try {
      const text = await claudeProvider.generate(params)
      recordClaudeUsage().catch(() => {})
      return { text, providerUsed: 'claude', fellBack: false }
    } catch (err) {
      console.error('⚠️ فشل Claude — التحويل التلقائي إلى Gemini:', err instanceof Error ? err.message : err)
    }
  } else {
    console.log('ℹ️ الحد اليومي لاستدعاءات Claude مُستنفَد — توجيه مباشر إلى Gemini')
  }

  const text = await geminiProvider.generate(params)
  return { text, providerUsed: 'gemini', fellBack: true }
}

export async function generateStream(params: AIGenerateParams): Promise<AIStreamResult> {
  const overLimit = await isClaudeOverLimit().catch(() => false)

  if (!overLimit) {
    try {
      const stream = await claudeProvider.generateStream(params)
      recordClaudeUsage().catch(() => {})
      return { stream, providerUsed: 'claude', fellBack: false }
    } catch (err) {
      console.error('⚠️ فشل بدء بث Claude — التحويل التلقائي إلى Gemini:', err instanceof Error ? err.message : err)
    }
  }

  const stream = await geminiProvider.generateStream(params)
  return { stream, providerUsed: 'gemini', fellBack: true }
}

// ── لحالات التوليد التي يجب أن تُرجع JSON (الاختبارات وغيرها) ──
export async function generateJSON<T = any>(
  params: Omit<AIGenerateParams, 'jsonMode'>
): Promise<{ data: T; providerUsed: ProviderName; fellBack: boolean }> {
  const result = await generate({ ...params, jsonMode: true })
  const data = repairAndParseJson<T>(result.text)
  return { data, providerUsed: result.providerUsed, fellBack: result.fellBack }
}