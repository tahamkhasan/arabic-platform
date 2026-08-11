'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { APP, BRAND } from '@/lib/constants/theme'

type StudioOutputType =
  | 'lesson_summary'
  | 'mcq_quiz'
  | 'short_explainer_video'

type StudioSourceType = 'pdf' | 'text' | 'image' | 'video'

export default function NewStudioProjectPage() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [outputType, setOutputType] = useState<StudioOutputType | ''>('')
  const [sourceType, setSourceType] = useState<StudioSourceType | ''>('')

  const [sourceText, setSourceText] = useState('')
  const [sourceFile, setSourceFile] = useState<File | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!outputType || !sourceType) {
      setError('يجب اختيار نوع الناتج ونوع المادة المرفوعة.')
      return
    }

    if (sourceType === 'text' && !sourceText.trim()) {
      setError('الرجاء إدخال نص المادة التعليمية أولاً.')
      return
    }

    if (
      (sourceType === 'pdf' ||
        sourceType === 'image' ||
        sourceType === 'video') &&
      !sourceFile
    ) {
      setError('الرجاء اختيار ملف المادة التعليمية أولاً.')
      return
    }

    setSubmitting(true)

    try {
      // إنشاء المشروع أولاً
      const createRes = await fetch('/api/studio/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim() || undefined,
          outputType,
          sourceType,
        }),
      })

      if (!createRes.ok) {
        const data = await createRes.json().catch(() => null)
        const msg =
          data?.error ||
          'تعذر إنشاء المشروع. حاول مرة أخرى أو تواصل مع مسؤول المنصة.'
        setError(msg)
        setSubmitting(false)
        return
      }

      const createData = (await createRes.json()) as {
        project?: { id?: string }
      }

      const projectId = createData.project?.id

      if (!projectId) {
        setError('تم إنشاء المشروع لكن لم يتم استرجاع معرفه.')
        setSubmitting(false)
        return
      }

      // رفع الملف إن وجد (Word/PDF/صورة/فيديو)
      if (
        sourceFile &&
        (sourceType === 'pdf' ||
          sourceType === 'image' ||
          sourceType === 'video')
      ) {
        const formData = new FormData()
        formData.append('file', sourceFile)
        formData.append('projectId', projectId)

        const uploadRes = await fetch('/api/studio/upload-source', {
          method: 'POST',
          body: formData,
        })

        if (!uploadRes.ok) {
          const data = await uploadRes.json().catch(() => null)
          console.error('Failed to upload source file:', data?.error)
          // نخبرك بالخطأ لكن لا نمنع الانتقال لصفحة المشروع
        }
      }

      // يمكن لاحقاً إرسال النص إذا كانت المادة نصاً مكتوباً
      setSuccessMessage('تم إنشاء مشروع الاستديو بنجاح.')
      setSubmitting(false)

      router.push(`/studio/projects/${projectId}`)
    } catch (err: any) {
      console.error('Error creating studio project or uploading source:', err)
      setError('حدث خطأ غير متوقع أثناء إنشاء المشروع أو رفع المادة.')
      setSubmitting(false)
    }
  }

  function renderSourceInput() {
    if (!sourceType) return null

    if (sourceType === 'text') {
      return (
        <div>
          <label
            htmlFor="sourceText"
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: BRAND.weightSemibold,
              color: APP.textCol,
              marginBottom: 4,
            }}
          >
            نص المادة التعليمية
          </label>
          <p
            style={{
              fontSize: 12,
              color: BRAND.muted,
              marginBottom: 6,
            }}
          >
            ألصق هنا نص درس التورية أو الملخص الذي تريد أن يعمل عليه الاستديو.
          </p>
          <textarea
            id="sourceText"
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            rows={6}
            placeholder="اكتب أو ألصق نص المادة التعليمية هنا (مثلاً: نص التورية من كتاب الصف الثاني عشر)..."
            style={{
              width: '100%',
              fontSize: 14,
              paddingInline: 12,
              paddingBlock: 10,
              borderRadius: BRAND.radiusMd,
              border: `1px solid ${APP.borderCol}`,
              outline: 'none',
              resize: 'vertical',
              backgroundColor: APP.cardBg,
            }}
          />
        </div>
      )
    }

    const label =
      sourceType === 'pdf'
        ? 'ملف PDF / Word للمادة التعليمية'
        : sourceType === 'image'
        ? 'صورة (صفحة/شكل) للمادة التعليمية'
        : 'ملف فيديو قصير للمادة التعليمية'

    const accept =
      sourceType === 'pdf'
        ? '.pdf,.doc,.docx'
        : sourceType === 'image'
        ? 'image/*'
        : 'video/*'

    return (
      <div>
        <span
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: BRAND.weightSemibold,
            color: APP.textCol,
            marginBottom: 4,
          }}
        >
          {label}
        </span>
        <p
          style={{
            fontSize: 12,
            color: BRAND.muted,
            marginBottom: 6,
          }}
        >
          اختر الملف الذي يمثل المادة التعليمية لهذا المشروع (مثلاً: صفحة
          التورية من كتاب الصف الثاني عشر بصيغة Word أو PDF).
        </p>
        <input
          type="file"
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0] || null
            setSourceFile(file)
          }}
          style={{
            fontSize: 13,
          }}
        />
        {sourceFile && (
          <p
            style={{
              fontSize: 12,
              color: APP.subCol,
              marginTop: 4,
            }}
          >
            تم اختيار الملف: {sourceFile.name}
          </p>
        )}
      </div>
    )
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: '100vh',
        backgroundColor: APP.bg,
        paddingInline: BRAND.spaceLg,
        paddingBlock: BRAND.spaceLg,
        fontFamily: BRAND.fontBody,
      }}
    >
      <div
        style={{
          maxWidth: 720,
          marginInline: 'auto',
        }}
      >
        <header
          style={{
            marginBottom: BRAND.spaceMd,
          }}
        >
          <h1
            style={{
              fontSize: 26,
              fontWeight: BRAND.weightBold,
              color: APP.textCol,
              marginBottom: 8,
              fontFamily: BRAND.fontHeading,
            }}
          >
            مشروع جديد في مِداد استديو
          </h1>

          <p
            style={{
              fontSize: 15,
              color: APP.subCol,
            }}
          >
            ابدأ مشروعاً جديداً عن طريق اختيار نوع المادة التي تريد استخدامها
            ونوع الناتج الذي تريد الحصول عليه (ملخص، اختبار، أو فيديو شرح).
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: APP.cardBg,
            borderRadius: BRAND.radiusLg,
            padding: BRAND.spaceMd,
            border: `1px solid ${APP.borderCol}`,
            boxShadow: APP.shadow,
            display: 'flex',
            flexDirection: 'column',
            gap: BRAND.spaceSm,
          }}
        >
          {/* عنوان المشروع */}
          <div>
            <label
              htmlFor="title"
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: BRAND.weightSemibold,
                color: APP.textCol,
                marginBottom: 4,
              }}
            >
              عنوان المشروع (اختياري)
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: التورية صف 12 – ملخص و اختبار"
              style={{
                width: '100%',
                fontSize: 14,
                paddingInline: 12,
                paddingBlock: 10,
                borderRadius: BRAND.radiusMd,
                border: `1px solid ${APP.borderCol}`,
                outline: 'none',
                backgroundColor: '#FFFFFF',
              }}
            />
          </div>

          {/* نوع المادة */}
          <div>
            <span
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: BRAND.weightSemibold,
                color: APP.textCol,
                marginBottom: 4,
              }}
            >
              نوع المادة التي ستستخدمها
            </span>
            <p
              style={{
                fontSize: 13,
                color: BRAND.muted,
                marginBottom: 6,
              }}
            >
              يمكنك رفع ملف Word/PDF أو إدخال نص أو استخدام صورة/فيديو بحسب
              اختيارك هنا.
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setSourceType('pdf')
                  setSourceText('')
                  setSourceFile(null)
                }}
                style={{
                  paddingInline: 16,
                  paddingBlock: 8,
                  borderRadius: BRAND.radiusPill,
                  border:
                    sourceType === 'pdf'
                      ? `2px solid ${APP.accent}`
                      : `1px solid ${APP.borderCol}`,
                  backgroundColor:
                    sourceType === 'pdf'
                      ? 'rgba(198,42,68,0.08)'
                      : '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: APP.textCol,
                }}
              >
                ملف PDF / Word
              </button>

              <button
                type="button"
                onClick={() => {
                  setSourceType('text')
                  setSourceText('')
                  setSourceFile(null)
                }}
                style={{
                  paddingInline: 16,
                  paddingBlock: 8,
                  borderRadius: BRAND.radiusPill,
                  border:
                    sourceType === 'text'
                      ? `2px solid ${APP.accent}`
                      : `1px solid ${APP.borderCol}`,
                  backgroundColor:
                    sourceType === 'text'
                      ? 'rgba(198,42,68,0.08)'
                      : '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: APP.textCol,
                }}
              >
                نص مكتوب
              </button>

              <button
                type="button"
                onClick={() => {
                  setSourceType('image')
                  setSourceText('')
                  setSourceFile(null)
                }}
                style={{
                  paddingInline: 16,
                  paddingBlock: 8,
                  borderRadius: BRAND.radiusPill,
                  border:
                    sourceType === 'image'
                      ? `2px solid ${APP.accent}`
                      : `1px solid ${APP.borderCol}`,
                  backgroundColor:
                    sourceType === 'image'
                      ? 'rgba(198,42,68,0.08)'
                      : '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: APP.textCol,
                }}
              >
                صورة (صفحة/شكل)
              </button>

              <button
                type="button"
                onClick={() => {
                  setSourceType('video')
                  setSourceText('')
                  setSourceFile(null)
                }}
                style={{
                  paddingInline: 16,
                  paddingBlock: 8,
                  borderRadius: BRAND.radiusPill,
                  border:
                    sourceType === 'video'
                      ? `2px solid ${APP.accent}`
                      : `1px solid ${APP.borderCol}`,
                  backgroundColor:
                    sourceType === 'video'
                      ? 'rgba(198,42,68,0.08)'
                      : '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: APP.textCol,
                }}
              >
                فيديو قصير
              </button>
            </div>
          </div>

          {/* حقل المادة الفعلي */}
          {renderSourceInput()}

          {/* نوع الناتج */}
          <div>
            <span
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: BRAND.weightSemibold,
                color: APP.textCol,
                marginBottom: 4,
              }}
            >
              نوع الناتج الذي تريد إنشاؤه
            </span>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 10,
              }}
            >
              {/* ملخص درس */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: 10,
                  borderRadius: BRAND.radiusMd,
                  border:
                    outputType === 'lesson_summary'
                      ? `2px solid ${APP.accent}`
                      : `1px solid ${APP.borderCol}`,
                  backgroundColor:
                    outputType === 'lesson_summary'
                      ? 'rgba(198,42,68,0.08)'
                      : '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="outputType"
                  value="lesson_summary"
                  checked={outputType === 'lesson_summary'}
                  onChange={() => setOutputType('lesson_summary')}
                  style={{ marginTop: 4 }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: BRAND.weightSemibold,
                      color: APP.textCol,
                    }}
                  >
                    ملخص درس
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: BRAND.muted,
                    }}
                  >
                    استخراج ملخص منظم من المادة لتستخدمه في الشرح أو المراجعة.
                  </div>
                </div>
              </label>

              {/* اختبار (اختيار من متعدد) */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: 10,
                  borderRadius: BRAND.radiusMd,
                  border:
                    outputType === 'mcq_quiz'
                      ? `2px solid ${APP.accent}`
                      : `1px solid ${APP.borderCol}`,
                  backgroundColor:
                    outputType === 'mcq_quiz'
                      ? 'rgba(198,42,68,0.08)'
                      : '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="outputType"
                  value="mcq_quiz"
                  checked={outputType === 'mcq_quiz'}
                  onChange={() => setOutputType('mcq_quiz')}
                  style={{ marginTop: 4 }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: BRAND.weightSemibold,
                      color: APP.textCol,
                    }}
                  >
                    اختبار (اختيار من متعدد)
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: BRAND.muted,
                    }}
                  >
                    توليد أسئلة واختيارات مبنية على نفس المادة التعليمية.
                  </div>
                </div>
              </label>

              {/* فيديو شرح مختصر */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: 10,
                  borderRadius: BRAND.radiusMd,
                  border:
                    outputType === 'short_explainer_video'
                      ? `2px solid ${APP.accent}`
                      : `1px solid ${APP.borderCol}`,
                  backgroundColor:
                    outputType === 'short_explainer_video'
                      ? 'rgba(198,42,68,0.08)'
                      : '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="outputType"
                  value="short_explainer_video"
                  checked={outputType === 'short_explainer_video'}
                  onChange={() => setOutputType('short_explainer_video')}
                  style={{ marginTop: 4 }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: BRAND.weightSemibold,
                      color: APP.textCol,
                    }}
                  >
                    فيديو شرح مختصر
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: BRAND.muted,
                    }}
                  >
                    تجهيز فيديو شرح قصير من المادة، مع معالجة لاحقة للفيديو.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* رسائل */}
          {error && (
            <p
              style={{
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
                fontSize: 13,
                color: '#2F855A',
              }}
            >
              {successMessage}
            </p>
          )}

          {/* أزرار الإرسال */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              gap: 8,
              marginTop: 4,
            }}
          >
            <button
              type="submit"
              disabled={submitting}
              style={{
                paddingInline: 20,
                paddingBlock: 10,
                borderRadius: BRAND.radiusPill,
                border: 'none',
                cursor: submitting ? 'default' : 'pointer',
                backgroundImage: APP.btnBlue,
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: BRAND.weightBold,
                fontFamily: BRAND.fontHeading,
                boxShadow: APP.btnGlow,
              }}
            >
              {submitting ? 'جاري إنشاء المشروع...' : 'إنشاء المشروع'}
            </button>

            <button
              type="button"
              onClick={() => router.push('/studio')}
              style={{
                paddingInline: 16,
                paddingBlock: 9,
                borderRadius: BRAND.radiusPill,
                border: `1px solid ${APP.borderCol}`,
                cursor: 'pointer',
                backgroundColor: '#FFFFFF',
                color: APP.textCol,
                fontSize: 14,
                fontFamily: BRAND.fontBody,
              }}
            >
              إلغاء والعودة للاستديو
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}