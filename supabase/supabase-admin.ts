import { createClient } from '@supabase/supabase-js'

// ══════════════════════════════════════════════════════════════
// lib/supabase-admin.ts
// ──────────────────────────────────────────────────────────────
// ⚠️ خادم فقط (Server-only). يستخدم مفتاح الخدمة السرّي
// (لا يُرسَل للمتصفح أبداً).
//
// ⛔ ممنوع منعاً باتاً استيراد هذا الملف من أي مكوّن 'use client'.
// استورد منه فقط في:
//   - app/api/**/route.ts
//   - lib/server/**
//
// يدعم الاسمين SUPABASE_SERVICE_ROLE و SUPABASE_SERVICE_ROLE_KEY
// (الأول هو الاسم الفعلي التاريخي في .env.local لهذا المشروع،
// والثاني fallback في حال تغيّر الاسم لاحقاً في بيئة أخرى).
// ══════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
  throw new Error(
    'lib/supabase-admin.ts يجب أن يُستورَد فقط من كود الخادم (API routes) — لا من أي مكوّن "use client".'
  )
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}
if (!supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE (or SUPABASE_SERVICE_ROLE_KEY)')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
})