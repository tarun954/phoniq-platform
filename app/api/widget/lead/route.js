import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

export async function OPTIONS(request) {
  const origin = request.headers.get("origin");

  return new NextResponse(null, {
    status: 204,
    headers: cors(origin),
  });
}

export async function POST(request) {
  try {
    const origin = request.headers.get("origin");
    const body = await request.json();

    const widgetKey = String(body.widgetKey || "").trim();
    const fullName = String(body.fullName || "").trim();
    const phone = String(body.phone || "").trim();
    const city = String(body.city || "").trim();
    const serviceIssue = String(body.serviceIssue || "").trim();
    const preferredTime = String(body.preferredTime || "").trim();

    if (!widgetKey || !fullName || !phone || !serviceIssue) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, phone, and service issue are required.",
        },
        {
          status: 400,
          headers: cors(origin),
        }
      );
    }

    const admin = createAdminClient();

    const {
      data: widget,
      error: widgetError,
    } = await admin
      .from("chat_widgets")
      .select("organization_id, allowed_domains, enabled")
      .eq("public_key", widgetKey)
      .maybeSingle();

    if (widgetError) throw widgetError;

    if (!widget || !widget.enabled) {
      return NextResponse.json(
        { success: false, error: "Widget not found or disabled." },
        { status: 404, headers: cors(origin) }
      );
    }

    const allowed = Array.isArray(widget.allowed_domains)
      ? widget.allowed_domains
      : [];

    if (origin && allowed.length > 0) {
      const hostname = new URL(origin).hostname;

      if (!allowed.includes(hostname)) {
        return NextResponse.json(
          { success: false, error: "Domain not allowed." },
          { status: 403, headers: cors(origin) }
        );
      }
    }

    const organizationId = widget.organization_id;

    let customer;

    const {
      data: existingCustomer,
      error: customerLookupError,
    } = await admin
      .from("customers")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("phone", phone)
      .maybeSingle();

    if (customerLookupError) throw customerLookupError;

    if (existingCustomer) {
      const {
        data: updatedCustomer,
        error: updateError,
      } = await admin
        .from("customers")
        .update({
          full_name: fullName,
          city: city || existingCustomer.city,
        })
        .eq("id", existingCustomer.id)
        .eq("organization_id", organizationId)
        .select()
        .single();

      if (updateError) throw updateError;

      customer = updatedCustomer;
    } else {
      const {
        data: createdCustomer,
        error: createCustomerError,
      } = await admin
        .from("customers")
        .insert({
          organization_id: organizationId,
          full_name: fullName,
          phone,
          city,
          service_address: "",
        })
        .select()
        .single();

      if (createCustomerError) throw createCustomerError;

      customer = createdCustomer;
    }

    const {
      data: lead,
      error: leadError,
    } = await admin
      .from("leads")
      .insert({
        organization_id: organizationId,
        customer_id: customer.id,
        service_issue: serviceIssue,
        emergency: false,
        priority: "normal",
        status: "new",
        preferred_time: preferredTime,
        notes: "Created from Phoniq website chat widget.",
      })
      .select()
      .single();

    if (leadError) throw leadError;

    await admin.from("lead_activities").insert({
      organization_id: organizationId,
      lead_id: lead.id,
      action: "lead.created",
      description: "Lead created from website chat widget",
      new_value: {
        channel: "website_chat",
        service_issue: serviceIssue,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Your service request was received. A team member will contact you.",
        leadId: lead.id,
      },
      {
        headers: cors(origin),
      }
    );
  } catch (error) {
    console.error("WEBSITE WIDGET LEAD ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to save the service request.",
      },
      {
        status: 500,
        headers: cors(request.headers.get("origin")),
      }
    );
  }
}
