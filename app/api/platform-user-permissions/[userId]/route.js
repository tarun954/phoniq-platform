import { NextResponse } from "next/server";
import { requirePlatformPermission } from "@/lib/admin/auth";

const ROLE_DEFAULTS = {
  super_admin: ["*"],
  platform_admin: ["*"],
  support: [
    "platform.overview.view","company.view","company.support_access",
    "ai_agent.view","phone_number.view","integration.view",
    "usage.view","logs.view","support.view"
  ],
  sales: [
    "platform.overview.view","company.view","company.create","billing.view"
  ],
  operations: [
    "platform.overview.view","company.view","company.update",
    "ai_agent.view","ai_agent.manage","phone_number.view",
    "phone_number.manage","integration.view","integration.manage",
    "usage.view","logs.view"
  ],
};

export async function GET(_request, { params }) {
  try {
    const { userId } = await params;
    const { admin } = await requirePlatformPermission("platform_user.view");

    const { data: target, error: targetError } = await admin
      .from("platform_users")
      .select("user_id,role,active")
      .eq("user_id", userId)
      .maybeSingle();

    if (targetError) throw targetError;
    if (!target) {
      return NextResponse.json(
        { success: false, error: "Phoniq team member not found." },
        { status: 404 }
      );
    }

    const { data: permissions, error: permissionError } = await admin
      .from("platform_permissions")
      .select("id,permission_key,name,description,category")
      .order("category")
      .order("permission_key");

    if (permissionError) throw permissionError;

    const { data: overrides, error: overrideError } = await admin
      .from("platform_user_permission_overrides")
      .select("permission_id,allowed")
      .eq("user_id", userId);

    if (overrideError) throw overrideError;

    const baseKeys = new Set(ROLE_DEFAULTS[target.role] || []);
    const overrideMap = new Map(
      (overrides || []).map((row) => [row.permission_id, Boolean(row.allowed)])
    );

    return NextResponse.json({
      success: true,
      user: target,
      permissions: (permissions || []).map((permission) => {
        const roleAllowed =
          baseKeys.has("*") || baseKeys.has(permission.permission_key);

        const overrideAllowed = overrideMap.has(permission.id)
          ? overrideMap.get(permission.id)
          : null;

        return {
          ...permission,
          roleAllowed,
          overrideAllowed,
          effectiveAllowed:
            overrideAllowed === null ? roleAllowed : overrideAllowed,
        };
      }),
    });
  } catch (error) {
    const status =
      Number(error?.status) >= 400 && Number(error?.status) <= 599
        ? Number(error.status)
        : 500;

    return NextResponse.json(
      { success: false, error: error?.message || "Unable to load access." },
      { status }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { userId } = await params;
    const { admin, user } =
      await requirePlatformPermission("platform_user.manage");

    const { data: target, error: targetError } = await admin
      .from("platform_users")
      .select("user_id,role")
      .eq("user_id", userId)
      .maybeSingle();

    if (targetError) throw targetError;
    if (!target) {
      return NextResponse.json(
        { success: false, error: "Phoniq team member not found." },
        { status: 404 }
      );
    }

    if (target.role === "super_admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Super Admin always has full platform access.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const overrides = Array.isArray(body?.overrides) ? body.overrides : [];

    for (const item of overrides) {
      const permissionId = String(item?.permissionId || "");
      const mode = item?.mode;

      if (!permissionId) continue;

      if (mode === "inherit") {
        const { error } = await admin
          .from("platform_user_permission_overrides")
          .delete()
          .eq("user_id", userId)
          .eq("permission_id", permissionId);

        if (error) throw error;
        continue;
      }

      if (!["allow", "deny"].includes(mode)) continue;

      const { error } = await admin
        .from("platform_user_permission_overrides")
        .upsert(
          {
            user_id: userId,
            permission_id: permissionId,
            allowed: mode === "allow",
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,permission_id" }
        );

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const status =
      Number(error?.status) >= 400 && Number(error?.status) <= 599
        ? Number(error.status)
        : 500;

    return NextResponse.json(
      { success: false, error: error?.message || "Unable to save access." },
      { status }
    );
  }
}
