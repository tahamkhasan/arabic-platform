'use client'

import type { CSSProperties, RefObject } from 'react'
import { getEmbedUrl } from '@/lib/teacher/teacher.utils'
import type { UITheme } from '../teacher.types'
import { Banner } from '../ui/Banner'
import { Field } from '../ui/Field'
import { SectionTitle } from '../ui/SectionTitle'
import { MediaCard } from '../cards/MediaCard'
import { BRAND } from '@/lib/constants/theme'

export function MediaSection({
  ui,
  sectionCard,
  smallCard,
  inputStyle,
  ghostBtn,
  primaryBtn,
  fileRef,
  subjects,
  media,
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
  uploadMedia,
}: {
  ui: UITheme
  sectionCard: CSSProperties
  smallCard: CSSProperties
  inputStyle: CSSProperties
  ghostBtn: (active?: boolean) => CSSProperties
  primaryBtn: (enabled?: boolean) => CSSProperties
  fileRef: RefObject<HTMLInputElement | null>
  subjects: any[]
  media: any[]
  openMedia: any
  setOpenMedia: (item: any) => void
  mTitle: string
  setMTitle: (value: string) => void
  mType: 'video' | 'audio'
  setMType: (value: 'video' | 'audio') => void
  mSubject: string
  setMSubject: (value: string) => void
  mLinkType: 'link' | 'upload'
  setMLinkType: (value: 'link' | 'upload') => void
  mUrl: string
  setMUrl: (value: string) => void
  mFile: File | null
  setMFile: (file: File | null) => void
  uploadingM: boolean
  mDone: boolean
  mError: string
  uploadMedia: () => void
}) {
  return (
    <section className="fade-in" style={{ ...sectionCard, padding: 22 }}>
      <SectionTitle icon="🎥" title="الوسائط التعليمية" ui={ui} />
      {mDone ? <Banner type="success" ui={ui} text="تمت إضافة الوسائط بنجاح." /> : null}
      {mError ? <Banner type="error" ui={ui} text={mError} /> : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 30 }}>
        <Field label="📌 عنوان الوسيط" sub={ui.sub}>
          <input
            value={mTitle ?? ''}
            onChange={e => setMTitle(e.target.value)}
            placeholder="مثال: شرح بلاغي"
            style={inputStyle}
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="🎞️ النوع" sub={ui.sub}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['video', 'audio'] as const).map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMType(val)}
                  style={{ ...ghostBtn(mType === val), flex: 1 }}
                >
                  {val === 'video' ? 'فيديو' : 'صوت'}
                </button>
              ))}
            </div>
          </Field>

          <Field label="📚 المادة" sub={ui.sub}>
            <select value={mSubject ?? ''} onChange={e => setMSubject(e.target.value)} style={inputStyle}>
              <option value="">-- اختر مادة --</option>
              {subjects.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="🔗 طريقة الإدخال" sub={ui.sub}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            {(['link', 'upload'] as const).map(val => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setMLinkType(val)
                  setMUrl('')
                  setMFile(null)
                }}
                style={{ ...ghostBtn(mLinkType === val), flex: 1, minWidth: 160 }}
              >
                {val === 'link' ? 'رابط خارجي' : 'رفع ملف'}
              </button>
            ))}
          </div>

          {mLinkType === 'link' ? (
            <div>
              <input
                value={mUrl ?? ''}
                onChange={e => setMUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... أو https://vimeo.com/..."
                style={inputStyle}
              />

              {(mUrl ?? '') && getEmbedUrl(mUrl ?? '') ? (
                <div
                  style={{
                    marginTop: 12,
                    borderRadius: 14,
                    overflow: 'hidden',
                    border: `1px solid ${ui.border}`,
                  }}
                >
                  {mType === 'video' ? (
                    <iframe
                      src={getEmbedUrl(mUrl ?? '') ?? ''}
                      style={{ width: '100%', height: 220, border: 'none' }}
                      allowFullScreen
                      title="معاينة الوسيط"
                    />
                  ) : (
                    <div style={{ padding: 18 }}>
                      <audio controls src={getEmbedUrl(mUrl ?? '') ?? (mUrl ?? '')} style={{ width: '100%' }} />
                    </div>
                  )}
                </div>
              ) : null}

              <p style={{ fontSize: 12, color: ui.sub, marginTop: 8 }}>يدعم YouTube وVimeo وروابط الملفات المباشرة.</p>
            </div>
          ) : (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept={mType === 'video' ? 'video/*' : 'audio/*'}
                style={{ display: 'none' }}
                onChange={e => setMFile(e.target.files?.[0] ?? null)}
              />

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  width: '100%',
                  padding: 20,
                  borderRadius: 14,
                  border: `2px dashed ${ui.border}`,
                  background: 'transparent',
                  color: ui.sub,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontFamily: 'inherit',
                }}
              >
                {mFile ? mFile.name : mType === 'video' ? 'اختر ملف فيديو' : 'اختر ملفًا صوتيًا'}
              </button>

              {mFile ? (
                <p style={{ fontSize: 12, color: ui.sub, marginTop: 6 }}>{(mFile.size / 1024 / 1024).toFixed(1)} MB</p>
              ) : null}
            </div>
          )}
        </Field>

        <button
          type="button"
          onClick={uploadMedia}
          disabled={uploadingM || !(mTitle ?? '').trim() || (mLinkType === 'link' ? !(mUrl ?? '').trim() : !mFile)}
          style={primaryBtn(Boolean((mTitle ?? '').trim() && (mLinkType === 'link' ? (mUrl ?? '').trim() : mFile)))}
        >
          {uploadingM ? (
            <>
              <span
                style={{
                  width: 18,
                  height: 18,
                  border: '3px solid rgba(255,255,255,0.35)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              جارٍ الرفع...
            </>
          ) : (
            '⬆️ إضافة الوسيط'
          )}
        </button>
      </div>

      {media.length > 0 && (
        <div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: ui.text,
              marginBottom: 14,
              fontFamily: BRAND.fontHeading,
            }}
          >
            🎞️ المكتبة ({media.length})
          </h3>

          <div className="teacher-cards-grid">
            {media.map((m: any) => (
              <MediaCard key={m.id} item={m} ui={ui} cardStyle={smallCard} onOpen={setOpenMedia} />
            ))}
          </div>

          {openMedia ? (
            <p style={{ fontSize: 11, color: BRAND.crimson, marginTop: 10 }}>تم تحديد وسيط للمعاينة في النافذة المنبثقة.</p>
          ) : null}
        </div>
      )}
    </section>
  )
}