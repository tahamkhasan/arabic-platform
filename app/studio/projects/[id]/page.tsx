'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { APP, BRAND } from '@/lib/constants/theme'

type StudioOutputType =
  | 'lesson_summary'
  | 'mcq_quiz'
  | 'short_explainer_video'

type StudioSourceType = 'pdf' | 'text' | 'image' | 'video'

type StudioProjectStatus = 'draft' | 'processing' | 'completed' | 'error'

type StudioProject = {
  id: string
  title: string | null
  output_type: StudioOutputType | null
  source_type: StudioSourceType | null
  status: StudioProjectStatus | null
  created_at: string
  updated_at: string | null
}

type StudioSummary = {
  id: string
  project_id: string
  content: string
  created_at: string
  updated_at: string
}

type QuizQuestion = {
  id: string
  question: string
  options: string[]
  correctAnswerIndex: number
}

type StudioQuiz = {
  id: string
  project_id: string
  title: string
  questions: QuizQuestion[]
  created_at: string
  updated_at: string
}

function getOutputTypeLabel(type: StudioOutputType | null) {
  const labels: Record<StudioOutputType, string> = {
    lesson_summary: 'ملخص درس',
    mcq_quiz: 'اختبار اختيار من متعدد',
    short_explainer_video: 'فيديو شرح مختصر',
  }

  return type ? labels[type] || 'غير محدد' : 'غير محدد'
}

function getSourceTypeLabel(type: StudioSourceType | null) {
  const labels: Record<StudioSourceType, string> = {
    pdf: 'ملف PDF / Word',
    text: 'نص مكتوب',
    image: 'صورة أو صفحة',
    video: 'فيديو قصير',
  }

  return type ? labels[type] || 'غير محدد' : 'غير محدد'
}

function getStatusConfig(status: StudioProjectStatus | null) {
  const configs: Record<
    StudioProjectStatus,
    { label: string; background: string; color: string }
  > = {
    draft: {
      label: 'مسودة',
      background: '#FEF3C7',
      color: '#92400E',
    },
    processing: {
      label: 'قيد المعالجة',
      background: '#DBEAFE',
      color: '#1D4ED8',
    },
    completed: {
      label: 'مكتمل',
      background: '#DCFCE7',
      color: '#166534',
    },
    error: {
      label: 'تعذر الإكمال',
      background: '#FEE2E2',
      color: '#B91C1C',
    },
  }

  return (
    configs[status || 'draft'] || {
      label: 'غير محددة',
      background: '#F3F4F6',
      color: '#374151',
    }
  )
}

function formatArabicDate(value: string | null | undefined) {
  if (!value) {
    return 'غير متاح'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'غير متاح'
  }

  return date.toLocaleString('ar-KW', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function normalizeQuiz(rawQuiz: unknown): StudioQuiz | null {
  if (!rawQuiz || typeof rawQuiz !== 'object') {
    return null
  }

  const quiz = rawQuiz as Partial<StudioQuiz>

  if (!quiz.id || !quiz.project_id || !quiz.title) {
    return null
  }

  const questions = Array.isArray(quiz.questions)
    ? quiz.questions
        .filter(
          (item): item is QuizQuestion =>
            Boolean(
              item &&
                typeof item === 'object' &&
                typeof (item as QuizQuestion).id === 'string' &&
                typeof (item as QuizQuestion).question === 'string' &&
                Array.isArray((item as QuizQuestion).options) &&
                typeof (item as QuizQuestion).correctAnswerIndex === 'number'
            )
        )
        .map((question) => ({
          ...question,
          options: question.options.map(String),
        }))
    : []

  return {
    id: quiz.id,
    project_id: quiz.project_id,
    title: quiz.title,
    questions,
    created_at: quiz.created_at || '',
    updated_at: quiz.updated_at || '',
  }
}

function normalizeArabic(value: string): string {
  return value
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ًٌٍَُِّْـ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function StudioProjectDetailPage() {
  const router = useRouter()
  const params = useParams()

  const projectId = useMemo(() => {
    const rawId = params?.id
    return Array.isArray(rawId) ? rawId[0] : rawId || ''
  }, [params])

  const [project, setProject] = useState<StudioProject | null>(null)
  const [summary, setSummary] = useState<StudioSummary | null>(null)
  const [quiz, setQuiz] = useState<StudioQuiz | null>(null)

  const [loading, setLoading] = useState(true)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingQuiz, setLoadingQuiz] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [editingTitle, setEditingTitle] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [copying, setCopying] = useState(false)

  const [editingQuiz, setEditingQuiz] = useState(false)
  const [draftQuestions, setDraftQuestions] = useState<QuizQuestion[]>([])
  const [savingQuiz, setSavingQuiz] = useState(false)

  const loadSummary = useCallback(async () => {
    if (!projectId) {
      return
    }

    setLoadingSummary(true)

    try {
      const response = await fetch(
        `/api/studio/projects/${projectId}/summary`,
        { cache: 'no-store' }
      )

      if (response.status === 404) {
        setSummary(null)
        return
      }

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || 'تعذر جلب ملخص المشروع.')
      }

      setSummary(data?.summary || null)
    } catch (loadError) {
      console.error('Studio summary fetch error:', loadError)
      setSummary(null)
    } finally {
      setLoadingSummary(false)
    }
  }, [projectId])

  const loadQuiz = useCallback(async () => {
    if (!projectId) {
      return
    }

    setLoadingQuiz(true)

    try {
      const response = await fetch(`/api/studio/projects/${projectId}/quiz`, {
        cache: 'no-store',
      })

      if (response.status === 404) {
        setQuiz(null)
        return
      }

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || 'تعذر جلب اختبار المشروع.')
      }

      setQuiz(normalizeQuiz(data?.quiz))
    } catch (loadError) {
      console.error('Studio quiz fetch error:', loadError)
      setQuiz(null)
    } finally {
      setLoadingQuiz(false)
    }
  }, [projectId])

  const loadProject = useCallback(async () => {
    if (!projectId) {
      setLoading(false)
      setError('معرّف المشروع غير صالح.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/studio/projects/${projectId}`, {
        cache: 'no-store',
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || 'تعذر جلب بيانات المشروع.')
      }

      const nextProject = (data?.project || null) as StudioProject | null

      if (!nextProject) {
        throw new Error('لم يتم العثور على بيانات المشروع.')
      }

      setProject(nextProject)
      setNewTitle(nextProject.title || '')
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : 'حدث خطأ غير متوقع أثناء جلب المشروع.'

      console.error('Studio project fetch error:', loadError)
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void loadProject()
  }, [loadProject])

  useEffect(() => {
    if (project?.output_type === 'lesson_summary') {
      void loadSummary()
      setQuiz(null)
      return
    }

    setSummary(null)
  }, [loadSummary, project?.output_type, project?.status])

  useEffect(() => {
    if (project?.output_type === 'mcq_quiz') {
      void loadQuiz()
      setSummary(null)
      return
    }

    setQuiz(null)
  }, [loadQuiz, project?.output_type, project?.status])

  async function handleUpdateTitle() {
    if (!project) {
      return
    }

    const title = newTitle.trim()

    if (!title) {
      setError('عنوان المشروع لا يمكن أن يكون فارغًا.')
      return
    }

    setUpdating(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch(`/api/studio/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || 'تعذر تعديل عنوان المشروع.')
      }

      const updatedProject = (data?.project || null) as StudioProject | null

      setProject((currentProject) =>
        updatedProject
          ? updatedProject
          : currentProject
            ? {
                ...currentProject,
                title,
                updated_at: new Date().toISOString(),
              }
            : currentProject
      )

      setNewTitle(title)
      setEditingTitle(false)
      setSuccessMessage(data?.message || 'تم تعديل عنوان المشروع بنجاح.')
    } catch (updateError) {
      const message =
        updateError instanceof Error
          ? updateError.message
          : 'حدث خطأ غير متوقع أثناء تعديل المشروع.'

      console.error('Studio project update error:', updateError)
      setError(message)
    } finally {
      setUpdating(false)
    }
  }

  async function handleDeleteProject() {
    if (!project) {
      return
    }

    if (project.status !== 'draft') {
      setError('يمكن حذف المشاريع التي حالتها مسودة فقط.')
      return
    }

    const confirmed = window.confirm(
      'هل تريد حذف هذه المسودة نهائيًا؟ لا يمكن التراجع عن هذه الخطوة.'
    )

    if (!confirmed) {
      return
    }

    setDeleting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch(`/api/studio/projects/${project.id}`, {
        method: 'DELETE',
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || 'تعذر حذف المشروع.')
      }

      router.push('/studio')
      router.refresh()
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : 'حدث خطأ غير متوقع أثناء حذف المشروع.'

      console.error('Studio project delete error:', deleteError)
      setError(message)
    } finally {
      setDeleting(false)
    }
  }

  async function handleGenerateSummary() {
    if (!project) {
      return
    }

    const isRegeneration = Boolean(summary)

    const confirmed = window.confirm(
      isRegeneration
        ? 'يوجد ملخص محفوظ بالفعل. هل تريد إعادة توليده واستبدال النسخة الحالية؟'
        : 'هل تريد توليد ملخص الدرس لهذا المشروع الآن؟'
    )

    if (!confirmed) {
      return
    }

    setGenerating(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch(
        `/api/studio/projects/${project.id}/generate-summary`,
        { method: 'POST' }
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.error || 'تعذر توليد ملخص الدرس. حاول مرة أخرى لاحقًا.'
        )
      }

      setProject((currentProject) =>
        currentProject
          ? {
              ...currentProject,
              status: 'completed',
              updated_at: new Date().toISOString(),
            }
          : currentProject
      )

      if (data?.summary?.content) {
        setSummary(data.summary as StudioSummary)
      } else {
        await loadSummary()
      }

      setSuccessMessage(data?.message || 'تم توليد ملخص الدرس وحفظه بنجاح.')
    } catch (generateError) {
      const message =
        generateError instanceof Error
          ? generateError.message
          : 'حدث خطأ غير متوقع أثناء توليد ملخص الدرس.'

      console.error('Studio summary generation error:', generateError)
      setError(message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleGenerateQuiz() {
    if (!project) {
      return
    }

    const isRegeneration = Boolean(quiz)

    const confirmed = window.confirm(
      isRegeneration
        ? 'يوجد اختبار محفوظ بالفعل. هل تريد إعادة توليده واستبدال النسخة الحالية؟'
        : 'هل تريد توليد اختبار اختيار من متعدد لهذا المشروع الآن؟'
    )

    if (!confirmed) {
      return
    }

    setGenerating(true)
    setError(null)
    setSuccessMessage(null)
    setEditingQuiz(false)
    setDraftQuestions([])

    try {
      const response = await fetch(
        `/api/studio/projects/${project.id}/generate-quiz`,
        { method: 'POST' }
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.error || 'تعذر توليد الاختبار. حاول مرة أخرى لاحقًا.'
        )
      }

      setProject((currentProject) =>
        currentProject
          ? {
              ...currentProject,
              status: 'completed',
              updated_at: new Date().toISOString(),
            }
          : currentProject
      )

      const nextQuiz = normalizeQuiz(data?.quiz)

      if (nextQuiz) {
        setQuiz(nextQuiz)
      } else {
        await loadQuiz()
      }

      setSuccessMessage(data?.message || 'تم توليد الاختبار وحفظه بنجاح.')
    } catch (generateError) {
      const message =
        generateError instanceof Error
          ? generateError.message
          : 'حدث خطأ غير متوقع أثناء توليد الاختبار.'

      console.error('Studio quiz generation error:', generateError)
      setError(message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopySummary() {
    if (!summary?.content) {
      return
    }

    setCopying(true)
    setError(null)

    try {
      await navigator.clipboard.writeText(summary.content)
      setSuccessMessage('تم نسخ الملخص إلى الحافظة.')
    } catch (copyError) {
      console.error('Studio summary copy error:', copyError)
      setError('تعذر نسخ الملخص تلقائيًا. يمكنك تحديد النص ونسخه يدويًا.')
    } finally {
      setCopying(false)
    }
  }

  function handleStartQuizEditing() {
    if (!quiz?.questions?.length) {
      setError('لا يوجد اختبار محفوظ لتعديله.')
      return
    }

    setDraftQuestions(
      quiz.questions.map((question, index) => ({
        id: question.id || `q-${index + 1}`,
        question: question.question,
        options: [...question.options],
        correctAnswerIndex: question.correctAnswerIndex,
      }))
    )

    setEditingQuiz(true)
    setError(null)
    setSuccessMessage(null)

    window.setTimeout(() => {
      document
        .getElementById('studio-quiz-editor')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  function handleCancelQuizEditing() {
    setEditingQuiz(false)
    setDraftQuestions([])
    setError(null)
  }

  function updateDraftQuestionText(questionIndex: number, value: string) {
    setDraftQuestions((currentQuestions) =>
      currentQuestions.map((question, index) =>
        index === questionIndex
          ? { ...question, question: value }
          : question
      )
    )
  }

  function updateDraftOption(
    questionIndex: number,
    optionIndex: number,
    value: string
  ) {
    setDraftQuestions((currentQuestions) =>
      currentQuestions.map((question, index) => {
        if (index !== questionIndex) {
          return question
        }

        return {
          ...question,
          options: question.options.map((option, currentOptionIndex) =>
            currentOptionIndex === optionIndex ? value : option
          ),
        }
      })
    )
  }

  function setDraftCorrectAnswer(
    questionIndex: number,
    correctAnswerIndex: number
  ) {
    setDraftQuestions((currentQuestions) =>
      currentQuestions.map((question, index) =>
        index === questionIndex
          ? { ...question, correctAnswerIndex }
          : question
      )
    )
  }

  function handleMoveQuestion(questionIndex: number, direction: 'up' | 'down') {
    setDraftQuestions((currentQuestions) => {
      const targetIndex =
        direction === 'up' ? questionIndex - 1 : questionIndex + 1

      if (targetIndex < 0 || targetIndex >= currentQuestions.length) {
        return currentQuestions
      }

      const nextQuestions = [...currentQuestions]

      ;[nextQuestions[questionIndex], nextQuestions[targetIndex]] = [
        nextQuestions[targetIndex],
        nextQuestions[questionIndex],
      ]

      return nextQuestions
    })
  }

  function handleAddQuestion() {
    const nextNumber = draftQuestions.length + 1

    setDraftQuestions((currentQuestions) => [
      ...currentQuestions,
      {
        id: `q-${Date.now()}-${nextNumber}`,
        question: '',
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
      },
    ])
  }

  function handleDeleteQuestion(questionIndex: number) {
    if (draftQuestions.length <= 4) {
      setError('يجب أن يحتوي الاختبار على أربعة أسئلة على الأقل.')
      return
    }

    const confirmed = window.confirm(
      `هل تريد حذف السؤال رقم ${questionIndex + 1}؟`
    )

    if (!confirmed) {
      return
    }

    setDraftQuestions((currentQuestions) =>
      currentQuestions.filter((_, index) => index !== questionIndex)
    )
  }

  async function handleSaveQuizEdits() {
    if (!project || !quiz) {
      return
    }

    const questions = draftQuestions.map((question, index) => ({
      id: question.id || `q-${index + 1}`,
      question: question.question.trim(),
      options: question.options.map((option) => option.trim()),
      correctAnswerIndex: question.correctAnswerIndex,
    }))

    if (questions.length < 4) {
      setError('يجب أن يحتوي الاختبار على أربعة أسئلة على الأقل.')
      return
    }

    if (questions.length > 30) {
      setError('الحد الأقصى المسموح به هو 30 سؤالًا في الاختبار الواحد.')
      return
    }

    if (
      questions.some(
        (question) =>
          !question.question ||
          question.question.length < 8 ||
          question.options.length !== 4 ||
          question.options.some((option) => !option)
      )
    ) {
      setError('يجب كتابة نص كل سؤال وبدائله الأربعة قبل الحفظ.')
      return
    }

    if (
      questions.some(
        (question) =>
          !Number.isInteger(question.correctAnswerIndex) ||
          question.correctAnswerIndex < 0 ||
          question.correctAnswerIndex > 3
      )
    ) {
      setError('حدد إجابة صحيحة واحدة لكل سؤال قبل الحفظ.')
      return
    }

    const hasRepeatedOptions = questions.some((question) => {
      const normalizedOptions = question.options.map(normalizeArabic)
      return new Set(normalizedOptions).size !== normalizedOptions.length
    })

    if (hasRepeatedOptions) {
      setError('لا يمكن أن تتكرر البدائل داخل السؤال نفسه.')
      return
    }

    setSavingQuiz(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch(`/api/studio/projects/${project.id}/quiz`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questions }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || 'تعذر حفظ تعديلات الاختبار.')
      }

      const updatedQuiz = normalizeQuiz(data?.quiz)

      if (updatedQuiz) {
        setQuiz(updatedQuiz)
      } else {
        await loadQuiz()
      }

      setEditingQuiz(false)
      setDraftQuestions([])
      setSuccessMessage(data?.message || 'تم حفظ تعديلات الاختبار بنجاح.')
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : 'حدث خطأ غير متوقع أثناء حفظ الاختبار.'

      console.error('Studio quiz save error:', saveError)
      setError(message)
    } finally {
      setSavingQuiz(false)
    }
  }

  const panelStyle = {
    backgroundColor: APP.cardBg,
    borderRadius: BRAND.radiusLg,
    padding: BRAND.spaceMd,
    border: `1px solid ${APP.borderCol}`,
    boxShadow: APP.shadow,
  }

  const secondaryButtonStyle = {
    paddingInline: 17,
    paddingBlock: 9,
    borderRadius: BRAND.radiusPill,
    border: `1px solid ${APP.borderCol}`,
    cursor: 'pointer',
    backgroundColor: '#FFFFFF',
    color: APP.textCol,
    fontFamily: BRAND.fontBody,
    fontSize: 14,
    fontWeight: BRAND.weightSemibold,
  }

  const primaryButtonStyle = {
    paddingInline: 19,
    paddingBlock: 10,
    borderRadius: BRAND.radiusPill,
    border: 'none',
    cursor: generating ? 'not-allowed' : 'pointer',
    backgroundImage: APP.btnBlue,
    color: '#FFFFFF',
    fontFamily: BRAND.fontHeading,
    fontSize: 14,
    fontWeight: BRAND.weightBold,
    boxShadow: APP.btnGlow,
    opacity: generating ? 0.7 : 1,
  }

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box' as const,
    padding: '10px 12px',
    borderRadius: BRAND.radiusMd,
    border: `1px solid ${APP.borderCol}`,
    outline: 'none',
    backgroundColor: '#FFFFFF',
    color: APP.textCol,
    fontFamily: BRAND.fontBody,
    fontSize: 14,
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        style={{
          minHeight: '100vh',
          backgroundColor: APP.bg,
          padding: BRAND.spaceLg,
          fontFamily: BRAND.fontBody,
          color: APP.textCol,
        }}
      >
        <div style={{ maxWidth: 850, marginInline: 'auto' }}>
          <p style={{ color: APP.subCol, fontSize: 15 }}>
            جارٍ تحميل بيانات المشروع...
          </p>
        </div>
      </main>
    )
  }

  if (!project) {
    return (
      <main
        dir="rtl"
        style={{
          minHeight: '100vh',
          backgroundColor: APP.bg,
          padding: BRAND.spaceLg,
          fontFamily: BRAND.fontBody,
          color: APP.textCol,
        }}
      >
        <div style={{ maxWidth: 850, marginInline: 'auto' }}>
          <div style={panelStyle}>
            <p
              style={{
                margin: 0,
                color: '#C53030',
                fontSize: 14,
                lineHeight: 1.9,
              }}
            >
              {error || 'لم يتم العثور على هذا المشروع.'}
            </p>

            <button
              type="button"
              onClick={() => router.push('/studio')}
              style={{ ...secondaryButtonStyle, marginTop: 15 }}
            >
              العودة إلى الاستديو
            </button>
          </div>
        </div>
      </main>
    )
  }

  const status = getStatusConfig(project.status)
  const isSummaryProject = project.output_type === 'lesson_summary'
  const isQuizProject = project.output_type === 'mcq_quiz'

  return (
    <main
      dir="rtl"
      style={{
        minHeight: '100vh',
        backgroundColor: APP.bg,
        padding: BRAND.spaceLg,
        fontFamily: BRAND.fontBody,
        color: APP.textCol,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 850,
          marginInline: 'auto',
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: BRAND.spaceMd,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                color: APP.textCol,
                fontFamily: BRAND.fontHeading,
                fontSize: 27,
                fontWeight: BRAND.weightBold,
              }}
            >
              {project.title || 'مشروع بدون عنوان'}
            </h1>

            <p
              style={{
                margin: '8px 0 0',
                maxWidth: 650,
                color: APP.subCol,
                fontSize: 14,
                lineHeight: 1.9,
              }}
            >
              تفاصيل مشروع الاستديو ونتيجته التعليمية، مع إمكانية تعديل العنوان
              وإعادة التوليد عند الحاجة.
            </p>
          </div>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingInline: 12,
              paddingBlock: 6,
              borderRadius: BRAND.radiusPill,
              backgroundColor: status.background,
              color: status.color,
              fontSize: 13,
              fontWeight: BRAND.weightSemibold,
              whiteSpace: 'nowrap',
            }}
          >
            {status.label}
          </span>
        </header>

        <section style={{ ...panelStyle, marginBottom: BRAND.spaceMd }}>
          <h2
            style={{
              margin: '0 0 14px',
              color: APP.textCol,
              fontFamily: BRAND.fontHeading,
              fontSize: 19,
              fontWeight: BRAND.weightBold,
            }}
          >
            بيانات المشروع
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 14,
              fontSize: 14,
              lineHeight: 1.8,
            }}
          >
            <div>
              <strong>عنوان المشروع:</strong>

              {editingTitle ? (
                <div style={{ marginTop: 8 }}>
                  <input
                    type="text"
                    value={newTitle}
                    disabled={updating}
                    onChange={(event) => setNewTitle(event.target.value)}
                    placeholder="اكتب العنوان الجديد للمشروع"
                    style={inputStyle}
                  />

                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                      marginTop: 9,
                    }}
                  >
                    <button
                      type="button"
                      disabled={updating}
                      onClick={handleUpdateTitle}
                      style={{
                        paddingInline: 14,
                        paddingBlock: 8,
                        borderRadius: BRAND.radiusPill,
                        border: 'none',
                        cursor: updating ? 'not-allowed' : 'pointer',
                        backgroundImage: APP.btnBlue,
                        color: '#FFFFFF',
                        fontFamily: BRAND.fontBody,
                        fontSize: 13,
                        fontWeight: BRAND.weightSemibold,
                        opacity: updating ? 0.7 : 1,
                      }}
                    >
                      {updating ? 'جارٍ الحفظ...' : 'حفظ التعديل'}
                    </button>

                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => {
                        setEditingTitle(false)
                        setNewTitle(project.title || '')
                      }}
                      style={{
                        ...secondaryButtonStyle,
                        paddingInline: 14,
                        paddingBlock: 8,
                        opacity: updating ? 0.7 : 1,
                      }}
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 4 }}>
                  <span>{project.title || 'لم يتم تحديد عنوان بعد.'}</span>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingTitle(true)
                      setNewTitle(project.title || '')
                      setError(null)
                      setSuccessMessage(null)
                    }}
                    style={{
                      marginInlineStart: 9,
                      paddingInline: 10,
                      paddingBlock: 4,
                      borderRadius: BRAND.radiusPill,
                      border: `1px solid ${APP.borderCol}`,
                      cursor: 'pointer',
                      backgroundColor: '#FFFFFF',
                      color: APP.textCol,
                      fontFamily: BRAND.fontBody,
                      fontSize: 12,
                    }}
                  >
                    تعديل العنوان
                  </button>
                </div>
              )}
            </div>

            <div>
              <strong>نوع الناتج:</strong>
              <div style={{ marginTop: 4 }}>
                {getOutputTypeLabel(project.output_type)}
              </div>
            </div>

            <div>
              <strong>نوع المادة:</strong>
              <div style={{ marginTop: 4 }}>
                {getSourceTypeLabel(project.source_type)}
              </div>
            </div>

            <div>
              <strong>تاريخ الإنشاء:</strong>
              <div style={{ marginTop: 4 }}>
                {formatArabicDate(project.created_at)}
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div
            role="alert"
            style={{
              ...panelStyle,
              marginBottom: BRAND.spaceSm,
              border: '1px solid #FEB2B2',
              backgroundColor: '#FFF5F5',
              color: '#9B2C2C',
              boxShadow: 'none',
              fontSize: 14,
              lineHeight: 1.8,
            }}
          >
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div
            style={{
              ...panelStyle,
              marginBottom: BRAND.spaceSm,
              border: '1px solid #9AE6B4',
              backgroundColor: '#F0FFF4',
              color: '#276749',
              boxShadow: 'none',
              fontSize: 14,
              lineHeight: 1.8,
            }}
          >
            {successMessage}
          </div>
        ) : null}

        {isSummaryProject ? (
          <section style={{ ...panelStyle, marginBottom: BRAND.spaceMd }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
                flexWrap: 'wrap',
                marginBottom: 14,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: APP.textCol,
                    fontFamily: BRAND.fontHeading,
                    fontSize: 20,
                    fontWeight: BRAND.weightBold,
                  }}
                >
                  ملخص الدرس
                </h2>

                <p
                  style={{
                    margin: '6px 0 0',
                    color: APP.subCol,
                    fontSize: 13,
                    lineHeight: 1.8,
                  }}
                >
                  {summary
                    ? `آخر تحديث: ${formatArabicDate(summary.updated_at)}`
                    : 'لم يتم حفظ ملخص لهذا المشروع بعد.'}
                </p>
              </div>

              {summary?.content ? (
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    disabled={copying}
                    onClick={handleCopySummary}
                    style={{
                      ...secondaryButtonStyle,
                      opacity: copying ? 0.7 : 1,
                      cursor: copying ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {copying ? 'جارٍ النسخ...' : 'نسخ الملخص'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.open(
                        `/api/studio/projects/${project.id}/summary/download`,
                        '_blank',
                        'noopener,noreferrer'
                      )
                    }}
                    style={secondaryButtonStyle}
                  >
                    تنزيل Word
                  </button>
                </div>
              ) : null}
            </div>

            {loadingSummary ? (
              <p
                style={{
                  margin: 0,
                  color: APP.subCol,
                  fontSize: 14,
                }}
              >
                جارٍ تحميل الملخص المحفوظ...
              </p>
            ) : summary?.content ? (
              <article
                style={{
                  whiteSpace: 'pre-wrap',
                  borderRadius: BRAND.radiusMd,
                  border: `1px solid ${APP.borderCol}`,
                  backgroundColor: '#FFFFFF',
                  padding: 18,
                  color: APP.textCol,
                  fontSize: 15,
                  lineHeight: 2,
                }}
              >
                {summary.content}
              </article>
            ) : (
              <div
                style={{
                  padding: 18,
                  borderRadius: BRAND.radiusMd,
                  border: `1px dashed ${APP.borderCol}`,
                  color: APP.subCol,
                  fontSize: 14,
                  lineHeight: 1.9,
                }}
              >
                لم يُنشأ ملخص محفوظ بعد. استخدم زر «توليد ملخص الدرس» لبدء
                التوليد وحفظ النتيجة في المشروع.
              </div>
            )}
          </section>
        ) : null}

        {isQuizProject ? (
          <section
            id="studio-quiz-editor"
            style={{ ...panelStyle, marginBottom: BRAND.spaceMd }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
                flexWrap: 'wrap',
                marginBottom: 14,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: APP.textCol,
                    fontFamily: BRAND.fontHeading,
                    fontSize: 20,
                    fontWeight: BRAND.weightBold,
                  }}
                >
                  اختبار اختيار من متعدد
                </h2>

                <p
                  style={{
                    margin: '6px 0 0',
                    color: APP.subCol,
                    fontSize: 13,
                    lineHeight: 1.8,
                  }}
                >
                  {quiz
                    ? `${quiz.questions.length} أسئلة • آخر تحديث: ${formatArabicDate(
                        quiz.updated_at
                      )}`
                    : 'لم يتم حفظ اختبار لهذا المشروع بعد.'}
                </p>
              </div>

              {quiz?.questions?.length && !editingQuiz ? (
                <button
                  type="button"
                  onClick={handleStartQuizEditing}
                  style={secondaryButtonStyle}
                >
                  تعديل الاختبار
                </button>
              ) : null}
            </div>

            {editingQuiz ? (
              <div style={{ display: 'grid', gap: 16 }}>
                <div
                  style={{
                    padding: '11px 13px',
                    borderRadius: BRAND.radiusMd,
                    border: '1px solid #BFDBFE',
                    backgroundColor: '#EFF6FF',
                    color: '#1D4ED8',
                    fontSize: 13,
                    lineHeight: 1.8,
                  }}
                >
                  عدّل نص السؤال والبدائل، وحدد البديل الصحيح بالنقر عليه.
                  يُميَّز البديل الصحيح باللون الأخضر فقط، ويمكنك إضافة الأسئلة
                  أو حذفها أو إعادة ترتيبها قبل حفظ الاختبار.
                </div>

                {draftQuestions.map((question, questionIndex) => (
                  <article
                    key={question.id || `draft-question-${questionIndex}`}
                    style={{
                      borderRadius: BRAND.radiusMd,
                      border: `1px solid ${APP.borderCol}`,
                      backgroundColor: '#FFFFFF',
                      padding: 18,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        flexWrap: 'wrap',
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        <strong
                          style={{
                            color: APP.textCol,
                            fontFamily: BRAND.fontHeading,
                            fontSize: 15,
                          }}
                        >
                          السؤال {questionIndex + 1}
                        </strong>

                        <button
                          type="button"
                          disabled={savingQuiz || questionIndex === 0}
                          onClick={() =>
                            handleMoveQuestion(questionIndex, 'up')
                          }
                          aria-label={`نقل السؤال ${questionIndex + 1} إلى الأعلى`}
                          title="نقل إلى الأعلى"
                          style={{
                            minWidth: 36,
                            minHeight: 36,
                            paddingInline: 10,
                            paddingBlock: 6,
                            borderRadius: BRAND.radiusPill,
                            border: `1px solid ${APP.borderCol}`,
                            cursor:
                              savingQuiz || questionIndex === 0
                                ? 'not-allowed'
                                : 'pointer',
                            backgroundColor: '#FFFFFF',
                            color: APP.textCol,
                            fontFamily: BRAND.fontBody,
                            fontSize: 16,
                            fontWeight: BRAND.weightBold,
                            opacity:
                              savingQuiz || questionIndex === 0 ? 0.5 : 1,
                          }}
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          disabled={
                            savingQuiz ||
                            questionIndex === draftQuestions.length - 1
                          }
                          onClick={() =>
                            handleMoveQuestion(questionIndex, 'down')
                          }
                          aria-label={`نقل السؤال ${questionIndex + 1} إلى الأسفل`}
                          title="نقل إلى الأسفل"
                          style={{
                            minWidth: 36,
                            minHeight: 36,
                            paddingInline: 10,
                            paddingBlock: 6,
                            borderRadius: BRAND.radiusPill,
                            border: `1px solid ${APP.borderCol}`,
                            cursor:
                              savingQuiz ||
                              questionIndex === draftQuestions.length - 1
                                ? 'not-allowed'
                                : 'pointer',
                            backgroundColor: '#FFFFFF',
                            color: APP.textCol,
                            fontFamily: BRAND.fontBody,
                            fontSize: 16,
                            fontWeight: BRAND.weightBold,
                            opacity:
                              savingQuiz ||
                              questionIndex === draftQuestions.length - 1
                                ? 0.5
                                : 1,
                          }}
                        >
                          ↓
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={savingQuiz || draftQuestions.length <= 4}
                        onClick={() => handleDeleteQuestion(questionIndex)}
                        style={{
                          paddingInline: 12,
                          paddingBlock: 7,
                          borderRadius: BRAND.radiusPill,
                          border: '1px solid #FCA5A5',
                          backgroundColor: '#FFF5F5',
                          color: '#B91C1C',
                          cursor:
                            savingQuiz || draftQuestions.length <= 4
                              ? 'not-allowed'
                              : 'pointer',
                          fontFamily: BRAND.fontBody,
                          fontSize: 12,
                          fontWeight: BRAND.weightSemibold,
                          opacity:
                            savingQuiz || draftQuestions.length <= 4
                              ? 0.55
                              : 1,
                        }}
                      >
                        حذف السؤال
                      </button>
                    </div>

                    <label
                      style={{
                        display: 'block',
                        color: APP.textCol,
                        fontFamily: BRAND.fontHeading,
                        fontSize: 15,
                        fontWeight: BRAND.weightBold,
                        lineHeight: 1.8,
                      }}
                    >
                      نص السؤال
                      <textarea
                        value={question.question}
                        disabled={savingQuiz}
                        onChange={(event) =>
                          updateDraftQuestionText(
                            questionIndex,
                            event.target.value
                          )
                        }
                        rows={3}
                        style={{
                          ...inputStyle,
                          marginTop: 8,
                          resize: 'vertical',
                          lineHeight: 1.8,
                        }}
                      />
                    </label>

                    <div
                      style={{
                        display: 'grid',
                        gap: 10,
                        marginTop: 14,
                      }}
                    >
                      {question.options.map((option, optionIndex) => {
                        const isCorrect =
                          optionIndex === question.correctAnswerIndex

                        return (
                          <div
                            key={`${question.id}-${optionIndex}`}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'auto minmax(0, 1fr)',
                              alignItems: 'center',
                              gap: 9,
                              borderRadius: BRAND.radiusMd,
                              border: `1px solid ${
                                isCorrect ? '#86EFAC' : APP.borderCol
                              }`,
                              backgroundColor: isCorrect
                                ? '#F0FFF4'
                                : '#FFFFFF',
                              padding: '10px',
                            }}
                          >
                            <button
                              type="button"
                              disabled={savingQuiz}
                              onClick={() =>
                                setDraftCorrectAnswer(
                                  questionIndex,
                                  optionIndex
                                )
                              }
                              style={{
                                paddingInline: 10,
                                paddingBlock: 7,
                                borderRadius: BRAND.radiusPill,
                                border: `1px solid ${
                                  isCorrect ? '#22C55E' : APP.borderCol
                                }`,
                                cursor: savingQuiz
                                  ? 'not-allowed'
                                  : 'pointer',
                                backgroundColor: isCorrect
                                  ? '#DCFCE7'
                                  : '#FFFFFF',
                                color: isCorrect ? '#166534' : APP.subCol,
                                fontFamily: BRAND.fontBody,
                                fontSize: 12,
                                fontWeight: BRAND.weightSemibold,
                                whiteSpace: 'nowrap',
                                opacity: savingQuiz ? 0.7 : 1,
                              }}
                            >
                              تعيين كإجابة صحيحة
                            </button>

                            <label style={{ minWidth: 0 }}>
                              <input
                                type="text"
                                value={option}
                                disabled={savingQuiz}
                                onChange={(event) =>
                                  updateDraftOption(
                                    questionIndex,
                                    optionIndex,
                                    event.target.value
                                  )
                                }
                                style={{
                                  ...inputStyle,
                                  border: `1px solid ${
                                    isCorrect ? '#86EFAC' : APP.borderCol
                                  }`,
                                }}
                              />
                            </label>
                          </div>
                        )
                      })}
                    </div>
                  </article>
                ))}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    disabled={savingQuiz}
                    onClick={handleAddQuestion}
                    style={{
                      ...secondaryButtonStyle,
                      cursor: savingQuiz ? 'not-allowed' : 'pointer',
                      opacity: savingQuiz ? 0.7 : 1,
                    }}
                  >
                    إضافة سؤال
                  </button>

                  <button
                    type="button"
                    disabled={savingQuiz}
                    onClick={handleSaveQuizEdits}
                    style={{
                      ...primaryButtonStyle,
                      cursor: savingQuiz ? 'not-allowed' : 'pointer',
                      opacity: savingQuiz ? 0.7 : 1,
                    }}
                  >
                    {savingQuiz ? 'جارٍ حفظ التعديلات...' : 'حفظ التعديلات'}
                  </button>

                  <button
                    type="button"
                    disabled={savingQuiz}
                    onClick={handleCancelQuizEditing}
                    style={{
                      ...secondaryButtonStyle,
                      cursor: savingQuiz ? 'not-allowed' : 'pointer',
                      opacity: savingQuiz ? 0.7 : 1,
                    }}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : loadingQuiz ? (
              <p
                style={{
                  margin: 0,
                  color: APP.subCol,
                  fontSize: 14,
                }}
              >
                جارٍ تحميل الاختبار المحفوظ...
              </p>
            ) : quiz?.questions?.length ? (
              <div style={{ display: 'grid', gap: 14 }}>
                {quiz.questions.map((question, questionIndex) => (
                  <article
                    key={question.id || `question-${questionIndex}`}
                    style={{
                      borderRadius: BRAND.radiusMd,
                      border: `1px solid ${APP.borderCol}`,
                      backgroundColor: '#FFFFFF',
                      padding: 18,
                    }}
                  >
                    <h3
                      style={{
                        margin: '0 0 14px',
                        color: APP.textCol,
                        fontFamily: BRAND.fontHeading,
                        fontSize: 16,
                        lineHeight: 1.9,
                      }}
                    >
                      {questionIndex + 1}. {question.question}
                    </h3>

                    <div style={{ display: 'grid', gap: 9 }}>
                      {question.options.map((option, optionIndex) => {
                        const isCorrect =
                          optionIndex === question.correctAnswerIndex

                        return (
                          <div
                            key={`${question.id}-${optionIndex}`}
                            style={{
                              borderRadius: BRAND.radiusMd,
                              border: `1px solid ${
                                isCorrect ? '#86EFAC' : APP.borderCol
                              }`,
                              backgroundColor: isCorrect
                                ? '#F0FFF4'
                                : '#FFFFFF',
                              color: isCorrect ? '#166534' : APP.textCol,
                              padding: '10px 12px',
                              fontSize: 14,
                              lineHeight: 1.8,
                            }}
                          >
                            <strong
                              style={{
                                marginInlineEnd: 7,
                                color: isCorrect ? '#166534' : APP.subCol,
                              }}
                            >
                              {String.fromCharCode(65 + optionIndex)}.
                            </strong>
                            {option}
                          </div>
                        )
                      })}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: 18,
                  borderRadius: BRAND.radiusMd,
                  border: `1px dashed ${APP.borderCol}`,
                  color: APP.subCol,
                  fontSize: 14,
                  lineHeight: 1.9,
                }}
              >
                لم يُنشأ اختبار محفوظ بعد. استخدم زر «توليد الاختبار» لبدء
                التوليد وحفظ الأسئلة في المشروع.
              </div>
            )}
          </section>
        ) : null}

        {!isSummaryProject && !isQuizProject ? (
          <section style={{ ...panelStyle, marginBottom: BRAND.spaceMd }}>
            <h2
              style={{
                margin: 0,
                color: APP.textCol,
                fontFamily: BRAND.fontHeading,
                fontSize: 20,
                fontWeight: BRAND.weightBold,
              }}
            >
              الناتج التعليمي
            </h2>

            <p
              style={{
                margin: '10px 0 0',
                color: APP.subCol,
                fontSize: 14,
                lineHeight: 1.9,
              }}
            >
              هذا النوع من المشاريع سيُفعّل في المرحلة التالية من تطوير مِداد
              استديو.
            </p>
          </section>
        ) : null}

        <section
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => router.push('/studio')}
              style={secondaryButtonStyle}
            >
              العودة إلى الاستديو
            </button>

            {project.status === 'draft' ? (
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteProject}
                style={{
                  paddingInline: 18,
                  paddingBlock: 9,
                  borderRadius: BRAND.radiusPill,
                  border: 'none',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  backgroundColor: '#E53E3E',
                  color: '#FFFFFF',
                  fontFamily: BRAND.fontBody,
                  fontSize: 14,
                  fontWeight: BRAND.weightSemibold,
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? 'جارٍ الحذف...' : 'حذف المسودة'}
              </button>
            ) : null}

            {isSummaryProject ? (
              <button
                type="button"
                disabled={generating}
                onClick={handleGenerateSummary}
                style={primaryButtonStyle}
              >
                {generating
                  ? 'جارٍ توليد الملخص...'
                  : summary
                    ? 'إعادة توليد الملخص'
                    : 'توليد ملخص الدرس'}
              </button>
            ) : null}

            {isQuizProject && quiz?.questions?.length && !editingQuiz ? (
              <button
                type="button"
                onClick={handleStartQuizEditing}
                style={secondaryButtonStyle}
              >
                تعديل الاختبار
              </button>
            ) : null}

            {isQuizProject ? (
              <button
                type="button"
                disabled={generating}
                onClick={handleGenerateQuiz}
                style={primaryButtonStyle}
              >
                {generating
                  ? 'جارٍ توليد الاختبار...'
                  : quiz
                    ? 'إعادة توليد الاختبار'
                    : 'توليد الاختبار'}
              </button>
            ) : null}
          </div>

          <p
            style={{
              margin: 0,
              maxWidth: 310,
              color: BRAND.muted,
              fontSize: 12,
              lineHeight: 1.8,
              textAlign: 'left',
            }}
          >
            تستطيع إعادة التوليد عند الحاجة، وتُحفظ النسخة الجديدة بدل النسخة
            السابقة للمشروع نفسه.
          </p>
        </section>
      </div>
    </main>
  )
}