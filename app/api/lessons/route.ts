import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// جلب الدروس
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const unitId     = searchParams.get('unit_id')
    const subjectId  = searchParams.get('subject_id')
    const lessonIds  = searchParams.get('lesson_ids') // للاختبار القصير

    let query = supabaseAdmin
      .from('lessons')
      .select('*')
      .eq('is_active', true)
      .order('order_num', { ascending: true })

    if (unitId)    query = query.eq('unit_id', unitId)
    if (subjectId) query = query.eq('subject_id', subjectId)
    if (lessonIds) {
      const ids = lessonIds.split(',')
      query = query.in('id', ids)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ lessons: data || [] })
  } catch (error: any) {
    return NextResponse.json({ lessons: [] })
  }
}

// إضافة درس
export async function POST(req: NextRequest) {
  try {
    const formData   = await req.formData()
    const unit_id    = formData.get('unit_id') as string
    const subject_id = formData.get('subject_id') as string
    const name       = formData.get('name') as string
    const description= formData.get('description') as string
    const content    = formData.get('content') as string
    const order_num  = formData.get('order_num') as string
    const adminId    = formData.get('adminId') as string
    const files      = formData.getAll('files') as File[]

    const { data: admin } = await supabaseAdmin
      .from('users').select('role').eq('id', adminId).single()
    if (!admin || admin.role !== 'admin')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    // رفع الملفات
    const fileUrls: string[] = []
    for (const file of files) {
      if (!file || file.size === 0) continue
      const ext = file.name.split('.').pop()
      const fileName = `lessons/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())

      const { error: uploadError } = await supabaseAdmin.storage
        .from('materials')
        .upload(fileName, buffer, { contentType: file.type })

      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage
          .from('materials').getPublicUrl(fileName)
        fileUrls.push(urlData.publicUrl)
      }
    }

    const { data, error } = await supabaseAdmin
      .from('lessons')
      .insert({
        unit_id,
        subject_id,
        name,
        description,
        content: content || '',
        order_num: parseInt(order_num) || 1,
        file_urls: fileUrls,
      })
      .select().single()

    if (error) throw error
    return NextResponse.json({ lesson: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// تعديل درس
export async function PUT(req: NextRequest) {
  try {
    const { id, name, description, content, order_num, is_active, adminId } = await req.json()

    const { data: admin } = await supabaseAdmin
      .from('users').select('role').eq('id', adminId).single()
    if (!admin || admin.role !== 'admin')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    const { data, error } = await supabaseAdmin
      .from('lessons')
      .update({ name, description, content, order_num, is_active })
      .eq('id', id).select().single()

    if (error) throw error
    return NextResponse.json({ lesson: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// حذف درس
export async function DELETE(req: NextRequest) {
  try {
    const { id, adminId } = await req.json()

    const { data: admin } = await supabaseAdmin
      .from('users').select('role').eq('id', adminId).single()
    if (!admin || admin.role !== 'admin')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    const { error } = await supabaseAdmin.from('lessons').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}