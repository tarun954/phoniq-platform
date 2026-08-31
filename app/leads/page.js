"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CRMPageShell from "@/components/crm/CRMPageShell";
import AppShell from "@/components/crm/AppShell";
import PriorityBadge from "@/components/crm/PriorityBadge";
import StatusBadge from "@/components/crm/StatusBadge";

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  async function loadLeads() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);

      const response = await fetch(
        params.toString() ? `/api/leads?${params.toString()}` : "/api/leads",
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load leads");
      }

      setLeads(result.leads || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, [status, priority]);

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return leads;

    return leads.filter((lead) => {
      return [
        lead.customer?.full_name,
        lead.customer?.phone,
        lead.customer?.city,
        lead.service_issue,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [leads, search]);

  return (
    <CRMPageShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-blue-600">Revenue Operations</div>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Leads</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Review, qualify and move every incoming request toward a booked job.
            </p>
          </div>

          <div className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm">
            {filteredLeads.length} active leads
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
            <div className="relative">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by customer, phone, city or issue..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-400"
            >
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="qualified">Qualified</option>
              <option value="assigned">Assigned</option>
              <option value="contacting">Contacting</option>
              <option value="follow_up">Follow Up</option>
              <option value="appointment_requested">Appointment Requested</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-400"
            >
              <option value="">All priorities</option>
              <option value="critical">Critical</option>
              <option value="hot">Hot</option>
              <option value="normal">Normal</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Service Request</th>
                  <th className="px-5 py-4">Priority</th>
                  <th className="px-5 py-4">Stage</th>
                  <th className="px-5 py-4">Location</th>
                  <th className="px-5 py-4">Received</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <LoadingRows />
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-16 text-center">
                      <div className="text-sm font-bold text-slate-700">No leads found</div>
                      <div className="mt-1 text-sm text-slate-400">
                        Try changing your filters or wait for the next incoming request.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="group transition hover:bg-blue-50/25">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-600">
                            {(lead.customer?.full_name || "C").slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {lead.customer?.full_name || "Unknown customer"}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-400">
                              {lead.customer?.phone || "No phone"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="max-w-[280px] px-5 py-4">
                        <div className="truncate font-medium text-slate-700">
                          {lead.service_issue || "Service request"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <PriorityBadge priority={lead.priority} />
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={lead.status} />
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {lead.customer?.city || "—"}
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {lead.created_at ? new Date(lead.created_at).toLocaleString() : "—"}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </CRMPageShell>
  );
}

function LoadingRows() {
  return Array.from({ length: 5 }).map((_, index) => (
    <tr key={index}>
      <td colSpan="7" className="px-5 py-4">
        <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
      </td>
    </tr>
  ));
}
