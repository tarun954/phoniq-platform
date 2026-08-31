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

    if (body.title !== undefined) {
      updates.title = body.title;
    }

    if (body.notes !== undefined) {
      updates.notes = body.notes;
    }

    if (body.followUpAt !== undefined) {
      updates.follow_up_at = body.followUpAt;
    }

    if (body.assignedTo !== undefined) {
      updates.assigned_to =
        body.assignedTo || null;
    }

    if (body.status !== undefined) {
      updates.status = body.status;

      if (body.status === "completed") {
        updates.completed_at =
          new Date().toISOString();
      }
    }

    const { data, error } = await admin
      .from("follow_ups")
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
      followUp: data,
    });
  } catch (error) {
    console.error("UPDATE FOLLOWUP ERROR:", error);

    return jsonError(
      error.message || "Unable to update follow-up",
      500
    );
  }
}