"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import OldClientSidebar from "@/components/crm/OldClientSidebar";
import NotificationBell from "@/components/crm/NotificationBell";
import NotificationToastHost from "@/components/crm/NotificationToastHost";
import IdleLogout from "@/components/auth/IdleLogout";
import { ClientChromeContext } from "@/components/crm/ClientChromeContext";
import { createClient } from "@/lib/supabase/browser";

const clientRoots = [
  "/dashboard", "/hot-leads", "/leads", "/customers", "/calls",
  "/appointments", "/jobs", "/follow-ups", "/conversations",
  "/resolved", "/trash", "/team", "/settings", "/support", "/search"
];

function isClientPath(pathname) {
  return clientRoots.some((root) => pathname === root || pathname?.startsWith(`${root}/`));
}

export default function GlobalClientChrome({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const clientPath = useMemo(() => isClientPath(pathname), [pathname]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!clientPath) return;
    const saved = window.localStorage.getItem("phoniq_sidebar_collapsed");
    setCollapsed(saved === "1");
  }, [clientPath]);

  function toggle() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("phoniq_sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    await fetch("/api/auth/portal-mode", { method: "DELETE" }).catch(() => {});
    router.replace("/login");
    router.refresh();
  }

  if (!clientPath) return children;

  return (
    <ClientChromeContext.Provider value={true}>
      <div className="global-client-shell">
        <OldClientSidebar collapsed={collapsed} onToggle={toggle} />

        <div className="global-client-main">
          <header className="global-client-topbar">
            <button type="button" className="global-menu-button" onClick={toggle} aria-label="Toggle sidebar">
              <svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>

            <input
              className="global-client-search"
              placeholder="Search leads, customers, phone numbers or service issues..."
              onKeyDown={(event) => {
                if (event.key === "Enter" && event.currentTarget.value.trim()) {
                  router.push(`/search?q=${encodeURIComponent(event.currentTarget.value.trim())}`);
                }
              }}
            />

            <div className="global-client-actions">
              <NotificationBell />
              <button type="button" className="global-client-logout" onClick={logout}>Logout</button>
            </div>
          </header>

          <div className="global-client-page">
            {children}
          </div>
        </div>

        <NotificationToastHost />
        <IdleLogout timeoutMinutes={10} warningSeconds={60} />
      </div>

      <style jsx global>{`
        .global-client-shell{
          width:100%;min-height:100vh;display:flex;align-items:stretch;
          background:#f7f9fc;color:#0f172a;overflow:hidden;
          font-family:var(--font-geist-sans),Arial,sans-serif
        }
        .global-client-main{
          flex:1 1 auto;min-width:0;width:0;min-height:100vh;
          display:flex;flex-direction:column;overflow:hidden;background:#f7f9fc
        }
        .global-client-topbar{
          height:82px;min-height:82px;box-sizing:border-box;background:#fff;
          border-bottom:1px solid #e6ebf2;display:flex;align-items:center;
          gap:12px;padding:0 24px;position:sticky;top:0;z-index:40
        }
        .global-menu-button{
          width:42px;height:42px;flex:0 0 42px;border:1px solid #d5deea;
          border-radius:11px;background:#fff;color:#42536a;display:grid;place-items:center;
          cursor:pointer
        }
        .global-menu-button svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
        .global-client-search{
          flex:1 1 620px;min-width:100px;max-width:760px;height:46px;box-sizing:border-box;
          border:1px solid #cfd9e6;border-radius:12px;background:#f8fafc;padding:0 15px;
          color:#0f172a;font-size:14px;outline:none
        }
        .global-client-search::placeholder{color:#91a2ba}
        .global-client-actions{margin-left:auto;display:flex;align-items:center;gap:9px}
        .global-client-logout{
          height:42px;padding:0 15px;border:1.5px solid #172033;border-radius:10px;
          background:#fff;color:#111827;font-size:14px;font-weight:800;cursor:pointer
        }
        .global-client-page{
          flex:1 1 auto;min-height:0;min-width:0;width:100%;overflow-y:auto;overflow-x:hidden;
          position:relative;background:#f7f9fc
        }
        .global-client-page>div,.global-client-page>main{max-width:100%;min-width:0}
        @media(max-width:760px){
          .global-client-main{width:100%}.global-client-search{display:none}.global-client-topbar{padding:0 14px}
        }
      `}</style>
    </ClientChromeContext.Provider>
  );
}
