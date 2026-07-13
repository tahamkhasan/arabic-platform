'use client'
import { useEffect, useState } from 'react'
import type { User, Subject, Unit, Lesson, Exam } from '@/types/dashboard.types'

export function useDashboardCatalog(params: {
  user: User | null
  tool: string
  selSubject: Subject | null
  selUnit: Unit | null
  examType: 'short' | 'final'
}) {
  const { user, tool, selSubject, selUnit, examType } = params

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [exams, setExams] = useState<Exam[]>([])

  useEffect(() => {
    if (!user) {
      setSubjects([])
      return
    }

    const url = user.role === 'admin' ? '/api/subjects' : `/api/subjects?teacherId=${user.id}`

    fetch(url)
      .then(r => r.json())
      .then(d => setSubjects(d.subjects ?? []))
      .catch(console.error)
  }, [user])

  useEffect(() => {
    if (!selSubject) {
      setUnits([])
      return
    }

    fetch(`/api/units?subjectId=${selSubject.id}`)
      .then(r => r.json())
      .then(d => setUnits(d.units ?? []))
      .catch(console.error)
  }, [selSubject])

  useEffect(() => {
    if (!selUnit) {
      setLessons([])
      return
    }

    fetch(`/api/lessons?unitId=${selUnit.id}`)
      .then(r => r.json())
      .then(d => setLessons(d.lessons ?? []))
      .catch(console.error)
  }, [selUnit])

  useEffect(() => {
    if (tool !== 'exam' || !selSubject) {
      setExams([])
      return
    }

    fetch(`/api/exams?subjectId=${selSubject.id}&type=${examType}`)
      .then(r => r.json())
      .then(d => setExams(d.exams ?? []))
      .catch(console.error)
  }, [tool, selSubject, examType])

  return { subjects, units, lessons, exams }
}