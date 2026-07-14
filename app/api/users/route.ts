import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, requireAdminOrPermission } from '@/lib/server/auth'

const SELECT_COLUMNS =
  'id, email, phone, username, full_name, name, role, user_type, approved, status, allowed_stages, allowed_grades, track'

type UserRow = {
  id: string
  email: string | null
  phone?: string | null
  username?: string | null
  full_name?: string | null
  name?: string | null
  role?: string | null
  user_type?: string | null
  approved?: boolean | null
  status?: string | null
  allowed_stages?: string[] | null
  allowed_grades?: string[] | null
  track?: string | null
}

function mapUserRow(row: UserRow) {
  return {
    id: row.id,
    email: row.email ?? null,
    phone: row.phone ?? null,
    username: row.username ?? null,
    full_name: row.full_name ?? row.name ?? null,
    name: row.name ?? row.full_name ?? null,
    role: row.role ?? null,
    user_type: row.user_type ?? null,
    approved: row.approved ?? null,
    status: row.status ?? null,
    allowed_stages: row.allowed_stages ?? [],
    allowed_grades: row.allowed_grades ?? [],
    track: row.track ?? null,
  }
}

function normalizeText(value: unknown) {
  return String(value ?? '').trim()
}

function normalizeEmail(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function normalizeUsername(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function normalizePhone(value: unknown) {
  let phone = String(value ?? '').trim()
  if (!phone) return ''

  phone = phone.replace(/[^\d+]/g, '')

  if (phone.startsWith('00')) {
    phone = `+${phone.slice(2)}`
  }

  return phone
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidPhone(value: string) {
  return /^\+?\d{8,15}$/.test(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

function validateTrackValue(track: unknown): string | null {
  if (track === null) return null
  if (track !== 'scientific' && track !== 'literary') {
    return 'التشعيب (track) يجب أن يكون scientific أو literary أو null.'
  }
  return null
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminOrPermission(req, 'manage_student_accounts')
  if (!auth.ok) return auth.response

  try {
    const supabase = getServiceClient()

    const searchParams = req.nextUrl.searchParams
    const role = searchParams.get('role')?.trim() || null
    const status = searchParams.get('status')?.trim() || null
    const q = searchParams.get('q')?.trim() || null

    let query = supabase
      .from('users')
      .select(SELECT_COLUMNS)
      .order('full_name', { ascending: true })

    if (role) {
      query = query.eq('role', role)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (q) {
      query = query.or(
        [
          `full_name.ilike.%${q}%`,
          `name.ilike.%${q}%`,
          `email.ilike.%${q}%`,
          `username.ilike.%${q}%`,
          `phone.ilike.%${q}%`,
        ].join(',')
      )
    }

    const { data, error } = await query

    if (error) {
      console.error('Users GET query error:', error)
      return NextResponse.json(
        { error: error.message || 'فشل جلب المستخدمين.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      items: (data ?? []).map(row => mapUserRow(row as UserRow)),
    })
  } catch (err) {
    console.error('Users GET error', err)
    return NextResponse.json(
      { error: 'Unexpected error while loading users.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminOrPermission(req, 'manage_student_accounts')
  if (!auth.ok) return auth.response

  try {
    const supabase = getServiceClient()

    const body = (await req.json().catch(() => null)) as
      | {
          full_name?: string
          username?: string
          email?: string | null
          phone?: string | null
          password?: string
          allowed_stages?: string[]
          allowed_grades?: string[]
          track?: string | null
        }
      | null

    if (!body) {
      return NextResponse.json(
        { error: 'البيانات المرسلة غير صالحة.' },
        { status: 400 }
      )
    }

    const fullName = normalizeText(body.full_name)
    const username = normalizeUsername(body.username)
    const email = normalizeEmail(body.email)
    const phone = normalizePhone(body.phone)
    const password = String(body.password ?? '')
    const allowed_stages = body.allowed_stages ?? []
    const allowed_grades = body.allowed_grades ?? []
    const track = typeof body.track === 'undefined' ? null : body.track

    if (!fullName) {
      return NextResponse.json(
        { error: 'الاسم الكامل مطلوب.' },
        { status: 400 }
      )
    }

    if (!username) {
      return NextResponse.json(
        { error: 'اسم المستخدم مطلوب.' },
        { status: 400 }
      )
    }

    if (!/^[a-z0-9._-]{3,30}$/i.test(username)) {
      return NextResponse.json(
        {
          error:
            'اسم المستخدم يجب أن يكون من 3 إلى 30 حرفًا/رقمًا، ويُسمح بـ . _ - فقط.',
        },
        { status: 400 }
      )
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب ألا تقل عن 8 أحرف.' },
        { status: 400 }
      )
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'أدخل البريد الإلكتروني أو رقم الهاتف على الأقل.' },
        { status: 400 }
      )
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني غير صالح.' },
        { status: 400 }
      )
    }

    if (phone && !isValidPhone(phone)) {
      return NextResponse.json(
        { error: 'رقم الهاتف غير صالح.' },
        { status: 400 }
      )
    }

    if (!isStringArray(allowed_stages)) {
      return NextResponse.json(
        { error: 'allowed_stages يجب أن تكون مصفوفة نصوص.' },
        { status: 400 }
      )
    }

    if (!isStringArray(allowed_grades)) {
      return NextResponse.json(
        { error: 'allowed_grades يجب أن تكون مصفوفة نصوص.' },
        { status: 400 }
      )
    }

    const trackError = validateTrackValue(track)
    if (trackError) {
      return NextResponse.json({ error: trackError }, { status: 400 })
    }

    const needsTrack = allowed_grades.some(g => g === '11' || g === '12')
    if (needsTrack && !track) {
      return NextResponse.json(
        { error: 'الصف 11 أو 12 يتطلب تحديد التشعيب.' },
        { status: 400 }
      )
    }

    const { data: existingUsername, error: usernameCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (usernameCheckError) {
      return NextResponse.json(
        { error: usernameCheckError.message || 'تعذر التحقق من اسم المستخدم.' },
        { status: 500 }
      )
    }

    if (existingUsername) {
      return NextResponse.json(
        { error: 'اسم المستخدم مستخدم بالفعل.' },
        { status: 409 }
      )
    }

    if (email) {
      const { data: existingEmail, error: emailCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (emailCheckError) {
        return NextResponse.json(
          { error: emailCheckError.message || 'تعذر التحقق من البريد الإلكتروني.' },
          { status: 500 }
        )
      }

      if (existingEmail) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني مستخدم بالفعل.' },
          { status: 409 }
        )
      }
    }

    if (phone) {
      const { data: existingPhone, error: phoneCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('phone', phone)
        .maybeSingle()

      if (phoneCheckError) {
        return NextResponse.json(
          { error: phoneCheckError.message || 'تعذر التحقق من رقم الهاتف.' },
          { status: 500 }
        )
      }

      if (existingPhone) {
        return NextResponse.json(
          { error: 'رقم الهاتف مستخدم بالفعل.' },
          { status: 409 }
        )
      }
    }

    const createPayload: {
      email?: string
      phone?: string
      password: string
      email_confirm?: boolean
      phone_confirm?: boolean
      user_metadata?: Record<string, unknown>
    } = {
      password,
      user_metadata: {
        full_name: fullName,
        username,
        role: 'student',
        user_type: 'student',
      },
    }

    if (email) {
      createPayload.email = email
      createPayload.email_confirm = true
    }

    if (phone) {
      createPayload.phone = phone
      createPayload.phone_confirm = true
    }

    const { data: createdAuth, error: createAuthError } =
      await supabase.auth.admin.createUser(createPayload)

    if (createAuthError || !createdAuth?.user?.id) {
      return NextResponse.json(
        { error: createAuthError?.message || 'فشل إنشاء حساب الدخول.' },
        { status: 500 }
      )
    }

    const authUserId = createdAuth.user.id

    const { data: userRow, error: userInsertError } = await supabase
      .from('users')
      .upsert(
        {
          id: authUserId,
          email: email || null,
          phone: phone || null,
          username,
          full_name: fullName,
          name: fullName,
          role: 'student',
          user_type: 'student',
          approved: true,
          status: 'approved',
          allowed_stages,
          allowed_grades,
          track: track ?? null,
        },
        { onConflict: 'id' }
      )
      .select(SELECT_COLUMNS)
      .single()

    if (userInsertError) {
      try {
        await supabase.auth.admin.deleteUser(authUserId)
      } catch (cleanupErr) {
        console.error('POST /api/users cleanup auth delete error:', cleanupErr)
      }

      return NextResponse.json(
        { error: userInsertError.message || 'فشل حفظ بيانات الطالب.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        item: mapUserRow(userRow as UserRow),
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Users POST error', err)
    return NextResponse.json(
      { error: 'Unexpected error while creating user.' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminOrPermission(req, 'manage_student_accounts')
  if (!auth.ok) return auth.response

  try {
    const supabase = getServiceClient()

    const body = (await req.json().catch(() => null)) as
      | {
          userId?: string
          full_name?: string
          name?: string
          email?: string | null
          phone?: string | null
          username?: string
          role?: string
          user_type?: string
          approved?: boolean
          status?: string
          allowed_stages?: string[] | string
          allowed_grades?: string[] | string
          track?: string | null
        }
      | null

    if (!body || !body.userId) {
      return NextResponse.json(
        { error: 'معرّف المستخدم userId مطلوب.' },
        { status: 400 }
      )
    }

    const userId = String(body.userId).trim()
    if (!userId) {
      return NextResponse.json(
        { error: 'معرّف المستخدم غير صالح.' },
        { status: 400 }
      )
    }

    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id, allowed_grades, track')
      .eq('id', userId)
      .single()

    if (existingUserError || !existingUser) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود.' },
        { status: 404 }
      )
    }

    const updates: Record<string, unknown> = {}

    if (typeof body.full_name !== 'undefined' || typeof body.name !== 'undefined') {
      const fullName = normalizeText(body.full_name ?? body.name)
      if (!fullName) {
        return NextResponse.json(
          { error: 'الاسم الكامل غير صالح.' },
          { status: 400 }
        )
      }
      updates.full_name = fullName
      updates.name = fullName
    }

    if (typeof body.email !== 'undefined') {
      const email = body.email === null ? null : normalizeEmail(body.email)
      if (email && !isValidEmail(email)) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني غير صالح.' },
          { status: 400 }
        )
      }
      updates.email = email
    }

    if (typeof body.phone !== 'undefined') {
      const phone = body.phone === null ? null : normalizePhone(body.phone)
      if (phone && !isValidPhone(phone)) {
        return NextResponse.json(
          { error: 'رقم الهاتف غير صالح.' },
          { status: 400 }
        )
      }
      updates.phone = phone
    }

    if (typeof body.username !== 'undefined') {
      const username = normalizeUsername(body.username)

      if (!username) {
        return NextResponse.json(
          { error: 'اسم المستخدم غير صالح.' },
          { status: 400 }
        )
      }

      if (!/^[a-z0-9._-]{3,30}$/i.test(username)) {
        return NextResponse.json(
          {
            error:
              'اسم المستخدم يجب أن يكون من 3 إلى 30 حرفًا/رقمًا، ويُسمح بـ . _ - فقط.',
          },
          { status: 400 }
        )
      }

      const { data: existingUsername, error: usernameCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .neq('id', userId)
        .maybeSingle()

      if (usernameCheckError) {
        return NextResponse.json(
          { error: usernameCheckError.message || 'تعذر التحقق من اسم المستخدم.' },
          { status: 500 }
        )
      }

      if (existingUsername) {
        return NextResponse.json(
          { error: 'اسم المستخدم مستخدم بالفعل.' },
          { status: 409 }
        )
      }

      updates.username = username
    }

    if (typeof body.role !== 'undefined') {
      updates.role = body.role
    }

    if (typeof body.user_type !== 'undefined') {
      updates.user_type = body.user_type
    }

    if (typeof body.approved !== 'undefined') {
      updates.approved = body.approved
    }

    if (typeof body.status !== 'undefined') {
      updates.status = body.status
    }

    let nextAllowedStages = existingUser.allowed_grades ? undefined : undefined
    void nextAllowedStages

    let nextAllowedGrades = (existingUser.allowed_grades ?? []) as string[]
    let nextTrack = existingUser.track ?? null

    if (typeof body.allowed_stages !== 'undefined') {
      const allowedStages = Array.isArray(body.allowed_stages)
        ? body.allowed_stages
        : body.allowed_stages
        ? [String(body.allowed_stages)]
        : []

      if (!isStringArray(allowedStages)) {
        return NextResponse.json(
          { error: 'allowed_stages يجب أن تكون مصفوفة نصوص.' },
          { status: 400 }
        )
      }

      updates.allowed_stages = allowedStages
    }

    if (typeof body.allowed_grades !== 'undefined') {
      const allowedGrades = Array.isArray(body.allowed_grades)
        ? body.allowed_grades
        : body.allowed_grades
        ? [String(body.allowed_grades)]
        : []

      if (!isStringArray(allowedGrades)) {
        return NextResponse.json(
          { error: 'allowed_grades يجب أن تكون مصفوفة نصوص.' },
          { status: 400 }
        )
      }

      nextAllowedGrades = allowedGrades
      updates.allowed_grades = allowedGrades
    }

    if (typeof body.track !== 'undefined') {
      const trackError = validateTrackValue(body.track)
      if (trackError) {
        return NextResponse.json({ error: trackError }, { status: 400 })
      }

      nextTrack = body.track
      updates.track = body.track
    }

    const needsTrack = nextAllowedGrades.some(g => g === '11' || g === '12')
    if (needsTrack && !nextTrack) {
      return NextResponse.json(
        { error: 'الصف 11 أو 12 يتطلب تحديد التشعيب.' },
        { status: 400 }
      )
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'لا توجد بيانات للتحديث.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select(SELECT_COLUMNS)
      .single()

    if (error) {
      console.error('Users PATCH error:', error)
      return NextResponse.json(
        { error: error.message || 'فشل تحديث المستخدم.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      item: mapUserRow(data as UserRow),
    })
  } catch (err) {
    console.error('Users PATCH unexpected error:', err)
    return NextResponse.json(
      { error: 'Unexpected error while updating user.' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminOrPermission(req, 'manage_student_accounts')
  if (!auth.ok) return auth.response

  try {
    const supabase = getServiceClient()

    const body = (await req.json().catch(() => null)) as
      | {
          userId?: string
        }
      | null

    if (!body?.userId) {
      return NextResponse.json(
        { error: 'معرّف المستخدم userId مطلوب.' },
        { status: 400 }
      )
    }

    const userId = String(body.userId).trim()
    if (!userId) {
      return NextResponse.json(
        { error: 'معرّف المستخدم غير صالح.' },
        { status: 400 }
      )
    }

    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id, role, user_type')
      .eq('id', userId)
      .maybeSingle()

    if (existingUserError) {
      return NextResponse.json(
        { error: existingUserError.message || 'تعذر التحقق من المستخدم.' },
        { status: 500 }
      )
    }

    if (!existingUser) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود.' },
        { status: 404 }
      )
    }

    const { error: subscriptionsDeleteError } = await supabase
      .from('student_subscriptions')
      .delete()
      .eq('student_id', userId)

    if (subscriptionsDeleteError) {
      console.error('Users DELETE subscriptions delete error:', subscriptionsDeleteError)
      return NextResponse.json(
        { error: subscriptionsDeleteError.message || 'فشل حذف اشتراكات الطالب.' },
        { status: 500 }
      )
    }

    const { error: userDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (userDeleteError) {
      console.error('Users DELETE user row delete error:', userDeleteError)
      return NextResponse.json(
        { error: userDeleteError.message || 'فشل حذف سجل المستخدم.' },
        { status: 500 }
      )
    }

    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      console.error('Users DELETE auth delete error:', authDeleteError)
      return NextResponse.json(
        { error: authDeleteError.message || 'تم حذف سجل المستخدم لكن فشل حذف حساب الدخول.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح.',
    })
  } catch (err) {
    console.error('Users DELETE unexpected error:', err)
    return NextResponse.json(
      { error: 'Unexpected error while deleting user.' },
      { status: 500 }
    )
  }
}