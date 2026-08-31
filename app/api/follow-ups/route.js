import { NextResponse } from "next/server";
import { getCRMContext, jsonError } from "@/lib/crm/auth";

export async function GET() {
  try {
    const context = await getCRMContext();

    if (!context?.user) {
      return jsonError("Unauthorized", 401);
    }

    const { admin, organizationId } = context;

    const { data: followUps, error } = await admin
      .from("follow_ups")
      .select("*")
      .eq("organization_id", organizationId)
      .order("follow_up_at", { ascending: true });

    if (error) {
      return jsonError(error.message, 400);
    }

    const leadIds = [
      ...new Set(
        (followUps || [])
          .map((item) => item.lead_id)
          .filter(Boolean)
      ),
    ];

    const customerIds = [
      ...new Set(
        (followUps || [])
          .map((item) => item.customer_id)
          .filter(Boolean)
      ),
    ];

    let leads = [];
    let customers = [];

    if (leadIds.length) {
      const result = await admin
        .from("leads")
        .select("id, customer_id, service_issue, priority, status")
        .eq("organization_id", organizationId)
        .in("id", leadIds);

      leads = result.data || [];
    }

    if (customerIds.length) {
      const result = await admin
        .from("customers")
        .select("id, full_name, phone, email")
        .eq("organization_id", organizationId)
        .in("id", customerIds);

      customers = result.data || [];
    }

    const leadMap = new Map(
      leads.map((lead) => [lead.id, lead])
    );

    const customerMap = new Map(
      customers.map((customer) => [customer.id, customer])
    );

    const results = (followUps || []).map((item) => ({
      ...item,
      lead: item.lead_id
        ? leadMap.get(item.lead_id) || null
        : null,
      customer: item.customer_id
        ? customerMap.get(item.customer_id) || null
        : null,
    }));

    return NextResponse.json({
      success: true,
      followUps: results,
    });
  } catch (error) {
    console.error("GET FOLLOWUPS ERROR:", error);
    return jsonError(
      error.message || "Unable to load follow-ups",
      500
    );
  }
}

export async function POST(request) {
  try {
    const context = await getCRMContext();

    if (!context?.user) {
      return jsonError("Unauthorized", 401);
    }

    const {
      admin,
      organizationId,
      user,
    } = context;

    const body = await request.json();

    if (!body.title?.trim()) {
      return jsonError("Follow-up title is required", 400);
    }

    if (!body.followUpAt) {
      return jsonError(
        "Follow-up date and time are required",
        400
      );
    }

    if (!body.leadId && !body.customerId) {
      return jsonError(
        "Select a lead or customer for this follow-up",
        400
      );
    }

    let customerId = body.customerId || null;

    if (!customerId && body.leadId) {
      const { data: lead } = await admin
        .from("leads")
        .select("customer_id")
        .eq("id", body.leadId)
        .eq("organization_id", organizationId)
        .maybeSingle();

      customerId = lead?.customer_id || null;
    }

    const insertData = {
      organization_id: organizationId,
      lead_id: body.leadId || null,
      customer_id: customerId,
      title: body.title.trim(),
      notes: body.notes?.trim() || null,
      follow_up_at: body.followUpAt,
      status: "pending",
      assigned_to: body.assignedTo || null,
      created_by: user.id,
    };

    const { data: followUp, error } = await admin
      .from("follow_ups")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return jsonError(error.message, 400);
    }

    return NextResponse.json({
      success: true,
      followUp,
    });
  } catch (error) {
    console.error("CREATE FOLLOWUP ERROR:", error);

    return jsonError(
      error.message || "Unable to create follow-up",
      500
    );
  }
}