// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables.')
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)

    const password = body?.password?.trim()
    const accessToken = body?.accessToken?.trim()
    const refreshToken = body?.refreshToken?.trim()

    if (!password) {
      return NextResponse.json(
        { error: 'كلمة المرور الجديدة مطلوبة.' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.' },
        { status: 400 }
      )
    }

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية.' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (sessionError) {
      return NextResponse.json(
        { error: sessionError.message || 'تعذر تفعيل جلسة إعادة التعيين.' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'تعذر تحديث كلمة المرور.' },
        { status: 500 }
      )
    }

    await supabase.auth.signOut()

    return NextResponse.json({
      success: true,
      message: 'تم تحديث كلمة المرور بنجاح.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء إعادة تعيين كلمة المرور.' },
      { status: 500 }
    )
  }
}