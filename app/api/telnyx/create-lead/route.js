import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/*
 * Convert voice-AI values like:
 * true
 * false
 * "true"
 * "false"
 * "yes"
 * "no"
 *
 * into a real boolean.
 */
const EmergencySchema = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (
      normalized === "true" ||
      normalized === "yes" ||
      normalized === "emergency" ||
      normalized === "urgent"
    ) {
      return true;
    }

    if (
      normalized === "false" ||
      normalized === "no" ||
      normalized === "not emergency" ||
      normalized === "not urgent"
    ) {
      return false;
    }
  }

  return value;
}, z.boolean().default(false));

const LeadSchema = z.object({
  calledPhone: z.string().min(7).max(30),
  callerPhone: z.string().min(7).max(30),

  fullName: z.string().trim().min(1).max(150),

  serviceAddress: z
    .string()
    .trim()
    .min(1)
    .max(500),

  city: z
    .string()
    .trim()
    .max(100)
    .nullish()
    .transform((value) => value ?? ""),

  serviceIssue: z
    .string()
    .trim()
    .min(2)
    .max(2000),

  emergency: EmergencySchema,

  preferredDate: z
    .string()
    .trim()
    .max(100)
    .nullish()
    .transform((value) => value ?? ""),

  preferredTime: z
    .string()
    .trim()
    .max(100)
    .nullish()
    .transform((value) => value ?? ""),

  callSummary: z
    .string()
    .trim()
    .max(5000)
    .nullish()
    .transform((value) => value ?? ""),

  telnyxCallId: z
    .string()
    .trim()
    .max(255)
    .nullish()
    .transform((value) => value || undefined),

  telnyxConversationId: z
    .string()
    .trim()
    .max(255)
    .nullish()
    .transform((value) => value || undefined),

  assistantId: z
    .string()
    .trim()
    .max(255)
    .nullish()
    .transform((value) => value || undefined),
});
/*
 * Normalize US phone numbers.
 *
 * Examples:
 * (832) 957-1926
 * 832-957-1926
 * 18329571926
 * +18329571926
 *
 * all become:
 *
 * +18329571926
 */
function normalizePhone(value) {
  if (!value) {
    return "";
  }

  let normalized = String(value).replace(/[^\d+]/g, "");

  if (
    normalized.startsWith("+") &&
    normalized.length >= 8
  ) {
    return normalized;
  }

  normalized = normalized.replace(/\D/g, "");

  if (normalized.length === 10) {
    return `+1${normalized}`;
  }

  if (
    normalized.length === 11 &&
    normalized.startsWith("1")
  ) {
    return `+${normalized}`;
  }

  if (normalized.length > 0) {
    return `+${normalized}`;
  }

  return "";
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

function determinePriority(emergency, issue) {
  const text = String(issue || "").toLowerCase();

  const criticalTerms = [
    "gas smell",
    "smoke",
    "fire",
    "sparking",
    "burning smell",
    "carbon monoxide",
  ];

  if (
    emergency ||
    criticalTerms.some((term) =>
      text.includes(term)
    )
  ) {
    return "critical";
  }

  const hotTerms = [
    "not cooling",
    "not heating",
    "stopped working",
    "no ac",
    "no heat",
    "water leak",
  ];

  if (
    hotTerms.some((term) =>
      text.includes(term)
    )
  ) {
    return "hot";
  }

  return "normal";
}

export async function POST(request) {
  try {
    /*
     * --------------------------------------------------
     * 1. Authenticate Telnyx webhook
     * --------------------------------------------------
     */

    const receivedSecret = normalizeToolSecret(
      request.headers.get("x-phoniq-tool-secret")
    );

    const expectedSecret = normalizeToolSecret(
      process.env.PHONIQ_TELNYX_TOOL_SECRET ||
        process.env.TELNYX_TOOL_SECRET
    );

    if (
      !expectedSecret ||
      !receivedSecret ||
      receivedSecret !== expectedSecret
    ) {
      console.error(
        "PHONIQ TELNYX AUTHORIZATION FAILED"
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * --------------------------------------------------
     * 2. Read Telnyx JSON body
     * --------------------------------------------------
     */

    const rawBody = await request.json();

    /*
     * TEMPORARY DEBUGGING
     *
     * This lets us see exactly what the real Telnyx
     * phone call sends to Vercel.
     *
     * Do NOT log the webhook secret.
     */

    console.log(
      "=== PHONIQ TELNYX RAW PAYLOAD ==="
    );

    console.log(
      JSON.stringify(rawBody, null, 2)
    );

    /*
     * Telnyx may provide call-control ID as a header.
     * If the AI tool did not send telnyxCallId,
     * we'll use the header instead.
     */

    const callControlIdFromHeader =
      request.headers.get(
        "x-telnyx-call-control-id"
      );

    /*
     * --------------------------------------------------
     * 3. Validate incoming payload
     * --------------------------------------------------
     */

    const parsed = LeadSchema.safeParse({
      ...rawBody,

      telnyxCallId:
        rawBody.telnyxCallId ||
        callControlIdFromHeader ||
        undefined,
    });

    if (!parsed.success) {
      const validationErrors =
        parsed.error.flatten();

      console.error(
        "=== PHONIQ TELNYX VALIDATION FAILED ==="
      );

      console.error(
        JSON.stringify(
          validationErrors,
          null,
          2
        )
      );

      console.error(
        "Received fields:",
        Object.keys(rawBody)
      );

      return NextResponse.json(
        {
          success: false,
          error: "Invalid lead information",

          details: validationErrors,

          receivedFields:
            Object.keys(rawBody),
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------
     * 4. Parsed input
     * --------------------------------------------------
     */

    const input = parsed.data;

    const admin = createAdminClient();

    const calledPhone = normalizePhone(
      input.calledPhone
    );

    const callerPhone = normalizePhone(
      input.callerPhone
    );

    console.log(
      "PHONIQ NORMALIZED PHONES:",
      {
        calledPhone,
        callerPhone,
      }
    );

    /*
     * --------------------------------------------------
     * 5. Determine organization
     * --------------------------------------------------
     *
     * SECURITY:
     * Telnyx never provides organization_id.
     *
     * Phoniq maps the called business phone number
     * to the organization.
     */

    const {
      data: numberRecord,
      error: numberError,
    } = await admin
      .from("phone_numbers")
      .select(
        `
        id,
        organization_id,
        telnyx_assistant_id
        `
      )
      .eq(
        "phone_number",
        calledPhone
      )
      .eq(
        "status",
        "active"
      )
      .maybeSingle();

    if (numberError) {
      console.error(
        "PHONE NUMBER LOOKUP ERROR:",
        numberError
      );

      throw numberError;
    }

    if (!numberRecord) {
      console.error(
        "PHONE NUMBER NOT REGISTERED:",
        calledPhone
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Phone number is not registered in Phoniq",
          calledPhone,
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Optional assistant security check
     */

    if (
      numberRecord.telnyx_assistant_id &&
      input.assistantId &&
      numberRecord.telnyx_assistant_id !==
        input.assistantId
    ) {
      console.error(
        "ASSISTANT ID MISMATCH:",
        {
          expected:
            numberRecord.telnyx_assistant_id,

          received:
            input.assistantId,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Assistant does not match this phone number",
        },
        {
          status: 403,
        }
      );
    }

    const organizationId =
      numberRecord.organization_id;

    /*
     * --------------------------------------------------
     * 6. Find/create customer
     * --------------------------------------------------
     */

    let customer;

    const {
      data: existingCustomer,
      error: existingCustomerError,
    } = await admin
      .from("customers")
      .select("*")
      .eq(
        "organization_id",
        organizationId
      )
      .eq(
        "phone",
        callerPhone
      )
      .maybeSingle();

    if (existingCustomerError) {
      console.error(
        "CUSTOMER LOOKUP ERROR:",
        existingCustomerError
      );

      throw existingCustomerError;
    }

    if (existingCustomer) {
      const {
        data: updatedCustomer,
        error: updateCustomerError,
      } = await admin
        .from("customers")
        .update({
          full_name:
            input.fullName,

          service_address:
            input.serviceAddress,

          city:
            input.city ||
            existingCustomer.city,
        })
        .eq(
          "id",
          existingCustomer.id
        )
        .eq(
          "organization_id",
          organizationId
        )
        .select()
        .single();

      if (updateCustomerError) {
        console.error(
          "CUSTOMER UPDATE ERROR:",
          updateCustomerError
        );

        throw updateCustomerError;
      }

      customer = updatedCustomer;
    } else {
      const {
        data: newCustomer,
        error: createCustomerError,
      } = await admin
        .from("customers")
        .insert({
          organization_id:
            organizationId,

          full_name:
            input.fullName,

          phone:
            callerPhone,

          service_address:
            input.serviceAddress,

          city:
            input.city,
        })
        .select()
        .single();

      if (createCustomerError) {
        console.error(
          "CUSTOMER CREATE ERROR:",
          createCustomerError
        );

        throw createCustomerError;
      }

      customer = newCustomer;
    }

    /*
     * --------------------------------------------------
     * 7. Create/reuse call
     * --------------------------------------------------
     */

    let callRecord = null;

    if (input.telnyxCallId) {
      const {
        data: existingCall,
        error: callLookupError,
      } = await admin
        .from("calls")
        .select("*")
        .eq(
          "telnyx_call_id",
          input.telnyxCallId
        )
        .maybeSingle();

      if (callLookupError) {
        console.error(
          "CALL LOOKUP ERROR:",
          callLookupError
        );

        throw callLookupError;
      }

      if (existingCall) {
        callRecord =
          existingCall;
      }
    }

    if (!callRecord) {
      const {
        data: createdCall,
        error: createCallError,
      } = await admin
        .from("calls")
        .insert({
          organization_id:
            organizationId,

          customer_id:
            customer.id,

          telnyx_call_id:
            input.telnyxCallId ||
            null,

          telnyx_conversation_id:
            input.telnyxConversationId ||
            null,

          assistant_id:
            input.assistantId ||
            null,

          caller_phone:
            callerPhone,

          called_phone:
            calledPhone,

          direction:
            "inbound",

          issue:
            input.serviceIssue,

          emergency:
            input.emergency,

          summary:
            input.callSummary,
        })
        .select()
        .single();

      if (createCallError) {
        console.error(
          "CALL CREATE ERROR:",
          createCallError
        );

        throw createCallError;
      }

      callRecord =
        createdCall;
    }

    /*
     * --------------------------------------------------
     * 8. Determine lead priority
     * --------------------------------------------------
     */

    const priority =
      determinePriority(
        input.emergency,
        input.serviceIssue
      );

    /*
     * --------------------------------------------------
     * 9. Create lead
     * --------------------------------------------------
     */

    const {
      data: lead,
      error: leadError,
    } = await admin
      .from("leads")
      .insert({
        organization_id:
          organizationId,

        customer_id:
          customer.id,

        call_id:
          callRecord.id,

        source:
          "phone_ai",

        service_issue:
          input.serviceIssue,

        emergency:
          input.emergency,

        priority,

        status:
          "appointment_requested",

        preferred_time: [
          input.preferredDate,
          input.preferredTime,
        ]
          .filter(Boolean)
          .join(" "),

        notes:
          input.callSummary,
      })
      .select()
      .single();

    if (leadError) {
      console.error(
        "LEAD CREATE ERROR:",
        leadError
      );

      throw leadError;
    }

    /*
     * --------------------------------------------------
     * 10. Create appointment request
     * --------------------------------------------------
     */

    const {
      data: appointment,
      error: appointmentError,
    } = await admin
      .from("appointments")
      .insert({
        organization_id:
          organizationId,

        lead_id:
          lead.id,

        customer_id:
          customer.id,

        status:
          "requested",

        notes: [
          input.preferredDate &&
            `Preferred date: ${input.preferredDate}`,

          input.preferredTime &&
            `Preferred time: ${input.preferredTime}`,
        ]
          .filter(Boolean)
          .join("\n"),
      })
      .select()
      .single();

    if (appointmentError) {
      console.error(
        "APPOINTMENT CREATE ERROR:",
        appointmentError
      );

      throw appointmentError;
    }

    /*
     * --------------------------------------------------
     * 11. Audit log
     * --------------------------------------------------
     */

    const {
      error: auditError,
    } = await admin
      .from("audit_logs")
      .insert({
        organization_id:
          organizationId,

        action:
          "telnyx.lead_created",

        resource_type:
          "lead",

        resource_id:
          lead.id,

        metadata: {
          source:
            "phone_ai",

          called_phone:
            calledPhone,

          caller_phone_last_four:
            callerPhone.slice(-4),

          priority,

          appointment_id:
            appointment.id,
        },
      });

    if (auditError) {
      /*
       * Audit failure should be visible,
       * but we do not fail the entire lead
       * after everything else succeeded.
       */
      console.error(
        "AUDIT LOG ERROR:",
        auditError
      );
    }

    /*
     * --------------------------------------------------
     * 12. Success
     * --------------------------------------------------
     */

    console.log(
      "=== PHONIQ LEAD CREATED SUCCESSFULLY ===",
      {
        organizationId,
        customerId:
          customer.id,

        callId:
          callRecord.id,

        leadId:
          lead.id,

        appointmentId:
          appointment.id,

        priority,
      }
    );

    return NextResponse.json({
      success: true,

      message:
        "The caller information and appointment request were saved successfully.",

      customerId:
        customer.id,

      callId:
        callRecord.id,

      leadId:
        lead.id,

      appointmentId:
        appointment.id,

      priority,
    });
  } catch (error) {
    console.error(
      "=== PHONIQ TELNYX LEAD ERROR ===",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to save the caller information.",
      },
      {
        status: 500,
      }
    );
  }
}