import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// جلب الوحدات
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const subjectId = searchParams.get('subject_id')

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
    return NextResponse.json({ units: [] })
  }
}

// إضافة وحدة
export async function POST(req: NextRequest) {
  try {
    const { subject_id, name, description, order_num, icon, adminId } = await req.json()

    const { data: admin } = await supabaseAdmin
      .from('users').select('role').eq('id', adminId).single()
    if (!admin || admin.role !== 'admin')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    const { data, error } = await supabaseAdmin
      .from('units')
      .insert({ subject_id, name, description, order_num: order_num || 1, icon: icon || '📖' })
      .select().single()

    if (error) throw error
    return NextResponse.json({ unit: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// تعديل وحدة
export async function PUT(req: NextRequest) {
  try {
    const { id, name, description, order_num, icon, is_active, adminId } = await req.json()

    const { data: admin } = await supabaseAdmin
      .from('users').select('role').eq('id', adminId).single()
    if (!admin || admin.role !== 'admin')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    const { data, error } = await supabaseAdmin
      .from('units')
      .update({ name, description, order_num, icon, is_active })
      .eq('id', id).select().single()

    if (error) throw error
    return NextResponse.json({ unit: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// حذف وحدة
export async function DELETE(req: NextRequest) {
  try {
    const { id, adminId } = await req.json()

    const { data: admin } = await supabaseAdmin
      .from('users').select('role').eq('id', adminId).single()
    if (!admin || admin.role !== 'admin')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    const { error } = await supabaseAdmin.from('units').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}