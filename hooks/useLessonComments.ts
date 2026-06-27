import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { LessonCommentItem } from '@/types/lesson-comment'

export function useLessonComments(lessonId: string) {
  const [items, setItems] = useState<LessonCommentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  async function getAccessToken(): Promise<string | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error('انتهت جلسة تسجيل الدخول.')

      const res = await fetch(`/api/lessons/${lessonId}/comments`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'فشل تحميل التعليقات.')

      setItems(data?.items || [])
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء تحميل التعليقات.')
    } finally {
      setLoading(false)
    }
  }, [lessonId])

  useEffect(() => {
    load()
  }, [load])

  async function addComment(content: string): Promise<boolean> {
    setPosting(true)
    setError('')
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error('انتهت جلسة تسجيل الدخول.')

      const res = await fetch(`/api/lessons/${lessonId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ content }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'فشل إضافة التعليق.')

      setItems(prev => [...prev, data.item])
      return true
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء إضافة التعليق.')
      return false
    } finally {
      setPosting(false)
    }
  }

  async function deleteComment(commentId: string): Promise<boolean> {
    setError('')
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error('انتهت جلسة تسجيل الدخول.')

      const res = await fetch(`/api/lessons/${lessonId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'فشل حذف التعليق.')

      setItems(prev => prev.filter(c => c.id !== commentId))
      return true
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء حذف التعليق.')
      return false
    }
  }

  return { items, loading, posting, error, addComment, deleteComment, reload: load }
}