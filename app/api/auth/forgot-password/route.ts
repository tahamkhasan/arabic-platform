// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
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
    const email = body?.email?.trim()?.toLowerCase()

    if (!email) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مطلوب.' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const redirectTo =
      process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
        : 'http://localhost:3000/reset-password'

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message || 'تعذر إرسال رابط إعادة تعيين كلمة المرور.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء معالجة الطلب.' },
      { status: 500 }
    )
  }
}