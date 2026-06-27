// ============================================================
// أنماط موحّدة لاستجابات API
// كل دالة API في المنصة تستخدم هذه الدوال بدل كتابة
// الاستجابة يدوياً كل مرة — يضمن تنسيقاً موحداً وأماناً
// ============================================================

import { NextResponse } from 'next/server';

// ---- استجابة ناجحة ----
// الاستخدام: return success({ name: "أحمد" }, 200)
export function success<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(
    { success: true, data },
    { status }
  );
}

// ---- استجابة خطأ ----
// الاستخدام: return error("البريد الإلكتروني مُستخدم بالفعل", 409, "EMAIL_EXISTS")
export function error(
  message: string,
  status: number = 400,
  code?: string
): NextResponse {
  const body: { success: false; error: string; code?: string } = {
    success: false,
    error: message,
  };
  if (code) {
    body.code = code;
  }
  return NextResponse.json(body, { status });
}

// ---- استجابة مُصفَّحة ----
// الاستخدام: return paginated(items, 100, 1, 10)
// يُرجع: { success: true, data: { items, total, page, page_size, total_pages } }
export function paginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): NextResponse {
  const totalPages = Math.ceil(total / pageSize);
  return NextResponse.json({
    success: true,
    data: {
      items,
      total,
      page,
      page_size: pageSize,
      total_pages: totalPages,
    },
  });
}

// ---- التحقق من صلاحية الدور ----
// يُرمي خطأ إن لم يكن الدور مناسباً
// يُستخدم داخل try/catch في route handler
// الاستخدام:
//   try {
//     requireRole(user, 'teacher', 'admin');
//   } catch (e) {
//     return error(e.message, 403);
//   }
export function requireRole(
  user: { role: string; full_name?: string },
  ...allowedRoles: string[]
): void {
  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      `غير مصرح: الدور "${user.role}" لا يمكنه تنفيذ هذا الإجراء. الأدوار المسموحة: ${allowedRoles.join(', ')}`
    );
  }
}

// ---- التحقق من معرّف UUID صالح ----
// يُرمي خطأ إن لم يكن المُعطى UUID صالحاً
// الاستخدام:
//   try {
//     requireValidId(id, 'quiz_id');
//   } catch (e) {
//     return error(e.message, 400);
//   }
export function requireValidId(id: string, paramName: string = 'id'): void {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || !uuidRegex.test(id)) {
    throw new Error(
      `${paramName} غير صالح — يجب أن يكون معرّف UUID صحيح`
    );
  }
}

// ---- استخراج المستخدم من الطلب ----
// دالة مساعدة تُبسّط استخراج المستخدم من الطلب في API routes
// الاستخدام:
//   const user = getUserFromRequest(request);
//   if (!user) return error('غير مصرح', 401);
export function getUserFromHeader(authHeader: string | null): null | string {
  if (!authHeader) return null;
  // الـ header يكون عادةً: "Bearer <token>"
  // نُرجع الـ token للتحقق منه لاحقاً عبر Supabase
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return authHeader;
}