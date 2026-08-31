import { NextResponse } from "next/server";
import {
  requirePermission,
  permissionErrorResponse,
} from "@/lib/crm/permissions";

export async function GET(_request, { params }) {
  try {
    const { roleId } = await params;
    const { admin, organizationId } = await requirePermission("role.view");

    const { data: role, error: roleError } = await admin
      .from("organization_roles")
      .select("id,name,role_key,is_system")
      .eq("id", roleId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (roleError) throw roleError;

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Role not found." },
        { status: 404 }
      );
    }

    const { data: permissions, error: permissionsError } = await admin
      .from("organization_permissions")
      .select("id,permission_key,name,description,category")
      .order("category")
      .order("permission_key");

    if (permissionsError) throw permissionsError;

    const { data: selectedRows, error: selectedError } = await admin
      .from("organization_role_permissions")
      .select("permission_id")
      .eq("role_id", roleId);

    if (selectedError) throw selectedError;

    const selected = new Set(
      (selectedRows || []).map((row) => row.permission_id)
    );

    return NextResponse.json({
      success: true,
      role,
      permissions: (permissions || []).map((permission) => ({
        ...permission,
        allowed: selected.has(permission.id),
      })),
    });
  } catch (error) {
    console.error("ROLE PERMISSION GET ERROR:", error);
    return permissionErrorResponse(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { roleId } = await params;
    const { admin, organizationId } = await requirePermission("role.manage");

    const { data: role, error: roleError } = await admin
      .from("organization_roles")
      .select("id,name,role_key")
      .eq("id", roleId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (roleError) throw roleError;

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Role not found." },
        { status: 404 }
      );
    }

    if (String(role.role_key || "").toLowerCase() === "owner") {
      return NextResponse.json(
        { success: false, error: "Owner always has full access." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const permissionIds = Array.isArray(body?.permissionIds)
      ? body.permissionIds
      : [];

    const { error: deleteError } = await admin
      .from("organization_role_permissions")
      .delete()
      .eq("role_id", roleId);

    if (deleteError) throw deleteError;

    if (permissionIds.length) {
      const { error: insertError } = await admin
        .from("organization_role_permissions")
        .insert(
          permissionIds.map((permissionId) => ({
            role_id: roleId,
            permission_id: permissionId,
          }))
        );

      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ROLE PERMISSION PATCH ERROR:", error);
    return permissionErrorResponse(error);
  }
}
