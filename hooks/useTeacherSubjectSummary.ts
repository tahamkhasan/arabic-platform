'use client'
import { useEffect, useState } from 'react'

interface SubjectSummary {
  unitsCount: number
  lessonsCount: number
  loading: boolean
}

export function useTeacherSubjectSummary(subjectId: string | null): SubjectSummary {
  const [unitsCount, setUnitsCount] = useState(0)
  const [lessonsCount, setLessonsCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!subjectId) {
      setUnitsCount(0)
      setLessonsCount(0)
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all([
      fetch(`/api/units?subjectId=${subjectId}`).then(r => r.json()),
      fetch(`/api/lessons?subjectId=${subjectId}`).then(r => r.json()),
    ])
      .then(([unitsData, lessonsData]) => {
        if (cancelled) return
        setUnitsCount((unitsData?.units ?? []).length)
        setLessonsCount((lessonsData?.lessons ?? []).length)
      })
      .catch(() => {
        if (cancelled) return
        setUnitsCount(0)
        setLessonsCount(0)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [subjectId])

  return { unitsCount, lessonsCount, loading }
}