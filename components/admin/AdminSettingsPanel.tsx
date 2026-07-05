'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'

type Props = {
  initialLogoUrl?: string
  onLogoUpdated?: (url: string) => void
}

const T = {
  cardBg: BRAND.bgSoft,
  textCol: BRAND.text,
  subCol: BRAND.sub,
  borderCol: BRAND.border,
  inputBg: 'rgba(140,20,40,0.04)',
  shadow: BRAND.shadow,
}

export default function AdminSettingsPanel({
  initialLogoUrl = '/logo-midad.png',
  onLogoUpdated,
}: Props) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const logoInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setLogoUrl(initialLogoUrl || '/logo-midad.png')
  }, [initialLogoUrl])

  const previewUrl = useMemo(() => {
    if (!logoFile) return null
    return URL.createObjectURL(logoFile)
  }, [logoFile])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function uploadLogo() {
    if (!logoFile) return

    setUploading(true)
    setUploadMsg('')

    try {
      const form = new FormData()
      form.append('logo', logoFile)

      const res = await fetch('/api/platform-settings/logo', {
        method: 'POST',
        body: form,
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setUploadMsg(`❌ ${data?.error || 'فشل رفع الشعار'}`)
        return
      }

      const nextUrl = data?.url || logoUrl
      setLogoUrl(nextUrl)
      setLogoFile(null)
      setUploadMsg('✅ تم رفع الشعار بنجاح!')
      if (logoInputRef.current) logoInputRef.current.value = ''
      onLogoUpdated?.(nextUrl)
    } catch {
      setUploadMsg('❌ فشل الاتصال')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className="fade-in"
      style={{
        background: 'rgba(255,255,255,0.72)',
        borderRadius: BRAND.radiusXl,
        border: `1px solid ${T.borderCol}`,
        padding: 28,
        maxWidth: 560,
        boxShadow: T.shadow,
      }}
    >
      <h3
        style={{
          fontSize: 16,
          fontWeight: BRAND.weightBlack,
          fontFamily: BRAND.fontHeading,
          color: T.textCol,
          marginBottom: 20,
        }}
      >
        🖼️ شعار المنصة
      </h3>

      <div
        style={{
          textAlign: 'center',
          marginBottom: 22,
          padding: 22,
          borderRadius: BRAND.radiusMd,
          background: T.inputBg,
          border: `1px dashed ${T.borderCol}`,
        }}
      >
        <img
          src={logoUrl}
          alt="الشعار الحالي"
          style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain', margin: '0 auto' }}
          onError={e => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
        <p style={{ fontSize: 12, color: T.subCol, marginTop: 8 }}>الشعار الحالي</p>
      </div>

      <input
        ref={logoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        style={{ display: 'none' }}
        onChange={e => {
          setLogoFile(e.target.files?.[0] ?? null)
          setUploadMsg('')
        }}
      />

      <button
        onClick={() => logoInputRef.current?.click()}
        style={{
          width: '100%',
          padding: 16,
          borderRadius: BRAND.radiusMd,
          border: `2px dashed ${logoFile ? BRAND.crimson : T.borderCol}`,
          background: logoFile ? 'rgba(140,20,40,0.06)' : 'transparent',
          color: logoFile ? BRAND.crimson : T.subCol,
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: BRAND.weightBold,
          fontFamily: 'inherit',
          marginBottom: 14,
        }}
      >
        {logoFile ? `✅ ${logoFile.name}` : '📁 اختر صورة الشعار (PNG أو JPG أو WEBP أو SVG)'}
      </button>

      {logoFile && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 14px',
            borderRadius: BRAND.radiusSm,
            background: 'rgba(140,20,40,0.05)',
            border: `1px solid ${T.borderCol}`,
            fontSize: 13,
            color: T.subCol,
          }}
        >
          <div style={{ marginBottom: 8 }}>📦 {(logoFile.size / 1024).toFixed(1)} KB</div>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="معاينة"
              style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain', borderRadius: 8 }}
            />
          )}
        </div>
      )}

      {uploadMsg && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: BRAND.radiusSm,
            marginBottom: 14,
            fontSize: 14,
            fontWeight: BRAND.weightBold,
            background: 'rgba(140,20,40,0.10)',
            border: '1px solid rgba(140,20,40,0.3)',
            color: BRAND.crimson,
          }}
        >
          {uploadMsg}
        </div>
      )}

      <Button variant="primary" fullWidth disabled={uploading || !logoFile} onClick={uploadLogo}>
        {uploading ? 'جارٍ الرفع...' : '🚀 رفع الشعار الجديد'}
      </Button>

      <p style={{ fontSize: 12, color: T.subCol, marginTop: 12, textAlign: 'center' }}>
        PNG شفاف • أبعاد مثالية 300×150 • أقل من 2MB
      </p>
    </div>
  )
}