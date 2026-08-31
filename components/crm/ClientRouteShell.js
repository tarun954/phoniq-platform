"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/crm/Sidebar";
import ClientTopbar from "@/components/crm/ClientTopbar";
import NotificationToastHost from "@/components/crm/NotificationToastHost";
import IdleLogout from "@/components/auth/IdleLogout";
import { ClientChromeProvider } from "@/components/crm/ClientChromeContext";

export default function ClientRouteShell({ children }) {
  const pathname = usePathname();
  const contentRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("phoniq_sidebar_collapsed") === "1");
    } catch {}
  }, []);

  function resetAllScroll() {
    const content = contentRef.current;

    if (content) {
      content.scrollTop = 0;
      content.scrollLeft = 0;
    }

    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);

      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }

      if (document.body) {
        document.body.scrollTop = 0;
      }

      // Reset any old nested containers left by previous page CSS.
      document
        .querySelectorAll(
          ".crm-content,.page-content,.dashboard-content,.leads-page,.hot-leads-page,.resolved-page,.trash-page,[data-crm-scroll]"
        )
        .forEach((node) => {
          if (node !== content) {
            node.scrollTop = 0;
            node.scrollLeft = 0;
          }
        });
    }
  }

  // Reset before the browser paints the newly navigated page.
  useLayoutEffect(() => {
    resetAllScroll();

    const frame = requestAnimationFrame(() => {
      resetAllScroll();
    });

    const timer = setTimeout(() => {
      resetAllScroll();
    }, 50);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [pathname]);

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem("phoniq_sidebar_collapsed", next ? "1" : "0");
      } catch {}
      return next;
    });
  }

  return (
    <ClientChromeProvider>
      <div className="phoniq-client-shell">
        <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />

        <div className="phoniq-client-column">
          <ClientTopbar />

          <main
            ref={contentRef}
            data-crm-scroll
            className="phoniq-client-content"
          >
            <div key={pathname} className="phoniq-route-view">
              {children}
            </div>
          </main>
        </div>

        <NotificationToastHost />
        <IdleLogout timeoutMinutes={10} warningSeconds={60} />
      </div>

      <style jsx global>{`
        html,
        body {
          width: 100%;
          height: 100%;
          margin: 0;
        }

        body {
          overflow: hidden;
        }

        .phoniq-client-shell {
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: stretch;
          background: #f7f9fc;
          overflow: hidden;
          font-family: var(--font-geist-sans), Arial, sans-serif;
        }

        .phoniq-client-column {
          flex: 1 1 0%;
          min-width: 0;
          width: 0;
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .phoniq-client-content {
          position: relative;
          flex: 1 1 0%;
          min-width: 0;
          min-height: 0;
          width: 100%;
          overflow-x: hidden;
          overflow-y: auto;
          box-sizing: border-box;
          padding: 32px 36px 48px;
          scroll-behavior: auto !important;
          overscroll-behavior: contain;
        }

        .phoniq-route-view {
          width: 100%;
          min-width: 0;
          margin: 0;
          padding: 0;
        }

        /* Remove old spacer/min-height patterns from these four legacy screens. */
        .phoniq-route-view > .min-h-screen,
        .phoniq-route-view > [class*="min-h-screen"] {
          min-height: 0 !important;
        }

        .phoniq-route-view > :first-child {
          margin-top: 0 !important;
        }

        @media (max-width: 900px) {
          .phoniq-client-content {
            padding: 24px 18px 36px;
          }
        }
      `}</style>
    </ClientChromeProvider>
  );
}
