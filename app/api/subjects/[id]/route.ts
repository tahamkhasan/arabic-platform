import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getServiceClient } from '@/lib/server/auth'

type Context = {
  params: Promise<{ id: string }>
}

function validateOfferings(offerings: { stage: string; grade: string; track?: string | null }[]) {
  for (const o of offerings) {
    if (!o.stage || !o.grade) {
      return 'كل عرض يجب أن يحتوي مرحلة وصفاً.'
    }
    const needsTrack = o.grade === '11' || o.grade === '12'
    if (needsTrack && o.track !== 'scientific' && o.track !== 'literary') {
      return 'الصفان ١١ و١٢ يتطلبان تحديد التشعيب (علمي/أدبي).'
    }
    if (!needsTrack && o.track) {
      return 'التشعيب يُسمح به فقط للصفين ١١ و١٢.'
    }
  }
  return null
}

// ══════════════════════════════════════════════════════════════
// PATCH — تعديل مادة، واختيارياً استبدال كامل عروضها
// ══════════════════════════════════════════════════════════════
export async function PATCH(req: NextRequest, context: Context) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const body = await req.json()
    const {
      name,
      description,
      content_overview,
      curriculum,
      teacher_intro_video_url,
      icon,
      is_active,
      offerings,
    } = body as {
      name?: string
      description?: string | null
      content_overview?: string | null
      curriculum?: string | null
      teacher_intro_video_url?: string | null
      icon?: string | null
      is_active?: boolean
      offerings?: { stage: string; grade: string; track?: string | null }[]
    }

    const supabase = getServiceClient()

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (name !== undefined) updatePayload.name = name.trim()
    if (description !== undefined) updatePayload.description = description?.trim() || null
    if (content_overview !== undefined) updatePayload.content_overview = content_overview?.trim() || null
    if (curriculum !== undefined) updatePayload.curriculum = curriculum?.trim() || null
    if (teacher_intro_video_url !== undefined) updatePayload.teacher_intro_video_url = teacher_intro_video_url?.trim() || null
    if (icon !== undefined) updatePayload.icon = icon
    if (is_active !== undefined) updatePayload.is_active = is_active

    if (Array.isArray(offerings)) {
      if (offerings.length === 0) {
        return NextResponse.json(
          { error: 'يجب أن تبقى المادة مرتبطة بمرحلة وصف واحد على الأقل.' },
          { status: 400 }
        )
      }
      const validationError = validateOfferings(offerings)
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 })
      }
      updatePayload.stage = offerings[0].stage
      updatePayload.grade = offerings[0].grade
    }

    const { data: subject, error: updateError } = await supabase
      .from('subjects')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (updateError || !subject) {
      return NextResponse.json(
        { error: updateError?.message || 'فشل تعديل المادة.' },
        { status: 500 }
      )
    }

    if (Array.isArray(offerings)) {
      await supabase.from('subject_offerings').delete().eq('subject_id', id)

      const { error: offeringsError } = await supabase
        .from('subject_offerings')
        .insert(
          offerings.map((o) => ({
            subject_id: id,
            stage: o.stage,
            grade: o.grade,
            track: o.track || null,
          }))
        )

      if (offeringsError) {
        return NextResponse.json(
          { error: offeringsError.message || 'فشل تحديث ربط المادة بالمراحل.' },
          { status: 500 }
        )
      }
    }

    const { data: currentOfferings } = await supabase
      .from('subject_offerings')
      .select('stage, grade, track')
      .eq('subject_id', id)

    return NextResponse.json({
      subject: { ...subject, offerings: currentOfferings || [] },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء تعديل المادة.' },
      { status: 500 }
    )
  }
}

// ══════════════════════════════════════════════════════════════
// DELETE — حذف مادة، مع فحص سلامة مرجعية (لا حذف إن وُجدت وحدات)
// ══════════════════════════════════════════════════════════════
export async function DELETE(req: NextRequest, context: Context) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const supabase = getServiceClient()

    const { count, error: usageError } = await supabase
      .from('units')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', id)

    if (usageError) {
      return NextResponse.json(
        { error: usageError.message || 'فشل التحقق من استخدام المادة.' },
        { status: 500 }
      )
    }

    if ((count || 0) > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف مادة تحتوي على وحدات. احذف الوحدات أولاً.' },
        { status: 409 }
      )
    }

    const { error } = await supabase.from('subjects').delete().eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'فشل حذف المادة.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع أثناء حذف المادة.' },
      { status: 500 }
    )
  }
}