import { NextResponse } from "next/server";
import {
  requirePermission,
  permissionErrorResponse,
} from "@/lib/crm/permissions";

export async function GET(_request, { params }) {
  try {
    const { memberId } = await params;
    const { admin, organizationId } = await requirePermission("team.view");

    const { data: member, error: memberError } = await admin
      .from("organization_members")
      .select("id,user_id,role_id,role")
      .eq("id", memberId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (memberError) throw memberError;
    if (!member) {
      return NextResponse.json(
        { success: false, error: "Team member not found." },
        { status: 404 }
      );
    }

    const { data: permissions, error: permissionsError } = await admin
      .from("organization_permissions")
      .select("id,permission_key,name,description,category")
      .order("category")
      .order("permission_key");

    if (permissionsError) throw permissionsError;

    let rolePermissionIds = new Set();

    if (member.role_id) {
      const { data: roleRows, error: roleError } = await admin
        .from("organization_role_permissions")
        .select("permission_id")
        .eq("role_id", member.role_id);

      if (roleError) throw roleError;

      rolePermissionIds = new Set(
        (roleRows || []).map((row) => row.permission_id)
      );
    }

    const { data: overrides, error: overrideError } = await admin
      .from("organization_member_permission_overrides")
      .select("permission_id,allowed")
      .eq("member_id", member.id);

    if (overrideError) throw overrideError;

    const overrideMap = new Map(
      (overrides || []).map((row) => [
        row.permission_id,
        Boolean(row.allowed),
      ])
    );

    return NextResponse.json({
      success: true,
      member,
      permissions: (permissions || []).map((permission) => {
        const roleAllowed = rolePermissionIds.has(permission.id);
        const hasOverride = overrideMap.has(permission.id);
        const overrideAllowed = hasOverride
          ? overrideMap.get(permission.id)
          : null;

        return {
          ...permission,
          roleAllowed,
          overrideAllowed,
          effectiveAllowed:
            overrideAllowed === null
              ? roleAllowed
              : overrideAllowed,
        };
      }),
    });
  } catch (error) {
    console.error("GET MEMBER PERMISSIONS ERROR:", error);
    return permissionErrorResponse(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { memberId } = await params;
    const { admin, organizationId, user } =
      await requirePermission("team.update");

    const body = await request.json();
    const overrides = Array.isArray(body?.overrides)
      ? body.overrides
      : [];

    const { data: member, error: memberError } = await admin
      .from("organization_members")
      .select("id,user_id,role")
      .eq("id", memberId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (memberError) throw memberError;
    if (!member) {
      return NextResponse.json(
        { success: false, error: "Team member not found." },
        { status: 404 }
      );
    }

    if (String(member.role || "").toLowerCase() === "owner") {
      return NextResponse.json(
        { success: false, error: "Owner permissions cannot be restricted." },
        { status: 400 }
      );
    }

    for (const item of overrides) {
      const permissionId = String(item?.permissionId || "");
      const mode = item?.mode;

      if (!permissionId) continue;

      if (mode === "inherit") {
        const { error } = await admin
          .from("organization_member_permission_overrides")
          .delete()
          .eq("member_id", member.id)
          .eq("permission_id", permissionId);

        if (error) throw error;
        continue;
      }

      if (!["allow", "deny"].includes(mode)) continue;

      const { error } = await admin
        .from("organization_member_permission_overrides")
        .upsert(
          {
            member_id: member.id,
            permission_id: permissionId,
            allowed: mode === "allow",
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "member_id,permission_id" }
        );

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH MEMBER PERMISSIONS ERROR:", error);
    return permissionErrorResponse(error);
  }
}
