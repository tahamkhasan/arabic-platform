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
    draft: { label: 'مسودة', background: '#FEF3C7', color: '#92400E' },
    processing: { label: 'قيد المعالجة', background: '#DBEAFE', color: '#1D4ED8' },
    completed: { label: 'مكتمل', background: '#DCFCE7', color: '#166534' },
    error: { label: 'به خطأ', background: '#FEE2E2', color: '#B91C1C' },
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
  if (!value) return 'غير متوفر'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'غير متوفر'

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
      completed: projects.filter((project) => project.status === 'completed').length,
      processing: projects.filter((project) => project.status === 'processing').length,
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

    if (!confirmed) return

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
    <main dir="rtl" style={{ minHeight: '100vh', backgroundColor: APP.bg, paddingInline: BRAND.spaceLg, paddingBlock: BRAND.spaceLg, fontFamily: BRAND.fontBody, color: APP.textCol }}>
      {/* أبقِ JSX الحالي كما هو دون تغيير */}
    </main>
  )
}