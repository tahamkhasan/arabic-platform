import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// جلب المواد
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const stage = searchParams.get('stage')
    const grade = searchParams.get('grade')

    let query = supabaseAdmin
      .from('subjects')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (stage) query = query.eq('stage', stage)
    if (grade) query = query.eq('grade', grade)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ subjects: data || [] })
  } catch (error: any) {
    return NextResponse.json({ subjects: [] })
  }
}

// إضافة مادة
export async function POST(req: NextRequest) {
  try {
    const { name, description, stage, grade, icon, adminId } = await req.json()

    const { data: admin } = await supabaseAdmin
      .from('users').select('role').eq('id', adminId).single()
    if (!admin || admin.role !== 'admin')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    const { data, error } = await supabaseAdmin
      .from('subjects')
      .insert({ name, description, stage, grade, icon: icon || '📚', created_by: adminId })
      .select().single()

    if (error) throw error
    return NextResponse.json({ subject: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// تعديل مادة
export async function PUT(req: NextRequest) {
  try {
    const { id, name, description, stage, grade, icon, is_active, adminId } = await req.json()

    const { data: admin } = await supabaseAdmin
      .from('users').select('role').eq('id', adminId).single()
    if (!admin || admin.role !== 'admin')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    const { data, error } = await supabaseAdmin
      .from('subjects')
      .update({ name, description, stage, grade, icon, is_active })
      .eq('id', id).select().single()

    if (error) throw error
    return NextResponse.json({ subject: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// حذف مادة
export async function DELETE(req: NextRequest) {
  try {
    const { id, adminId } = await req.json()

    const { data: admin } = await supabaseAdmin
      .from('users').select('role').eq('id', adminId).single()
    if (!admin || admin.role !== 'admin')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    const { error } = await supabaseAdmin.from('subjects').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}