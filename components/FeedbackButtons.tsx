'use client'
import { useState } from 'react'

interface FeedbackButtonsProps {
  generationId: string
  userId:       string
  themeColor?:  string
}

type Rating = 1 | -1 | null

export default function FeedbackButtons({
  generationId,
  userId,
  themeColor = '#f9d423',
}: FeedbackButtonsProps) {
  const [rating, setRating]   = useState<Rating>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]         = useState('')

  async function handleRating(value: 1 | -1) {
    if (rating === value || loading) return
    setLoading(true)
    setMsg('')
    try {
      const res = await fetch('/api/feedback', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ generationId, rating: value, userId }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error || 'حدث خطأ'); return }
      setRating(value)
      setMsg(value === 1 ? 'شكراً! سيساعدنا هذا على التحسين 🎉' : 'شكراً على ملاحظتك 📝')
      setTimeout(() => setMsg(''), 3000)
    } catch {
      setMsg('تعذّر الاتصال. حاول مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 10, border: '1.5px solid',
    cursor: loading ? 'not-allowed' : 'pointer',
    fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
    transition: 'all 0.2s', opacity: loading ? 0.6 : 1,
  }

  return (
    <div style={{ marginTop: 12 }}>
      <p style={{ fontSize: 12, color: '#718096', marginBottom: 8, fontWeight: 600 }}>
        هل كانت النتيجة مفيدة؟
      </p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => handleRating(1)} disabled={loading} style={{
          ...btnBase,
          borderColor: rating === 1 ? '#43e97b' : 'rgba(67,233,123,0.3)',
          background:  rating === 1 ? 'rgba(67,233,123,0.15)' : 'transparent',
          color:       rating === 1 ? '#43e97b' : '#718096',
          boxShadow:   rating === 1 ? '0 2px 10px rgba(67,233,123,0.2)' : 'none',
        }}>
          <span style={{ fontSize: 16 }}>👍</span>
          <span>مفيد</span>
          {rating === 1 && <span style={{ fontSize: 11 }}>✓</span>}
        </button>

        <button onClick={() => handleRating(-1)} disabled={loading} style={{
          ...btnBase,
          borderColor: rating === -1 ? '#fc8181' : 'rgba(252,129,129,0.3)',
          background:  rating === -1 ? 'rgba(252,129,129,0.12)' : 'transparent',
          color:       rating === -1 ? '#fc8181' : '#718096',
          boxShadow:   rating === -1 ? '0 2px 10px rgba(252,129,129,0.15)' : 'none',
        }}>
          <span style={{ fontSize: 16 }}>👎</span>
          <span>غير مفيد</span>
          {rating === -1 && <span style={{ fontSize: 11 }}>✓</span>}
        </button>

        {loading && <span style={{ fontSize: 12, color: '#4a5568' }}>⏳</span>}
      </div>

      {msg && (
        <p style={{ fontSize: 12, marginTop: 8, color: rating === 1 ? '#43e97b' : '#a0aec0' }}>
          {msg}
        </p>
      )}
    </div>
  )
}