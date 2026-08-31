"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import AdminNotificationBell from "@/components/admin/AdminNotificationBell";
import AdminNotificationToastHost from "@/components/admin/AdminNotificationToastHost";

export default function AdminTopbar(){
  const router=useRouter();

  async function logout(){
    const supabase=createClient();
    await supabase.auth.signOut();
    await fetch("/api/auth/portal-mode",{method:"DELETE"}).catch(()=>{});
    router.replace("/admin-login");
    router.refresh();
  }

  return (
    <>
      <header style={{
        height:76,background:"#fff",borderBottom:"1px solid #e2e8f0",
        display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 34px"
      }}>
        <div>
          <strong>Phoniq Internal Console</strong>
          <small style={{display:"block",color:"#94a3b8",marginTop:2}}>Platform administration</small>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <AdminNotificationBell/>
          <button onClick={logout} style={{
            border:"1.5px solid #0f172a",background:"#fff",borderRadius:9,
            padding:"10px 13px",fontWeight:800
          }}>Logout</button>
        </div>
      </header>
      <AdminNotificationToastHost/>
    </>
  );
}
