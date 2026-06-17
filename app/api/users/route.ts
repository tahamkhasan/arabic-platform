// أضف هذا الـ endpoint لـ app/api/users/route.ts
// GET /api/users?role=student

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const role     = searchParams.get('role')
    const userType = searchParams.get('userType')

    let query = supabaseAdmin
      .from('users')
      .select('id, name, email, role, user_type, status, allowed_grades, allowed_stages, theme_color')
      .eq('status', 'approved')
      .order('name', { ascending: true })

    if (role)     query = query.eq('role', role)
    if (userType) query = query.eq('user_type', userType)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ users: data ?? [] })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}