import {
  getAvailableSlots,
} from "@/lib/appointments/getAvailableSlots";

import {
  handleAppointmentConfirmed,
} from "@/lib/automations/appointmentConfirmed";

import {
  createJobFromAppointment,
} from "@/lib/jobs/createJobFromAppointment";


export async function bookAppointment({
  admin,
  organizationId,
  appointmentId,
  requestedDate,
  requestedTime,
  requestedStaffId = null,
}) {
  if (!organizationId) {
    throw new Error(
      "organizationId is required."
    );
  }

  if (!appointmentId) {
    throw new Error(
      "appointmentId is required."
    );
  }

  if (
    !requestedDate ||
    !requestedTime
  ) {
    throw new Error(
      "Date and time are required."
    );
  }

  /*
   * --------------------------------------------------
   * 1. Re-check live availability
   * --------------------------------------------------
   */

  const availability =
    await getAvailableSlots({
      admin,
      organizationId,
      requestedDate,
      limit: 100,
    });

  /*
   * --------------------------------------------------
   * 2. Find requested slot
   * --------------------------------------------------
   */

  let selected =
    availability.slots.find(
      (slot) =>
        slot.time ===
          requestedTime &&
        (
          !requestedStaffId ||
          slot.staffId ===
            requestedStaffId
        )
    );

  if (
    !selected &&
    !requestedStaffId
  ) {
    selected =
      availability.slots.find(
        (slot) =>
          slot.time ===
          requestedTime
      );
  }

  /*
   * --------------------------------------------------
   * 3. Slot unavailable
   * --------------------------------------------------
   */

  if (!selected) {
    const error = new Error(
      "That appointment time is no longer available."
    );

    error.status = 409;

    error.availableSlots =
      availability.slots.slice(
        0,
        8
      );

    throw error;
  }

  /*
   * --------------------------------------------------
   * 4. Confirm appointment
   * --------------------------------------------------
   */

  const now =
    new Date().toISOString();

  const {
    data: appointment,
    error: appointmentError,
  } = await admin
    .from("appointments")
    .update({
      scheduled_at:
        selected.scheduledAt,

      staff_id:
        selected.staffId,

      booking_status:
        "confirmed",

      confirmed_at:
        now,

      updated_at:
        now,
    })
    .eq(
      "organization_id",
      organizationId
    )
    .eq(
      "id",
      appointmentId
    )
    .select("*")
    .single();

  if (appointmentError) {
    console.error(
      "APPOINTMENT CONFIRM ERROR:",
      appointmentError
    );

    throw appointmentError;
  }

  /*
   * --------------------------------------------------
   * 5. Automatically create Job
   * --------------------------------------------------
   */

  let job = null;

  try {
    job =
      await createJobFromAppointment({
        admin,
        organizationId,
        appointment,
        selectedSlot:
          selected,
      });

    console.log(
      "PHONIQ JOB CREATED:",
      {
        appointmentId:
          appointment.id,

        jobId:
          job?.id ||
          null,
      }
    );
  } catch (jobError) {
    /*
     * Do NOT undo a valid booking because
     * the downstream Job creation failed.
     */
    console.error(
      "AUTO JOB CREATE ERROR:",
      jobError
    );
  }

  /*
   * --------------------------------------------------
   * 6. Notifications + WhatsApp + Email
   * --------------------------------------------------
   */

  try {
    await handleAppointmentConfirmed({
      admin,
      organizationId,
      appointment,
      selectedSlot:
        selected,

      companyName:
        availability.companyName,

      timezone:
        availability.timezone,
    });
  } catch (
    automationError
  ) {
    /*
     * A notification provider failure must
     * never undo a confirmed appointment.
     */
    console.error(
      "POST BOOKING AUTOMATION ERROR:",
      automationError
    );
  }

  /*
   * --------------------------------------------------
   * 7. Return result
   * --------------------------------------------------
   */

  return {
    appointment,

    job,

    selectedSlot:
      selected,

    companyName:
      availability.companyName,

    timezone:
      availability.timezone,
  };
}