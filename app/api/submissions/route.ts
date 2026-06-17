import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function notify(userId: string, type: string, title: string, body?: string) {
  try {
    await supabaseAdmin.from('notifications').insert({ user_id: userId, type, title, body: body ?? null, is_read: false })
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const { assignmentId, studentId, answerText } = await req.json()

    if (!assignmentId || !studentId || !answerText?.trim()) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    const { data: assignment } = await supabaseAdmin
      .from('assignments')
      .select('content, max_grade, title, teacher_id')
      .eq('id', assignmentId).single()

    // ── تصحيح الذكاء الاصطناعي ───────────────────────────────
    let aiGrade: number | null = null
    let aiFeedback: string | null = null

    if (assignment) {
      try {
        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-5', max_tokens: 500, temperature: 0.1,
            system: `أنت مصحح لغة عربية متخصص. صحح إجابة الطالب بناءً على أسئلة المهمة وأعط درجة من ${assignment.max_grade}.
رد بـ JSON فقط: {"grade": رقم, "feedback": "تغذية راجعة مفيدة باللغة العربية تذكر ما أجاده وما يحتاج تحسيناً"}`,
            messages: [{ role: 'user', content: `أسئلة المهمة:\n${assignment.content}\n\nإجابة الطالب:\n${answerText}` }],
          }),
        })
        const aiData = await aiRes.json()
        const text   = aiData.content?.[0]?.text ?? '{}'
        const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
        aiGrade    = Math.min(Math.max(Number(parsed.grade) || 0, 0), assignment.max_grade)
        aiFeedback = parsed.feedback ?? null
      } catch {}
    }

    const { data, error } = await supabaseAdmin
      .from('submissions')
      .upsert({
        assignment_id: assignmentId, student_id: studentId,
        answer_text: answerText, submitted_at: new Date().toISOString(),
        ai_grade: aiGrade, ai_feedback: aiFeedback, status: 'submitted',
      }, { onConflict: 'assignment_id,student_id' })
      .select().single()

    if (error) throw error

    // ── إشعار للمعلم ─────────────────────────────────────────
    if (assignment?.teacher_id) {
      const { data: student } = await supabaseAdmin
        .from('users').select('name').eq('id', studentId).single()
      await notify(
        assignment.teacher_id,
        'new_submission',
        `📬 إجابة جديدة من ${student?.name ?? 'طالب'}`,
        `على مهمة: ${assignment.title}`
      )
    }

    return NextResponse.json({ submission: data, aiGrade, aiFeedback })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const assignmentId = searchParams.get('assignmentId')
    const studentId    = searchParams.get('studentId')
    const teacherId    = searchParams.get('teacherId')

    let query = supabaseAdmin
      .from('submissions')
      .select('*, users:student_id(name, email)')
      .order('submitted_at', { ascending: false })

    if (assignmentId) query = query.eq('assignment_id', assignmentId)
    if (studentId)    query = query.eq('student_id',    studentId)

    // للمعلم — جلب إجابات مهامه فقط
    if (teacherId) {
      const { data: myAssignments } = await supabaseAdmin
        .from('assignments').select('id').eq('teacher_id', teacherId)
      const ids = (myAssignments ?? []).map(a => a.id)
      if (ids.length) query = query.in('assignment_id', ids)
      else return NextResponse.json({ submissions: [] })
    }

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ submissions: data ?? [] })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, teacherGrade, teacherFeedback } = await req.json()

    if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 })

    const { data: sub } = await supabaseAdmin
      .from('submissions').select('student_id, assignment_id').eq('id', id).single()

    const { data, error } = await supabaseAdmin
      .from('submissions')
      .update({ teacher_grade: teacherGrade, teacher_feedback: teacherFeedback, reviewed_at: new Date().toISOString(), status: 'reviewed' })
      .eq('id', id).select().single()

    if (error) throw error

    // ── إشعار للطالب بالدرجة ─────────────────────────────────
    if (sub?.student_id) {
      const { data: assign } = await supabaseAdmin
        .from('assignments').select('title').eq('id', sub.assignment_id).single()
      await notify(
        sub.student_id,
        'new_grade',
        `🎯 صدرت درجتك: ${teacherGrade} درجة`,
        assign?.title ? `على مهمة: ${assign.title}` : undefined
      )
    }

    return NextResponse.json({ submission: data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}