'use client'
import { useEffect, useState } from 'react'
import type { User, Message, Tab } from '@/types/student.types'

export function useStudentMessaging(user: User | null, tab: Tab) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [teacherId, setTeacherId] = useState<string | null>(null)

  useEffect(() => {
    if (!user || tab !== 'messages') return
    fetch(`/api/messages?userId=${user.id}`)
      .then(r => r.json())
      .then(d => {
        setMessages(d.messages ?? [])
        setTeacherId(d.teacherId ?? null)
        setUnreadCount(d.unread ?? 0)
      })
      .catch(() => {
        setMessages([])
        setTeacherId(null)
      })
  }, [user, tab])

  useEffect(() => {
    if (!user) return
    const fn = () =>
      fetch(`/api/messages?userId=${user.id}&unreadOnly=true`)
        .then(r => r.json())
        .then(d => setUnreadCount(d.unread ?? 0))
        .catch(() => {})
    fn()
    const iv = setInterval(fn, 30000)
    return () => clearInterval(iv)
  }, [user])

  async function handleSendMessage() {
    if (!user || !teacherId || !newMsg.trim()) return
    setSendingMsg(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromId: user.id, toId: teacherId, content: newMsg }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessages(prev => [...prev, data.message])
        setNewMsg('')
      }
    } finally {
      setSendingMsg(false)
    }
  }

  return {
    messages,
    newMsg,
    setNewMsg,
    sendingMsg,
    unreadCount,
    teacherId,
    handleSendMessage,
  }
}