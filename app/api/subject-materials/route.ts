import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const BUCKET_NAME = 'materials'
const MAX_FILE_SIZE = 25 * 1024 * 1024

type UserProfile = {
  id: string
  role: string | null
  user_type: string | null
  status: string | null
}

type CurrentUserResult = {
  profile: UserProfile | null
  response: NextResponse | null
}

function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

function getBearerToken(req: NextRequest): string | null {
  const authorization = req.headers.get('authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return null
  }

  const token = authorization.slice(7).trim()

  return token || null
}

function normalizeValue(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : ''
}

function sanitizePathSegment(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function getSafeExtension(fileName: string, mimeType: string): string {
  const extension = fileName
    .split('.')
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, '')

  if (extension) {
    return extension
  }

  const extensionsByMimeType: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      'docx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      'pptx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      'xlsx',
    'text/plain': 'txt',
    'application/rtf': 'rtf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
  }

  return extensionsByMimeType[mimeType] || 'bin'
}

function buildStoragePath({
  subjectId,
  materialScope,
  userId,
  stage,
  grade,
  track,
  semester,
  unitId,
  lessonId,
  file,
}: {
  subjectId: string
  materialScope: 'official' | 'teacher_private'
  userId: string
  stage: string
  grade: string
  track: string
  semester: string
  unitId: string
  lessonId: string
  file: File
}): string {
  const extension = getSafeExtension(file.name, file.type)

  const pathParts = [
    'subject-materials',
    sanitizePathSegment(subjectId) || 'subject',
    materialScope,
    sanitizePathSegment(userId) || 'user',
    sanitizePathSegment(stage) || 'all-stages',
    sanitizePathSegment(grade) || 'all-grades',
    sanitizePathSegment(track) || 'all-tracks',
    sanitizePathSegment(semester) || 'all-semesters',
    sanitizePathSegment(unitId) || 'all-units',
    sanitizePathSegment(lessonId) || 'all-lessons',
  ]

  const technicalFileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`

  return `${pathParts.join('/')}/${technicalFileName}`
}

async function getCurrentUser(
  req: NextRequest
): Promise<CurrentUserResult> {
  const token = getBearerToken(req)

  if (!token) {
    return {
      profile: null,
      response: errorResponse(
        'انتهت الجلسة أو لم يتم إرسال رمز الدخول. سجّل الدخول مرة أخرى.',
        401
      ),
    }
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token)

  if (authError || !user) {
    return {
      profile: null,
      response: errorResponse(
        'تعذر التحقق من جلسة المستخدم. سجّل الدخول مرة أخرى.',
        401
      ),
    }
  }

  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('users')
    .select('id, role, user_type, status')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profileData) {
    console.error(
      'subject-materials profile lookup error:',
      profileError
    )

    return {
      profile: null,
      response: errorResponse(
        'تعذر التحقق من بيانات حساب المستخدم.',
        401
      ),
    }
  }

  const profile = profileData as UserProfile

  const isAdminUser = profile.role === 'admin'
  const isTeacherUser =
    profile.role === 'teacher' || profile.user_type === 'teacher'

  if (!isAdminUser && !isTeacherUser) {
    return {
      profile: null,
      response: errorResponse(
        'هذه الصفحة متاحة للمعلمين وإدارة المنصة فقط.',
        403
      ),
    }
  }

  if (
    profile.status &&
    !['approved', 'active'].includes(profile.status)
  ) {
    return {
      profile: null,
      response: errorResponse('حسابك غير مفعّل حاليًا.', 403),
    }
  }

  return {
    profile,
    response: null,
  }
}

function isAdmin(profile: UserProfile): boolean {
  return profile.role === 'admin'
}

async function canTeacherUseSubject(
  teacherId: string,
  subjectId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('teacher_scopes')
    .select('id')
    .eq('teacher_id', teacherId)
    .eq('subject_id', subjectId)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('teacher_scopes lookup error:', error)
    throw new Error('تعذر التحقق من صلاحية المعلم للمادة.')
  }

  return Boolean(data)
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const currentUser = await getCurrentUser(req)

    if (!currentUser.profile) {
      return (
        currentUser.response ||
        errorResponse('تعذر التحقق من هوية المستخدم.', 401)
      )
    }

    const profile = currentUser.profile
    const { searchParams } = new URL(req.url)

    const subjectId = searchParams.get('subjectId')?.trim() || ''
    const stage = searchParams.get('stage')?.trim() || ''
    const grade = searchParams.get('grade')?.trim() || ''
    const track = searchParams.get('track')?.trim() || ''
    const semester = searchParams.get('semester')?.trim() || ''
    const unitId = searchParams.get('unitId')?.trim() || ''
    const lessonId = searchParams.get('lessonId')?.trim() || ''

    if (!subjectId) {
      return errorResponse('معرّف المادة مطلوب.', 400)
    }

    if (
      !isAdmin(profile) &&
      !(await canTeacherUseSubject(profile.id, subjectId))
    ) {
      return errorResponse('ليس لديك صلاحية للوصول إلى هذه المادة.', 403)
    }

    let query = supabaseAdmin
      .from('subject_material_files')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (stage) {
      query = query.eq('stage', stage)
    }

    if (grade) {
      query = query.eq('grade', grade)
    }

    if (track) {
      query = query.or(`track.is.null,track.eq.${track}`)
    } else {
      query = query.is('track', null)
    }

    if (semester) {
      query = query.eq('semester', semester)
    }

    if (unitId) {
      query = query.eq('unit_id', unitId)
    }

    if (lessonId) {
      query = query.eq('lesson_id', lessonId)
    }

    const { data, error } = await query

    if (error) {
      console.error('GET /api/subject-materials error:', error)

      return errorResponse('تعذر تحميل ملفات المادة.', 500)
    }

    const materials = (data || []).filter((material) => {
      if (isAdmin(profile)) {
        return true
      }

      return (
        material.is_official === true ||
        material.material_scope === 'official' ||
        material.uploaded_by === profile.id
      )
    })

    return NextResponse.json({ materials })
  } catch (error: unknown) {
    console.error('GET /api/subject-materials unexpected error:', error)

    const message =
      error instanceof Error
        ? error.message
        : 'حدث خطأ غير متوقع أثناء تحميل ملفات المادة.'

    return errorResponse(message, 500)
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let uploadedPath = ''

  try {
    const currentUser = await getCurrentUser(req)

    if (!currentUser.profile) {
      return (
        currentUser.response ||
        errorResponse('تعذر التحقق من هوية المستخدم.', 401)
      )
    }

    const profile = currentUser.profile
    const formData = await req.formData()

    const subjectId = normalizeValue(formData.get('subjectId'))
    const title = normalizeValue(formData.get('title'))
    const description = normalizeValue(formData.get('description'))
    const stage = normalizeValue(formData.get('stage'))
    const grade = normalizeValue(formData.get('grade'))
    const track = normalizeValue(formData.get('track'))
    const semester = normalizeValue(formData.get('semester'))
    const unitId = normalizeValue(formData.get('unitId'))
    const lessonId = normalizeValue(formData.get('lessonId'))
    const fileEntry = formData.get('file')

    console.log('POST /api/subject-materials received:', {
      subjectId,
      title,
      hasDescription: Boolean(description),
      stage,
      grade,
      track,
      semester,
      unitId,
      lessonId,
      fileFieldType:
        fileEntry instanceof File
          ? 'File'
          : fileEntry === null
            ? 'missing'
            : typeof fileEntry,
      fileName: fileEntry instanceof File ? fileEntry.name : null,
      fileSize: fileEntry instanceof File ? fileEntry.size : null,
      fileMimeType: fileEntry instanceof File ? fileEntry.type : null,
      userId: profile.id,
      role: profile.role,
    })

    if (!subjectId) {
      return errorResponse(
        'لم يتم تحديد المادة. اختر المادة ثم حاول الرفع مرة أخرى.',
        400
      )
    }

    if (!title) {
      return errorResponse(
        'عنوان الملف مطلوب. اكتب عنوانًا للمادة قبل الرفع.',
        400
      )
    }

    if (!(fileEntry instanceof File)) {
      return errorResponse(
        'لم يتم استلام الملف. اختر ملفًا ثم أعد المحاولة.',
        400
      )
    }

    if (fileEntry.size === 0) {
      return errorResponse('الملف المحدد فارغ ولا يمكن رفعه.', 400)
    }

    if (fileEntry.size > MAX_FILE_SIZE) {
      return errorResponse(
        'حجم الملف أكبر من الحد المسموح به، وهو 25 ميغابايت.',
        400
      )
    }

    const adminUser = isAdmin(profile)

    if (
      !adminUser &&
      !(await canTeacherUseSubject(profile.id, subjectId))
    ) {
      return errorResponse(
        'ليس لديك صلاحية رفع ملفات لهذه المادة.',
        403
      )
    }

    const { data: subject, error: subjectError } = await supabaseAdmin
      .from('subjects')
      .select('id, allow_teacher_uploads')
      .eq('id', subjectId)
      .maybeSingle()

    if (subjectError) {
      console.error('subject lookup error:', subjectError)

      return errorResponse('تعذر التحقق من المادة المحددة.', 500)
    }

    if (!subject) {
      return errorResponse('المادة المحددة غير موجودة.', 404)
    }

    if (!adminUser && subject.allow_teacher_uploads === false) {
      return errorResponse(
        'رفع الملفات غير مفعّل للمعلمين في هذه المادة.',
        403
      )
    }

    const materialScope: 'official' | 'teacher_private' = adminUser
      ? 'official'
      : 'teacher_private'

    uploadedPath = buildStoragePath({
      subjectId,
      materialScope,
      userId: profile.id,
      stage,
      grade,
      track,
      semester,
      unitId,
      lessonId,
      file: fileEntry,
    })

    const fileBuffer = await fileEntry.arrayBuffer()

    const { error: storageError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(uploadedPath, fileBuffer, {
        contentType: fileEntry.type || 'application/octet-stream',
        upsert: false,
      })

    if (storageError) {
      console.error('Supabase storage upload error:', storageError)

      return errorResponse(
        `تعذر رفع الملف إلى مساحة التخزين: ${storageError.message}`,
        500
      )
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uploadedPath)

    const { data: material, error: databaseError } = await supabaseAdmin
      .from('subject_material_files')
      .insert({
        subject_id: subjectId,
        title,
        description: description || null,
        file_name: fileEntry.name,
        file_url: publicUrlData.publicUrl,
        file_path: uploadedPath,
        mime_type: fileEntry.type || null,
        file_size: fileEntry.size,
        owner_type: adminUser ? 'admin' : 'teacher',
        uploaded_by: profile.id,
        is_official: adminUser,
        is_visible_to_teachers: true,
        material_scope: materialScope,
        is_active: true,
        stage: stage || null,
        grade: grade || null,
        track: track || null,
        semester: semester || null,
        unit_id: unitId || null,
        lesson_id: lessonId || null,
        source_type: 'uploaded',
      })
      .select('*')
      .single()

    if (databaseError) {
      console.error(
        'subject_material_files insert error:',
        databaseError
      )

      await supabaseAdmin.storage.from(BUCKET_NAME).remove([uploadedPath])
      uploadedPath = ''

      return errorResponse(
        `تم رفع الملف مؤقتًا، لكن تعذر حفظ بياناته: ${databaseError.message}`,
        500
      )
    }

    return NextResponse.json(
      {
        message: 'تم رفع الملف وربطه بالمادة والصف والدرس بنجاح.',
        material,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('POST /api/subject-materials unexpected error:', error)

    if (uploadedPath) {
      const { error: deleteError } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .remove([uploadedPath])

      if (deleteError) {
        console.error(
          'Unable to remove failed uploaded material:',
          deleteError
        )
      }
    }

    const message =
      error instanceof Error
        ? error.message
        : 'حدث خطأ غير متوقع أثناء رفع الملف.'

    return errorResponse(message, 500)
  }
}