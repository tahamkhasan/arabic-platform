import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { STAGE_LABELS, TRACK_LABELS } from '@/lib/constants/stages'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, role, user_type, status')
      .eq('id', user.id)
      .single()

    const isTeacher = userData?.role === 'teacher' || userData?.user_type === 'teacher'
    if (!userData || userData.status !== 'approved' || !isTeacher) {
      return NextResponse.json({ error: 'هذا المسار للمعلمين فقط' }, { status: 403 })
    }

    const { data: scopes, error: scopesError } = await supabaseAdmin
      .from('teacher_scopes')
      .select('id, stage, grade, track, subject_id, subjects:subject_id(name)')
      .eq('teacher_id', userData.id)

    if (scopesError) {
      return NextResponse.json({ error: 'فشل جلب نطاقات التدريس' }, { status: 500 })
    }

    // ── لكل نطاق: عدد الطلاب الواقعين فيه فعلياً ──────────────
    const items = []
    for (const s of scopes || []) {
      let countQuery = supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('user_type', 'student')
        .eq('status', 'approved')
        .contains('allowed_stages', [s.stage])
        .contains('allowed_grades', [s.grade])

      if (s.track) countQuery = countQuery.eq('track', s.track)

      const { count } = await countQuery

      items.push({
        id: s.id,
        stage: s.stage,
        stage_label: STAGE_LABELS[s.stage as keyof typeof STAGE_LABELS] ?? s.stage,
        grade: s.grade,
        track: s.track,
        track_label: s.track ? TRACK_LABELS[s.track as keyof typeof TRACK_LABELS] : null,
        subject_id: s.subject_id,
        subject_name: (s as any).subjects?.name ?? null,
        students_count: count ?? 0,
      })
    }

    return NextResponse.json({ items })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'خطأ داخلي' }, { status: 500 })
  }
}