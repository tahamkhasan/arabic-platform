import { useState, useEffect, useCallback } from 'react'
import type { CurriculumResponse } from '@/types/curriculum'

export function useCurriculum(subjectId: string) {
  const [data, setData] = useState<CurriculumResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`/api/subjects/${subjectId}/curriculum`)
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'فشل تحميل المنهج.')
      setData(json)
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء تحميل المنهج.')
    } finally {
      setLoading(false)
    }
  }, [subjectId])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, reload: load }
}