import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// جلب الاختبارات
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const subjectId = searchParams.get('subject_id')
    const examType  = searchParams.get('exam_type')

    let query = supabaseAdmin
      .from('exams')
      .select('*, subjects(name)')
      .order('created_at', { ascending: false })

    if (subjectId) query = query.eq('subject_id', subjectId)
    if (examType)  query = query.eq('exam_type', examType)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ exams: data || [] })
  } catch (error: any) {
    return NextResponse.json({ exams: [] })
  }
}

// إضافة اختبار
export async function POST(req: NextRequest) {
  try {
    const { name, exam_type, subject_id, stage, grade, lesson_ids, description, adminId } = await req.json()

    const { data: admin } = await supabaseAdmin
      .from('users').select('role').eq('id', adminId).single()
    if (!admin || admin.role !== 'admin')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    const { data, error } = await supabaseAdmin
      .from('exams')
      .insert({
        name,
        exam_type,
        subject_id,
        stage,
        grade,
        lesson_ids: lesson_ids || [],
        description,
        created_by: adminId,
      })
      .select().single()

    if (error) throw error
    return NextResponse.json({ exam: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// تعديل اختبار
export async function PUT(req: NextRequest) {
  try {
    const { id, name, exam_type, lesson_ids, description, adminId } = await req.json()

    const { data: admin } = await supabaseAdmin
      .from('users').select('role').eq('id', adminId).single()
    if (!admin || admin.role !== 'admin')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    const { data, error } = await supabaseAdmin
      .from('exams')
      .update({ name, exam_type, lesson_ids, description })
      .eq('id', id).select().single()

    if (error) throw error
    return NextResponse.json({ exam: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// حذف اختبار
export async function DELETE(req: NextRequest) {
  try {
    const { id, adminId } = await req.json()

    const { data: admin } = await supabaseAdmin
      .from('users').select('role').eq('id', adminId).single()
    if (!admin || admin.role !== 'admin')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    const { error } = await supabaseAdmin.from('exams').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}