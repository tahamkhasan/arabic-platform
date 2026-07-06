import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getDailyLimit, setDailyLimit, getTodayUsage } from '@/lib/ai/usageTracker'

async function getAdminUser(token: string) {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null
  const { data } = await supabaseAdmin.from('users').select('id, role, status').eq('id', user.id).single()
  if (!data || data.status !== 'approved' || data.role !== 'admin') return null
  return data
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? null
  if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const admin = await getAdminUser(token)
  if (!admin) return NextResponse.json({ error: 'هذه الميزة للأدمن فقط' }, { status: 403 })

  const [dailyLimit, usageToday] = await Promise.all([getDailyLimit(), getTodayUsage()])
  return NextResponse.json({ dailyLimit: dailyLimit ?? 0, usageToday })
}

export async function PATCH(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? null
  if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const admin = await getAdminUser(token)
  if (!admin) return NextResponse.json({ error: 'هذه الميزة للأدمن فقط' }, { status: 403 })

  try {
    const body = await req.json()
    const limit = Number(body?.dailyLimit)
    if (!Number.isFinite(limit) || limit < 0) {
      return NextResponse.json({ error: 'قيمة الحد اليومي غير صالحة' }, { status: 400 })
    }
    await setDailyLimit(limit > 0 ? limit : null)
    return NextResponse.json({ dailyLimit: limit })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'فشل حفظ الحد اليومي' }, { status: 500 })
  }
}