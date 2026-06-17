import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendRegistrationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, userType, allowedStages, allowedGrades } = await req.json()

    if (!name || !email || !password || !userType) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    if (!['teacher', 'student'].includes(userType)) {
      return NextResponse.json({ error: 'نوع المستخدم غير صالح' }, { status: 400 })
    }

if (password.length < 8) {
  return NextResponse.json(
    { error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
    { status: 400 }
  )
}

    const role = userType === 'student' ? 'student' : 'teacher'

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json({ error: 'البريد الإلكتروني مسجل مسبقاً' }, { status: 400 })
      }
      throw authError
    }

const { error: dbError } = await supabaseAdmin.from('users').insert({
  id: authData.user.id,
  email,
  name,
  role,
  user_type: userType,
  status: 'pending',
  allowed_stages: allowedStages || [],
  allowed_grades: allowedGrades || [],
})

if (dbError) {
  await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
  throw dbError
}

    try {
      await sendRegistrationEmail({
        name,
        email,
        userType,
        allowedStages: allowedStages || [],
        allowedGrades: allowedGrades || [],
      })
    } catch (emailErr) {
      console.error('Email error:', emailErr)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء إنشاء الحساب' },
      { status: 500 }
    )
  }
}