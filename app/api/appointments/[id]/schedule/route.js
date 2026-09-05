import { NextResponse } from "next/server";
import { requireOrganization, jsonError } from "@/lib/crm/auth";
import { bookAppointment } from "@/lib/appointments/bookAppointment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request, context) {
  try {
    const { admin, organizationId } = await requireOrganization();
    const { id } = await context.params;
    const body = await request.json();

    const requestedDate = String(body?.date || "").trim();
    const requestedTime = String(body?.time || "").slice(0, 5);
    const staffId = String(body?.staffId || "").trim();

    const result = await bookAppointment({
      admin,
      organizationId,
      appointmentId: id,
      requestedDate,
      requestedTime,
      requestedStaffId: staffId || null,
    });

    return NextResponse.json({
      success: true,
      appointment: result.appointment,
      selectedSlot: result.selectedSlot,
    });
  } catch (error) {
    if (Number(error?.status) === 409) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          availableSlots: error.availableSlots || [],
        },
        { status: 409 }
      );
    }

    const result = jsonError(error, "Unable to schedule appointment");

    return NextResponse.json(result.body, { status: result.status });
  }
}
