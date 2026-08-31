"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const sections = [
  { label: "WORKSPACE", items: [
    ["/dashboard", "Overview", "grid", "nav.overview"],
    ["/hot-leads", "Hot Leads", "users", "nav.hot_leads"],
    ["/leads", "Leads", "user", "nav.leads"],
    ["/customers", "Customers", "user", "nav.customers"],
    ["/calls", "Calls", "phone", "nav.calls"],
    ["/appointments", "Appointments", "calendar", "nav.appointments"],
    ["/jobs", "Jobs", "briefcase", "nav.jobs"],
  ]},
  { label: "OPERATIONS", items: [
    ["/follow-ups", "Follow-ups", "calendar", "nav.followups"],
    ["/conversations", "Conversations", "message", "nav.conversations"],
    ["/resolved", "Resolved", "check", "nav.resolved"],
    ["/trash", "Trash", "trash", "nav.trash"],
  ]},
  { label: "MANAGE", items: [
    ["/team", "Team & Roles", "users", "nav.team"],
    ["/settings", "Settings", "settings", "nav.settings"],
    ["/support", "Support", "help", "nav.support"],
  ]},
];

export default function OldClientSidebar({ collapsed, onToggle }) {
  const pathname = usePathname();
  const [permissionKeys, setPermissionKeys] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/navigation-permissions", { cache: "no-store" })
      .then(async (response) => ({ ok: response.ok, data: await response.json() }))
      .then(({ ok, data }) => {
        if (!mounted) return;
        setPermissionKeys(new Set(ok ? (data.permissionKeys || []) : []));
      })
      .catch(() => mounted && setPermissionKeys(new Set()));
    return () => { mounted = false; };
  }, []);

  const allowed = useMemo(() => {
    if (permissionKeys === null) return () => true;
    if (permissionKeys.has("*")) return () => true;
    return (key) => permissionKeys.has(key);
  }, [permissionKeys]);

  return (
    <aside className={`old-crm-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="old-brand">
        <div className="old-logo">P</div>
        <div className="old-brand-text">
          <strong>PHONIQ</strong>
          <small>SERVICE CRM</small>
        </div>
      </div>

      <div className="old-scroll">
        {sections.map((section) => {
          const items = section.items.filter((item) => allowed(item[3]));
          if (!items.length) return null;
          return (
            <nav key={section.label} className="old-section">
              <div className="old-section-label">{section.label}</div>
              {items.map(([href, label, icon]) => {
                const active = pathname === href || (href !== "/dashboard" && pathname?.startsWith(`${href}/`));
                return (
                  <Link key={href} href={href} title={collapsed ? label : undefined} className={`old-nav-item ${active ? "active" : ""}`}>
                    <span className="old-nav-icon"><Icon name={icon} /></span>
                    <span className="old-nav-text">{label}</span>
                  </Link>
                );
              })}
            </nav>
          );
        })}
      </div>

      <button type="button" className="old-collapse" onClick={onToggle} aria-label={collapsed ? "Expand menu" : "Collapse menu"}>
        <svg viewBox="0 0 24 24"><path d={collapsed ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} /></svg>
        <span>{collapsed ? "" : "Collapse menu"}</span>
      </button>

      <style jsx global>{`
        .old-crm-sidebar{--side-width:276px;width:var(--side-width);min-width:var(--side-width);height:100vh;position:sticky;top:0;z-index:50;display:flex;flex-direction:column;background:#fff;border-right:1px solid #e6ebf2;transition:width 220ms ease,min-width 220ms ease;overflow:hidden;font-family:var(--font-geist-sans),Arial,sans-serif}
        .old-crm-sidebar.collapsed{--side-width:82px}
        .old-brand{height:92px;min-height:92px;box-sizing:border-box;padding:20px 18px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #eef2f7}
        .old-logo{width:42px;height:42px;flex:0 0 42px;border-radius:12px;display:grid;place-items:center;background:#2563eb;color:#fff;font-size:15px;font-weight:850;box-shadow:0 6px 16px rgba(37,99,235,.18)}
        .old-brand-text{opacity:1;width:150px;overflow:hidden;white-space:nowrap;transition:opacity 140ms ease,width 220ms ease}
        .old-brand-text strong{display:block;font-size:16px;color:#0f172a;letter-spacing:.15px}.old-brand-text small{display:block;margin-top:3px;color:#94a3b8;font-size:9px;font-weight:750;letter-spacing:1.8px}
        .old-crm-sidebar.collapsed .old-brand{padding-left:20px}.old-crm-sidebar.collapsed .old-brand-text{width:0;opacity:0}
        .old-scroll{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding-bottom:12px}.old-section{padding:18px 10px 0}
        .old-section-label{height:17px;padding:0 12px 7px;overflow:hidden;white-space:nowrap;color:#8fa1ba;font-size:9.5px;font-weight:850;letter-spacing:1.75px;transition:opacity 120ms ease}.old-crm-sidebar.collapsed .old-section-label{opacity:0}
        .old-nav-item{height:48px;display:flex;align-items:center;gap:10px;margin:2px 0;padding:0 10px;box-sizing:border-box;border-radius:11px;color:#41536b;text-decoration:none;font-size:14px;font-weight:700;line-height:1;transition:background 160ms ease,color 160ms ease}
        .old-nav-item:hover{background:#f7f9fc;color:#182338}.old-nav-item.active{background:#eaf2ff;color:#1558e8}
        .old-nav-icon{width:34px;height:34px;flex:0 0 34px;display:grid;place-items:center;border-radius:9px;color:#87a2c7}.old-nav-item.active .old-nav-icon{background:#fff;color:#1558e8;box-shadow:0 3px 10px rgba(15,23,42,.06)}
        .old-nav-icon svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
        .old-nav-text{width:170px;opacity:1;overflow:hidden;white-space:nowrap;transition:opacity 120ms ease,width 220ms ease}.old-crm-sidebar.collapsed .old-nav-item{padding-left:13px}.old-crm-sidebar.collapsed .old-nav-text{width:0;opacity:0}
        .old-collapse{height:54px;min-height:54px;margin:10px 12px 14px;border:1px solid #dce4ee;border-radius:11px;background:#fff;color:#52647b;display:flex;align-items:center;justify-content:center;gap:7px;font-size:12px;font-weight:700;cursor:pointer;overflow:hidden;white-space:nowrap}.old-collapse:hover{background:#f8fafc}.old-collapse svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
        @media(max-width:760px){.old-crm-sidebar{position:fixed;left:0}.old-crm-sidebar.collapsed{transform:translateX(-82px)}}
      `}</style>
    </aside>
  );
}

function Icon({ name }) {
  const p = { viewBox: "0 0 24 24", "aria-hidden": "true" };
  if (name === "grid") return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
  if (name === "users") return <svg {...p}><circle cx="8" cy="8" r="3"/><path d="M2.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8M15.5 14a5 5 0 0 1 6 5"/></svg>;
  if (name === "user") return <svg {...p}><circle cx="12" cy="7.5" r="3.5"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></svg>;
  if (name === "phone") return <svg {...p}><path d="M7 3H4.5A1.5 1.5 0 0 0 3 4.5C3 13.6 10.4 21 19.5 21a1.5 1.5 0 0 0 1.5-1.5V17l-4.2-1.2-1.1 2a14.2 14.2 0 0 1-9.5-9.5l2-1.1L7 3z"/></svg>;
  if (name === "calendar") return <svg {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>;
  if (name === "briefcase") return <svg {...p}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 12h18"/></svg>;
  if (name === "message") return <svg {...p}><path d="M20 15a4 4 0 0 1-4 4H8l-5 2V7a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4z"/></svg>;
  if (name === "check") return <svg {...p}><path d="m5 12 4 4L19 6"/></svg>;
  if (name === "trash") return <svg {...p}><path d="M4 6h16M9 6V4h6v2M18 6l-1 15H7L6 6M10 10v7M14 10v7"/></svg>;
  if (name === "settings") return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.8-1L14.4 3h-4.8l-.4 3.1a8 8 0 0 0-1.8 1L5 6.1 3 9.5 5 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.8 1l.4 3.1h4.8l.4-3.1a8 8 0 0 0 1.8-1l2.4 1 2-3.4L19 13a7 7 0 0 0 0-1z"/></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 17h.01M9.5 9a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1.2-1.5 2.5"/></svg>;
}
