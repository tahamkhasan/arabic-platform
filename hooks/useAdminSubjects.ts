'use client'
import { useEffect, useMemo, useState } from 'react'
import type { Subject, SubjectOccurrence } from '@/types/admin.types'
import { GRADES_BY_STAGE, type StageKey } from '@/lib/constants/stages'

function stageForLegacyGrade(grade?: string | null): StageKey | null {
  if (!grade) return null
  for (const stage of Object.keys(GRADES_BY_STAGE) as StageKey[]) {
    if (GRADES_BY_STAGE[stage].some(g => g.id === String(grade).trim())) return stage
  }
  return null
}

export function useAdminSubjects(params: { authorized: boolean; admin: any }) {
  const { authorized, admin } = params
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [activeStageTab, setActiveStageTab] = useState<StageKey>('primary')
  const [activeGrade, setActiveGrade] = useState<string | null>(null)
  const [activeTrack, setActiveTrack] = useState<'scientific' | 'literary' | null>(null)

  useEffect(() => {
    if (!authorized || !admin) return
    fetch('/api/subjects')
      .then(r => r.json())
      .then(d => setSubjects(d.subjects ?? []))
      .catch(() => {})
  }, [authorized, admin])

  const occurrencesByStage = useMemo(() => {
    const map: Record<StageKey, SubjectOccurrence[]> = { primary: [], middle: [], secondary: [] }

    for (const s of subjects) {
      const offerings = Array.isArray(s.offerings) ? s.offerings : []

      if (offerings.length > 0) {
        for (const o of offerings) {
          const stage = o.stage as StageKey
          if (map[stage]) map[stage].push({ subject: s, offering: o })
        }
      } else {
        const legacyStage = stageForLegacyGrade(s.grade)
        if (legacyStage && s.grade) {
          map[legacyStage].push({
            subject: s,
            offering: { stage: legacyStage, grade: String(s.grade).trim(), track: null },
            isLegacy: true,
          })
        }
      }
    }

    return map
  }, [subjects])

  const unassignedSubjects = useMemo(
    () =>
      subjects.filter(
        s => (!Array.isArray(s.offerings) || s.offerings.length === 0) && !stageForLegacyGrade(s.grade),
      ),
    [subjects],
  )

  return {
    subjects,
    occurrencesByStage,
    unassignedSubjects,
    activeStageTab,
    setActiveStageTab,
    activeGrade,
    setActiveGrade,
    activeTrack,
    setActiveTrack,
  }
}