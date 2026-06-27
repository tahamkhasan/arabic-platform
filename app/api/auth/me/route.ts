import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, getUserClient } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || req.headers.get('Authorization')

    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing bearer token.' }, { status: 401 })
    }

    const token = auth.slice(7).trim()
    const userClient = getUserClient(token)
    const serviceClient = getServiceClient()

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 })
    }

    // مُصحَّح: select('*') بدل قائمة أعمدة ضيقة — كان هذا السبب الجذري
    // لمشكلتين مزمنتين معاً: "أهلاً undefined" (name غائب) و"المواد فارغة"
    // (allowed_stages/allowed_grades/track غائبة) — كلتاهما موجودة في
    // قاعدة البيانات فعلياً، لكن لم تكن تصل للمتصفح إطلاقاً من هنا.
    const { data: profile, error: profileError } = await serviceClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
        // name كانت تأتي فارغة سابقاً في بعض الصفحات — fallback لـfull_name
        name: profile.name ?? profile.full_name ?? null,
        full_name: profile.full_name ?? null,
        role: profile.role,
        user_type: profile.user_type ?? null,
        status: profile.status ?? null,
        approved: profile.approved ?? null,
        is_active: profile.is_active ?? null,
        allowed_stages: profile.allowed_stages ?? null,
        allowed_grades: profile.allowed_grades ?? null,
        track: profile.track ?? null,
        theme_color: profile.theme_color ?? null,
        theme_mode: profile.theme_mode ?? null,
        avatar_url: profile.avatar_url ?? null,
        assigned_role_id: profile.assigned_role_id ?? null,
        current_term_id: profile.current_term_id ?? null,
        created_at: profile.created_at ?? null,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load current user.' }, { status: 500 })
  }
}