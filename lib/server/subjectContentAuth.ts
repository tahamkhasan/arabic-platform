import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

type AuthResult =
  | { ok: true; userId: string; role: 'admin' | 'teacher' }
  | { ok: false; response: NextResponse }

function unauthorized(message: string, status = 403): AuthResult {
  return { ok: false, response: NextResponse.json({ error: message }, { status }) }
}

// ══════════════════════════════════════════════════════════════
// يسمح بالمرور إن كان المستخدم: (1) أدمن، أو (2) معلم ولديه نطاق
// تدريس (teacher_scopes) يشمل subjectId المحدَّد تحديداً.
// مستقل تماماً عن requireAdmin القديم — لا يؤثر على أي مسار آخر.
// ══════════════════════════════════════════════════════════════
export async function requireAdminOrSubjectTeacher(
  req: NextRequest,
  subjectId: string | null,
): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return unauthorized('غير مصرح', 401)

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return unauthorized('غير مصرح', 401)

  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('id, role, user_type, status')
    .eq('id', user.id)
    .single()

  if (!userData || userData.status !== 'approved') return unauthorized('غير مصرح', 401)

  if (userData.role === 'admin') {
    return { ok: true, userId: userData.id, role: 'admin' }
  }

  const isTeacher = userData.role === 'teacher' || userData.user_type === 'teacher'
  if (!isTeacher || !subjectId) {
    return unauthorized('غير مصرح لك بإدارة محتوى هذه المادة')
  }

  const { data: scope } = await supabaseAdmin
    .from('teacher_scopes')
    .select('id')
    .eq('teacher_id', userData.id)
    .eq('subject_id', subjectId)
    .maybeSingle()

  if (!scope) {
    return unauthorized('هذه المادة ليست ضمن نطاق تدريسك')
  }

  return { ok: true, userId: userData.id, role: 'teacher' }
}