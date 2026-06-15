'use client'
import { useState, useRef } from 'react'

interface CardData {
  mainConcept: string
  definition:  string
  points:      string[]
  example:     string
  rule:        string
  icon:        string
}

interface VisualCardProps {
  content:     string
  title:       string
  grade?:      string
  subject?:    string
  themeColor?: string
  userId?:     string
}

// ── ألوان متناسقة للبطاقة ──
const CARD_THEMES = [
  { bg: '#1a1a2e', header: '#f9d423', accent: '#ff4e50', text: '#e2e8f0', sub: '#a0aec0', point: '#2d3748' },
  { bg: '#0f3460', header: '#43e97b', accent: '#38f9d7', text: '#e2e8f0', sub: '#90cdf4', point: '#1a365d' },
  { bg: '#2d1b69', header: '#a78bfa', accent: '#ec4899', text: '#e2e8f0', sub: '#c4b5fd', point: '#3b2a8a' },
  { bg: '#1a3c34', header: '#43e97b', accent: '#f9d423', text: '#e2e8f0', sub: '#9ae6b4', point: '#22543d' },
]

export default function VisualCard({
  content,
  title,
  grade,
  subject,
  themeColor = '#f9d423',
}: VisualCardProps) {
  const [loading, setLoading]     = useState(false)
  const [cardData, setCardData]   = useState<CardData | null>(null)
  const [saving, setSaving]       = useState(false)
  const [themeIdx, setThemeIdx]   = useState(0)
  const [error, setError]         = useState('')
  const cardRef = useRef<HTMLDivElement>(null)

  const theme = CARD_THEMES[themeIdx]

  async function generateCard() {
    setLoading(true); setError(''); setCardData(null)
    try {
      const res = await fetch('/api/visual-card', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content, title, grade, subject }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'حدث خطأ')
      setCardData(data.cardData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function saveAsImage() {
    if (!cardRef.current) return
    setSaving(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        scale:           3,
        useCORS:         true,
        backgroundColor: theme.bg,
        logging:         false,
      })
      const link    = document.createElement('a')
      link.download = `${title}-ملخص.png`
      link.href     = canvas.toDataURL('image/png', 1.0)
      link.click()
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ marginTop: 16 }}>

      {/* زر توليد البطاقة */}
      {!cardData && (
        <button
          onClick={generateCard}
          disabled={loading}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          6,
            padding:      '7px 14px',
            borderRadius: 10,
            border:       '1.5px solid rgba(167,139,250,0.4)',
            background:   loading ? 'rgba(167,139,250,0.05)' : 'rgba(167,139,250,0.12)',
            color:        '#a78bfa',
            cursor:       loading ? 'not-allowed' : 'pointer',
            fontWeight:   700,
            fontSize:     13,
            fontFamily:   'inherit',
            transition:   'all 0.2s',
            opacity:      loading ? 0.7 : 1,
          }}
        >
          <span style={{ fontSize: 16 }}>🖼️</span>
          <span>{loading ? '⏳ جارٍ توليد البطاقة...' : 'بطاقة مرئية'}</span>
        </button>
      )}

      {error && <p style={{ color: '#fc8181', fontSize: 11, marginTop: 4 }}>⚠️ {error}</p>}

      {/* البطاقة المرئية */}
      {cardData && (
        <div style={{ marginTop: 12 }}>

          {/* أدوات التحكم */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>

            {/* اختيار الثيم */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#718096' }}>اللون:</span>
              {CARD_THEMES.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setThemeIdx(i)}
                  style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: t.header,
                    border: themeIdx === i ? `2px solid white` : '2px solid transparent',
                    cursor: 'pointer', padding: 0,
                  }}
                />
              ))}
            </div>

            {/* حفظ كصورة */}
            <button
              onClick={saveAsImage}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 8,
                border: '1.5px solid rgba(67,233,123,0.4)',
                background: 'rgba(67,233,123,0.12)',
                color: '#43e97b', cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: 12, fontFamily: 'inherit',
              }}
            >
              <span>💾</span>
              <span>{saving ? 'جارٍ الحفظ...' : 'حفظ كصورة PNG'}</span>
            </button>

            {/* إعادة التوليد */}
            <button
              onClick={generateCard}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 8,
                border: '1.5px solid rgba(167,139,250,0.4)',
                background: 'rgba(167,139,250,0.12)',
                color: '#a78bfa', cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: 12, fontFamily: 'inherit',
              }}
            >
              <span>🔄</span>
              <span>{loading ? '...' : 'إعادة توليد'}</span>
            </button>
          </div>

          {/* البطاقة */}
          <div
            ref={cardRef}
            dir="rtl"
            style={{
              background:   theme.bg,
              borderRadius: 20,
              padding:      '28px 24px',
              fontFamily:   "'Segoe UI', Tahoma, Arial, sans-serif",
              maxWidth:     680,
              boxShadow:    '0 20px 60px rgba(0,0,0,0.4)',
              position:     'relative',
              overflow:     'hidden',
            }}
          >
            {/* خلفية زخرفية */}
            <div style={{
              position: 'absolute', top: -40, left: -40,
              width: 200, height: 200, borderRadius: '50%',
              background: `radial-gradient(circle, ${theme.header}15, transparent)`,
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: -60, right: -60,
              width: 250, height: 250, borderRadius: '50%',
              background: `radial-gradient(circle, ${theme.accent}10, transparent)`,
              pointerEvents: 'none',
            }} />

            {/* رأس البطاقة */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', marginBottom: 20,
              paddingBottom: 16,
              borderBottom: `2px solid ${theme.header}44`,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: theme.sub, marginBottom: 4, letterSpacing: 1 }}>
                  {subject} • الصف {grade}
                </div>
                <h2 style={{
                  margin: 0, fontSize: 22, fontWeight: 900,
                  color: theme.header, lineHeight: 1.3,
                }}>
                  {title}
                </h2>
                <p style={{
                  margin: '8px 0 0', fontSize: 13,
                  color: theme.text, lineHeight: 1.7, opacity: 0.9,
                }}>
                  {cardData.mainConcept}
                </p>
              </div>
              <div style={{
                fontSize: 52, marginRight: 'auto', marginLeft: 8,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                lineHeight: 1,
              }}>
                {cardData.icon}
              </div>
            </div>

            {/* التعريف */}
            <div style={{
              background: `${theme.header}15`,
              borderRight: `4px solid ${theme.header}`,
              borderRadius: '0 10px 10px 0',
              padding: '10px 14px',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 10, color: theme.header, fontWeight: 700, marginBottom: 4, letterSpacing: 1 }}>
                📖 التعريف
              </div>
              <p style={{ margin: 0, fontSize: 13, color: theme.text, lineHeight: 1.8 }}>
                {cardData.definition}
              </p>
            </div>

            {/* النقاط الرئيسية */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: theme.sub, fontWeight: 700, marginBottom: 10, letterSpacing: 1 }}>
                ✦ النقاط الرئيسية
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {cardData.points.map((point, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    background: theme.point,
                    borderRadius: 10, padding: '8px 12px',
                  }}>
                    <span style={{
                      background: theme.header, color: theme.bg,
                      borderRadius: '50%', width: 20, height: 20,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 900, flexShrink: 0, marginTop: 1,
                    }}>{i + 1}</span>
                    <span style={{ fontSize: 13, color: theme.text, lineHeight: 1.6 }}>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* مثال تطبيقي */}
            <div style={{
              background: `${theme.accent}15`,
              borderRight: `4px solid ${theme.accent}`,
              borderRadius: '0 10px 10px 0',
              padding: '10px 14px',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 10, color: theme.accent, fontWeight: 700, marginBottom: 4, letterSpacing: 1 }}>
                ✏️ مثال تطبيقي
              </div>
              <p style={{ margin: 0, fontSize: 13, color: theme.text, lineHeight: 1.8, fontStyle: 'italic' }}>
                {cardData.example}
              </p>
            </div>

            {/* القاعدة الذهبية */}
            <div style={{
              background: `linear-gradient(135deg, ${theme.header}22, ${theme.accent}15)`,
              border: `1px solid ${theme.header}33`,
              borderRadius: 12, padding: '12px 16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, color: theme.sub, fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>
                ⭐ القاعدة الذهبية
              </div>
              <p style={{
                margin: 0, fontSize: 14, color: theme.header,
                fontWeight: 700, lineHeight: 1.7,
              }}>
                {cardData.rule}
              </p>
            </div>

            {/* تذييل */}
            <div style={{
              marginTop: 16, paddingTop: 12,
              borderTop: `1px solid ${theme.point}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 10, color: theme.sub }}>
                🌙 منصة مساعد اللغة العربية
              </span>
              <span style={{ fontSize: 10, color: theme.sub }}>
                {new Date().toLocaleDateString('ar-KW', { year: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}