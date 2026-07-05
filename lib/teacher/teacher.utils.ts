export function getEmbedUrl(url: string): string | null {
  if (!url) return null

  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`

  if (url.match(/\.(mp4|webm|ogg)$/i)) return url

  return url
}

export function fmtDateShort(date?: string | null) {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleDateString('ar-KW', {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return '—'
  }
}

export function fmtDateTime(date?: string | null) {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleDateString('ar-KW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}