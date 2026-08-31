"use client";

import { createContext, useContext } from "react";

const ClientChromeContext = createContext(false);

export function ClientChromeProvider({ children }) {
  return (
    <ClientChromeContext.Provider value={true}>
      {children}
    </ClientChromeContext.Provider>
  );
}

export function useInsideClientChrome() {
  return useContext(ClientChromeContext);
}
 