import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendRegistrationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { action, email, password, name, userType, allowedStages, allowedGrades } = await req.json()

    if (action !== 'register') {
      return NextResponse.json(
        { error: 'الإجراء غير صالح' },
        { status: 400 }
      )
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
        { status: 400 }
      )
    }

    const normalizedUserType =
      userType && ['teacher', 'student'].includes(userType) ? userType : 'teacher'

    const role = normalizedUserType === 'student' ? 'student' : 'teacher'

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

    if (authError) {
      if (authError.message?.toLowerCase().includes('already registered')) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني مسجل مسبقاً' },
          { status: 400 }
        )
      }

      throw authError
    }

    const userId = authData.user.id

    const { error: dbError } = await supabaseAdmin.from('users').insert({
      id: userId,
      email,
      full_name: name,
      role,
      user_type: normalizedUserType,
      assigned_role_key: role,
      status: 'pending',
      is_active: true,
      allowed_stages: allowedStages || [],
      allowed_grades: allowedGrades || [],
    })

    if (dbError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw dbError
    }

    try {
      await sendRegistrationEmail({
        name,
        email,
        userType: normalizedUserType,
        allowedStages: allowedStages || [],
        allowedGrades: allowedGrades || [],
      })
    } catch (emailErr) {
      console.error('Email error:', emailErr)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ داخلي في تنفيذ الطلب' },
      { status: 500 }
    )
  }
}