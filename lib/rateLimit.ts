import { supabaseAdmin } from '@/lib/supabase-admin'

const RATE_LIMIT_MAX    = 10  // أقصى عدد طلبات
const RATE_LIMIT_WINDOW = 60  // النافذة الزمنية بالثواني

interface RateLimitResult {
  allowed:   boolean
  remaining: number
  resetAt:   Date
}

export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW * 1000).toISOString()
  const resetAt     = new Date(Date.now() + RATE_LIMIT_WINDOW * 1000)

  const { count, error } = await supabaseAdmin
    .from('generations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', windowStart)

  if (error) {
    console.error('[rateLimit] DB error:', error)
    return { allowed: true, remaining: RATE_LIMIT_MAX, resetAt }
  }

  const requestCount = count ?? 0
  const remaining    = Math.max(0, RATE_LIMIT_MAX - requestCount)
  const allowed      = requestCount < RATE_LIMIT_MAX

  return { allowed, remaining, resetAt }
}