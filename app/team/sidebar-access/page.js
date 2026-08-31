"use client";

import { useEffect, useMemo, useState } from "react";
import CRMPageShell from "@/components/crm/CRMPageShell";

export default function SidebarAccessPage() {
  const [data,setData] = useState(null);
  const [selectedId,setSelectedId] = useState("");
  const [access,setAccess] = useState({});
  const [error,setError] = useState("");
  const [message,setMessage] = useState("");
  const [saving,setSaving] = useState(false);

  async function load() {
    setError("");
    const response = await fetch("/api/team/sidebar-access",{cache:"no-store"});
    const result = await response.json();

    if (!response.ok) {
      setError(result?.error || "Unable to load sidebar access.");
      return;
    }

    setData(result);

    const first = (result.members || []).find(member => !member.isOwner);
    if (first) setSelectedId(current => current || first.id);
  }

  useEffect(() => { load(); }, []);

  const member = useMemo(
    () => data?.members?.find(item => item.id === selectedId) || null,
    [data,selectedId]
  );

  useEffect(() => {
    if (!member || !data) return;

    const next = {};
    for (const item of data.navigation || []) {
      next[item.key] = member.overrides?.[item.key] ?? true;
    }
    setAccess(next);
  }, [member,data]);

  async function save() {
    if (!member) return;
    setSaving(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/team/sidebar-access",{
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({memberId:member.id,access})
    });

    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(result?.error || "Unable to save sidebar access.");
      return;
    }

    setMessage(`Sidebar access updated for ${member.name}.`);
    await load();
  }

  return (
    <CRMPageShell
      eyebrow="TEAM ACCESS"
      title="Employee Sidebar Access"
      description="The company Owner can decide which CRM sections each employee can see in the sidebar."
    >
      {error && <div className="sa-error">{error}</div>}
      {message && <div className="sa-success">{message}</div>}

      {!data ? (
        <section className="sa-card">Loading...</section>
      ) : (
        <div className="sa-grid">
          <section className="sa-card sa-members">
            <h2>Employees</h2>

            {data.members.map(item => (
              <button
                key={item.id}
                disabled={item.isOwner}
                onClick={() => setSelectedId(item.id)}
                className={`sa-member ${selectedId===item.id ? "active" : ""}`}
              >
                <strong>{item.name}</strong>
                <small>{item.email || "No email in profile"}</small>
                <span>{item.roleName}{item.isOwner ? " · Full access" : ""}</span>
              </button>
            ))}
          </section>

          <section className="sa-card">
            <h2>{member ? `${member.name}'s Sidebar` : "Select an employee"}</h2>
            <p className="sa-muted">
              Turning an item off removes it from that employee's navigation.
              Feature/API permissions should still be used for server-side authorization.
            </p>

            {member && (
              <>
                <div className="sa-list">
                  {data.navigation.map(item => (
                    <label key={item.key} className="sa-row">
                      <div>
                        <strong>{item.label}</strong>
                        <small>{item.key}</small>
                      </div>

                      <input
                        type="checkbox"
                        checked={Boolean(access[item.key])}
                        onChange={event =>
                          setAccess(current => ({
                            ...current,
                            [item.key]:event.target.checked
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>

                <button className="sa-save" disabled={saving} onClick={save}>
                  {saving ? "Saving..." : "Save Sidebar Access"}
                </button>
              </>
            )}
          </section>
        </div>
      )}

      <style jsx global>{`
        .sa-grid{display:grid;grid-template-columns:300px minmax(0,1fr);gap:20px}
        .sa-card{background:#fff;border:1px solid #dce4ef;border-radius:16px;padding:22px}
        .sa-members{height:max-content}.sa-member{width:100%;text-align:left;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin:5px 0;cursor:pointer}
        .sa-member.active{background:#eff6ff;border-color:#bfdbfe}.sa-member:disabled{opacity:.6;cursor:not-allowed}
        .sa-member strong,.sa-member small,.sa-member span{display:block}.sa-member small{color:#94a3b8;margin-top:3px}.sa-member span{color:#64748b;font-size:12px;margin-top:5px}
        .sa-muted{color:#64748b;line-height:1.5}.sa-list{border-top:1px solid #eef2f7;margin-top:18px}
        .sa-row{display:flex;justify-content:space-between;gap:18px;align-items:center;padding:13px 2px;border-bottom:1px solid #eef2f7}
        .sa-row small{display:block;color:#94a3b8;margin-top:3px}.sa-row input{width:19px;height:19px}
        .sa-save{margin-top:20px;background:#2563eb;color:#fff;border:0;border-radius:9px;padding:12px 16px;font-weight:800;cursor:pointer}
        .sa-error,.sa-success{padding:11px;border-radius:9px;margin-bottom:14px}.sa-error{background:#fff1f2;border:1px solid #fecaca;color:#b42318}.sa-success{background:#ecfdf3;border:1px solid #bbf7d0;color:#067647}
        @media(max-width:850px){.sa-grid{grid-template-columns:1fr}}
      `}</style>
    </CRMPageShell>
  );
}
