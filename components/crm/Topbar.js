"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import GlobalSearch from "./GlobalSearch";
import NotificationBell from "./NotificationBell";

export default function Topbar({ onMenu }) {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-[500] overflow-visible border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="relative mx-auto flex h-[78px] w-full max-w-[1580px] items-center gap-3 overflow-visible px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenu}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-300 bg-white text-slate-700 lg:hidden"
          aria-label="Open menu"
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

        <div className="min-w-0 flex-1 lg:mx-auto lg:max-w-[720px]">
          <GlobalSearch />
        </div>

        <div className="relative ml-auto flex shrink-0 items-center gap-2 overflow-visible">
          <NotificationBell />

          <button
            type="button"
            onClick={logout}
            className="phoniq-button-secondary !min-h-[40px] !px-3"
          >
            <span className="hidden sm:inline">Logout</span>

            <span className="sm:hidden" aria-hidden="true">
              Exit
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
