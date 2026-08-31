import { NextResponse } from "next/server";
import { getCRMContext, jsonError } from "@/lib/crm/auth";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const context = await getCRMContext();

    if (!context?.user) {
      return jsonError("Unauthorized", 401);
    }

    const { admin, organizationId } = context;

    const { data: customer, error } = await admin
      .from("customers")
      .select("*")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .single();

    if (error) {
      return jsonError(error.message, 400);
    }

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("GET CUSTOMER ERROR:", error);
    return jsonError(error.message || "Unable to load customer", 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;

    const context = await getCRMContext();

    if (!context?.user) {
      return jsonError("Unauthorized", 401);
    }

    const { admin, organizationId } = context;

    const body = await request.json();

    const allowedFields = [
      "full_name",
      "phone",
      "email",
      "city",
      "service_address",
      "notes",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (updates.email !== undefined) {
      updates.email = updates.email?.trim().toLowerCase() || null;
    }

    const { data: customer, error } = await admin
      .from("customers")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) {
      return jsonError(error.message, 400);
    }

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("UPDATE CUSTOMER ERROR:", error);
    return jsonError(error.message || "Unable to update customer", 500);
  }
}