'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AppUser } from '@/lib/auth/auth.types'
import { apiFetch } from '@/lib/auth/auth.fetch'
import type {
  Message,
  Student,
  TeacherTab,
} from '@/lib/teacher/teacher.types'

interface Params {
  user: AppUser | null
  accessToken: string | null
  tab: TeacherTab
}

export function useTeacherMessages({ user, accessToken, tab }: Params) {
  const [selStudent, setSelStudent] = useState<Student | null>(null)
  const [msgList, setMsgList] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [unread, setUnread] = useState(0)

  const loadUnread = useCallback(async () => {
    if (!user || !accessToken) return
    const res = await apiFetch(`/api/messages?userId=${user.id}&unreadOnly=true`)
    const data = await res.json().catch(() => null)
    setUnread(data?.unread ?? 0)
  }, [user, accessToken])

  const loadConversation = useCallback(async () => {
    if (!user || !selStudent || !accessToken) return
    const res = await apiFetch(`/api/messages?userId=${user.id}&otherId=${selStudent.id}`)
    const data = await res.json().catch(() => null)
    setMsgList(data?.messages ?? [])
  }, [user, selStudent, accessToken])

  useEffect(() => {
    if (!user || !accessToken || tab !== 'messages') return
    loadUnread().catch(() => setUnread(0))
  }, [user, accessToken, tab, loadUnread])

  useEffect(() => {
    if (!user || !selStudent || !accessToken) return
    loadConversation().catch(() => setMsgList([]))
  }, [user, selStudent, accessToken, loadConversation])

  async function sendMessage() {
    if (!user || !selStudent || !newMsg.trim()) return

    setSendingMsg(true)
    try {
      const res = await apiFetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          fromId: user.id,
          toId: selStudent.id,
          content: newMsg,
        }),
      })

      const data = await res.json().catch(() => null)
      if (res.ok && data?.message) {
        setMsgList(prev => [...prev, data.message])
        setNewMsg('')
        await loadUnread()
      }
    } finally {
      setSendingMsg(false)
    }
  }

  return {
    selStudent,
    setSelStudent,
    msgList,
    setMsgList,
    newMsg,
    setNewMsg,
    sendingMsg,
    unread,

    loadUnread,
    loadConversation,
    sendMessage,
  }
}