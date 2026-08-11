'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
}

export default function StudioDashboardPage() {
  const router = useRouter()

  const [projects, setProjects] = useState<StudioProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/studio/projects')
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          setError(data?.error || 'تعذر جلب مشروعات الاستديو من القاعدة.')
          setLoading(false)
          return
        }
        const data = await res.json()
        const items: StudioProject[] = data?.projects ?? []
        setProjects(items)
        setLoading(false)
      } catch (err: any) {
        console.error('Error fetching projects:', err)
        setError('حدث خطأ غير متوقع أثناء جلب المشاريع.')
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

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
          maxWidth: 1024,
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
              fontSize: 28,
              fontWeight: BRAND.weightBold,
              color: APP.textCol,
              marginBottom: 8,
              fontFamily: BRAND.fontHeading,
            }}
          >
            مداد استديو · واجهة المعلم
          </h1>
          <p
            style={{
              fontSize: 15,
              color: APP.subCol,
            }}
          >
            حوِّل ملاحظاتك التعليمية إلى ملخصات واختبارات وفيديوهات شرح جاهزة
            للاستخدام داخل دروسك، من مكان واحد بسيط وواضح.
          </p>
        </header>

        <section
          style={{
            marginBottom: BRAND.spaceSm,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: BRAND.muted,
            }}
          >
            يتم جلب المشاريع من قاعدة بيانات مداد استديو.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={() => router.push('/studio/projects/new')}
              style={{
                paddingInline: 18,
                paddingBlock: 9,
                borderRadius: BRAND.radiusPill,
                border: 'none',
                cursor: 'pointer',
                backgroundImage: APP.btnBlue,
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: BRAND.weightBold,
              }}
            >
              + مشروع جديد
            </button>

            <button
              type="button"
              onClick={() => router.refresh()}
              style={{
                paddingInline: 14,
                paddingBlock: 8,
                borderRadius: BRAND.radiusPill,
                border: `1px solid ${APP.borderCol}`,
                cursor: 'pointer',
                backgroundColor: '#FFFFFF',
                color: APP.textCol,
                fontSize: 14,
              }}
            >
              استعراض مشاريعي
            </button>
          </div>
        </section>

        {loading && (
          <p
            style={{
              fontSize: 14,
              color: APP.subCol,
            }}
          >
            جاري تحميل مشروعات الاستديو...
          </p>
        )}

        {error && (
          <p
            style={{
              fontSize: 14,
              color: '#C53030',
              marginBottom: 10,
            }}
          >
            {error}
          </p>
        )}

        {!loading && !error && projects.length === 0 && (
          <p
            style={{
              fontSize: 14,
              color: APP.subCol,
            }}
          >
            لا توجد مشروعات بعد. ابدأ بإنشاء مشروع جديد من الأعلى.
          </p>
        )}

        {!loading && !error && projects.length > 0 && (
          <>
            <h2
              style={{
                fontSize: 18,
                fontWeight: BRAND.weightSemibold,
                color: APP.textCol,
                marginBottom: 10,
                fontFamily: BRAND.fontHeading,
              }}
            >
              مشاريعي الأخيرة
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 12,
              }}
            >
              {projects.map((project) => (
                <article
                  key={project.id}
                  style={{
                    borderRadius: BRAND.radiusLg,
                    border: `1px solid #F97373`,
                    backgroundColor: '#FFFDF9',
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 150,
                    boxShadow: APP.shadow,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: BRAND.weightBold,
                        color: APP.textCol,
                        marginBottom: 6,
                      }}
                    >
                      {project.title || 'مشروع بدون عنوان'}
                    </h3>
                    <p
                      style={{
                        fontSize: 13,
                        color: APP.subCol,
                        marginBottom: 4,
                      }}
                    >
                      نوع المخرج: {renderOutputType(project.output_type)}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: BRAND.muted,
                        marginBottom: 4,
                      }}
                    >
                      تاريخ الإنشاء:{' '}
                      {project.created_at
                        ? new Date(project.created_at).toLocaleString('ar-KW')
                        : 'غير متوفر'}
                    </p>
                    {renderStatusBadge(project.status)}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 10,
                      gap: 8,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/studio/projects/${project.id}`)
                      }
                      style={{
                        paddingInline: 14,
                        paddingBlock: 7,
                        borderRadius: BRAND.radiusPill,
                        border: `1px solid ${APP.borderCol}`,
                        cursor: 'pointer',
                        backgroundColor: '#FFFFFF',
                        color: APP.textCol,
                        fontSize: 13,
                        fontWeight: BRAND.weightSemibold,
                      }}
                    >
                      فتح المشروع
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const confirmed = window.confirm(
                          'هل تريد حذف هذا المشروع نهائياً؟ لا يمكن التراجع عن هذه الخطوة.'
                        )
                        if (!confirmed) return

                        try {
                          const res = await fetch(
                            `/api/studio/projects/${project.id}`,
                            {
                              method: 'DELETE',
                            }
                          )

                          const data = await res.json().catch(() => null)

                          if (!res.ok) {
                            alert(
                              data?.error || 'تعذر حذف المشروع من الاستديو.'
                            )
                            return
                          }

                          // إزالة المشروع من القائمة في الواجهة بعد الحذف
                          setProjects((prev) =>
                            prev.filter((p) => p.id !== project.id)
                          )
                        } catch (err: any) {
                          console.error(
                            'Error deleting project from list:',
                            err
                          )
                          alert(
                            'حدث خطأ غير متوقع أثناء حذف المشروع من الاستديو.'
                          )
                        }
                      }}
                      style={{
                        paddingInline: 14,
                        paddingBlock: 7,
                        borderRadius: BRAND.radiusPill,
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: '#E53E3E',
                        color: '#FFFFFF',
                        fontSize: 13,
                        fontWeight: BRAND.weightSemibold,
                      }}
                    >
                      حذف المشروع
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}