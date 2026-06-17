import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/platform-settings/logo
// يحوّل الصورة إلى base64 ويخزّنها مباشرة في platform_settings
// لا يحتاج Supabase Storage

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('logo') as File | null

    if (!file) {
      return NextResponse.json({ error: 'لم يُرفع ملف' }, { status: 400 })
    }

    // التحقق من النوع
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'الملف يجب أن يكون صورة' }, { status: 400 })
    }

    // التحقق من الحجم (أقل من 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'الصورة يجب أن تكون أقل من 2MB' }, { status: 400 })
    }

    // تحويل إلى base64
    const buffer     = await file.arrayBuffer()
    const base64     = Buffer.from(buffer).toString('base64')
    const dataUrl    = `data:${file.type};base64,${base64}`

    // حفظ في platform_settings
    const { error } = await supabaseAdmin
      .from('platform_settings')
      .upsert({ key: 'logo_url', value: dataUrl }, { onConflict: 'key' })

    if (error) throw error

    return NextResponse.json({ success: true, url: dataUrl })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ في الرفع'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}