import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

type ThemeMode = 'light' | 'dark'

type SettingsPayload = {
  userId?: string
  theme_color?: string | null
  theme_mode?: ThemeMode | null
}

function buildUpdatePayload(payload: SettingsPayload) {
  const updateData: { theme_color?: string | null; theme_mode?: ThemeMode | null } = {}

  if (payload.theme_color !== undefined) {
    updateData.theme_color = payload.theme_color
  }

  if (payload.theme_mode !== undefined) {
    if (
      payload.theme_mode !== 'light' &&
      payload.theme_mode !== 'dark' &&
      payload.theme_mode !== null
    ) {
      throw new Error('قيمة theme_mode غير صالحة')
    }

    updateData.theme_mode = payload.theme_mode
  }

  return updateData
}

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization')

  if (!auth?.startsWith('Bearer ')) {
    return null
  }

  return auth.slice(7).trim()
}

async function getRequestUser(token: string) {
  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token)

  if (authError || !user) {
    return { user: null, profile: null, error: 'جلسة المستخدم غير صالحة أو منتهية' }
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('id, role, user_type, status')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { user, profile: null, error: 'تعذر تحميل ملف المستخدم' }
  }

  return { user, profile, error: null }
}

async function handleSettingsUpdate(req: NextRequest) {
  try {
    const token = getBearerToken(req)

    if (!token) {
      return NextResponse.json({ error: 'Missing bearer token.' }, { status: 401 })
    }

    const { profile, error: requestUserError } = await getRequestUser(token)

    if (requestUserError || !profile) {
      return NextResponse.json(
        { error: requestUserError || 'تعذر التحقق من المستخدم' },
        { status: 401 }
      )
    }

    if (profile.status === 'pending' || profile.status === 'suspended') {
      return NextResponse.json(
        {
          error:
            profile.status === 'pending'
              ? 'حسابك بانتظار موافقة المدير'
              : 'حسابك معلّق — تواصل مع الإدارة',
        },
        { status: 403 }
      )
    }

    const body = (await req.json()) as SettingsPayload
    const updateData = buildUpdatePayload(body)

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات لحفظها' }, { status: 400 })
    }

    const targetUserId = (body.userId || profile.id || '').trim()

    if (!targetUserId) {
      return NextResponse.json({ error: 'معرف المستخدم المطلوب غير متوفر' }, { status: 400 })
    }

    const isSelfUpdate = targetUserId === profile.id
    const isAdmin = profile.role === 'admin'

    if (!isSelfUpdate && !isAdmin) {
      return NextResponse.json(
        { error: 'غير مصرح لك بتعديل إعدادات مستخدم آخر' },
        { status: 403 }
      )
    }

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', targetUserId)
      .select('id, theme_color, theme_mode')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      settings: {
        user_id: updatedUser.id,
        theme_color: updatedUser.theme_color ?? null,
        theme_mode: updatedUser.theme_mode ?? null,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'تعذر حفظ الإعدادات' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  return handleSettingsUpdate(req)
}

export async function PUT(req: NextRequest) {
  return handleSettingsUpdate(req)
}