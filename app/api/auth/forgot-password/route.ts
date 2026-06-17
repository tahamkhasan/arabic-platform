import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'أدخل البريد الإلكتروني' }, { status: 400 })
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, status')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'البريد الإلكتروني غير مسجل' }, { status: 404 })
    }

    if (user.status === 'pending') {
      return NextResponse.json({ error: 'حسابك قيد المراجعة' }, { status: 403 })
    }

    if (user.status === 'rejected') {
      return NextResponse.json({ error: 'حسابك غير مفعّل' }, { status: 403 })
    }

    const APP_URL =
      process.env.NEXT_PUBLIC_APP_URL || 'https://mosaed-arabic.vercel.app'

    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: `${APP_URL}/reset-password` },
      })

    if (linkError) throw linkError

    await sendPasswordResetEmail(email, linkData.properties.action_link)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'حدث خطأ في إرسال الرابط' }, { status: 500 })
  }
}