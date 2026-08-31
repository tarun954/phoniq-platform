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
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[78px] w-full max-w-[1580px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenu}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-300 bg-white text-slate-700 lg:hidden"
          aria-label="Open menu"
        >
          ☰
        </button>

        <div className="mx-auto w-full max-w-[720px]">
          <GlobalSearch />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <NotificationBell />

          <button
            type="button"
            onClick={logout}
            className="phoniq-button-secondary !min-h-[40px] !px-3"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
