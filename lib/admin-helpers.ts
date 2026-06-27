import { headers } from 'next/headers'
import { createClient, type User as SupabaseAuthUser } from '@supabase/supabase-js'
import { mergePermissions, normalizeRole } from '@/lib/permissions'

type RolePermissionRow = {
  permission_key: string
}

type UserPermissionRow = {
  permission_key: string
  allowed: boolean
}

// ── الدور المعيّن — علاقة مع جدول roles عبر assigned_role_id ────
// نفس شكل AssignedRole المستخدم في app/admin/page.tsx للحفاظ على
// توافق الأشكال (shape) بين كل أجزاء المنصة.
type AssignedRole = {
  id: string
  key: string
  name: string
  description?: string | null
  permissions?: string[]
  is_active?: boolean
} | null

type AdminProfile = {
  id: string
  email: string
  role: string | null
  status: string | null
  user_type: string | null
  assigned_role_id: string | null
  assigned_role?: AssignedRole
  is_active: boolean | null
}

type AdminContextSuccess = {
  ok: true
  supabase: ReturnType<typeof getServiceSupabase>
  authUser: SupabaseAuthUser
  profile: AdminProfile
  role: string
  permissions: string[]
}

type AdminContextFailure = {
  ok: false
  status: number
  error: string
}

export type AdminContext = AdminContextSuccess | AdminContextFailure

export function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRole) {
    throw new Error('Missing Supabase environment variables.')
  }

  return createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

export async function getRequestMeta() {
  const headersList = await headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  const userAgent = headersList.get('user-agent')

  const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || null

  return {
    ipAddress,
    userAgent,
  }
}

export default async function getCurrentAdminContext(): Promise<AdminContext> {
  try {
    const supabase = getServiceSupabase()
    const headersList = await headers()
    const authHeader = headersList.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return {
        ok: false,
        status: 401,
        error: 'لم يتم العثور على جلسة تسجيل دخول صالحة.',
      }
    }

    const token = authHeader.replace('Bearer ', '').trim()

    if (!token) {
      return {
        ok: false,
        status: 401,
        error: 'رمز الوصول غير صالح.',
      }
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return {
        ok: false,
        status: 401,
        error: 'انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى.',
      }
    }

    // ── جلب الملف الشخصي مع الدور المعيّن عبر JOIN على roles ──────
    // assigned_role_id هو FK يشير إلى roles.id — نطلب الحقول
    // الكاملة للدور (id, key, name, description, permissions,
    // is_active) دفعة واحدة بدل استعلام منفصل، ونعيدها كـ
    // assigned_role بنفس شكل AssignedRole في app/admin/page.tsx.
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        role,
        status,
        user_type,
        assigned_role_id,
        is_active,
        assigned_role:roles!assigned_role_id (
          id,
          key,
          name,
          description,
          permissions,
          is_active
        )
      `)
      .eq('id', user.id)
      .single<AdminProfile>()

    if (profileError || !profile) {
      return {
        ok: false,
        status: 403,
        error: 'لم يتم العثور على ملف المستخدم.',
      }
    }

    if (profile.is_active === false) {
      return {
        ok: false,
        status: 403,
        error: 'تم تعطيل هذا الحساب.',
      }
    }

    if (profile.role !== 'admin' && profile.status === 'pending') {
      return {
        ok: false,
        status: 403,
        error: 'طلبك قيد المراجعة. سيتم التواصل معك بعد الموافقة.',
      }
    }

    if (profile.role !== 'admin' && profile.status === 'rejected') {
      return {
        ok: false,
        status: 403,
        error: 'عذراً، تم رفض طلبك. تواصل مع المدير.',
      }
    }

    // ── تحديد الدور الفعّال (effective role) ──────────────────────
    // الأولوية: الدور المعيّن من جدول roles (إن كان نشطاً) ← role
    // الأساسي ← user_type. لا نعتمد أي عمود نصّي مباشر (لا
    // assigned_role_key) — المفتاح يأتي فقط من العلاقة المربوطة.
    // دور معطَّل (is_active === false) لا يُستخدم في الصلاحيات
    // ويُترك المنطق ينزل للمستوى التالي تلقائياً.
    const assignedRoleKey =
      profile.assigned_role && profile.assigned_role.is_active !== false
        ? profile.assigned_role.key
        : null

    const effectiveRole =
      normalizeRole(assignedRoleKey) ||
      normalizeRole(profile.role) ||
      normalizeRole(profile.user_type)

    if (!effectiveRole) {
      return {
        ok: false,
        status: 403,
        error: 'لا يوجد دور صالح لهذا المستخدم.',
      }
    }

    const { data: rolePermissions, error: rolePermissionsError } = await supabase
      .from('role_permissions')
      .select('permission_key')
      .eq('role_key', effectiveRole)
      .returns<RolePermissionRow[]>()

    if (rolePermissionsError) {
      return {
        ok: false,
        status: 500,
        error: 'تعذر تحميل صلاحيات الدور.',
      }
    }

    const { data: userPermissions, error: userPermissionsError } = await supabase
      .from('user_permissions')
      .select('permission_key, allowed')
      .eq('user_id', user.id)
      .returns<UserPermissionRow[]>()

    if (userPermissionsError) {
      return {
        ok: false,
        status: 500,
        error: 'تعذر تحميل صلاحيات المستخدم.',
      }
    }

    const permissions = mergePermissions(
      rolePermissions || [],
      userPermissions || []
    )

    return {
      ok: true,
      supabase,
      authUser: user,
      profile,
      role: effectiveRole,
      permissions,
    }
  } catch (error: any) {
    return {
      ok: false,
      status: 500,
      error: error?.message || 'حدث خطأ أثناء التحقق من صلاحيات المدير.',
    }
  }
}