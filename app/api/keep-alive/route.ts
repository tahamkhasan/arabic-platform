import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// ══════════════════════════════════════════════════════════════
// نقطة نبضة بسيطة تُبقي مشروع Supabase (الخطة المجانية) نشطاً —
// استعلام حقيقي وخفيف على قاعدة البيانات (بلا أي تعديل بيانات)،
// يُستدعى تلقائياً عبر GitHub Actions يومياً لمنع التوقّف التلقائي
// بعد 7 أيام بلا نشاط.
// ══════════════════════════════════════════════════════════════
export async function GET() {
  try {
    const { error } = await supabaseAdmin
      .from('platform_settings')
      .select('key')
      .limit(1)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, ts: new Date().toISOString() })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'خطأ' }, { status: 500 })
  }
}