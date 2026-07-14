import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendRegistrationEmail } from '@/lib/email'

type SubscriptionType = 'package' | 'subjects'

type SubjectRow = {
  id: string
  name: string
  stage: string | null
  grade: string | null
  is_active: boolean | null
}

type SubjectOfferingRow = {
  subject_id: string
  stage: string | null
  grade: string | null
  track: string | null
}

export async function POST(req: NextRequest) {
  try {
    const {
      name,
      email,
      password,
      userType,
      allowedStages,
      allowedGrades,
      allowedTracks,
      subscriptionType,
      subjectIds,
    } = await req.json()

    if (!name || !email || !password || !userType) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    if (userType !== 'student') {
      return NextResponse.json(
        {
          error:
            'التسجيل الذاتي مخصَّص للطلاب فقط. حسابات المعلمين والمشرفين ومدخلي البيانات تُنشأ من قِبل إدارة المنصة.',
        },
        { status: 403 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
        { status: 400 }
      )
    }

    const normalizedStages = Array.isArray(allowedStages)
      ? allowedStages.map((item: unknown) => String(item).trim()).filter(Boolean)
      : []

    const normalizedGrades = Array.isArray(allowedGrades)
      ? allowedGrades.map((item: unknown) => String(item).trim()).filter(Boolean)
      : []

    const normalizedTracks = Array.isArray(allowedTracks)
      ? allowedTracks.map((item: unknown) => String(item).trim()).filter(Boolean)
      : []

    const normalizedSubjectIds = Array.isArray(subjectIds)
      ? Array.from(new Set(subjectIds.map((item: unknown) => String(item).trim()).filter(Boolean)))
      : []

    const validSubscriptionType =
      subscriptionType === 'package' || subscriptionType === 'subjects'
        ? (subscriptionType as SubscriptionType)
        : null

    if (!validSubscriptionType) {
      return NextResponse.json({ error: 'نوع الاشتراك غير صالح' }, { status: 400 })
    }

    if (normalizedStages.length === 0) {
      return NextResponse.json({ error: 'يرجى تحديد المرحلة الدراسية' }, { status: 400 })
    }

    if (normalizedGrades.length === 0) {
      return NextResponse.json({ error: 'يرجى تحديد الصف الدراسي' }, { status: 400 })
    }

    if (normalizedSubjectIds.length === 0) {
      return NextResponse.json(
        { error: 'يرجى اختيار مادة واحدة على الأقل أو التأكد من مواد الباقة الشاملة' },
        { status: 400 }
      )
    }

    const stage = normalizedStages[0] ?? null
    const grade = normalizedGrades[0] ?? null
    const track = normalizedTracks[0] ?? null

    const { data: subjectsData, error: subjectsError } = await supabaseAdmin
      .from('subjects')
      .select('id, name, stage, grade, is_active')
      .in('id', normalizedSubjectIds)

    if (subjectsError) throw subjectsError

    if (!subjectsData || subjectsData.length === 0) {
      return NextResponse.json({ error: 'لم يتم العثور على المواد المختارة' }, { status: 400 })
    }

    if (subjectsData.length !== normalizedSubjectIds.length) {
      return NextResponse.json(
        { error: 'بعض المواد المختارة غير موجودة أو غير صالحة' },
        { status: 400 }
      )
    }

    const { data: offeringsData, error: offeringsError } = await supabaseAdmin
      .from('subject_offerings')
      .select('subject_id, stage, grade, track')
      .in('subject_id', normalizedSubjectIds)

    if (offeringsError) throw offeringsError

    const offeringsBySubject = new Map<string, SubjectOfferingRow[]>()

    for (const offering of (offeringsData || []) as SubjectOfferingRow[]) {
      const current = offeringsBySubject.get(offering.subject_id) || []
      current.push(offering)
      offeringsBySubject.set(offering.subject_id, current)
    }

    const invalidSubject = (subjectsData as SubjectRow[]).find(subject => {
      const active = subject.is_active !== false
      if (!active) return true

      const offerings = offeringsBySubject.get(subject.id) || []
      if (offerings.length === 0) return true

      return !offerings.some(offering => {
        const sameStage = String(offering.stage ?? '').trim() === String(stage ?? '').trim()
        const sameGrade = String(offering.grade ?? '').trim() === String(grade ?? '').trim()

        if (!sameStage || !sameGrade) return false

        if (track) {
          return String(offering.track ?? '').trim() === String(track).trim()
        }

        return !String(offering.track ?? '').trim()
      })
    })

    if (invalidSubject) {
      return NextResponse.json(
        { error: 'يوجد تعارض بين المواد المختارة والمرحلة أو الصف أو التشعيب' },
        { status: 400 }
      )
    }

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
      allowed_stages: normalizedStages,
      allowed_grades: normalizedGrades,
    })

    if (dbError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw dbError
    }

    const subscriptionRows = normalizedSubjectIds.map(subjectId => ({
      student_id: userId,
      subscription_type: 'subject',
      subject_id: subjectId,
      package_id: null,
      stage,
      grade,
      track,
      is_active: true,
    }))

    const { error: subError } = await supabaseAdmin
      .from('student_subscriptions')
      .insert(subscriptionRows)

    if (subError) {
      console.error('Subscription insert error:', {
        message: subError.message,
        details: subError.details,
        hint: subError.hint,
        code: subError.code,
      })

      await supabaseAdmin.from('users').delete().eq('id', userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)

      throw new Error(`فشل حفظ اشتراكات الطالب: ${subError.message}`)
    }

    try {
      await sendRegistrationEmail({
        name,
        email,
        userType: 'student',
        allowedStages: normalizedStages,
        allowedGrades: normalizedGrades,
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