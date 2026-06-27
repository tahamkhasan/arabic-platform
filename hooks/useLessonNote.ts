import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useLessonNote(lessonId: string) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState('')
  const [hasExisting, setHasExisting] = useState(false)
  const [dirty, setDirty] = useState(false)

  async function getAccessToken(): Promise<string | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setMessage('')
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error('انتهت جلسة تسجيل الدخول.')

      const res = await fetch(`/api/lessons/${lessonId}/notes`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'فشل تحميل الملاحظة.')

      if (data?.note) {
        setContent(data.note.content || '')
        setHasExisting(true)
      }
      setDirty(false)
    } catch (err: any) {
      setMessage(`❌ ${err?.message || 'حدث خطأ أثناء تحميل الملاحظة.'}`)
    } finally {
      setLoading(false)
    }
  }, [lessonId])

  useEffect(() => {
    load()
  }, [load])

  function updateContent(value: string) {
    setContent(value)
    setDirty(true)
  }

  async function save(): Promise<boolean> {
    setSaving(true)
    setMessage('')
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error('انتهت جلسة تسجيل الدخول.')

      const res = await fetch(`/api/lessons/${lessonId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ content }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'فشل حفظ الملاحظة.')

      setHasExisting(true)
      setDirty(false)
      setMessage('✅ تم حفظ ملاحظتك.')
      return true
    } catch (err: any) {
      setMessage(`❌ ${err?.message || 'حدث خطأ أثناء الحفظ.'}`)
      return false
    } finally {
      setSaving(false)
    }
  }

  async function remove(): Promise<boolean> {
    if (!hasExisting) return true
    setDeleting(true)
    setMessage('')
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error('انتهت جلسة تسجيل الدخول.')

      const res = await fetch(`/api/lessons/${lessonId}/notes`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'فشل حذف الملاحظة.')

      setContent('')
      setHasExisting(false)
      setDirty(false)
      setMessage('🗑️ تم حذف الملاحظة.')
      return true
    } catch (err: any) {
      setMessage(`❌ ${err?.message || 'حدث خطأ أثناء الحذف.'}`)
      return false
    } finally {
      setDeleting(false)
    }
  }

  return {
    content,
    updateContent,
    loading,
    saving,
    deleting,
    message,
    hasExisting,
    dirty,
    save,
    remove,
  }
}