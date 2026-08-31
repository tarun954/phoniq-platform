import { NextResponse } from "next/server";
import { requireOrganization, jsonError } from "@/lib/crm/auth";

export async function PATCH(request, context) {
  try {
    const { admin, organizationId, role } = await requireOrganization();
    const { userId } = await context.params;

    if (!["owner", "admin"].includes(String(role || "").toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Owner or admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const nextRole = String(body.role || "").trim();

    if (!["owner", "admin", "dispatcher", "technician", "viewer"].includes(nextRole)) {
      return NextResponse.json(
        { success: false, error: "Unsupported role" },
        { status: 400 }
      );
    }

    const { data, error } = await admin
      .from("organization_members")
      .update({ role: nextRole })
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, member: data });
  } catch (error) {
    const result = jsonError(error, "Unable to update team member");
    return NextResponse.json(result.body, { status: result.status });
  }
}
