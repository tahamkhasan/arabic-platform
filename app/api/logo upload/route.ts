import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/platform-settings/logo
// يرفع الشعار إلى Supabase Storage ويحدث platform_settings
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('logo') as File | null

    if (!file) return NextResponse.json({ error: 'لم يُرفع ملف' }, { status: 400 })

    // التحقق من النوع
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'الملف يجب أن يكون صورة' }, { status: 400 })
    }

    // التحقق من الحجم (أقل من 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'الصورة يجب أن تكون أقل من 2MB' }, { status: 400 })
    }

    const ext      = file.name.split('.').pop() ?? 'png'
    const fileName = `logo-midad.${ext}`
    const buffer   = Buffer.from(await file.arrayBuffer())

    // رفع إلى Supabase Storage bucket: 'public'
    const { error: uploadError } = await supabaseAdmin.storage
      .from('public')
      .upload(fileName, buffer, {
        contentType:  file.type,
        upsert:       true,
      })

    if (uploadError) throw uploadError

    // جلب الرابط العام
    const { data: urlData } = supabaseAdmin.storage
      .from('public')
      .getPublicUrl(fileName)

    const publicUrl = urlData.publicUrl

    // حفظ الرابط في platform_settings
    await supabaseAdmin
      .from('platform_settings')
      .upsert({ key: 'logo_url', value: publicUrl }, { onConflict: 'key' })

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ في الرفع'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}