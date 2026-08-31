"use client";

import { useEffect, useMemo, useState } from "react";

export default function PlatformPermissionEditor({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(
          `/api/platform-user-permissions/${userId}`,
          { cache: "no-store" }
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.error || "Unable to load platform permissions.");
        }

        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Unable to load permissions.");
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const permission of data?.permissions || []) {
      const category = permission.category || "Other";
      if (!map.has(category)) map.set(category, []);
      map.get(category).push(permission);
    }
    return Array.from(map.entries());
  }, [data]);

  function setMode(permissionId, value) {
    setData((current) => ({
      ...current,
      permissions: current.permissions.map((permission) =>
        permission.id === permissionId
          ? {
              ...permission,
              overrideAllowed:
                value === "inherit" ? null : value === "allow",
            }
          : permission
      ),
    }));
  }

  async function save() {
    setWorking(true);
    setError("");

    try {
      const response = await fetch(
        `/api/platform-user-permissions/${userId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            overrides: data.permissions.map((permission) => ({
              permissionId: permission.id,
              mode:
                permission.overrideAllowed === null
                  ? "inherit"
                  : permission.overrideAllowed
                  ? "allow"
                  : "deny",
            })),
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "Unable to save access.");

      onClose?.();
    } catch (err) {
      setError(err?.message || "Unable to save access.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div style={overlay}>
      <div style={panel}>
        <div style={{display:"flex",justifyContent:"space-between",gap:16}}>
          <div>
            <p style={eyebrow}>PHONIQ PLATFORM ACCESS</p>
            <h2 style={{margin:0}}>Edit Internal User Permissions</h2>
          </div>
          <button style={close} onClick={onClose}>×</button>
        </div>

        <p style={muted}>
          Inherit follows the internal user's platform role. Allow or Deny
          changes only this Phoniq user.
        </p>

        {error && <div style={errorStyle}>{error}</div>}
        {!data && !error && <p>Loading permissions...</p>}

        {data && (
          <div style={{maxHeight:"58vh",overflow:"auto"}}>
            {groups.map(([category, permissions]) => (
              <section key={category} style={{borderTop:"1px solid #e2e8f0",marginTop:14}}>
                <h3>{category}</h3>
                {permissions.map((permission) => (
                  <div key={permission.id} style={row}>
                    <div>
                      <strong>{permission.name}</strong>
                      <small style={small}>{permission.permission_key}</small>
                    </div>
                    <select
                      value={
                        permission.overrideAllowed === null
                          ? "inherit"
                          : permission.overrideAllowed
                          ? "allow"
                          : "deny"
                      }
                      onChange={(event) =>
                        setMode(permission.id, event.target.value)
                      }
                    >
                      <option value="inherit">
                        Inherit ({permission.roleAllowed ? "Allowed" : "Denied"})
                      </option>
                      <option value="allow">Allow for this user</option>
                      <option value="deny">Deny for this user</option>
                    </select>
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}

        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}>
          <button onClick={onClose}>Cancel</button>
          <button disabled={!data || working} onClick={save}>
            {working ? "Saving..." : "Save Permissions"}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position:"fixed",inset:0,zIndex:10000,display:"grid",placeItems:"center",
  background:"rgba(15,23,42,.38)",padding:20
};
const panel = {
  width:"min(860px,100%)",background:"#fff",borderRadius:18,
  border:"1px solid #dce4ef",padding:24,boxShadow:"0 28px 90px rgba(15,23,42,.2)"
};
const eyebrow = {color:"#2563eb",fontSize:11,fontWeight:900,letterSpacing:1.4,margin:"0 0 6px"};
const close = {border:0,background:"transparent",fontSize:30,cursor:"pointer"};
const muted = {color:"#64748b",lineHeight:1.5};
const errorStyle = {padding:12,border:"1px solid #fecaca",background:"#fff1f2",color:"#b42318",borderRadius:10};
const row = {display:"grid",gridTemplateColumns:"1fr minmax(220px,auto)",gap:16,alignItems:"center",padding:"12px 0",borderTop:"1px solid #f1f5f9"};
const small = {display:"block",color:"#94a3b8",marginTop:3};
