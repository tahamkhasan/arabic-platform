import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// ── دالة إرسال إشعار مدمجة ────────────────────────────────────
async function notify(userId: string, type: string, title: string, body?: string) {
  try {
    await supabaseAdmin.from('notifications').insert({ user_id: userId, type, title, body: body ?? null, is_read: false })
  } catch {}
}

async function notifyMany(userIds: string[], type: string, title: string, body?: string) {
  if (!userIds.length) return
  try {
    await supabaseAdmin.from('notifications').insert(userIds.map(uid => ({ user_id: uid, type, title, body: body ?? null, is_read: false })))
  } catch {}
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const teacherId = searchParams.get('teacherId')

    if (studentId) {
      const { data: assigns } = await supabaseAdmin
        .from('assignments')
        .select('id, title, content, tool, deadline, max_grade, subject_id, target_type, target_id')
        .order('created_at', { ascending: false })

      if (!assigns) return NextResponse.json({ assignments: [] })

      const { data: subs } = await supabaseAdmin
        .from('submissions')
        .select('assignment_id, status, teacher_grade, ai_grade, teacher_feedback')
        .eq('student_id', studentId)

      const { data: memberOf } = await supabaseAdmin
        .from('group_members').select('group_id').eq('student_id', studentId)

      const myGroups    = new Set((memberOf ?? []).map(m => m.group_id))
      const submittedIds = new Set((subs ?? []).map(s => s.assignment_id))

      const filtered = assigns.filter(a => {
        if (a.target_type === 'all')     return true
        if (a.target_type === 'student') return a.target_id === studentId
        if (a.target_type === 'group')   return myGroups.has(a.target_id)
        return false
      }).map(a => ({
        ...a,
        submitted:  submittedIds.has(a.id),
        grade:      subs?.find(s => s.assignment_id === a.id)?.teacher_grade ?? null,
        ai_grade:   subs?.find(s => s.assignment_id === a.id)?.ai_grade ?? null,
        feedback:   subs?.find(s => s.assignment_id === a.id)?.teacher_feedback ?? null,
      }))

      return NextResponse.json({ assignments: filtered })
    }

    if (teacherId) {
      const { data, error } = await supabaseAdmin
        .from('assignments')
        .select('*, subjects(name)')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return NextResponse.json({ assignments: data ?? [] })
    }

    return NextResponse.json({ assignments: [] })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { teacherId, subjectId, title, content, tool, targetType, targetId, deadline, maxGrade } = await req.json()

    if (!teacherId || !title || !content) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('assignments')
      .insert({ teacher_id: teacherId, subject_id: subjectId, title, content, tool: tool ?? 'worksheet', target_type: targetType ?? 'all', target_id: targetId ?? null, deadline: deadline ?? null, max_grade: maxGrade ?? 10 })
      .select().single()

    if (error) throw error

    // ── إرسال إشعارات للطلاب المستهدفين ──────────────────────
    const notifBody = `مهمة جديدة: ${title}`
    const notifTitle = '📝 مهمة جديدة من معلمك'

    if (targetType === 'all') {
      const { data: allStudents } = await supabaseAdmin
        .from('users').select('id').eq('user_type', 'student').eq('status', 'approved')
      if (allStudents?.length) await notifyMany(allStudents.map(s => s.id), 'new_assignment', notifTitle, notifBody)
    } else if (targetType === 'student' && targetId) {
      await notify(targetId, 'new_assignment', notifTitle, notifBody)
    } else if (targetType === 'group' && targetId) {
      const { data: members } = await supabaseAdmin
        .from('group_members').select('student_id').eq('group_id', targetId)
      if (members?.length) await notifyMany(members.map(m => m.student_id), 'new_assignment', notifTitle, notifBody)
    }

    return NextResponse.json({ assignment: data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}