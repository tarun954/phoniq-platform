export async function createJobFromAppointment({
    admin,
    organizationId,
    appointment,
    selectedSlot,
  }) {
    if (!admin) {
      throw new Error("admin client is required.");
    }
  
    if (!organizationId) {
      throw new Error("organizationId is required.");
    }
  
    if (!appointment?.id) {
      throw new Error("appointment is required.");
    }
  
    /*
     * --------------------------------------------------
     * 1. Check whether job already exists
     * --------------------------------------------------
     */
  
    const {
      data: existingJobs,
      error: existingJobError,
    } = await admin
      .from("jobs")
      .select("*")
      .eq(
        "organization_id",
        organizationId
      )
      .eq(
        "appointment_id",
        appointment.id
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      )
      .limit(1);
  
    if (existingJobError) {
      throw existingJobError;
    }
  
    const existingJob =
      existingJobs?.[0] || null;
  
    if (existingJob) {
      return existingJob;
    }
  
    /*
     * --------------------------------------------------
     * 2. Load lead
     * --------------------------------------------------
     */
  
    let lead = null;
  
    if (appointment.lead_id) {
      const {
        data,
        error,
      } = await admin
        .from("leads")
        .select(
          `
          id,
          service_issue,
          notes
          `
        )
        .eq(
          "organization_id",
          organizationId
        )
        .eq(
          "id",
          appointment.lead_id
        )
        .maybeSingle();
  
      if (error) {
        console.error(
          "JOB LEAD LOOKUP ERROR:",
          error
        );
      } else {
        lead = data;
      }
    }
  
    /*
     * --------------------------------------------------
     * 3. Load customer
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
          "JOB CUSTOMER LOOKUP ERROR:",
          error
        );
      } else {
        customer = data;
      }
    }
  
    const serviceIssue =
      lead?.service_issue ||
      null;
  
    const scheduledStart =
      appointment.scheduled_at ||
      selectedSlot?.scheduledAt ||
      null;
  
    const assignedTo =
      appointment.staff_id ||
      selectedSlot?.staffId ||
      null;
  
    const now =
      new Date().toISOString();
  
    /*
     * --------------------------------------------------
     * 4. Create job
     * --------------------------------------------------
     */
  
    const {
      data: job,
      error: createError,
    } = await admin
      .from("jobs")
      .insert({
        organization_id:
          organizationId,
  
        lead_id:
          appointment.lead_id ||
          null,
  
        customer_id:
          appointment.customer_id ||
          null,
  
        appointment_id:
          appointment.id,
  
        assigned_to:
          assignedTo,
  
        status:
          "scheduled",
  
        issue:
          serviceIssue,
  
        service_issue:
          serviceIssue,
  
        scheduled_start:
          scheduledStart,
  
        title:
          serviceIssue ||
          "Service Job",
  
        description:
          lead?.notes ||
          appointment.notes ||
          null,
  
        service_address:
          customer?.service_address ||
          null,
  
        notes:
          appointment.notes ||
          null,
  
        updated_at:
          now,
      })
      .select("*")
      .single();
  
    if (!createError) {
      return job;
    }
  
    /*
     * --------------------------------------------------
     * 5. Handle duplicate/race condition
     * --------------------------------------------------
     */
  
    if (
      String(createError.code) ===
      "23505"
    ) {
      const {
        data: duplicateJobs,
        error: duplicateLookupError,
      } = await admin
        .from("jobs")
        .select("*")
        .eq(
          "organization_id",
          organizationId
        )
        .eq(
          "appointment_id",
          appointment.id
        )
        .limit(1);
  
      if (duplicateLookupError) {
        throw duplicateLookupError;
      }
  
      if (duplicateJobs?.[0]) {
        return duplicateJobs[0];
      }
    }
  
    throw createError;
  }