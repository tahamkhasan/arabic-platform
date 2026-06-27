import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, getServiceClient } from '@/lib/server/auth'

// ══════════════════════════════════════════════════════════════
// GET — قائمة الوحدات (عام، بلا حماية — متوافق مع الاستخدام الحالي)
// يدعم ?subjectId= (المستخدم فعلياً في dashboard/student) و
// ?subject_id= (الاسم القديم في هذا الملف) معاً — إصلاح علّة الفلترة
// ══════════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const subjectId = searchParams.get('subjectId') || searchParams.get('subject_id')

    let query = supabaseAdmin
      .from('units')
      .select('*')
      .eq('is_active', true)
      .order('order_num', { ascending: true })

    if (subjectId) query = query.eq('subject_id', subjectId)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ units: data || [] })
  } catch (error: any) {
    console.error('GET /api/units error:', error)
    return NextResponse.json({ units: [] })
  }
}

// ══════════════════════════════════════════════════════════════
// POST — إنشاء وحدة جديدة داخل مادة
// محمي بـ requireAdmin (Bearer token) — لا adminId في body بعد الآن
// ══════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const body = await req.json()
    const { subject_id, subjectId, name, description, order_num, icon } = body as {
      subject_id?: string
      subjectId?: string
      name?: string
      description?: string | null
      order_num?: number
      icon?: string
    }

    const finalSubjectId = subject_id || subjectId

    if (!finalSubjectId) {
      return NextResponse.json({ error: 'المادة (subject_id) مطلوبة.' }, { status: 400 })
    }
    if (!name?.trim()) {
      return NextResponse.json({ error: 'اسم الوحدة مطلوب.' }, { status: 400 })
    }

    const supabase = getServiceClient()

    // تحديد ترتيب تلقائي إن لم يُحدَّد (آخر ترتيب + 1)
    let finalOrder = order_num
    if (typeof finalOrder !== 'number') {
      const { data: lastUnit } = await supabase
        .from('units')
        .select('order_num')
        .eq('subject_id', finalSubjectId)
        .order('order_num', { ascending: false })
        .limit(1)
        .maybeSingle()
      finalOrder = (lastUnit?.order_num ?? 0) + 1
    }

    const { data, error } = await supabase
      .from('units')
      .insert({
        subject_id: finalSubjectId,
        name: name.trim(),
        description: description?.trim() || null,
        order_num: finalOrder,
        icon: icon || '📖',
        is_active: true,
      })
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'فشل إنشاء الوحدة.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ unit: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء إنشاء الوحدة.' },
      { status: 500 }
    )
  }
}