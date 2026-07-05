import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getServiceClient } from '@/lib/server/auth'

type Context = {
  params: Promise<{ id: string }>
}

function getStr(formData: FormData, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = formData.get(k)
    if (typeof v === 'string' && v.length > 0) return v
  }
  return null
}

function getFile(formData: FormData, key: string): File | null {
  const v = formData.get(key)
  return v instanceof File && v.size > 0 ? v : null
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  if (url.match(/\.(mp4|webm|ogg)$/i)) return url
  return url
}

async function uploadFile(supabase: any, file: File, prefix: string): Promise<string | null> {
  if (!file || file.size === 0) return null
  const ext = file.name.split('.').pop() || 'bin'
  const fileName = `lessons/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('materials')
    .upload(fileName, buffer, { contentType: file.type })

  if (uploadError) return null

  const { data: urlData } = supabase.storage.from('materials').getPublicUrl(fileName)
  return urlData.publicUrl
}

// ══════════════════════════════════════════════════════════════
// PATCH — تعديل درس (FormData — يدعم استبدال/حذف الفيديو، إضافة
// أو إزالة ملفات مصاحبة فردية، وكذلك الملفات الأربعة المتخصصة
// للغة العربية: فهم/ثروة/بلاغة/نحو — كل واحد يُستبدَل أو يُزال
// بشكل مستقل عبر علم remove<X>File
// ══════════════════════════════════════════════════════════════
export async function PATCH(req: NextRequest, context: Context) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const formData = await req.formData()

    const name        = getStr(formData, 'name')
    const description = getStr(formData, 'description')
    const content      = getStr(formData, 'content')
    const orderNumRaw   = getStr(formData, 'order_num')
    const isActiveRaw   = getStr(formData, 'is_active')
    const videoLink      = getStr(formData, 'videoLink')
    const videoFile       = getFile(formData, 'videoFile')
    const removeVideo     = getStr(formData, 'removeVideo') === 'true'
    const existingFileUrlsRaw = getStr(formData, 'existingFileUrls')
    const files                  = formData.getAll('files').filter((f) => f instanceof File && f.size > 0) as File[]

    // ── الملفات الأربعة المتخصصة ──────────────────────────────
    const comprehensionFile = getFile(formData, 'comprehensionFile')
    const removeComprehensionFile = getStr(formData, 'removeComprehensionFile') === 'true'
    const tharwaFile = getFile(formData, 'tharwaFile')
    const removeTharwaFile = getStr(formData, 'removeTharwaFile') === 'true'
    const balaghaFile = getFile(formData, 'balaghaFile')
    const removeBalaghaFile = getStr(formData, 'removeBalaghaFile') === 'true'
    const nahwFile = getFile(formData, 'nahwFile')
    const removeNahwFile = getStr(formData, 'removeNahwFile') === 'true'

    const supabase = getServiceClient()

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }

    if (name !== null) updates.name = name.trim()
    if (description !== null) updates.description = description.trim() || null
    if (content !== null) updates.content = content.trim()
    if (orderNumRaw !== null) updates.order_num = parseInt(orderNumRaw, 10) || 1
    if (isActiveRaw !== null) updates.is_active = isActiveRaw === 'true'

    // الفيديو: إزالة، أو رفع ملف جديد، أو رابط جديد — أولوية بهذا الترتيب
    if (removeVideo) {
      updates.video_url = null
      updates.video_embed_url = null
    } else if (videoFile) {
      const url = await uploadFile(supabase, videoFile, 'video')
      updates.video_url = url
      updates.video_embed_url = url
    } else if (videoLink?.trim()) {
      updates.video_url = videoLink.trim()
      updates.video_embed_url = getEmbedUrl(videoLink.trim())
    }

    // الملفات المصاحبة: existingFileUrls (ما تبقّى بعد حذف فردي) + ملفات جديدة
    if (existingFileUrlsRaw !== null || files.length > 0) {
      let existing: string[] = []
      if (existingFileUrlsRaw) {
        try {
          existing = JSON.parse(existingFileUrlsRaw)
        } catch {
          existing = []
        }
      }
      const newUrls: string[] = []
      for (const file of files) {
        const url = await uploadFile(supabase, file, 'file')
        if (url) newUrls.push(url)
      }
      updates.file_urls = [...existing, ...newUrls]
    }

    // ── فهم واستيعاب: إزالة، أو استبدال ─────────────────────
    if (removeComprehensionFile) {
      updates.comprehension_file_url = null
      updates.comprehension_file_name = null
    } else if (comprehensionFile) {
      updates.comprehension_file_url = await uploadFile(supabase, comprehensionFile, 'comprehension')
      updates.comprehension_file_name = comprehensionFile.name
    }

    // ── ثروة لغوية: إزالة، أو استبدال ───────────────────────
    if (removeTharwaFile) {
      updates.tharwa_file_url = null
      updates.tharwa_file_name = null
    } else if (tharwaFile) {
      updates.tharwa_file_url = await uploadFile(supabase, tharwaFile, 'tharwa')
      updates.tharwa_file_name = tharwaFile.name
    }

    // ── بلاغة: إزالة، أو استبدال ─────────────────────────────
    if (removeBalaghaFile) {
      updates.balagha_file_url = null
      updates.balagha_file_name = null
    } else if (balaghaFile) {
      updates.balagha_file_url = await uploadFile(supabase, balaghaFile, 'balagha')
      updates.balagha_file_name = balaghaFile.name
    }

    // ── نحو: إزالة، أو استبدال ───────────────────────────────
    if (removeNahwFile) {
      updates.nahw_file_url = null
      updates.nahw_file_name = null
    } else if (nahwFile) {
      updates.nahw_file_url = await uploadFile(supabase, nahwFile, 'nahw')
      updates.nahw_file_name = nahwFile.name
    }

    const { data, error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'فشل تعديل الدرس.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ lesson: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء تعديل الدرس.' },
      { status: 500 }
    )
  }
}

// ══════════════════════════════════════════════════════════════
// DELETE — حذف درس
// ══════════════════════════════════════════════════════════════
export async function DELETE(req: NextRequest, context: Context) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const supabase = getServiceClient()

    const { error } = await supabase.from('lessons').delete().eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'فشل حذف الدرس.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع أثناء حذف الدرس.' },
      { status: 500 }
    )
  }
}