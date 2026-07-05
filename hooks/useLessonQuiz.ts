import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { QuizQuestion } from '@/types/lesson-quiz'

type UseLessonQuizParams = {
  lessonId: string
  lessonName: string
  lessonContent?: string | null
  grade?: string | null
}

export function useLessonQuiz({ lessonId, lessonName, lessonContent, grade }: UseLessonQuizParams) {
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState('')
  const [hasExisting, setHasExisting] = useState(false)

  // ── تحميل الاختبار الحالي للدرس (إن وجد) — قراءة عامة بلا توكن ──
  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`/api/lessons/${lessonId}/quiz`)
        const data = await res.json().catch(() => null)
        if (!mounted) return

        if (data?.quiz) {
          setTitle(data.quiz.title || '')
          setQuestions(data.quiz.questions || [])
          setHasExisting(true)
        }
      } catch {
        // تجاهل — يبدأ المدير بنموذج فارغ
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [lessonId])

  async function getAccessToken(): Promise<string | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  // ── توليد تلقائي بالذكاء الاصطناعي — يستدعي /api/quiz العام الموجود فعلاً ──
  // ── جديد: نمرّر lessonId دائماً — إن كان lessonContent فارغاً (شائع
  // الآن لدروس اللغة العربية التي تخزّن محتواها في ملف "فهم واستيعاب"
  // المرفوع بدل حقل content القديم)، يجلب الخادم النص المستخرَج من
  // الملف تلقائياً بدل الاعتماد على معرفة الذكاء الاصطناعي العامة ────
  async function generate(count = 8) {
    setGenerating(true)
    setMessage('')
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          lessonName,
          material: lessonContent || '',
          grade: grade || '',
          count,
        }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.quiz) {
        throw new Error(data?.error || 'فشل توليد الاختبار تلقائياً.')
      }

      setTitle(data.quiz.title || `اختبار: ${lessonName}`)
      setQuestions(Array.isArray(data.quiz.questions) ? data.quiz.questions : [])
      setMessage('✅ تم توليد الأسئلة — راجعها وعدّل ما تريد قبل الحفظ.')
    } catch (error: any) {
      setMessage(`❌ ${error?.message || 'حدث خطأ أثناء التوليد.'}`)
    } finally {
      setGenerating(false)
    }
  }

  function addBlankQuestion() {
    const nextId = questions.length ? Math.max(...questions.map(q => q.id)) + 1 : 1
    setQuestions(prev => [
      ...prev,
      {
        id: nextId,
        type: 'multiple',
        question: '',
        options: ['', '', '', ''],
        correct: 0,
        explanation: '',
      },
    ])
  }

  function updateQuestion(id: number, patch: Partial<QuizQuestion>) {
    setQuestions(prev => prev.map(q => (q.id === id ? { ...q, ...patch } : q)))
  }

  function removeQuestion(id: number) {
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  // ── حفظ (Upsert) — محمي، يحتاج توكن المدير ──
  async function save(): Promise<boolean> {
    setSaving(true)
    setMessage('')
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error('انتهت جلسة تسجيل الدخول. سجّل الدخول من جديد.')

      const res = await fetch(`/api/lessons/${lessonId}/quiz`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ title: title || null, questions }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'فشل حفظ الاختبار.')

      setHasExisting(true)
      setMessage('✅ تم حفظ اختبار الدرس بنجاح.')
      return true
    } catch (error: any) {
      setMessage(`❌ ${error?.message || 'حدث خطأ أثناء الحفظ.'}`)
      return false
    } finally {
      setSaving(false)
    }
  }

  // ── حذف — محمي، يحتاج توكن المدير ──
  async function remove(): Promise<boolean> {
    if (!hasExisting) return true
    setDeleting(true)
    setMessage('')
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error('انتهت جلسة تسجيل الدخول. سجّل الدخول من جديد.')

      const res = await fetch(`/api/lessons/${lessonId}/quiz`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'فشل حذف الاختبار.')

      setTitle('')
      setQuestions([])
      setHasExisting(false)
      setMessage('🗑️ تم حذف اختبار الدرس.')
      return true
    } catch (error: any) {
      setMessage(`❌ ${error?.message || 'حدث خطأ أثناء الحذف.'}`)
      return false
    } finally {
      setDeleting(false)
    }
  }

  return {
    title,
    setTitle,
    questions,
    loading,
    generating,
    saving,
    deleting,
    message,
    hasExisting,
    generate,
    addBlankQuestion,
    updateQuestion,
    removeQuestion,
    save,
    remove,
  }
}