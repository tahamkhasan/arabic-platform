'use client'

import {
  ChangeEvent,
  FormEvent,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BRAND } from '@/lib/constants/theme'
import { supabase } from '@/lib/supabase'

type MaterialType = 'file' | 'text' | 'image' | 'video'
type OutputType = 'summary' | 'quiz' | 'video'

type SelectedMaterial = {
  id: string
  title: string
  description: string | null
  file_url: string | null
  file_path: string | null
  file_name: string | null
  mime_type: string | null
  material_scope: string | null
}

const ACCEPTED_FILE_TYPES =
  '.pdf,.doc,.docx,.txt,.rtf,.ppt,.pptx,.xls,.xlsx'

function getOutputLabel(type: OutputType): string {
  const labels: Record<OutputType, string> = {
    summary: 'ملخص درس',
    quiz: 'اختبار اختيار من متعدد',
    video: 'فيديو شرح مختصر',
  }

  return labels[type]
}

function getApiOutputType(type: OutputType): string {
  const types: Record<OutputType, string> = {
    summary: 'lesson_summary',
    quiz: 'mcq_quiz',
    video: 'short_explainer_video',
  }

  return types[type]
}

function getApiSourceType(type: MaterialType): string {
  const types: Record<MaterialType, string> = {
    file: 'pdf',
    text: 'text',
    image: 'image',
    video: 'video',
  }

  return types[type]
}

function getMaterialTypeLabel(type: MaterialType): string {
  const labels: Record<MaterialType, string> = {
    file: 'ملف PDF / Word',
    text: 'نص مكتوب',
    image: 'صورة (صفحة/شكل)',
    video: 'فيديو قصير',
  }

  return labels[type]
}

function getFileName(file: File | null): string {
  return file?.name || ''
}

function StudioProjectLoading() {
  return (
    <main
      dir="rtl"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: BRAND.bg,
        color: BRAND.text,
        fontFamily: BRAND.fontBody,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          padding: '28px 24px',
          borderRadius: 20,
          background: BRAND.bgCard,
          border: `1px solid ${BRAND.border}`,
          boxShadow: BRAND.shadow,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            margin: '0 auto 14px',
            borderRadius: '50%',
            border: `4px solid ${BRAND.border}`,
            borderTopColor: BRAND.crimson,
            animation: 'studio-spin 0.8s linear infinite',
          }}
        />

        <p
          style={{
            margin: 0,
            color: BRAND.muted,
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          جارٍ تجهيز مشروع الاستديو...
        </p>
      </div>

      <style>{`
        @keyframes studio-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  )
}

function NewStudioProjectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const subjectId = searchParams.get('subjectId') || ''
  const subjectName = searchParams.get('subjectName') || ''
  const stage = searchParams.get('stage') || ''
  const grade = searchParams.get('grade') || ''
  const track = searchParams.get('track') || ''
  const semester = searchParams.get('semester') || ''
  const unitId = searchParams.get('unitId') || ''
  const unitName = searchParams.get('unitName') || ''
  const lessonId = searchParams.get('lessonId') || ''
  const lessonName = searchParams.get('lessonName') || ''

  const materialIds = useMemo(() => {
    const rawIds = searchParams.get('materialIds') || ''

    return rawIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
  }, [searchParams])

  const [projectTitle, setProjectTitle] = useState('')
  const [materialType, setMaterialType] = useState<MaterialType>('file')
  const [outputType, setOutputType] = useState<OutputType>('summary')
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourceText, setSourceText] = useState('')
  const [selectedMaterials, setSelectedMaterials] = useState<
    SelectedMaterial[]
  >([])
  const [loadingMaterials, setLoadingMaterials] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const contextLine = [
    subjectName,
    stage,
    grade,
    track,
    semester,
    unitName,
    lessonName,
  ]
    .filter(Boolean)
    .join(' ← ')

  useEffect(() => {
    async function loadSelectedMaterials() {
      if (materialIds.length === 0) {
        setSelectedMaterials([])
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        router.replace('/login')
        return
      }

      setLoadingMaterials(true)
      setError(null)

      try {
        const params = new URLSearchParams()

        if (subjectId) params.set('subjectId', subjectId)
        if (stage) params.set('stage', stage)
        if (grade) params.set('grade', grade)
        if (track) params.set('track', track)
        if (semester) params.set('semester', semester)
        if (unitId) params.set('unitId', unitId)
        if (lessonId) params.set('lessonId', lessonId)

        const response = await fetch(
          `/api/subject-materials?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        )

        const data = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(
            data?.error || 'تعذر تحميل ملفات المصدر المختارة.'
          )
        }

        const allMaterials = Array.isArray(data?.materials)
          ? data.materials
          : []

        const matchingMaterials = allMaterials.filter(
          (material: SelectedMaterial) => materialIds.includes(material.id)
        )

        if (matchingMaterials.length === 0) {
          throw new Error(
            'تعذر العثور على ملف المصدر المختار. عد إلى صفحة المحتوى واختر الملف مرة أخرى.'
          )
        }

        setSelectedMaterials(matchingMaterials)

        setProjectTitle((currentTitle) => {
          if (currentTitle.trim()) {
            return currentTitle
          }

          const firstTitle =
            matchingMaterials[0]?.title ||
            matchingMaterials[0]?.file_name ||
            lessonName ||
            'مشروع تعليمي جديد'

          return `${getOutputLabel(outputType)}: ${firstTitle}`
        })
      } catch (loadError: unknown) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : 'حدث خطأ أثناء تحميل ملفات المصدر.'

        setError(message)
      } finally {
        setLoadingMaterials(false)
      }
    }

    void loadSelectedMaterials()
  }, [
    grade,
    lessonId,
    lessonName,
    materialIds,
    outputType,
    router,
    semester,
    stage,
    subjectId,
    track,
    unitId,
  ])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null

    setSourceFile(file)
    setError(null)
    setSuccess(null)

    if (file) {
      setProjectTitle((currentTitle) => {
        if (currentTitle.trim()) {
          return currentTitle
        }

        return `${getOutputLabel(outputType)}: ${file.name}`
      })
    }
  }

  function selectMaterialType(type: MaterialType) {
    setMaterialType(type)
    setError(null)
    setSuccess(null)

    if (type === 'text') {
      setSourceFile(null)
    }

    if (type !== 'text') {
      setSourceText('')
    }
  }

  function selectOutputType(type: OutputType) {
    setOutputType(type)
    setError(null)
    setSuccess(null)

    setProjectTitle((currentTitle) => {
      const sourceTitle =
        selectedMaterials[0]?.title ||
        selectedMaterials[0]?.file_name ||
        sourceFile?.name ||
        lessonName

      if (!sourceTitle) {
        return currentTitle
      }

      const knownPrefixes = [
        'ملخص درس:',
        'اختبار اختيار من متعدد:',
        'فيديو شرح مختصر:',
      ]

      const normalizedTitle = currentTitle.trim()

      const alreadyAutoGenerated = knownPrefixes.some((prefix) =>
        normalizedTitle.startsWith(prefix)
      )

      if (!normalizedTitle || alreadyAutoGenerated) {
        return `${getOutputLabel(type)}: ${sourceTitle}`
      }

      return currentTitle
    })
  }

  async function uploadNewSource(
    projectId: string,
    accessToken: string
  ): Promise<void> {
    if (materialType === 'text') {
      const trimmedText = sourceText.trim()

      if (!trimmedText) {
        throw new Error('اكتب نص المادة التعليمية أولًا.')
      }

      const response = await fetch('/api/studio/upload-source', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          project_id: projectId,
          sourceType: 'text',
          source_type: 'text',
          sourceText: trimmedText,
          source_text: trimmedText,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || 'تعذر حفظ النص المصدر.')
      }

      return
    }

    if (!sourceFile) {
      throw new Error('الرجاء اختيار ملف المادة التعليمية أولًا.')
    }

    const formData = new FormData()
    const apiSourceType = getApiSourceType(materialType)

    formData.append('projectId', projectId)
    formData.append('project_id', projectId)
    formData.append('sourceType', apiSourceType)
    formData.append('source_type', apiSourceType)
    formData.append('file', sourceFile)

    const response = await fetch('/api/studio/upload-source', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(data?.error || 'تعذر رفع ملف المصدر.')
    }
  }

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError(null)
    setSuccess(null)

    const cleanTitle = projectTitle.trim()

    if (!cleanTitle) {
      setError('اكتب عنوان المشروع أولًا.')
      return
    }

    const hasExistingMaterials = selectedMaterials.length > 0
    const hasNewTextSource =
      materialType === 'text' && sourceText.trim().length > 0
    const hasNewFileSource =
      materialType !== 'text' && sourceFile instanceof File

    if (!hasExistingMaterials && !hasNewTextSource && !hasNewFileSource) {
      setError(
        'الرجاء اختيار ملف مصدر من صفحة المحتوى أو رفع ملف جديد أو إدخال النص أولًا.'
      )
      return
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      router.replace('/login')
      return
    }

    setCreating(true)

    try {
      const apiOutputType = getApiOutputType(outputType)
      const selectedMaterialIds = selectedMaterials.map(
        (material) => material.id
      )

      const effectiveSourceType = hasExistingMaterials
        ? 'pdf'
        : getApiSourceType(materialType)

      const response = await fetch('/api/studio/projects', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: cleanTitle,

          outputType: apiOutputType,
          sourceType: effectiveSourceType,

          output_type: apiOutputType,
          source_type: effectiveSourceType,

          subjectId: subjectId || null,
          subjectName: subjectName || null,
          stage: stage || null,
          grade: grade || null,
          track: track || null,
          semester: semester || null,
          unitId: unitId || null,
          unitName: unitName || null,
          lessonId: lessonId || null,
          lessonName: lessonName || null,

          materialIds: selectedMaterialIds,

          subject_id: subjectId || null,
          subject_name: subjectName || null,
          unit_id: unitId || null,
          unit_name: unitName || null,
          lesson_id: lessonId || null,
          lesson_name: lessonName || null,
          material_ids: selectedMaterialIds,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || 'تعذر إنشاء المشروع.')
      }

      const projectId = data?.project?.id || data?.id

      if (!projectId || typeof projectId !== 'string') {
        throw new Error('تم إنشاء المشروع دون العثور على معرّفه.')
      }

      if (!hasExistingMaterials) {
        await uploadNewSource(projectId, session.access_token)
      }

      setSuccess('تم إنشاء المشروع بنجاح. جارٍ فتح صفحة المشروع...')

      router.push(`/studio/projects/${projectId}`)
    } catch (createError: unknown) {
      const message =
        createError instanceof Error
          ? createError.message
          : 'حدث خطأ غير متوقع أثناء إنشاء المشروع.'

      console.error('Studio project creation error:', createError)
      setError(message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: BRAND.bg,
        color: BRAND.text,
        fontFamily: BRAND.fontBody,
        padding: '40px 20px',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 920,
          margin: '0 auto',
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 24,
          }}
        >
          <div style={{ maxWidth: 720 }}>
            <h1
              style={{
                margin: 0,
                color: BRAND.text,
                fontFamily: BRAND.fontHeading,
                fontSize: 30,
                fontWeight: 900,
              }}
            >
              مشروع جديد في مداد استديو
            </h1>

            <p
              style={{
                margin: '10px 0 0',
                maxWidth: 760,
                color: BRAND.muted,
                fontSize: 15,
                lineHeight: 1.9,
              }}
            >
              أنشئ مشروعًا جديدًا عبر اختيار المادة التعليمية ونوع الناتج الذي
              تريد الحصول عليه، ثم أكمل التوليد من صفحة المشروع مباشرة.
            </p>
          </div>

          <button
            type="button"
            disabled={creating}
            onClick={() => router.push('/studio')}
            style={{
              padding: '12px 18px',
              border: `1px solid ${BRAND.border}`,
              borderRadius: 999,
              background: '#FFFFFF',
              color: BRAND.text,
              cursor: creating ? 'not-allowed' : 'pointer',
              fontFamily: BRAND.fontBody,
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            العودة إلى الاستديو
          </button>
        </header>

        {contextLine ? (
          <div
            style={{
              marginBottom: 18,
              padding: '13px 15px',
              borderRadius: 14,
              background: 'rgba(37, 99, 235, 0.08)',
              border: '1px solid rgba(37, 99, 235, 0.18)',
              color: BRAND.text,
              fontSize: 13,
              lineHeight: 1.9,
            }}
          >
            <strong>سياق المشروع:</strong> {contextLine}
          </div>
        ) : null}

        <form
          onSubmit={handleCreateProject}
          style={{
            border: `1px solid ${BRAND.border}`,
            borderRadius: 22,
            background: BRAND.bgCard,
            boxShadow: BRAND.shadow,
            padding: '26px 20px',
          }}
        >
          {error ? (
            <div
              role="alert"
              style={{
                marginBottom: 18,
                padding: '13px 15px',
                borderRadius: 12,
                border: '1px solid #FEB2B2',
                background: '#FFF5F5',
                color: '#9B2C2C',
                fontSize: 14,
                lineHeight: 1.8,
              }}
            >
              {error}
            </div>
          ) : null}

          {success ? (
            <div
              style={{
                marginBottom: 18,
                padding: '13px 15px',
                borderRadius: 12,
                border: '1px solid #9AE6B4',
                background: '#F0FFF4',
                color: '#276749',
                fontSize: 14,
                lineHeight: 1.8,
              }}
            >
              {success}
            </div>
          ) : null}

          <label
            style={{
              display: 'block',
              marginBottom: 22,
            }}
          >
            <span
              style={{
                display: 'block',
                marginBottom: 8,
                color: BRAND.text,
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              عنوان المشروع
            </span>

            <input
              value={projectTitle}
              onChange={(event) => setProjectTitle(event.target.value)}
              placeholder="مثال: اختبار درس النفر الثلاثة"
              disabled={creating}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '14px 16px',
                border: `1px solid ${BRAND.border}`,
                borderRadius: 14,
                background: '#FFFFFF',
                color: BRAND.text,
                fontFamily: BRAND.fontBody,
                fontSize: 15,
                outline: 'none',
              }}
            />
          </label>

          <section style={{ marginBottom: 24 }}>
            <h2
              style={{
                margin: '0 0 8px',
                fontFamily: BRAND.fontHeading,
                fontSize: 18,
                fontWeight: 900,
              }}
            >
              نوع المادة التي ستستخدمها
            </h2>

            <p
              style={{
                margin: '0 0 14px',
                color: BRAND.muted,
                fontSize: 13,
                lineHeight: 1.8,
              }}
            >
              يمكنك الاعتماد على ملف محدد من صفحة المحتوى، أو إدخال نص مباشر، أو
              رفع ملف جديد أو صورة أو فيديو بحسب المادة المتاحة لديك.
            </p>

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              {(
                [
                  ['file', 'ملف Word / PDF'],
                  ['text', 'نص مكتوب'],
                  ['image', 'صورة (صفحة/شكل)'],
                  ['video', 'فيديو قصير'],
                ] as const
              ).map(([type, label]) => {
                const isActive = materialType === type

                return (
                  <button
                    key={type}
                    type="button"
                    disabled={creating}
                    onClick={() => selectMaterialType(type)}
                    style={{
                      padding: '11px 18px',
                      borderRadius: 999,
                      border: `2px solid ${
                        isActive ? BRAND.crimson : BRAND.border
                      }`,
                      background: isActive
                        ? 'rgba(150, 30, 45, 0.08)'
                        : '#FFFFFF',
                      color: isActive ? BRAND.crimson : BRAND.text,
                      cursor: creating ? 'not-allowed' : 'pointer',
                      fontFamily: BRAND.fontBody,
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </section>

          {loadingMaterials ? (
            <div
              style={{
                marginBottom: 20,
                padding: 14,
                borderRadius: 14,
                background: 'rgba(37, 99, 235, 0.06)',
                color: BRAND.muted,
                fontSize: 14,
              }}
            >
              جارٍ تحميل ملف المصدر المختار...
            </div>
          ) : null}

          {selectedMaterials.length > 0 ? (
            <section
              style={{
                marginBottom: 22,
                padding: 16,
                borderRadius: 16,
                border: '1px solid rgba(37, 99, 235, 0.30)',
                background: 'rgba(37, 99, 235, 0.06)',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  color: '#2563EB',
                  marginBottom: 8,
                  fontSize: 15,
                }}
              >
                ملفات المصدر المختارة من صفحة المحتوى
              </strong>

              {selectedMaterials.map((material, index) => (
                <div
                  key={material.id}
                  style={{
                    padding: '10px 0',
                    borderBottom:
                      index === selectedMaterials.length - 1
                        ? 'none'
                        : '1px solid rgba(37, 99, 235, 0.16)',
                    color: BRAND.text,
                    fontSize: 14,
                  }}
                >
                  {material.title || material.file_name || 'ملف مصدر'}

                  <span
                    style={{
                      display: 'block',
                      marginTop: 4,
                      color: BRAND.muted,
                      fontSize: 12,
                    }}
                  >
                    {material.file_name || 'ملف مرتبط بالمادة'}
                  </span>
                </div>
              ))}
            </section>
          ) : null}

          {materialType === 'text' ? (
            <label
              style={{
                display: 'block',
                marginBottom: 24,
              }}
            >
              <span
                style={{
                  display: 'block',
                  marginBottom: 8,
                  color: BRAND.text,
                  fontSize: 15,
                  fontWeight: 800,
                }}
              >
                نص المادة التعليمية
              </span>

              <textarea
                value={sourceText}
                disabled={creating}
                onChange={(event) => setSourceText(event.target.value)}
                placeholder="الصق نص الدرس أو المادة التعليمية هنا..."
                rows={10}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  padding: '14px 16px',
                  border: `1px solid ${BRAND.border}`,
                  borderRadius: 14,
                  background: '#FFFFFF',
                  color: BRAND.text,
                  fontFamily: BRAND.fontBody,
                  fontSize: 15,
                  lineHeight: 1.9,
                  outline: 'none',
                }}
              />
            </label>
          ) : (
            <label
              style={{
                display: 'block',
                marginBottom: 24,
              }}
            >
              <span
                style={{
                  display: 'block',
                  marginBottom: 8,
                  color: BRAND.text,
                  fontSize: 15,
                  fontWeight: 800,
                }}
              >
                {getMaterialTypeLabel(materialType)}
              </span>

              <input
                type="file"
                disabled={creating || selectedMaterials.length > 0}
                accept={
                  materialType === 'file'
                    ? ACCEPTED_FILE_TYPES
                    : materialType === 'image'
                      ? 'image/*'
                      : 'video/*'
                }
                onChange={handleFileChange}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px',
                  border: `1px solid ${BRAND.border}`,
                  borderRadius: 14,
                  background: '#FFFFFF',
                  color: BRAND.text,
                  fontFamily: BRAND.fontBody,
                  fontSize: 14,
                }}
              />

              <p
                style={{
                  margin: '8px 0 0',
                  color: BRAND.muted,
                  fontSize: 12,
                  lineHeight: 1.8,
                }}
              >
                {sourceFile
                  ? `الملف المحدد: ${getFileName(sourceFile)}`
                  : selectedMaterials.length > 0
                    ? 'سيُستخدم ملف المصدر المحدد سابقًا تلقائيًا، ولرفع ملف جديد عد أولًا إلى صفحة المحتوى أو أنشئ مشروعًا بلا ملفات مختارة.'
                    : 'اختر ملفًا جديدًا إذا لم تكن قد اخترت ملف مصدر سابقًا.'}
              </p>
            </label>
          )}

          <section style={{ marginBottom: 24 }}>
            <h2
              style={{
                margin: '0 0 14px',
                fontFamily: BRAND.fontHeading,
                fontSize: 18,
                fontWeight: 900,
              }}
            >
              نوع الناتج الذي تريد إنشاؤه
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: 12,
              }}
            >
              {(
                [
                  [
                    'summary',
                    'ملخص درس',
                    'استخراج ملخص منظم من المادة لاستخدامه في الشرح أو المراجعة.',
                  ],
                  [
                    'quiz',
                    'اختبار اختيار من متعدد',
                    'توليد أسئلة اختبار مبنية على المادة التعليمية مع إمكانية تعديلها لاحقًا.',
                  ],
                  [
                    'video',
                    'فيديو شرح مختصر',
                    'تجهيز سيناريو أولي أو مخرج تمهيدي لفيديو تعليمي مختصر.',
                  ],
                ] as const
              ).map(([type, title, description]) => {
                const isActive = outputType === type

                return (
                  <button
                    key={type}
                    type="button"
                    disabled={creating}
                    onClick={() => selectOutputType(type)}
                    style={{
                      textAlign: 'right',
                      padding: 16,
                      borderRadius: 16,
                      border: `2px solid ${
                        isActive ? BRAND.crimson : BRAND.border
                      }`,
                      background: isActive
                        ? 'rgba(150, 30, 45, 0.08)'
                        : '#FFFFFF',
                      color: BRAND.text,
                      cursor: creating ? 'not-allowed' : 'pointer',
                      fontFamily: BRAND.fontBody,
                    }}
                  >
                    <strong
                      style={{
                        display: 'block',
                        marginBottom: 7,
                        color: isActive ? BRAND.crimson : BRAND.text,
                        fontSize: 15,
                      }}
                    >
                      {title}
                    </strong>

                    <span
                      style={{
                        display: 'block',
                        color: BRAND.muted,
                        fontSize: 12,
                        lineHeight: 1.8,
                      }}
                    >
                      {description}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section
            style={{
              marginBottom: 24,
              padding: '14px 16px',
              borderRadius: 14,
              background: 'rgba(148, 163, 184, 0.08)',
              border: '1px solid rgba(148, 163, 184, 0.20)',
              color: BRAND.text,
              fontSize: 13,
              lineHeight: 1.9,
            }}
          >
            <strong>ملاحظات مهمة:</strong>
            <div style={{ marginTop: 6 }}>
              - إذا كنت قد اخترت ملفات من صفحة المحتوى، فسيتم ربط المشروع بها
              مباشرة عند الإنشاء.
            </div>
            <div>
              - إذا لم تختر ملفات مسبقًا، يمكنك رفع ملف جديد أو إدخال النص
              مباشرة من هذه الصفحة.
            </div>
            <div>
              - بعد إنشاء المشروع ستنتقل مباشرة إلى صفحة التفاصيل لإكمال
              التوليد أو التحرير.
            </div>
          </section>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
              flexWrap: 'wrap',
              paddingTop: 8,
            }}
          >
            <button
              type="button"
              disabled={creating}
              onClick={() => router.push('/studio')}
              style={{
                padding: '14px 22px',
                border: `1px solid ${BRAND.border}`,
                borderRadius: 999,
                background: '#FFFFFF',
                color: BRAND.text,
                cursor: creating ? 'not-allowed' : 'pointer',
                fontFamily: BRAND.fontHeading,
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              إلغاء والعودة للاستديو
            </button>

            <button
              type="submit"
              disabled={creating || loadingMaterials}
              style={{
                padding: '14px 26px',
                border: 'none',
                borderRadius: 999,
                background: BRAND.gradBlue,
                color: '#FFFFFF',
                boxShadow: BRAND.shadowBlue,
                cursor:
                  creating || loadingMaterials ? 'not-allowed' : 'pointer',
                opacity: creating || loadingMaterials ? 0.65 : 1,
                fontFamily: BRAND.fontHeading,
                fontSize: 16,
                fontWeight: 900,
              }}
            >
              {creating ? 'جارٍ إنشاء المشروع...' : 'إنشاء المشروع'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

export default function NewStudioProjectPage() {
  return (
    <Suspense fallback={<StudioProjectLoading />}>
      <NewStudioProjectContent />
    </Suspense>
  )
}