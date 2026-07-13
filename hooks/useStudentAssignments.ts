'use client'
import { useEffect, useState } from 'react'
import type { User, Assignment, QuizAvailable, Tab } from '@/types/student.types'

export function useStudentAssignments(user: User | null, accessToken: string, tab: Tab) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [openAssign, setOpenAssign] = useState<Assignment | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitDone, setSubmitDone] = useState(false)
  const [quizzesAvailable, setQuizzesAvailable] = useState<QuizAvailable[]>([])

  useEffect(() => {
    if (!user || tab !== 'assignments') return
    fetch(`/api/assignments?studentId=${user.id}`)
      .then(r => r.json())
      .then(d => setAssignments(d.assignments ?? []))
      .catch(() => setAssignments([]))
  }, [user, tab])

  useEffect(() => {
    if (!accessToken || tab !== 'assignments') return
    fetch('/api/quizzes/available', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(d => setQuizzesAvailable(d.quizzes ?? []))
      .catch(() => setQuizzesAvailable([]))
  }, [accessToken, tab])

  async function handleSubmitAssignment() {
    if (!user || !openAssign || !answerText.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/assignment-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: openAssign.id,
          studentId: user.id,
          answer: answerText,
        }),
      })
      if (res.ok) {
        setSubmitDone(true)
        setAssignments(prev => prev.map(a => (a.id === openAssign.id ? { ...a, submitted: true } : a)))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return {
    assignments,
    openAssign,
    setOpenAssign,
    answerText,
    setAnswerText,
    submitting,
    submitDone,
    setSubmitDone,
    quizzesAvailable,
    handleSubmitAssignment,
  }
}