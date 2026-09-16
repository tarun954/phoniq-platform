import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { bookAppointment } from "@/lib/appointments/bookAppointment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizePhone(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  const digits = raw.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (
    digits.length === 11 &&
    digits.startsWith("1")
  ) {
    return `+${digits}`;
  }

  return raw.startsWith("+")
    ? raw
    : `+${digits}`;
}

function normalizeToolSecret(value) {
  const secret =
    String(value || "").trim();

  if (
    (secret.startsWith('"') &&
      secret.endsWith('"')) ||
    (secret.startsWith("'") &&
      secret.endsWith("'"))
  ) {
    return secret.slice(1, -1);
  }

  return secret;
}

function isAuthorized(request) {
  const expectedSecret =
    normalizeToolSecret(
      process.env
        .PHONIQ_TELNYX_TOOL_SECRET ||
        process.env
          .TELNYX_TOOL_SECRET
    );

  const receivedSecret =
    normalizeToolSecret(
      request.headers.get(
        "x-phoniq-tool-secret"
      )
    );

  return Boolean(
    expectedSecret &&
      receivedSecret &&
      receivedSecret ===
        expectedSecret
  );
}

/*
 * Accept:
 *
 * 09:00
 * 9:00
 * 09:00:00
 * 9 AM
 * 9:00 AM
 * 12 PM
 * 1:30 PM
 *
 * Return:
 *
 * HH:MM
 */
function normalizeTime(value) {
  const raw =
    String(value || "")
      .trim()
      .toUpperCase();

  if (!raw) {
    return "";
  }

  /*
   * 24-hour values
   */
  const twentyFourHour =
    raw.match(
      /^(\d{1,2}):(\d{2})(?::\d{2})?$/
    );

  if (twentyFourHour) {
    const hours =
      Number(
        twentyFourHour[1]
      );

    const minutes =
      Number(
        twentyFourHour[2]
      );

    if (
      hours >= 0 &&
      hours <= 23 &&
      minutes >= 0 &&
      minutes <= 59
    ) {
      return `${String(
        hours
      ).padStart(
        2,
        "0"
      )}:${String(
        minutes
      ).padStart(
        2,
        "0"
      )}`;
    }
  }

  /*
   * AM/PM values
   */
  const twelveHour =
    raw.match(
      /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/
    );

  if (twelveHour) {
    let hours =
      Number(
        twelveHour[1]
      );

    const minutes =
      Number(
        twelveHour[2] ||
          "0"
      );

    const period =
      twelveHour[3];

    if (
      hours >= 1 &&
      hours <= 12 &&
      minutes >= 0 &&
      minutes <= 59
    ) {
      if (
        period === "AM" &&
        hours === 12
      ) {
        hours = 0;
      }

      if (
        period === "PM" &&
        hours !== 12
      ) {
        hours += 12;
      }

      return `${String(
        hours
      ).padStart(
        2,
        "0"
      )}:${String(
        minutes
      ).padStart(
        2,
        "0"
      )}`;
    }
  }

  return "";
}

/*
 * If Telnyx loses appointment_id between tools,
 * recover it from the CURRENT call.
 *
 * create_phoniq_lead already links:
 *
 * call -> lead -> appointment
 */
async function resolveAppointmentFromCall({
  admin,
  organizationId,
  callControlId,
}) {
  if (!callControlId) {
    return "";
  }

  const {
    data: callRows,
    error: callError,
  } = await admin
    .from("calls")
    .select("id")
    .eq(
      "organization_id",
      organizationId
    )
    .eq(
      "telnyx_call_id",
      callControlId
    )
    .limit(2);

  if (callError) {
    console.error(
      "BOOKING CALL LOOKUP ERROR:",
      callError
    );

    throw callError;
  }

  const call =
    callRows?.[0];

  if (!call?.id) {
    return "";
  }

  const {
    data: leadRows,
    error: leadError,
  } = await admin
    .from("leads")
    .select("id")
    .eq(
      "organization_id",
      organizationId
    )
    .eq(
      "call_id",
      call.id
    )
    .limit(2);

  if (leadError) {
    console.error(
      "BOOKING LEAD LOOKUP ERROR:",
      leadError
    );

    throw leadError;
  }

  const lead =
    leadRows?.[0];

  if (!lead?.id) {
    return "";
  }

  const {
    data: appointmentRows,
    error: appointmentError,
  } = await admin
    .from("appointments")
    .select("id")
    .eq(
      "organization_id",
      organizationId
    )
    .eq(
      "lead_id",
      lead.id
    )
    .limit(2);

  if (appointmentError) {
    console.error(
      "BOOKING APPOINTMENT LOOKUP ERROR:",
      appointmentError
    );

    throw appointmentError;
  }

  return (
    appointmentRows?.[0]
      ?.id || ""
  );
}

/*
 * Last-resort recovery when the
 * call-control header is unavailable.
 */
async function resolveAppointmentFromCaller({
  admin,
  organizationId,
  callerPhone,
}) {
  if (!callerPhone) {
    return "";
  }

  const {
    data: customers,
    error: customerError,
  } = await admin
    .from("customers")
    .select("id")
    .eq(
      "organization_id",
      organizationId
    )
    .eq(
      "phone",
      callerPhone
    )
    .limit(2);

  if (customerError) {
    console.error(
      "BOOKING CUSTOMER LOOKUP ERROR:",
      customerError
    );

    throw customerError;
  }

  const customer =
    customers?.[0];

  if (!customer?.id) {
    return "";
  }

  const {
    data: appointments,
    error: appointmentError,
  } = await admin
    .from("appointments")
    .select(
      "id, confirmed_at, created_at"
    )
    .eq(
      "organization_id",
      organizationId
    )
    .eq(
      "customer_id",
      customer.id
    )
    .is(
      "confirmed_at",
      null
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    )
    .limit(1);

  if (appointmentError) {
    console.error(
      "CALLER APPOINTMENT LOOKUP ERROR:",
      appointmentError
    );

    throw appointmentError;
  }

  return (
    appointments?.[0]
      ?.id || ""
  );
}

export async function POST(
  request
) {
  try {
    /*
     * --------------------------------------------
     * 1. Authenticate
     * --------------------------------------------
     */

    if (
      !isAuthorized(
        request
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unauthorized tool request.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * --------------------------------------------
     * 2. Read payload
     * --------------------------------------------
     */

    const body =
      await request.json();

    const callControlId =
      request.headers.get(
        "x-telnyx-call-control-id"
      ) || "";

    const calledPhone =
      normalizePhone(
        body?.called_phone ||
          body?.calledPhone ||
          body?.to
      );

    const callerPhone =
      normalizePhone(
        body?.caller_phone ||
          body?.callerPhone ||
          body?.from
      );

    let appointmentId =
      String(
        body?.appointment_id ||
          body?.appointmentId ||
          body
            ?.phoniq_appointment_id ||
          ""
      ).trim();

    const requestedDate =
      String(
        body?.requested_date ||
          body?.requestedDate ||
          body
            ?.phoniq_requested_date ||
          ""
      ).trim();

    const rawRequestedTime =
      body?.requested_time ||
      body?.requestedTime ||
      body
        ?.phoniq_requested_time ||
      body?.selected_time ||
      "";

    const requestedTime =
      normalizeTime(
        rawRequestedTime
      );

    const requestedStaffId =
      String(
        body?.staff_id ||
          body?.staffId ||
          ""
      ).trim();

    /*
     * SAFE DEBUGGING.
     *
     * Never logs the secret.
     */
    console.log(
      "=== PHONIQ BOOK APPOINTMENT INPUT ===",
      {
        receivedFields:
          Object.keys(
            body || {}
          ),

        calledPhone,

        callerLastFour:
          callerPhone
            ? callerPhone.slice(
                -4
              )
            : null,

        appointmentIdProvided:
          Boolean(
            appointmentId
          ),

        requestedDate,

        rawRequestedTime:
          String(
            rawRequestedTime ||
              ""
          ),

        normalizedRequestedTime:
          requestedTime,

        staffIdProvided:
          Boolean(
            requestedStaffId
          ),

        callControlIdProvided:
          Boolean(
            callControlId
          ),
      }
    );

    /*
     * --------------------------------------------
     * 3. Validate fields we can validate now
     * --------------------------------------------
     */

    if (!calledPhone) {
      return NextResponse.json(
        {
          success: false,
          error:
            "called_phone is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        requestedDate
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "requested_date must use YYYY-MM-DD.",
          received:
            requestedDate,
        },
        {
          status: 400,
        }
      );
    }

    if (
      !requestedTime
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "requested_time must contain a valid appointment time.",
          received:
            String(
              rawRequestedTime ||
                ""
            ),
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------
     * 4. Resolve organization
     * --------------------------------------------
     */

    const admin =
      createAdminClient();

    const {
      data: phoneRow,
      error: phoneError,
    } = await admin
      .from(
        "phone_numbers"
      )
      .select(
        "organization_id"
      )
      .eq(
        "phone_number",
        calledPhone
      )
      .maybeSingle();

    if (phoneError) {
      throw phoneError;
    }

    if (
      !phoneRow
        ?.organization_id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No organization is mapped to this phone number.",
        },
        {
          status: 404,
        }
      );
    }

    const organizationId =
      phoneRow.organization_id;

    /*
     * --------------------------------------------
     * 5. Recover appointment id when necessary
     * --------------------------------------------
     */

    if (!appointmentId) {
      appointmentId =
        await resolveAppointmentFromCall({
          admin,
          organizationId,
          callControlId,
        });
    }

    if (
      !appointmentId &&
      callerPhone
    ) {
      appointmentId =
        await resolveAppointmentFromCaller({
          admin,
          organizationId,
          callerPhone,
        });
    }

    if (!appointmentId) {
      console.error(
        "BOOKING APPOINTMENT ID COULD NOT BE RESOLVED",
        {
          organizationId,
          callControlIdProvided:
            Boolean(
              callControlId
            ),
          callerPhoneProvided:
            Boolean(
              callerPhone
            ),
        }
      );

      return NextResponse.json(
        {
          success: false,

          error:
            "appointment_id was not provided and Phoniq could not resolve the appointment from the current call.",

          recovery:
            "Keep the lead saved and have the team follow up.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "PHONIQ BOOKING RESOLVED:",
      {
        organizationId,
        appointmentId,
        requestedDate,
        requestedTime,
        requestedStaffId:
          requestedStaffId ||
          null,
      }
    );

    /*
     * --------------------------------------------
     * 6. Book
     * --------------------------------------------
     */

    const result =
      await bookAppointment({
        admin,

        organizationId,

        appointmentId,

        requestedDate,

        requestedTime,

        requestedStaffId:
          requestedStaffId ||
          null,
      });

    /*
     * --------------------------------------------
     * 7. Success
     * --------------------------------------------
     */

    return NextResponse.json({
      success: true,

      appointment_id:
        result.appointment.id,

      job_id:
        result.job?.id ||
        null,

      scheduled_at:
        result.appointment
          .scheduled_at,

      staff_id:
        result.selectedSlot
          .staffId,

      staff_name:
        result.selectedSlot
          .staffName,

      display:
        result.selectedSlot
          .label,

      company_name:
        result.companyName,

      timezone:
        result.timezone,
    });
  } catch (error) {
    console.error(
      "TELNYX BOOK APPOINTMENT ERROR:",
      error
    );

    const status =
      Number(
        error?.status
      ) >= 400
        ? Number(
            error.status
          )
        : 500;

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "Unable to book appointment.",

        available_slots:
          error
            ?.availableSlots ||
          undefined,
      },
      {
        status,
      }
    );
  }
}