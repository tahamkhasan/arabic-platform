import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, userType, allowedStages, allowedGrades } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    // إنشاء المستخدم في Supabase Auth
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

    // حفظ بيانات المستخدم
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        role: 'teacher',
        user_type: userType,
        status: 'pending',
        allowed_stages: allowedStages || [],
        allowed_grades: allowedGrades || [],
      })

    if (dbError) throw dbError

    // إرسال إيميل للمدير
    await notifyAdmin({ name, email, userType, allowedStages, allowedGrades })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function notifyAdmin({ name, email, userType, allowedStages, allowedGrades }: any) {
  try {
    // جلب إيميل المدير
    const { data: admins } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('role', 'admin')
      .limit(1)

    if (!admins || admins.length === 0) return

    const adminEmail = admins[0].email

    const stageNames: Record<string, string> = {
      primary: 'ابتدائي',
      middle: 'متوسط',
      high: 'ثانوي',
    }

    const stagesText = allowedStages?.map((s: string) => stageNames[s] || s).join('، ') || '-'
    const gradesText = allowedGrades?.join('، ') || '-'

    // إرسال إيميل عبر Supabase
    await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: adminEmail,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/admin`,
      },
    })

    // إرسال إيميل للمستخدم
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`,
      },
      body: JSON.stringify({
        to: email,
        subject: 'تم استلام طلب تسجيلك — منصة مساعد اللغة العربية',
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #f9d423;">🌙 منصة مساعد اللغة العربية</h2>
            <p>أهلاً <strong>${name}</strong>،</p>
            <p>تم استلام طلب تسجيلك بنجاح وهو قيد المراجعة من قبل المدير.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 10px; margin: 20px 0;">
              <p><strong>نوع الحساب:</strong> ${userType === 'teacher' ? 'معلم' : 'طالب'}</p>
              <p><strong>المراحل:</strong> ${stagesText}</p>
              ${userType === 'student' ? `<p><strong>الصف:</strong> ${gradesText}</p>` : ''}
            </div>
            <p>ستصلك رسالة أخرى بعد الموافقة على طلبك.</p>
            <p style="color: #888; font-size: 12px;">منصة مساعد اللغة العربية • الكويت</p>
          </div>
        `,
      }),
    })
  } catch (err) {
    console.error('Email notification error:', err)
    // لا نوقف العملية إذا فشل الإيميل
  }
}