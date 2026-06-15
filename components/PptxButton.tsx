'use client'
import { useState } from 'react'

interface PptxButtonProps {
  content:     string
  title:       string
  grade?:      string
  subject?:    string
  themeColor?: string
}

export default function PptxButton({
  content,
  title,
  grade,
  subject,
  themeColor = '#f9d423',
}: PptxButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleExport() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/pptx', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content, title, grade, subject }),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'حدث خطأ')
      }

      // تحميل الملف
      const blob     = await res.blob()
      const url      = URL.createObjectURL(blob)
      const a        = document.createElement('a')
      a.href         = url
      a.download     = `${title}.pptx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={loading}
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          6,
          padding:      '7px 14px',
          borderRadius: 10,
          border:       '1.5px solid rgba(249,115,22,0.4)',
          background:   loading ? 'rgba(249,115,22,0.05)' : 'rgba(249,115,22,0.12)',
          color:        '#f97316',
          cursor:       loading ? 'not-allowed' : 'pointer',
          fontWeight:   700,
          fontSize:     13,
          fontFamily:   'inherit',
          transition:   'all 0.2s',
          opacity:      loading ? 0.7 : 1,
        }}
      >
        <span style={{ fontSize: 16 }}>📊</span>
        <span>{loading ? 'جارٍ التوليد...' : 'تصدير PowerPoint'}</span>
      </button>
      {error && (
        <p style={{ color: '#fc8181', fontSize: 11, marginTop: 4 }}>⚠️ {error}</p>
      )}
    </div>
  )
}