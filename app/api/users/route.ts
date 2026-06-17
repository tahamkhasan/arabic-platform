import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const role = searchParams.get('role')
    const userType = searchParams.get('userType')
    const status = searchParams.get('status')

    let query = supabaseAdmin
      .from('users')
      .select(`
        id,
        name,
        email,
        role,
        user_type,
        status,
        allowed_grades,
        allowed_stages,
        theme_color,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    } else {
      query = query.eq('status', 'approved')
    }

    if (role) {
      query = query.eq('role', role)
    }

    if (userType) {
      query = query.eq('user_type', userType)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ users: data ?? [] })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId, status, adminId } = await req.json()

    if (!userId || !status || !adminId) {
      return NextResponse.json(
        { error: 'بيانات ناقصة' },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'حالة غير صالحة' },
        { status: 400 }
      )
    }

    const { data: admin, error: adminError } = await supabaseAdmin
      .from('users')
      .select('id, role, status')
      .eq('id', adminId)
      .single()

    if (adminError || !admin) {
      return NextResponse.json(
        { error: 'تعذر التحقق من المدير' },
        { status: 403 }
      )
    }

    if (admin.role !== 'admin' || admin.status !== 'approved') {
      return NextResponse.json(
        { error: 'غير مصرح لك' },
        { status: 403 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ status })
      .eq('id', userId)
      .select('id, name, email, role, user_type, status')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, user: data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}