"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/crm/AppShell";
import PriorityBadge from "@/components/crm/PriorityBadge";
import StatusBadge from "@/components/crm/StatusBadge";
import CRMPageShell from "@/components/crm/CRMPageShell";

const statuses = [
  "new",
  "qualified",
  "assigned",
  "contacting",
  "follow_up",
  "appointment_requested",
  "scheduled",
  "in_progress",
  "completed",
  "resolved",
  "cancelled",
  "lost",
];

const pipeline = [
  "new",
  "qualified",
  "assigned",
  "appointment_requested",
  "scheduled",
  "in_progress",
  "completed",
  "resolved",
];

export default function LeadDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadLead() {
    try {
      setLoading(true);
      const response = await fetch(`/api/leads/${id}`, { cache: "no-store" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load lead");
      }

      setLead(result.lead);
      setActivities(result.activities || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadLead();
  }, [id]);

  async function updateLead(updates) {
    try {
      setSaving(true);
      setError("");

      const response = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update lead");
      }

      await loadLead();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteLead() {
    if (!window.confirm("Move this lead to Trash?")) return;

    try {
      const response = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Unable to delete lead");

      router.push("/trash");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <CRMPageShell>
      {loading ? (
        <LeadSkeleton />
      ) : !lead ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-semibold text-red-700">
          {error || "Lead not found"}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <button
            onClick={() => router.push("/leads")}
            className="w-fit text-sm font-bold text-blue-600 hover:text-blue-700"
          >
            ← Back to Leads
          </button>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-black tracking-tight text-slate-950">
                  {lead.customer?.full_name || "Customer"}
                </h1>
                <PriorityBadge priority={lead.priority} />
                <StatusBadge status={lead.status} />
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {lead.service_issue || "Service request"} • Lead {String(lead.id).slice(0, 8)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href={lead.customer?.phone ? `tel:${lead.customer.phone}` : "#"}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Call
              </a>
              <button className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
                WhatsApp
              </button>
              <button
                onClick={deleteLead}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 px-4 text-sm font-bold text-red-700 hover:bg-red-100"
              >
                Move to Trash
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Lead Information</h2>
                    <p className="mt-1 text-sm text-slate-500">Customer and service request details</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                  <Field label="Phone" value={lead.customer?.phone} />
                  <Field label="City" value={lead.customer?.city} />
                  <Field label="Service Address" value={lead.customer?.service_address} />
                  <Field label="Preferred Time" value={lead.preferred_time} />
                  <Field label="Emergency" value={lead.emergency ? "Yes" : "No"} />
                  <Field label="Source" value={lead.source || "phone_ai"} />
                  <div className="sm:col-span-2">
                    <Field label="Service Issue" value={lead.service_issue} />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                  <h2 className="text-base font-bold text-slate-900">Activity Timeline</h2>
                  <p className="mt-1 text-sm text-slate-500">Everything that happened on this lead</p>
                </div>

                <div className="p-5 sm:p-6">
                  {activities.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-400">
                      No activity has been recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {activities.map((activity) => (
                        <div key={activity.id} className="relative pl-8">
                          <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-blue-50" />
                          <div className="font-bold text-slate-800">
                            {activity.description || activity.action}
                          </div>
                          <div className="mt-1 text-xs font-medium text-slate-400">
                            {activity.created_at
                              ? new Date(activity.created_at).toLocaleString()
                              : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <h2 className="text-base font-bold text-slate-900">Lead Workflow</h2>
                <p className="mt-1 text-sm text-slate-500">Move this request toward completion</p>

                <div className="mt-6 space-y-1">
                  {pipeline.map((item, index) => {
                    const activeIndex = pipeline.indexOf(lead.status);
                    const complete = index <= activeIndex;

                    return (
                      <div key={item} className="flex items-center gap-3 py-2">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                            complete
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {complete ? "✓" : index + 1}
                        </div>
                        <div
                          className={`text-sm font-semibold ${
                            complete ? "text-slate-800" : "text-slate-400"
                          }`}
                        >
                          {item
                            .replaceAll("_", " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Change status
                  </label>
                  <select
                    value={lead.status}
                    disabled={saving}
                    onChange={(event) => updateLead({ status: event.target.value })}
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status
                          .replaceAll("_", " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <h2 className="text-base font-bold text-slate-900">Priority</h2>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {["normal", "hot", "critical"].map((priority) => (
                    <button
                      key={priority}
                      disabled={saving}
                      onClick={() => updateLead({ priority })}
                      className={`rounded-xl border px-3 py-2.5 text-xs font-bold capitalize transition ${
                        lead.priority === priority
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </CRMPageShell>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>
      <div className="mt-1.5 text-sm font-semibold leading-6 text-slate-800">
        {value || "—"}
      </div>
    </div>
  );
}

function LeadSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-10 w-48 animate-pulse rounded-xl bg-slate-200" />
      <div className="h-24 animate-pulse rounded-2xl bg-white" />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="h-96 animate-pulse rounded-2xl bg-white" />
        <div className="h-96 animate-pulse rounded-2xl bg-white" />
      </div>
    </div>
  );
}
