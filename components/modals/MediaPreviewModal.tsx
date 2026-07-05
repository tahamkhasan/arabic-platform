'use client'

import { BaseModal } from './BaseModal'
import type { UITheme } from '../teacher.types'

export function MediaPreviewModal({
  ui,
  openMedia,
  onClose,
  ghostBtn,
}: {
  ui: UITheme
  openMedia: any
  onClose: () => void
  ghostBtn: (active?: boolean) => React.CSSProperties
}) {
  if (!openMedia) return null

  const mediaAny: any = openMedia
  const embed = mediaAny.embedUrl ?? mediaAny.embed_url ?? mediaAny.embedurl ?? ''
  const fallback = mediaAny.url ?? ''

  return (
    <BaseModal
      ui={ui}
      title={openMedia.title}
      subtitle={openMedia.type === 'video' ? 'فيديو' : 'صوت'}
      onClose={onClose}
      maxWidth={860}
      headerActions={
        <button type="button" onClick={onClose} style={ghostBtn(false)}>
          إغلاق
        </button>
      }
    >
      {openMedia.type === 'video' ? (
        embed?.includes('youtube') || embed?.includes('vimeo') ? (
          <iframe
            src={embed}
            style={{ width: '100%', height: 420, border: 'none', borderRadius: 16 }}
            allowFullScreen
            title={openMedia.title}
          />
        ) : (
          <video controls src={embed || fallback} style={{ width: '100%', borderRadius: 16, background: '#000' }} />
        )
      ) : (
        <audio controls src={embed || fallback} style={{ width: '100%' }} />
      )}
    </BaseModal>
  )
}