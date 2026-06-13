import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const [usersRes, generationsRes] = await Promise.all([
      supabaseAdmin.from('users').select('id', { count: 'exact' }),
      supabaseAdmin.from('generations').select('id', { count: 'exact' }),
    ])

    return NextResponse.json({
      users: usersRes.count || 0,
      generations: generationsRes.count || 0,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}