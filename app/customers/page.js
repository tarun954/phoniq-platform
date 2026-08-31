"use client";

import { useEffect, useMemo, useState } from "react";
import CRMPageShell from "@/components/crm/CRMPageShell";
import ModuleHeader from "@/components/crm/ModuleHeader";
import EmptyState from "@/components/crm/EmptyState";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    city: "",
    serviceAddress: "",
  });

  async function load() {
    const response = await fetch("/api/customers", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to load customers");
    setCustomers(result.customers || []);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.full_name, c.phone, c.email, c.city, c.service_address]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [customers, query]);

  async function createCustomer(event) {
    event.preventDefault();
    setError("");

    const response = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "Unable to create customer");
      return;
    }

    setForm({
      fullName: "",
      phone: "",
      email: "",
      city: "",
      serviceAddress: "",
    });
    setShowForm(false);
    await load();
  }

  return (
    <CRMPageShell>
      <ModuleHeader
        eyebrow="Customer CRM"
        title="Customers"
        subtitle="Manage customer contact details and service locations."
        action={
          <button className="phoniq-button-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Close" : "Add customer"}
          </button>
        }
      />

      {showForm && (
        <form className="module-form-card" onSubmit={createCustomer}>
          <div className="module-form-grid">
            <input className="phoniq-input" required placeholder="Full name"
              value={form.fullName} onChange={(e) => setForm({...form, fullName:e.target.value})}/>
            <input className="phoniq-input" required placeholder="Phone"
              value={form.phone} onChange={(e) => setForm({...form, phone:e.target.value})}/>
            <input className="phoniq-input" type="email" placeholder="Email"
              value={form.email} onChange={(e) => setForm({...form, email:e.target.value})}/>
            <input className="phoniq-input" placeholder="City"
              value={form.city} onChange={(e) => setForm({...form, city:e.target.value})}/>
            <input className="phoniq-input module-span-2" placeholder="Service address"
              value={form.serviceAddress} onChange={(e) => setForm({...form, serviceAddress:e.target.value})}/>
          </div>
          <button className="phoniq-button-primary">Save customer</button>
        </form>
      )}

      {error && <div className="module-error">{error}</div>}

      <div className="module-card">
        <div className="module-toolbar">
          <input className="phoniq-input" placeholder="Search customers..."
            value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No customers found" text="Customers from calls, chat, and manual entry will appear here." />
        ) : (
          <div className="module-table-wrap">
            <table className="module-table">
              <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>City</th><th>Address</th></tr></thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td className="module-strong">{c.full_name || "—"}</td>
                    <td>{c.phone || "—"}</td>
                    <td>{c.email || "—"}</td>
                    <td>{c.city || "—"}</td>
                    <td>{c.service_address || "—"}</td>
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
