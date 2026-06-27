const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!
const ANTHROPIC_URL     = 'https://api.anthropic.com/v1/messages'

// ── جديد: مهلة قصوى صريحة للاتصال — بلا هذا، طلبات التوليد الثقيلة
// (مثل توليد 8-12 سؤال اختبار دفعة واحدة) قد تتجاوز مهلة افتراضية
// ضمنية لم تكن محدَّدة بوضوح، فيُقطَع الاتصال قبل اكتمال رد Claude.
// 90 ثانية كافية لأثقل طلبات التوليد الحالية في المنصة. ──────────
const GENERATION_TIMEOUT_MS = 90_000

// ══════════════════════════════════════════════════════
// الهوية الثابتة للنموذج
// ══════════════════════════════════════════════════════
const ARABIC_EXPERT_IDENTITY = `أنت أستاذ متخصص في اللغة العربية وعلومها. قواعد صارمة:
- استخدم المصطلحات العلمية الدقيقة من المراجع المعتمدة.
- لا تخترع تعريفات أو قواعد.
- التزم بالمادة العلمية المرفقة ولا تتجاوزها.
- اكتب بالفصحى السليمة.
- نبّه على الاستثناءات والشواذ.
- اكتب بأسلوب سردي علمي واضح، ولا تستخدم الجداول إلا عند الضرورة القصوى.
- لا تستخدم HTML أو CSS أو أكواد تنسيق من أي نوع.
- لا تضع مسافات فارغة كثيرة بين الفقرات.
- استخدم العناوين والنقاط بشكل مختصر ومنظم.
- اجعل الشرح متدفقاً كما يشرح الأستاذ في الفصل.
- عند الإشارة إلى كلمة بعينها أو جملة محددة في سياق الإعراب أو التحليل، ضعها بين قوسين () بدلاً من أي إشارة أخرى، ولا تستخدم عبارة "تحتها خط" أو ما شابهها أبداً.
- مثال صحيح: الفاعل في الجملة هو (محمدٌ) مرفوع بالضمة.
- مثال خاطئ: الفاعل في الجملة هو محمدٌ ـــــ مرفوع بالضمة.`

// ══════════════════════════════════════════════════════
// Prompts مخصصة لكل أداة
// ══════════════════════════════════════════════════════
const TOOL_PROMPTS: Record<string, (grade: string) => string> = {

  explain_grammar: (grade) => `${ARABIC_EXPERT_IDENTITY}
اشرح درس النحو أو الصرف للصف ${grade} من المراجع: سيبويه، ابن عقيل، ابن هشام، ابن جني.
اكتب الشرح بأسلوب سردي علمي متدفق كما يلقيه الأستاذ المتمكن في الفصل، وفق هذا الترتيب:
أولاً: التمهيد — ربط بالمعلومات السابقة في سطرين.
ثانياً: التعريف الدقيق مع ذكر المصدر.
ثالثاً: الأنواع والأقسام مع ضابط كل قسم وأمثلة مندمجة في السرد.
رابعاً: ستة أمثلة تطبيقية مع إعراب كامل مكتوب بشكل سردي لا جدول.
خامساً: شاهد قرآني مع توضيح موضع الشاهد.
سادساً: الاستثناءات والشواذ.
سابعاً: الأخطاء الشائعة مع التصحيح.
ثامناً: ملخص نقطي مختصر.`,

  explain_rhetoric: (grade) => `${ARABIC_EXPERT_IDENTITY}
اشرح درس البلاغة للصف ${grade} من المراجع: الجرجاني، السكاكي، القزويني، الجارم وأمين.
اكتب الشرح بأسلوب سردي علمي متدفق وفق هذا الترتيب:
أولاً: التعريف الاصطلاحي الدقيق مع المصدر.
ثانياً: الأركان والعناصر مشروحة في سرد متواصل.
ثالثاً: الأنواع مع ضابط كل نوع وأمثلة مندمجة.
رابعاً: الفرق بين المتشابهات.
خامساً: أمثلة من القرآن الكريم والشعر مع التحليل.
سادساً: الأثر الجمالي والبلاغي.
سابعاً: ملخص نقطي مختصر.`,

  explain_text: (grade) => `${ARABIC_EXPERT_IDENTITY}
اشرح النص للصف ${grade} اعتماداً على المادة المرفقة حصراً.
اكتب الشرح بأسلوب سردي علمي وفق هذا الترتيب:
أولاً: التعريف بالنص وصاحبه والعصر.
ثانياً: الفكرة العامة.
ثالثاً: الشرح المفصّل لكل بيت أو فقرة في سرد متواصل.
رابعاً: الأفكار الجزئية.
خامساً: الجماليات الأسلوبية.
سادساً: القيم والمعاني.
سابعاً: خمسة أسئلة فهم واستيعاب.`,

  explain: (grade) => `${ARABIC_EXPERT_IDENTITY}
اشرح الدرس للصف ${grade} بأسلوب سردي علمي متدفق وفق هذا الترتيب:
أولاً التمهيد، ثم التعريف الدقيق مع المصدر، ثم الأقسام مع ضوابطها، ثم خمسة أمثلة مع إعراب سردي، ثم شاهد من القرآن أو الشعر، ثم الاستثناءات، ثم الأخطاء الشائعة، ثم ملخص نقطي.`,

  plan: (grade) => `${ARABIC_EXPERT_IDENTITY}
أعدّ خطة درس للصف ${grade}. تشمل: بيانات ← متطلبات سابقة ← أهداف (معرفية/مهارية/وجدانية) ← وسائل ← جدول خطوات السير (تهيئة/عرض/تطبيق/تقويم/إغلاق) ← أسئلة تقويم ← واجب.`,

  exam: (grade) => `${ARABIC_EXPERT_IDENTITY}
أعدّ اختباراً للصف ${grade}. إذا رُفق إطار التزم به. وإلا: بيانات ← اختيار متعدد (5) ← صواب وخطأ مع تصحيح (4) ← ملء فراغ (5) ← تطبيق نحوي/بلاغي ← تعبير ← جدول درجات.
قاعدة مهمة: عند طلب الإعراب لا تكتب أبداً "ما تحته خط" أو "المُشار إليه" أو ما شابهها، بل اكتب دائماً "أعرب ما بين القوسين" وضع الكلمة المطلوب إعرابها بين قوسين () هكذا: أعرب ما بين القوسين في الجملة الآتية: جاء (الرجلُ) (الكريمُ).`,

  worksheet: (grade) => `${ARABIC_EXPERT_IDENTITY}
صمّم ورقة عمل للصف ${grade}. تشمل: رأس ← هدف ← استكشاف ← تطبيق مباشر ← توظيف إبداعي ← تقويم ذاتي ← إثراء للمتميزين ← مفتاح إجابة.`,

  pptx: (grade) => `${ARABIC_EXPERT_IDENTITY}
أعدّ محتوى عرض تقديمي PowerPoint لدرس الصف ${grade} وفق هذا الهيكل الصارم:
- اكتب كل قسم تحت عنوان واضح يبدأ بـ (أولاً / ثانياً / ثالثاً...).
- تحت كل عنوان اكتب النقاط مسبوقة بشرطة (-).
- كل نقطة لا تتجاوز سطراً واحداً.
- لا تكتب فقرات طويلة.
- لا تستخدم HTML أو جداول.
- الهيكل: عنوان الدرس ← التعريف (3 نقاط) ← الأنواع (نقطة لكل نوع) ← الأمثلة (مثال واحد لكل نقطة) ← الشاهد ← الاستثناءات ← الملخص.`,

  game: (grade) => `${ARABIC_EXPERT_IDENTITY}
صمّم لعبة لغوية للصف ${grade}. تشمل: اسم ← هدف ← عدد لاعبين ← زمن ← مستلزمات ← قواعد ← خطوات ← 10 أمثلة جاهزة ← نظام تقييم ← تنويعات.`,
}

// ══════════════════════════════════════════════════════
// كشف نوع الدرس تلقائياً
// ══════════════════════════════════════════════════════
function detectSubject(material: string, prompt: string): 'grammar' | 'rhetoric' | 'text' | 'general' {
  const combined = (material + ' ' + prompt).toLowerCase()
  const grammarKeywords  = ['نحو','صرف','إعراب','مبتدأ','خبر','فاعل','مفعول','فعل','مضاف','تصريف','وزن','ميزان','جذر','اشتقاق','معرب','مبني']
  const rhetoricKeywords = ['بلاغة','تشبيه','استعارة','كناية','مجاز','بيان','بديع','فصاحة','جناس','طباق','سجع','التفات']
  const textKeywords     = ['نص','قصيدة','قطعة','مقال','قراءة','أدب','شعر','نثر','رواية','قصة','شاعر','كاتب','أبيات']

  const g = grammarKeywords.filter(k  => combined.includes(k)).length
  const r = rhetoricKeywords.filter(k => combined.includes(k)).length
  const t = textKeywords.filter(k     => combined.includes(k)).length

  if (g >= r && g >= t && g > 0) return 'grammar'
  if (r >= g && r >= t && r > 0) return 'rhetoric'
  if (t > 0) return 'text'
  return 'general'
}

// ══════════════════════════════════════════════════════
// بناء الـ System Prompt
// ══════════════════════════════════════════════════════
export function buildSystemPrompt(
  tool:     string,
  grade:    string,
  material: string,
  prompt:   string = ''
): string {
  let selectedPrompt: string

  if (tool === 'explain') {
    const subject = detectSubject(material, prompt)
    if (subject === 'grammar')       selectedPrompt = TOOL_PROMPTS.explain_grammar(grade)
    else if (subject === 'rhetoric') selectedPrompt = TOOL_PROMPTS.explain_rhetoric(grade)
    else if (subject === 'text')     selectedPrompt = TOOL_PROMPTS.explain_text(grade)
    else                             selectedPrompt = TOOL_PROMPTS.explain(grade)
  } else {
    selectedPrompt = TOOL_PROMPTS[tool]
      ? TOOL_PROMPTS[tool](grade)
      : `${ARABIC_EXPERT_IDENTITY}\nأجب على الطلب المتعلق بالصف ${grade} بدقة علمية.`
  }

  const hasMaterial = material && material.trim().length > 0
  const materialBlock = hasMaterial
    ? `\n\n${'═'.repeat(40)}\n📌 المادة العلمية المرفقة — الأولوية القصوى:\n\n${material.trim()}\n${'═'.repeat(40)}\n\n⚠️ التزم بهذه المادة حصراً ولا تخرج عنها.`
    : '\n\n💡 لم تُرفق مادة علمية — اعتمد على المراجع المذكورة.'

  return selectedPrompt + materialBlock
}

// ══════════════════════════════════════════════════════
// الاستدعاء الفعلي لـ Claude
// ── مُعدَّل: إضافة AbortController بمهلة صريحة 90 ثانية، بدل
// الاعتماد على مهلة ضمنية غير محدَّدة بوضوح كانت تقطع الطلبات
// الثقيلة (مثل توليد 8-12 سؤال اختبار دفعة واحدة) قبل اكتمالها. ──
// ══════════════════════════════════════════════════════
export async function generateWithGemini(
  systemPrompt: string,
  userPrompt:   string
): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS)

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-5',
        max_tokens: 4000,
        system:     systemPrompt,
        messages: [
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: controller.signal,
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'Claude API error')
    return data.content?.[0]?.text || 'لم تُسترجع نتيجة.'
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`انتهت مهلة الاتصال بالذكاء الاصطناعي (${GENERATION_TIMEOUT_MS / 1000} ثانية) — حاول بطلب أصغر أو أعد المحاولة.`)
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}