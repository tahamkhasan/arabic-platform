import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import getCurrentAdminContext from '@/lib/admin-helpers'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase admin environment variables.')
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

function sanitizeFileName(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function getFileExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && fromName.length <= 5) return fromName

  const typeMap: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
  }

  return typeMap[file.type] || 'png'
}

async function ensurePlatformSettingsRow(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>) {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('platform_settings')
    .select('id')
    .limit(1)
    .maybeSingle()

  if (existingError) {
    throw new Error(existingError.message || 'تعذر قراءة إعدادات المنصة الحالية.')
  }

  if (existing?.id) return existing.id

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('platform_settings')
    .insert({
      id: 1,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (insertError) {
    throw new Error(insertError.message || 'تعذر إنشاء سجل إعدادات المنصة.')
  }

  return inserted.id
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getCurrentAdminContext()

    if (!ctx.ok) {
      return NextResponse.json(
        { error: ctx.error },
        { status: ctx.status }
      )
    }

    if (ctx.profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'غير مصرح لك برفع شعار المنصة.' },
        { status: 403 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('logo')

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'لم يتم إرسال ملف الشعار.' },
        { status: 400 }
      )
    }

    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/svg+xml',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'نوع الملف غير مدعوم. استخدم PNG أو JPG أو WEBP أو SVG.' },
        { status: 400 }
      )
    }

    const maxSizeBytes = 2 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: 'حجم الشعار كبير جدًا. الحد الأقصى 2MB.' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'platform-assets'

    const rowId = await ensurePlatformSettingsRow(supabaseAdmin)

    const ext = getFileExtension(file)
    const safeBase = sanitizeFileName(file.name.replace(/\.[^/.]+$/, '')) || 'logo'
    const filePath = `platform/logo-${rowId}-${Date.now()}-${safeBase}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message || 'فشل رفع الشعار إلى التخزين.' },
        { status: 500 }
      )
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath)

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('platform_settings')
      .update({
        logo_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rowId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'تم رفع الملف لكن فشل حفظ رابط الشعار.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      url: publicUrl,
      settings: updated,
      message: 'تم رفع شعار المنصة بنجاح.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء رفع شعار المنصة.' },
      { status: 500 }
    )
  }
}