import { NextResponse } from "next/server";
import { requireOrganization, jsonError } from "@/lib/crm/auth";
import { sendAppointmentEmail } from "@/lib/communications/email";
import { sendWhatsAppConfirmation } from "@/lib/communications/whatsapp";

export async function POST(request) {
  try {
    const { admin, organizationId } = await requireOrganization();
    const body = await request.json();

    const { data: company } = await admin
      .from("company_profiles")
      .select("company_name")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (body.channel === "email") {
      const result = await sendAppointmentEmail({
        to: body.to,
        customerName: "Phoniq Test",
        companyName: company?.company_name || "Phoniq Test Company",
        appointmentTime: "Tomorrow at 10:00 AM",
        serviceAddress: "Test service address",
      });

      return NextResponse.json({ success: true, result });
    }

    if (body.channel === "whatsapp") {
      const result = await sendWhatsAppConfirmation({
        to: body.to,
        customerName: "Phoniq Test",
        companyName: company?.company_name || "Phoniq Test Company",
        appointmentTime: "Tomorrow at 10:00 AM",
      });

      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json(
      { success: false, error: "Use channel email or whatsapp" },
      { status: 400 }
    );
  } catch (error) {
    const result = jsonError(error, "Integration test failed");
    return NextResponse.json(result.body, { status: result.status });
  }
}
