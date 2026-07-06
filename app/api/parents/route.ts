import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrPermission, getServiceClient } from '@/lib/server/auth'

// ──────────────────────────────────────────────────────────────
// app/api/parents/route.ts
//
// POST: إنشاء حساب ولي أمر مباشرة من الأدمن — بنفس نمط
// /api/teachers تماماً: status: 'approved' فوراً، بلا انتظار
// موافقة، لأن من أنشأه هو الجهة المخوَّلة بالموافقة أصلاً.
//
// GET: قائمة أولياء الأمور الحاليين.
// ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAdminOrPermission(req, 'create_parents')
  if (!auth.ok) return auth.response

  try {
    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, status, created_at')
      .or('user_type.eq.parent,role.eq.parent')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message || 'فشل جلب أولياء الأمور.' }, { status: 500 })
    }

    return NextResponse.json({ items: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'خطأ غير متوقع أثناء جلب أولياء الأمور.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminOrPermission(req, 'create_parents')
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
      if (authError.code === 'email_exists' || authError.message.includes('already been registered')) {
        return NextResponse.json({ error: 'البريد الإلكتروني مسجل مسبقاً.' }, { status: 400 })
      }
      throw authError
    }

    const userId = authData.user.id

    // ── الفرق الجوهري عن /api/register: status معتمد فوراً ────
    const { error: dbError } = await supabase.from('users').insert({
      id: userId,
      email,
      full_name: name,
      role: 'parent',
      user_type: 'parent',
      status: 'approved',
      is_active: true,
    })

    if (dbError) {
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: dbError.message || 'فشل حفظ بيانات ولي الأمر.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      item: { id: userId, email, full_name: name, status: 'approved' },
    })
  } catch (err) {
    console.error('Parents POST error:', err)
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء حساب ولي الأمر.' }, { status: 500 })
  }
}