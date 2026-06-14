'use client'
import { useState } from 'react'
import {
  Document, Packer, Paragraph, TextRun,
  HeadingLevel, AlignmentType, BorderStyle,
  Table, TableRow, TableCell, WidthType,
  ShadingType, PageOrientation,
} from 'docx'
import { saveAs } from 'file-saver'

interface WordExportButtonProps {
  content:     string
  title:       string
  grade?:      string
  subject?:    string
  tool?:       string
  themeColor?: string
}

// ── تحويل النص إلى فقرات منسّقة ──
function parseContentToParagraphs(content: string): Paragraph[] {
  const lines = content.split('\n')
  const paragraphs: Paragraph[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      // سطر فارغ
      paragraphs.push(new Paragraph({ text: '' }))
      continue
    }

    // عنوان رئيسي (━━━ أو ###)
    if (trimmed.startsWith('━') || trimmed.startsWith('===')) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: trimmed.replace(/━+|={3,}/g, '').trim(), bold: true, color: '1a1a2e', size: 28 })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'f9d423' } },
        spacing: { before: 200, after: 100 },
      }))
      continue
    }

    // عنوان ## أو 📌
    if (trimmed.startsWith('##') || trimmed.startsWith('📌')) {
      paragraphs.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: trimmed.replace(/^##\s*/, ''), bold: true, size: 26, color: '1a365d' })],
        spacing: { before: 160, after: 80 },
      }))
      continue
    }

    // عنوان # 
    if (trimmed.startsWith('#')) {
      paragraphs.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: trimmed.replace(/^#\s*/, ''), bold: true, size: 32, color: '1a1a2e' })],
        spacing: { before: 200, after: 100 },
      }))
      continue
    }

    // نقطة أو رقم
    if (trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+\./.test(trimmed)) {
      const text = trimmed.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '')
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text, size: 24 })],
        bullet: { level: 0 },
        spacing: { before: 60, after: 60 },
      }))
      continue
    }

    // نص عادي مع تنسيق **bold**
    const parts = trimmed.split(/(\*\*[^*]+\*\*)/)
    const runs: TextRun[] = parts.map(part => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return new TextRun({ text: part.slice(2, -2), bold: true, size: 24 })
      }
      return new TextRun({ text: part, size: 24 })
    })

    paragraphs.push(new Paragraph({
      children: runs,
      spacing: { before: 60, after: 60 },
      alignment: AlignmentType.RIGHT,
    }))
  }

  return paragraphs
}

export default function WordExportButton({
  content,
  title,
  grade,
  subject,
  tool,
  themeColor = '#f9d423',
}: WordExportButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const date = new Date().toLocaleDateString('ar-KW', {
        year: 'numeric', month: 'long', day: 'numeric',
      })

      const doc = new Document({
        sections: [{
          properties: {},
          children: [

            // ── العنوان الرئيسي ──
            new Paragraph({
              children: [
                new TextRun({
                  text: '🌙 منصة مساعد اللغة العربية',
                  bold: true, size: 36, color: '1a1a2e',
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
              border: { bottom: { style: BorderStyle.THICK, size: 8, color: 'f9d423' } },
            }),

            // ── معلومات الوثيقة ──
            new Paragraph({
              children: [
                new TextRun({ text: subject ? `المادة: ${subject}` : '', size: 22, color: '4a5568' }),
                new TextRun({ text: grade ? `   •   الصف: ${grade}` : '', size: 22, color: '4a5568' }),
                new TextRun({ text: `   •   ${date}`, size: 22, color: '4a5568' }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),

            // ── عنوان المحتوى ──
            new Paragraph({
              children: [
                new TextRun({
                  text: title,
                  bold: true, size: 30, color: '1a365d',
                }),
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { before: 100, after: 200 },
              border: {
                right: { style: BorderStyle.THICK, size: 12, color: 'f9d423' },
              },
            }),

            // ── المحتوى ──
            ...parseContentToParagraphs(content),

            // ── تذييل ──
            new Paragraph({
              children: [
                new TextRun({
                  text: 'منصة مساعد اللغة العربية • الكويت 🇰🇼 • mosaed-arabic.vercel.app',
                  size: 18, color: 'a0aec0', italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 400 },
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'e2e8f0' } },
            }),
          ],
        }],
      })

      const blob = await Packer.toBlob(doc)
      const fileName = `${title.replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, '').trim() || 'مستخرج'}.docx`
      saveAs(blob, fileName)

    } catch (err) {
      console.error('Word export error:', err)
      alert('حدث خطأ أثناء التصدير. حاول مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      style={{
        display:    'flex',
        alignItems: 'center',
        gap:        6,
        padding:    '7px 14px',
        borderRadius: 10,
        border:     '1.5px solid rgba(67,233,123,0.4)',
        background: loading ? 'rgba(67,233,123,0.05)' : 'rgba(67,233,123,0.12)',
        color:      '#43e97b',
        cursor:     loading ? 'not-allowed' : 'pointer',
        fontWeight: 700,
        fontSize:   13,
        fontFamily: 'inherit',
        transition: 'all 0.2s',
        opacity:    loading ? 0.7 : 1,
      }}
      onMouseEnter={e => {
        if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(67,233,123,0.22)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(67,233,123,0.12)'
      }}
    >
      <span style={{ fontSize: 16 }}>📄</span>
      <span>{loading ? 'جارٍ التصدير...' : 'تصدير Word'}</span>
    </button>
  )
}