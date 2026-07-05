'use client'

import type { ReactNode } from 'react'

export function Field({
  label,
  sub,
  children,
}: {
  label: string
  sub?: string
  children: ReactNode
}) {
  return (
    <div>
      <label
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: sub ?? 'inherit',
          display: 'block',
          marginBottom: 8,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}