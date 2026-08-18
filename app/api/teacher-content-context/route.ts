import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

type TeacherScope = {
  id: string
  teacher_id: string
  subject_id: string | null
  stage: string | null
  grade: string | null
  track: string | null
}

type SubjectRow = {
  id: string
  name: string
  description: string | null
  stage: string | null
  grade: string | null
  icon: string | null
  is_active: boolean
}

type SubjectOffering = {
  id: string
  subject_id: string
  stage: string | null
  grade: string | null
  track: string | null
}

type UnitRow = {
  id: string
  subject_id: string
  name: string
  description: string | null
  order_num: number | null
  icon: string | null
  is_active: boolean
  semester: number | null
}

type LessonRow = {
  id: string
  subject_id: string | null
  unit_id: string
  name: string
  description: string | null
  content: string | null
  order_num: number | null
  is_active: boolean
}

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

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function getBearerToken(req: NextRequest) {
  const authorization = req.headers.get('authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return null
  }

  return authorization.slice(7)
}

function uniqueValues<T>(values: Array<T | null | undefined>) {
  return [
    ...new Set(
      values.filter(
        (value): value is T => value !== null && value !== undefined
      )
    ),
  ]
}

function matchesOptionalContext(
  scopeValue: string | null,
  offeringValue: string | null
) {
  return !scopeValue || !offeringValue || scopeValue === offeringValue
}

function normalizeSemester(value: string | null) {
  if (!value) {
    return null
  }

  const parsed = Number(value)

  return Number.isInteger(parsed) ? parsed : null
}

function normalizeSubjectName(name: string) {
  return name.replace(/\s+/g, ' ').trim()
}

/*
  أولوية تحديد سجل المادة:
  1) سجل مشترك بلا تشعيب للمرحلة والصف.
  2) سجل يطابق التشعيب المحدد.
  3) أي سجل للمادة في المرحلة والصف.
*/
function findSubjectIdForContext(
  group: SubjectGroup | null,
  stage: string,
  grade: string,
  track: string
) {
  if (!group || !stage || !grade) {
    return ''
  }

  const sharedSubjectMatch = group.options.find((option) => {
    return (
      option.stage === stage &&
      option.grade === grade &&
      !option.track
    )
  })

  if (sharedSubjectMatch) {
    return sharedSubjectMatch.subjectId
  }

  const exactTrackMatch = group.options.find((option) => {
    return (
      option.stage === stage &&
      option.grade === grade &&
      option.track === track
    )
  })

  if (exactTrackMatch) {
    return exactTrackMatch.subjectId
  }

  const gradeMatch = group.options.find((option) => {
    return option.stage === stage && option.grade === grade
  })

  return gradeMatch?.subjectId || ''
}

export async function GET(req: NextRequest) {
  try {
    const token = getBearerToken(req)

    if (!token) {
      return jsonError('غير مصرح.', 401)
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return jsonError('غير مصرح.', 401)
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, role, user_type, status')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile) {
      return jsonError('تعذر التحقق من بيانات الحساب.', 401)
    }

    if (
      profile.status &&
      !['approved', 'active'].includes(profile.status)
    ) {
      return jsonError('حسابك غير مفعّل حاليًا.', 403)
    }

    const isAdmin = profile.role === 'admin'
    const isTeacher =
      profile.role === 'teacher' ||
      profile.user_type === 'teacher'

    if (!isAdmin && !isTeacher) {
      return jsonError('هذه الصفحة مخصصة للمعلمين فقط.', 403)
    }

    const { searchParams } = new URL(req.url)

    const selectedSubjectName = normalizeSubjectName(
      searchParams.get('subjectName') || ''
    )
    const selectedStage = searchParams.get('stage') || ''
    const selectedGrade = searchParams.get('grade') || ''
    const selectedTrack = searchParams.get('track') || ''
    const selectedSemester = searchParams.get('semester') || ''

    let scopes: TeacherScope[] = []

    if (isAdmin) {
      const { data: offerings, error: offeringsError } = await supabaseAdmin
        .from('subject_offerings')
        .select('id, subject_id, stage, grade, track')

      if (offeringsError) {
        console.error(
          'GET /api/teacher-content-context admin offerings error:',
          offeringsError
        )

        return jsonError('تعذر تحميل نطاقات مواد المنصة.', 500)
      }

      scopes = (offerings || []).map((offering) => ({
        id: offering.id,
        teacher_id: profile.id,
        subject_id: offering.subject_id,
        stage: offering.stage || null,
        grade: offering.grade || null,
        track: offering.track || null,
      }))
    } else {
      const { data: teacherScopes, error: scopesError } = await supabaseAdmin
        .from('teacher_scopes')
        .select('id, teacher_id, subject_id, stage, grade, track')
        .eq('teacher_id', profile.id)
        .not('subject_id', 'is', null)

      if (scopesError) {
        console.error(
          'GET /api/teacher-content-context teacher scopes error:',
          scopesError
        )

        return jsonError('تعذر تحميل نطاقات المعلم.', 500)
      }

      scopes = (teacherScopes || []) as TeacherScope[]
    }

    const scopedSubjectIds = uniqueValues(
      scopes.map((scope) => scope.subject_id)
    )

    if (scopedSubjectIds.length === 0) {
      return NextResponse.json({
        role: isAdmin ? 'admin' : 'teacher',
        subjectGroups: [],
        selectedSubjectId: '',
        stages: [],
        grades: [],
        tracks: [],
        semesters: [],
        units: [],
        lessons: [],
      })
    }

    const [
      { data: subjectRows, error: subjectsError },
      { data: offeringRows, error: offeringsError },
    ] = await Promise.all([
      supabaseAdmin
        .from('subjects')
        .select('id, name, description, stage, grade, icon, is_active')
        .in('id', scopedSubjectIds)
        .eq('is_active', true)
        .order('name', { ascending: true }),

      supabaseAdmin
        .from('subject_offerings')
        .select('id, subject_id, stage, grade, track')
        .in('subject_id', scopedSubjectIds),
    ])

    if (subjectsError) {
      console.error(
        'GET /api/teacher-content-context subjects error:',
        subjectsError
      )

      return jsonError('تعذر تحميل المواد المتاحة.', 500)
    }

    if (offeringsError) {
      console.error(
        'GET /api/teacher-content-context offerings error:',
        offeringsError
      )

      return jsonError('تعذر تحميل بيانات الصفوف والتشعيبات.', 500)
    }

    const rawSubjects = (subjectRows || []) as SubjectRow[]
    const allOfferings = (offeringRows || []) as SubjectOffering[]

    const allowedOfferings = allOfferings.filter((offering) => {
      return scopes.some((scope) => {
        if (scope.subject_id !== offering.subject_id) {
          return false
        }

        return (
          matchesOptionalContext(scope.stage, offering.stage) &&
          matchesOptionalContext(scope.grade, offering.grade) &&
          matchesOptionalContext(scope.track, offering.track)
        )
      })
    })

    const groupsMap = new Map<string, SubjectGroup>()

    for (const subject of rawSubjects) {
      const name = normalizeSubjectName(subject.name)

      if (!groupsMap.has(name)) {
        groupsMap.set(name, {
          key: name,
          name,
          description: subject.description || null,
          icon: subject.icon || null,
          options: [],
        })
      }

      const group = groupsMap.get(name)

      if (!group) {
        continue
      }

      const subjectOfferings = allowedOfferings.filter(
        (offering) => offering.subject_id === subject.id
      )

      if (subjectOfferings.length === 0) {
        const isAlreadyAdded = group.options.some(
          (option) => option.subjectId === subject.id
        )

        if (!isAlreadyAdded) {
          group.options.push({
            subjectId: subject.id,
            stage: subject.stage || null,
            grade: subject.grade || null,
            track: null,
          })
        }

        continue
      }

      for (const offering of subjectOfferings) {
        const isAlreadyAdded = group.options.some((option) => {
          return (
            option.subjectId === subject.id &&
            option.stage === offering.stage &&
            option.grade === offering.grade &&
            option.track === offering.track
          )
        })

        if (!isAlreadyAdded) {
          group.options.push({
            subjectId: subject.id,
            stage: offering.stage || null,
            grade: offering.grade || null,
            track: offering.track || null,
          })
        }
      }
    }

    const subjectGroups = Array.from(groupsMap.values())
      .filter((group) => group.options.length > 0)
      .sort((firstGroup, secondGroup) =>
        firstGroup.name.localeCompare(secondGroup.name, 'ar')
      )

    const selectedGroup =
      subjectGroups.find(
        (group) => group.name === selectedSubjectName
      ) || null

    const selectedSubjectId = findSubjectIdForContext(
      selectedGroup,
      selectedStage,
      selectedGrade,
      selectedTrack
    )

    const stages = uniqueValues(
      selectedGroup?.options.map((option) => option.stage) || []
    )

    const grades = uniqueValues(
      (selectedGroup?.options || [])
        .filter(
          (option) =>
            !selectedStage || option.stage === selectedStage
        )
        .map((option) => option.grade)
    )

    const tracks = uniqueValues(
      (selectedGroup?.options || [])
        .filter(
          (option) =>
            !selectedStage || option.stage === selectedStage
        )
        .filter(
          (option) =>
            !selectedGrade || option.grade === selectedGrade
        )
        .map((option) => option.track)
    )

    let units: UnitRow[] = []
    let lessons: LessonRow[] = []
    let semesters: string[] = []

    if (selectedSubjectId) {
      const { data: unitRows, error: unitsError } = await supabaseAdmin
        .from('units')
        .select(`
          id,
          subject_id,
          name,
          description,
          order_num,
          icon,
          is_active,
          semester
        `)
        .eq('subject_id', selectedSubjectId)
        .eq('is_active', true)
        .order('semester', { ascending: true })
        .order('order_num', { ascending: true })

      if (unitsError) {
        console.error(
          'GET /api/teacher-content-context units error:',
          unitsError
        )

        return jsonError('تعذر تحميل وحدات المادة.', 500)
      }

      const allUnits = (unitRows || []) as UnitRow[]

      semesters = uniqueValues(
        allUnits
          .map((unit) => unit.semester)
          .filter((semester): semester is number => semester !== null)
          .map(String)
      )

      const requestedSemester = normalizeSemester(selectedSemester)

      units = allUnits.filter((unit) => {
        if (requestedSemester === null) {
          return true
        }

        return unit.semester === requestedSemester
      })

      const unitIds = units.map((unit) => unit.id)

      if (unitIds.length > 0) {
        const { data: lessonRows, error: lessonsError } = await supabaseAdmin
          .from('lessons')
          .select(`
            id,
            subject_id,
            unit_id,
            name,
            description,
            content,
            order_num,
            is_active
          `)
          .in('unit_id', unitIds)
          .eq('is_active', true)
          .order('order_num', { ascending: true })

        if (lessonsError) {
          console.error(
            'GET /api/teacher-content-context lessons error:',
            lessonsError
          )

          return jsonError('تعذر تحميل دروس المادة.', 500)
        }

        lessons = (lessonRows || []) as LessonRow[]
      }
    }

    return NextResponse.json({
      role: isAdmin ? 'admin' : 'teacher',
      subjectGroups,
      selectedSubjectId,
      stages,
      grades,
      tracks,
      semesters,
      units,
      lessons,
    })
  } catch (error: unknown) {
    console.error('GET /api/teacher-content-context error:', error)

    const message =
      error instanceof Error
        ? error.message
        : 'حدث خطأ أثناء تحميل بيانات المحتوى.'

    return jsonError(message, 500)
  }
}