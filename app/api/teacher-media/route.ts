import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

function normalizeMedia(row: any) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    url: row.url,
    embedUrl: row.embed_url ?? row.url ?? null,
    linkType: row.link_type ?? 'link',
    thumbnail: row.thumbnail ?? null,
    subjectId: row.subject_id ?? null,
    lessonId: row.lesson_id ?? null,
    duration: row.duration ?? null,
    createdAt: row.created_at,
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get('teacherId')
    const subjectId = searchParams.get('subjectId')

    let query = supabaseAdmin
      .from('teacher_media')
      .select('*')
      .order('created_at', { ascending: false })

    if (teacherId) query = query.eq('teacher_id', teacherId)
    if (subjectId) query = query.eq('subject_id', subjectId)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      media: Array.isArray(data) ? data.map(normalizeMedia) : [],
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      teacherId,
      subjectId,
      lessonId,
      title,
      type,
      url,
      embedUrl,
      linkType,
      thumbnail,
      duration,
    } = await req.json()

    if (!teacherId || !title || !url || !type) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    if (type !== 'video' && type !== 'audio') {
      return NextResponse.json({ error: 'نوع الوسيط غير صالح' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('teacher_media')
      .insert({
        teacher_id: teacherId,
        subject_id: subjectId ?? null,
        lesson_id: lessonId ?? null,
        title: String(title).trim(),
        type,
        url: String(url).trim(),
        embed_url: embedUrl ?? url,
        link_type: linkType ?? 'upload',
        thumbnail: thumbnail ?? null,
        duration: duration ?? null,
      })
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ media: normalizeMedia(data) })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id, teacherId } = await req.json()

    if (!id || !teacherId) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

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