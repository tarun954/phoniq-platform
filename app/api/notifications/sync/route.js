import { NextResponse } from "next/server";
import {
  requireOrganization,
  jsonError,
} from "@/lib/crm/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { admin, organizationId } =
      await requireOrganization();

    const { data: hotLeads, error: leadError } = await admin
      .from("leads")
      .select(
        "id, priority, service_issue, created_at, customer_id"
      )
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .in("priority", ["hot", "critical"])
      .order("created_at", { ascending: false })
      .limit(25);

    if (leadError) throw leadError;

    const leadIds = (hotLeads || []).map(
      (lead) => lead.id
    );

    let existingIds = [];

    if (leadIds.length > 0) {
      const { data: existing, error: existingError } =
        await admin
          .from("notifications")
          .select("resource_id")
          .eq("organization_id", organizationId)
          .eq("resource_type", "lead")
          .in("resource_id", leadIds);

      if (existingError) throw existingError;

      existingIds = (existing || []).map(
        (item) => item.resource_id
      );
    }

    const existing = new Set(existingIds);

    const inserts = (hotLeads || [])
      .filter((lead) => !existing.has(lead.id))
      .map((lead) => ({
        organization_id: organizationId,
        title:
          lead.priority === "critical"
            ? "Critical lead created"
            : "Hot lead created",
        message:
          lead.service_issue ||
          "A customer needs attention.",
        type: lead.priority,
        resource_type: "lead",
        resource_id: lead.id,
        href: `/leads/${lead.id}`,
      }));

    if (inserts.length > 0) {
      const { error: insertError } = await admin
        .from("notifications")
        .insert(inserts);

      if (insertError) throw insertError;
    }

    return NextResponse.json({
      success: true,
      created: inserts.length,
    });
  } catch (error) {
    const result = jsonError(
      error,
      "Unable to sync notifications"
    );

    return NextResponse.json(result.body, {
      status: result.status,
    });
  }
}
