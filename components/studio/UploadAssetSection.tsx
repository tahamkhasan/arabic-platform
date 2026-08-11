'use client'

import { useState } from 'react'

type UploadAssetSectionProps = {
  projectId: string
}

export function UploadAssetSection({ projectId }: UploadAssetSectionProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!file) {
      setError('الرجاء اختيار ملف قبل الرفع.')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('projectId', projectId)
      formData.append('file', file)

      const res = await fetch('/api/studio/uploads', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        const msg =
          data?.error ||
          'تعذر رفع المادة. حاول مرة أخرى أو تواصل مع مسؤول المنصة.'
        setError(msg)
        setUploading(false)
        return
      }

      setSuccessMessage('تم رفع المادة بنجاح، وتم تحديث حالة المشروع.')
      setUploading(false)
      // يمكن لاحقاً إعادة تحميل الصفحة أو تحديث الحالة داخلياً
    } catch (err: any) {
      console.error('Error uploading studio asset:', err)
      setError('حدث خطأ غير متوقع أثناء رفع المادة.')
      setUploading(false)
    }
  }

  return (
    <section
      aria-label="رفع المادة للمشروع"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        border: '1px solid #E2E8F0',
        marginTop: 16,
        boxShadow: '0 2px 4px rgba(15, 23, 42, 0.04)',
      }}
    >
      <h2
        style={{
          fontFamily: 'Calibri, system-ui, -apple-system, BlinkMacSystemFont',
          fontSize: 15,
          fontWeight: 700,
          color: '#2D3748',
          marginBottom: 8,
        }}
      >
        رفع المادة التعليمية لهذا المشروع
      </h2>

      <p
        style={{
          fontFamily: 'Calibri, system-ui, -apple-system, BlinkMacSystemFont',
          fontSize: 13,
          color: '#4A5568',
          marginBottom: 8,
        }}
      >
        اختر ملف الدرس (PDF، صورة، أو فيديو قصير) ليتم ربطه بهذا المشروع،
        ثم سيتم استخدامه لاحقاً في التلخيص أو توليد الاختبار أو إعداد الفيديو.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <input
          type="file"
          onChange={(e) => {
            const selected = e.target.files?.[0] ?? null
            setFile(selected)
            setError(null)
            setSuccessMessage(null)
          }}
          style={{
            fontFamily: 'Calibri, system-ui, -apple-system, BlinkMacSystemFont',
            fontSize: 13,
          }}
        />

        {error && (
          <p
            style={{
              fontFamily:
                'Calibri, system-ui, -apple-system, BlinkMacSystemFont',
              fontSize: 13,
              color: '#C53030',
            }}
          >
            {error}
          </p>
        )}

        {successMessage && (
          <p
            style={{
              fontFamily:
                'Calibri, system-ui, -apple-system, BlinkMacSystemFont',
              fontSize: 13,
              color: '#2F855A',
            }}
          >
            {successMessage}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 4,
          }}
        >
          <button
            type="submit"
            disabled={uploading}
            style={{
              fontFamily:
                'Calibri, system-ui, -apple-system, BlinkMacSystemFont',
              paddingInline: 18,
              paddingBlock: 9,
              borderRadius: 999,
              border: 'none',
              cursor: uploading ? 'default' : 'pointer',
              backgroundColor: uploading ? '#A0AEC0' : '#4C8DFF',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 600,
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            }}
          >
            {uploading ? 'جاري رفع المادة...' : 'رفع المادة'}
          </button>
        </div>
      </form>
    </section>
  )
}