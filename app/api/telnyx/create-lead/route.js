import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const LeadSchema = z.object({
  calledPhone: z.string().min(7).max(30),
  callerPhone: z.string().min(7).max(30),

  fullName: z.string().trim().min(1).max(150),
  serviceAddress: z.string().trim().min(1).max(500),
  city: z.string().trim().max(100).optional().default(""),

  serviceIssue: z.string().trim().min(2).max(2000),
  emergency: z.boolean().default(false),

  preferredDate: z.string().trim().max(100).optional().default(""),
  preferredTime: z.string().trim().max(100).optional().default(""),

  callSummary: z.string().trim().max(5000).optional().default(""),
  telnyxCallId: z.string().trim().max(255).optional(),
  telnyxConversationId: z.string().trim().max(255).optional(),
  assistantId: z.string().trim().max(255).optional(),
});

function normalizePhone(value) {
  return value.replace(/[^\d+]/g, "");
}

function determinePriority(emergency, issue) {
  const text = issue.toLowerCase();

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
    criticalTerms.some((term) => text.includes(term))
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

  if (hotTerms.some((term) => text.includes(term))) {
    return "hot";
  }

  return "normal";
}

export async function POST(request) {
  try {
    const receivedSecret = request.headers.get(
      "x-phoniq-tool-secret"
    );

    const expectedSecret =
      process.env.PHONIQ_TELNYX_TOOL_SECRET;

    if (
      !expectedSecret ||
      !receivedSecret ||
      receivedSecret !== expectedSecret
    ) {
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

    const rawBody = await request.json();
    const parsed = LeadSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid lead information",
          details: parsed.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    const input = parsed.data;
    const admin = createAdminClient();

    const calledPhone = normalizePhone(input.calledPhone);
    const callerPhone = normalizePhone(input.callerPhone);

    /*
     * Security boundary:
     * Telnyx does not choose organization_id.
     * Phoniq derives the organization from the called number.
     */
    const {
      data: numberRecord,
      error: numberError,
    } = await admin
      .from("phone_numbers")
      .select(
        "id, organization_id, telnyx_assistant_id"
      )
      .eq("phone_number", calledPhone)
      .eq("status", "active")
      .maybeSingle();

    if (numberError) {
      throw numberError;
    }

    if (!numberRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number is not registered in Phoniq",
        },
        {
          status: 404,
        }
      );
    }

    if (
      numberRecord.telnyx_assistant_id &&
      input.assistantId &&
      numberRecord.telnyx_assistant_id !==
        input.assistantId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Assistant does not match this phone number",
        },
        {
          status: 403,
        }
      );
    }

    const organizationId =
      numberRecord.organization_id;

    /*
     * Reuse a customer with the same phone number inside
     * the same company. Never search across organizations.
     */
    let customer;

    const {
      data: existingCustomer,
      error: existingCustomerError,
    } = await admin
      .from("customers")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("phone", callerPhone)
      .maybeSingle();

    if (existingCustomerError) {
      throw existingCustomerError;
    }

    if (existingCustomer) {
      const {
        data: updatedCustomer,
        error: updateCustomerError,
      } = await admin
        .from("customers")
        .update({
          full_name: input.fullName,
          service_address: input.serviceAddress,
          city: input.city || existingCustomer.city,
        })
        .eq("id", existingCustomer.id)
        .eq("organization_id", organizationId)
        .select()
        .single();

      if (updateCustomerError) {
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
          organization_id: organizationId,
          full_name: input.fullName,
          phone: callerPhone,
          service_address: input.serviceAddress,
          city: input.city,
        })
        .select()
        .single();

      if (createCustomerError) {
        throw createCustomerError;
      }

      customer = newCustomer;
    }

    let callRecord = null;

    if (input.telnyxCallId) {
      const {
        data: existingCall,
        error: callLookupError,
      } = await admin
        .from("calls")
        .select("*")
        .eq("telnyx_call_id", input.telnyxCallId)
        .maybeSingle();

      if (callLookupError) {
        throw callLookupError;
      }

      if (existingCall) {
        callRecord = existingCall;
      }
    }

    if (!callRecord) {
      const {
        data: createdCall,
        error: createCallError,
      } = await admin
        .from("calls")
        .insert({
          organization_id: organizationId,
          customer_id: customer.id,
          telnyx_call_id:
            input.telnyxCallId || null,
          telnyx_conversation_id:
            input.telnyxConversationId || null,
          assistant_id: input.assistantId || null,
          caller_phone: callerPhone,
          called_phone: calledPhone,
          direction: "inbound",
          issue: input.serviceIssue,
          emergency: input.emergency,
          summary: input.callSummary,
        })
        .select()
        .single();

      if (createCallError) {
        throw createCallError;
      }

      callRecord = createdCall;
    }

    const priority = determinePriority(
      input.emergency,
      input.serviceIssue
    );

    const {
      data: lead,
      error: leadError,
    } = await admin
      .from("leads")
      .insert({
        organization_id: organizationId,
        customer_id: customer.id,
        call_id: callRecord.id,
        source: "phone_ai",
        service_issue: input.serviceIssue,
        emergency: input.emergency,
        priority,
        status: "appointment_requested",
        preferred_time: [
          input.preferredDate,
          input.preferredTime,
        ]
          .filter(Boolean)
          .join(" "),
        notes: input.callSummary,
      })
      .select()
      .single();

    if (leadError) {
      throw leadError;
    }

    const {
      data: appointment,
      error: appointmentError,
    } = await admin
      .from("appointments")
      .insert({
        organization_id: organizationId,
        lead_id: lead.id,
        customer_id: customer.id,
        status: "requested",
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
      throw appointmentError;
    }

    await admin.from("audit_logs").insert({
      organization_id: organizationId,
      action: "telnyx.lead_created",
      resource_type: "lead",
      resource_id: lead.id,
      metadata: {
        source: "phone_ai",
        called_phone: calledPhone,
        caller_phone_last_four:
          callerPhone.slice(-4),
        priority,
        appointment_id: appointment.id,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "The caller information and appointment request were saved successfully.",
      leadId: lead.id,
      appointmentId: appointment.id,
      priority,
    });
  } catch (error) {
    console.error("Phoniq Telnyx lead error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to save the caller information.",
      },
      {
        status: 500,
      }
    );
  }
}