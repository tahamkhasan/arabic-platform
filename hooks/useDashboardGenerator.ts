'use client'
import { useCallback, useRef, useState } from 'react'
import { ar } from '@/lib/constants/ar'
import type { User, Subject, Lesson, Exam } from '@/types/dashboard.types'

const c = ar.common

export function useDashboardGenerator(params: {
  user: User | null
  selSubject: Subject | null
  selLesson: Lesson | null
  selExam: Exam | null
  tool: string
  details: string
}) {
  const { user, selSubject, selLesson, selExam, tool, details } = params

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [output, setOutput] = useState('')
  const [genId, setGenId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState('')
  const [savedText, setSavedText] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [editSaved, setEditSaved] = useState(false)

  const reset = useCallback(() => {
    setOutput('')
    setGenId('')
    setLoading(false)
    setError('')
    setCopied(false)
    setIsEditing(false)
    setEditedText('')
    setSavedText('')
    setSavingEdit(false)
    setEditSaved(false)
  }, [])

  const generate = useCallback(async (materialOverride?: string) => {
    if (!user || !selSubject || !tool) return
    if (tool === 'exam' && !selExam) return
    if (tool !== 'exam' && !selLesson) return

    setLoading(true)
    setError('')
    setCopied(false)
    setIsEditing(false)
    setEditedText('')
    setSavedText('')

    try {
      const promptText =
        tool === 'exam' ? `${selExam?.name ?? ''} ${details}`.trim() : `${selLesson?.name ?? ''} ${details}`.trim()

      const body: Record<string, unknown> = {
        userId: user.id,
        tool,
        grade: selSubject.grade ?? '',
        stage: selSubject.stage ?? '',
        prompt: promptText,
        material: tool === 'exam' ? '' : (materialOverride ?? selLesson?.content ?? ''),
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || c.errors.generic)
        return
      }

      setOutput(data?.result ?? '')
      setSavedText(data?.result ?? '')
      setGenId(data?.generation_id ?? data?.id ?? '')
    } catch {
      setError(c.errors.connection)
    } finally {
      setLoading(false)
    }
  }, [details, selExam, selLesson, selSubject, tool, user])

  const startEditing = useCallback(() => {
    setEditedText(savedText || output)
    setIsEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 100)
  }, [output, savedText])

  const cancelEditing = useCallback(() => {
    setIsEditing(false)
    setEditedText('')
  }, [])

  const restoreOriginal = useCallback(() => {
    setEditedText(output)
  }, [output])

  const saveEdit = useCallback(async () => {
    if (!genId || !user) return

    setSavingEdit(true)

    try {
      await fetch('/api/history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: genId, userId: user.id, action: 'edit', value: editedText }),
      })

      setSavedText(editedText)
      setIsEditing(false)
      setEditSaved(true)
      setTimeout(() => setEditSaved(false), 2500)
    } finally {
      setSavingEdit(false)
    }
  }, [editedText, genId, user])

  const copyText = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  return {
    textareaRef,
    output,
    genId,
    loading,
    error,
    copied,
    isEditing,
    editedText,
    savedText,
    savingEdit,
    editSaved,
    setEditedText,
    setError,
    reset,
    generate,
    startEditing,
    cancelEditing,
    restoreOriginal,
    saveEdit,
    copyText,
  }
}