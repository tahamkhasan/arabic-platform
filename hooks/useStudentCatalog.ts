'use client'
import { useEffect, useState } from 'react'
import type { User, Subject, Unit, Lesson } from '@/types/student.types'

export function useStudentCatalog(user: User | null) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selSubject, setSelSubject] = useState<Subject | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [selUnit, setSelUnit] = useState<Unit | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selLesson, setSelLesson] = useState<Lesson | null>(null)
  const [activeSemesters, setActiveSemesters] = useState({
    semester_1_active: true,
    semester_2_active: true,
  })

  useEffect(() => {
    if (!user) return
    fetch(`/api/students/${user.id}/subjects`)
      .then(r => r.json())
      .then(d => setSubjects(d.subjects ?? []))
      .catch(() => setSubjects([]))
  }, [user])

  useEffect(() => {
    fetch('/api/platform-settings/semesters')
      .then(r => r.json())
      .then(d =>
        setActiveSemesters({
          semester_1_active: d.semester_1_active !== false,
          semester_2_active: d.semester_2_active !== false,
        }),
      )
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selSubject) {
      setUnits([])
      setSelUnit(null)
      return
    }
    fetch(`/api/units?subjectId=${selSubject.id}`)
      .then(r => r.json())
      .then(d => {
        const allUnits = d.units ?? []
        const visible = allUnits.filter((u: any) => {
          const sem = u.semester === 2 ? 2 : 1
          return sem === 1 ? activeSemesters.semester_1_active : activeSemesters.semester_2_active
        })
        setUnits(visible)
      })
      .catch(() => setUnits([]))
  }, [selSubject, activeSemesters])

  useEffect(() => {
    if (!selUnit) {
      setLessons([])
      setSelLesson(null)
      return
    }
    fetch(`/api/lessons?unitId=${selUnit.id}`)
      .then(r => r.json())
      .then(d => setLessons(d.lessons ?? []))
      .catch(() => setLessons([]))
  }, [selUnit])

  return {
    subjects,
    selSubject,
    setSelSubject,
    units,
    selUnit,
    setSelUnit,
    lessons,
    selLesson,
    setSelLesson,
    activeSemesters,
  }
}