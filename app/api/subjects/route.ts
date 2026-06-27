// ============================================================
// API: المواد الدراسية
// GET: قائمة المواد — مع دعم فلترة ?teacherId= (مواد المعلم
// المخصَّصة فقط عبر teacher_subjects) أو بلا فلترة (كل المواد،
// للأدمن أو الصفحات العامة).
//
// ── مُعاد إلى صيغته الأصلية الفعّالة: نسخة سابقة (من جلسة عمل
// مستقلة خارج هذه المحادثة) أضافت حارس requireUser/Bearer هنا،
// بينما الواجهات الفعلية المستخدِمة لهذه النقطة (dashboard/page.tsx
// و teacher/page.tsx) لا ترسل Authorization header أصلاً — فصار كل
// استدعاء يُرفَض بـ"Missing bearer token". أُعيدت النقطة لتعمل بلا
// حارس Bearer، مطابقةً لما تتوقعه الواجهات الفعلية المعتمدة عليها. ──
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get('teacherId')
    const stages = searchParams.get('stages')

    // ── فلترة بمواد المعلم المخصَّصة فقط (عبر teacher_subjects) ──
    if (teacherId) {
      const { data: assigned, error: assignedError } = await supabaseAdmin
        .from('teacher_subjects')
        .select('subject_id')
        .eq('teacher_id', teacherId)

      if (assignedError) {
        console.error('GET /api/subjects (teacherId) error:', assignedError)
        return NextResponse.json({ error: 'فشل جلب مواد المعلم.' }, { status: 500 })
      }

      const subjectIds = (assigned || []).map((r) => r.subject_id)
      if (subjectIds.length === 0) {
        return NextResponse.json({ subjects: [] })
      }

      const { data: subjects, error: subjectsError } = await supabaseAdmin
        .from('subjects')
        .select('id, name, icon, grade, stage')
        .in('id', subjectIds)
        .order('name', { ascending: true })

      if (subjectsError) {
        console.error('GET /api/subjects (by ids) error:', subjectsError)
        return NextResponse.json({ error: 'فشل جلب المواد.' }, { status: 500 })
      }

      return NextResponse.json({ subjects: subjects || [] })
    }

    // ── بلا teacherId: كل المواد (اختيارياً مفلترة بالمراحل) ──────
    let query = supabaseAdmin
      .from('subjects')
      .select('id, name, icon, grade, stage')
      .order('name', { ascending: true })

    if (stages) {
      const stageList = stages.split(',').map((s) => s.trim()).filter(Boolean)
      if (stageList.length > 0) {
        query = query.in('stage', stageList)
      }
    }

    const { data: subjects, error: subjectsError } = await query

    if (subjectsError) {
      console.error('GET /api/subjects error:', subjectsError)
      return NextResponse.json({ error: 'فشل جلب المواد.' }, { status: 500 })
    }

    return NextResponse.json({ subjects: subjects || [] })
  } catch (err) {
    console.error('GET /api/subjects error:', err)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع.' }, { status: 500 })
  }
}