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

    const { data: appointment, error: appointmentError } = await admin
      .from("appointments")
      .select("*")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .single();

    if (appointmentError) {
      return jsonError(appointmentError.message, 404);
    }

    const { data: customer, error: customerError } = await admin
      .from("customers")
      .select("*")
      .eq("id", appointment.customer_id)
      .eq("organization_id", organizationId)
      .single();

    if (customerError) {
      return jsonError(customerError.message, 404);
    }

    if (!customer.email) {
      return jsonError("Customer email is missing", 400);
    }

    const { data: company } = await admin
      .from("company_profiles")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle();

    const companyName =
      company?.company_name ||
      company?.name ||
      "Your Service Company";

    const supportPhone =
      company?.support_phone ||
      company?.main_phone ||
      "";

    let appointmentTime = "Requested time pending";

    if (appointment.scheduled_start) {
      appointmentTime = new Date(
        appointment.scheduled_start
      ).toLocaleString("en-US", {
        dateStyle: "long",
        timeStyle: "short",
      });
    } else if (appointment.preferred_date || appointment.preferred_time) {
      appointmentTime = [
        appointment.preferred_date,
        appointment.preferred_time,
      ]
        .filter(Boolean)
        .join(" ");
    }

    const subject = `Your appointment request with ${companyName}`;

    const body = `Hi ${customer.full_name || "there"},

Thank you for choosing ${companyName}.

Your service appointment request has been received.

Appointment:
${appointmentTime}

${
  customer.service_address
    ? `Service Address:
${customer.service_address}`
    : ""
}

Our team will contact you if any additional confirmation is required.

Thank you,
${companyName}${supportPhone ? `\n${supportPhone}` : ""}`;

    return NextResponse.json({
      success: true,
      preview: {
        to: customer.email,
        customerName: customer.full_name,
        subject,
        body,
        appointmentTime,
      },
    });
  } catch (error) {
    console.error("EMAIL PREVIEW ERROR:", error);
    return jsonError(
      error.message || "Unable to generate email preview",
      500
    );
  }
}