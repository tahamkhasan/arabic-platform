'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { APP, BRAND } from '@/lib/constants/theme'
import { supabase } from '@/lib/supabase'

type SubjectOption = {
  subjectId: string
  stage: string | null
  grade: string | null
  track: string | null
}

type SubjectGroup = {
  key: string
  name: string
  description: string | null
  icon: string | null
  options: SubjectOption[]
}

type Unit = {
  id: string
  subject_id: string
  name: string
  description: string | null
  order_num: number | null
  icon: string | null
  is_active: boolean
  semester: number | null
}

type Lesson = {
  id: string
  subject_id: string | null
  unit_id: string
  name: string
  description: string | null
  content: string | null
  order_num: number | null
  is_active: boolean
}

type Material = {
  id: string
  subject_id: string
  title: string
  description: string | null
  file_url: string
  file_path: string
  file_name: string
  mime_type: string | null
  file_size: number | null
  material_scope: 'official' | 'teacher_private'
  source_type: string
  stage: string | null
  grade: string | null
  track: string | null
  semester: string | null
  unit_id: string | null
  lesson_id: string | null
  uploaded_by: string
  is_active: boolean
  created_at: string
  updated_at: string
}

type ContextResponse = {
  role: 'admin' | 'teacher'
  subjectGroups: SubjectGroup[]
  selectedSubjectId: string
  stages: string[]
  grades: string[]
  tracks: string[]
  semesters: string[]
  units: Unit[]
  lessons: Lesson[]
}

const STAGE_LABELS: Record<string, string> = {
  primary: 'المرحلة الابتدائية',
  middle: 'المرحلة المتوسطة',
  secondary: 'المرحلة الثانوية',
}

const TRACK_LABELS: Record<string, string> = {
  scientific: 'علمي',
  literary: 'أدبي',
}

const SEMESTER_LABELS: Record<string, string> = {
  '1': 'الفصل الدراسي الأول',
  '2': 'الفصل الدراسي الثاني',
  first: 'الفصل الدراسي الأول',
  second: 'الفصل الدراسي الثاني',
}

function getStageLabel(value: string) {
  return STAGE_LABELS[value] || value
}

function getTrackLabel(value: string) {
  return TRACK_LABELS[value] || value
}

function getSemesterLabel(value: string) {
  return SEMESTER_LABELS[value] || `الفصل الدراسي ${value}`
}

function getGradeLabel(value: string) {
  const gradeNumber = Number(value)

  if (!Number.isNaN(gradeNumber)) {
    if (gradeNumber >= 1 && gradeNumber <= 5) {
      return `الصف ${gradeNumber} الابتدائي`
    }

    if (gradeNumber >= 6 && gradeNumber <= 9) {
      return `الصف ${gradeNumber} المتوسط`
    }

    if (gradeNumber >= 10 && gradeNumber <= 12) {
      return `الصف ${gradeNumber} الثانوي`
    }
  }

  return `الصف ${value}`
}

function formatFileSize(bytes: number | null) {
  if (!bytes) {
    return '—'
  }

  if (bytes < 1024) {
    return `${bytes} بايت`
  }

  const kilobytes = bytes / 1024

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} كيلوبايت`
  }

  return `${(kilobytes / 1024).toFixed(1)} ميغابايت`
}

function getAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  }
}

export default function TeacherContentPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [accessToken, setAccessToken] = useState('')
  const [role, setRole] = useState<'admin' | 'teacher' | null>(null)

  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([])
  const [stages, setStages] = useState<string[]>([])
  const [grades, setGrades] = useState<string[]>([])
  const [tracks, setTracks] = useState<string[]>([])
  const [semesters, setSemesters] = useState<string[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])

  const [selectedSubjectName, setSelectedSubjectName] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedStage, setSelectedStage] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedTrack, setSelectedTrack] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [selectedLessonId, setSelectedLessonId] = useState('')

  const [materials, setMaterials] = useState<Material[]>([])
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([])

  const [loadingContext, setLoadingContext] = useState(true)
  const [loadingMaterials, setLoadingMaterials] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const selectedSubjectGroup = useMemo(
    () =>
      subjectGroups.find(
        (group) => group.name === selectedSubjectName
      ) || null,
    [selectedSubjectName, subjectGroups]
  )

  const selectedUnit = useMemo(
    () => units.find((unit) => unit.id === selectedUnitId) || null,
    [selectedUnitId, units]
  )

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId) || null,
    [lessons, selectedLessonId]
  )

  const officialMaterials = useMemo(
    () =>
      materials.filter(
        (material) => material.material_scope === 'official'
      ),
    [materials]
  )

  const teacherMaterials = useMemo(
    () =>
      materials.filter(
        (material) => material.material_scope === 'teacher_private'
      ),
    [materials]
  )

  const isContextReady = Boolean(
    selectedSubjectName &&
      selectedStage &&
      selectedGrade &&
      selectedSubjectId
  )

  function resetMaterials() {
    setMaterials([])
    setSelectedMaterialIds([])
  }

  function resetAfterSubject() {
    setSelectedSubjectId('')
    setSelectedStage('')
    setSelectedGrade('')
    setSelectedTrack('')
    setSelectedSemester('')
    setSelectedUnitId('')
    setSelectedLessonId('')
    resetMaterials()
  }

  function resetAfterStage() {
    setSelectedSubjectId('')
    setSelectedGrade('')
    setSelectedTrack('')
    setSelectedSemester('')
    setSelectedUnitId('')
    setSelectedLessonId('')
    resetMaterials()
  }

  function resetAfterGrade() {
    setSelectedSubjectId('')
    setSelectedTrack('')
    setSelectedSemester('')
    setSelectedUnitId('')
    setSelectedLessonId('')
    resetMaterials()
  }

  function resetAfterTrack() {
    setSelectedSubjectId('')
    setSelectedSemester('')
    setSelectedUnitId('')
    setSelectedLessonId('')
    resetMaterials()
  }

  function resetAfterSemester() {
    setSelectedUnitId('')
    setSelectedLessonId('')
    resetMaterials()
  }

  function resetAfterUnit() {
    setSelectedLessonId('')
    resetMaterials()
  }

  async function getAccessToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    return session?.access_token || ''
  }

  async function loadContext(params?: {
    subjectName?: string
    stage?: string
    grade?: string
    track?: string
    semester?: string
  }) {
    const token = await getAccessToken()

    if (!token) {
      router.replace('/login')
      return
    }

    setAccessToken(token)
    setLoadingContext(true)
    setError(null)

    try {
      const search = new URLSearchParams()

      if (params?.subjectName) {
        search.set('subjectName', params.subjectName)
      }

      if (params?.stage) {
        search.set('stage', params.stage)
      }

      if (params?.grade) {
        search.set('grade', params.grade)
      }

      if (params?.track) {
        search.set('track', params.track)
      }

      if (params?.semester) {
        search.set('semester', params.semester)
      }

      const response = await fetch(
        `/api/teacher-content-context?${search.toString()}`,
        {
          headers: getAuthHeaders(token),
        }
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.error || 'تعذر تحميل المواد والوحدات الخاصة بك.'
        )
      }

      const context = data as ContextResponse

      setRole(context.role)
      setSubjectGroups(context.subjectGroups || [])
      setStages(context.stages || [])
      setGrades(context.grades || [])
      setTracks(context.tracks || [])
      setSemesters(context.semesters || [])
      setUnits(context.units || [])
      setLessons(context.lessons || [])
      setSelectedSubjectId(context.selectedSubjectId || '')
    } catch (loadError: any) {
      setError(
        loadError?.message || 'حدث خطأ أثناء تحميل بيانات المحتوى.'
      )
    } finally {
      setLoadingContext(false)
    }
  }

  async function loadMaterials() {
    if (!selectedSubjectId || !accessToken) {
      setMaterials([])
      return
    }

    setLoadingMaterials(true)
    setError(null)

    try {
      const search = new URLSearchParams({
        subjectId: selectedSubjectId,
      })

      if (selectedStage) search.set('stage', selectedStage)
      if (selectedGrade) search.set('grade', selectedGrade)
      if (selectedTrack) search.set('track', selectedTrack)
      if (selectedSemester) search.set('semester', selectedSemester)
      if (selectedUnitId) search.set('unitId', selectedUnitId)
      if (selectedLessonId) search.set('lessonId', selectedLessonId)

      const response = await fetch(
        `/api/subject-materials?${search.toString()}`,
        {
          headers: getAuthHeaders(accessToken),
        }
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || 'تعذر تحميل ملفات المادة.')
      }

      const nextMaterials = (data?.materials || []) as Material[]

      setMaterials(nextMaterials)

      setSelectedMaterialIds((currentIds) =>
        currentIds.filter((id) =>
          nextMaterials.some((material) => material.id === id)
        )
      )
    } catch (loadError: any) {
      setError(loadError?.message || 'تعذر تحميل ملفات المادة.')
      setMaterials([])
    } finally {
      setLoadingMaterials(false)
    }
  }

  useEffect(() => {
    void loadContext()
  }, [])

  useEffect(() => {
    if (!selectedSubjectId || !accessToken) {
      return
    }

    void loadMaterials()
  }, [
    selectedSubjectId,
    selectedStage,
    selectedGrade,
    selectedTrack,
    selectedSemester,
    selectedUnitId,
    selectedLessonId,
    accessToken,
  ])

  function toggleMaterial(materialId: string) {
    setSelectedMaterialIds((currentIds) =>
      currentIds.includes(materialId)
        ? currentIds.filter((id) => id !== materialId)
        : [...currentIds, materialId]
    )
  }

  async function handleUpload(
  event: React.FormEvent<HTMLFormElement>
) {
  event.preventDefault()

  setError(null)
  setSuccessMessage(null)

  if (!selectedSubjectId) {
    setError('اختر المادة الدراسية أولًا قبل رفع الملف.')
    return
  }

  if (!uploadTitle.trim()) {
    setError('اكتب عنوانًا واضحًا لملف المادة.')
    return
  }

  if (!uploadFile) {
    setError('اختر ملفًا للرفع أولًا.')
    return
  }

  if (!accessToken) {
    setError('انتهت جلسة الدخول. سجّل الدخول مرة أخرى.')
    router.replace('/login')
    return
  }

  setUploading(true)

  try {
    const formData = new FormData()

    formData.append('subjectId', selectedSubjectId)
    formData.append('title', uploadTitle.trim())
    formData.append('description', uploadDescription.trim())
    formData.append('file', uploadFile)

    if (selectedStage) {
      formData.append('stage', selectedStage)
    }

    if (selectedGrade) {
      formData.append('grade', selectedGrade)
    }

    if (selectedTrack) {
      formData.append('track', selectedTrack)
    }

    if (selectedSemester) {
      formData.append('semester', selectedSemester)
    }

    if (selectedUnitId) {
      formData.append('unitId', selectedUnitId)
    }

    if (selectedLessonId) {
      formData.append('lessonId', selectedLessonId)
    }

    const response = await fetch('/api/subject-materials', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const apiMessage =
        typeof data?.error === 'string' ? data.error : ''

      throw new Error(
        apiMessage ||
          `تعذر رفع الملف. رمز الاستجابة: ${response.status}`
      )
    }

    setUploadTitle('')
    setUploadDescription('')
    setUploadFile(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    setSuccessMessage(
      typeof data?.message === 'string'
        ? data.message
        : 'تم رفع الملف بنجاح.'
    )

    await loadMaterials()
  } catch (uploadError: unknown) {
    console.error('Teacher content upload error:', uploadError)

    const message =
      uploadError instanceof Error
        ? uploadError.message
        : 'حدث خطأ أثناء رفع الملف.'

    setError(message)
  } finally {
    setUploading(false)
  }
}
  function openStudioWithContext() {
    if (!selectedSubjectGroup || !selectedSubjectId) {
      setError('اختر المرحلة والصف أولًا قبل الانتقال إلى التوليد.')
      return
    }

    const params = new URLSearchParams()

    params.set('subjectId', selectedSubjectId)
    params.set('subjectName', selectedSubjectGroup.name)

    if (selectedStage) params.set('stage', selectedStage)
    if (selectedGrade) params.set('grade', selectedGrade)
    if (selectedTrack) params.set('track', selectedTrack)
    if (selectedSemester) params.set('semester', selectedSemester)

    if (selectedUnit) {
      params.set('unitId', selectedUnit.id)
      params.set('unitName', selectedUnit.name)
    }

    if (selectedLesson) {
      params.set('lessonId', selectedLesson.id)
      params.set('lessonName', selectedLesson.name)
    }

    if (selectedMaterialIds.length > 0) {
      params.set('materialIds', selectedMaterialIds.join(','))
    }

    router.push(`/studio/new?${params.toString()}`)
  }

  function selectStyle(disabled = false) {
    return {
      width: '100%',
      paddingInline: 12,
      paddingBlock: 10,
      borderRadius: BRAND.radiusMd,
      border: `1px solid ${APP.borderCol}`,
      backgroundColor: disabled ? '#F4F1EC' : '#FFFFFF',
      color: disabled ? BRAND.muted : APP.textCol,
      fontSize: 14,
      outline: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: BRAND.fontBody,
    }
  }

  const cardStyle = {
    borderRadius: BRAND.radiusLg,
    border: `1px solid ${APP.borderCol}`,
    backgroundColor: APP.cardBg,
    boxShadow: APP.shadow,
    padding: BRAND.spaceMd,
  }

  const fixedSubjectName =
    selectedSubjectName ||
    (subjectGroups.length === 1 ? subjectGroups[0].name : '')

  useEffect(() => {
    if (
      !selectedSubjectName &&
      subjectGroups.length === 1 &&
      subjectGroups[0].name
    ) {
      setSelectedSubjectName(subjectGroups[0].name)

      void loadContext({
        subjectName: subjectGroups[0].name,
      })
    }
  }, [selectedSubjectName, subjectGroups])

  if (loadingContext && subjectGroups.length === 0) {
    return (
      <main
        dir="rtl"
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          backgroundColor: APP.bg,
          color: APP.textCol,
          fontFamily: BRAND.fontBody,
          padding: BRAND.spaceLg,
        }}
      >
        جاري تحميل مادة المعلم ومحتوى المنهج...
      </main>
    )
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: '100vh',
        backgroundColor: APP.bg,
        color: APP.textCol,
        fontFamily: BRAND.fontBody,
        padding: BRAND.spaceLg,
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          marginInline: 'auto',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: BRAND.spaceSm,
            flexWrap: 'wrap',
            marginBottom: BRAND.spaceMd,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: APP.accent,
                fontSize: 13,
                fontWeight: BRAND.weightBold,
              }}
            >
              مِداد للمعلم
            </p>

            <h1
              style={{
                margin: '6px 0 8px',
                fontFamily: BRAND.fontHeading,
                fontSize: 28,
                fontWeight: BRAND.weightBold,
                color: APP.textCol,
              }}
            >
              اختر محتوى الدرس ثم ابدأ التوليد
            </h1>

            <p
              style={{
                margin: 0,
                maxWidth: 760,
                color: APP.subCol,
                fontSize: 15,
                lineHeight: 1.8,
              }}
            >
              المادة محددة من حسابك. اختر المرحلة والصف ثم الوحدة والدرس،
              وحدد ملفات المصدر أو ارفع ملفًا جديدًا قبل الانتقال إلى
              التوليد.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push('/teacher')}
            style={{
              paddingInline: 16,
              paddingBlock: 9,
              borderRadius: BRAND.radiusPill,
              border: `1px solid ${APP.borderCol}`,
              backgroundColor: '#FFFFFF',
              color: APP.textCol,
              cursor: 'pointer',
              fontFamily: BRAND.fontBody,
              fontSize: 14,
            }}
          >
            العودة إلى لوحة المعلم
          </button>
        </header>

        {error && (
          <div
            style={{
              ...cardStyle,
              marginBottom: BRAND.spaceSm,
              backgroundColor: '#FFF5F5',
              border: '1px solid #FEB2B2',
              color: '#9B2C2C',
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              ...cardStyle,
              marginBottom: BRAND.spaceSm,
              backgroundColor: '#F0FFF4',
              border: '1px solid #9AE6B4',
              color: '#276749',
              fontSize: 14,
            }}
          >
            {successMessage}
          </div>
        )}

        <section style={{ ...cardStyle, marginBottom: BRAND.spaceMd }}>
          <div style={{ marginBottom: BRAND.spaceSm }}>
            <h2
              style={{
                margin: 0,
                fontFamily: BRAND.fontHeading,
                fontSize: 19,
                fontWeight: BRAND.weightBold,
              }}
            >
              1. تحديد سياق المنهج
            </h2>

            <p
              style={{
                margin: '5px 0 0',
                color: APP.subCol,
                fontSize: 13,
              }}
            >
              المادة مثبتة وفق اختيارك عند التسجيل؛ ابدأ باختيار المرحلة ثم
              الصف الدراسي.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 12,
            }}
          >
            <div>
              <span
                style={{
                  display: 'block',
                  marginBottom: 6,
                  fontSize: 13,
                  fontWeight: BRAND.weightSemibold,
                }}
              >
                المادة المختارة
              </span>

              <div
                style={{
                  width: '100%',
                  minHeight: 43,
                  display: 'flex',
                  alignItems: 'center',
                  paddingInline: 12,
                  paddingBlock: 10,
                  borderRadius: BRAND.radiusMd,
                  border: `1px solid ${APP.borderCol}`,
                  backgroundColor: '#F4F1EC',
                  color: APP.textCol,
                  fontSize: 14,
                  fontFamily: BRAND.fontBody,
                }}
              >
                {fixedSubjectName || 'لا توجد مادة مرتبطة بالحساب'}
              </div>
            </div>

            <label>
              <span
                style={{
                  display: 'block',
                  marginBottom: 6,
                  fontSize: 13,
                  fontWeight: BRAND.weightSemibold,
                }}
              >
                المرحلة
              </span>

              <select
                value={selectedStage}
                disabled={!selectedSubjectName || stages.length === 0}
                onChange={(event) => {
                  const nextStage = event.target.value

                  setSelectedStage(nextStage)
                  resetAfterStage()

                  void loadContext({
                    subjectName: selectedSubjectName,
                    stage: nextStage,
                  })
                }}
                style={selectStyle(
                  !selectedSubjectName || stages.length === 0
                )}
              >
                <option value="">اختر المرحلة</option>

                {stages.map((stage) => (
                  <option key={stage} value={stage}>
                    {getStageLabel(stage)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span
                style={{
                  display: 'block',
                  marginBottom: 6,
                  fontSize: 13,
                  fontWeight: BRAND.weightSemibold,
                }}
              >
                الصف
              </span>

              <select
                value={selectedGrade}
                disabled={!selectedStage || grades.length === 0}
                onChange={(event) => {
                  const nextGrade = event.target.value

                  setSelectedGrade(nextGrade)
                  resetAfterGrade()

                  void loadContext({
                    subjectName: selectedSubjectName,
                    stage: selectedStage,
                    grade: nextGrade,
                  })
                }}
                style={selectStyle(!selectedStage || grades.length === 0)}
              >
                <option value="">اختر الصف</option>

                {grades.map((grade) => (
                  <option key={grade} value={grade}>
                    {getGradeLabel(grade)}
                  </option>
                ))}
              </select>
            </label>

            {tracks.length > 0 && (
  <label>
    <span
      style={{
        display: 'block',
        marginBottom: 6,
        fontSize: 13,
        fontWeight: BRAND.weightSemibold,
      }}
    >
      التشعيب
    </span>

    <select
      value={selectedTrack}
      disabled={!selectedGrade}
      onChange={(event) => {
        const nextTrack = event.target.value

        setSelectedTrack(nextTrack)
        resetAfterTrack()

        void loadContext({
          subjectName: selectedSubjectName,
          stage: selectedStage,
          grade: selectedGrade,
          track: nextTrack,
        })
      }}
      style={selectStyle(!selectedGrade)}
    >
      <option value="">جميع التشعيبات</option>

      {tracks.map((track) => (
        <option key={track} value={track}>
          {getTrackLabel(track)}
        </option>
      ))}
    </select>
  </label>
)}

            <label>
              <span
                style={{
                  display: 'block',
                  marginBottom: 6,
                  fontSize: 13,
                  fontWeight: BRAND.weightSemibold,
                }}
              >
                الفصل الدراسي
              </span>

              <select
                value={selectedSemester}
                disabled={!selectedSubjectId || semesters.length === 0}
                onChange={(event) => {
                  const nextSemester = event.target.value

                  setSelectedSemester(nextSemester)
                  resetAfterSemester()

                  void loadContext({
                    subjectName: selectedSubjectName,
                    stage: selectedStage,
                    grade: selectedGrade,
                    track: selectedTrack,
                    semester: nextSemester,
                  })
                }}
                style={selectStyle(
                  !selectedSubjectId || semesters.length === 0
                )}
              >
                <option value="">اختر الفصل الدراسي</option>

                {semesters.map((semester) => (
                  <option key={semester} value={semester}>
                    {getSemesterLabel(semester)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span
                style={{
                  display: 'block',
                  marginBottom: 6,
                  fontSize: 13,
                  fontWeight: BRAND.weightSemibold,
                }}
              >
                الوحدة
              </span>

              <select
                value={selectedUnitId}
                disabled={!selectedSubjectId || units.length === 0}
                onChange={(event) => {
                  const nextUnitId = event.target.value

                  setSelectedUnitId(nextUnitId)
                  resetAfterUnit()
                }}
                style={selectStyle(!selectedSubjectId || units.length === 0)}
              >
                <option value="">اختر الوحدة</option>

                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.order_num ? `${unit.order_num}. ` : ''}
                    {unit.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span
                style={{
                  display: 'block',
                  marginBottom: 6,
                  fontSize: 13,
                  fontWeight: BRAND.weightSemibold,
                }}
              >
                الدرس
              </span>

              <select
                value={selectedLessonId}
                disabled={!selectedUnitId}
                onChange={(event) => {
                  setSelectedLessonId(event.target.value)
                  setSelectedMaterialIds([])
                }}
                style={selectStyle(!selectedUnitId)}
              >
                <option value="">اختر الدرس</option>

                {lessons
                  .filter((lesson) => lesson.unit_id === selectedUnitId)
                  .map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.order_num ? `${lesson.order_num}. ` : ''}
                      {lesson.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          {isContextReady && (
            <div
              style={{
                marginTop: BRAND.spaceSm,
                padding: 12,
                borderRadius: BRAND.radiusMd,
                backgroundColor: 'rgba(59,130,246,0.08)',
                color: APP.textCol,
                fontSize: 13,
                lineHeight: 1.8,
              }}
            >
              <strong>السياق الحالي:</strong> {selectedSubjectName}
              {selectedStage ? ` ← ${getStageLabel(selectedStage)}` : ''}
              {selectedGrade ? ` ← ${getGradeLabel(selectedGrade)}` : ''}
              {selectedTrack ? ` ← ${getTrackLabel(selectedTrack)}` : ''}
              {selectedSemester
                ? ` ← ${getSemesterLabel(selectedSemester)}`
                : ''}
              {selectedUnit ? ` ← ${selectedUnit.name}` : ''}
              {selectedLesson ? ` ← ${selectedLesson.name}` : ''}
            </div>
          )}
        </section>

        <section style={{ ...cardStyle, marginBottom: BRAND.spaceMd }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: BRAND.spaceSm,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: BRAND.fontHeading,
                  fontSize: 19,
                  fontWeight: BRAND.weightBold,
                }}
              >
                2. اختيار ملفات المصدر
              </h2>

              <p
                style={{
                  margin: '5px 0 0',
                  color: APP.subCol,
                  fontSize: 13,
                }}
              >
                اختر الملفات الرسمية أو ملفاتك الخاصة التي تريد أن يعتمد
                عليها التوليد.
              </p>
            </div>

            {loadingMaterials && (
              <span
                style={{
                  color: APP.subCol,
                  fontSize: 13,
                }}
              >
                جاري تحميل الملفات...
              </span>
            )}
          </div>

          {!isContextReady ? (
            <div
              style={{
                border: `1px dashed ${APP.borderCol}`,
                borderRadius: BRAND.radiusMd,
                padding: BRAND.spaceMd,
                color: APP.subCol,
                fontSize: 14,
                textAlign: 'center',
              }}
            >
              اختر المرحلة والصف أولًا لعرض ملفات المحتوى المتاحة.
            </div>
          ) : !loadingMaterials && materials.length === 0 ? (
            <div
              style={{
                border: `1px dashed ${APP.borderCol}`,
                borderRadius: BRAND.radiusMd,
                padding: BRAND.spaceMd,
                color: APP.subCol,
                fontSize: 14,
                textAlign: 'center',
                lineHeight: 1.8,
              }}
            >
              لا توجد ملفات مطابقة لهذا الصف حاليًا. يمكنك رفع ملف المنهج أو
              ملف الدرس في القسم التالي، ثم استخدامه مباشرة في التوليد.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 12,
              }}
            >
              {materials.map((material) => {
                const isSelected = selectedMaterialIds.includes(material.id)
                const isOfficial = material.material_scope === 'official'

                return (
                  <label
                    key={material.id}
                    style={{
                      display: 'block',
                      padding: 14,
                      borderRadius: BRAND.radiusMd,
                      border: isSelected
                        ? `2px solid ${APP.accent}`
                        : `1px solid ${APP.borderCol}`,
                      backgroundColor: isSelected
                        ? 'rgba(59,130,246,0.08)'
                        : '#FFFFFF',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMaterial(material.id)}
                        style={{ marginTop: 4 }}
                      />

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            marginBottom: 5,
                          }}
                        >
                          <strong
                            style={{
                              color: APP.textCol,
                              fontSize: 14,
                            }}
                          >
                            {material.title}
                          </strong>

                          <span
                            style={{
                              flexShrink: 0,
                              paddingInline: 8,
                              paddingBlock: 3,
                              borderRadius: BRAND.radiusPill,
                              backgroundColor: isOfficial
                                ? 'rgba(59,130,246,0.12)'
                                : 'rgba(198,42,68,0.10)',
                              color: isOfficial ? '#2563EB' : APP.accent,
                              fontSize: 11,
                              fontWeight: BRAND.weightBold,
                            }}
                          >
                            {isOfficial ? 'رسمي' : 'ملفي الخاص'}
                          </span>
                        </div>

                        {material.description && (
                          <p
                            style={{
                              margin: '0 0 7px',
                              color: APP.subCol,
                              fontSize: 12,
                              lineHeight: 1.7,
                            }}
                          >
                            {material.description}
                          </p>
                        )}

                        <p
                          style={{
                            margin: 0,
                            color: BRAND.muted,
                            fontSize: 12,
                          }}
                        >
                          {material.file_name} ·{' '}
                          {formatFileSize(material.file_size)}
                        </p>

                        <a
                          href={material.file_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          style={{
                            display: 'inline-block',
                            marginTop: 9,
                            color: APP.accent,
                            fontSize: 12,
                            textDecoration: 'none',
                            fontWeight: BRAND.weightSemibold,
                          }}
                        >
                          فتح الملف
                        </a>
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          )}

          {materials.length > 0 && (
            <p
              style={{
                margin: '12px 0 0',
                color: APP.subCol,
                fontSize: 13,
              }}
            >
              تم اختيار {selectedMaterialIds.length} من الملفات. الملفات
              الرسمية: {officialMaterials.length}، وملفاتك الخاصة:{' '}
              {teacherMaterials.length}.
            </p>
          )}
        </section>

        <section style={{ ...cardStyle, marginBottom: BRAND.spaceMd }}>
          <div style={{ marginBottom: BRAND.spaceSm }}>
            <h2
              style={{
                margin: 0,
                fontFamily: BRAND.fontHeading,
                fontSize: 19,
                fontWeight: BRAND.weightBold,
              }}
            >
              3. رفع ملف مرجعي جديد
            </h2>

            <p
              style={{
                margin: '5px 0 0',
                color: APP.subCol,
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              يُربط الملف تلقائيًا بالمادة والمرحلة والصف والسياق المحدد.
              {role === 'admin'
                ? ' سيُحفظ بوصفه ملفًا رسميًا للمادة.'
                : ' سيُحفظ بوصفه ملفًا خاصًا بك.'}
            </p>
          </div>

          <form
            onSubmit={handleUpload}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
              alignItems: 'end',
            }}
          >
            <label>
              <span
                style={{
                  display: 'block',
                  marginBottom: 6,
                  fontSize: 13,
                  fontWeight: BRAND.weightSemibold,
                }}
              >
                عنوان الملف
              </span>

              <input
                type="text"
                value={uploadTitle}
                disabled={!isContextReady || uploading}
                onChange={(event) => setUploadTitle(event.target.value)}
                placeholder="مثال: شرح درس التورية"
                style={selectStyle(!isContextReady || uploading)}
              />
            </label>

            <label>
              <span
                style={{
                  display: 'block',
                  marginBottom: 6,
                  fontSize: 13,
                  fontWeight: BRAND.weightSemibold,
                }}
              >
                وصف مختصر
              </span>

              <input
                type="text"
                value={uploadDescription}
                disabled={!isContextReady || uploading}
                onChange={(event) =>
                  setUploadDescription(event.target.value)
                }
                placeholder="اختياري"
                style={selectStyle(!isContextReady || uploading)}
              />
            </label>

            <label>
              <span
                style={{
                  display: 'block',
                  marginBottom: 6,
                  fontSize: 13,
                  fontWeight: BRAND.weightSemibold,
                }}
              >
                اختر الملف
              </span>

              <input
                ref={fileInputRef}
                type="file"
                disabled={!isContextReady || uploading}
                accept=".pdf,.doc,.docx,.txt,.rtf,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
                onChange={(event) => {
                  setUploadFile(event.target.files?.[0] || null)
                }}
                style={{
                  width: '100%',
                  paddingBlock: 8,
                  fontFamily: BRAND.fontBody,
                  fontSize: 13,
                }}
              />
            </label>

            <button
              type="submit"
              disabled={!isContextReady || uploading}
              style={{
                paddingInline: 18,
                paddingBlock: 11,
                border: 'none',
                borderRadius: BRAND.radiusPill,
                backgroundImage: APP.btnBlue,
                color: '#FFFFFF',
                cursor:
                  !isContextReady || uploading
                    ? 'not-allowed'
                    : 'pointer',
                opacity: !isContextReady || uploading ? 0.6 : 1,
                fontFamily: BRAND.fontHeading,
                fontWeight: BRAND.weightBold,
                fontSize: 14,
              }}
            >
              {uploading ? 'جاري الرفع...' : 'رفع الملف'}
            </button>
          </form>

          {uploadFile && (
            <p
              style={{
                margin: '10px 0 0',
                color: APP.subCol,
                fontSize: 12,
              }}
            >
              الملف المختار: {uploadFile.name}
            </p>
          )}
        </section>

        <section
          style={{
            ...cardStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: BRAND.spaceSm,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontFamily: BRAND.fontHeading,
                fontSize: 19,
                fontWeight: BRAND.weightBold,
              }}
            >
              4. الانتقال إلى التوليد
            </h2>

            <p
              style={{
                margin: '5px 0 0',
                color: APP.subCol,
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              ستنتقل إلى مِداد استديو مع تمرير المادة والسياق والملفات التي
              اخترتها، ويمكنك بعدها تحديد نوع الناتج.
            </p>
          </div>

          <button
            type="button"
            disabled={!isContextReady}
            onClick={openStudioWithContext}
            style={{
              paddingInline: 22,
              paddingBlock: 12,
              border: 'none',
              borderRadius: BRAND.radiusPill,
              backgroundImage: APP.btnBlue,
              color: '#FFFFFF',
              cursor: isContextReady ? 'pointer' : 'not-allowed',
              opacity: isContextReady ? 1 : 0.6,
              fontFamily: BRAND.fontHeading,
              fontWeight: BRAND.weightBold,
              fontSize: 15,
              boxShadow: APP.btnGlow,
            }}
          >
            الانتقال إلى التوليد
          </button>
        </section>
      </div>
    </main>
  )
}