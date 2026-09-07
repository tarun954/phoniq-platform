"use client";

import { useEffect } from "react";
import { useMobileSidebar } from "./MobileSidebarContext";

export default function MobileSidebarDrawer({ children }) {
  const { open, closeSidebar } = useMobileSidebar();

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeSidebar();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, closeSidebar]);

  return (
    <div
      className={`fixed inset-0 z-[80] md:hidden ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <button
        type="button"
        aria-label="Close navigation"
        onClick={closeSidebar}
        className={`absolute inset-0 bg-black/35 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        className={`absolute left-0 top-0 h-[100dvh] w-[min(84vw,290px)] overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {children}
      </aside>
    </div>
  );
}
