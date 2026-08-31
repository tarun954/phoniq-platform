import { NextResponse } from "next/server";
import { requireOrganization, jsonError } from "@/lib/crm/auth";

export async function GET() {
  try {
    const { admin, organizationId } = await requireOrganization();

    const { data: messages, error } = await admin
      .from("messages")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(250);

    if (error) throw error;

    const customerIds = [
      ...new Set((messages || []).map((m) => m.customer_id).filter(Boolean)),
    ];

    let customers = [];
    if (customerIds.length) {
      const { data, error: customerError } = await admin
        .from("customers")
        .select("id, full_name, phone, email")
        .eq("organization_id", organizationId)
        .in("id", customerIds);

      if (customerError) throw customerError;
      customers = data || [];
    }

    const map = new Map(customers.map((c) => [c.id, c]));

    return NextResponse.json({
      success: true,
      messages: (messages || []).map((message) => ({
        ...message,
        customer: message.customer_id
          ? map.get(message.customer_id) || null
          : null,
      })),
    });
  } catch (error) {
    const result = jsonError(error, "Unable to load conversations");
    return NextResponse.json(result.body, { status: result.status });
  }
}
