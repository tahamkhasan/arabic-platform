import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// إرسال رابط إعادة تعيين كلمة المرور
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'أدخل البريد الإلكتروني' }, { status: 400 })

    // التحقق من وجود المستخدم
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, status')
      .eq('email', email)
      .single()

    if (!user) return NextResponse.json({ error: 'البريد الإلكتروني غير مسجل' }, { status: 404 })
    if (user.status === 'pending') return NextResponse.json({ error: 'حسابك قيد المراجعة' }, { status: 403 })
    if (user.status === 'rejected') return NextResponse.json({ error: 'حسابك غير مفعّل' }, { status: 403 })

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// تحديث كلمة المرور الجديدة
export async function PATCH(req: NextRequest) {
  try {
    const { password, userId } = await req.json()
    if (!password || password.length < 6)
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password })
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// تحديث إعدادات المظهر
export async function PUT(req: NextRequest) {
  try {
    const { userId, theme_color, theme_mode } = await req.json()
    const { error } = await supabaseAdmin
      .from('users')
      .update({ theme_color, theme_mode })
      .eq('id', userId)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}