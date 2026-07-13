'use client'
import { useEffect, useState } from 'react'
import type { User, Media, Tab } from '@/types/student.types'

export function useStudentMedia(user: User | null, tab: Tab) {
  const [media, setMedia] = useState<Media[]>([])
  const [openMedia, setOpenMedia] = useState<Media | null>(null)

  useEffect(() => {
    if (!user || tab !== 'media') return
    fetch(`/api/teacher-media?studentId=${user.id}`)
      .then(r => r.json())
      .then(d => setMedia(d.media ?? []))
      .catch(() => setMedia([]))
  }, [user, tab])

  return { media, openMedia, setOpenMedia }
}