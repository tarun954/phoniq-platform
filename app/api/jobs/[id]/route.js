import { NextResponse } from "next/server";
import { getCRMContext, jsonError } from "@/lib/crm/auth";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;

    const context = await getCRMContext();

    if (!context?.user) {
      return jsonError("Unauthorized", 401);
    }

    const { admin, organizationId } = context;

    const body = await request.json();

    const updates = {};

    const allowed = [
      "status",
      "title",
      "service_issue",
      "service_address",
      "notes",
      "assigned_to",
      "scheduled_start",
    ];

    for (const field of allowed) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (body.assignedTo !== undefined) {
      updates.assigned_to =
        body.assignedTo || null;
    }

    if (body.scheduledStart !== undefined) {
      updates.scheduled_start =
        body.scheduledStart || null;
    }

    if (
      body.status === "completed" ||
      body.status === "resolved"
    ) {
      updates.completed_at =
        new Date().toISOString();
    }

    const { data: job, error } = await admin
      .from("jobs")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) {
      return jsonError(error.message, 400);
    }

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("UPDATE JOB ERROR:", error);

    return jsonError(
      error.message || "Unable to update job",
      500
    );
  }
}