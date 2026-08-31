import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ROLE_DEFAULTS = {
  super_admin: ["*"],
  platform_admin: ["*"],
  support: [
    "platform.overview.view",
    "company.view",
    "company.support_access",
    "ai_agent.view",
    "phone_number.view",
    "integration.view",
    "usage.view",
    "logs.view",
    "support.view",
  ],
  sales: [
    "platform.overview.view",
    "company.view",
    "company.create",
    "billing.view",
  ],
  operations: [
    "platform.overview.view",
    "company.view",
    "company.update",
    "ai_agent.view",
    "ai_agent.manage",
    "phone_number.view",
    "phone_number.manage",
    "integration.view",
    "integration.manage",
    "usage.view",
    "logs.view",
  ],
};

export async function getPlatformContext() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    const error = new Error("Sign in to access the Phoniq Admin Console.");
    error.status = 401;
    throw error;
  }

  const admin = createAdminClient();

  const { data: platformUser, error: platformError } = await admin
    .from("platform_users")
    .select("user_id,role,active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (platformError) throw platformError;

  if (!platformUser || !platformUser.active) {
    const error = new Error(
      "This account is not authorized for the Phoniq Admin Console."
    );
    error.status = 403;
    throw error;
  }

  const { data: overrides, error: overridesError } = await admin
    .from("platform_user_permission_overrides")
    .select(`
      allowed,
      platform_permissions (
        permission_key
      )
    `)
    .eq("user_id", user.id);

  if (overridesError) throw overridesError;

  const base = new Set(ROLE_DEFAULTS[platformUser.role] || []);

  for (const row of overrides || []) {
    const key = row.platform_permissions?.permission_key;
    if (!key) continue;
    if (row.allowed) base.add(key);
    else base.delete(key);
  }

  return {
    user,
    platformUser,
    admin,
    permissionKeys: Array.from(base),
  };
}

export async function requirePlatformPermission(permissionKey) {
  const context = await getPlatformContext();

  const allowed =
    context.permissionKeys.includes("*") ||
    context.permissionKeys.includes(permissionKey);

  if (!allowed) {
    const error = new Error(
      `Your Phoniq role cannot perform this action (${permissionKey}).`
    );
    error.status = 403;
    throw error;
  }

  return context;
}

export async function requirePlatformUser(allowedRoles = null) {
  const context = await getPlatformContext();

  if (
    Array.isArray(allowedRoles) &&
    allowedRoles.length &&
    !allowedRoles.includes(context.platformUser.role)
  ) {
    const error = new Error("Your Phoniq platform role cannot access this area.");
    error.status = 403;
    throw error;
  }

  return context;
}
