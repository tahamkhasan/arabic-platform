import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'أدخل البريد الإلكتروني وكلمة المرور' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      )
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select(
        'id, email, name, role, subscription, status, user_type, allowed_stages, allowed_grades, theme_color, theme_mode'
      )
      .eq('id', data.user.id)
      .single()

    if (userError || !userData) {
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'تعذر العثور على بيانات المستخدم، تواصل مع الإدارة' },
        { status: 404 }
      )
    }

    if (userData.role !== 'admin') {
      if (userData.status === 'pending') {
        await supabase.auth.signOut()
        return NextResponse.json(
          { error: 'طلبك قيد المراجعة. سيتم التواصل معك بعد الموافقة.' },
          { status: 403 }
        )
      }

      if (userData.status === 'rejected') {
        await supabase.auth.signOut()
        return NextResponse.json(
          { error: 'عذراً، تم رفض طلبك. تواصل مع المدير.' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        name: userData.name ?? '',
        subscription: userData.subscription ?? 'free',
        status: userData.status ?? 'pending',
        user_type: userData.user_type ?? 'teacher',
        userType: userData.user_type ?? 'teacher',
        allowed_stages: userData.allowed_stages ?? [],
        allowed_grades: userData.allowed_grades ?? [],
        theme_color: userData.theme_color ?? '#f9d423',
        theme_mode: userData.theme_mode ?? 'dark',
      },
      session: data.session,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ داخلي في تسجيل الدخول' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    await supabase.auth.signOut()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'تعذر تسجيل الخروج' },
      { status: 500 }
    )
  }
}