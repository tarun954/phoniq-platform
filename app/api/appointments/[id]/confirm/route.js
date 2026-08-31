import { NextResponse } from "next/server";
import { getCRMContext, jsonError } from "@/lib/crm/auth";
import { sendAppointmentEmail } from "@/lib/communications/email";
import { sendWhatsAppConfirmation } from "@/lib/communications/whatsapp";

export async function POST(request, { params }) {
  try {
    const { id } = await params;

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
    const channel = body.channel;

    if (!["email", "whatsapp"].includes(channel)) {
      return jsonError("Invalid confirmation channel", 400);
    }

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

    const { data: company } = await admin
      .from("company_profiles")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle();

    const companyName =
      company?.company_name ||
      company?.name ||
      "Your Service Company";

    let appointmentTime = "Requested time pending";

    if (appointment.scheduled_start) {
      appointmentTime = new Date(
        appointment.scheduled_start
      ).toLocaleString("en-US", {
        dateStyle: "long",
        timeStyle: "short",
      });
    } else if (
      appointment.preferred_date ||
      appointment.preferred_time
    ) {
      appointmentTime = [
        appointment.preferred_date,
        appointment.preferred_time,
      ]
        .filter(Boolean)
        .join(" ");
    }

    let providerResult;

    if (channel === "email") {
      if (!customer.email) {
        return jsonError("Customer email is missing", 400);
      }

      providerResult = await sendAppointmentEmail({
        to: customer.email,
        customerName: customer.full_name,
        companyName,
        appointmentTime,
        serviceAddress: customer.service_address || "",
      });
    }

    if (channel === "whatsapp") {
      if (!customer.phone) {
        return jsonError("Customer phone number is missing", 400);
      }

      providerResult = await sendWhatsAppConfirmation({
        to: customer.phone,
        customerName: customer.full_name,
        companyName,
        appointmentTime,
      });
    }

    await admin.from("messages").insert({
      organization_id: organizationId,
      customer_id: customer.id,
      appointment_id: appointment.id,
      channel,
      direction: "outbound",
      status: "sent",
      body:
        channel === "email"
          ? `Appointment confirmation sent to ${customer.email}`
          : `Appointment confirmation sent to ${customer.phone}`,
      created_by: user.id,
    });

    await admin
      .from("appointments")
      .update({
        confirmation_status: "sent",
      })
      .eq("id", appointment.id)
      .eq("organization_id", organizationId);

    return NextResponse.json({
      success: true,
      channel,
      providerResult,
    });
  } catch (error) {
    console.error("SEND CONFIRMATION ERROR:", error);

    return jsonError(
      error.message || "Unable to send confirmation",
      500
    );
  }
}