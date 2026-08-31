"use client";

import { useEffect, useMemo, useState } from "react";
import CRMPageShell from "@/components/crm/CRMPageShell";
import ModuleHeader from "@/components/crm/ModuleHeader";
import EmptyState from "@/components/crm/EmptyState";

export default function ConversationsPage() {
  const [messages, setMessages] = useState([]);
  const [channel, setChannel] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const response = await fetch("/api/conversations", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load conversations");
      setMessages(result.messages || []);
    })().catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    if (channel === "all") return messages;
    return messages.filter((m) => m.channel === channel);
  }, [messages, channel]);

  return (
    <CRMPageShell>
      <ModuleHeader
        eyebrow="Customer Communications"
        title="Conversations"
        subtitle="See outbound email and WhatsApp activity in one customer communication history."
      />

      {error && <div className="module-error">{error}</div>}

      <div className="module-card">
        <div className="module-toolbar">
          <select className="phoniq-select compact-select" value={channel} onChange={(e)=>setChannel(e.target.value)}>
            <option value="all">All channels</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
            <option value="voice">Voice</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No conversations found" text="Customer confirmations and future messaging will appear here." />
        ) : (
          <div className="module-list">
            {filtered.map((m) => (
              <div key={m.id} className="module-list-row">
                <div>
                  <div className="module-strong">{m.customer?.full_name || "Customer"} • {m.channel}</div>
                  <div className="module-muted">{m.subject || m.body || "Message"}</div>
                </div>
                <div className="module-right-meta">
                  <span className="badge-neutral">{m.status || "sent"}</span>
                  <span>{m.created_at ? new Date(m.created_at).toLocaleString() : ""}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CRMPageShell>
  );
}
