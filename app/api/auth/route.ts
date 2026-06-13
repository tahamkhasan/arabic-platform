import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      )
    }

    // جلب بيانات المستخدم
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, subscription, status, user_type')
      .eq('id', data.user.id)
      .single()

    console.log('userData from DB:', userData)
    console.log('userError:', userError)

    // التحقق من حالة المستخدم
    if (userData?.role !== 'admin') {
      if (!userData || userData?.status === 'pending') {
        return NextResponse.json(
          { error: 'طلبك قيد المراجعة. سيتم التواصل معك بعد الموافقة.' },
          { status: 403 }
        )
      }
      if (userData?.status === 'rejected') {
        return NextResponse.json(
          { error: 'عذراً، تم رفض طلبك. تواصل مع المدير.' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userData?.role ?? 'teacher',
        name: userData?.name ?? '',
        subscription: userData?.subscription ?? 'free',
        status: userData?.status ?? 'pending',
        userType: userData?.user_type ?? 'teacher',
      },
      session: data.session,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await supabase.auth.signOut()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}