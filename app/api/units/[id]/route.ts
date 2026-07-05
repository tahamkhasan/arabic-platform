import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getServiceClient } from '@/lib/server/auth'

type Context = {
  params: Promise<{ id: string }>
}

// ══════════════════════════════════════════════════════════════
// PATCH — تعديل وحدة (يدعم أيضاً تغيير الفصل الدراسي semester،
// ويُستخدَم أيضاً للتبديل السريع لـ is_active وحده من البطاقة)
// ══════════════════════════════════════════════════════════════
export async function PATCH(req: NextRequest, context: Context) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const body = await req.json()
    const { name, description, order_num, icon, is_active, semester } = body as {
      name?: string
      description?: string | null
      order_num?: number
      icon?: string
      is_active?: boolean
      semester?: number
    }

    const supabase = getServiceClient()

    const updates: Record<string, any> = {}
    if (name !== undefined) updates.name = name.trim()
    if (description !== undefined) updates.description = description?.trim() || null
    if (order_num !== undefined) updates.order_num = order_num
    if (icon !== undefined) updates.icon = icon
    if (is_active !== undefined) updates.is_active = is_active
    if (semester !== undefined) updates.semester = semester === 2 ? 2 : 1

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'لا توجد حقول لتحديثها.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('units')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'فشل تعديل الوحدة.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ unit: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء تعديل الوحدة.' },
      { status: 500 }
    )
  }
}

// ══════════════════════════════════════════════════════════════
// DELETE — حذف وحدة، مع فحص سلامة مرجعية (لا حذف إن وُجدت دروس)
// ══════════════════════════════════════════════════════════════
export async function DELETE(req: NextRequest, context: Context) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const supabase = getServiceClient()

    const { count, error: usageError } = await supabase
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('unit_id', id)

    if (usageError) {
      return NextResponse.json(
        { error: usageError.message || 'فشل التحقق من استخدام الوحدة.' },
        { status: 500 }
      )
    }

    if ((count || 0) > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف وحدة تحتوي على دروس. احذف الدروس أولاً.' },
        { status: 409 }
      )
    }

    const { error } = await supabase.from('units').delete().eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'فشل حذف الوحدة.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع أثناء حذف الوحدة.' },
      { status: 500 }
    )
  }
}