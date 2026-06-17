// components/MarkdownRenderer.tsx
// يحوّل نص Markdown بسيط إلى JSX منسّق بدون مكتبات خارجية

interface Props {
  text:     string
  textCol:  string
  subCol:   string
  fontSize?: number
}

export default function MarkdownRenderer({ text, textCol, subCol, fontSize = 15 }: Props) {
  const lines = text.split('\n')

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif", lineHeight: 1.9 }}>
      {lines.map((line, i) => {
        // ── عنوان ## ──────────────────────────────────────────
        if (line.startsWith('### ')) {
          return (
            <h3 key={i} style={{ fontSize: fontSize + 1, fontWeight: 800, color: textCol, margin: '16px 0 6px', lineHeight: 1.4 }}>
              {renderInline(line.slice(4), textCol)}
            </h3>
          )
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} style={{ fontSize: fontSize + 3, fontWeight: 900, color: textCol, margin: '20px 0 8px', lineHeight: 1.4 }}>
              {renderInline(line.slice(3), textCol)}
            </h2>
          )
        }
        if (line.startsWith('# ')) {
          return (
            <h1 key={i} style={{ fontSize: fontSize + 5, fontWeight: 900, color: textCol, margin: '24px 0 10px', lineHeight: 1.3 }}>
              {renderInline(line.slice(2), textCol)}
            </h1>
          )
        }

        // ── نقطة قائمة - أو * ──────────────────────────────────
        if (line.match(/^[-*•]\s+/)) {
          const content = line.replace(/^[-*•]\s+/, '')
          return (
            <div key={i} style={{ display: 'flex', gap: 10, margin: '4px 0', alignItems: 'flex-start' }}>
              <span style={{ color: textCol, fontSize: fontSize, flexShrink: 0, marginTop: 2 }}>◈</span>
              <span style={{ fontSize, color: textCol }}>{renderInline(content, textCol)}</span>
            </div>
          )
        }

        // ── قائمة مرقّمة 1. 2. ────────────────────────────────
        const numberedMatch = line.match(/^(\d+)[.)]\s+(.+)/)
        if (numberedMatch) {
          return (
            <div key={i} style={{ display: 'flex', gap: 10, margin: '4px 0', alignItems: 'flex-start' }}>
              <span style={{
                color: '#fff', background: textCol, borderRadius: '50%',
                width: 22, height: 22, fontSize: 11, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 2,
              }}>
                {numberedMatch[1]}
              </span>
              <span style={{ fontSize, color: textCol }}>{renderInline(numberedMatch[2], textCol)}</span>
            </div>
          )
        }

        // ── فاصل أفقي --- ─────────────────────────────────────
        if (line.match(/^---+$/)) {
          return <hr key={i} style={{ border: 'none', borderTop: `1px solid ${subCol}44`, margin: '16px 0' }} />
        }

        // ── سطر فارغ ──────────────────────────────────────────
        if (!line.trim()) {
          return <div key={i} style={{ height: 8 }} />
        }

        // ── نص عادي ───────────────────────────────────────────
        return (
          <p key={i} style={{ fontSize, color: textCol, margin: '4px 0', lineHeight: 1.9 }}>
            {renderInline(line, textCol)}
          </p>
        )
      })}
    </div>
  )
}

// ── تنسيق inline: **bold** و *italic* ──────────────────────────
function renderInline(text: string, textCol: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // النص قبل التنسيق
    if (match.index > last) {
      parts.push(text.slice(last, match.index))
    }

    const raw = match[0]
    if (raw.startsWith('**')) {
      // Bold
      parts.push(
        <strong key={match.index} style={{ fontWeight: 800, color: textCol }}>
          {raw.slice(2, -2)}
        </strong>
      )
    } else {
      // Italic
      parts.push(
        <em key={match.index} style={{ fontStyle: 'italic' }}>
          {raw.slice(1, -1)}
        </em>
      )
    }
    last = match.index + raw.length
  }

  if (last < text.length) parts.push(text.slice(last))
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>
}
