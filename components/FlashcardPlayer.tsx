'use client'
import { useState } from 'react'

interface Flashcard {
  id:       number
  category: string
  front:    string
  back:     string
  example?: string | null
}

interface FlashcardsData {
  title:      string
  lessonType: string
  cards:      Flashcard[]
}

interface Props {
  data:       FlashcardsData
  themeColor: string
  textCol:    string
  subCol:     string
  cardBg:     string
  borderCol:  string
  isDark:     boolean
  onClose:    () => void
}

// ── ألوان الفئات ──────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  'تعريف':          '#4facfe',
  'مصطلح':          '#a78bfa',
  'فكرة رئيسة':    '#f9d423',
  'فكرة جزئية':    '#f97316',
  'شخصية':         '#ec4899',
  'قيمة':           '#43e97b',
  'مظهر سلوكي':    '#43e97b',
  'ركن':            '#4facfe',
  'عنصر':           '#4facfe',
  'سمة أسلوب':     '#a78bfa',
  'سمة كاتب':      '#a78bfa',
  'نظرية':          '#f97316',
  'مفهوم':          '#4facfe',
  'إعراب':          '#fc8181',
  'عقدة':           '#ec4899',
  'حل':             '#43e97b',
  'هدف':            '#f9d423',
  'default':        '#94a3b8',
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS['default']
}

export default function FlashcardPlayer({
  data, themeColor, textCol, subCol, cardBg, borderCol, isDark, onClose
}: Props) {

  const [currentIdx, setCurrentIdx]   = useState(0)
  const [isFlipped,  setIsFlipped]    = useState(false)
  const [known,      setKnown]        = useState<number[]>([])
  const [unknown,    setUnknown]      = useState<number[]>([])
  const [round,      setRound]        = useState(1)
  const [queue,      setQueue]        = useState<Flashcard[]>(data.cards)
  const [finished,   setFinished]     = useState(false)

  const current    = queue[currentIdx]
  const total      = queue.length
  const progress   = total > 0 ? ((currentIdx) / total) * 100 : 0
  const catColor   = current ? getCategoryColor(current.category) : themeColor

  // ── أعرفها ────────────────────────────────────────────────────
  function markKnown() {
    setKnown(prev => [...prev, current.id])
    nextCard()
  }

  // ── لا أعرفها ─────────────────────────────────────────────────
  function markUnknown() {
    setUnknown(prev => [...prev, current.id])
    nextCard()
  }

  // ── الانتقال للبطاقة التالية ──────────────────────────────────
  function nextCard() {
    setIsFlipped(false)
    if (currentIdx + 1 < total) {
      setCurrentIdx(i => i + 1)
    } else {
      // انتهى الدور الحالي
      const unknownCards = queue.filter(c =>
        !known.includes(c.id) && c.id !== current.id
      )
      if (unknownCards.length === 0) {
        setFinished(true)
      } else {
        // دور جديد للبطاقات غير المعروفة فقط
        setQueue(unknownCards)
        setCurrentIdx(0)
        setRound(r => r + 1)
        setUnknown([])
      }
    }
  }

  // ── إعادة من الأول ────────────────────────────────────────────
  function restart() {
    setQueue(data.cards)
    setCurrentIdx(0)
    setIsFlipped(false)
    setKnown([])
    setUnknown([])
    setRound(1)
    setFinished(false)
  }

  // ── شاشة الانتهاء ────────────────────────────────────────────
  if (finished) {
    return (
      <div style={{ padding: '10px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#43e97b', margin: '0 0 8px' }}>
          أتقنت جميع البطاقات!
        </h2>
        <p style={{ fontSize: 15, color: subCol, marginBottom: 8 }}>
          {data.title}
        </p>
        <p style={{ fontSize: 14, color: subCol, marginBottom: 28 }}>
          أنهيت {round} {round === 1 ? 'جولة' : 'جولات'} •
          حفظت {data.cards.length} بطاقة
        </p>

        {/* ملخص البطاقات */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, textAlign: 'right' }}>
          {data.cards.map(card => (
            <div key={card.id} style={{
              padding: '12px 16px', borderRadius: 12,
              background: 'rgba(67,233,123,0.1)',
              border: '1px solid rgba(67,233,123,0.3)',
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>✅</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: textCol }}>{card.front}</div>
                <div style={{ fontSize: 12, color: subCol, marginTop: 3 }}>{card.back}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={restart}
            style={{
              flex: 1, padding: '14px', borderRadius: 12, border: 'none',
              background: `linear-gradient(135deg,${themeColor},#ff4e50)`,
              color: '#1a1a2e', fontWeight: 900, fontSize: 15,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
            🔄 مراجعة من جديد
          </button>
          <button onClick={onClose}
            style={{
              flex: 1, padding: '14px', borderRadius: 12,
              border: `1.5px solid ${borderCol}`, background: 'transparent',
              color: subCol, fontWeight: 700, fontSize: 15,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
            ✕ إغلاق
          </button>
        </div>
      </div>
    )
  }

  // ── شاشة البطاقة ─────────────────────────────────────────────
  return (
    <div style={{ padding: '4px 0' }}>

      {/* معلومات أعلى */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: subCol }}>
            الجولة {round}
          </span>
          <span style={{ fontSize: 13, color: '#43e97b', fontWeight: 700 }}>
            ✅ {known.length}
          </span>
          <span style={{ fontSize: 13, color: '#fc8181', fontWeight: 700 }}>
            ❌ {unknown.length}
          </span>
        </div>
        <span style={{ fontSize: 13, color: subCol }}>
          {currentIdx + 1} / {total}
        </span>
      </div>

      {/* شريط التقدم */}
      <div style={{ height: 6, borderRadius: 3, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 20 }}>
        <div style={{
          height: '100%', borderRadius: 3,
          background: `linear-gradient(90deg,${themeColor},#ff4e50)`,
          width: `${progress}%`, transition: 'width 0.4s ease',
        }} />
      </div>

      {/* نوع البطاقة */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <span style={{
          fontSize: 12, padding: '4px 14px', borderRadius: 20,
          background: `${catColor}22`, color: catColor, fontWeight: 800,
        }}>
          {current?.category}
        </span>
      </div>

      {/* البطاقة القابلة للقلب */}
      <div
        onClick={() => setIsFlipped(f => !f)}
        style={{
          width: '100%', minHeight: 200, borderRadius: 20, cursor: 'pointer',
          position: 'relative', marginBottom: 20,
          perspective: '1000px',
        }}
      >
        {/* وجه البطاقة */}
        {!isFlipped ? (
          <div style={{
            padding: '32px 24px', borderRadius: 20, textAlign: 'center',
            background: isDark
              ? `linear-gradient(135deg,${catColor}18,${catColor}08)`
              : `linear-gradient(135deg,${catColor}15,${catColor}05)`,
            border: `2px solid ${catColor}44`,
            minHeight: 200, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12,
            transition: 'all 0.3s',
          }}>
            <div style={{ fontSize: 13, color: catColor, fontWeight: 700, marginBottom: 8 }}>
              {current?.category}
            </div>
            <p style={{ fontSize: 20, fontWeight: 800, color: textCol, margin: 0, lineHeight: 1.5 }}>
              {current?.front}
            </p>
            <p style={{ fontSize: 13, color: subCol, margin: 0 }}>
              انقر لرؤية الإجابة 👆
            </p>
          </div>
        ) : (
          /* ظهر البطاقة */
          <div style={{
            padding: '28px 24px', borderRadius: 20, textAlign: 'center',
            background: isDark
              ? `linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.06))`
              : `linear-gradient(135deg,#ffffff,#f8f9ff)`,
            border: `2px solid ${catColor}66`,
            minHeight: 200, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 14,
          }}>
            <div style={{ fontSize: 11, color: catColor, fontWeight: 700, marginBottom: 4 }}>
              الإجابة:
            </div>
            <p style={{ fontSize: 17, fontWeight: 700, color: textCol, margin: 0, lineHeight: 1.7 }}>
              {current?.back}
            </p>
            {current?.example && (
              <div style={{
                padding: '10px 16px', borderRadius: 10, marginTop: 8,
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                border: `1px solid ${borderCol}`,
              }}>
                <span style={{ fontSize: 11, color: catColor, fontWeight: 700 }}>مثال: </span>
                <span style={{ fontSize: 13, color: subCol }}>{current.example}</span>
              </div>
            )}
            <p style={{ fontSize: 13, color: subCol, margin: 0 }}>هل تعرفها؟</p>
          </div>
        )}
      </div>

      {/* أزرار التقييم — تظهر بعد القلب فقط */}
      {isFlipped ? (
        <div style={{ display: 'flex', gap: 14 }}>
          <button onClick={markUnknown}
            style={{
              flex: 1, padding: '16px', borderRadius: 14,
              border: '2px solid rgba(252,129,129,0.5)',
              background: 'rgba(252,129,129,0.12)',
              color: '#fc8181', fontWeight: 900, fontSize: 16,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }}>
            ❌ لا أعرفها
          </button>
          <button onClick={markKnown}
            style={{
              flex: 1, padding: '16px', borderRadius: 14,
              border: '2px solid rgba(67,233,123,0.5)',
              background: 'rgba(67,233,123,0.12)',
              color: '#43e97b', fontWeight: 900, fontSize: 16,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }}>
            ✅ أعرفها
          </button>
        </div>
      ) : (
        /* تلميح قبل القلب */
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: subCol }}>
            انقر على البطاقة لرؤية الإجابة، ثم قيّم نفسك
          </p>
        </div>
      )}

      {/* بطاقات متبقية */}
      {round > 1 && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <p style={{ fontSize: 12, color: subCol }}>
            🔄 الجولة {round} — {total} بطاقة تحتاج مراجعة
          </p>
        </div>
      )}
    </div>
  )
}