import { NextRequest, NextResponse } from 'next/server'

interface Flashcard {
  id:       number
  category: string
  front:    string
  back:     string
  example?: string | null
}

interface FlashcardsData {
  title:      string
  lessonType: string
  cards:      Flashcard[]
}

export async function POST(req: NextRequest) {
  try {
    const { lessonName, material, grade } = await req.json()

    if (!lessonName) {
      return NextResponse.json({ error: 'اسم الدرس مطلوب' }, { status: 400 })
    }
    if (!material?.trim()) {
      return NextResponse.json({ error: 'المادة العلمية مطلوبة لإنشاء البطاقات' }, { status: 400 })
    }

    // ── تحديد الصف لمعرفة مستوى التحليل البلاغي ─────────────
    const gradeNum = parseInt(String(grade).replace(/[^0-9]/g, '')) || 0
    const isAdvanced = gradeNum >= 11  // الصف 11 و 12

    const systemPrompt = `أنت أستاذ لغة عربية خبير متخصص في تصميم بطاقات الحفظ التعليمية.
يجب أن ترد بـ JSON فقط — لا نص قبله ولا بعده ولا backticks.

══ المادة العلمية للدرس: "${lessonName}" — الصف ${grade || ''} ══
${material.slice(0, 3500)}
══════════════════════════════════════════════════════════════

مهمتك الدقيقة:

① اكتشف نوع الدرس تلقائياً من المادة العلمية:
   - درس نحوي (قواعد، إعراب، صرف)
   - درس بلاغي (بيان، بديع، معاني)
   - درس نصي قصصي (قصة، رواية، حكاية)
   - درس نصي شعري (قصيدة، أبيات)
   - درس نصي نثري مقالي (مقال، خطبة، رسالة)
   - درس إملائي أو أدبي عام

② استخرج 8-14 بطاقة حسب نوع الدرس وفق هذه المعايير:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 الدرس النحوي والصرفي:
   → مفهوم (التعريف الدقيق من المادة)
   → أركان (إن وُجدت)
   → أنواع (كل نوع في بطاقة مستقلة)
   → أوزان (إن وُجدت كالتفضيل والصفة المشبهة)
   → دلالات وأغراض كل نوع
   → إعراب نموذجي (مثال من المادة)
   → الفرق بين المتشابهات (إن وُجدت)
   → شروط وضوابط (إن وُجدت)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌸 الدرس البلاغي:
   → مفهوم الظاهرة البلاغية
   → أركانها وعناصرها
   → شرحها وكيفية تحديدها
   → أنواعها (كل نوع بطاقة)
   → أغراضها وأسرارها الجمالية
${isAdvanced ? `   → أثرها في النص (الصف 11-12)
   → تحديد النوع من الأمثلة (الصف 11-12)
   → نوع المحسن البديعي وأثره (إن وُجد)` :
`   → تحديد نوع الصورة البلاغية من مثال (الصف 10 وما قبل)`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 الدرس القصصي:
   → الشخصيات الرئيسية وصفاتها
   → الشخصيات الثانوية ودورها
   → مواقف كل شخصية وآراؤها
   → العقدة (المشكلة الرئيسية)
   → الحل ونتيجته
   → القيم المستفادة
   → الدروس المستفادة
   → الهدف والغرض من القصة
   → الفكرة المحورية
   → القضية وأسبابها ومظاهرها (إن وُجدت)
   → تحليل المواقف الرئيسية

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 النص الشعري:
   → الفكرة العامة للنص
   → الأفكار الجزئية (كل فكرة بطاقة)
   → المواقف وتعليلها
   → الآراء وما يدعمها من النص
   → الهدف والغرض من النص
   → القيم الواردة في النص
   → الدروس المستفادة
   → دلالات الألفاظ المحورية
   → القضية وأسبابها ومظاهرها وعلاجها (إن وُجدت)
   → الظاهرة الأسلوبية أو السمة الفنية (إن وُجدت)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 النص النثري المقالي:
   → الفكرة الرئيسية
   → الأفكار الجزئية
   → الحجج والأدلة
   → موقف الكاتب ورأيه
   → سمات أسلوب الكاتب
   → القيم والمبادئ
   → الهدف والغرض

⚠️ قواعد صارمة لا تتهاون فيها:
1. كل المعلومات من المادة العلمية المرفقة فقط — لا إضافات من الخارج
2. وجه البطاقة (front): سؤال أو مصطلح أو عنوان قصير وواضح
3. ظهر البطاقة (back): إجابة دقيقة من المادة — موجزة وعلمية
4. المثال: من المادة المرفقة مباشرة إن وُجد
5. تنوّع الفئات حسب طبيعة الدرس المكتشفة
6. لا تكرار — كل بطاقة تغطي جانباً مختلفاً
7. الفئة يجب أن تعكس طبيعة المحتوى بدقة

أعد JSON بهذا الشكل بالضبط:
{
  "title": "بطاقات حفظ: [اسم الدرس]",
  "lessonType": "نوع الدرس المكتشف",
  "cards": [
    {
      "id": 1,
      "category": "مفهوم",
      "front": "ما تعريف النعت؟",
      "back": "تابع يبين صفة من صفات المتبوع أو ما يتعلق به، ويتبعه في إعرابه",
      "example": "جاء الطالبُ المجتهدُ — المجتهد: نعت"
    },
    {
      "id": 2,
      "category": "أنواع",
      "front": "ما أنواع النعت؟",
      "back": "1- النعت الحقيقي: يصف المنعوت نفسه\n2- النعت السببي: يصف ما يتعلق بالمنعوت",
      "example": null
    }
  ]
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:       'claude-sonnet-4-5',
        max_tokens:  4000,
        temperature: 0.1,   // درجة حرارة منخفضة جداً للدقة
        system:      systemPrompt,
        messages:    [{ role: 'user', content: 'استخرج البطاقات الآن بدقة علمية تامة' }],
      }),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'خطأ في Claude API')

    const rawText = data.content?.[0]?.text ?? '{}'
    const clean   = rawText.replace(/```json|```/g, '').trim()

    let result: FlashcardsData
    try {
      result = JSON.parse(clean)
    } catch {
      const match = clean.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('لم يُعد الذكاء الاصطناعي JSON صحيحاً')
      result = JSON.parse(match[0])
    }

    if (!result.cards || !Array.isArray(result.cards)) {
      throw new Error('بنية البطاقات غير صحيحة')
    }

    return NextResponse.json({ flashcards: result })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}