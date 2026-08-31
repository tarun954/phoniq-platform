"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/crm/AppShell";
import CRMPageShell from "@/components/crm/CRMPageShell";

export default function ResolvedPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadResolved() {
      try {
        const response = await fetch("/api/leads?status=resolved", { cache: "no-store" });
        const result = await response.json();

        if (!response.ok) throw new Error(result.error || "Unable to load resolved leads");

        setLeads(result.leads || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadResolved();
  }, []);

  return (
    <CRMPageShell>
      <div className="flex flex-col gap-6">
        <div>
          <div className="text-sm font-semibold text-emerald-600">Completed Work</div>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Resolved</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Historical service requests your team successfully completed.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Service</th>
                  <th className="px-5 py-4">Resolution</th>
                  <th className="px-5 py-4">Resolved</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="5" className="p-8 text-slate-400">Loading resolved leads...</td></tr>
                ) : leads.length === 0 ? (
                  <tr><td colSpan="5" className="p-12 text-center text-slate-400">No resolved leads yet.</td></tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {lead.customer?.full_name || "Unknown"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{lead.service_issue}</td>
                      <td className="px-5 py-4 text-slate-500">{lead.resolution_notes || "Resolved"}</td>
                      <td className="px-5 py-4 text-slate-500">
                        {lead.resolved_at ? new Date(lead.resolved_at).toLocaleString() : "—"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                          View
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
