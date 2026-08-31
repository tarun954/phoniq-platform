"use client";

import { useEffect, useState } from "react";
import CRMPageShell from "@/components/crm/CRMPageShell";

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    relatedType: "customer",
    customerId: "",
    leadId: "",
    title: "",
    followUpAt: "",
    notes: "",
  });

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [followResponse, customerResponse, leadResponse] =
        await Promise.all([
          fetch("/api/follow-ups", {
            cache: "no-store",
          }),
          fetch("/api/customers", {
            cache: "no-store",
          }),
          fetch("/api/leads", {
            cache: "no-store",
          }),
        ]);

      const followData = await followResponse.json();
      const customerData = await customerResponse.json();
      const leadData = await leadResponse.json();

      if (!followResponse.ok) {
        throw new Error(
          followData.error || "Unable to load follow-ups"
        );
      }

      setFollowUps(
        followData.followUps ||
          followData.follow_ups ||
          []
      );

      setCustomers(customerData.customers || []);
      setLeads(leadData.leads || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createFollowUp(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        title: form.title,
        followUpAt: form.followUpAt,
        notes: form.notes,
        customerId:
          form.relatedType === "customer"
            ? form.customerId
            : null,
        leadId:
          form.relatedType === "lead"
            ? form.leadId
            : null,
      };

      const response = await fetch("/api/follow-ups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to create follow-up"
        );
      }

      setForm({
        relatedType: "customer",
        customerId: "",
        leadId: "",
        title: "",
        followUpAt: "",
        notes: "",
      });

      setShowForm(false);

      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function completeFollowUp(id) {
    try {
      setError("");

      const response = await fetch(`/api/follow-ups/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "completed",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to complete follow-up"
        );
      }

      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <CRMPageShell>
      <div className="crm-module-page">
        <div className="crm-module-heading">
          <div>
            <div className="crm-eyebrow">Operations</div>

            <h1>Follow-ups</h1>

            <p>
              Create reminders for callbacks, estimates,
              scheduling, and customer outreach.
            </p>
          </div>

          <button
            className="phoniq-button-primary"
            onClick={() =>
              setShowForm((current) => !current)
            }
          >
            {showForm ? "Close" : "+ New Follow-up"}
          </button>
        </div>

        {error && (
          <div className="crm-error-banner">{error}</div>
        )}

        {showForm && (
          <form
            className="crm-card crm-form-card"
            onSubmit={createFollowUp}
          >
            <div className="crm-form-grid">
              <label className="crm-field">
                <span>Related To *</span>

                <select
                  className="phoniq-select"
                  value={form.relatedType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      relatedType: event.target.value,
                      customerId: "",
                      leadId: "",
                    }))
                  }
                >
                  <option value="customer">
                    Customer
                  </option>

                  <option value="lead">
                    Lead
                  </option>
                </select>
              </label>

              <label className="crm-field">
                <span>
                  {form.relatedType === "customer"
                    ? "Customer *"
                    : "Lead *"}
                </span>

                {form.relatedType === "customer" ? (
                  <select
                    className="phoniq-select"
                    required
                    value={form.customerId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        customerId: event.target.value,
                      }))
                    }
                  >
                    <option value="">
                      Select customer
                    </option>

                    {customers.map((customer) => (
                      <option
                        value={customer.id}
                        key={customer.id}
                      >
                        {customer.full_name}{" "}
                        {customer.phone
                          ? `- ${customer.phone}`
                          : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    className="phoniq-select"
                    required
                    value={form.leadId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        leadId: event.target.value,
                      }))
                    }
                  >
                    <option value="">
                      Select lead
                    </option>

                    {leads.map((lead) => (
                      <option
                        value={lead.id}
                        key={lead.id}
                      >
                        {lead.customer?.full_name ||
                          lead.full_name ||
                          "Lead"}{" "}
                        -{" "}
                        {lead.service_issue ||
                          "Service request"}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              <label className="crm-field">
                <span>Title *</span>

                <input
                  className="phoniq-input"
                  required
                  value={form.title}
                  placeholder="Call customer about estimate"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="crm-field">
                <span>Date & Time *</span>

                <input
                  type="datetime-local"
                  className="phoniq-input"
                  required
                  value={form.followUpAt}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      followUpAt: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <label className="crm-field">
              <span>Notes</span>

              <textarea
                className="phoniq-textarea"
                placeholder="Reason for follow-up..."
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
              />
            </label>

            <button
              className="phoniq-button-primary"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Follow-up"}
            </button>
          </form>
        )}

        <div className="crm-card">
          {loading ? (
            <div className="crm-empty-state">
              Loading follow-ups...
            </div>
          ) : followUps.length === 0 ? (
            <div className="crm-empty-state">
              <strong>No follow-ups</strong>

              <span>
                Create a reminder for a customer or service
                request.
              </span>
            </div>
          ) : (
            <div className="crm-followup-list">
              {followUps.map((item) => (
                <div
                  className="crm-followup-item"
                  key={item.id}
                >
                  <div>
                    <div className="crm-followup-title">
                      {item.title}
                    </div>

                    <div className="crm-followup-related">
                      {item.customer?.full_name ||
                        item.lead?.service_issue ||
                        "Related service request"}
                    </div>

                    {item.notes && (
                      <p>{item.notes}</p>
                    )}

                    <span>
                      {item.follow_up_at
                        ? new Date(
                            item.follow_up_at
                          ).toLocaleString()
                        : ""}
                    </span>
                  </div>

                  {item.status !== "completed" ? (
                    <button
                      className="phoniq-button-secondary"
                      onClick={() =>
                        completeFollowUp(item.id)
                      }
                    >
                      Mark Complete
                    </button>
                  ) : (
                    <span className="crm-status-badge is-success">
                      Completed
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CRMPageShell>
  );
}