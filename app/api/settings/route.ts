import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PUT(req: NextRequest) {
  try {
    const { userId, theme_color, theme_mode } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ theme_color, theme_mode })
      .eq('id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'تعذر حفظ الإعدادات' },
      { status: 500 }
    )
  }
}