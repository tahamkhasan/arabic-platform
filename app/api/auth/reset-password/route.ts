import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token) {
      return NextResponse.json(
        { error: 'رابط إعادة التعيين غير صالح أو منتهي' },
        { status: 400 }
      )
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin.auth.admin.getUserById(token)

    if (error || !data?.user) {
      return NextResponse.json(
        { error: 'رمز إعادة التعيين غير صالح' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      data.user.id,
      { password }
    )

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'تعذر إعادة تعيين كلمة المرور' },
      { status: 500 }
    )
  }
}