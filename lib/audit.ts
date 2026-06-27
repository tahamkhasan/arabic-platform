type AuditPayload = {
  supabase: any;
  userId?: string | null;
  userName?: string | null;
  userRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  meta?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function logActivity({
  supabase,
  userId = null,
  userName = null,
  userRole = null,
  action,
  entityType,
  entityId = null,
  meta = {},
  ipAddress = null,
  userAgent = null,
}: AuditPayload) {
  const { error } = await supabase.from("activity_logs").insert({
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    action,
    entity_type: entityType,
    entity_id: entityId,
    meta,
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  if (error) {
    console.error("activity_logs insert failed:", error.message);
  }
}