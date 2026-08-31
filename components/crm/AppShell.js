"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ children }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-900">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="min-h-screen lg:pl-[268px]">
        <Topbar onMenu={() => setNavOpen(true)} />

        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
