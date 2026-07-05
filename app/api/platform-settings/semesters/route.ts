import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, getServiceClient } from '@/lib/server/auth'

// ══════════════════════════════════════════════════════════════
// إعدادات تفعيل الفصلين الدراسيين على مستوى المنصة كاملة —
// يستخدم جدول platform_settings (بنية key/value) مباشرة، مستقل
// تماماً عن app/api/platform-settings/route.ts (الذي يفترض صفّاً
// واحداً متعدد الأعمدة لإعدادات الشعار/الاسم وغيرها — بنية مختلفة)
//
// المفاتيح: semester_1_active / semester_2_active — كل منهما
// مستقل تماماً، يمكن أن يكونا معاً true أو معاً false
// ══════════════════════════════════════════════════════════════

const KEYS = ['semester_1_active', 'semester_2_active'] as const

// ── GET — عام، بلا حماية (يُستخدَم من واجهة الطالب لتحديد ما يُعرَض) ──
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('platform_settings')
      .select('key, value')
      .in('key', KEYS as unknown as string[])

    if (error) throw error

    // افتراضي: كلا الفصلين نشط إن لم يوجد الصف بعد (أمان احتياطي)
    const result = { semester_1_active: true, semester_2_active: true }
    for (const row of data || []) {
      if (row.key === 'semester_1_active') result.semester_1_active = row.value === 'true'
      if (row.key === 'semester_2_active') result.semester_2_active = row.value === 'true'
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('GET /api/platform-settings/semesters error:', error)
    // فشل القراءة لا يجب أن يُخفي كل المحتوى عن الطلاب — افتراضي آمن
    return NextResponse.json({ semester_1_active: true, semester_2_active: true })
  }
}

// ── PATCH — للأدمن فقط — تبديل تفعيل فصل واحد أو كليهما ──────
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const body = await req.json()
    const { semester_1_active, semester_2_active } = body as {
      semester_1_active?: boolean
      semester_2_active?: boolean
    }

    const supabase = getServiceClient()
    const updates: { key: string; value: string }[] = []

    if (semester_1_active !== undefined) {
      updates.push({ key: 'semester_1_active', value: String(semester_1_active) })
    }
    if (semester_2_active !== undefined) {
      updates.push({ key: 'semester_2_active', value: String(semester_2_active) })
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'لا توجد قيم لتحديثها.' }, { status: 400 })
    }

    for (const u of updates) {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({ key: u.key, value: u.value }, { onConflict: 'key' })
      if (error) throw error
    }

    // إرجاع الحالة الكاملة بعد التحديث
    const { data } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', KEYS as unknown as string[])

    const result = { semester_1_active: true, semester_2_active: true }
    for (const row of data || []) {
      if (row.key === 'semester_1_active') result.semester_1_active = row.value === 'true'
      if (row.key === 'semester_2_active') result.semester_2_active = row.value === 'true'
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء تحديث إعدادات الفصول.' },
      { status: 500 }
    )
  }
}