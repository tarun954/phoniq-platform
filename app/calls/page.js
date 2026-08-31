"use client";

import { useEffect, useState } from "react";
import CRMPageShell from "@/components/crm/CRMPageShell";
import ModuleHeader from "@/components/crm/ModuleHeader";
import EmptyState from "@/components/crm/EmptyState";

export default function CallsPage() {
  const [calls, setCalls] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const response = await fetch("/api/calls", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load calls");
      setCalls(result.calls || []);
    })().catch((e) => setError(e.message));
  }, []);

  return (
    <CRMPageShell>
      <ModuleHeader
        eyebrow="Voice Operations"
        title="Calls"
        subtitle="Review inbound AI calls, captured issues, summaries, and emergency status."
      />

      {error && <div className="module-error">{error}</div>}

      <div className="module-card">
        {calls.length === 0 ? (
          <EmptyState title="No calls found" text="Calls stored by your Telnyx AI flow will appear here." />
        ) : (
          <div className="module-table-wrap">
            <table className="module-table">
              <thead><tr><th>Customer</th><th>Caller</th><th>Issue</th><th>Emergency</th><th>Direction</th><th>Created</th></tr></thead>
              <tbody>
                {calls.map((call) => (
                  <tr key={call.id}>
                    <td className="module-strong">{call.customer?.full_name || "Customer"}</td>
                    <td>{call.caller_phone || call.customer?.phone || "—"}</td>
                    <td>{call.issue || "—"}</td>
                    <td><span className={call.emergency ? "badge-danger" : "badge-neutral"}>{call.emergency ? "Yes" : "No"}</span></td>
                    <td>{call.direction || "—"}</td>
                    <td>{call.created_at ? new Date(call.created_at).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </CRMPageShell>
  );
}
