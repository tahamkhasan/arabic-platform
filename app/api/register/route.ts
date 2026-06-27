import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendRegistrationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const {
      name,
      email,
      password,
      userType,
      allowedStages,
      allowedGrades,
      planType,
      planId,
    } = await req.json()

    if (!name || !email || !password || !userType) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    // ── جديد: التسجيل الذاتي العام مقصور على الطالب فقط ──────────
    // تسجيل المعلمين أصبح حصرياً عبر app/api/teachers/route.ts،
    // الذي يتطلب صلاحية create_teachers (أدمن أو موظف مخوَّل).
    // هذا يمنع أي مسار خلفي يسمح بإنشاء حساب "موظف/معلم" ذاتياً.
    if (userType !== 'student') {
      return NextResponse.json(
        {
          error:
            'التسجيل الذاتي مخصَّص للطلاب فقط. حسابات المعلمين تُنشأ من قِبل إدارة المنصة — تواصل معها لإنشاء حسابك.',
        },
        { status: 403 },
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
        { status: 400 }
      )
    }

    const hasValidPlan =
      (planType === 'package' || planType === 'subject') &&
      typeof planId === 'string' &&
      planId.length > 0

    let planSubjectId: string | null = null
    let planPackageId: string | null = null
    let planStage: string | null = null
    let planGrade: string | null = null
    let planTrack: string | null = null
    let planLookupFailed = false

    if (hasValidPlan) {
      try {
        if (planType === 'subject') {
          const { data: subject, error: subjectError } = await supabaseAdmin
            .from('subjects')
            .select('id, stage, grade, track')
            .eq('id', planId)
            .eq('is_active', true)
            .maybeSingle()

          if (!subjectError && subject) {
            planSubjectId = subject.id
            planStage = subject.stage ?? null
            planGrade = subject.grade ?? null
            planTrack = subject.track ?? null
          } else {
            planLookupFailed = true
          }
        } else {
          const { data: pkg, error: pkgError } = await supabaseAdmin
            .from('subject_packages')
            .select('id, stage, grade, track')
            .eq('id', planId)
            .maybeSingle()

          if (!pkgError && pkg) {
            planPackageId = pkg.id
            planStage = pkg.stage ?? null
            planGrade = pkg.grade ?? null
            planTrack = pkg.track ?? null
          } else {
            planLookupFailed = true
          }
        }
      } catch (planLookupErr) {
        console.error('Plan lookup error:', planLookupErr)
        planLookupFailed = true
      }
    }

    const finalAllowedStages =
      planStage ? [planStage] : (allowedStages || [])
    const finalAllowedGrades =
      planGrade ? [planGrade] : (allowedGrades || [])

    // role هو دائماً 'student' هنا، بعد فلترة userType أعلاه
    const role = 'student'

    let defaultRoleId: string | null = null
    try {
      const { data: defaultRole, error: roleLookupError } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('key', role)
        .eq('is_active', true)
        .maybeSingle()

      if (!roleLookupError && defaultRole?.id) {
        defaultRoleId = defaultRole.id
      }
    } catch (roleLookupErr) {
      console.error('Default role lookup error:', roleLookupErr)
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني مسجل مسبقاً' },
          { status: 400 }
        )
      }

      throw authError
    }

    const userId = authData.user.id

    const { error: dbError } = await supabaseAdmin.from('users').insert({
      id: userId,
      email,
      full_name: name,
      role,
      user_type: 'student',
      assigned_role_id: defaultRoleId,
      status: 'pending',
      is_active: true,
      allowed_stages: finalAllowedStages,
      allowed_grades: finalAllowedGrades,
      track: planTrack,
    })

    if (dbError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw dbError
    }

    if (planSubjectId || planPackageId) {
      try {
        const { error: subError } = await supabaseAdmin
          .from('student_subscriptions')
          .insert({
            student_id: userId,
            subscription_type: planSubjectId ? 'subject' : 'package',
            subject_id: planSubjectId,
            package_id: planPackageId,
            stage: planStage,
            grade: planGrade,
            track: planTrack,
            is_active: true,
          })

        if (subError) {
          console.error('Subscription insert error:', subError)
        }
      } catch (subErr) {
        console.error('Subscription insert error:', subErr)
      }
    } else if (hasValidPlan && planLookupFailed) {
      console.error(
        `Plan lookup failed for ${planType} id=${planId} during registration of user ${userId}`
      )
    }

    try {
      await sendRegistrationEmail({
        name,
        email,
        userType: 'student',
        allowedStages: finalAllowedStages,
        allowedGrades: finalAllowedGrades,
      })
    } catch (emailErr) {
      console.error('Email error:', emailErr)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء إنشاء الحساب' },
      { status: 500 }
    )
  }
}