"use client";

import { useEffect, useMemo, useState } from "react";
import CRMPageShell from "@/components/crm/CRMPageShell";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [emailCustomer, setEmailCustomer] = useState(null);
  const [emailValue, setEmailValue] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const [previewAppointment, setPreviewAppointment] =
    useState(null);
  const [emailPreview, setEmailPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const [jobAppointment, setJobAppointment] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: "",
    serviceIssue: "",
    notes: "",
  });
  const [creatingJob, setCreatingJob] = useState(false);

  async function loadAppointments() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/appointments", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load appointments"
        );
      }

      setAppointments(data.appointments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  async function updateStatus(id, status) {
    try {
      setError("");

      const response = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to update appointment"
        );
      }

      await loadAppointments();
    } catch (err) {
      setError(err.message);
    }
  }

  function openAddEmail(customer) {
    setEmailCustomer(customer);
    setEmailValue(customer?.email || "");
    setError("");
  }

  async function saveCustomerEmail() {
    if (!emailCustomer?.id) return;

    if (!emailValue.trim()) {
      setError("Please enter an email address.");
      return;
    }

    try {
      setSavingEmail(true);
      setError("");

      const response = await fetch(
        `/api/customers/${emailCustomer.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: emailValue.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to save customer email"
        );
      }

      setEmailCustomer(null);
      setEmailValue("");

      await loadAppointments();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingEmail(false);
    }
  }

  async function openEmailPreview(appointment) {
    if (!appointment.customer?.email) {
      openAddEmail(appointment.customer);
      return;
    }

    try {
      setPreviewLoading(true);
      setError("");
      setPreviewAppointment(appointment);
      setEmailPreview(null);

      const response = await fetch(
        `/api/appointments/${appointment.id}/email-preview`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to create email preview"
        );
      }

      setEmailPreview(data.preview);
    } catch (err) {
      setError(err.message);
      setPreviewAppointment(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function sendEmail() {
    if (!previewAppointment) return;

    try {
      setSendingEmail(true);
      setError("");

      const response = await fetch(
        `/api/appointments/${previewAppointment.id}/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channel: "email",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to send email"
        );
      }

      setPreviewAppointment(null);
      setEmailPreview(null);

      await loadAppointments();
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingEmail(false);
    }
  }

  async function sendWhatsApp(appointment) {
    try {
      setError("");

      const response = await fetch(
        `/api/appointments/${appointment.id}/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channel: "whatsapp",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to send WhatsApp message"
        );
      }

      await loadAppointments();
    } catch (err) {
      setError(err.message);
    }
  }

  function openCreateJob(appointment) {
    setJobAppointment(appointment);

    setJobForm({
      title: `${
        appointment.customer?.full_name || "Customer"
      } Service Job`,
      serviceIssue:
        appointment.service_issue ||
        appointment.notes ||
        "",
      notes: "",
    });
  }

  async function createJob() {
    if (!jobAppointment) return;

    try {
      setCreatingJob(true);
      setError("");

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentId: jobAppointment.id,
          leadId: jobAppointment.lead_id || null,
          customerId: jobAppointment.customer_id,
          title: jobForm.title,
          serviceIssue: jobForm.serviceIssue,
          serviceAddress:
            jobAppointment.customer?.service_address || "",
          scheduledStart:
            jobAppointment.scheduled_start || null,
          notes: jobForm.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create job");
      }

      setJobAppointment(null);
      setJobForm({
        title: "",
        serviceIssue: "",
        notes: "",
      });

      await loadAppointments();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingJob(false);
    }
  }

  const sortedAppointments = useMemo(
    () => appointments,
    [appointments]
  );

  return (
    <CRMPageShell>
      <div className="crm-module-page">
        <div className="crm-module-heading">
          <div>
            <div className="crm-eyebrow">Scheduling</div>
            <h1>Appointments</h1>
            <p>
              Manage requested and scheduled visits and send
              customer confirmations.
            </p>
          </div>
        </div>

        {error && (
          <div className="crm-error-banner">{error}</div>
        )}

        <div className="crm-card crm-table-card">
          {loading ? (
            <div className="crm-empty-state">
              Loading appointments...
            </div>
          ) : sortedAppointments.length === 0 ? (
            <div className="crm-empty-state">
              <strong>No appointments found</strong>
              <span>
                Appointment requests will appear here.
              </span>
            </div>
          ) : (
            <div className="crm-table-wrap">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Confirmation</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedAppointments.map((appointment) => {
                    const customer = appointment.customer;

                    return (
                      <tr key={appointment.id}>
                        <td>
                          <div className="crm-customer-cell">
                            <strong>
                              {customer?.full_name ||
                                "Unknown Customer"}
                            </strong>

                            {customer?.phone && (
                              <span>{customer.phone}</span>
                            )}

                            {customer?.email ? (
                              <span className="crm-email-value">
                                {customer.email}
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="crm-link-button"
                                onClick={() =>
                                  openAddEmail(customer)
                                }
                              >
                                + Add Email
                              </button>
                            )}
                          </div>
                        </td>

                        <td>
                          {appointment.scheduled_start ? (
                            new Date(
                              appointment.scheduled_start
                            ).toLocaleString()
                          ) : (
                            <span>
                              {[
                                appointment.preferred_date,
                                appointment.preferred_time,
                              ]
                                .filter(Boolean)
                                .join(" ") ||
                                "Requested time pending"}
                            </span>
                          )}
                        </td>

                        <td>
                          <select
                            className="phoniq-select"
                            value={
                              appointment.status || "requested"
                            }
                            onChange={(event) =>
                              updateStatus(
                                appointment.id,
                                event.target.value
                              )
                            }
                          >
                            <option value="requested">
                              Requested
                            </option>
                            <option value="scheduled">
                              Scheduled
                            </option>
                            <option value="completed">
                              Completed
                            </option>
                            <option value="cancelled">
                              Cancelled
                            </option>
                          </select>
                        </td>

                        <td>
                          <span
                            className={`crm-status-badge ${
                              appointment.confirmation_status ===
                              "sent"
                                ? "is-success"
                                : ""
                            }`}
                          >
                            {appointment.confirmation_status ||
                              "not_sent"}
                          </span>
                        </td>

                        <td>
                          <div className="crm-action-stack">
                            <button
                              className="phoniq-button-secondary"
                              onClick={() =>
                                openEmailPreview(appointment)
                              }
                            >
                              {customer?.email
                                ? "Email"
                                : "Add Email"}
                            </button>

                            <button
                              className="phoniq-button-secondary"
                              onClick={() =>
                                sendWhatsApp(appointment)
                              }
                            >
                              WhatsApp
                            </button>

                            <button
                              className="phoniq-button-primary"
                              onClick={() =>
                                openCreateJob(appointment)
                              }
                            >
                              Create Job
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ADD CUSTOMER EMAIL */}
      {emailCustomer && (
        <div className="crm-modal-backdrop">
          <div className="crm-modal">
            <div className="crm-modal-header">
              <div>
                <h2>Add customer email</h2>
                <p>
                  {emailCustomer.full_name ||
                    "Customer"}
                </p>
              </div>

              <button
                className="crm-modal-close"
                onClick={() => setEmailCustomer(null)}
              >
                ×
              </button>
            </div>

            <label className="crm-field">
              <span>Email Address</span>

              <input
                type="email"
                className="phoniq-input"
                placeholder="customer@example.com"
                value={emailValue}
                onChange={(event) =>
                  setEmailValue(event.target.value)
                }
              />
            </label>

            <div className="crm-modal-actions">
              <button
                className="phoniq-button-secondary"
                onClick={() => setEmailCustomer(null)}
              >
                Cancel
              </button>

              <button
                className="phoniq-button-primary"
                disabled={savingEmail}
                onClick={saveCustomerEmail}
              >
                {savingEmail
                  ? "Saving..."
                  : "Save Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL PREVIEW */}
      {previewAppointment && (
        <div className="crm-modal-backdrop">
          <div className="crm-modal crm-modal-large">
            <div className="crm-modal-header">
              <div>
                <h2>Send appointment confirmation</h2>
                <p>
                  Preview the email before sending.
                </p>
              </div>

              <button
                className="crm-modal-close"
                onClick={() => {
                  setPreviewAppointment(null);
                  setEmailPreview(null);
                }}
              >
                ×
              </button>
            </div>

            {previewLoading ? (
              <div className="crm-empty-state">
                Creating preview...
              </div>
            ) : emailPreview ? (
              <>
                <div className="crm-preview-meta">
                  <div>
                    <span>To</span>
                    <strong>{emailPreview.to}</strong>
                  </div>

                  <div>
                    <span>Subject</span>
                    <strong>
                      {emailPreview.subject}
                    </strong>
                  </div>
                </div>

                <div className="crm-email-preview">
                  {emailPreview.body}
                </div>

                <div className="crm-modal-actions">
                  <button
                    className="phoniq-button-secondary"
                    onClick={() => {
                      setPreviewAppointment(null);
                      setEmailPreview(null);
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    className="phoniq-button-primary"
                    disabled={sendingEmail}
                    onClick={sendEmail}
                  >
                    {sendingEmail
                      ? "Sending..."
                      : "Send Email"}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* CREATE JOB */}
      {jobAppointment && (
        <div className="crm-modal-backdrop">
          <div className="crm-modal crm-modal-large">
            <div className="crm-modal-header">
              <div>
                <h2>Create service job</h2>
                <p>
                  Convert this appointment into field work.
                </p>
              </div>

              <button
                className="crm-modal-close"
                onClick={() => setJobAppointment(null)}
              >
                ×
              </button>
            </div>

            <label className="crm-field">
              <span>Customer</span>
              <input
                className="phoniq-input"
                disabled
                value={
                  jobAppointment.customer?.full_name ||
                  ""
                }
              />
            </label>

            <label className="crm-field">
              <span>Job Title</span>
              <input
                className="phoniq-input"
                value={jobForm.title}
                onChange={(event) =>
                  setJobForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </label>

            <label className="crm-field">
              <span>Service Issue</span>
              <textarea
                className="phoniq-textarea"
                value={jobForm.serviceIssue}
                onChange={(event) =>
                  setJobForm((current) => ({
                    ...current,
                    serviceIssue: event.target.value,
                  }))
                }
              />
            </label>

            <label className="crm-field">
              <span>Notes</span>
              <textarea
                className="phoniq-textarea"
                value={jobForm.notes}
                onChange={(event) =>
                  setJobForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
              />
            </label>

            <div className="crm-modal-actions">
              <button
                className="phoniq-button-secondary"
                onClick={() => setJobAppointment(null)}
              >
                Cancel
              </button>

              <button
                className="phoniq-button-primary"
                disabled={creatingJob}
                onClick={createJob}
              >
                {creatingJob
                  ? "Creating..."
                  : "Create Job"}
              </button>
            </div>
          </div>
        </div>
      )}
    </CRMPageShell>
  );
}