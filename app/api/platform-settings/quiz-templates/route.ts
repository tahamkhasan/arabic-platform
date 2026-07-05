// app/api/platform-settings/quiz-templates/route.ts
//
// الجدول platform_settings بنية key-value (عمودا key + value)
// لذا نخزّن كل حقل كصف مستقل بـ key مميز

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getServiceClient } from '@/lib/server/auth'
import mammoth from 'mammoth'

// ── مساعد: قراءة قيم متعددة بـ key ────────────────────────────
async function getValues(supabase: any, keys: string[]): Promise<Record<string, string>> {
  const { data } = await supabase
    .from('platform_settings')
    .select('key, value')
    .in('key', keys)
  const map: Record<string, string> = {}
  for (const row of data ?? []) map[row.key] = row.value
  return map
}

// ── مساعد: حذف ثم إدراج مجموعة قيم ───────────────────────────
async function setValues(supabase: any, entries: { key: string; value: string }[]) {
  const keys = entries.map(e => e.key)
  await supabase.from('platform_settings').delete().in('key', keys)
  if (entries.length > 0) {
    await supabase.from('platform_settings').insert(entries)
  }
}

// ── GET — إرجاع النموذجين الحاليين ────────────────────────────
export async function GET() {
  const supabase = getServiceClient()
  const map = await getValues(supabase, [
    'short_quiz_template_url', 'short_quiz_template_name',
    'final_quiz_template_url', 'final_quiz_template_name',
  ])
  return NextResponse.json({
    short: { url: map['short_quiz_template_url'] ?? null, name: map['short_quiz_template_name'] ?? null },
    final: { url: map['final_quiz_template_url'] ?? null, name: map['final_quiz_template_name'] ?? null },
  })
}

// ── POST — رفع نموذج + استخراج النص ──────────────────────────
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const type = formData.get('type')

    if (!(file instanceof File) || file.size === 0)
      return NextResponse.json({ error: 'لم يُرفع ملف.' }, { status: 400 })
    if (type !== 'short' && type !== 'final')
      return NextResponse.json({ error: 'نوع النموذج يجب أن يكون short أو final.' }, { status: 400 })

    const supabase = getServiceClient()

    // ── رفع الملف إلى Storage ──────────────────────────────────
    const ext    = file.name.split('.').pop() || 'docx'
    const path   = `quiz-templates/${type}-${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadErr } = await supabase.storage
      .from('materials')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (uploadErr) throw new Error(`فشل رفع الملف: ${uploadErr.message}`)

    const { data: urlData } = supabase.storage.from('materials').getPublicUrl(path)
    const fileUrl = urlData.publicUrl

    // ── استخراج النص من Word بـ mammoth ───────────────────────
    let templateText = ''
    try {
      const { value } = await mammoth.extractRawText({ buffer })
      templateText = value.trim().slice(0, 6000)
    } catch {
      templateText = '(تعذّر استخراج النص)'
    }

    // ── حفظ في platform_settings (key-value) ─────────────────
    await setValues(supabase, [
      { key: `${type}_quiz_template_url`,  value: fileUrl },
      { key: `${type}_quiz_template_name`, value: file.name },
      { key: `${type}_quiz_template_text`, value: templateText },
    ])

    return NextResponse.json({
      message: `✅ تم رفع نموذج ${type === 'short' ? 'الاختبار القصير' : 'اختبار نهاية الفصل'} بنجاح.`,
      url:  fileUrl,
      name: file.name,
      textLength: templateText.length,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'حدث خطأ أثناء رفع النموذج.' }, { status: 500 })
  }
}

// ── DELETE — حذف نموذج ─────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  const { type } = await req.json()
  if (type !== 'short' && type !== 'final')
    return NextResponse.json({ error: 'نوع غير صالح.' }, { status: 400 })

  const supabase = getServiceClient()
  await supabase.from('platform_settings').delete().in('key', [
    `${type}_quiz_template_url`,
    `${type}_quiz_template_name`,
    `${type}_quiz_template_text`,
  ])

  return NextResponse.json({ message: 'تم حذف النموذج.' })
}