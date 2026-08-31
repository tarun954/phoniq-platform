import { NextResponse } from "next/server";
import { requireOrganization, jsonError } from "@/lib/crm/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { admin, organizationId } = await requireOrganization();

    const { data, error } = await admin
      .from("customers")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      customers: data || [],
    });
  } catch (error) {
    const result = jsonError(error, "Unable to load customers");
    return NextResponse.json(result.body, { status: result.status });
  }
}

export async function POST(request) {
  try {
    const { admin, organizationId } = await requireOrganization();
    const body = await request.json();

    const fullName = String(body.fullName || "").trim();
    const phone = String(body.phone || "").trim();

    if (!fullName || !phone) {
      return NextResponse.json(
        { success: false, error: "Name and phone are required" },
        { status: 400 }
      );
    }

    const { data, error } = await admin
      .from("customers")
      .insert({
        organization_id: organizationId,
        full_name: fullName,
        phone,
        email: String(body.email || "").trim() || null,
        city: String(body.city || "").trim(),
        service_address: String(body.serviceAddress || "").trim(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, customer: data });
  } catch (error) {
    const result = jsonError(error, "Unable to create customer");
    return NextResponse.json(result.body, { status: result.status });
  }
}
