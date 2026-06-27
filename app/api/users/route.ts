import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, requireAdmin } from '@/lib/server/auth'

type RoleRelation =
  | {
      id: string
      key: string
      name: string
      description?: string | null
      permissions?: string[] | null
      is_active?: boolean | null
    }
  | {
      id: string
      key: string
      name: string
      description?: string | null
      permissions?: string[] | null
      is_active?: boolean | null
    }[]
  | null

type UserRow = {
  id: string
  email: string | null
  full_name?: string | null
  role?: string | null
  user_type?: string | null
  approved?: boolean | null
  status?: string | null
  created_at?: string | null
  assigned_role_id?: string | null
  allowed_stages?: string[] | null
  allowed_grades?: string[] | null
  track?: string | null
  roles?: RoleRelation
}

// ──────────────────────────────────────────────────────────────
// جديد: مهلة الحذف التلقائي للحسابات غير المعتمدة (pending) —
// أي حساب أُنشئ منذ أكثر من هذا العدد من الأيام ولم يوافَق عليه
// بعد، يُحذف تلقائياً عند أي استدعاء GET (أي عند فتح لوحة الأدمن،
// بلا حاجة لجدولة/cron خارجي). لا يُطبَّق على status='approved'
// ولا 'suspended' — فقط 'pending' تحديداً.
// ──────────────────────────────────────────────────────────────
const PENDING_AUTO_DELETE_DAYS = 5

function normalizeRoleRelation(roleRelation: RoleRelation) {
  if (!roleRelation) return null

  const role = Array.isArray(roleRelation) ? roleRelation[0] : roleRelation
  if (!role) return null

  return {
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description ?? null,
    permissions: role.permissions ?? [],
    is_active: role.is_active !== false,
  }
}

function mapUserRow(row: UserRow) {
  return {
    id: row.id,
    email: row.email ?? null,
    full_name: row.full_name ?? null,
    role: row.role ?? null,
    user_type: row.user_type ?? null,
    approved: row.approved ?? null,
    status: row.status ?? null,
    created_at: row.created_at ?? null,
    assigned_role_id: row.assigned_role_id ?? null,
    assigned_role: normalizeRoleRelation(row.roles ?? null),
    allowed_stages: row.allowed_stages ?? [],
    allowed_grades: row.allowed_grades ?? [],
    track: row.track ?? null,
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

// يتحقق من قيمة التشعيب: فقط null أو 'scientific' أو 'literary'
// (مطابق لقيد chk_users_track_value المُضاف على عمود users.track)
function validateTrackValue(track: unknown): string | null {
  if (track === null) return null
  if (track !== 'scientific' && track !== 'literary') {
    return 'التشعيب (track) يجب أن يكون scientific أو literary أو null.'
  }
  return null
}

const SELECT_COLUMNS = `
  id,
  email,
  full_name,
  role,
  user_type,
  approved,
  status,
  created_at,
  assigned_role_id,
  allowed_stages,
  allowed_grades,
  track,
  roles:assigned_role_id (
    id,
    key,
    name,
    description,
    permissions,
    is_active
  )
`

// ── جديد: حذف الحسابات المعلَّقة منذ أكثر من PENDING_AUTO_DELETE_DAYS ──
// تُستدعى من GET فقط — أي فتح لوحة الأدمن يُطلق هذا الفحص تلقائياً.
// فشل هذه الدالة لا يُسقِط GET نفسه؛ فقط يُسجَّل في الكونسول.
async function purgeExpiredPendingUsers(
  supabase: ReturnType<typeof getServiceClient>
) {
  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - PENDING_AUTO_DELETE_DAYS)

    const { data: expired, error: fetchError } = await supabase
      .from('users')
      .select('id, email')
      .eq('status', 'pending')
      .lt('created_at', cutoff.toISOString())

    if (fetchError) {
      console.error('purgeExpiredPendingUsers fetch error:', fetchError)
      return
    }

    if (!expired || expired.length === 0) return

    for (const u of expired) {
      try {
        const { error: dbDeleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', u.id)

        if (dbDeleteError) {
          console.error(`purgeExpiredPendingUsers: failed to delete users row ${u.id}:`, dbDeleteError)
          continue
        }

        // حذف حساب Auth أيضاً — فشل هذه الخطوة بمفردها لا يُعاد إدراج
        // الصف المحذوف؛ يُسجَّل فقط للمراجعة (قد يتبقى حساب Auth "يتيم"
        // بلا صفّ مقابل في users، وهو أقل ضرراً من إبقاء حساب pending
        // معلَّق إلى الأبد في الواجهة).
        try {
          await supabase.auth.admin.deleteUser(u.id)
        } catch (authDeleteErr) {
          console.error(`purgeExpiredPendingUsers: failed to delete auth user ${u.id}:`, authDeleteErr)
        }
      } catch (innerErr) {
        console.error(`purgeExpiredPendingUsers: unexpected error for ${u.id}:`, innerErr)
      }
    }

    console.log(`purgeExpiredPendingUsers: removed ${expired.length} expired pending user(s).`)
  } catch (err) {
    console.error('purgeExpiredPendingUsers unexpected error:', err)
  }
}

// GET: إرجاع قائمة المستخدمين للإدارة
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const supabase = getServiceClient()

    // ── جديد: تنظيف الحسابات المعلَّقة منتهية المهلة قبل الإرجاع ──
    await purgeExpiredPendingUsers(supabase)

    const { data, error } = await supabase
      .from('users')
      .select(SELECT_COLUMNS)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to load users.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      items: (data || []).map((row) => mapUserRow(row as unknown as UserRow)),
    })
  } catch {
    return NextResponse.json(
      { error: 'Unexpected error while loading users.' },
      { status: 500 },
    )
  }
}

// PATCH: تحديث بيانات مستخدم (الموافقة على الطالب، تعليق/إلغاء تعليق،
// والآن أيضاً: مرحلة/صف/تشعيب الطالب)
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const supabase = getServiceClient()

    const body = (await req.json().catch(() => null)) as
      | {
          userId?: string
          status?: string
          role?: string | null
          usertype?: string | null
          allowed_stages?: string[]
          allowed_grades?: string[]
          track?: string | null
        }
      | null

    if (!body || !body.userId) {
      return NextResponse.json(
        { error: 'userId is required.' },
        { status: 400 },
      )
    }

    const { userId, status, role, usertype, allowed_stages, allowed_grades, track } = body

    const updates: Record<string, unknown> = {}

    if (typeof status === 'string') {
      updates.status = status

      // لو عندك عمود approved مستقل نربطه بالحالة
      if (status === 'approved') {
        updates.approved = true
      } else if (status === 'pending') {
        updates.approved = false
      }
    }

    if (typeof role !== 'undefined') {
      updates.role = role
    }

    if (typeof usertype !== 'undefined') {
      // اسم العمود في الجدول هو user_type (حسب GET)
      updates.user_type = usertype
    }

    // ── جديد — المرحلة ١٠: مرحلة/صف/تشعيب الطالب ─────────────────
    if (typeof allowed_stages !== 'undefined') {
      if (!isStringArray(allowed_stages)) {
        return NextResponse.json(
          { error: 'allowed_stages يجب أن تكون مصفوفة نصوص.' },
          { status: 400 },
        )
      }
      updates.allowed_stages = allowed_stages
    }

    if (typeof allowed_grades !== 'undefined') {
      if (!isStringArray(allowed_grades)) {
        return NextResponse.json(
          { error: 'allowed_grades يجب أن تكون مصفوفة نصوص.' },
          { status: 400 },
        )
      }
      updates.allowed_grades = allowed_grades
    }

    if (typeof track !== 'undefined') {
      const trackError = validateTrackValue(track)
      if (trackError) {
        return NextResponse.json({ error: trackError }, { status: 400 })
      }
      updates.track = track
    }
    // ──────────────────────────────────────────────────────────────

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update.' },
        { status: 400 },
      )
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select(SELECT_COLUMNS)
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to update user.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      item: mapUserRow(data as unknown as UserRow),
    })
  } catch (err) {
    console.error('Users PATCH error', err)
    return NextResponse.json(
      { error: 'Unexpected error while updating user.' },
      { status: 500 },
    )
  }
}

// ── جديد: DELETE — كانت غائبة بالكامل، وهذا سبب "فشل الحذف" الذي
// كان يظهر في الواجهة (405 Method Not Allowed لعدم وجود أي دالة
// DELETE مُصدَّرة من هذا الملف أصلاً) ───────────────────────────
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const supabase = getServiceClient()

    const body = (await req.json().catch(() => null)) as { userId?: string } | null

    if (!body || !body.userId) {
      return NextResponse.json(
        { error: 'userId is required.' },
        { status: 400 },
      )
    }

    const { userId } = body

    // حماية إضافية: منع حذف حساب أدمن من هذا المسار عن طريق الخطأ
    const { data: target, error: targetError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle()

    if (targetError) {
      return NextResponse.json(
        { error: targetError.message || 'تعذّر العثور على المستخدم.' },
        { status: 500 },
      )
    }

    if (!target) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود.' },
        { status: 404 },
      )
    }

    if (target.role === 'admin') {
      return NextResponse.json(
        { error: 'لا يمكن حذف حساب مدير من هنا.' },
        { status: 403 },
      )
    }

    // حذف الصف من جدول users أولاً
    const { error: dbDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (dbDeleteError) {
      return NextResponse.json(
        { error: dbDeleteError.message || 'فشل حذف بيانات المستخدم.' },
        { status: 500 },
      )
    }

    // حذف حساب Supabase Auth أيضاً — إن فشلت هذه الخطوة بمفردها،
    // الصفّ في users محذوف بالفعل، فنُعيد تحذيراً لا فشلاً كاملاً.
    try {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)
      if (authDeleteError) {
        console.error('Auth delete error:', authDeleteError)
        return NextResponse.json({
          success: true,
          warning: 'تم حذف بيانات المستخدم، لكن تعذّر حذف حساب تسجيل الدخول الخاص به بالكامل.',
        })
      }
    } catch (authErr) {
      console.error('Auth delete unexpected error:', authErr)
      return NextResponse.json({
        success: true,
        warning: 'تم حذف بيانات المستخدم، لكن تعذّر حذف حساب تسجيل الدخول الخاص به بالكامل.',
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Users DELETE error', err)
    return NextResponse.json(
      { error: 'Unexpected error while deleting user.' },
      { status: 500 },
    )
  }
}