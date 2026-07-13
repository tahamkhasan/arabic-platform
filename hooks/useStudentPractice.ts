'use client'
import { useState } from 'react'
import { ar } from '@/lib/constants/ar'
import type { User, Subject, Lesson, QuizData, FlashcardsData } from '@/types/student.types'

const c = ar.common

export function useStudentPractice(user: User | null, selSubject: Subject | null, selLesson: Lesson | null) {
  const [practiceTool, setPracticeTool] = useState('')
  const [practiceOutput, setPracticeOutput] = useState('')
  const [practiceLoading, setPracticeLoading] = useState(false)
  const [practiceError, setPracticeError] = useState('')

  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizError, setQuizError] = useState('')
  const [showQuiz, setShowQuiz] = useState(false)

  const [flashData, setFlashData] = useState<FlashcardsData | null>(null)
  const [flashLoading, setFlashLoading] = useState(false)
  const [flashError, setFlashError] = useState('')
  const [showFlash, setShowFlash] = useState(false)

  async function generateQuiz() {
    if (!user || !selLesson) return
    setQuizLoading(true)
    setQuizError('')
    setQuizData(null)
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonName: selLesson.name,
          material: selLesson.content ?? '',
          grade: selSubject?.grade ?? user.allowed_grades?.[0] ?? '',
          count: 8,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setQuizError(data.error || 'حدث خطأ')
        return
      }
      setQuizData(data.quiz)
      setShowQuiz(true)
    } catch {
      setQuizError('تعذّر الاتصال')
    } finally {
      setQuizLoading(false)
    }
  }

  async function generateFlashcards() {
    if (!user || !selLesson) return
    if (!selLesson.content?.trim()) {
      setFlashError('هذا الدرس لا يحتوي على مادة علمية')
      return
    }
    setFlashLoading(true)
    setFlashError('')
    setFlashData(null)
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonName: selLesson.name,
          material: selLesson.content,
          grade: selSubject?.grade ?? user.allowed_grades?.[0] ?? '',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFlashError(data.error || 'تعذّر إنشاء البطاقات')
        return
      }
      setFlashData(data.flashcards)
      setShowFlash(true)
    } catch {
      setFlashError('تعذّر الاتصال')
    } finally {
      setFlashLoading(false)
    }
  }

  async function handlePractice() {
    if (!user || !selLesson || !practiceTool) return

    if (practiceTool === 'quiz') {
      generateQuiz()
      return
    }

    if (practiceTool === 'flashcards') {
      generateFlashcards()
      return
    }

    setPracticeLoading(true)
    setPracticeOutput('')
    setPracticeError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          tool: practiceTool,
          grade: selSubject?.grade ?? user.allowed_grades?.[0] ?? '',
          stage: selSubject?.stage ?? user.allowed_stages?.[0] ?? '',
          prompt: selLesson.name,
          material: selLesson.content ?? '',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPracticeError(data.error || c.errors.generic)
        return
      }
      setPracticeOutput(data.result)
    } catch {
      setPracticeError(c.errors.connection)
    } finally {
      setPracticeLoading(false)
    }
  }

  function resetPractice() {
    setPracticeOutput('')
    setPracticeError('')
  }

  return {
    practiceTool,
    setPracticeTool,
    practiceOutput,
    practiceLoading,
    practiceError,
    quizData,
    quizLoading,
    quizError,
    showQuiz,
    setShowQuiz,
    flashData,
    flashLoading,
    flashError,
    showFlash,
    setShowFlash,
    handlePractice,
    resetPractice,
  }
}