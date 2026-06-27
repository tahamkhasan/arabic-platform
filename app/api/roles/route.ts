import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getServiceClient } from '@/lib/server/auth'
import { mapRoleRow, normalizeRolePayload, validateRolePayload } from '@/lib/server/roles'
import type { RolePayload } from '@/types/roles-api'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from('roles')
      .select('id, key, name, description, permissions, is_active, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to load roles.' }, { status: 500 })
    }

    return NextResponse.json({
      items: (data || []).map(mapRoleRow),
    })
  } catch {
    return NextResponse.json({ error: 'Unexpected error while loading roles.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json()) as RolePayload
    const payload = normalizeRolePayload(body, 'create')
    const validationError = validateRolePayload(payload, 'create')

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const supabase = getServiceClient()

    const { data: existing } = await supabase
      .from('roles')
      .select('id')
      .eq('key', payload.key)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Role key already exists.' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('roles')
      .insert(payload)
      .select('id, key, name, description, permissions, is_active, created_at, updated_at')
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'Failed to create role.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        item: mapRoleRow(data),
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Unexpected error while creating role.' }, { status: 500 })
  }
}