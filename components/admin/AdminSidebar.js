"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  {
    title: "PLATFORM",
    items: [
      ["/admin", "Overview"],
      ["/admin/companies", "Companies"],
      ["/admin/users", "Phoniq Team"],
    ],
  },
  {
    title: "AI PLATFORM",
    items: [
      ["/admin/ai-agents", "AI Agents"],
      ["/admin/phone-numbers", "Phone Numbers"],
      ["/admin/integrations", "Integrations"],
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      ["/admin/usage", "Usage"],
      ["/admin/logs", "Automation & API Logs"],
    ],
  },
  {
    title: "BUSINESS",
    items: [
      ["/admin/billing", "Billing"],
      ["/admin/support", "Support"],
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="ph-admin-sidebar">
      <div className="ph-admin-brand">
        <div className="ph-admin-mark">P</div>
        <div>
          <strong>PHONIQ</strong>
          <small>ADMIN CONSOLE</small>
        </div>
      </div>

      {sections.map((section) => (
        <nav key={section.title}>
          <div className="ph-admin-label">{section.title}</div>
          {section.items.map(([href, label]) => {
            const active =
              pathname === href ||
              (href !== "/admin" && pathname?.startsWith(`${href}/`));

            return (
              <Link
                key={href}
                href={href}
                className={`ph-admin-link ${active ? "active" : ""}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      ))}

      <style jsx global>{`
        .ph-admin-sidebar{width:274px;min-width:274px;min-height:100vh;background:#0f172a;color:#fff;padding:20px 14px;box-sizing:border-box}
        .ph-admin-brand{display:flex;align-items:center;gap:12px;padding:2px 8px 24px}
        .ph-admin-mark{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:#2563eb;font-weight:900}
        .ph-admin-brand strong,.ph-admin-brand small{display:block}
        .ph-admin-brand small{font-size:9px;letter-spacing:1.4px;color:#94a3b8;margin-top:2px}
        .ph-admin-sidebar nav{margin-top:18px}
        .ph-admin-label{padding:0 10px 7px;color:#64748b;font-size:10px;font-weight:900;letter-spacing:1.4px}
        .ph-admin-link{display:block;padding:10px 12px;margin:2px 0;border-radius:9px;color:#cbd5e1;text-decoration:none}
        .ph-admin-link:hover,.ph-admin-link.active{background:#1e293b;color:#fff}
      `}</style>
    </aside>
  );
}
