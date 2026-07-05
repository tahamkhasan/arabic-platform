import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/server/auth'

type ResolveLoginRow = {
  id: string
  email: string | null
  phone?: string | null
  username?: string | null
  status?: string | null
  approved?: boolean | null
}

function normalizeIdentifier(value: unknown) {
  return String(value ?? '').trim()
}

function normalizePhone(value: string) {
  const raw = value.trim()
  if (!raw) return raw

  let normalized = raw.replace(/[^\d+]/g, '')

  if (normalized.startsWith('00')) {
    normalized = `+${normalized.slice(2)}`
  }

  return normalized
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isPhone(value: string) {
  return /^\+?\d{8,15}$/.test(value.replace(/\s+/g, ''))
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { identifier?: string } | null
    const identifier = normalizeIdentifier(body?.identifier)

    if (!identifier) {
      return NextResponse.json(
        { error: 'اسم المستخدم أو البريد أو الهاتف مطلوب.' },
        { status: 400 },
      )
    }

    const supabase = getServiceClient()

    const clean = identifier.toLowerCase()
    const looksLikeEmail = isEmail(clean)
    const looksLikePhone = isPhone(identifier)
    const normalizedPhone = normalizePhone(identifier)

    let query = supabase
      .from('users')
      .select('id, email, phone, username, status, approved')
      .limit(1)

    if (looksLikeEmail) {
      query = query.eq('email', clean)
    } else if (looksLikePhone) {
      query = query.eq('phone', normalizedPhone)
    } else {
      query = query.eq('username', identifier)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      return NextResponse.json(
        { error: error.message || 'تعذر التحقق من بيانات الدخول.' },
        { status: 500 },
      )
    }

    const user = data as ResolveLoginRow | null

    if (!user) {
      return NextResponse.json(
        { error: 'بيانات الدخول غير صحيحة.' },
        { status: 404 },
      )
    }

    if (user.status === 'suspended') {
      return NextResponse.json(
        { error: 'تم تعليق هذا الحساب. يرجى مراجعة إدارة المنصة.' },
        { status: 403 },
      )
    }

    if (user.status !== 'approved' || user.approved === false) {
      return NextResponse.json(
        { error: 'هذا الحساب غير معتمد بعد. يرجى انتظار موافقة الإدارة.' },
        { status: 403 },
      )
    }

    if (looksLikePhone || (!user.email && user.phone)) {
      if (!user.phone) {
        return NextResponse.json(
          { error: 'لا توجد وسيلة دخول صالحة لهذا الحساب.' },
          { status: 400 },
        )
      }

      return NextResponse.json({
        ok: true,
        method: 'phone',
        phone: user.phone,
      })
    }

    if (!user.email && user.phone) {
      return NextResponse.json({
        ok: true,
        method: 'phone',
        phone: user.phone,
      })
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'لا يوجد بريد إلكتروني أو هاتف صالح لهذا الحساب.' },
        { status: 400 },
      )
    }

    return NextResponse.json({
      ok: true,
      method: 'email',
      email: user.email.toLowerCase(),
    })
  } catch (err) {
    console.error('resolve-login POST error:', err)
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع أثناء التحقق من بيانات الدخول.' },
      { status: 500 },
    )
  }
}