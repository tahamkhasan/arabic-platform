'use client'

import React from 'react'

type Props = {
  text?: string | null
  textCol?: string
  subCol?: string
  fontSize?: number
}

/**
 * عارض Markdown مبسط وآمن:
 * - لو النص غير موجود (undefined / null) لا ينكسر، بل يعرض رسالة لطيفة.
 * - لو النص موجود، يقسمه أسطر ويعرض عناوين وفق # و ##.
 */
export default function MarkdownRenderer({
  text,
  textCol,
  subCol,
  fontSize = 15,
}: Props) {
  // لو لا يوجد نص مكتوب، لا تنفّذ split أبداً
  if (!text || typeof text !== 'string') {
    return (
      <div
        style={{
          fontFamily: "Segoe UI, Tahoma, Arial, sans-serif",
          fontSize,
          color: subCol || '#6B7280',
          lineHeight: 1.8,
        }}
      >
        لا يوجد نص مكتوب لهذا الدرس حالياً، قد يكون المصدر ملفاً فقط.
      </div>
    )
  }

  const lines = text.split('\n')

  return (
    <div
      style={{
        fontFamily: "Segoe UI, Tahoma, Arial, sans-serif",
        lineHeight: 1.9,
        fontSize,
        color: textCol || '#111827',
      }}
    >
      {lines.map((line, idx) => {
        const trimmed = line.trim()

        // عنوان رئيسي "# ..."
        if (trimmed.startsWith('# ')) {
          return (
            <h2
              key={idx}
              style={{
                fontSize: fontSize + 4,
                fontWeight: 800,
                margin: '12px 0 6px',
              }}
            >
              {trimmed.replace(/^#\s*/, '')}
            </h2>
          )
        }

        // عنوان فرعي "## ..."
        if (trimmed.startsWith('## ')) {
          return (
            <h3
              key={idx}
              style={{
                fontSize: fontSize + 2,
                fontWeight: 700,
                margin: '10px 0 4px',
              }}
            >
              {trimmed.replace(/^##\s*/, '')}
            </h3>
          )
        }

        // سطر فارغ
        if (!trimmed) {
          return <div key={idx} style={{ height: 6 }} />
        }

        // سطر عادي
        return (
          <p
            key={idx}
            style={{
              margin: '0 0 6px',
              color: subCol || textCol || '#4B5563',
            }}
          >
            {trimmed}
          </p>
        )
      })}
    </div>
  )
}