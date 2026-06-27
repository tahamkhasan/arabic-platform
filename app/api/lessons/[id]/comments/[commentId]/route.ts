import { NextRequest, NextResponse } from 'next/server'
import { requireUser, getServiceClient } from '@/lib/server/auth'

// app/api/lessons/[id]/comments/[commentId]/route.ts

type Context = {
  params: Promise<{ id: string; commentId: string }>
}

// ══════════════════════════════════════════════════════════════
// DELETE — حذف تعليق
// الطالب: تعليقه الخاص فقط — المدير: أي تعليق (إشراف)
// ══════════════════════════════════════════════════════════════
export async function DELETE(req: NextRequest, context: Context) {
  const auth = await requireUser(req)
  if (!auth.ok) return auth.response

  try {
    const { commentId } = await context.params
    const supabase = getServiceClient()

    const { data: comment, error: fetchError } = await supabase
      .from('lesson_comments')
      .select('id, student_id')
      .eq('id', commentId)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!comment) {
      return NextResponse.json({ error: 'التعليق غير موجود.' }, { status: 404 })
    }

    const isOwner = comment.student_id === auth.user.userId
    const isAdmin = auth.user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'لا تملك صلاحية حذف هذا التعليق.' }, { status: 403 })
    }

    const { error } = await supabase.from('lesson_comments').delete().eq('id', commentId)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'فشل حذف التعليق.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع أثناء حذف التعليق.' },
      { status: 500 }
    )
  }
}