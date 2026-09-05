"use client";

import { useMobileSidebar } from "./MobileSidebarContext";

export default function MobileMenuButton() {
  const { openSidebar } = useMobileSidebar();

  return (
    <button
      type="button"
      onClick={openSidebar}
      aria-label="Open navigation"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 md:hidden"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
      </svg>
    </button>
  );
}
