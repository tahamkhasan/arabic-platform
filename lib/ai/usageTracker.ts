import { getServiceClient } from '@/lib/server/auth'

// ══════════════════════════════════════════════════════
// عدّاد استخدام Claude اليومي — مخزَّن في platform_settings
// بنفس بنية key-value المعتمدة في المشروع (لا أعمدة جديدة).
// الحد يُضبَط من /admin/settings، والعدّاد يُصفَّر تلقائياً
// كل يوم لأن المفتاح يتضمن تاريخ اليوم (UTC). ──────────────
// ══════════════════════════════════════════════════════

const LIMIT_KEY = 'ai_daily_claude_limit'
const USAGE_KEY_PREFIX = 'ai_usage_claude_'

function todayKey(): string {
  const iso = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return `${USAGE_KEY_PREFIX}${iso}`
}

export async function getDailyLimit(): Promise<number | null> {
  try {
    const supabase = getServiceClient()
    const { data } = await supabase.from('platform_settings').select('value').eq('key', LIMIT_KEY).maybeSingle()
    const num = data?.value != null ? Number(data.value) : NaN
    return Number.isFinite(num) && num > 0 ? num : null
  } catch {
    return null
  }
}

export async function setDailyLimit(limit: number | null): Promise<void> {
  const supabase = getServiceClient()
  const value = limit && limit > 0 ? String(Math.floor(limit)) : '0'
  await supabase.from('platform_settings').upsert({ key: LIMIT_KEY, value }, { onConflict: 'key' })
}

export async function getTodayUsage(): Promise<number> {
  try {
    const supabase = getServiceClient()
    const { data } = await supabase.from('platform_settings').select('value').eq('key', todayKey()).maybeSingle()
    const num = data?.value != null ? Number(data.value) : 0
    return Number.isFinite(num) ? num : 0
  } catch {
    return 0
  }
}

export async function isClaudeOverLimit(): Promise<boolean> {
  const limit = await getDailyLimit()
  if (limit === null) return false // لا حد مضبوط = بلا سقف، Claude يعمل دائماً
  const usage = await getTodayUsage()
  return usage >= limit
}

// ── تُستدعى بعد كل استدعاء ناجح لـ Claude، بشكل غير حاجز (fire-and-forget) ──
export async function recordClaudeUsage(): Promise<void> {
  try {
    const supabase = getServiceClient()
    const key = todayKey()
    const { data } = await supabase.from('platform_settings').select('value').eq('key', key).maybeSingle()
    const current = data?.value != null ? Number(data.value) : 0
    const next = (Number.isFinite(current) ? current : 0) + 1
    await supabase.from('platform_settings').upsert({ key, value: String(next) }, { onConflict: 'key' })
  } catch (err) {
    console.error('تعذّر تسجيل استخدام Claude:', err)
  }
}