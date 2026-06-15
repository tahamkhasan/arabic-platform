import { NextRequest, NextResponse } from 'next/server'
import PptxGenJS from 'pptxgenjs'

interface Slide {
  title:   string
  content: string[]
}

// ── تحويل النص إلى شرائح ──
function parseToSlides(text: string, lessonTitle: string): Slide[] {
  const slides: Slide[] = []
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // شريحة العنوان
  slides.push({ title: lessonTitle, content: [] })

  let currentSlide: Slide | null = null

  for (const line of lines) {
    // عنوان قسم جديد
    if (
      line.startsWith('أولاً') || line.startsWith('ثانياً') ||
      line.startsWith('ثالثاً') || line.startsWith('رابعاً') ||
      line.startsWith('خامساً') || line.startsWith('سادساً') ||
      line.startsWith('سابعاً') || line.startsWith('ثامناً') ||
      line.startsWith('##') || line.startsWith('**')
    ) {
      if (currentSlide && currentSlide.content.length > 0) {
        slides.push(currentSlide)
      }
      currentSlide = {
        title:   line.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/:$/, '').trim(),
        content: [],
      }
    } else if (currentSlide) {
      // محتوى الشريحة الحالية
      const clean = line
        .replace(/^[-•*]\s*/, '')
        .replace(/\*\*/g, '')
        .replace(/^#+ /, '')
        .trim()

      if (clean.length > 0 && clean.length < 200) {
        currentSlide.content.push(clean)
      }

      // حد الشريحة 6 نقاط
      if (currentSlide.content.length >= 6) {
        slides.push(currentSlide)
        currentSlide = { title: currentSlide.title + ' (تابع)', content: [] }
      }
    }
  }

  if (currentSlide && currentSlide.content.length > 0) {
    slides.push(currentSlide)
  }

  return slides
}

export async function POST(req: NextRequest) {
  try {
    const { content, title, grade, subject } = await req.json()

    if (!content || !title) {
      return NextResponse.json({ error: 'المحتوى والعنوان مطلوبان' }, { status: 400 })
    }

    const pptx = new PptxGenJS()

    // ── إعدادات العرض ──
    pptx.layout  = 'LAYOUT_WIDE'
    pptx.author  = 'منصة مساعد اللغة العربية'
    pptx.subject = subject || 'اللغة العربية'
    pptx.title   = title

    // ── الألوان ──
    const COLORS = {
      primary:   '1a365d',
      accent:    'f9d423',
      white:     'FFFFFF',
      lightBg:   'f0f4ff',
      darkText:  '1a1a2e',
      grayText:  '4a5568',
      slideText: '2d3748',
    }

    // ── شريحة العنوان ──
    const titleSlide = pptx.addSlide()

    // خلفية متدرجة
    titleSlide.background = { color: COLORS.primary }

    // شريط ذهبي
    titleSlide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 3.2, w: '100%', h: 0.08,
      fill: { color: COLORS.accent },
      line: { color: COLORS.accent },
    })

    // اسم المنصة
    titleSlide.addText('🌙 منصة مساعد اللغة العربية', {
      x: 0.5, y: 0.3, w: '90%', h: 0.5,
      fontSize: 14, color: COLORS.accent,
      align: 'center', rtlMode: true,
    })

    // العنوان الرئيسي
    titleSlide.addText(title, {
      x: 0.5, y: 1.0, w: '90%', h: 1.5,
      fontSize: 36, bold: true, color: COLORS.white,
      align: 'center', rtlMode: true,
    })

    // المادة والصف
    titleSlide.addText(`${subject || 'اللغة العربية'} — الصف ${grade || ''}`, {
      x: 0.5, y: 2.6, w: '90%', h: 0.5,
      fontSize: 18, color: 'CBD5E0',
      align: 'center', rtlMode: true,
    })

    // التاريخ
    titleSlide.addText(
      new Date().toLocaleDateString('ar-KW', { year: 'numeric', month: 'long', day: 'numeric' }),
      {
        x: 0.5, y: 3.4, w: '90%', h: 0.4,
        fontSize: 14, color: 'A0AEC0',
        align: 'center', rtlMode: true,
      }
    )

    // ── تحليل المحتوى إلى شرائح ──
    const slides = parseToSlides(content, title)

    // ── توليد الشرائح ──
    for (let i = 1; i < slides.length; i++) {
      const slideData = slides[i]
      const slide = pptx.addSlide()

      // خلفية فاتحة
      slide.background = { color: COLORS.lightBg }

      // شريط علوي ملوّن
      slide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: '100%', h: 0.9,
        fill: { color: COLORS.primary },
        line: { color: COLORS.primary },
      })

      // خط ذهبي تحت الشريط
      slide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0.9, w: '100%', h: 0.06,
        fill: { color: COLORS.accent },
        line: { color: COLORS.accent },
      })

      // عنوان الشريحة
      slide.addText(slideData.title, {
        x: 0.3, y: 0.1, w: '90%', h: 0.7,
        fontSize: 22, bold: true, color: COLORS.white,
        align: 'right', rtlMode: true,
      })

      // رقم الشريحة
      slide.addText(`${i} / ${slides.length - 1}`, {
        x: 8.5, y: 0.1, w: 1, h: 0.6,
        fontSize: 12, color: 'CBD5E0',
        align: 'center',
      })

      // المحتوى
      if (slideData.content.length > 0) {
        const bulletItems = slideData.content.map(item => ({
          text:    item,
          options: {
            fontSize:  18,
            color:     COLORS.slideText,
            bullet:    { type: 'number' } as any,
            rtlMode:   true,
            paraSpaceAfter: 8,
          },
        }))

        slide.addText(bulletItems, {
          x: 0.4, y: 1.1, w: '92%', h: 4.2,
          align:   'right',
          rtlMode: true,
          valign:  'top',
        })
      }

      // تذييل
      slide.addText('منصة مساعد اللغة العربية • الكويت', {
        x: 0, y: 4.9, w: '100%', h: 0.3,
        fontSize: 10, color: COLORS.grayText,
        align: 'center', rtlMode: true,
      })
    }

    // ── شريحة الخاتمة ──
    const endSlide = pptx.addSlide()
    endSlide.background = { color: COLORS.primary }

    endSlide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 2.2, w: '100%', h: 0.08,
      fill: { color: COLORS.accent },
      line: { color: COLORS.accent },
    })

    endSlide.addText('شكراً لكم', {
      x: 0.5, y: 0.8, w: '90%', h: 1.2,
      fontSize: 48, bold: true, color: COLORS.white,
      align: 'center', rtlMode: true,
    })

    endSlide.addText('منصة مساعد اللغة العربية 🌙', {
      x: 0.5, y: 2.4, w: '90%', h: 0.6,
      fontSize: 20, color: COLORS.accent,
      align: 'center', rtlMode: true,
    })

    // ── تصدير الملف ──
    const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(title)}.pptx"`,
      },
    })
  } catch (error: any) {
    console.error('[pptx] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}