import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, getServiceClient } from '@/lib/server/auth'

// ── أدوات مساعدة لقراءة FormData بأمان ────────────────────────
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

// ── تحويل رابط فيديو خارجي إلى رابط تضمين (مطابق لـ teacher/page.tsx) ──
function getEmbedUrl(url: string): string | null {
  if (!url) return null
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  if (url.match(/\.(mp4|webm|ogg)$/i)) return url
  return url
}

// ── رفع ملف إلى bucket "materials" (نفس الآلية الموجودة مسبقاً) ──
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
// GET — قائمة الدروس (عام، بلا حماية — متوافق مع الاستخدام الحالي)
// يدعم unitId/unit_id، subjectId/subject_id، lessonIds/lesson_ids
// (إصلاح علّة تطابق أسماء المعاملات — نفس علّة units سابقاً)
// ══════════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const unitId    = searchParams.get('unitId') || searchParams.get('unit_id')
    const subjectId = searchParams.get('subjectId') || searchParams.get('subject_id')
    const lessonIds = searchParams.get('lessonIds') || searchParams.get('lesson_ids')

    let query = supabaseAdmin
      .from('lessons')
      .select('*')
      .eq('is_active', true)
      .order('order_num', { ascending: true })

    if (unitId) query = query.eq('unit_id', unitId)
    if (subjectId) query = query.eq('subject_id', subjectId)
    if (lessonIds) {
      const ids = lessonIds.split(',')
      query = query.in('id', ids)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ lessons: data || [] })
  } catch (error: any) {
    console.error('GET /api/lessons error:', error)
    return NextResponse.json({ lessons: [] })
  }
}

// ══════════════════════════════════════════════════════════════
// POST — إنشاء درس جديد (FormData — يدعم فيديو + ملفات مصاحبة)
// محمي بـ requireAdmin (Bearer token) — لا adminId في body بعد الآن
// ══════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const formData = await req.formData()

    const unitId      = getStr(formData, 'unitId', 'unit_id')
    const subjectId   = getStr(formData, 'subjectId', 'subject_id')
    const name        = getStr(formData, 'name')
    const description = getStr(formData, 'description')
    const content      = getStr(formData, 'content')
    const orderNumRaw   = getStr(formData, 'order_num')
    const videoLink     = getStr(formData, 'videoLink')
    const videoFile      = getFile(formData, 'videoFile')
    const files            = formData.getAll('files').filter((f) => f instanceof File && f.size > 0) as File[]

    if (!unitId) {
      return NextResponse.json({ error: 'الوحدة (unitId) مطلوبة.' }, { status: 400 })
    }
    if (!name?.trim()) {
      return NextResponse.json({ error: 'اسم الدرس مطلوب.' }, { status: 400 })
    }

    const supabase = getServiceClient()

    // ترتيب تلقائي إن لم يُحدَّد (آخر ترتيب + 1)
    let orderNum = orderNumRaw ? parseInt(orderNumRaw, 10) : NaN
    if (!orderNum || Number.isNaN(orderNum)) {
      const { data: lastLesson } = await supabase
        .from('lessons')
        .select('order_num')
        .eq('unit_id', unitId)
        .order('order_num', { ascending: false })
        .limit(1)
        .maybeSingle()
      orderNum = (lastLesson?.order_num ?? 0) + 1
    }

    // الفيديو: ملف مرفوع له الأولوية، وإلا رابط خارجي
    let videoUrl: string | null = null
    let videoEmbedUrl: string | null = null

    if (videoFile) {
      videoUrl = await uploadFile(supabase, videoFile, 'video')
      videoEmbedUrl = videoUrl
    } else if (videoLink?.trim()) {
      videoUrl = videoLink.trim()
      videoEmbedUrl = getEmbedUrl(videoLink.trim())
    }

    // الملفات المصاحبة (متعددة)
    const fileUrls: string[] = []
    for (const file of files) {
      const url = await uploadFile(supabase, file, 'file')
      if (url) fileUrls.push(url)
    }

    const { data, error } = await supabase
      .from('lessons')
      .insert({
        unit_id: unitId,
        subject_id: subjectId || null,
        name: name.trim(),
        description: description?.trim() || null,
        content: content?.trim() || '',
        order_num: orderNum,
        video_url: videoUrl,
        video_embed_url: videoEmbedUrl,
        file_urls: fileUrls,
        is_active: true,
      })
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'فشل إنشاء الدرس.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ lesson: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء إنشاء الدرس.' },
      { status: 500 }
    )
  }
}