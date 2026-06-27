'use client'

import React from 'react'

type SafeMarkdownProps = {
  text?: string | null
  textCol?: string
  subCol?: string
  fontSize?: number
}

export default function SafeMarkdownRenderer({
  text,
  textCol,
  subCol,
  fontSize = 15,
}: SafeMarkdownProps) {
  // لو النص غير موجود (درس PDF فقط مثلاً) نرجّع رسالة بسيطة أو لا شيء
  if (!text || typeof text !== 'string') {
    return (
      <div
        style={{
          fontFamily: "Segoe UI, Tahoma, Arial, sans-serif",
          fontSize,
          color: subCol || '#6B7280',
        }}
      >
        لا يوجد نص مكتوب لهذا الدرس، المصدر الحالي ملف فقط.
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

        if (!trimmed) {
          return <div key={idx} style={{ height: 6 }} />
        }

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