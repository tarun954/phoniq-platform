"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/crm/AppShell";
import PriorityBadge from "@/components/crm/PriorityBadge";
import StatusBadge from "@/components/crm/StatusBadge";
import CRMPageShell from "@/components/crm/CRMPageShell";

export default function HotLeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHotLeads() {
      try {
        const [hotResponse, criticalResponse] = await Promise.all([
          fetch("/api/leads?priority=hot", { cache: "no-store" }),
          fetch("/api/leads?priority=critical", { cache: "no-store" }),
        ]);

        const hotResult = await hotResponse.json();
        const criticalResult = await criticalResponse.json();

        if (!hotResponse.ok) throw new Error(hotResult.error || "Unable to load hot leads");
        if (!criticalResponse.ok) throw new Error(criticalResult.error || "Unable to load critical leads");

        const combined = [
          ...(criticalResult.leads || []),
          ...(hotResult.leads || []),
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setLeads(combined);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadHotLeads();
  }, []);

  return (
    <CRMPageShell>
      <div className="flex flex-col gap-6">
        <div>
          <div className="text-sm font-semibold text-orange-600">Priority Queue</div>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Hot Leads</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Urgent opportunities that need a fast response from your team.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-white" />
            ))
          ) : leads.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <div className="text-lg font-bold text-slate-800">No urgent leads right now</div>
              <div className="mt-2 text-sm text-slate-400">Your priority queue is clear.</div>
            </div>
          ) : (
            leads.map((lead) => (
              <Link
                href={`/leads/${lead.id}`}
                key={lead.id}
                className={`group rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:shadow-lg ${
                  lead.priority === "critical"
                    ? "border-red-200"
                    : "border-orange-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg ${
                        lead.priority === "critical"
                          ? "bg-red-50"
                          : "bg-orange-50"
                      }`}
                    >
                      {lead.priority === "critical" ? "🚨" : "🔥"}
                    </div>
                    <div>
                      <div className="text-lg font-black text-slate-950">
                        {lead.customer?.full_name || "Customer"}
                      </div>
                      <div className="mt-1 text-xs font-medium text-slate-400">
                        {lead.customer?.phone || "No phone"}
                      </div>
                    </div>
                  </div>

                  <PriorityBadge priority={lead.priority} />
                </div>

                <div className="mt-5 text-sm font-semibold leading-6 text-slate-700">
                  {lead.service_issue || "Service request"}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={lead.status} />
                    <span className="text-xs text-slate-400">
                      {lead.customer?.city || "Location unavailable"}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-blue-600 group-hover:text-blue-700">
                    Open lead →
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </CRMPageShell>
  );
}
