import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrPermission, getServiceClient } from '@/lib/server/auth'

// ──────────────────────────────────────────────────────────────
// app/api/teachers/route.ts
//
// POST: إنشاء حساب معلم مباشرة من الأدمن (أو موظف يحمل صلاحية
// create_teachers) — بخلاف /api/register، هذا المسار يُنشئ الحساب
// بـ status: 'approved' فوراً، بلا انتظار موافقة لاحقة، لأن من
// أنشأه أصلاً هو الجهة المخوَّلة بالموافقة.
//
// GET: قائمة المعلمين الحاليين (للوحة الأدمن، تبويب "المعلمون").
// ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAdminOrPermission(req, 'create_teachers')
  if (!auth.ok) return auth.response

  try {
    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, status, created_at')
      .or('user_type.eq.teacher,role.eq.teacher')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message || 'فشل جلب المعلمين.' }, { status: 500 })
    }

    return NextResponse.json({ items: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'خطأ غير متوقع أثناء جلب المعلمين.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminOrPermission(req, 'create_teachers')
  if (!auth.ok) return auth.response

  try {
    const supabase = getServiceClient()

    const body = (await req.json().catch(() => null)) as
      | { name?: string; email?: string; password?: string }
      | null

    if (!body?.name?.trim() || !body?.email?.trim() || !body?.password) {
      return NextResponse.json({ error: 'الاسم والبريد وكلمة المرور مطلوبة.' }, { status: 400 })
    }

    const name = body.name.trim()
    const email = body.email.trim().toLowerCase()
    const password = body.password

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' },
        { status: 400 },
      )
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json({ error: 'البريد الإلكتروني مسجل مسبقاً.' }, { status: 400 })
      }
      throw authError
    }

    const userId = authData.user.id

    // ── البحث عن دور افتراضي للمعلم (نفس نمط register/route.ts) ──
    let defaultRoleId: string | null = null
    try {
      const { data: defaultRole } = await supabase
        .from('roles')
        .select('id')
        .eq('key', 'teacher')
        .eq('is_active', true)
        .maybeSingle()

      if (defaultRole?.id) defaultRoleId = defaultRole.id
    } catch {
      // لا يوقف الإنشاء — الدور اختياري
    }

    // ── الفرق الجوهري عن /api/register: status معتمد فوراً، لأن
    // من أنشأ الحساب هو الجهة المخوَّلة بالموافقة أصلاً ──────────
    const { error: dbError } = await supabase.from('users').insert({
      id: userId,
      email,
      full_name: name,
      role: 'teacher',
      user_type: 'teacher',
      assigned_role_id: defaultRoleId,
      status: 'approved',
      is_active: true,
      allowed_stages: [],
      allowed_grades: [],
    })

    if (dbError) {
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: dbError.message || 'فشل حفظ بيانات المعلم.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      item: { id: userId, email, full_name: name, status: 'approved' },
    })
  } catch (err) {
    console.error('Teachers POST error:', err)
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء حساب المعلم.' }, { status: 500 })
  }
}