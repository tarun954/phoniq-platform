import {
  sendAppointmentEmail,
} from "@/lib/communications/email";

import {
  sendWhatsAppConfirmation,
} from "@/lib/communications/whatsapp";

import {
  saveMessage,
} from "@/lib/communications/saveMessage";


function formatAppointmentTime(
  scheduledAt,
  timezone
) {
  if (!scheduledAt) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          timezone ||
          "America/Chicago",

        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",

        hour: "numeric",
        minute: "2-digit",

        timeZoneName: "short",
      }
    ).format(
      new Date(scheduledAt)
    );
  } catch {
    return String(scheduledAt);
  }
}


function getProviderMessageId(
  response
) {
  return (
    response?.data?.id ||
    response?.id ||
    response?.message_id ||
    response?.data?.message_id ||
    null
  );
}


export async function handleAppointmentConfirmed({
  admin,
  organizationId,
  appointment,
  selectedSlot,
  companyName,
  timezone,
}) {
  if (!admin) {
    throw new Error(
      "admin client is required."
    );
  }

  if (!organizationId) {
    throw new Error(
      "organizationId is required."
    );
  }

  if (!appointment?.id) {
    throw new Error(
      "appointment is required."
    );
  }

  /*
   * --------------------------------------------------
   * 1. Load customer
   * --------------------------------------------------
   */

  let customer = null;

  if (appointment.customer_id) {
    const {
      data,
      error,
    } = await admin
      .from("customers")
      .select(
        `
        id,
        full_name,
        phone,
        email,
        service_address
        `
      )
      .eq(
        "organization_id",
        organizationId
      )
      .eq(
        "id",
        appointment.customer_id
      )
      .maybeSingle();

    if (error) {
      console.error(
        "CONFIRMATION CUSTOMER LOOKUP ERROR:",
        error
      );
    } else {
      customer = data;
    }
  }

  const appointmentTime =
    formatAppointmentTime(
      appointment.scheduled_at ||
        selectedSlot?.scheduledAt,
      timezone
    );

  /*
   * --------------------------------------------------
   * 2. CRM notification
   * --------------------------------------------------
   */

  try {
    const { error } = await admin
      .from("notifications")
      .insert({
        organization_id:
          organizationId,

        user_id:
          null,

        type:
          "appointment_confirmed",

        title:
          "Appointment confirmed",

        message:
          `${appointmentTime} · ${
            selectedSlot?.staffName ||
            "Technician assigned"
          }`,

        resource_type:
          "appointment",

        resource_id:
          appointment.id,

        priority:
          "normal",

        href:
          "/dashboard/appointments",
      });

    if (error) {
      console.error(
        "CRM NOTIFICATION CREATE ERROR:",
        error
      );
    }
  } catch (error) {
    console.error(
      "CRM NOTIFICATION EXCEPTION:",
      error
    );
  }

  /*
   * --------------------------------------------------
   * 3. Realtime notification
   * --------------------------------------------------
   */

  try {
    const { error } = await admin
      .from(
        "client_realtime_notifications"
      )
      .insert({
        organization_id:
          organizationId,

        title:
          "Appointment confirmed",

        message:
          `${appointmentTime} · ${
            selectedSlot?.staffName ||
            "Technician assigned"
          }`,

        read:
          false,
      });

    if (error) {
      console.error(
        "REALTIME NOTIFICATION ERROR:",
        error
      );
    }
  } catch (error) {
    console.error(
      "REALTIME NOTIFICATION EXCEPTION:",
      error
    );
  }

  /*
   * --------------------------------------------------
   * 4. WhatsApp confirmation
   * --------------------------------------------------
   */

  let whatsappStatus =
    "skipped";

  if (
    customer?.phone &&
    process.env.TELNYX_API_KEY &&
    process.env.TELNYX_WHATSAPP_FROM
  ) {
    try {
      const whatsappResult =
        await sendWhatsAppConfirmation({
          to:
            customer.phone,

          customerName:
            customer.full_name,

          companyName,

          appointmentTime,
        });

      whatsappStatus =
        "sent";

      const body =
        `Hi ${
          customer.full_name ||
          "there"
        }, your service appointment with ` +
        `${companyName} is confirmed for ` +
        `${appointmentTime}.`;

      try {
        await saveMessage({
          admin,

          organizationId,

          customerId:
            customer.id,

          leadId:
            appointment.lead_id ||
            null,

          channel:
            "whatsapp",

          direction:
            "outbound",

          provider:
            "telnyx",

          providerMessageId:
            getProviderMessageId(
              whatsappResult
            ),

          recipient:
            customer.phone,

          sender:
            process.env
              .TELNYX_WHATSAPP_FROM,

          body,

          status:
            "sent",
        });
      } catch (messageError) {
        console.error(
          "WHATSAPP MESSAGE SAVE ERROR:",
          messageError
        );
      }
    } catch (error) {
      whatsappStatus =
        "failed";

      console.error(
        "WHATSAPP CONFIRMATION ERROR:",
        error
      );

      try {
        await saveMessage({
          admin,

          organizationId,

          customerId:
            customer?.id ||
            null,

          leadId:
            appointment.lead_id ||
            null,

          channel:
            "whatsapp",

          direction:
            "outbound",

          provider:
            "telnyx",

          recipient:
            customer?.phone ||
            null,

          sender:
            process.env
              .TELNYX_WHATSAPP_FROM ||
            null,

          body:
            `Appointment confirmation for ${appointmentTime}`,

          status:
            "failed",

          errorMessage:
            error?.message ||
            "WhatsApp confirmation failed.",
        });
      } catch (
        messageSaveError
      ) {
        console.error(
          "FAILED WHATSAPP LOG ERROR:",
          messageSaveError
        );
      }
    }
  }

  /*
   * --------------------------------------------------
   * 5. Email confirmation
   * --------------------------------------------------
   */

  let emailStatus =
    "skipped";

  if (
    customer?.email &&
    process.env.RESEND_API_KEY
  ) {
    try {
      const emailResult =
        await sendAppointmentEmail({
          to:
            customer.email,

          customerName:
            customer.full_name,

          companyName,

          appointmentTime,

          serviceAddress:
            customer.service_address,
        });

      emailStatus =
        "sent";

      const subject =
        `Appointment confirmed with ${companyName}`;

      const body =
        `Your service appointment with ` +
        `${companyName} is confirmed for ` +
        `${appointmentTime}.`;

      try {
        await saveMessage({
          admin,

          organizationId,

          customerId:
            customer.id,

          leadId:
            appointment.lead_id ||
            null,

          channel:
            "email",

          direction:
            "outbound",

          provider:
            "resend",

          providerMessageId:
            getProviderMessageId(
              emailResult
            ),

          recipient:
            customer.email,

          sender:
            process.env
              .PHONIQ_EMAIL_FROM ||
            "Phoniq <onboarding@resend.dev>",

          subject,

          body,

          status:
            "sent",
        });
      } catch (messageError) {
        console.error(
          "EMAIL MESSAGE SAVE ERROR:",
          messageError
        );
      }
    } catch (error) {
      emailStatus =
        "failed";

      console.error(
        "EMAIL CONFIRMATION ERROR:",
        error
      );

      try {
        await saveMessage({
          admin,

          organizationId,

          customerId:
            customer?.id ||
            null,

          leadId:
            appointment.lead_id ||
            null,

          channel:
            "email",

          direction:
            "outbound",

          provider:
            "resend",

          recipient:
            customer?.email ||
            null,

          sender:
            process.env
              .PHONIQ_EMAIL_FROM ||
            null,

          subject:
            `Appointment confirmation with ${companyName}`,

          body:
            `Appointment confirmation for ${appointmentTime}`,

          status:
            "failed",

          errorMessage:
            error?.message ||
            "Email confirmation failed.",
        });
      } catch (
        messageSaveError
      ) {
        console.error(
          "FAILED EMAIL LOG ERROR:",
          messageSaveError
        );
      }
    }
  }

  /*
   * --------------------------------------------------
   * 6. Store confirmation status
   * --------------------------------------------------
   */

  try {
    const { error } = await admin
      .from("appointments")
      .update({
        confirmation_email_status:
          emailStatus,

        confirmation_whatsapp_status:
          whatsappStatus,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "organization_id",
        organizationId
      )
      .eq(
        "id",
        appointment.id
      );

    if (error) {
      console.error(
        "CONFIRMATION STATUS UPDATE ERROR:",
        error
      );
    }
  } catch (error) {
    console.error(
      "CONFIRMATION STATUS UPDATE EXCEPTION:",
      error
    );
  }

  return {
    success: true,

    appointmentId:
      appointment.id,

    organizationId,

    companyName,

    timezone,

    emailStatus,

    whatsappStatus,
  };
}