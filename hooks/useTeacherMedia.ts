'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AppUser } from '@/lib/auth/auth.types'
import { apiFetch } from '@/lib/auth/auth.fetch'
import type { Media, TeacherTab } from '@/lib/teacher/teacher.types'
import { getEmbedUrl } from '@/lib/teacher/teacher.utils'

interface Params {
  user: AppUser | null
  accessToken: string | null
  tab: TeacherTab
}

export function useTeacherMedia({ user, accessToken, tab }: Params) {
  const [media, setMedia] = useState<Media[]>([])
  const [openMedia, setOpenMedia] = useState<Media | null>(null)

  const [mTitle, setMTitle] = useState('')
  const [mType, setMType] = useState<'video' | 'audio'>('video')
  const [mSubject, setMSubject] = useState('')
  const [mLinkType, setMLinkType] = useState<'upload' | 'link'>('link')
  const [mUrl, setMUrl] = useState('')
  const [mFile, setMFile] = useState<File | null>(null)

  const [uploadingM, setUploadingM] = useState(false)
  const [mDone, setMDone] = useState(false)
  const [mError, setMError] = useState('')

  const reloadMedia = useCallback(async () => {
    if (!user || !accessToken) return

    try {
      setMError('')

      const res = await apiFetch(`/api/teacher-media?teacherId=${user.id}`)
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || 'فشل تحميل الوسائط')
      }

      setMedia(Array.isArray(data?.media) ? data.media : [])
    } catch (e) {
      setMedia([])
      setMError(e instanceof Error ? e.message : 'فشل تحميل الوسائط')
    }
  }, [user, accessToken])

  useEffect(() => {
    if (!user || !accessToken || tab !== 'media') return
    void reloadMedia()
  }, [user, accessToken, tab, reloadMedia])

  useEffect(() => {
    setMError('')
    if (mLinkType === 'upload') {
      setMUrl('')
    } else {
      setMFile(null)
    }
  }, [mLinkType])

  async function uploadMedia() {
    if (!user || !mTitle.trim()) return

    if (mLinkType === 'upload' && !mFile) {
      setMError('اختر ملفًا قبل الرفع')
      return
    }

    if (mLinkType === 'link' && !mUrl.trim()) {
      setMError('أدخل رابط الوسيط')
      return
    }

    setUploadingM(true)
    setMError('')

    try {
      let finalUrl = mUrl.trim()
      let embedUrl = ''

      if (mLinkType === 'upload' && mFile) {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD ?? ''
        const uploadPreset =
          process.env.NEXT_PUBLIC_CLOUDINARY_PRESET ?? 'mosaed_media'

        if (!cloudName) {
          throw new Error('اسم Cloudinary غير موجود في المتغيرات البيئية')
        }

        const formData = new FormData()
        formData.append('file', mFile)
        formData.append('upload_preset', uploadPreset)

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          {
            method: 'POST',
            body: formData,
          }
        )

        const uploadData = await uploadRes.json().catch(() => null)

        if (!uploadRes.ok) {
          throw new Error(uploadData?.error?.message || 'فشل رفع الملف')
        }

        finalUrl = uploadData?.secure_url ?? ''
        embedUrl = finalUrl
      } else {
        embedUrl = getEmbedUrl(finalUrl) ?? finalUrl
      }

      const res = await apiFetch('/api/teacher-media', {
        method: 'POST',
        body: JSON.stringify({
          teacherId: user.id,
          subjectId: mSubject || null,
          title: mTitle.trim(),
          type: mType,
          url: finalUrl,
          embedUrl,
          linkType: mLinkType,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || 'فشل رفع الوسائط')
      }

      setMDone(true)
      setMTitle('')
      setMType('video')
      setMSubject('')
      setMLinkType('link')
      setMUrl('')
      setMFile(null)

      setTimeout(() => setMDone(false), 3000)
      await reloadMedia()
    } catch (e: unknown) {
      setMError(e instanceof Error ? e.message : 'حدث خطأ')
    } finally {
      setUploadingM(false)
    }
  }

  return {
    media,
    setMedia,
    openMedia,
    setOpenMedia,

    mTitle,
    setMTitle,
    mType,
    setMType,
    mSubject,
    setMSubject,
    mLinkType,
    setMLinkType,
    mUrl,
    setMUrl,
    mFile,
    setMFile,

    uploadingM,
    mDone,
    mError,

    reloadMedia,
    uploadMedia,
  }
}