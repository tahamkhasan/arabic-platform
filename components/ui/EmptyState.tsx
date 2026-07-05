'use client'

export function EmptyState({
  icon,
  title,
  sub,
  cardBg,
  borderCol,
  textCol,
  subCol,
}: {
  icon: string
  title: string
  sub: string
  cardBg: string
  borderCol: string
  textCol: string
  subCol: string
}) {
  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${borderCol}`,
        borderRadius: 18,
        padding: '28px 20px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 34, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: textCol, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: subCol, lineHeight: 1.8 }}>{sub}</div>
    </div>
  )
}