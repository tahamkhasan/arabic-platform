'use client'

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'
import { useSubjectContentGuard } from '@/hooks/useSubjectContentGuard'

type MaterialScope = 'official' | 'teacher_private'

type SubjectMaterial = {
  id: string
  subject_id: string
  title: string
  description: string | null
  file_url: string
  file_path: string
  file_name: string
  mime_type: string | null
  file_size: number | null
  material_scope: MaterialScope
  uploaded_by: string
  is_active: boolean
  created_at: string
  updated_at: string
  users?: {
    id: string
    name: string | null
    email: string | null
  } | null
}

const MAX_FILE_SIZE = 25 * 1024 * 1024

const ACCEPTED_FILES = [
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.rtf',
  '.ppt',
  '.pptx',
  '.xls',
  '.xlsx',
  '.jpg',
  '.jpeg',
  '.png',
].join(',')

function formatFileSize(value: number | null) {
  if (!value || value <= 0) return '—'

  if (value < 1024) return `${value} بايت`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} كيلوبايت`

  return `${(value / (1024 * 1024)).toFixed(1)} ميغابايت`
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('ar-KW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function getFileIcon(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase()

  if (extension === 'pdf') return '📕'
  if (extension === 'doc' || extension === 'docx') return '📘'
  if (extension === 'ppt' || extension === 'pptx') return '📙'
  if (extension === 'xls' || extension === 'xlsx') return '📗'
  if (extension === 'jpg' || extension === 'jpeg' || extension === 'png') {
    return '🖼️'
  }

  return '📄'
}

export default function AdminSubjectMaterialsPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()

  const subjectId = params.id
  const subjectName = searchParams.get('subjectName') || 'المادة'

  const { ready, accessToken, guardError } = useSubjectContentGuard(subjectId)

  const [materials, setMaterials] = useState<SubjectMaterial[]>([])
  const [role, setRole] = useState<'admin' | 'teacher' | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const officialMaterials = materials.filter(
    (material) => material.material_scope === 'official'
  )

  const teacherMaterials = materials.filter(
    (material) => material.material_scope === 'teacher_private'
  )

  async function loadMaterials() {
    if (!accessToken || !subjectId) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `/api/subject-materials?subjectId=${encodeURIComponent(subjectId)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || 'تعذر تحميل ملفات المادة.')
      }

      setMaterials(data?.materials || [])
      setRole(data?.role || null)
      setCurrentUserId(data?.currentUserId || null)
    } catch (loadError: any) {
      setError(loadError?.message || 'تعذر تحميل ملفات المادة.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (ready && accessToken) {
      loadMaterials()
    }
  }, [ready, accessToken, subjectId])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null

    if (!file) {
      setSelectedFile(null)
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('حجم الملف يتجاوز الحد المسموح، وهو 25 ميغابايت.')
      event.target.value = ''
      setSelectedFile(null)
      return
    }

    setError('')
    setSelectedFile(file)

    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''))
    }
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!accessToken) return

    if (!title.trim()) {
      setError('يرجى كتابة عنوان للملف.')
      return
    }

    if (!selectedFile) {
      setError('يرجى اختيار ملف للرفع.')
      return
    }

    setUploading(true)
    setMessage('')
    setError('')

    try {
      const formData = new FormData()

      formData.append('subjectId', subjectId)
      formData.append('title', title.trim())
      formData.append('description', description.trim())
      formData.append('file', selectedFile)

      const response = await fetch('/api/subject-materials', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || 'تعذر رفع الملف.')
      }

      setMessage(data?.message || 'تم رفع الملف بنجاح.')
      setTitle('')
      setDescription('')
      setSelectedFile(null)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      await loadMaterials()
    } catch (uploadError: any) {
      setError(uploadError?.message || 'حدث خطأ أثناء رفع الملف.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(material: SubjectMaterial) {
    if (!accessToken) return

    const label =
      material.material_scope === 'official'
        ? 'الملف الرسمي'
        : 'الملف المساند'

    const confirmed = window.confirm(
      `هل تريد حذف ${label} «${material.title}» نهائيًا؟`
    )

    if (!confirmed) return

    setDeletingId(material.id)
    setMessage('')
    setError('')

    try {
      const response = await fetch(
        `/api/subject-materials?id=${encodeURIComponent(material.id)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || 'تعذر حذف الملف.')
      }

      setMaterials((currentMaterials) =>
        currentMaterials.filter((item) => item.id !== material.id)
      )

      setMessage(data?.message || 'تم حذف الملف بنجاح.')
    } catch (deleteError: any) {
      setError(deleteError?.message || 'حدث خطأ أثناء حذف الملف.')
    } finally {
      setDeletingId(null)
    }
  }

  if (guardError) {
    return <StatusScreen text={guardError} color={BRAND.crimson} />
  }

  if (!ready) {
    return (
      <StatusScreen
        text="جارٍ التحقق من الصلاحيات..."
        color={BRAND.text}
      />
    )
  }

  const isAdmin = role === 'admin'

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: BRAND.bg,
        color: BRAND.text,
        fontFamily: BRAND.fontBody,
        padding: '24px 16px 60px',
      }}
    >
      <main style={{ maxWidth: 980, margin: '0 auto' }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                color: BRAND.sub,
                fontSize: 13,
                marginBottom: 4,
              }}
            >
              الملفات والمراجع التعليمية لمادة
            </div>

            <h1
              style={{
                margin: 0,
                color: BRAND.crimson,
                fontFamily: BRAND.fontHeading,
                fontSize: 26,
                fontWeight: BRAND.weightBlack,
              }}
            >
              📎 {subjectName}
            </h1>

            <p
              style={{
                margin: '8px 0 0',
                color: BRAND.sub,
                fontSize: 13,
                lineHeight: 1.8,
              }}
            >
              {isAdmin
                ? 'ارفع الملفات الرسمية التي ستكون مرجعًا مشتركًا لجميع معلمي المادة.'
                : 'تظهر لك الملفات الرسمية للمادة، ويمكنك رفع ملفاتك المساندة الخاصة.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push(
                  `/admin/subjects/${subjectId}/units?subjectName=${encodeURIComponent(subjectName)}`
                )
              }
            >
              ← الوحدات والدروس
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={loadMaterials}
            >
              ↻ تحديث
            </Button>
          </div>
        </header>

        <section
          style={{
            padding: '14px 16px',
            borderRadius: BRAND.radiusMd,
            border: '1px solid rgba(140,20,40,0.18)',
            background: 'rgba(140,20,40,0.05)',
            marginBottom: 20,
            fontSize: 13,
            lineHeight: 1.9,
            color: BRAND.sub,
          }}
        >
          <strong style={{ color: BRAND.crimson }}>
            {isAdmin ? '📚 الملفات الرسمية:' : '📚 طريقة استخدام الملفات:'}
          </strong>
          {' '}
          {isAdmin
            ? 'ستظهر هذه الملفات تلقائيًا لكل معلم مسند إليه هذه المادة، لتكون مصدرًا موحدًا للتخطيط والأنشطة والاختبارات.'
            : 'الملفات الرسمية مصدر مشترك للمادة، أما ملفاتك المساندة فهي خاصة بحسابك ولا تظهر للمعلمين الآخرين.'}
        </section>

        {message ? <Notice text={message} kind="success" /> : null}

        {error ? <Notice text={error} kind="error" /> : null}

        <section
          style={{
            background: BRAND.bgSoft,
            border: `1px solid ${BRAND.border}`,
            borderRadius: BRAND.radiusLg,
            padding: 20,
            marginBottom: 22,
          }}
        >
          <h2
            style={{
              margin: '0 0 16px',
              color: BRAND.text,
              fontFamily: BRAND.fontHeading,
              fontSize: 18,
              fontWeight: BRAND.weightBlack,
            }}
          >
            {isAdmin ? '⬆️ رفع ملف رسمي للمادة' : '⬆️ رفع ملف مساند خاص بي'}
          </h2>

          <form
            onSubmit={handleUpload}
            style={{
              display: 'grid',
              gap: 14,
            }}
          >
            <label style={{ display: 'grid', gap: 7 }}>
              <span
                style={{
                  color: BRAND.text,
                  fontSize: 14,
                  fontWeight: BRAND.weightBold,
                }}
              >
                عنوان الملف
              </span>

              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={
                  isAdmin
                    ? 'مثال: كتاب الطالب — الفصل الدراسي الأول'
                    : 'مثال: ورقة عمل إضافية في النحو'
                }
                style={inputStyle}
              />
            </label>

            <label style={{ display: 'grid', gap: 7 }}>
              <span
                style={{
                  color: BRAND.text,
                  fontSize: 14,
                  fontWeight: BRAND.weightBold,
                }}
              >
                وصف مختصر <span style={{ color: BRAND.sub }}>(اختياري)</span>
              </span>

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="اكتب وصفًا يوضح محتوى الملف أو استخدامه..."
                rows={3}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  lineHeight: 1.75,
                }}
              />
            </label>

            <div style={{ display: 'grid', gap: 7 }}>
              <span
                style={{
                  color: BRAND.text,
                  fontSize: 14,
                  fontWeight: BRAND.weightBold,
                }}
              >
                الملف
              </span>

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FILES}
                onChange={handleFileChange}
                style={{
                  width: '100%',
                  padding: '11px 12px',
                  borderRadius: BRAND.radiusMd,
                  border: `1.5px dashed ${BRAND.border}`,
                  background: 'rgba(140,20,40,0.03)',
                  color: BRAND.sub,
                  fontFamily: 'inherit',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              />

              <span
                style={{
                  color: BRAND.sub,
                  fontSize: 12,
                  lineHeight: 1.7,
                }}
              >
                الصيغ المتاحة: PDF، Word، PowerPoint، Excel، TXT، RTF، JPG،
                PNG. الحد الأقصى لحجم الملف: 25 ميغابايت.
              </span>

              {selectedFile ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    borderRadius: BRAND.radiusSm,
                    background: 'rgba(220,140,60,0.10)',
                    border: '1px solid rgba(220,140,60,0.28)',
                    color: BRAND.gold,
                    fontSize: 13,
                    fontWeight: BRAND.weightBold,
                  }}
                >
                  <span>{getFileIcon(selectedFile.name)}</span>

                  <span style={{ overflowWrap: 'anywhere' }}>
                    {selectedFile.name}
                  </span>

                  <span style={{ color: BRAND.sub }}>
                    ({formatFileSize(selectedFile.size)})
                  </span>
                </div>
              ) : null}
            </div>

            <div>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={uploading || !selectedFile || !title.trim()}
              >
                {uploading
                  ? 'جارٍ رفع الملف...'
                  : isAdmin
                    ? '⬆️ رفع الملف الرسمي'
                    : '⬆️ رفع ملفي المساند'}
              </Button>
            </div>
          </form>
        </section>

        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: 48,
              color: BRAND.sub,
              fontSize: 14,
            }}
          >
            جارٍ تحميل الملفات...
          </div>
        ) : (
          <>
            <MaterialsSection
              icon="🏛️"
              title="ملفات المادة الرسمية"
              description="ملفات مشتركة أضافها الأدمن، ومتاحة لجميع معلمي المادة."
              materials={officialMaterials}
              role={role}
              currentUserId={currentUserId}
              deletingId={deletingId}
              onDelete={handleDelete}
            />

            <MaterialsSection
              icon={isAdmin ? '👩‍🏫' : '🗂️'}
              title={
                isAdmin
                  ? 'ملفات المعلمين المساندة'
                  : 'ملفاتي المساندة'
              }
              description={
                isAdmin
                  ? 'ملفات خاصة بالمعلمين لهذه المادة، ظاهرة لك لأغراض الإشراف والمتابعة.'
                  : 'هذه الملفات تخص حسابك فقط ولا تظهر للمعلمين الآخرين.'
              }
              materials={teacherMaterials}
              role={role}
              currentUserId={currentUserId}
              deletingId={deletingId}
              onDelete={handleDelete}
            />
          </>
        )}
      </main>
    </div>
  )
}

type MaterialsSectionProps = {
  icon: string
  title: string
  description: string
  materials: SubjectMaterial[]
  role: 'admin' | 'teacher' | null
  currentUserId: string | null
  deletingId: string | null
  onDelete: (material: SubjectMaterial) => void
}

function MaterialsSection({
  icon,
  title,
  description,
  materials,
  role,
  currentUserId,
  deletingId,
  onDelete,
}: MaterialsSectionProps) {
  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 12 }}>
        <h2
          style={{
            margin: 0,
            color: BRAND.text,
            fontFamily: BRAND.fontHeading,
            fontWeight: BRAND.weightBlack,
            fontSize: 19,
          }}
        >
          {icon} {title}

          <span
            style={{
              display: 'inline-block',
              marginRight: 8,
              color: BRAND.sub,
              fontFamily: BRAND.fontBody,
              fontSize: 12,
              fontWeight: BRAND.weightBold,
            }}
          >
            ({materials.length})
          </span>
        </h2>

        <p
          style={{
            margin: '5px 0 0',
            color: BRAND.sub,
            fontSize: 13,
            lineHeight: 1.75,
          }}
        >
          {description}
        </p>
      </div>

      {materials.length === 0 ? (
        <div
          style={{
            padding: '26px 20px',
            textAlign: 'center',
            background: BRAND.bgSoft,
            border: `1px dashed ${BRAND.border}`,
            borderRadius: BRAND.radiusLg,
            color: BRAND.sub,
            fontSize: 13,
          }}
        >
          لا توجد ملفات في هذا القسم حتى الآن.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {materials.map((material) => {
            const canDelete =
              role === 'admin' ||
              (
                role === 'teacher' &&
                material.material_scope === 'teacher_private' &&
                material.uploaded_by === currentUserId
              )

            return (
              <article
                key={material.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 14,
                  flexWrap: 'wrap',
                  padding: '16px 18px',
                  background: BRAND.bgSoft,
                  border: `1px solid ${BRAND.border}`,
                  borderRadius: BRAND.radiusLg,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    minWidth: 0,
                    flex: '1 1 360px',
                  }}
                >
                  <span style={{ fontSize: 30, lineHeight: 1 }}>
                    {getFileIcon(material.file_name)}
                  </span>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        color: BRAND.text,
                        fontSize: 15,
                        fontWeight: BRAND.weightBlack,
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {material.title}
                    </div>

                    {material.description ? (
                      <p
                        style={{
                          margin: '6px 0 0',
                          color: BRAND.sub,
                          fontSize: 13,
                          lineHeight: 1.75,
                        }}
                      >
                        {material.description}
                      </p>
                    ) : null}

                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        flexWrap: 'wrap',
                        marginTop: 9,
                        color: BRAND.sub,
                        fontSize: 12,
                      }}
                    >
                      <span>{material.file_name}</span>
                      <span>•</span>
                      <span>{formatFileSize(material.file_size)}</span>
                      <span>•</span>
                      <span>{formatDate(material.created_at)}</span>

                      {role === 'admin' &&
                      material.material_scope === 'teacher_private' &&
                      material.users?.name ? (
                        <>
                          <span>•</span>
                          <span>رفعه: {material.users.name}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <a
                    href={material.file_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 34,
                      padding: '7px 12px',
                      borderRadius: BRAND.radiusSm,
                      textDecoration: 'none',
                      border: `1px solid ${BRAND.border}`,
                      color: BRAND.crimson,
                      background: 'rgba(140,20,40,0.04)',
                      fontSize: 13,
                      fontWeight: BRAND.weightBold,
                    }}
                  >
                    ↗ فتح الملف
                  </a>

                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => onDelete(material)}
                      disabled={deletingId === material.id}
                      style={{
                        minHeight: 34,
                        padding: '7px 12px',
                        borderRadius: BRAND.radiusSm,
                        border: '1px solid rgba(140,20,40,0.25)',
                        background: 'rgba(140,20,40,0.06)',
                        color: BRAND.crimson,
                        cursor:
                          deletingId === material.id
                            ? 'not-allowed'
                            : 'pointer',
                        fontSize: 13,
                        fontFamily: 'inherit',
                        fontWeight: BRAND.weightBold,
                        opacity: deletingId === material.id ? 0.6 : 1,
                      }}
                    >
                      {deletingId === material.id ? 'جارٍ الحذف...' : '🗑 حذف'}
                    </button>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function Notice({
  text,
  kind,
}: {
  text: string
  kind: 'success' | 'error'
}) {
  const isSuccess = kind === 'success'

  return (
    <div
      style={{
        padding: '12px 15px',
        marginBottom: 16,
        borderRadius: BRAND.radiusMd,
        border: `1px solid ${
          isSuccess
            ? 'rgba(220,140,60,0.32)'
            : 'rgba(140,20,40,0.25)'
        }`,
        background: isSuccess
          ? 'rgba(220,140,60,0.10)'
          : 'rgba(140,20,40,0.07)',
        color: isSuccess ? BRAND.gold : BRAND.crimson,
        fontSize: 14,
        fontWeight: BRAND.weightBold,
      }}
    >
      {text}
    </div>
  )
}

function StatusScreen({
  text,
  color,
}: {
  text: string
  color: string
}) {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: BRAND.bg,
        color,
        fontFamily: BRAND.fontBody,
      }}
    >
      {text}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '11px 13px',
  borderRadius: BRAND.radiusMd,
  border: `1.5px solid ${BRAND.border}`,
  background: 'rgba(140,20,40,0.035)',
  color: BRAND.text,
  fontFamily: 'inherit',
  fontSize: 14,
  outline: 'none',
} as const