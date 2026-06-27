import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// app/api/public-stats/route.ts
// عام بالكامل — أرقام إجمالية فقط (لا أي بيانات شخصية)، للهبوط قبل تسجيل الدخول

export async function GET(_req: NextRequest) {
  try {
    const [subjectsRes, lessonsRes, teachersRes] = await Promise.all([
      supabaseAdmin.from('subjects').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('lessons').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('user_type', 'teacher')
        .eq('status', 'approved'),
    ])

    return NextResponse.json({
      subjects: subjectsRes.count ?? 0,
      lessons: lessonsRes.count ?? 0,
      teachers: teachersRes.count ?? 0,
    })
  } catch (error) {
    console.error('GET /api/public-stats error:', error)
    return NextResponse.json({ subjects: 0, lessons: 0, teachers: 0 })
  }
}