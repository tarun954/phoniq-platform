"use client";

import { createContext, useContext, useMemo, useState } from "react";

const MobileSidebarContext = createContext(null);

export function MobileSidebarProvider({ children }) {
  const [open, setOpen] = useState(false);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      openSidebar: () => setOpen(true),
      closeSidebar: () => setOpen(false),
      toggleSidebar: () => setOpen((current) => !current),
    }),
    [open]
  );

  return (
    <MobileSidebarContext.Provider value={value}>
      {children}
    </MobileSidebarContext.Provider>
  );
}

export function useMobileSidebar() {
  const context = useContext(MobileSidebarContext);

  if (!context) {
    throw new Error(
      "useMobileSidebar must be used inside MobileSidebarProvider"
    );
  }

  return context;
}
