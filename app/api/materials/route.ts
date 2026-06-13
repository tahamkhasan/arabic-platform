import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// جلب المواد العلمية
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const stage = searchParams.get('stage')
    const grade = searchParams.get('grade')

    let query = supabaseAdmin
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false })

    if (stage) query = query.eq('stage', stage)
    if (grade) query = query.eq('grade', grade)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ materials: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// إضافة مادة علمية مع دعم الملفات
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const title   = formData.get('title') as string
    const content = formData.get('content') as string
    const stage   = formData.get('stage') as string
    const grade   = formData.get('grade') as string
    const subject = formData.get('subject') as string
    const adminId = formData.get('adminId') as string
    const files   = formData.getAll('files') as File[]

    // التحقق من أن المستخدم مدير
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', adminId)
      .single()

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    // رفع الملفات إلى Supabase Storage
    const fileUrls: string[] = []
    for (const file of files) {
      if (!file || file.size === 0) continue
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const { error: uploadError } = await supabaseAdmin.storage
        .from('materials')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        })

      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage
          .from('materials')
          .getPublicUrl(fileName)
        fileUrls.push(urlData.publicUrl)
      }
    }

    // حفظ المادة في قاعدة البيانات
    const { data, error } = await supabaseAdmin
      .from('materials')
      .insert({
        title,
        content: content || '',
        stage,
        grade,
        subject,
        created_by: adminId,
        file_urls: fileUrls,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ material: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// حذف مادة علمية
export async function DELETE(req: NextRequest) {
  try {
    const { id, adminId } = await req.json()

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', adminId)
      .single()

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const { error } = await supabaseAdmin
      .from('materials')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}