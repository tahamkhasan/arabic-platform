import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'

// ══════════════════════════════════════════════════════════════
// يستقبل روابط ملفات Word (.docx) لفرع مادة معيّن، يُنزّلها،
// يستخرج نصها عبر mammoth، ويُرجع نصاً مدمجاً واحداً — يُستخدَم
// كـ"مادة" لأدوات التوليد بدل content النصي العام، عند اختيار
// المعلم فرعاً محدَّداً (نحو/بلاغة/ثروة لغوية/فهم واستيعاب).
//
// مقيَّد بملفات .docx فقط حالياً — الرفع نفسه يتم من لوحة الأدمن
// (أو من يُخوَّل بذلك) بصيغة Word حصراً، وهي الأنسب للمعالجة مع
// المساعد الذكي.
// ══════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const urls = body?.urls as string[] | undefined
    const names = body?.names as (string | undefined)[] | undefined

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'لا توجد ملفات لاستخراج نصها.' }, { status: 400 })
    }

    const parts: string[] = []
    const skipped: string[] = []

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      const label = names?.[i] || `ملف ${i + 1}`

      if (!url.toLowerCase().endsWith('.docx')) {
        skipped.push(label)
        continue
      }

      try {
        const res = await fetch(url)
        if (!res.ok) {
          skipped.push(label)
          continue
        }

        const arrayBuffer = await res.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { value: text } = await mammoth.extractRawText({ buffer })
        if (text?.trim()) {
          parts.push(text.trim())
        } else {
          skipped.push(label)
        }
      } catch {
        skipped.push(label)
      }
    }

    if (parts.length === 0) {
      return NextResponse.json(
        { error: 'تعذّر استخراج نص من الملفات المرفوعة لهذا الفرع.' },
        { status: 422 },
      )
    }

    return NextResponse.json({
      text: parts.join('\n\n---\n\n'),
      skipped,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'خطأ داخلي أثناء استخراج النص.' }, { status: 500 })
  }
}