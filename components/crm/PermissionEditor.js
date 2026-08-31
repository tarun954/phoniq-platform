"use client";

import { useEffect, useMemo, useState } from "react";

export default function PermissionEditor({
  memberId,
  roleId,
  mode = "member",
  onClose,
}) {
  const [data, setData] = useState(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const endpoint = useMemo(() => {
    return mode === "role"
      ? `/api/role-permissions/${roleId}`
      : `/api/member-permissions/${memberId}`;
  }, [mode, roleId, memberId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError("");
      setData(null);

      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        const text = await response.text();

        let result = {};
        try {
          result = text ? JSON.parse(text) : {};
        } catch {
          throw new Error(
            `Permission API returned non-JSON response (${response.status}).`
          );
        }

        if (!response.ok) {
          throw new Error(
            result?.error || `Unable to load permissions (${response.status}).`
          );
        }

        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Unable to load permissions.");
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  const groups = useMemo(() => {
    const map = new Map();

    for (const permission of data?.permissions || []) {
      const category = permission.category || "Other";
      if (!map.has(category)) map.set(category, []);
      map.get(category).push(permission);
    }

    return Array.from(map.entries());
  }, [data]);

  function updateMember(permissionId, value) {
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

  function updateRole(permissionId, checked) {
    setData((current) => ({
      ...current,
      permissions: current.permissions.map((permission) =>
        permission.id === permissionId
          ? { ...permission, allowed: checked }
          : permission
      ),
    }));
  }

  async function save() {
    if (!data) return;

    setWorking(true);
    setError("");

    try {
      const body =
        mode === "role"
          ? {
              permissionIds: data.permissions
                .filter((permission) => permission.allowed)
                .map((permission) => permission.id),
            }
          : {
              overrides: data.permissions.map((permission) => ({
                permissionId: permission.id,
                mode:
                  permission.overrideAllowed === null
                    ? "inherit"
                    : permission.overrideAllowed
                    ? "allow"
                    : "deny",
              })),
            };

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Unable to save permissions.");
      }

      onClose?.();
    } catch (err) {
      setError(err?.message || "Unable to save permissions.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="ph-permission-overlay">
      <div className="ph-permission-panel">
        <div className="ph-permission-header">
          <div>
            <p>{mode === "role" ? "ROLE ACCESS" : "USER ACCESS"}</p>
            <h2>
              {mode === "role"
                ? `Edit ${data?.role?.name || "Role"} Permissions`
                : "Edit User Permissions"}
            </h2>
          </div>
          <button className="close" onClick={onClose}>×</button>
        </div>

        {mode === "member" && (
          <div className="ph-permission-info">
            Inherit follows the employee's role. Allow or Deny overrides only
            this employee.
          </div>
        )}

        {error && (
          <div className="ph-permission-error">
            <strong>Unable to load permissions</strong>
            <div>{error}</div>
          </div>
        )}

        {!data && !error && (
          <div className="ph-permission-loading">Loading permissions...</div>
        )}

        {data && (
          <div className="ph-permission-scroll">
            {groups.map(([category, permissions]) => (
              <section key={category}>
                <h3>{category}</h3>

                {permissions.map((permission) => (
                  <div className="ph-permission-row" key={permission.id}>
                    <div>
                      <strong>
                        {permission.name || permission.permission_key}
                      </strong>
                      <small>{permission.permission_key}</small>
                      {permission.description && (
                        <span>{permission.description}</span>
                      )}
                    </div>

                    {mode === "role" ? (
                      <label>
                        <input
                          type="checkbox"
                          checked={Boolean(permission.allowed)}
                          onChange={(event) =>
                            updateRole(
                              permission.id,
                              event.target.checked
                            )
                          }
                        />
                        {" "}Allowed
                      </label>
                    ) : (
                      <select
                        value={
                          permission.overrideAllowed === null
                            ? "inherit"
                            : permission.overrideAllowed
                            ? "allow"
                            : "deny"
                        }
                        onChange={(event) =>
                          updateMember(
                            permission.id,
                            event.target.value
                          )
                        }
                      >
                        <option value="inherit">
                          Inherit ({permission.roleAllowed ? "Allowed" : "Denied"})
                        </option>
                        <option value="allow">Allow for this user</option>
                        <option value="deny">Deny for this user</option>
                      </select>
                    )}
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}

        <div className="ph-permission-actions">
          <button className="cancel" onClick={onClose}>Cancel</button>
          <button
            className="save"
            onClick={save}
            disabled={!data || working}
          >
            {working ? "Saving..." : "Save Permissions"}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .ph-permission-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: grid;
          place-items: center;
          padding: 18px;
          background: rgba(15,23,42,.38);
        }
        .ph-permission-panel {
          width: min(860px,100%);
          max-height: 92vh;
          background: #fff;
          border: 1px solid #dce4ef;
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 28px 90px rgba(15,23,42,.2);
        }
        .ph-permission-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }
        .ph-permission-header p {
          margin: 0 0 6px;
          color: #2563eb;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }
        .ph-permission-header h2 { margin: 0; }
        .ph-permission-header .close {
          border: 0;
          background: transparent;
          font-size: 30px;
          cursor: pointer;
        }
        .ph-permission-info {
          margin: 16px 0;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          color: #64748b;
          background: #f8fafc;
        }
        .ph-permission-error {
          margin: 16px 0;
          padding: 12px;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: #b42318;
          background: #fff1f2;
        }
        .ph-permission-loading {
          padding: 28px 0;
          color: #64748b;
        }
        .ph-permission-scroll {
          max-height: 58vh;
          overflow: auto;
        }
        .ph-permission-scroll section {
          border-top: 1px solid #e2e8f0;
          padding-top: 12px;
          margin-top: 12px;
        }
        .ph-permission-row {
          display: grid;
          grid-template-columns: 1fr minmax(220px,auto);
          gap: 18px;
          align-items: center;
          padding: 13px 0;
          border-top: 1px solid #f1f5f9;
        }
        .ph-permission-row small,
        .ph-permission-row span {
          display: block;
          color: #94a3b8;
          font-size: 12px;
          margin-top: 3px;
        }
        .ph-permission-row select {
          min-width: 230px;
          padding: 9px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #fff;
        }
        .ph-permission-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 18px;
        }
        .ph-permission-actions button {
          border-radius: 9px;
          padding: 11px 16px;
          font-weight: 800;
        }
        .ph-permission-actions .cancel {
          border: 1px solid #cbd5e1;
          background: #fff;
        }
        .ph-permission-actions .save {
          border: 1px solid #2563eb;
          background: #2563eb;
          color: #fff;
        }
      `}</style>
    </div>
  );
}
