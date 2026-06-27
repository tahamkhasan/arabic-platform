import { createBrowserClient } from '@supabase/ssr'

// ══════════════════════════════════════════════════════════════
// lib/supabase.ts
// ──────────────────────────────────────────────────────────────
// هذا الملف "آمن للعميل" (client-safe) فقط — يُستورَد من مكوّنات
// 'use client' (login, register, admin/page.tsx, ...) ومن الخادم
// على حدٍّ سواء.
//
// لا يحتوي هذا الملف على أي عميل أدمن (service role) — ذلك
// موجود فقط في lib/supabase-admin.ts الذي يجب ألا يُستورَد إطلاقاً
// من أي مكوّن 'use client'.
//
// ── مُصحَّح: createBrowserClient من @supabase/ssr بدل createClient
// من @supabase/supabase-js ──────────────────────────────────────
// السبب الجذري الذي عُولج هنا: createClient العادي يخزّن الجلسة
// فقط في localStorage، فلا يراها middleware.ts إطلاقاً (يقرأ فقط
// من cookies على جانب الخادم) — هذا كان يُسبّب حلقة إعادة توجيه
// لا منتهية لـ/login حتى بعد تسجيل دخول ناجح فعلياً.
// createBrowserClient يكتب الجلسة في كوكيز متوافقة مع
// createServerClient المستخدَم في middleware.ts، فيراها الطرفان
// معاً بشكل صحيح. واجهة الاستخدام (supabase.auth.*) لا تتغيّر،
// فلا حاجة لتعديل أي كود آخر يستورد { supabase } من هذا الملف.
// ══════════════════════════════════════════════════════════════

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}
if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)