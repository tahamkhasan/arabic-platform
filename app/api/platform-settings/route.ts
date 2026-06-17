import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/platform-settings
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('platform_settings')
      .select('key, value')

    if (error) throw error

    const settings: Record<string, string> = {}
    ;(data ?? []).forEach(row => { settings[row.key] = row.value })

    return NextResponse.json({ settings })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH /api/platform-settings
export async function PATCH(req: NextRequest) {
  try {
    const { key, value } = await req.json()
    if (!key) return NextResponse.json({ error: 'key مطلوب' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('platform_settings')
      .upsert({ key, value }, { onConflict: 'key' })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}