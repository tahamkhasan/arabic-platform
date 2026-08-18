'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { APP, BRAND } from '@/lib/constants/theme'
import { supabase } from '@/lib/supabase'

type StudioOutputType =
  | 'lesson_summary'
  | 'mcq_quiz'
  | 'short_explainer_video'

type StudioSourceType = 'pdf' | 'text' | 'image' | 'video'

type StudioProjectStatus = 'draft' | 'processing' | 'completed' | 'error'

type StudioProject = {
  id: string
  title: string | null
  output_type: StudioOutputType | null
  source_type: StudioSourceType | null
  status: StudioProjectStatus | null
  created_at: string
}

function getOutputTypeLabel(type: StudioOutputType | null) {
  const labels: Record<StudioOutputType, string> = {
    lesson_summary: 'ملخص درس',
    mcq_quiz: 'اختبار اختيار من متعدد',
    short_explainer_video: 'فيديو شرح مختصر',
  }

  return type ? labels[type] || 'غير محدد' : 'غير محدد'
}

function getSourceTypeLabel(type: StudioSourceType | null) {
  const labels: Record<StudioSourceType, string> = {
    pdf: 'ملف PDF / Word',
    text: 'نص مكتوب',
    image: 'صورة أو صفحة',
    video: 'فيديو قصير',
  }

  return type ? labels[type] || 'غير محدد' : 'غير محدد'
}

function getStatusConfig(status: StudioProjectStatus | null) {
  const configs: Record<
    StudioProjectStatus,
    { label: string; background: string; color: string }
  > = {
    draft: {
      label: 'مسودة',
      background: '#FEF3C7',
      color: '#92400E',
    },
    processing: {
      label: 'قيد المعالجة',
      background: '#DBEAFE',
      color: '#1D4ED8',
    },
    completed: {
      label: 'مكتمل',
      background: '#DCFCE7',
      color: '#166534',
    },
    error: {
      label: 'به خطأ',
      background: '#FEE2E2',
      color: '#B91C1C',
    },
  }

  return (
    configs[status || 'draft'] || {
      label: 'غير محدد',
      background: '#F3F4F6',
      color: '#374151',
    }
  )
}

function formatArabicDate(value: string | null | undefined) {
  if (!value) {
    return 'غير متوفر'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'غير متوفر'
  }

  return date.toLocaleString('ar-KW', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function getAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  }
}

export default function StudioDashboardPage() {
  const router = useRouter()

  const [projects, setProjects] = useState<StudioProject[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadProjects = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const token = session?.access_token

      if (!token) {
        router.replace('/login')
        return
      }

      const res = await fetch('/api/studio/projects', {
        method: 'GET',
        headers: getAuthHeaders(token),
        cache: 'no-store',
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || 'تعذر جلب مشروعات الاستديو من القاعدة.')
      }

      const items: StudioProject[] = Array.isArray(data?.projects)
        ? data.projects
        : []

      setProjects(items)
    } catch (fetchError) {
      console.error('Studio projects fetch error:', fetchError)

      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'حدث خطأ غير متوقع أثناء جلب المشاريع.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [router])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  const projectStats = useMemo(() => {
    return {
      total: projects.length,
      draft: projects.filter((project) => project.status === 'draft').length,
      completed: projects.filter((project) => project.status === 'completed')
        .length,
      processing: projects.filter((project) => project.status === 'processing')
        .length,
    }
  }, [projects])

  async function handleDeleteProject(project: StudioProject) {
    if (project.status !== 'draft') {
      setError('يمكن حذف المشاريع التي حالتها مسودة فقط من صفحة الاستديو.')
      setSuccessMessage(null)
      return
    }

    const confirmed = window.confirm(
      'هل تريد حذف هذا المشروع نهائيًا؟ لا يمكن التراجع عن هذه الخطوة.'
    )

    if (!confirmed) {
      return
    }

    setDeletingId(project.id)
    setError(null)
    setSuccessMessage(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const token = session?.access_token

      if (!token) {
        router.replace('/login')
        return
      }

      const res = await fetch(`/api/studio/projects/${project.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || 'تعذر حذف المشروع من الاستديو.')
      }

      setProjects((currentProjects) =>
        currentProjects.filter((item) => item.id !== project.id)
      )

      setSuccessMessage(data?.message || 'تم حذف المشروع بنجاح.')
    } catch (deleteError) {
      console.error('Studio project delete from dashboard error:', deleteError)

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'حدث خطأ غير متوقع أثناء حذف المشروع من الاستديو.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  const panelStyle = {
    backgroundColor: APP.cardBg,
    borderRadius: BRAND.radiusLg,
    padding: BRAND.spaceMd,
    border: `1px solid ${APP.borderCol}`,
    boxShadow: APP.shadow,
  }

  const secondaryButtonStyle = {
    paddingInline: 16,
    paddingBlock: 9,
    borderRadius: BRAND.radiusPill,
    border: `1px solid ${APP.borderCol}`,
    cursor: 'pointer',
    backgroundColor: '#FFFFFF',
    color: APP.textCol,
    fontFamily: BRAND.fontBody,
    fontSize: 14,
    fontWeight: BRAND.weightSemibold,
  }

  const primaryButtonStyle = {
    paddingInline: 18,
    paddingBlock: 10,
    borderRadius: BRAND.radiusPill,
    border: 'none',
    cursor: 'pointer',
    backgroundImage: APP.btnBlue,
    color: '#FFFFFF',
    fontFamily: BRAND.fontHeading,
    fontSize: 14,
    fontWeight: BRAND.weightBold,
    boxShadow: APP.btnGlow,
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
        color: APP.textCol,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          marginInline: 'auto',
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: BRAND.spaceMd,
          }}
        >
          <div style={{ maxWidth: 720 }}>
            <h1
              style={{
                fontSize: 28,
                fontWeight: BRAND.weightBold,
                color: APP.textCol,
                margin: 0,
                fontFamily: BRAND.fontHeading,
              }}
            >
              مداد استديو · واجهة المعلم
            </h1>

            <p
              style={{
                fontSize: 15,
                color: APP.subCol,
                lineHeight: 1.9,
                margin: '8px 0 0',
              }}
            >
              أنشئ مشاريعك التعليمية، ثم حوّلها إلى ملخصات دروس واختبارات
              اختيار من متعدد ومخرجات جاهزة للاستخدام داخل الحصة من مكان واحد
              واضح ومنظم.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => router.push('/studio/projects/new')}
              style={primaryButtonStyle}
            >
              + مشروع جديد
            </button>

            <button
              type="button"
              onClick={() => void loadProjects(true)}
              style={{
                ...secondaryButtonStyle,
                opacity: refreshing ? 0.75 : 1,
                cursor: refreshing ? 'not-allowed' : 'pointer',
              }}
              disabled={refreshing}
            >
              {refreshing ? 'جارٍ التحديث...' : 'تحديث القائمة'}
            </button>
          </div>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: BRAND.spaceMd,
          }}
        >
          <div style={panelStyle}>
            <div style={{ color: BRAND.muted, fontSize: 13, marginBottom: 6 }}>
              إجمالي المشاريع
            </div>
            <div
              style={{
                color: APP.textCol,
                fontFamily: BRAND.fontHeading,
                fontSize: 24,
                fontWeight: BRAND.weightBold,
              }}
            >
              {projectStats.total}
            </div>
          </div>

          <div style={panelStyle}>
            <div style={{ color: BRAND.muted, fontSize: 13, marginBottom: 6 }}>
              المشاريع المكتملة
            </div>
            <div
              style={{
                color: '#166534',
                fontFamily: BRAND.fontHeading,
                fontSize: 24,
                fontWeight: BRAND.weightBold,
              }}
            >
              {projectStats.completed}
            </div>
          </div>

          <div style={panelStyle}>
            <div style={{ color: BRAND.muted, fontSize: 13, marginBottom: 6 }}>
              المشاريع قيد المعالجة
            </div>
            <div
              style={{
                color: '#1D4ED8',
                fontFamily: BRAND.fontHeading,
                fontSize: 24,
                fontWeight: BRAND.weightBold,
              }}
            >
              {projectStats.processing}
            </div>
          </div>

          <div style={panelStyle}>
            <div style={{ color: BRAND.muted, fontSize: 13, marginBottom: 6 }}>
              المسودات
            </div>
            <div
              style={{
                color: '#92400E',
                fontFamily: BRAND.fontHeading,
                fontSize: 24,
                fontWeight: BRAND.weightBold,
              }}
            >
              {projectStats.draft}
            </div>
          </div>
        </section>

        <section style={{ ...panelStyle, marginBottom: BRAND.spaceMd }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: APP.textCol,
                  fontFamily: BRAND.fontHeading,
                  fontSize: 19,
                  fontWeight: BRAND.weightBold,
                }}
              >
                مشاريعي
              </h2>

              <p
                style={{
                  margin: '6px 0 0',
                  color: APP.subCol,
                  fontSize: 13,
                  lineHeight: 1.8,
                }}
              >
                تُعرض هنا آخر مشاريع الاستديو المرتبطة بحسابك، ويمكنك فتح أي
                مشروع لمراجعته أو استكماله.
              </p>
            </div>

            <div
              style={{
                color: BRAND.muted,
                fontSize: 13,
              }}
            >
              يتم جلب المشاريع من قاعدة بيانات مداد استديو.
            </div>
          </div>
        </section>

        {error ? (
          <div
            role="alert"
            style={{
              ...panelStyle,
              marginBottom: BRAND.spaceSm,
              border: '1px solid #FEB2B2',
              backgroundColor: '#FFF5F5',
              color: '#9B2C2C',
              boxShadow: 'none',
              fontSize: 14,
              lineHeight: 1.8,
            }}
          >
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div
            style={{
              ...panelStyle,
              marginBottom: BRAND.spaceSm,
              border: '1px solid #9AE6B4',
              backgroundColor: '#F0FFF4',
              color: '#276749',
              boxShadow: 'none',
              fontSize: 14,
              lineHeight: 1.8,
            }}
          >
            {successMessage}
          </div>
        ) : null}

        {loading ? (
          <div style={panelStyle}>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: APP.subCol,
              }}
            >
              جارٍ تحميل مشروعات الاستديو...
            </p>
          </div>
        ) : projects.length === 0 ? (
          <section style={panelStyle}>
            <h3
              style={{
                margin: '0 0 10px',
                color: APP.textCol,
                fontFamily: BRAND.fontHeading,
                fontSize: 18,
                fontWeight: BRAND.weightBold,
              }}
            >
              لا توجد مشروعات بعد
            </h3>

            <p
              style={{
                margin: 0,
                color: APP.subCol,
                fontSize: 14,
                lineHeight: 1.9,
              }}
            >
              ابدأ بإنشاء مشروع جديد لإعداد ملخص درس أو اختبار أو أي مخرج
              تعليمي آخر داخل الاستديو.
            </p>

            <button
              type="button"
              onClick={() => router.push('/studio/projects/new')}
              style={{ ...primaryButtonStyle, marginTop: 14 }}
            >
              إنشاء أول مشروع
            </button>
          </section>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 14,
            }}
          >
            {projects.map((project) => {
              const status = getStatusConfig(project.status)
              const isDeleting = deletingId === project.id
              const canDelete = project.status === 'draft'

              return (
                <article
                  key={project.id}
                  style={{
                    borderRadius: BRAND.radiusLg,
                    border: `1px solid ${APP.borderCol}`,
                    backgroundColor: APP.cardBg,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 220,
                    boxShadow: APP.shadow,
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 10,
                        marginBottom: 10,
                        flexWrap: 'wrap',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 17,
                          fontWeight: BRAND.weightBold,
                          color: APP.textCol,
                          margin: 0,
                          fontFamily: BRAND.fontHeading,
                          lineHeight: 1.6,
                        }}
                      >
                        {project.title || 'مشروع بدون عنوان'}
                      </h3>

                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingInline: 10,
                          paddingBlock: 4,
                          borderRadius: BRAND.radiusPill,
                          backgroundColor: status.background,
                          color: status.color,
                          fontSize: 12,
                          fontWeight: BRAND.weightSemibold,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gap: 6,
                        fontSize: 13,
                        color: APP.subCol,
                        lineHeight: 1.8,
                      }}
                    >
                      <div>
                        <strong style={{ color: APP.textCol }}>
                          نوع الناتج:
                        </strong>{' '}
                        {getOutputTypeLabel(project.output_type)}
                      </div>

                      <div>
                        <strong style={{ color: APP.textCol }}>
                          نوع المادة:
                        </strong>{' '}
                        {getSourceTypeLabel(project.source_type)}
                      </div>

                      <div>
                        <strong style={{ color: APP.textCol }}>
                          تاريخ الإنشاء:
                        </strong>{' '}
                        {formatArabicDate(project.created_at)}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 14,
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/studio/projects/${project.id}`)
                      }
                      style={secondaryButtonStyle}
                    >
                      فتح المشروع
                    </button>

                    <button
                      type="button"
                      disabled={!canDelete || isDeleting}
                      onClick={() => void handleDeleteProject(project)}
                      style={{
                        paddingInline: 14,
                        paddingBlock: 8,
                        borderRadius: BRAND.radiusPill,
                        border: 'none',
                        cursor:
                          !canDelete || isDeleting
                            ? 'not-allowed'
                            : 'pointer',
                        backgroundColor: canDelete ? '#E53E3E' : '#CBD5E0',
                        color: '#FFFFFF',
                        fontFamily: BRAND.fontBody,
                        fontSize: 13,
                        fontWeight: BRAND.weightSemibold,
                        opacity: !canDelete || isDeleting ? 0.75 : 1,
                      }}
                      title={
                        canDelete
                          ? 'حذف المشروع'
                          : 'يمكن حذف المشاريع التي حالتها مسودة فقط'
                      }
                    >
                      {isDeleting ? 'جارٍ الحذف...' : 'حذف المشروع'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}