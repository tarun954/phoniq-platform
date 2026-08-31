import { NextResponse } from "next/server";
import { requireOrganization, jsonError } from "@/lib/crm/auth";

export async function PATCH(request, context) {
  try {
    const { admin, organizationId } = await requireOrganization();
    const { id } = await context.params;
    const body = await request.json();

    const update = { updated_at: new Date().toISOString() };

    if ("status" in body) update.status = body.status;
    if ("assignedTo" in body) update.assigned_to = body.assignedTo || null;
    if ("scheduledStart" in body) update.scheduled_start = body.scheduledStart || null;
    if ("scheduledEnd" in body) update.scheduled_end = body.scheduledEnd || null;
    if ("notes" in body) update.notes = body.notes || "";
    if ("confirmationStatus" in body)
      update.confirmation_status = body.confirmationStatus || "not_sent";

    const { data, error } = await admin
      .from("appointments")
      .update(update)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, appointment: data });
  } catch (error) {
    const result = jsonError(error, "Unable to update appointment");
    return NextResponse.json(result.body, { status: result.status });
  }
}
