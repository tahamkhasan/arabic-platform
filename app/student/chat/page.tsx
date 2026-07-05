'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface Conversation {
  id: string
  title: string
  lesson_id: string | null
  updated_at: string
  messages_count: number
  last_message: string | null
}

const T = {
  bg: '#F7F2EA',
  cardBg: '#FFFFFF',
  headerBg: 'rgba(247,242,234,0.95)',
  textCol: '#1a1a1a',
  subCol: '#6B7280',
  mutedCol: '#9CA3AF',
  borderCol: '#E5E5E5',
  primary: '#C32D2D',
  primarySoft: 'rgba(140, 20, 40, 0.06)',
  primaryDeep: '#780F1E',
  blue: '#2563EB',
  userBubble: '#2563EB',
  userText: '#FFFFFF',
  aiBubble: '#FFFFFF',
  aiText: '#1a1a1a',
  inputBg: '#FFFFFF',
  inputBorder: '#E5E5E5',
}

const QUICK_SUGGESTIONS = [
  '📖 اشرح لي الدرس ببساطة',
  '💡 أعطني أمثلة إضافية',
  '🎯 اختبرني بسؤال',
  '❓ ما الفرق بين... و...؟',
]

function SimpleMarkdown({ text }: { text: string }) {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#780F1E;font-weight:700">$1</strong>')
    .replace(/\n/g, '<br/>')
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

function ChatContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const conversationId = searchParams.get('id')

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [streamingText, setStreamingText] = useState('')

  const [accessToken, setAccessToken] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) setAccessToken(data.session.access_token)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccessToken(session?.access_token ?? '')
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!accessToken) return

    fetch('/api/chat/conversations', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setConversations(data.data.items || [])
        }
      })
      .catch(err => console.error('Error fetching conversations:', err))
  }, [accessToken])

  useEffect(() => {
    if (!conversationId || !accessToken) return

    setIsLoading(true)
    setMessages([])

    fetch(`/api/chat/conversations/${conversationId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setMessages(data.data.messages || [])
        }
      })
      .catch(err => console.error('Error fetching messages:', err))
      .finally(() => setIsLoading(false))
  }, [conversationId, accessToken])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, streamingText])

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || isSending) return
    if (!accessToken) {
      console.error('لا توجد جلسة فعّالة — تعذّر الإرسال')
      return
    }

    setIsSending(true)
    setInput('')

    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => conversationId ? [...prev, userMsg] : [userMsg])
    setStreamingText('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          conversation_id: conversationId || undefined,
        }),
      })

      if (!response.ok) throw new Error('فشل الاتصال')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('لا يوجد رد')

      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setStreamingText(fullText)
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: fullText,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => conversationId ? [...prev, aiMsg] : [userMsg, aiMsg])
      setStreamingText('')

      if (!conversationId) {
        const listRes = await fetch('/api/chat/conversations', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        })
        const listData = await listRes.json()
        if (listData.success) {
          setConversations(listData.data.items || [])
          const newConv = listData.data.items?.[0]
          if (newConv) {
            router.push(`/student/chat?id=${newConv.id}`)
          }
        }
      }
    } catch (err: any) {
      console.error('Chat error:', err)
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'عذراً، حدث خطأ في الاتصال. حاول مرة أخرى.',
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setIsSending(false)
    }
  }

  const selectConversation = (id: string) => {
    router.push(`/student/chat?id=${id}`)
    setShowSidebar(false)
  }

  const newConversation = () => {
    router.push('/student/chat')
  }

  const handleSuggestion = (text: string) => {
    sendMessage(text)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (isLoading && conversationId) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cairo, sans-serif' }}>
        <div style={{ textAlign: 'center', color: T.subCol }}>
          <div style={{ width: 48, height: 48, border: '3px solid ' + T.borderCol, borderTopColor: T.primary, borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ marginTop: 16 }}>جارٍ تحميل المحادثة...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Cairo, sans-serif', color: T.textCol, direction: 'rtl' }}>
      <div style={{ background: T.headerBg, borderBottom: '1px solid ' + T.borderCol, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* ── جديد: زر رجوع — كان غائباً تماماً من هذا الهيدر،
               فلا طريق للخروج من الصفحة سوى الرجوع المتصفح اليدوي ── */}
          <button
            onClick={() => router.push('/student')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
              border: 'none', background: T.primary, color: '#fff', fontWeight: 700, fontSize: 13,
              cursor: 'pointer', fontFamily: 'Cairo, sans-serif', flexShrink: 0,
            }}
          >
            → رجوع
          </button>
          <button onClick={() => setShowSidebar(!showSidebar)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', color: T.textCol, fontSize: 20 }}>
            {showSidebar ? '✕' : '☰'}
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: T.primaryDeep, margin: 0 }}>💬 دردشة مداد</h1>
        </div>
        <button onClick={newConversation} style={{ background: T.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: 'Cairo, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          + محادثة جديدة
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {showSidebar && (
          <div style={{ width: 300, background: T.cardBg, borderLeft: '1px solid ' + T.borderCol, overflowY: 'auto', height: 'calc(100vh - 57px)', flexShrink: 0 }}>
            <div style={{ padding: '16px', borderBottom: '1px solid ' + T.borderCol, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: T.textCol }}>المحادثات</span>
              <span style={{ color: T.mutedCol, fontSize: 13 }}>{conversations.length}</span>
            </div>

            {conversations.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: T.mutedCol }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>💬</p>
                <p style={{ fontSize: 14 }}>لا توجد محادثات بعد</p>
                <p style={{ fontSize: 13, color: T.mutedCol, marginTop: 8 }}>ابدأ محادثة جديدة للتواصل مع مداد</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button key={conv.id} onClick={() => selectConversation(conv.id)}
                  style={{ display: 'block', width: '100%', background: conversationId === conv.id ? T.primarySoft : 'transparent', border: 'none', borderBottom: '1px solid ' + T.borderCol, padding: '12px 16px', textAlign: 'right', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', color: T.textCol, transition: 'background 0.2s' }}>
                  <div style={{ fontWeight: conversationId === conv.id ? 600 : 400, fontSize: 14, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.title}</div>
                  <div style={{ fontSize: 12, color: T.mutedCol, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.last_message || 'لا رسائل بعد'}</div>
                  <div style={{ fontSize: 11, color: T.mutedCol, marginTop: 4 }}>{conv.messages_count} رسالة</div>
                </button>
              ))
            )}
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 57px)', minWidth: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {!conversationId && messages.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 72, marginBottom: 24 }}>🤖</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: T.primaryDeep, marginBottom: 12 }}>مرحباً في دردشة مداد</h2>
                <p style={{ color: T.subCol, fontSize: 16, maxWidth: 400, lineHeight: 1.8, marginBottom: 32 }}>
                  أنا مساعدك الذكي في اللغة العربية.
                  اسألني عن أي درس أو مسألة نحوية أو بلاغية،
                  وسأساعدك على الفهم والتطبيق.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 500 }}>
                  {QUICK_SUGGESTIONS.map((s, i) => (
                    <button key={i} onClick={() => handleSuggestion(s.replace(/^[^\s]+/, ''))}
                      style={{ background: T.cardBg, border: '1px solid ' + T.borderCol, borderRadius: 20, padding: '10px 16px', fontFamily: 'Cairo, sans-serif', fontSize: 13, color: T.textCol, cursor: 'pointer', transition: 'all 0.2s' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-start' : 'flex-end', marginBottom: 16 }}>
                    <div style={{ maxWidth: '80%', padding: '12px 16px', borderRadius: 16, lineHeight: 1.8, fontSize: 15, background: msg.role === 'user' ? T.userBubble : T.aiBubble, color: msg.role === 'user' ? T.userText : T.aiText, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                      <SimpleMarkdown text={msg.content} />
                    </div>
                  </div>
                ))}

                {streamingText && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <div style={{ maxWidth: '80%', padding: '12px 16px', borderRadius: 16, lineHeight: 1.8, fontSize: 15, background: T.aiBubble, color: T.aiText, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                      <SimpleMarkdown text={streamingText} />
                      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: T.mutedCol, animation: 'blink 1s infinite', marginLeft: 4, verticalAlign: 'middle' }} />
                      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ borderTop: '1px solid ' + T.borderCol, padding: '12px 20px', background: T.cardBg }}>
            {!conversationId && (
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid ' + T.borderCol }}>
                {QUICK_SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => handleSuggestion(s.replace(/^[^\s]+/, ''))}
                    style={{ background: T.primarySoft, border: '1px solid ' + T.borderCol, borderRadius: 12, padding: '6px 12px', fontFamily: 'Cairo, sans-serif', fontSize: 12, color: T.primaryDeep, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="اكتب سؤالك هنا..."
                rows={1}
                style={{ flex: 1, resize: 'none', background: T.inputBg, border: '1px solid ' + T.inputBorder, borderRadius: 12, padding: '12px 16px', fontFamily: 'Cairo, sans-serif', fontSize: 15, color: T.textCol, outline: 'none', maxHeight: 100, lineHeight: 1.6 }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={isSending || !input.trim()}
                style={{ background: isSending ? T.mutedCol : T.primary, color: '#fff', border: 'none', borderRadius: 12, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, cursor: isSending ? 'wait' : 'pointer', opacity: input.trim() ? 1 : 0.5, transition: 'all 0.2s', flexShrink: 0 }}
              >
                {isSending ? '⏳' : '→'}
              </button>
            </div>
          </div>
        </div>

        {showSidebar && (
          <div onClick={() => setShowSidebar(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
        )}
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F7F2EA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cairo, sans-serif', color: '#6B7280' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
          <p>جارٍ تحميل دردشة مداد...</p>
        </div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  )
}
