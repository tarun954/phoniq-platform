"use client";
import { useInsideClientChrome } from "@/components/crm/ClientChromeContext";
import ClientRouteShell from "@/components/crm/ClientRouteShell";
export default function ClientShell({children}){const inside=useInsideClientChrome();return inside?children:<ClientRouteShell>{children}</ClientRouteShell>}
