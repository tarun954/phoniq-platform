import { getAvailableSlots } from "@/lib/appointments/getAvailableSlots";

export async function bookAppointment({
  admin,
  organizationId,
  appointmentId,
  requestedDate,
  requestedTime,
  requestedStaffId = null,
}) {
  if (!organizationId) throw new Error("organizationId is required.");
  if (!appointmentId) throw new Error("appointmentId is required.");
  if (!requestedDate || !requestedTime) throw new Error("Date and time are required.");

  const availability = await getAvailableSlots({
    admin,
    organizationId,
    requestedDate,
    limit: 100,
  });

  let selected = availability.slots.find(
    (slot) =>
      slot.time === requestedTime &&
      (!requestedStaffId || slot.staffId === requestedStaffId)
  );

  if (!selected && !requestedStaffId) {
    selected = availability.slots.find((slot) => slot.time === requestedTime);
  }

  if (!selected) {
    const error = new Error("That appointment time is no longer available.");
    error.status = 409;
    error.availableSlots = availability.slots.slice(0, 8);
    throw error;
  }

  const { data: appointment, error } = await admin
    .from("appointments")
    .update({
      scheduled_at: selected.scheduledAt,
      staff_id: selected.staffId,
      booking_status: "confirmed",
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId)
    .eq("id", appointmentId)
    .select("*")
    .single();

  if (error) throw error;

  await admin
    .from("client_realtime_notifications")
    .insert({
      organization_id: organizationId,
      title: "Appointment confirmed",
      message: `${selected.label} · ${selected.staffName}`,
      read: false,
    })
    .then(() => null, () => null);

  return {
    appointment,
    selectedSlot: selected,
    companyName: availability.companyName,
    timezone: availability.timezone,
  };
}
