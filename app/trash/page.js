"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/crm/AppShell";
import PriorityBadge from "@/components/crm/PriorityBadge";
import CRMPageShell from "@/components/crm/CRMPageShell";
export default function TrashPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState("");
  const [error, setError] = useState("");

  async function loadTrash() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/leads/trash", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Unable to load trash");

      setLeads(result.leads || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function restoreLead(id) {
    try {
      setRestoring(id);
      const response = await fetch(`/api/leads/${id}/restore`, { method: "POST" });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Unable to restore lead");

      await loadTrash();
    } catch (err) {
      setError(err.message);
    } finally {
      setRestoring("");
    }
  }

  useEffect(() => {
    loadTrash();
  }, []);

  return (
    <CRMPageShell>
      <div className="flex flex-col gap-6">
        <div>
          <div className="text-sm font-semibold text-slate-500">Recovery</div>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Trash</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Deleted leads stay here until you restore them.
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
                  <th className="px-5 py-4">Issue</th>
                  <th className="px-5 py-4">Priority</th>
                  <th className="px-5 py-4">Deleted</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="5" className="p-8 text-slate-400">Loading deleted leads...</td></tr>
                ) : leads.length === 0 ? (
                  <tr><td colSpan="5" className="p-12 text-center text-slate-400">Trash is empty.</td></tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {lead.customer?.full_name || "Unknown"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{lead.service_issue}</td>
                      <td className="px-5 py-4"><PriorityBadge priority={lead.priority} /></td>
                      <td className="px-5 py-4 text-slate-500">
                        {lead.deleted_at ? new Date(lead.deleted_at).toLocaleString() : "—"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          disabled={restoring === lead.id}
                          onClick={() => restoreLead(lead.id)}
                          className="inline-flex rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                        >
                          {restoring === lead.id ? "Restoring..." : "Restore"}
                        </button>
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
