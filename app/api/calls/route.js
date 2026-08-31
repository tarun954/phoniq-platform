import { NextResponse } from "next/server";
import { requireOrganization, jsonError } from "@/lib/crm/auth";

export async function GET() {
  try {
    const { admin, organizationId } = await requireOrganization();

    const { data: calls, error } = await admin
      .from("calls")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const customerIds = [
      ...new Set((calls || []).map((c) => c.customer_id).filter(Boolean)),
    ];

    let customers = [];
    if (customerIds.length) {
      const { data, error: customerError } = await admin
        .from("customers")
        .select("id, full_name, phone, city")
        .eq("organization_id", organizationId)
        .in("id", customerIds);

      if (customerError) throw customerError;
      customers = data || [];
    }

    const map = new Map(customers.map((c) => [c.id, c]));

    return NextResponse.json({
      success: true,
      calls: (calls || []).map((call) => ({
        ...call,
        customer: call.customer_id ? map.get(call.customer_id) || null : null,
      })),
    });
  } catch (error) {
    const result = jsonError(error, "Unable to load calls");
    return NextResponse.json(result.body, { status: result.status });
  }
}
