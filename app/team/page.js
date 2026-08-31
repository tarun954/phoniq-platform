"use client";

import { useEffect, useMemo, useState } from "react";
import ClientShell from "@/components/crm/ClientShell";
import PermissionEditor from "@/components/crm/PermissionEditor";

export default function TeamPage() {
  const [tab, setTab] = useState("members");
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [permissionMemberId, setPermissionMemberId] = useState(null);
  const [permissionRoleId, setPermissionRoleId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [teamResponse, rolesResponse] = await Promise.all([
        fetch("/api/team", { cache:"no-store" }),
        fetch("/api/roles", { cache:"no-store" }),
      ]);

      const team = await teamResponse.json();
      const roleData = await rolesResponse.json();

      if (!teamResponse.ok) throw new Error(team?.error || "Unable to load team.");
      if (!rolesResponse.ok) throw new Error(roleData?.error || "Unable to load roles.");

      setMembers(team?.members || team?.team || team?.data?.members || []);
      setInvitations(team?.invitations || team?.data?.invitations || []);
      setRoles(roleData?.roles || roleData?.data || (Array.isArray(roleData) ? roleData : []));
    } catch (err) {
      setError(err?.message || "Unable to load Team & Roles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => ({
    members: members.length, roles: roles.length, invitations: invitations.length
  }), [members, roles, invitations]);

  return (
    <ClientShell>
      <div className="team-header">
        <div>
          <p className="team-eyebrow">MANAGE</p>
          <h1>Team & Roles</h1>
          <p>Manage company employees, roles and editable access permissions.</p>
        </div>
        <a className="team-primary" href="/team/invite">+ Invite Member</a>
      </div>

      {error && <div className="team-error">{error}</div>}

      <section className="team-card">
        <div className="team-tabs">
          <button className={tab==="members"?"active":""} onClick={()=>setTab("members")}>Members ({counts.members})</button>
          <button className={tab==="roles"?"active":""} onClick={()=>setTab("roles")}>Roles ({counts.roles})</button>
          <button className={tab==="invitations"?"active":""} onClick={()=>setTab("invitations")}>Invitations ({counts.invitations})</button>
        </div>

        {loading ? <div className="team-empty">Loading team...</div> :
        tab === "members" ? (
          <>
            <div className="team-headrow">
              <span>MEMBER</span><span>ROLE</span><span>STATUS</span><span>JOINED</span><span>ACCESS</span>
            </div>
            {members.map((member) => {
              const roleName = member.role_name || member.organization_roles?.name || member.role?.name || member.role || "Member";
              const roleKey = String(member.role_key || member.organization_roles?.role_key || member.role || "").toLowerCase();
              const name = member.full_name || member.name || member.profile?.full_name || member.email || "Team Member";
              const email = member.email || member.profile?.email || "No email in profile";

              return (
                <div className="team-row" key={member.id}>
                  <div className="team-member">
                    <div className="team-avatar">{String(name).charAt(0).toUpperCase()}</div>
                    <div><strong>{name}</strong><small>{email}</small></div>
                  </div>
                  <span className="team-pill">{roleName}</span>
                  <span className="team-status">Active</span>
                  <span>{formatDate(member.created_at || member.joined_at)}</span>
                  <div>
                    {roleKey === "owner" ? <span className="team-muted">Full access</span> :
                    <button className="team-outline" onClick={()=>setPermissionMemberId(member.id)}>Edit Access</button>}
                  </div>
                </div>
              );
            })}
          </>
        ) : tab === "roles" ? (
          roles.map((role)=>(
            <div className="team-role-row" key={role.id}>
              <div><strong>{role.name}</strong><small>{role.role_key}</small></div>
              <span className="team-muted">{role.description || "Controls access inside this company workspace."}</span>
              {String(role.role_key||"").toLowerCase()==="owner" ?
                <span className="team-muted">Full access</span> :
                <button className="team-outline" onClick={()=>setPermissionRoleId(role.id)}>Edit Permissions</button>}
            </div>
          ))
        ) : (
          invitations.length ? invitations.map((invite)=>(
            <div className="team-invite-row" key={invite.id}>
              <strong>{invite.email}</strong>
              <span>{invite.role_name || invite.organization_roles?.name || "Role"}</span>
              <span className="team-pill">{invite.status}</span>
              <span>{formatDate(invite.created_at)}</span>
            </div>
          )) : <div className="team-empty">No invitations found.</div>
        )}
      </section>

      {permissionMemberId && (
        <PermissionEditor
          mode="member"
          memberId={permissionMemberId}
          onClose={()=>{setPermissionMemberId(null);load();}}
        />
      )}

      {permissionRoleId && (
        <PermissionEditor
          mode="role"
          roleId={permissionRoleId}
          onClose={()=>{setPermissionRoleId(null);load();}}
        />
      )}

      <style jsx global>{`
        .team-header{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:26px}
        .team-eyebrow{color:#2563eb;font-size:11px;font-weight:900;letter-spacing:1.6px;margin:0 0 8px}
        .team-header h1{font-size:42px;margin:0;color:#0f172a}.team-header p:not(.team-eyebrow){color:#64748b;font-size:16px}
        .team-primary{background:#2563eb;color:#fff;text-decoration:none;padding:13px 17px;border-radius:11px;font-weight:850}
        .team-card{background:#fff;border:1px solid #dce4ef;border-radius:18px;overflow:hidden;box-shadow:0 14px 45px rgba(15,23,42,.04)}
        .team-tabs{display:flex;gap:12px;padding:19px 24px 0;border-bottom:1px solid #e2e8f0}
        .team-tabs button{background:transparent;border:0;border-bottom:3px solid transparent;padding:0 10px 15px;color:#64748b;font-weight:850;cursor:pointer}
        .team-tabs button.active{color:#2563eb;border-color:#2563eb}
        .team-headrow,.team-row{display:grid;grid-template-columns:2fr 1.1fr .8fr .9fr 1fr;gap:16px;align-items:center;padding:16px 22px}
        .team-headrow{background:#f8fafc;color:#64748b;font-size:11px;font-weight:900;letter-spacing:1.3px}.team-row{border-top:1px solid #edf2f7}
        .team-member{display:flex;align-items:center;gap:12px;min-width:0}.team-avatar{width:44px;height:44px;border-radius:12px;background:#eff6ff;color:#2563eb;border:1px solid #dbeafe;display:grid;place-items:center;font-weight:900}
        .team-member strong,.team-member small,.team-role-row small{display:block}.team-member small,.team-role-row small,.team-muted{color:#94a3b8;margin-top:3px}
        .team-pill,.team-status{width:max-content;padding:6px 10px;border-radius:999px;font-size:13px;font-weight:800;background:#f1f5f9}.team-status{background:#ecfdf3;color:#07844f}
        .team-outline{background:#fff;border:1px solid #cbd5e1;padding:9px 11px;border-radius:9px;font-weight:800;cursor:pointer}
        .team-role-row{display:grid;grid-template-columns:1.1fr 2fr 1fr;gap:16px;align-items:center;padding:18px 22px;border-top:1px solid #edf2f7}
        .team-invite-row{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:16px;padding:18px 22px;border-top:1px solid #edf2f7}
        .team-empty{padding:38px;text-align:center;color:#94a3b8}.team-error{padding:12px;margin-bottom:16px;border:1px solid #fecaca;background:#fff1f2;color:#b42318;border-radius:10px}
      `}</style>
    </ClientShell>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}
