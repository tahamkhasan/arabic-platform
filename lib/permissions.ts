// ══════════════════════════════════════════════════════════════
// lib/permissions.ts
// ──────────────────────────────────────────────────────────────
// هذا الملف طبقة منطقية بحتة للصلاحيات والتصنيف النصّي للأدوار.
// لا يحتوي أي تواصل مع قاعدة البيانات ولا يربط المستخدم بدوره.
//
// الربط الفعلي بين المستخدم ودوره يتم فقط عبر:
//   users.assigned_role_id  →  roles.id   (foreign key)
// ويُحلّ (resolve) في lib/admin-helpers.ts عبر JOIN صريح، ثم
// تُمرَّر القيمة النصية الناتجة (assigned_role?.key) إلى
// normalizeRole() هنا فقط للتحقق والتصنيف — لا للتخزين أو الربط.
//
// قاعدة صارمة: RoleKey و normalizeRole هنا أداتا تحقق/تصنيف
// نصّي فقط. يُمنع استخدامهما كمفتاح تخزين أو ربط أساسي مع
// سجل المستخدم في أي مكان من المشروع.
// ══════════════════════════════════════════════════════════════

export type RoleKey =
  | "admin"
  | "manager"
  | "supervisor"
  | "data_entry"
  | "teacher"
  | "student";

export type PermissionKey =
  | "users.view"
  | "users.create"
  | "users.edit"
  | "users.delete"
  | "users.assign_role"
  | "users.upload_avatar"
  | "subjects.view"
  | "subjects.create"
  | "subjects.edit"
  | "subjects.delete"
  | "terms.view"
  | "terms.create"
  | "terms.edit"
  | "terms.set_default"
  | "activity.view"
  | "teachers.view"
  | "teachers.analytics"
  | "students.view"
  | "students.analytics"
  | "delegations.manage"
  | "settings.manage";

export type UserPermissionRow = {
  permission_key: string;
  allowed: boolean;
};

export type RolePermissionRow = {
  permission_key: string;
};

// ── تطهير/تحقق نصّي لمفتاح الدور — لا علاقة له بالتخزين ────────
// يُستدعى بعد حلّ الدور الفعّال من العلاقة (assigned_role?.key)
// أو من role/user_type الأساسيين، فقط لضمان أنه قيمة معروفة.
export function normalizeRole(value: string | null | undefined): RoleKey | null {
  if (!value) return null;

  const safe = value.trim().toLowerCase();

  const allowed: RoleKey[] = [
    "admin",
    "manager",
    "supervisor",
    "data_entry",
    "teacher",
    "student",
  ];

  return allowed.includes(safe as RoleKey) ? (safe as RoleKey) : null;
}

export function mergePermissions(
  rolePermissions: RolePermissionRow[] = [],
  userPermissions: UserPermissionRow[] = []
) {
  const set = new Set<string>(rolePermissions.map((p) => p.permission_key));

  for (const item of userPermissions) {
    if (item.allowed) {
      set.add(item.permission_key);
    } else {
      set.delete(item.permission_key);
    }
  }

  return Array.from(set);
}

export function hasPermission(
  permissions: string[] = [],
  permission: PermissionKey | string
) {
  return permissions.includes(permission);
}

export function isElevatedRole(role: string | null | undefined) {
  return role === "admin" || role === "manager";
}