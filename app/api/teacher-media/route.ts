import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get('teacherId')
    const studentId = searchParams.get('studentId')
    const subjectId = searchParams.get('subjectId')

    let query = supabaseAdmin
      .from('teacher_media')
      .select('*')
      .order('created_at', { ascending: false })

    if (teacherId) query = query.eq('teacher_id', teacherId)
    if (subjectId) query = query.eq('subject_id', subjectId)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ media: data ?? [] })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { teacherId, subjectId, lessonId, title, type, url, embedUrl, linkType, thumbnail, duration } = await req.json()

    if (!teacherId || !title || !url || !type) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('teacher_media')
      .insert({
        teacher_id: teacherId,
        subject_id: subjectId  ?? null,
        lesson_id:  lessonId   ?? null,
        title,
        type,
        url,
        embed_url:  embedUrl   ?? url,
        link_type:  linkType   ?? 'upload',
        thumbnail:  thumbnail  ?? null,
        duration:   duration   ?? null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ media: data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id, teacherId } = await req.json()
    const { error } = await supabaseAdmin
      .from('teacher_media')
      .delete()
      .eq('id', id)
      .eq('teacher_id', teacherId)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}