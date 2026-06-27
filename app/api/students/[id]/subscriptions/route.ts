import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, requireAdminOrPermission } from '@/lib/server/auth'

type Context = {
  params: Promise<{ id: string }>
}

const VALID_STAGES = ['primary', 'middle', 'secondary']
const VALID_TRACKS = ['scientific', 'literary']

// GET /api/students/[id]/subscriptions
// اشتراكات الطالب النشطة فعلياً — لعرضها في مودال الإدارة
export async function GET(req: NextRequest, context: Context) {
  const auth = await requireAdminOrPermission(req, 'manage_subscriptions')
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from('student_subscriptions')
      .select('id, subscription_type, subject_id, package_id, stage, grade, track, assigned_at, is_active, subjects(id, name, icon), subject_packages(id, name)')
      .eq('student_id', id)
      .eq('is_active', true)
      .order('assigned_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ items: data ?? [] })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/students/[id]/subscriptions — إسناد مادة مفردة أو باقة
// body: { type: 'subject'|'package', subjectId?, packageId?, stage, grade, track? }
export async function POST(req: NextRequest, context: Context) {
  const auth = await requireAdminOrPermission(req, 'manage_subscriptions')
  if (!auth.ok) return auth.response

  try {
    const { id: studentId } = await context.params
    const body = await req.json()
    const { type, subjectId, packageId, stage, grade, track } = body

    if (type !== 'subject' && type !== 'package') {
      return NextResponse.json({ error: 'type يجب أن يكون subject أو package.' }, { status: 400 })
    }
    if (!stage || !grade) {
      return NextResponse.json({ error: 'المرحلة والصف مطلوبان.' }, { status: 400 })
    }
    if (!VALID_STAGES.includes(stage)) {
      return NextResponse.json({ error: 'قيمة المرحلة غير صالحة.' }, { status: 400 })
    }
    if (track && !VALID_TRACKS.includes(track)) {
      return NextResponse.json({ error: 'قيمة التشعيب غير صالحة.' }, { status: 400 })
    }
    if (type === 'subject' && !subjectId) {
      return NextResponse.json({ error: 'subjectId مطلوب لاشتراك مادة مفردة.' }, { status: 400 })
    }
    if (type === 'package' && !packageId) {
      return NextResponse.json({ error: 'packageId مطلوب لاشتراك باقة.' }, { status: 400 })
    }

    const supabase = getServiceClient()

    const { data: inserted, error } = await supabase
      .from('student_subscriptions')
      .insert({
        student_id: studentId,
        subscription_type: type,
        subject_id: type === 'subject' ? subjectId : null,
        package_id: type === 'package' ? packageId : null,
        stage,
        grade,
        track: track ?? null,
        assigned_by: auth.user.userId,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      // الفهرسان الفريدان الجزئيان في migration 005 يرفضان التكرار بهذا الخطأ
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'الطالب مُشترك بالفعل في هذه المادة/الباقة.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ item: inserted })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/students/[id]/subscriptions — إزالة اشتراك واحد (تعطيل، لا حذف فعلي)
// body: { subscriptionId }
export async function DELETE(req: NextRequest, context: Context) {
  const auth = await requireAdminOrPermission(req, 'manage_subscriptions')
  if (!auth.ok) return auth.response

  try {
    const { id: studentId } = await context.params
    const { subscriptionId } = await req.json()

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId مطلوب.' }, { status: 400 })
    }

    const supabase = getServiceClient()

    // is_active = false بدل الحذف الفعلي — يحافظ على السجل التاريخي
    // (من أسند ماذا ومتى)، ويُحرِّر الفهرس الفريد للسماح بإعادة الاشتراك لاحقاً
    const { error } = await supabase
      .from('student_subscriptions')
      .update({ is_active: false })
      .eq('id', subscriptionId)
      .eq('student_id', studentId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}