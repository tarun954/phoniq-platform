import { NextResponse } from "next/server";
import { getCRMContext, jsonError } from "@/lib/crm/auth";

export async function GET() {
  try {
    const context = await getCRMContext();

    if (!context?.user) {
      return jsonError("Unauthorized", 401);
    }

    const { admin, organizationId } = context;

    const { data: appointments, error } = await admin
      .from("appointments")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(error.message, 400);
    }

    const customerIds = [
      ...new Set(
        (appointments || [])
          .map((appointment) => appointment.customer_id)
          .filter(Boolean)
      ),
    ];

    let customers = [];

    if (customerIds.length) {
      const result = await admin
        .from("customers")
        .select(
          "id, full_name, phone, email, city, service_address"
        )
        .eq("organization_id", organizationId)
        .in("id", customerIds);

      if (result.error) {
        return jsonError(result.error.message, 400);
      }

      customers = result.data || [];
    }

    const customerMap = new Map(
      customers.map((customer) => [customer.id, customer])
    );

    const results = (appointments || []).map((appointment) => ({
      ...appointment,
      customer: customerMap.get(appointment.customer_id) || null,
    }));

    return NextResponse.json({
      success: true,
      appointments: results,
    });
  } catch (error) {
    console.error("GET APPOINTMENTS ERROR:", error);
    return jsonError(error.message || "Unable to load appointments", 500);
  }
}

export async function POST(request) {
  try {
    const context = await getCRMContext();

    if (!context?.user) {
      return jsonError("Unauthorized", 401);
    }

    const { admin, organizationId } = context;

    const body = await request.json();

    if (!body.customerId) {
      return jsonError("Customer is required", 400);
    }

    const insertData = {
      organization_id: organizationId,
      customer_id: body.customerId,
      lead_id: body.leadId || null,
      status: body.status || "requested",
      scheduled_start: body.scheduledStart || null,
      scheduled_end: body.scheduledEnd || null,
      notes: body.notes || null,
      confirmation_status: "not_sent",
    };

    const { data: appointment, error } = await admin
      .from("appointments")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return jsonError(error.message, 400);
    }

    return NextResponse.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error("CREATE APPOINTMENT ERROR:", error);
    return jsonError(error.message || "Unable to create appointment", 500);
  }
}