import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, requireAdminOrPermission } from '@/lib/server/auth'

type Context = {
  params: Promise<{ id: string }>
}

// PATCH /api/subject-packages/[id]
// ملاحظة تصميمية مهمة: stage/grade/track غير قابلة للتعديل هنا عمداً —
// student_subscriptions يخزّن نسخته الخاصة من هذه القيم وقت الإسناد؛
// تغييرها على الباقة بعد إسنادها لطلاب يُنشئ تعارضاً صامتاً بين الباقة
// واشتراكات قائمة عليها (نفس فئة الخلل التي عالجناها في migration 004).
// لتغيير المرحلة/الصف الفعلي لباقة: أنشئ باقة جديدة، لا تعدّل القديمة.
export async function PATCH(req: NextRequest, context: Context) {
  const auth = await requireAdminOrPermission(req, 'manage_subscriptions')
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const body = await req.json()
    const { name, description, is_active } = body

    const supabase = getServiceClient()
    const updates: Record<string, unknown> = {}

    if (typeof name === 'string' && name.trim()) updates.name = name.trim()
    if (typeof description === 'string') updates.description = description.trim() || null
    if (typeof is_active === 'boolean') updates.is_active = is_active

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from('subject_packages').update(updates).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: updated, error: fetchError } = await supabase
      .from('subject_packages')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !updated) {
      return NextResponse.json(
        { error: fetchError?.message || 'تعذر إيجاد الباقة بعد التحديث.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ item: updated })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/subject-packages/[id]
// يرفض الحذف إن كانت الباقة مُسنَدة فعلياً لاشتراك نشط — student_subscriptions.package_id
// به ON DELETE CASCADE، فحذف الباقة مباشرة كان سيمحو سجل اشتراك الطالب بصمت تماماً،
// تماماً كما يحدث في حذف الأدوار المُسنَدة فعلياً (نفس نمط الحماية المعتمَد بالمشروع)
export async function DELETE(req: NextRequest, context: Context) {
  const auth = await requireAdminOrPermission(req, 'manage_subscriptions')
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const supabase = getServiceClient()

    const { count, error: usageError } = await supabase
      .from('student_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('package_id', id)
      .eq('is_active', true)

    if (usageError) {
      return NextResponse.json(
        { error: usageError.message || 'Failed to validate package usage.' },
        { status: 500 }
      )
    }

    if ((count || 0) > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف باقة مُسنَدة فعلياً لطالب نشط. أزل اشتراكات الطلاب فيها أولاً.' },
        { status: 409 }
      )
    }

    const { error } = await supabase.from('subject_packages').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to delete package.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Unexpected error while deleting package.' }, { status: 500 })
  }
}