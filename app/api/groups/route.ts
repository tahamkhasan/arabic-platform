import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/groups?teacherId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) return NextResponse.json({ groups: [] })

    const { data, error } = await supabaseAdmin
      .from('groups')
      .select(`
        id, name, level, subject_id, created_at,
        group_members(
          id, student_id,
          users:student_id(id, name, email, allowed_grades)
        )
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ groups: data ?? [] })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/groups — إنشاء مجموعة
export async function POST(req: NextRequest) {
  try {
    const { teacherId, name, subjectId, level, studentIds } = await req.json()

    if (!teacherId || !name?.trim()) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    // إنشاء المجموعة
    const { data: group, error: groupErr } = await supabaseAdmin
      .from('groups')
      .insert({ teacher_id: teacherId, name: name.trim(), subject_id: subjectId ?? null, level: level ?? 'all' })
      .select()
      .single()

    if (groupErr) throw groupErr

    // إضافة الطلاب
    if (studentIds?.length > 0) {
      const members = studentIds.map((sid: string) => ({ group_id: group.id, student_id: sid }))
      const { error: membErr } = await supabaseAdmin.from('group_members').insert(members)
      if (membErr) throw membErr
    }

    return NextResponse.json({ group })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH /api/groups — إضافة/حذف أعضاء
export async function PATCH(req: NextRequest) {
  try {
    const { groupId, addStudentIds, removeStudentIds } = await req.json()

    if (!groupId) return NextResponse.json({ error: 'groupId مطلوب' }, { status: 400 })

    if (addStudentIds?.length > 0) {
      const members = addStudentIds.map((sid: string) => ({ group_id: groupId, student_id: sid }))
      await supabaseAdmin.from('group_members').upsert(members, { onConflict: 'group_id,student_id' })
    }

    if (removeStudentIds?.length > 0) {
      await supabaseAdmin.from('group_members')
        .delete()
        .eq('group_id', groupId)
        .in('student_id', removeStudentIds)
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/groups — حذف مجموعة
export async function DELETE(req: NextRequest) {
  try {
    const { groupId, teacherId } = await req.json()
    const { error } = await supabaseAdmin
      .from('groups')
      .delete()
      .eq('id', groupId)
      .eq('teacher_id', teacherId)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}