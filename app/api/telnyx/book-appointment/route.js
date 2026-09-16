import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { bookAppointment } from "@/lib/appointments/bookAppointment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizePhone(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const digits = raw.replace(/\D/g, "");

  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;

  return raw.startsWith("+") ? raw : `+${digits}`;
}

function normalizeToolSecret(value) {
  const secret = String(value || "").trim();

  if (
    (secret.startsWith('"') && secret.endsWith('"')) ||
    (secret.startsWith("'") && secret.endsWith("'"))
  ) {
    return secret.slice(1, -1);
  }

  return secret;
}

function isAuthorized(request) {
  const expectedSecret = normalizeToolSecret(
    process.env.PHONIQ_TELNYX_TOOL_SECRET ||
      process.env.TELNYX_TOOL_SECRET
  );

  const receivedSecret = normalizeToolSecret(
    request.headers.get("x-phoniq-tool-secret")
  );

  return Boolean(
    expectedSecret &&
      receivedSecret &&
      receivedSecret === expectedSecret
  );
}

export async function POST(request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized tool request." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const calledPhone = normalizePhone(
      body?.called_phone || body?.calledPhone || body?.to
    );
    const appointmentId = String(
      body?.appointment_id || body?.appointmentId || ""
    ).trim();
    const requestedDate = String(
      body?.requested_date || body?.requestedDate || ""
    ).trim();
    const requestedTime = String(
      body?.requested_time || body?.requestedTime || ""
    ).slice(0, 5);
    const requestedStaffId = String(
      body?.staff_id || body?.staffId || ""
    ).trim();

    if (!calledPhone) {
      return NextResponse.json(
        { success: false, error: "called_phone is required." },
        { status: 400 }
      );
    }

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: "appointment_id is required." },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
      return NextResponse.json(
        { success: false, error: "requested_date must use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    if (!/^\d{2}:\d{2}$/.test(requestedTime)) {
      return NextResponse.json(
        { success: false, error: "requested_time must use HH:MM." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: phoneRow, error: phoneError } = await admin
      .from("phone_numbers")
      .select("organization_id")
      .eq("phone_number", calledPhone)
      .maybeSingle();

    if (phoneError) throw phoneError;

    if (!phoneRow?.organization_id) {
      return NextResponse.json(
        { success: false, error: "No organization is mapped to this phone number." },
        { status: 404 }
      );
    }

    const result = await bookAppointment({
      admin,
      organizationId: phoneRow.organization_id,
      appointmentId,
      requestedDate,
      requestedTime,
      requestedStaffId: requestedStaffId || null,
    });

    return NextResponse.json({
      success: true,
      appointment_id: result.appointment.id,
      scheduled_at: result.appointment.scheduled_at,
      staff_id: result.selectedSlot.staffId,
      staff_name: result.selectedSlot.staffName,
      display: result.selectedSlot.label,
      company_name: result.companyName,
      timezone: result.timezone,
    });
  } catch (error) {
    const status = Number(error?.status) >= 400 ? Number(error.status) : 500;

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unable to book appointment.",
        available_slots: error?.availableSlots || undefined,
      },
      { status }
    );
  }
}
