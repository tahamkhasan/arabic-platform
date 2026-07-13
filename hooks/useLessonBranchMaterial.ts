'use client'
import { useCallback, useEffect, useState } from 'react'
import type { Lesson } from '@/types/dashboard.types'
import { LESSON_BRANCHES, type BranchKey } from '@/lib/dashboard/lessonBranches'

export function useLessonBranchMaterial(selLesson: Lesson | null, selectedBranch: BranchKey) {
  const [material, setMaterial] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [skippedFiles, setSkippedFiles] = useState<string[]>([])

  const fetchBranchMaterial = useCallback(async () => {
    setError('')
    setSkippedFiles([])

    if (!selLesson) {
      setMaterial('')
      return
    }

    if (selectedBranch === 'general') {
      setMaterial(selLesson.content ?? '')
      return
    }

    const branch = LESSON_BRANCHES.find(b => b.key === selectedBranch)
    if (!branch?.urlsField) {
      setMaterial(selLesson.content ?? '')
      return
    }

    const urls: string[] = (selLesson as any)[branch.urlsField] ?? []
    const namesField = branch.urlsField.replace('_urls', '_names')
    const names: string[] = (selLesson as any)[namesField] ?? []

    if (urls.length === 0) {
      setMaterial('')
      setError('لا توجد ملفات مرفوعة لهذا الفرع بعد.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/extract-lesson-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, names }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'تعذّر استخراج نص هذا الفرع.')
        setMaterial('')
        return
      }

      setMaterial(data?.text ?? '')
      setSkippedFiles(data?.skipped ?? [])
    } catch {
      setError('تعذّر الاتصال بالخادم لاستخراج نص الفرع.')
      setMaterial('')
    } finally {
      setLoading(false)
    }
  }, [selLesson, selectedBranch])

  useEffect(() => {
    fetchBranchMaterial()
  }, [fetchBranchMaterial])

  return { material, loading, error, skippedFiles, refetch: fetchBranchMaterial }
}