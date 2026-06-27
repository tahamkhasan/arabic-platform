import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, requireUser } from '@/lib/server/auth'

// ──────────────────────────────────────────────────────────────
// app/api/students/route.ts (جديد)
//
// GET: قائمة الطلاب المعتمدين — لاستخدام المعلم في تبويب "الطلاب"
// و"الفصول" (إضافة طلاب)، بدل فتح app/api/users لهم بالكامل.
//
// لماذا نقطة مستقلة بدل توسيع users/route.ts:
// 1) users/route.ts محمية بـ requireAdmin فقط — توسيعها للمعلمين
//    يعني كشف بيانات كل المستخدمين (أدمن/معلمين آخرين) لهم، لا فقط
//    الطلاب. نقطة مستقلة تُرجع فقط ما يحتاجه المعلم بالضبط.
// 2) حقول محدودة عمداً (لا status/created_at/role الكاملة) —
//    تكفي لعرض الاسم والبريد والصف فقط، بلا تفاصيل إدارية حساسة.
//
// الحماية: requireUser (أي مستخدم مسجَّل دخوله بدور صحيح)، ثم فحص
// إضافي يدوي أن الدور teacher أو admin — لا نستخدم requireAdmin
// لأن المعلم ليس أدمن، ولا نريد فتحها لكل مستخدم (مثل طالب آخر).
// ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if (!auth.ok) return auth.response

  // فقط المعلم أو الأدمن يمكنهما رؤية قائمة الطلاب من هنا
  if (auth.user.role !== 'teacher' && auth.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'هذه النقطة مخصَّصة للمعلمين والأدمن فقط.' },
      { status: 403 },
    )
  }

  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim().toLowerCase() || ''

    let query = supabase
      .from('users')
      .select('id, email, full_name, allowed_grades, allowed_stages, status')
      .eq('user_type', 'student')
      .eq('status', 'approved')
      .order('full_name', { ascending: true })

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message || 'فشل جلب قائمة الطلاب.' },
        { status: 500 },
      )
    }

    let students = (data || []).map((row) => ({
      id: row.id,
      name: row.full_name || row.email || 'بدون اسم',
      email: row.email ?? null,
      allowed_grades: row.allowed_grades ?? [],
      allowed_stages: row.allowed_stages ?? [],
    }))

    // فلترة اختيارية بالاسم/البريد إن طُلِب بحث نصي
    if (search) {
      students = students.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          (s.email ?? '').toLowerCase().includes(search),
      )
    }

    return NextResponse.json({ students })
  } catch (err) {
    console.error('GET /api/students error:', err)
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع أثناء جلب الطلاب.' },
      { status: 500 },
    )
  }
}