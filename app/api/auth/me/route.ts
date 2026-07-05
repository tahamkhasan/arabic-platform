import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, getUserClient } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || req.headers.get('Authorization')

    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing bearer token.' }, { status: 401 })
    }

    const token = auth.slice(7).trim()

    if (!token) {
      return NextResponse.json({ error: 'Missing access token.' }, { status: 401 })
    }

    const userClient = getUserClient(token)
    const serviceClient = getServiceClient()

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser(token)

    if (userError || !user) {
      console.error('/api/auth/me userError:', userError)
      return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await serviceClient
      .from('users')
      .select(
        `
        id,
        email,
        name,
        full_name,
        role,
        user_type,
        status,
        approved,
        is_active,
        allowed_stages,
        allowed_grades,
        track,
        theme_mode,
        avatar_url,
        assigned_role_id,
        current_term_id,
        created_at,
        updated_at,
        last_seen_at
        `
      )
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('/api/auth/me profileError:', profileError)
      return NextResponse.json(
        { error: profileError.message || 'Failed to load user profile.' },
        { status: 500 }
      )
    }

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email ?? user.email ?? '',
        name: profile.name ?? profile.full_name ?? user.email ?? '',
        full_name: profile.full_name ?? null,
        role: profile.role ?? null,
        user_type: profile.user_type ?? null,
        status: profile.status ?? null,
        approved: profile.approved ?? null,
        is_active: profile.is_active ?? null,
        allowed_stages: profile.allowed_stages ?? [],
        allowed_grades: profile.allowed_grades ?? [],
        track: profile.track ?? null,
        permissions: [],
        theme_mode: profile.theme_mode ?? 'light',
        avatar_url: profile.avatar_url ?? null,
        assigned_role_id: profile.assigned_role_id ?? null,
        current_term_id: profile.current_term_id ?? null,
        created_at: profile.created_at ?? null,
        updated_at: profile.updated_at ?? null,
        last_seen_at: profile.last_seen_at ?? null,
      },
    })
  } catch (error) {
    console.error('/api/auth/me fatal error:', error)
    return NextResponse.json({ error: 'Failed to load current user.' }, { status: 500 })
  }
}