import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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
    return NextResponse.json({ users: [] }, { status: 200 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId, status, adminId } = await req.json()

    // التحقق من المدير
    const { data: admin } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', adminId)
      .single()

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    // جلب بيانات المستخدم
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    // تحديث الحالة
    const { error } = await supabaseAdmin
      .from('users')
      .update({ status })
      .eq('id', userId)

    if (error) throw error

    // إرسال إيميل للمستخدم
    await sendStatusEmail(userData, status)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function sendStatusEmail(user: any, status: string) {
  try {
    const isApproved = status === 'approved'

    const stageNames: Record<string, string> = {
      primary: 'ابتدائي',
      middle: 'متوسط',
      high: 'ثانوي',
    }

    const stagesText = user.allowed_stages?.map((s: string) => stageNames[s] || s).join('، ') || '-'

    const subject = isApproved
      ? '✅ تمت الموافقة على طلبك — منصة مساعد اللغة العربية'
      : '❌ تم رفض طلبك — منصة مساعد اللغة العربية'

    const html = isApproved ? `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #43e97b;">✅ تمت الموافقة على طلبك!</h2>
        <p>أهلاً <strong>${user.name}</strong>،</p>
        <p>يسعدنا إخبارك بأنه تمت الموافقة على طلب تسجيلك في منصة مساعد اللغة العربية.</p>
        <div style="background: #f0fff4; padding: 15px; border-radius: 10px; margin: 20px 0; border-right: 4px solid #43e97b;">
          <p><strong>نوع الحساب:</strong> ${user.user_type === 'teacher' ? '👨‍🏫 معلم' : '👨‍🎓 طالب'}</p>
          <p><strong>المراحل المتاحة:</strong> ${stagesText}</p>
          ${user.user_type === 'student' ? `<p><strong>الصف:</strong> ${user.allowed_grades?.join('، ') || '-'}</p>` : ''}
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}"
          style="display: inline-block; background: linear-gradient(135deg,#f9d423,#ff4e50); color: #1a1a2e; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; margin: 10px 0;">
          دخول المنصة ←
        </a>
        <p style="color: #888; font-size: 12px; margin-top: 20px;">منصة مساعد اللغة العربية • الكويت</p>
      </div>
    ` : `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #fc8181;">❌ تم رفض طلبك</h2>
        <p>أهلاً <strong>${user.name}</strong>،</p>
        <p>نأسف لإخبارك بأنه تم رفض طلب تسجيلك في منصة مساعد اللغة العربية.</p>
        <p>للاستفسار تواصل مع المدير.</p>
        <p style="color: #888; font-size: 12px; margin-top: 20px;">منصة مساعد اللغة العربية • الكويت</p>
      </div>
    `

    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`,
      },
      body: JSON.stringify({ to: user.email, subject, html }),
    })
  } catch (err) {
    console.error('Email error:', err)
  }
}