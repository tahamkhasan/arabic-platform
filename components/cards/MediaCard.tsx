'use client'

import type { CSSProperties } from 'react'
import { BRAND } from '@/lib/constants/theme'
import type { UITheme } from '../teacher.types'

export function MediaCard({
  item,
  ui,
  cardStyle,
  onOpen,
}: {
  item: any
  ui: UITheme
  cardStyle: CSSProperties
  onOpen: (item: any) => void
}) {
  const embed = item.embedUrl ?? item.embed_url ?? item.embedurl ?? ''
  const linkType = item.linkType ?? item.link_type ?? item.linktype ?? 'link'

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      style={{
        ...cardStyle,
        overflow: 'hidden',
        cursor: 'pointer',
        textAlign: 'right',
        fontFamily: 'inherit',
        padding: 0,
      }}
    >
      <div
        style={{
          height: 112,
          background: `${ui.themeColor}10`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
          position: 'relative',
        }}
      >
        {item.type === 'video' ? '🎥' : '🎧'}
        {linkType === 'link' && embed?.includes('youtube') ? (
          <span
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              fontSize: 10,
              background: BRAND.crimson,
              color: '#fff',
              padding: '2px 6px',
              borderRadius: 6,
              fontWeight: 700,
            }}
          >
            YouTube
          </span>
        ) : null}
      </div>

      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: ui.text, marginBottom: 4 }}>{item.title}</div>
        <div style={{ fontSize: 11, color: ui.sub }}>{item.type === 'video' ? 'فيديو' : 'صوت'}</div>
      </div>
    </button>
  )
}