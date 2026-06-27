import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { AuthenticatedAdmin } from '@/types/roles-api'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7).trim()
}

export function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export function getUserClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export type AuthenticatedUser = {
  userId: string
  email: string | null
  role: string
}

// ── حارس مشترك داخلي: يتحقق من التوكن ويجلب صف المستخدم ────────
// (requireAdmin و requireUser كلاهما يستخدمانه — بلا تكرار منطق)
async function authenticateRequest(
  req: NextRequest
): Promise<
  | { ok: true; profile: { id: string; email: string | null; role: string } }
  | { ok: false; response: NextResponse }
> {
  try {
    const token = getBearerToken(req)
    if (!token) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Missing bearer token.' }, { status: 401 }),
      }
    }

    const userClient = getUserClient(token)
    const serviceClient = getServiceClient()

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 }),
      }
    }

    const { data: profile, error: profileError } = await serviceClient
      .from('users')
      .select('id, email, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'User profile not found.' }, { status: 404 }),
      }
    }

    return { ok: true, profile }
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authorization check failed.' }, { status: 500 }),
    }
  }
}

// ══════════════════════════════════════════════════════════════
// requireUser — يتطلب فقط أن يكون المستخدم مسجَّل دخوله (أي دور)
// ══════════════════════════════════════════════════════════════
export async function requireUser(
  req: NextRequest
): Promise<{ ok: true; user: AuthenticatedUser } | { ok: false; response: NextResponse }> {
  const auth = await authenticateRequest(req)
  if (!auth.ok) return auth

  return {
    ok: true,
    user: {
      userId: String(auth.profile.id),
      email: auth.profile.email ?? null,
      role: auth.profile.role,
    },
  }
}

// ══════════════════════════════════════════════════════════════
// requireAdmin — كما كان تماماً، بلا أي تغيير في السلوك الخارجي
// ══════════════════════════════════════════════════════════════
export async function requireAdmin(
  req: NextRequest
): Promise<{ ok: true; admin: AuthenticatedAdmin } | { ok: false; response: NextResponse }> {
  const auth = await authenticateRequest(req)
  if (!auth.ok) return auth

  if (auth.profile.role !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      ),
    }
  }

  return {
    ok: true,
    admin: {
      userId: String(auth.profile.id),
      email: auth.profile.email ?? null,
      role: auth.profile.role,
    },
  }
}

// ══════════════════════════════════════════════════════════════
// جديد — requireAdminOrPermission: يسمح للمدير دائماً، أو لأي مستخدم
// آخر يحمل دوراً مُعيَّناً (assigned_role_id) تتضمن صلاحياته المفتاح
// المطلوب صريحاً. لا يغيّر authenticateRequest نفسها — استعلامان
// إضافيان (دور المستخدم ← صلاحيات الدور) يُنفَّذان فقط لغير المدير،
// فلا أثر على المسار الأكثر شيوعاً (الأدمن نفسه).
// ══════════════════════════════════════════════════════════════
export async function requireAdminOrPermission(
  req: NextRequest,
  permission: string
): Promise<{ ok: true; user: AuthenticatedUser } | { ok: false; response: NextResponse }> {
  const auth = await authenticateRequest(req)
  if (!auth.ok) return auth

  const baseUser: AuthenticatedUser = {
    userId: String(auth.profile.id),
    email: auth.profile.email ?? null,
    role: auth.profile.role,
  }

  if (auth.profile.role === 'admin') {
    return { ok: true, user: baseUser }
  }

  const forbidden = () => ({
    ok: false as const,
    response: NextResponse.json(
      { error: `Forbidden. Missing permission: ${permission}.` },
      { status: 403 }
    ),
  })

  try {
    const serviceClient = getServiceClient()

    const { data: userRow, error: userRowError } = await serviceClient
      .from('users')
      .select('assigned_role_id')
      .eq('id', auth.profile.id)
      .single()

    if (userRowError || !userRow?.assigned_role_id) {
      return forbidden()
    }

    const { data: roleRow, error: roleRowError } = await serviceClient
      .from('roles')
      .select('permissions, is_active')
      .eq('id', userRow.assigned_role_id)
      .single()

    if (roleRowError || !roleRow || roleRow.is_active === false) {
      return forbidden()
    }

    const permissions: string[] = Array.isArray(roleRow.permissions) ? roleRow.permissions : []
    if (!permissions.includes(permission)) {
      return forbidden()
    }

    return { ok: true, user: baseUser }
  } catch {
    return forbidden()
  }
}