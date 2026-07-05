'use client'

import { useEffect, useState } from 'react'
import type { TeacherTab } from '../lib/teacher/teacher.types'

interface User {
  id: string
  name: string
  role: string
  usertype: string
  status?: string
  thememode?: string
  allowedstages?: string[]
}

interface Subject {
  id: string
  name: string
  icon?: string
  grade?: string
}

interface Student {
  id: string
  name: string
  email: string
  allowedgrades?: string[]
}

interface ScopeStudent {
  id: string
  name: string
  email: string
}

interface TeacherScopeGroup {
  scopeid: string
  stagelabel: string
  grade: string
  tracklabel: string | null
  subjectname: string | null
  students: ScopeStudent[]
}

interface InsightSignal {
  areatype: 'questiontype' | 'bloomlevel'
  areakey: string
  arealabel: string
  affectedcount: number
  affectedstudentnames: string[]
  avgaccuracy: number
}

interface ClassInsight {
  classid: string
  classname: string
  signals: InsightSignal[]
  strugglingstudents: {
    id: string
    name: string
    overallaccuracy: number | null
  }[]
}

interface UseTeacherBaseDataReturn {
  subjects: Subject[]
  students: Student[]
  insights: ClassInsight[]
  insightsDismissed: boolean
  setInsightsDismissed: React.Dispatch<React.SetStateAction<boolean>>
  scopeGroups: TeacherScopeGroup[]
  scopeGroupsLoading: boolean
}

function buildScopedStudents(scopes: TeacherScopeGroup[]): Student[] {
  const unique = new Map<string, Student>()

  for (const group of scopes) {
    for (const student of group.students ?? []) {
      const existing = unique.get(student.id)

      if (existing) {
        const currentGrades = existing.allowedgrades ?? []
        const nextGrades = group.grade
          ? Array.from(new Set([...currentGrades, group.grade]))
          : currentGrades

        unique.set(student.id, {
          ...existing,
          allowedgrades: nextGrades,
        })
      } else {
        unique.set(student.id, {
          id: student.id,
          name: student.name,
          email: student.email,
          allowedgrades: group.grade ? [group.grade] : [],
        })
      }
    }
  }

  return Array.from(unique.values())
}

export default function useTeacherBaseData(
  user: User | null,
  accessToken: string,
  tab?: TeacherTab,
): UseTeacherBaseDataReturn {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [insights, setInsights] = useState<ClassInsight[]>([])
  const [insightsDismissed, setInsightsDismissed] = useState(false)
  const [scopeGroups, setScopeGroups] = useState<TeacherScopeGroup[]>([])
  const [scopeGroupsLoading, setScopeGroupsLoading] = useState(false)

  useEffect(() => {
  if (!user?.id) {
    setSubjects([])
    return
  }

  let cancelled = false

  const params = new URLSearchParams()
  if (user.allowedstages?.length) {
    params.set('stages', user.allowedstages.join(','))
  }
  params.set('teacherId', user.id)

  fetch(`/api/subjects?${params.toString()}`)
  
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        setSubjects(d?.subjects ?? [])
      })
      .catch(() => {
        if (cancelled) return
        setSubjects([])
      })

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (!accessToken) {
      setInsights([])
      return
    }

    let cancelled = false

    fetch('/api/teachers/insights', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        setInsights(d?.data?.classes ?? d?.classes ?? [])
      })
      .catch(() => {
        if (cancelled) return
        setInsights([])
      })

    return () => {
      cancelled = true
    }
  }, [accessToken])

  useEffect(() => {
    if (!accessToken) {
      setScopeGroups([])
      setStudents([])
      setScopeGroupsLoading(false)
      return
    }

    let cancelled = false
    setScopeGroupsLoading(true)

    fetch('/api/teacher-scopes/students', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return

        const scopes: TeacherScopeGroup[] = d?.data?.scopes ?? d?.scopes ?? []
        setScopeGroups(scopes)
        setStudents(buildScopedStudents(scopes))
      })
      .catch(() => {
        if (cancelled) return
        setScopeGroups([])
        setStudents([])
      })
      .finally(() => {
        if (cancelled) return
        setScopeGroupsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [accessToken, tab])

  return {
    subjects,
    students,
    insights,
    insightsDismissed,
    setInsightsDismissed,
    scopeGroups,
    scopeGroupsLoading,
  }
}