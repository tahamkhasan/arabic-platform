import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    let query = supabaseAdmin
      .from('users')
      .select('*')
      .neq('role', 'admin')
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ users: data || [] })
  } catch (error: any) {
    return NextResponse.json({ users: [] })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId, status, adminId } = await req.json()

    // التحقق من المدير
    const { data: admin } = await supabaseAdmin
      .from('users').select('role').eq('id', adminId).single()
    if (!admin || admin.role !== 'admin')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    // جلب بيانات المستخدم
    const { data: userData } = await supabaseAdmin
      .from('users').select('*').eq('id', userId).single()
    if (!userData)
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })

    // تحديث الحالة
    const { error } = await supabaseAdmin
      .from('users').update({ status }).eq('id', userId)
    if (error) throw error

    // إرسال إيميل حسب القرار
    try {
      if (status === 'approved') {
        await sendApprovalEmail({
          name: userData.name,
          email: userData.email,
          userType: userData.user_type,
          allowedStages: userData.allowed_stages || [],
          allowedGrades: userData.allowed_grades || [],
        })
      } else if (status === 'rejected') {
        await sendRejectionEmail({
          name: userData.name,
          email: userData.email,
        })
      }
    } catch (emailErr) {
      console.error('Email error:', emailErr)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}