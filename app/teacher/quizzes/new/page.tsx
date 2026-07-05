'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BRAND } from '@/lib/constants/theme'
import { supabase } from '@/lib/supabase'

interface User { id: string; name: string; role: string; user_type: string; status?: string }
interface Subject { id: string; name: string; icon?: string; grade?: string }
interface Lesson { id: string; name: string; content?: string }
interface Unit { id: string; name: string }
// ── لربط الاختبار إلزامياً بفصل عند النشر ──────────────────
interface ClassItem { id: string; name: string; students_count: number }

type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'essay'
// ── جديد: مستويات بلوم — نفس القائمة المستخدَمة في واجهة التوليد الذكي ──
type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'

const QUESTION_TYPES: { id: QuestionType; icon: string; label: string; desc: string }[] = [
  { id: 'multiple_choice', icon: '☑️', label: 'اختيار من متعدد', desc: 'عدّة خيارات، واحد صحيح' },
  { id: 'true_false',      icon: '✅', label: 'صح أو خطأ',        desc: 'عبارة واحدة للتقييم' },
  { id: 'fill_blank',      icon: '✏️', label: 'ملء الفراغ',       desc: 'إجابة نصية قصيرة' },
  { id: 'essay',           icon: '📝', label: 'سؤال مقالي',        desc: 'إجابة مفتوحة، تصحيح يدوي/AI' },
]

const BLOOM_LEVELS: { id: BloomLevel; label: string }[] = [
  { id: 'remember',   label: 'التذكّر' },
  { id: 'understand', label: 'الفهم' },
  { id: 'apply',       label: 'التطبيق' },
  { id: 'analyze',     label: 'التحليل' },
  { id: 'evaluate',    label: 'التقييم' },
  { id: 'create',      label: 'الإبداع' },
]

interface QuestionOption { id: string; text: string; is_correct: boolean }

interface QuestionDraft {
  localId: string
  type: QuestionType
  text: string
  options: QuestionOption[]
  correctAnswer: string
  explanation: string
  points: number
  hint: string
  difficulty: '' | 'easy' | 'medium' | 'hard'
  // ── جديد: مستوى بلوم — كان غائباً كلياً من هذه الواجهة، وهذا
  // سبب تخزين bloom_level كـ NULL لكل سؤال في قاعدة البيانات
  // (نقطة الـAPI كانت تدعمه فعلاً، لكن لم يكن يصلها أبداً) ────────
  bloomLevel: BloomLevel | ''
  // ── جديد: عنوان القسم (فهم/تذوق/سلامة لغوية...) لأسئلة التوليد
  // العربي الذكي فقط — يُعرَض كتصنيف بصري في المحرر، بلا تأثير
  // على الحفظ في قاعدة البيانات (لا عمود مخصَّص له بعد) ──────────
  sectionTitle?: string
}

function newOption(text = ''): QuestionOption {
  return { id: crypto.randomUUID(), text, is_correct: false }
}

function newQuestion(type: QuestionType): QuestionDraft {
  return {
    localId: crypto.randomUUID(),
    type,
    text: '',
    options: type === 'multiple_choice' ? [newOption(), newOption()] : [],
    correctAnswer: type === 'true_false' ? 'true' : '',
    explanation: '',
    points: 1,
    hint: '',
    difficulty: '',
    bloomLevel: '',
  }
}

// ── تحويل سؤال مولَّد من الذكاء الاصطناعي (JSON خام) إلى QuestionDraft
// لإدخاله في نفس المحرر اليدوي للمراجعة/التعديل قبل الحفظ ──────────
function aiQuestionToDraft(raw: any): QuestionDraft | null {
  const type = raw?.type as QuestionType
  if (!QUESTION_TYPES.some(t => t.id === type)) return null // نوع غير مدعوم بعد في هذا المحرر (matching/ordering/...)

  const draft = newQuestion(type)
  draft.text = String(raw.text ?? '')
  draft.explanation = String(raw.explanation ?? '')
  draft.points = Number(raw.points) > 0 ? Number(raw.points) : 1
  draft.hint = String(raw.hint ?? '')
  draft.difficulty = ['easy', 'medium', 'hard'].includes(raw.difficulty) ? raw.difficulty : ''
  // ── جديد: قراءة bloom_level من استجابة الذكاء الاصطناعي الخام.
  // قبل هذا التعديل، كان هذا الحقل يُفقَد هنا تماماً حتى لو ولّده
  // الذكاء الاصطناعي فعلياً ضمن JSON، فيُحفَظ NULL دائماً في النهاية ──
  draft.bloomLevel = BLOOM_LEVELS.some(b => b.id === raw.bloom_level) ? raw.bloom_level : ''

  if (type === 'multiple_choice' && Array.isArray(raw.options)) {
    draft.options = raw.options.map((o: any) => ({
      id: crypto.randomUUID(),
      text: String(o.text ?? ''),
      is_correct: !!o.is_correct,
    }))
  }
  if (type === 'true_false') {
    draft.correctAnswer = String(raw.correct_answer ?? 'true').toLowerCase() === 'false' ? 'false' : 'true'
  }
  if (type === 'fill_blank') {
    draft.correctAnswer = String(raw.correct_answer ?? '')
  }
  return draft
}

// ── تحويل سؤال من استجابة /api/quizzes/generate-arabic (مقسَّمة
// بأقسام: فهم/تذوق/سلامة لغوية...) إلى QuestionDraft واحد مسطَّح.
// short_answer ⇐ essay (إجابات مفتوحة تحتاج تقييماً بشرياً، مثل
// الإعراب والتلخيص — لا معنى لمطابقة نصية حرفية كـ fill_blank) ──
function arabicQuestionToDraft(raw: any, sectionTitle: string): QuestionDraft | null {
  const rawType = String(raw?.type ?? '')
  const type: QuestionType = rawType === 'multiple_choice' ? 'multiple_choice' : 'essay'

  const draft = newQuestion(type)
  draft.text = String(raw.text ?? '')
  draft.explanation = String(raw.model_answer ?? '')
  draft.points = Number(raw.points) > 0 ? Number(raw.points) : 1
  draft.sectionTitle = sectionTitle

  if (type === 'multiple_choice' && Array.isArray(raw.options)) {
    const correctId = String(raw.correct_option_id ?? '')
    draft.options = raw.options.map((o: any) => ({
      id: crypto.randomUUID(),
      text: String(o.text ?? ''),
      is_correct: String(o.id ?? '') === correctId,
    }))
    // أمان احتياطي: لو لم يحدِّد الذكاء الاصطناعي خياراً صحيحاً بوضوح،
    // نُبقي الكل false ليضطر المعلم لتحديده يدوياً قبل النشر (بدل تخمين خاطئ)
  }

  return draft
}

export default function NewQuizPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState('')
  // ── مُعدَّل: themeColor ثابت دائماً (BRAND.deep) — لا useState، لا اختيار شخصي ──
  const themeColor = BRAND.deep

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])

  // step: 1 = بيانات الاختبار, 1.5 = اختيار طريقة الإضافة, 2 = المحرر
  const [step, setStep] = useState<1 | 1.5 | 2>(1)
  const [mode, setMode] = useState<'manual' | 'ai' | 'ai-arabic' | ''>('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selSubject, setSelSubject] = useState('')
  const [selUnit, setSelUnit] = useState('')
  const [selLessonIds, setSelLessonIds] = useState<string[]>([])
  const [timeLimitMin, setTimeLimitMin] = useState<number | ''>('')
  const [attemptsAllowed, setAttemptsAllowed] = useState(1)
  const [shuffleQuestions, setShuffleQuestions] = useState(true)
  const [shuffleOptions, setShuffleOptions] = useState(true)

  const [creatingQuiz, setCreatingQuiz] = useState(false)
  const [createError, setCreateError] = useState('')
  const [quizId, setQuizId] = useState('')

  const [questions, setQuestions] = useState<QuestionDraft[]>([])
  const [savingQuestions, setSavingQuestions] = useState(false)
  const [questionsError, setQuestionsError] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [done, setDone] = useState(false)

  // ── الفصول المتاحة للمعلم + الفصل المختار للنشر ─────────
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [selClassId, setSelClassId] = useState('')

  // ── حالة التوليد الذكي العام ────────────────────────────────────
  const [aiDistribution, setAiDistribution] = useState<Record<QuestionType, number>>({
    multiple_choice: 4, true_false: 2, fill_blank: 2, essay: 0,
  })
  const [aiBloom, setAiBloom] = useState<Record<string, number>>({
    remember: 0, understand: 0, apply: 0, analyze: 0, evaluate: 0, create: 0,
  })
  const [aiDifficulty, setAiDifficulty] = useState({ easy: 0, medium: 0, hard: 0 })
  const [aiIncludeNahw, setAiIncludeNahw] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiError, setAiError] = useState('')

  // ── حالة التوليد الذكي للغة العربية (قصير/نهائي من ملفات الدروس) ──
  const [arabicQuizType, setArabicQuizType] = useState<'short' | 'final'>('short')
  const [allSubjectLessons, setAllSubjectLessons] = useState<Lesson[]>([])
  const [arabicSelectedLessonIds, setArabicSelectedLessonIds] = useState<string[]>([])
  const [arabicGenerating, setArabicGenerating] = useState(false)
  const [arabicError, setArabicError] = useState('')

  const requiredArabicCount = arabicQuizType === 'short' ? 2 : 5

  useEffect(() => {
    const saved = localStorage.getItem('mosaed_user')
    if (!saved) { router.replace('/'); return }
    try {
      const u = JSON.parse(saved) as User
      if (u.user_type === 'student') { router.replace('/student'); return }
      if (u.status === 'pending' || u.status === 'suspended') { router.replace('/pending-approval'); return }
      setUser(u)
      // ── مُزال: لا نقرأ theme_color بعد الآن، اللون ثابت دائماً ──
    } catch { router.replace('/') }
  }, [router])

  useEffect(() => {
    if (!user) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) setAccessToken(data.session.access_token)
    })
    fetch(`/api/subjects?teacherId=${user.id}`).then(r => r.json()).then(d => setSubjects(d.subjects ?? []))
  }, [user])

  // ── جلب فصول المعلم لربط الاختبار بفصل عند النشر ─────────
  useEffect(() => {
    if (!accessToken) return
    fetch('/api/classes', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => setClasses(d.items ?? d.data?.items ?? []))
      .catch(() => setClasses([]))
  }, [accessToken])

  useEffect(() => {
    if (!selSubject) { setUnits([]); setSelUnit(''); return }
    fetch(`/api/units?subjectId=${selSubject}`).then(r => r.json()).then(d => setUnits(d.units ?? []))
  }, [selSubject])

  useEffect(() => {
    if (!selUnit) { setLessons([]); setSelLessonIds([]); return }
    fetch(`/api/lessons?unitId=${selUnit}`).then(r => r.json()).then(d => setLessons(d.lessons ?? []))
  }, [selUnit])

  // ── جلب كل دروس المادة (عبر كل الوحدات/الفصول) لوضع التوليد
  // العربي — لأن الدرسين/الخمسة المطلوبين قد يكونان في وحدات مختلفة ──
  useEffect(() => {
    if (!selSubject) { setAllSubjectLessons([]); setArabicSelectedLessonIds([]); return }
    fetch(`/api/lessons?subjectId=${selSubject}`)
      .then(r => r.json())
      .then(d => setAllSubjectLessons(d.lessons ?? []))
      .catch(() => setAllSubjectLessons([]))
  }, [selSubject])

  const T = {
    bg: BRAND.bg, cardBg: BRAND.bgSoft, text: BRAND.text, sub: BRAND.sub, border: BRAND.border,
    inputBg: 'rgba(140,20,40,0.04)',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: `1.5px solid ${T.border}`, background: T.inputBg, color: T.text,
    fontSize: 14, fontFamily: 'inherit',
  }

  const selectedLesson = lessons.find(l => l.id === selLessonIds[0])
  const selectedSubjectName = subjects.find(s => s.id === selSubject)?.name
  const isArabicSubject = selectedSubjectName?.includes('اللغة العربية')

  async function createQuiz() {
    if (!accessToken || !title.trim() || selLessonIds.length === 0) return
    setCreatingQuiz(true)
    setCreateError('')
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          lesson_ids: selLessonIds,
          config: {
            question_distribution: { multiple_choice: 0, true_false: 0, fill_blank: 0, matching: 0, ordering: 0, syntax_analysis: 0, extraction: 0, essay: 0 },
            bloom_levels: { remember: 0, understand: 0, apply: 0, analyze: 0, evaluate: 0, create: 0 },
            difficulty: { easy: 0, medium: 0, hard: 0 },
            include_quran_examples: false,
            include_poetry_examples: false,
            include_common_mistakes: false,
          },
          time_limit_minutes: timeLimitMin === '' ? undefined : timeLimitMin,
          attempts_allowed: attemptsAllowed,
          shuffle_questions: shuffleQuestions,
          shuffle_options: shuffleOptions,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setCreateError(data?.error || 'فشل إنشاء الاختبار.')
        return
      }
      const newId = data?.data?.id ?? data?.id
      setQuizId(newId)
      setStep(1.5)
    } catch {
      setCreateError('تعذّر الاتصال بالخادم.')
    } finally {
      setCreatingQuiz(false)
    }
  }

  function chooseManual() {
    setMode('manual')
    setQuestions([newQuestion('multiple_choice')])
    setStep(2)
  }

  function chooseAi() {
    setMode('ai')
    setStep(1.5) // يبقى في نفس الخطوة لعرض واجهة التوزيع — لا تنقل مباشرة
  }

  function chooseAiArabic() {
    setMode('ai-arabic')
    setStep(1.5)
  }

  function toggleArabicLesson(id: string) {
    setArabicSelectedLessonIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= requiredArabicCount) return prev // لا تتجاوز العدد المطلوب
      return [...prev, id]
    })
  }

  // ── توليد الأسئلة بالذكاء الاصطناعي (الوضع العام) ──────────────────
  async function generateWithAi() {
    if (!accessToken) return
    const totalCount = Object.values(aiDistribution).reduce((a, b) => a + b, 0)
    if (totalCount === 0) {
      setAiError('حدّد عدد أسئلة لنوع واحد على الأقل.')
      return
    }
    setAiGenerating(true)
    setAiError('')
    try {
      const res = await fetch('/api/quizzes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          lessonName: selectedLesson?.name,
          material: selectedLesson?.content || '',
          subjectName: selectedSubjectName,
          questionDistribution: aiDistribution,
          bloomLevels: aiBloom,
          difficulty: aiDifficulty,
          includeNahwRules: aiIncludeNahw,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setAiError(data?.error || 'فشل توليد الأسئلة.')
        return
      }
      const drafts = (data.questions || [])
        .map(aiQuestionToDraft)
        .filter((q: QuestionDraft | null): q is QuestionDraft => q !== null)

      if (drafts.length === 0) {
        setAiError('لم يُولَّد أي سؤال بنوع مدعوم في المحرر الحالي. حاول بأنواع أخرى.')
        return
      }
      setQuestions(drafts)
      setStep(2)
    } catch {
      setAiError('تعذّر الاتصال بالخادم.')
    } finally {
      setAiGenerating(false)
    }
  }

  // ── توليد اختبار اللغة العربية الكامل من ملفات الدروس مباشرة ──────
  async function generateArabicQuiz() {
    if (!accessToken) return
    if (arabicSelectedLessonIds.length !== requiredArabicCount) {
      setArabicError(
        arabicQuizType === 'short'
          ? 'اختر درسين بالضبط للاختبار القصير.'
          : 'اختر خمسة دروس بالضبط لاختبار نهاية الفصل.'
      )
      return
    }
    setArabicGenerating(true)
    setArabicError('')
    try {
      const res = await fetch('/api/quizzes/generate-arabic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          quizType: arabicQuizType,
          lessonIds: arabicSelectedLessonIds,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const missing = data?.missingFiles as string[] | undefined
        setArabicError(
          missing?.length
            ? `${data.error}\n${missing.join('، ')}`
            : data?.error || 'فشل توليد الاختبار.'
        )
        return
      }

      const sections = data?.quiz?.sections
      if (!Array.isArray(sections) || sections.length === 0) {
        setArabicError('رد الذكاء الاصطناعي لم يحتوِ على أقسام صالحة. حاول مرة أخرى.')
        return
      }

      const drafts: QuestionDraft[] = []
      for (const section of sections) {
        const sectionTitle = String(section?.title ?? '')
        const qs = Array.isArray(section?.questions) ? section.questions : []
        for (const raw of qs) {
          const d = arabicQuestionToDraft(raw, sectionTitle)
          if (d) drafts.push(d)
        }
      }

      if (drafts.length === 0) {
        setArabicError('لم تُستخرَج أي أسئلة صالحة من رد الذكاء الاصطناعي.')
        return
      }

      // عنوان مقترح تلقائي إن لم يكتب المعلم عنواناً بعد
      if (!title.trim()) {
        setTitle(arabicQuizType === 'short' ? 'اختبار قصير — اللغة العربية' : 'اختبار نهاية الفصل — اللغة العربية')
      }
      setSelLessonIds(arabicSelectedLessonIds)
      setQuestions(drafts)
      setStep(2)
    } catch {
      setArabicError('تعذّر الاتصال بالخادم.')
    } finally {
      setArabicGenerating(false)
    }
  }

  function addQuestion(type: QuestionType) {
    setQuestions(prev => [...prev, newQuestion(type)])
  }
  function removeQuestion(localId: string) {
    setQuestions(prev => prev.filter(q => q.localId !== localId))
  }
  function updateQuestion(localId: string, patch: Partial<QuestionDraft>) {
    setQuestions(prev => prev.map(q => (q.localId === localId ? { ...q, ...patch } : q)))
  }
  function addOption(localId: string) {
    setQuestions(prev => prev.map(q => (q.localId === localId ? { ...q, options: [...q.options, newOption()] } : q)))
  }
  function updateOption(localId: string, optId: string, patch: Partial<QuestionOption>) {
    setQuestions(prev => prev.map(q => {
      if (q.localId !== localId) return q
      return { ...q, options: q.options.map(o => (o.id === optId ? { ...o, ...patch } : o)) }
    }))
  }
  function setCorrectOption(localId: string, optId: string) {
    setQuestions(prev => prev.map(q => {
      if (q.localId !== localId) return q
      return { ...q, options: q.options.map(o => ({ ...o, is_correct: o.id === optId })) }
    }))
  }
  function removeOption(localId: string, optId: string) {
    setQuestions(prev => prev.map(q => {
      if (q.localId !== localId) return q
      return { ...q, options: q.options.filter(o => o.id !== optId) }
    }))
  }

  function validateQuestions(): string | null {
    if (questions.length === 0) return 'أضف سؤالاً واحداً على الأقل.'
    for (const q of questions) {
      if (!q.text.trim()) return 'كل سؤال يحتاج نصاً.'
      if (q.type === 'multiple_choice') {
        if (q.options.length < 2) return 'سؤال الاختيار من متعدد يحتاج خيارين على الأقل.'
        if (q.options.some(o => !o.text.trim())) return 'لا تترك خيارات فاضية.'
        if (!q.options.some(o => o.is_correct)) return 'حدّد الخيار الصحيح في كل سؤال اختيار من متعدد.'
      }
      if (q.type === 'true_false' && !q.correctAnswer) return 'حدّد الإجابة الصحيحة (صح/خطأ).'
      if (q.type === 'fill_blank' && !q.correctAnswer.trim()) return 'اكتب الإجابة الصحيحة لسؤال ملء الفراغ.'
    }
    return null
  }

  async function saveQuestions() {
    const validationError = validateQuestions()
    if (validationError) {
      setQuestionsError(validationError)
      return false
    }
    if (!accessToken || !quizId) return false
    setSavingQuestions(true)
    setQuestionsError('')
    try {
      // ── جديد: lesson_id موحَّد لكل أسئلة هذا الاختبار — مأخوذ من
      // الدرس المختار في خطوة 1 (selLessonIds[0]). نقطة الـAPI كانت
      // تدعم هذا الحقل فعلياً وتكتبه في قاعدة البيانات، لكن لم تكن
      // تستلمه أبداً من هنا، فيُخزَّن NULL لكل سؤال دائماً ─────────
      const lessonIdForQuestions = selLessonIds[0] || undefined

      const payload = {
        action: 'add_questions',
        questions: questions.map(q => ({
          type: q.type,
          text: q.sectionTitle ? `[${q.sectionTitle}] ${q.text.trim()}` : q.text.trim(),
          options: q.type === 'multiple_choice' ? q.options.map(o => ({ id: o.id, text: o.text.trim(), is_correct: o.is_correct })) : undefined,
          // ── correct_answer يُرسَل أيضاً لـ multiple_choice (id
          // الخيار الصحيح) — منطق التصحيح في submit/route.ts يقارن
          // إجابة الطالب بـ correct_answer مباشرة، لا بـ is_correct
          // داخل options فقط. بدون هذا، correct_answer يبقى NULL في
          // قاعدة البيانات، فيُصحَّح كل سؤال اختيار من متعدد خطأً دائماً
          // بصرف النظر عن إجابة الطالب الفعلية. ─────────────────────
          correct_answer:
            q.type === 'multiple_choice'
              ? q.options.find(o => o.is_correct)?.id
              : q.type === 'true_false' || q.type === 'fill_blank'
                ? q.correctAnswer.trim()
                : undefined,
          explanation: q.explanation.trim(),
          points: q.points,
          hint: q.hint.trim() || undefined,
          difficulty: q.difficulty || undefined,
          // ── جديد: الحقلان اللذان كانا غائبين بالكامل من هذا الـpayload ──
          bloom_level: q.bloomLevel || undefined,
          lesson_id: lessonIdForQuestions,
        })),
      }
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setQuestionsError(data?.error || 'فشل حفظ الأسئلة.')
        return false
      }
      return true
    } catch {
      setQuestionsError('تعذّر الاتصال بالخادم.')
      return false
    } finally {
      setSavingQuestions(false)
    }
  }

  async function saveAndPublish() {
    // ── لا نشر بلا فصل محدَّد ────────────────────────────
    if (!selClassId) {
      setQuestionsError('اختر الفصل الذي سيُنشر له الاختبار قبل المتابعة.')
      return
    }
    const saved = await saveQuestions()
    if (!saved) return
    setPublishing(true)
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ action: 'publish', class_id: selClassId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setQuestionsError(data?.error || 'فشل نشر الاختبار.')
        return
      }
      setDone(true)
      setTimeout(() => router.push('/teacher/quizzes'), 1500)
    } finally {
      setPublishing(false)
    }
  }

  async function saveAsDraft() {
    const saved = await saveQuestions()
    if (saved) router.push('/teacher/quizzes')
  }

  if (!user) return null

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: BRAND.fontBody, paddingBottom: 90 }}>
      <style>{`* { box-sizing: border-box; } textarea:focus, input:focus, select:focus { outline: none; }`}</style>

      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(247,242,234,0.97)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${T.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => router.push('/teacher/quizzes')} style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: themeColor, color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>→ رجوع</button>
        <h1 style={{ fontSize: 18, fontWeight: 900, color: themeColor, background: `${themeColor}16`, padding: '4px 12px', borderRadius: 8, margin: 0, fontFamily: BRAND.fontHeading }}>
          {step === 1 ? '🎯 اختبار جديد' : step === 1.5 ? '⚡ طريقة إضافة الأسئلة' : '📋 راجع الأسئلة'}
        </h1>
        <div style={{ width: 90 }} />
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── خطوة 1: بيانات الاختبار ── */}
        {step === 1 && (
          <div style={{ display: 'grid', gap: 16 }}>
            {createError && (
              <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(180,40,40,0.1)', color: BRAND.crimson, fontSize: 13, fontWeight: 700 }}>⚠️ {createError}</div>
            )}

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: T.sub, display: 'block', marginBottom: 6 }}>عنوان الاختبار *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: اختبار درس النعت" style={inputStyle} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: T.sub, display: 'block', marginBottom: 6 }}>وصف مختصر (اختياري)</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: T.sub, display: 'block', marginBottom: 6 }}>المادة *</label>
                <select value={selSubject} onChange={e => setSelSubject(e.target.value)} style={inputStyle}>
                  <option value="">-- اختر --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: T.sub, display: 'block', marginBottom: 6 }}>الوحدة *</label>
                <select value={selUnit} onChange={e => setSelUnit(e.target.value)} disabled={!selSubject} style={inputStyle}>
                  <option value="">-- اختر --</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: T.sub, display: 'block', marginBottom: 6 }}>الدرس *</label>
                <select value={selLessonIds[0] ?? ''} onChange={e => setSelLessonIds(e.target.value ? [e.target.value] : [])} disabled={!selUnit} style={inputStyle}>
                  <option value="">-- اختر --</option>
                  {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>

            {isArabicSubject && (
              <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(30,90,160,0.06)', border: '1px solid rgba(30,90,160,0.2)', fontSize: 12, color: BRAND.sub }}>
                💡 لمادة اللغة العربية، يمكنك لاحقاً اختيار "توليد عربي ذكي" لإنشاء اختبار كامل من ملفات الدروس مباشرة (لا حاجة لاختيار وحدة/درس واحد هنا بدقة — سيُتاح اختيار الدروس بشكل منفصل).
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: T.sub, display: 'block', marginBottom: 6 }}>⏰ الوقت المحدَّد (دقيقة، اختياري)</label>
                <input type="number" min={1} max={180} value={timeLimitMin} onChange={e => setTimeLimitMin(e.target.value === '' ? '' : Number(e.target.value))} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: T.sub, display: 'block', marginBottom: 6 }}>🔁 عدد المحاولات المسموحة</label>
                <input type="number" min={1} max={10} value={attemptsAllowed} onChange={e => setAttemptsAllowed(Number(e.target.value))} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.text, cursor: 'pointer' }}>
                <input type="checkbox" checked={shuffleQuestions} onChange={e => setShuffleQuestions(e.target.checked)} style={{ width: 16, height: 16, accentColor: themeColor }} />
                ترتيب عشوائي للأسئلة
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.text, cursor: 'pointer' }}>
                <input type="checkbox" checked={shuffleOptions} onChange={e => setShuffleOptions(e.target.checked)} style={{ width: 16, height: 16, accentColor: themeColor }} />
                ترتيب عشوائي للخيارات
              </label>
            </div>

            <button
              onClick={createQuiz}
              disabled={creatingQuiz || !title.trim() || selLessonIds.length === 0}
              style={{
                padding: '14px', borderRadius: 14, border: 'none',
                background: (title.trim() && selLessonIds.length > 0) ? BRAND.gradMain : T.border,
                color: '#fff', fontWeight: 900, fontSize: 16,
                cursor: (title.trim() && selLessonIds.length > 0) ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
              }}
            >
              {creatingQuiz ? '⏳ جارٍ الإنشاء...' : 'التالي: أضف الأسئلة ←'}
            </button>
          </div>
        )}

        {/* ── خطوة 1.5: اختيار الطريقة + واجهات التوليد ── */}
        {step === 1.5 && (
          <div style={{ display: 'grid', gap: 16 }}>
            {mode === '' && (
              <>
                <p style={{ fontSize: 14, color: T.sub, textAlign: 'center', marginBottom: 6 }}>كيف تريد إضافة أسئلة هذا الاختبار؟</p>
                <div style={{ display: 'grid', gridTemplateColumns: isArabicSubject ? '1fr 1fr 1fr' : '1fr 1fr', gap: 14 }}>
                  {isArabicSubject && (
                    <button onClick={chooseAiArabic}
                      style={{ padding: 24, borderRadius: 18, border: '2px solid rgba(30,90,160,0.4)', background: 'rgba(30,90,160,0.06)', cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit' }}>
                      <div style={{ fontSize: 36, marginBottom: 10 }}>📚</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#1E5AA0', marginBottom: 6, fontFamily: BRAND.fontHeading }}>توليد عربي ذكي</div>
                      <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.7 }}>يولّد اختباراً كاملاً (قصير/نهائي) مباشرة من ملفات الدروس المرفوعة، بقالب ثابت معتمد.</div>
                    </button>
                  )}
                  <button onClick={chooseAi}
                    style={{ padding: 24, borderRadius: 18, border: `2px solid ${themeColor}44`, background: `${themeColor}0F`, cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit' }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>✨</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: themeColor, marginBottom: 6, fontFamily: BRAND.fontHeading }}>توليد ذكي</div>
                    <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.7 }}>المساعد الذكي يولّد الأسئلة تلقائياً حسب التوزيع الذي تحدّده، وتراجعها وتعدّلها قبل النشر.</div>
                  </button>
                  <button onClick={chooseManual}
                    style={{ padding: 24, borderRadius: 18, border: `1.5px solid ${T.border}`, background: T.cardBg, cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit' }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>✍️</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: T.text, marginBottom: 6, fontFamily: BRAND.fontHeading }}>محرر يدوي</div>
                    <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.7 }}>تكتب كل سؤال وخياراته بنفسك من الصفر، بتحكّم كامل في كل تفصيل.</div>
                  </button>
                </div>
              </>
            )}

            {mode === 'ai-arabic' && (
              <div style={{ display: 'grid', gap: 16 }}>
                <button onClick={() => setMode('')} style={{ alignSelf: 'flex-start', padding: '6px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.sub, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>← رجوع لاختيار الطريقة</button>

                {arabicError && (
                  <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(180,40,40,0.1)', color: BRAND.crimson, fontSize: 13, fontWeight: 700, whiteSpace: 'pre-line' }}>⚠️ {arabicError}</div>
                )}

                <div style={{ padding: 16, borderRadius: 16, background: T.cardBg, border: `1.5px solid ${T.border}` }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 12, fontFamily: BRAND.fontHeading }}>نوع الاختبار</p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {([['short', 'قصير (درسان)'], ['final', 'نهاية الفصل (خمسة دروس)']] as const).map(([val, label]) => (
                      <button key={val} onClick={() => { setArabicQuizType(val); setArabicSelectedLessonIds([]) }}
                        style={{ flex: 1, padding: '12px', borderRadius: 12, border: `2px solid ${arabicQuizType === val ? '#1E5AA0' : T.border}`, background: arabicQuizType === val ? 'rgba(30,90,160,0.1)' : 'transparent', color: arabicQuizType === val ? '#1E5AA0' : T.sub, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ padding: 16, borderRadius: 16, background: T.cardBg, border: `1.5px solid ${T.border}` }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 4, fontFamily: BRAND.fontHeading }}>
                    اختر {requiredArabicCount === 2 ? 'درسين' : 'خمسة دروس'} بالضبط
                  </p>
                  <p style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>
                    تم اختيار {arabicSelectedLessonIds.length} من {requiredArabicCount}
                  </p>
                  {allSubjectLessons.length === 0 ? (
                    <p style={{ fontSize: 12, color: T.sub }}>لا توجد دروس في هذه المادة بعد، أو لم تُختَر المادة في الخطوة السابقة.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                      {allSubjectLessons.map(l => {
                        const checked = arabicSelectedLessonIds.includes(l.id)
                        const disabled = !checked && arabicSelectedLessonIds.length >= requiredArabicCount
                        return (
                          <label key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${checked ? '#1E5AA0' : T.border}`, background: checked ? 'rgba(30,90,160,0.06)' : 'transparent', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
                            <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleArabicLesson(l.id)} style={{ width: 16, height: 16, accentColor: '#1E5AA0' }} />
                            <span style={{ fontSize: 13, color: T.text }}>{l.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>

                <button onClick={generateArabicQuiz} disabled={arabicGenerating || arabicSelectedLessonIds.length !== requiredArabicCount}
                  style={{ padding: '14px', borderRadius: 14, border: 'none', background: arabicSelectedLessonIds.length === requiredArabicCount ? 'linear-gradient(135deg,#1E5AA0,#2D7DD2)' : T.border, color: '#fff', fontWeight: 900, fontSize: 16, cursor: arabicGenerating ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {arabicGenerating ? '⏳ جارٍ توليد الاختبار الكامل (قد يستغرق دقيقة)...' : '📚 ولّد الاختبار الآن'}
                </button>
              </div>
            )}

            {mode === 'ai' && (
              <div style={{ display: 'grid', gap: 16 }}>
                <button onClick={() => setMode('')} style={{ alignSelf: 'flex-start', padding: '6px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.sub, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>← رجوع لاختيار الطريقة</button>

                {aiError && (
                  <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(180,40,40,0.1)', color: BRAND.crimson, fontSize: 13, fontWeight: 700 }}>⚠️ {aiError}</div>
                )}

                <div style={{ padding: 16, borderRadius: 16, background: T.cardBg, border: `1.5px solid ${T.border}` }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 12, fontFamily: BRAND.fontHeading }}>📊 عدد الأسئلة حسب النوع</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                    {QUESTION_TYPES.map(t => (
                      <div key={t.id} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, marginBottom: 4 }}>{t.icon}</div>
                        <div style={{ fontSize: 10, color: T.sub, marginBottom: 6 }}>{t.label}</div>
                        <input type="number" min={0} max={30} value={aiDistribution[t.id]}
                          onChange={e => setAiDistribution(prev => ({ ...prev, [t.id]: Math.max(0, Number(e.target.value)) }))}
                          style={{ ...inputStyle, textAlign: 'center', padding: '8px' }} />
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: T.sub, marginTop: 10, textAlign: 'left' }}>
                    الإجمالي: {Object.values(aiDistribution).reduce((a, b) => a + b, 0)} سؤال
                  </p>
                </div>

                <div style={{ padding: 16, borderRadius: 16, background: T.cardBg, border: `1.5px solid ${T.border}` }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 12, fontFamily: BRAND.fontHeading }}>🧠 مستويات بلوم المعرفية (اختياري)</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
                    {BLOOM_LEVELS.map(b => (
                      <div key={b.id} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: T.sub, marginBottom: 6 }}>{b.label}</div>
                        <input type="number" min={0} max={30} value={aiBloom[b.id]}
                          onChange={e => setAiBloom(prev => ({ ...prev, [b.id]: Math.max(0, Number(e.target.value)) }))}
                          style={{ ...inputStyle, textAlign: 'center', padding: '8px', fontSize: 12 }} />
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: 16, borderRadius: 16, background: T.cardBg, border: `1.5px solid ${T.border}` }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 12, fontFamily: BRAND.fontHeading }}>🎯 مستوى الصعوبة (اختياري)</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                    {([['easy', 'سهل'], ['medium', 'متوسط'], ['hard', 'صعب']] as const).map(([key, label]) => (
                      <div key={key} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: T.sub, marginBottom: 6 }}>{label}</div>
                        <input type="number" min={0} max={30} value={aiDifficulty[key]}
                          onChange={e => setAiDifficulty(prev => ({ ...prev, [key]: Math.max(0, Number(e.target.value)) }))}
                          style={{ ...inputStyle, textAlign: 'center', padding: '8px' }} />
                      </div>
                    ))}
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: T.text, cursor: 'pointer', padding: '12px 16px', borderRadius: 12, background: T.cardBg, border: `1.5px solid ${T.border}` }}>
                  <input type="checkbox" checked={aiIncludeNahw} onChange={e => setAiIncludeNahw(e.target.checked)} style={{ width: 16, height: 16, accentColor: themeColor }} />
                  🔤 تضمين قواعد النحو العربي المرجعية (للمواد العربية فقط)
                </label>

                <button onClick={generateWithAi} disabled={aiGenerating}
                  style={{ padding: '14px', borderRadius: 14, border: 'none', background: BRAND.gradMain, color: '#fff', fontWeight: 900, fontSize: 16, cursor: aiGenerating ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {aiGenerating ? '⏳ المساعد الذكي يولّد الأسئلة...' : '✨ ولّد الأسئلة الآن'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── خطوة 2: محرّر الأسئلة (يدوي أو نتيجة التوليد الذكي) ── */}
        {step === 2 && (
          <div style={{ display: 'grid', gap: 16 }}>
            {mode === 'ai' && (
              <div style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(5,150,105,0.08)', color: '#059669', fontSize: 13, fontWeight: 700 }}>
                ✨ تم توليد {questions.length} سؤال — راجعها وعدّلها كما تشاء قبل النشر.
              </div>
            )}
            {mode === 'ai-arabic' && (
              <div style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(30,90,160,0.08)', color: '#1E5AA0', fontSize: 13, fontWeight: 700 }}>
                📚 تم توليد {questions.length} سؤال من ملفات الدروس — راجع الدرجات وحدّد الخيارات الصحيحة (إن لزم) قبل النشر.
              </div>
            )}
            {questionsError && (
              <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(180,40,40,0.1)', color: BRAND.crimson, fontSize: 13, fontWeight: 700 }}>⚠️ {questionsError}</div>
            )}
            {done && (
              <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(5,150,105,0.1)', color: '#059669', fontSize: 14, fontWeight: 800, textAlign: 'center' }}>✅ تم نشر الاختبار بنجاح!</div>
            )}

            {questions.map((q, qi) => (
              <div key={q.localId} style={{ padding: 18, borderRadius: 16, background: T.cardBg, border: `1.5px solid ${T.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: themeColor }}>
                    سؤال {qi + 1} — {QUESTION_TYPES.find(t => t.id === q.type)?.icon} {QUESTION_TYPES.find(t => t.id === q.type)?.label}
                    {q.sectionTitle ? <span style={{ color: '#1E5AA0', fontWeight: 700 }}> · {q.sectionTitle}</span> : null}
                  </span>
                  <button onClick={() => removeQuestion(q.localId)} style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(180,40,40,0.3)', background: 'rgba(180,40,40,0.06)', color: BRAND.crimson, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>🗑️ حذف</button>
                </div>

                <textarea value={q.text} onChange={e => updateQuestion(q.localId, { text: e.target.value })} placeholder="نص السؤال" rows={2} style={{ ...inputStyle, resize: 'vertical', marginBottom: 12 }} />

                {q.type === 'multiple_choice' && (
                  <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                    {q.options.map((o, oi) => (
                      <div key={o.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="radio" checked={o.is_correct} onChange={() => setCorrectOption(q.localId, o.id)} style={{ width: 16, height: 16, accentColor: themeColor, flexShrink: 0 }} title="الخيار الصحيح" />
                        <input value={o.text} onChange={e => updateOption(q.localId, o.id, { text: e.target.value })} placeholder={`خيار ${oi + 1}`} style={{ ...inputStyle, flex: 1 }} />
                        {q.options.length > 2 && (
                          <button onClick={() => removeOption(q.localId, o.id)} style={{ background: 'none', border: 'none', color: T.sub, fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>✕</button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => addOption(q.localId)} style={{ padding: '6px 14px', borderRadius: 8, border: `1px dashed ${T.border}`, background: 'transparent', color: T.sub, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', alignSelf: 'flex-start' }}>＋ خيار آخر</button>
                  </div>
                )}

                {q.type === 'true_false' && (
                  <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                    {([['true', '✅ صحيح'], ['false', '❌ خطأ']] as const).map(([val, label]) => (
                      <button key={val} onClick={() => updateQuestion(q.localId, { correctAnswer: val })}
                        style={{ flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${q.correctAnswer === val ? themeColor : T.border}`, background: q.correctAnswer === val ? `${themeColor}18` : 'transparent', color: q.correctAnswer === val ? themeColor : T.sub, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'fill_blank' && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, color: T.sub, display: 'block', marginBottom: 4 }}>الإجابة الصحيحة</label>
                    <input value={q.correctAnswer} onChange={e => updateQuestion(q.localId, { correctAnswer: e.target.value })} placeholder="الإجابة المتوقَّعة" style={inputStyle} />
                  </div>
                )}

                {q.type === 'essay' && (
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: T.inputBg, fontSize: 12, color: T.sub, marginBottom: 12 }}>
                    سؤال مقالي — يحتاج تصحيحاً يدوياً أو بالذكاء الاصطناعي لاحقاً، بلا إجابة محدَّدة مسبقاً.
                    {q.explanation ? <div style={{ marginTop: 6 }}>💡 إجابة نموذجية مقترحة: {q.explanation}</div> : null}
                  </div>
                )}

                {/* ── جديد: حقل مستوى بلوم — قابل للتعديل اليدوي من المعلم
                     حتى لو جاء السؤال من التوليد الذكي، تماماً كحقل
                     "مستوى الصعوبة" المجاور له ──────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr 1fr', gap: 10 }}>
                  <input value={q.explanation} onChange={e => updateQuestion(q.localId, { explanation: e.target.value })} placeholder="شرح الإجابة (اختياري)" style={{ ...inputStyle, fontSize: 12 }} />
                  <input type="number" min={1} value={q.points} onChange={e => updateQuestion(q.localId, { points: Number(e.target.value) })} placeholder="الدرجة" style={{ ...inputStyle, fontSize: 12, textAlign: 'center' }} />
                  <select value={q.difficulty} onChange={e => updateQuestion(q.localId, { difficulty: e.target.value as QuestionDraft['difficulty'] })} style={{ ...inputStyle, fontSize: 12 }}>
                    <option value="">مستوى الصعوبة</option>
                    <option value="easy">سهل</option>
                    <option value="medium">متوسط</option>
                    <option value="hard">صعب</option>
                  </select>
                  <select value={q.bloomLevel} onChange={e => updateQuestion(q.localId, { bloomLevel: e.target.value as QuestionDraft['bloomLevel'] })} style={{ ...inputStyle, fontSize: 12 }}>
                    <option value="">مستوى بلوم</option>
                    {BLOOM_LEVELS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                  </select>
                </div>
              </div>
            ))}

            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 10 }}>أضف سؤالاً جديداً:</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                {QUESTION_TYPES.map(t => (
                  <button key={t.id} onClick={() => addQuestion(t.id)}
                    style={{ padding: '12px 8px', borderRadius: 12, border: `1.5px solid ${T.border}`, background: T.cardBg, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{t.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{t.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── اختيار الفصل — إلزامي قبل النشر (مسودة لا تحتاجه) ── */}
            <div style={{ padding: 16, borderRadius: 16, background: T.cardBg, border: `1.5px solid ${T.border}` }}>
              <label style={{ fontSize: 13, fontWeight: 800, color: T.text, display: 'block', marginBottom: 8, fontFamily: BRAND.fontHeading }}>
                🏫 الفصل (مطلوب قبل النشر)
              </label>
              <select value={selClassId} onChange={e => setSelClassId(e.target.value)} style={inputStyle}>
                <option value="">-- اختر الفصل --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.students_count} طالب)</option>)}
              </select>
              {classes.length === 0 && (
                <p style={{ fontSize: 12, color: T.sub, marginTop: 8 }}>لا توجد فصول بعد — أنشئ فصلاً من تبويب "الفصول" أولاً.</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button onClick={saveAsDraft} disabled={savingQuestions || publishing}
                style={{ flex: 1, padding: '14px', borderRadius: 14, border: `1.5px solid ${T.border}`, background: 'transparent', color: T.text, fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                💾 حفظ كمسودة
              </button>
              <button onClick={saveAndPublish} disabled={savingQuestions || publishing || !selClassId}
                style={{ flex: 2, padding: '14px', borderRadius: 14, border: 'none', background: selClassId ? BRAND.gradMain : T.border, color: selClassId ? '#fff' : T.sub, fontWeight: 900, fontSize: 15, cursor: selClassId ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                {publishing || savingQuestions ? '⏳ جارٍ الحفظ...' : '🚀 حفظ ونشر الاختبار'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
