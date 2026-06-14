import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendRegistrationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, userType, allowedStages, allowedGrades } = await req.json()

    if (!name || !email || !password)
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })

    // إنشاء المستخدم في Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already registered'))
        return NextResponse.json({ error: 'البريد الإلكتروني مسجل مسبقاً' }, { status: 400 })
      throw authError
    }

    // حفظ بيانات المستخدم
    const { error: dbError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email, name,
      role: 'teacher',
      user_type: userType,
      status: 'pending',
      allowed_stages: allowedStages || [],
      allowed_grades: allowedGrades || [],
    })

    if (dbError) throw dbError

    // إرسال إيميل تأكيد للمستخدم
    try {
      await sendRegistrationEmail({
        name, email, userType,
        allowedStages: allowedStages || [],
        allowedGrades: allowedGrades || [],
      })
    } catch (emailErr) {
      console.error('Email error:', emailErr)
      // لا نوقف العملية إذا فشل الإيميل
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}