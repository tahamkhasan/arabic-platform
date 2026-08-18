import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeText(value: unknown) {
  return String(value ?? '').trim()
}

function normalizeEmail(value: unknown) {
  return normalizeText(value).toLowerCase()
}

function normalizeUsername(value: unknown) {
  return normalizeText(value).toLowerCase()
}

function isDuplicateError(message: string) {
  const text = message.toLowerCase()

  return (
    text.includes('already registered') ||
    text.includes('already exists') ||
    text.includes('duplicate') ||
    text.includes('unique')
  )
}

export async function POST(req: NextRequest) {
  let authUserId: string | null = null

  try {
    const body = await req.json()

    const name = normalizeText(body.name)
    const email = normalizeEmail(body.email)
    const username = normalizeUsername(body.username)
    const password = String(body.password ?? '')
    const subjectId = normalizeText(
      body.subjectId || body.subject_id
    )

    if (!name || !email || !username || !password || !subjectId) {
      return NextResponse.json(
        {
          error:
            'الاسم والبريد الإلكتروني واسم المستخدم وكلمة المرور والمادة مطلوبة',
        },
        { status: 400 }
      )
    }

    if (name.length < 3 || name.length > 100) {
      return NextResponse.json(
        { error: 'يجب أن يكون الاسم بين 3 و100 حرف' },
        { status: 400 }
      )
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني غير صالح' },
        { status: 400 }
      )
    }

    if (!USERNAME_RE.test(username)) {
      return NextResponse.json(
        {
          error:
            'اسم المستخدم يجب أن يتكون من 3 إلى 30 حرفًا إنجليزيًا أو رقمًا أو شرطة سفلية فقط',
        },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
        { status: 400 }
      )
    }

    const [
      { data: existingUsername, error: usernameCheckError },
      { data: plan, error: planError },
      { data: subject, error: subjectError },
    ] = await Promise.all([
      supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle(),

      supabaseAdmin
        .from('account_plans')
        .select('id, code, target_type, billing_period, limits, is_active')
        .eq('code', 'teacher_trial')
        .eq('is_active', true)
        .maybeSingle(),

      supabaseAdmin
        .from('subjects')
        .select('id, name, is_active')
        .eq('id', subjectId)
        .maybeSingle(),
    ])

    if (usernameCheckError) {
      throw usernameCheckError
    }

    if (existingUsername) {
      return NextResponse.json(
        { error: 'اسم المستخدم مستخدم بالفعل، اختر اسمًا آخر' },
        { status: 409 }
      )
    }

    if (planError) {
      throw planError
    }

    if (
      !plan ||
      plan.target_type !== 'teacher' ||
      plan.billing_period !== 'trial'
    ) {
      return NextResponse.json(
        { error: 'خطة تجربة المعلم غير متاحة حاليًا' },
        { status: 503 }
      )
    }

    if (subjectError) {
      throw subjectError
    }

    if (!subject || !subject.is_active) {
      return NextResponse.json(
        { error: 'المادة المختارة غير موجودة أو غير متاحة حاليًا' },
        { status: 400 }
      )
    }

    const trialDaysRaw =
      plan.limits &&
      typeof plan.limits === 'object' &&
      !Array.isArray(plan.limits)
        ? (plan.limits as Record<string, unknown>).trial_days
        : null

    const trialDays = Number(trialDaysRaw)

    if (!Number.isInteger(trialDays) || trialDays < 1 || trialDays > 90) {
      return NextResponse.json(
        { error: 'إعداد مدة التجربة غير صالح' },
        { status: 503 }
      )
    }

    const now = new Date()
    const trialEndsAt = new Date(
      now.getTime() + trialDays * 24 * 60 * 60 * 1000
    )

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          username,
          account_mode: 'independent',
          selected_subject_id: subject.id,
          selected_subject_name: subject.name,
        },
      })

    if (authError) {
      if (isDuplicateError(authError.message ?? '')) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني مسجل مسبقًا' },
          { status: 409 }
        )
      }

      throw authError
    }

    authUserId = authData.user.id

    const { error: userError } = await supabaseAdmin.from('users').insert({
      id: authUserId,
      email,
      full_name: name,
      username,
      role: 'teacher',
      user_type: 'teacher',
      assigned_role_key: 'teacher',
      status: 'approved',
      is_active: true,
      account_mode: 'independent',
      trial_started_at: now.toISOString(),
      trial_ends_at: trialEndsAt.toISOString(),
      allowed_stages: [],
      allowed_grades: [],
    })

    if (userError) {
      if (isDuplicateError(userError.message ?? '')) {
        return NextResponse.json(
          { error: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل' },
          { status: 409 }
        )
      }

      throw userError
    }

    const { error: scopeError } = await supabaseAdmin
      .from('teacher_scopes')
      .insert({
        teacher_id: authUserId,
        subject_id: subject.id,
        stage: null,
        grade: null,
        track: null,
        semester: null,
      })

    if (scopeError) {
      throw scopeError
    }

    const { error: subscriptionError } = await supabaseAdmin
      .from('account_subscriptions')
      .insert({
        owner_type: 'user',
        owner_user_id: authUserId,
        owner_school_id: null,
        plan_id: plan.id,
        status: 'active',
        starts_at: now.toISOString(),
        ends_at: trialEndsAt.toISOString(),
        approved_by: null,
        notes: `حساب معلم مستقل تجريبي — المادة المختارة: ${subject.name}`,
      })

    if (subscriptionError) {
      throw subscriptionError
    }

    return NextResponse.json(
      {
        success: true,
        message: 'تم إنشاء حساب التجربة بنجاح',
        user: {
          id: authUserId,
          name,
          email,
          username,
          role: 'teacher',
          accountMode: 'independent',
          subject: {
            id: subject.id,
            name: subject.name,
          },
        },
        trial: {
          planCode: plan.code,
          startsAt: now.toISOString(),
          endsAt: trialEndsAt.toISOString(),
          limits: plan.limits,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Teacher trial registration error:', error)

    if (authUserId) {
      await supabaseAdmin
        .from('account_subscriptions')
        .delete()
        .eq('owner_user_id', authUserId)

      await supabaseAdmin
        .from('teacher_scopes')
        .delete()
        .eq('teacher_id', authUserId)

      await supabaseAdmin.from('users').delete().eq('id', authUserId)

      await supabaseAdmin.auth.admin.deleteUser(authUserId)
    }

    return NextResponse.json(
      { error: error?.message || 'تعذر إنشاء حساب التجربة حاليًا' },
      { status: 500 }
    )
  }
}