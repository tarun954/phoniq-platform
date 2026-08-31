import { NextResponse } from "next/server";
import { getCRMContext, jsonError } from "@/lib/crm/auth";

export async function GET() {
  try {
    const context = await getCRMContext();

    if (!context?.user) {
      return jsonError("Unauthorized", 401);
    }

    const { admin, organizationId } = context;

    const { data: jobs, error } = await admin
      .from("jobs")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(error.message, 400);
    }

    const customerIds = [
      ...new Set(
        (jobs || [])
          .map((job) => job.customer_id)
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

      customers = result.data || [];
    }

    const customerMap = new Map(
      customers.map((customer) => [
        customer.id,
        customer,
      ])
    );

    return NextResponse.json({
      success: true,

      jobs: (jobs || []).map((job) => ({
        ...job,

        customer:
          customerMap.get(job.customer_id) || null,
      })),
    });
  } catch (error) {
    console.error("GET JOBS ERROR:", error);

    return jsonError(
      error.message || "Unable to load jobs",
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

    const { admin, organizationId } = context;

    const body = await request.json();

    if (!body.customerId) {
      return jsonError("Customer is required", 400);
    }

    if (body.appointmentId) {
      const { data: existing } = await admin
        .from("jobs")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("appointment_id", body.appointmentId)
        .maybeSingle();

      if (existing) {
        return jsonError(
          "A job already exists for this appointment",
          409
        );
      }
    }

    const insertData = {
      organization_id: organizationId,
      appointment_id:
        body.appointmentId || null,
      lead_id: body.leadId || null,
      customer_id: body.customerId,
      assigned_to: body.assignedTo || null,
      title:
        body.title ||
        "Service Job",
      service_issue:
        body.serviceIssue || null,
      service_address:
        body.serviceAddress || null,
      notes: body.notes || null,
      scheduled_start:
        body.scheduledStart || null,
      status: "new",
    };

    const { data: job, error } = await admin
      .from("jobs")
      .insert(insertData)
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
    console.error("CREATE JOB ERROR:", error);

    return jsonError(
      error.message || "Unable to create job",
      500
    );
  }
}