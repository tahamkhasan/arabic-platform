'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { APP, BRAND } from '@/lib/constants/theme'

type StudioOutputType =
  | 'lesson_summary'
  | 'mcq_quiz'
  | 'short_explainer_video'

type StudioSourceType = 'pdf' | 'text' | 'image' | 'video'

type StudioProject = {
  id: string
  title: string | null
  output_type: StudioOutputType | null
  source_type: StudioSourceType | null
  status: 'draft' | 'processing' | 'completed' | 'error' | null
  created_at: string
  updated_at: string | null
}

export default function StudioProjectDetailPage() {
  const router = useRouter()
  const params = useParams()

  const projectId = params?.id as string

  const [project, setProject] = useState<StudioProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // حالة التعديل
  const [editingTitle, setEditingTitle] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return

    async function fetchProject() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/studio/projects/${projectId}`)
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          setError(data?.error || 'تعذر جلب بيانات المشروع.')
          setLoading(false)
          return
        }
        const data = await res.json()
        const p: StudioProject | null = data?.project ?? null
        setProject(p)
        setNewTitle(p?.title ?? '')
        setLoading(false)
      } catch (err: any) {
        console.error('Error fetching project:', err)
        setError('حدث خطأ غير متوقع أثناء جلب المشروع.')
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  async function handleUpdateTitle() {
    if (!project) return
    if (!newTitle.trim()) {
      setError('عنوان المشروع لا يمكن أن يكون فارغاً.')
      return
    }

    setUpdating(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const res = await fetch(`/api/studio/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle.trim(),
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'تعذر تعديل عنوان المشروع.')
        setUpdating(false)
        return
      }

      setProject((prev) =>
        prev ? { ...prev, title: newTitle.trim() } : prev
      )
      setEditingTitle(false)
      setSuccessMessage(data?.message || 'تم تعديل المشروع بنجاح.')
      setUpdating(false)
    } catch (err: any) {
      console.error('Error updating project:', err)
      setError('حدث خطأ غير متوقع أثناء تعديل المشروع.')
      setUpdating(false)
    }
  }

  async function handleDeleteProject() {
    if (!project) return

    const confirmed = window.confirm(
      'هل تريد حذف هذا المشروع نهائياً؟ لا يمكن التراجع عن هذه الخطوة.'
    )
    if (!confirmed) return

    setDeleting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const res = await fetch(`/api/studio/projects/${project.id}`, {
        method: 'DELETE',
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'تعذر حذف المشروع.')
        setDeleting(false)
        return
      }

      setSuccessMessage(data?.message || 'تم حذف المشروع بنجاح.')
      setDeleting(false)
      router.push('/studio')
    } catch (err: any) {
      console.error('Error deleting project:', err)
      setError('حدث خطأ غير متوقع أثناء حذف المشروع.')
      setDeleting(false)
    }
  }

  function renderStatusBadge(status: StudioProject['status']) {
    if (!status) return null

    const map: Record<
      NonNullable<StudioProject['status']>,
      { label: string; bg: string; col: string }
    > = {
      draft: {
        label: 'مسودة',
        bg: '#FDF6B2',
        col: '#92400E',
      },
      processing: {
        label: 'قيد المعالجة',
        bg: '#DBEAFE',
        col: '#1D4ED8',
      },
      completed: {
        label: 'منجز',
        bg: '#DEF7EC',
        col: '#03543F',
      },
      error: {
        label: 'به خطأ',
        bg: '#FDE8E8',
        col: '#9B1C1C',
      },
    }

    const conf = map[status]

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingInline: 10,
          paddingBlock: 4,
          borderRadius: BRAND.radiusPill,
          backgroundColor: conf.bg,
          color: conf.col,
          fontSize: 12,
          fontWeight: BRAND.weightSemibold,
        }}
      >
        {conf.label}
      </span>
    )
  }

  function renderOutputType(type: StudioOutputType | null) {
    if (!type) return 'غير محدد'

    switch (type) {
      case 'lesson_summary':
        return 'ملخص درس'
      case 'mcq_quiz':
        return 'اختبار (اختيار من متعدد)'
      case 'short_explainer_video':
        return 'فيديو شرح مختصر'
      default:
        return 'غير محدد'
    }
  }

  function renderSourceType(type: StudioSourceType | null) {
    if (!type) return 'غير محدد'

    switch (type) {
      case 'pdf':
        return 'ملف PDF / Word'
      case 'text':
        return 'نص مكتوب'
      case 'image':
        return 'صورة (صفحة/شكل)'
      case 'video':
        return 'فيديو قصير'
      default:
        return 'غير محدد'
    }
  }

  if (loading) {
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
        <p
          style={{
            fontSize: 15,
            color: APP.subCol,
          }}
        >
          جاري تحميل بيانات المشروع...
        </p>
      </main>
    )
  }

  if (error) {
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
        <p
          style={{
            fontSize: 14,
            color: '#C53030',
          }}
        >
          {error}
        </p>
        <button
          type="button"
          onClick={() => router.push('/studio')}
          style={{
            marginTop: 10,
            paddingInline: 16,
            paddingBlock: 8,
            borderRadius: BRAND.radiusPill,
            border: `1px solid ${APP.borderCol}`,
            cursor: 'pointer',
            backgroundColor: '#FFFFFF',
            color: APP.textCol,
            fontSize: 14,
          }}
        >
          العودة إلى الاستديو
        </button>
      </main>
    )
  }

  if (!project) {
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
        <p
          style={{
            fontSize: 14,
            color: APP.subCol,
          }}
        >
          لم يتم العثور على هذا المشروع.
        </p>
        <button
          type="button"
          onClick={() => router.push('/studio')}
          style={{
            marginTop: 10,
            paddingInline: 16,
            paddingBlock: 8,
            borderRadius: BRAND.radiusPill,
            border: `1px solid ${APP.borderCol}`,
            cursor: 'pointer',
            backgroundColor: '#FFFFFF',
            color: APP.textCol,
            fontSize: 14,
          }}
        >
          العودة إلى الاستديو
        </button>
      </main>
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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: BRAND.weightBold,
                color: APP.textCol,
                marginBottom: 6,
                fontFamily: BRAND.fontHeading,
              }}
            >
              {project.title || 'مشروع بدون عنوان'}
            </h1>
            <p
              style={{
                fontSize: 14,
                color: APP.subCol,
              }}
            >
              تفاصيل مشروع الاستديو لهذا الدرس، مع إمكانية تعديل العنوان وحذف
              المسودة إذا لم تعد مطلوبة.
            </p>
          </div>

          <div>{renderStatusBadge(project.status)}</div>
        </header>

        <section
          style={{
            backgroundColor: APP.cardBg,
            borderRadius: BRAND.radiusLg,
            padding: BRAND.spaceMd,
            border: `1px solid ${APP.borderCol}`,
            boxShadow: APP.shadow,
            marginBottom: BRAND.spaceMd,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: BRAND.weightSemibold,
              color: APP.textCol,
              marginBottom: 10,
              fontFamily: BRAND.fontHeading,
            }}
          >
            بيانات المشروع
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              fontSize: 14,
              color: APP.textCol,
            }}
          >
            <div>
              <span
                style={{
                  fontWeight: BRAND.weightSemibold,
                }}
              >
                عنوان المشروع:
              </span>{' '}
              {editingTitle ? (
                <div
                  style={{
                    marginTop: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="اكتب العنوان الجديد للمشروع..."
                    style={{
                      width: '100%',
                      fontSize: 14,
                      paddingInline: 10,
                      paddingBlock: 8,
                      borderRadius: BRAND.radiusMd,
                      border: `1px solid ${APP.borderCol}`,
                      outline: 'none',
                      backgroundColor: '#FFFFFF',
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleUpdateTitle}
                      disabled={updating}
                      style={{
                        paddingInline: 14,
                        paddingBlock: 8,
                        borderRadius: BRAND.radiusPill,
                        border: 'none',
                        cursor: updating ? 'default' : 'pointer',
                        backgroundImage: APP.btnBlue,
                        color: '#FFFFFF',
                        fontSize: 13,
                        fontWeight: BRAND.weightSemibold,
                      }}
                    >
                      {updating ? 'جاري الحفظ...' : 'حفظ التعديل'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTitle(false)
                        setNewTitle(project.title || '')
                      }}
                      style={{
                        paddingInline: 12,
                        paddingBlock: 7,
                        borderRadius: BRAND.radiusPill,
                        border: `1px solid ${APP.borderCol}`,
                        cursor: 'pointer',
                        backgroundColor: '#FFFFFF',
                        color: APP.textCol,
                        fontSize: 13,
                      }}
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {project.title || 'لم يتم تحديد عنوان بعد.'}{' '}
                  <button
                    type="button"
                    onClick={() => setEditingTitle(true)}
                    style={{
                      marginInlineStart: 8,
                      paddingInline: 10,
                      paddingBlock: 4,
                      borderRadius: BRAND.radiusPill,
                      border: `1px solid ${APP.borderCol}`,
                      cursor: 'pointer',
                      backgroundColor: '#FFFFFF',
                      color: APP.textCol,
                      fontSize: 12,
                    }}
                  >
                    تعديل العنوان
                  </button>
                </>
              )}
            </div>

            <div>
              <span
                style={{
                  fontWeight: BRAND.weightSemibold,
                }}
              >
                نوع الناتج:
              </span>{' '}
              {renderOutputType(project.output_type)}
            </div>

            <div>
              <span
                style={{
                  fontWeight: BRAND.weightSemibold,
                }}
              >
                نوع المادة:
              </span>{' '}
              {renderSourceType(project.source_type)}
            </div>

            <div>
              <span
                style={{
                  fontWeight: BRAND.weightSemibold,
                }}
              >
                تاريخ الإنشاء:
              </span>{' '}
              {new Date(project.created_at).toLocaleString('ar-KW')}
            </div>
          </div>
        </section>

        {error && (
          <p
            style={{
              fontSize: 13,
              color: '#C53030',
              marginBottom: 6,
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
              marginBottom: 6,
            }}
          >
            {successMessage}
          </p>
        )}

        <section
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginTop: BRAND.spaceSm,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => router.push('/studio')}
              style={{
                paddingInline: 18,
                paddingBlock: 9,
                borderRadius: BRAND.radiusPill,
                border: `1px solid ${APP.borderCol}`,
                cursor: 'pointer',
                backgroundColor: '#FFFFFF',
                color: APP.textCol,
                fontSize: 14,
              }}
            >
              العودة إلى الاستديو
            </button>

            <button
              type="button"
              onClick={handleDeleteProject}
              disabled={deleting}
              style={{
                paddingInline: 18,
                paddingBlock: 9,
                borderRadius: BRAND.radiusPill,
                border: 'none',
                cursor: deleting ? 'default' : 'pointer',
                backgroundColor: '#E53E3E',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: BRAND.weightSemibold,
              }}
            >
              {deleting ? 'جاري الحذف...' : 'حذف المشروع'}
            </button>

            {/* زر توليد ملخص الدرس */}
            <button
              type="button"
              onClick={async () => {
                if (!project) return

                const confirmed = window.confirm(
                  'هل تريد توليد ملخص الدرس لهذا المشروع الآن؟'
                )
                if (!confirmed) return

                setError(null)
                setSuccessMessage(null)

                try {
                  const res = await fetch(
                    `/api/studio/projects/${project.id}/generate-summary`,
                    {
                      method: 'POST',
                    }
                  )

                  const data = await res.json().catch(() => null)

                  if (!res.ok) {
                    alert(
                      data?.error ||
                        'تعذر توليد ملخص الدرس. حاول مرة أخرى لاحقاً.'
                    )
                    return
                  }

                  setSuccessMessage(
                    data?.message || 'تم توليد ملخص الدرس بنجاح.'
                  )

                  setProject((prev) =>
                    prev
                      ? {
                          ...prev,
                          status: 'completed',
                        }
                      : prev
                  )
                } catch (err: any) {
                  console.error('Error generating lesson summary:', err)
                  alert(
                    'حدث خطأ غير متوقع أثناء توليد ملخص الدرس. حاول مرة أخرى.'
                  )
                }
              }}
              style={{
                paddingInline: 18,
                paddingBlock: 9,
                borderRadius: BRAND.radiusPill,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: '#2B6CB0',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: BRAND.weightSemibold,
              }}
            >
              توليد ملخص الدرس
            </button>
          </div>

          <div
            style={{
              fontSize: 12,
              color: BRAND.muted,
              textAlign: 'left',
            }}
          >
            يمكنك من هنا حذف المسودة أو العودة للاستديو أو توليد ملخص الدرس
            اعتماداً على المادة المرتبطة بالمشروع.
          </div>
        </section>
      </div>
    </main>
  )
}