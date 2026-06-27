import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import getCurrentAdminContext from '@/lib/admin-helpers'

export const dynamic = 'force-dynamic'

type PlatformSettingsRow = {
  id?: number
  logo_url?: string | null
  platform_name?: string | null
  contact_email?: string | null
  support_email?: string | null
  contact_phone?: string | null
  landing_title?: string | null
  landing_subtitle?: string | null
  updated_at?: string | null
  [key: string]: any
}

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

function normalizeNullableString(value: any) {
  if (value === undefined) return undefined
  if (value === null) return null
  const str = String(value).trim()
  return str ? str : null
}

function normalizeSettingsResponse(data: PlatformSettingsRow | null) {
  if (!data) return null

  const normalizedEmail = data.support_email ?? data.contact_email ?? null

  return {
    ...data,
    support_email: normalizedEmail,
    contact_email: normalizedEmail,
  }
}

function sanitizeSettingsPayload(body: Record<string, any>): PlatformSettingsRow {
  const payload: PlatformSettingsRow = {}

  if ('logo_url' in body) {
    payload.logo_url = normalizeNullableString(body.logo_url)
  }

  if ('platform_name' in body) {
    payload.platform_name = normalizeNullableString(body.platform_name)
  }

  if ('contact_phone' in body) {
    payload.contact_phone = normalizeNullableString(body.contact_phone)
  }

  if ('contact_email' in body || 'support_email' in body) {
    const emailValue =
      'support_email' in body ? body.support_email : body.contact_email

    const normalizedEmail = normalizeNullableString(emailValue)
    payload.contact_email = normalizedEmail
    payload.support_email = normalizedEmail
  }

  if ('landing_title' in body) {
    payload.landing_title = normalizeNullableString(body.landing_title)
  }

  if ('landing_subtitle' in body) {
    payload.landing_subtitle = normalizeNullableString(body.landing_subtitle)
  }

  payload.updated_at = new Date().toISOString()

  return payload
}

async function saveSettings(req: NextRequest) {
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
        { error: 'غير مصرح لك بتعديل إعدادات المنصة.' },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => null)

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'بيانات الطلب غير صالحة.' },
        { status: 400 }
      )
    }

    const payload = sanitizeSettingsPayload(body)

    const updatableKeys = Object.keys(payload).filter(key => key !== 'updated_at')
    if (updatableKeys.length === 0) {
      return NextResponse.json(
        { error: 'لا توجد إعدادات صالحة للحفظ.' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('platform_settings')
      .select('id')
      .limit(1)
      .maybeSingle()

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message || 'تعذر قراءة إعدادات المنصة الحالية.' },
        { status: 500 }
      )
    }

    if (existing?.id) {
      const { data, error } = await supabaseAdmin
        .from('platform_settings')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json(
          { error: error.message || 'فشل في تحديث إعدادات المنصة.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        settings: normalizeSettingsResponse(data),
        message: 'تم تحديث إعدادات المنصة بنجاح.',
      })
    }

    const insertPayload = {
      id: 1,
      ...payload,
    }

    const { data, error } = await supabaseAdmin
      .from('platform_settings')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message || 'فشل في إنشاء إعدادات المنصة.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      settings: normalizeSettingsResponse(data),
      message: 'تم إنشاء إعدادات المنصة بنجاح.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء حفظ إعدادات المنصة.' },
      { status: 500 }
    )
  }
}

// GET /api/platform-settings
export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('platform_settings')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        { error: error.message || 'فشل في جلب إعدادات المنصة.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      settings: normalizeSettingsResponse(data ?? null),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء جلب إعدادات المنصة.' },
      { status: 500 }
    )
  }
}

// PATCH /api/platform-settings
export async function PATCH(req: NextRequest) {
  return saveSettings(req)
}

// PUT /api/platform-settings
export async function PUT(req: NextRequest) {
  return saveSettings(req)
}