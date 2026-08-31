"use client";
import { useRouter } from "next/navigation";
import NotificationBell from "@/components/crm/NotificationBell";
import { createClient } from "@/lib/supabase/browser";

export default function ClientTopbar(){
  const router=useRouter();
  async function logout(){
    const supabase=createClient();
    await supabase.auth.signOut();
    await fetch('/api/auth/portal-mode',{method:'DELETE'}).catch(()=>{});
    router.replace('/login');router.refresh();
  }
  return <header className="approved-topbar">
    <input className="approved-search" placeholder="Search leads, customers, phone numbers or service issues..." onKeyDown={e=>{if(e.key==='Enter'&&e.currentTarget.value.trim())router.push(`/search?q=${encodeURIComponent(e.currentTarget.value.trim())}`)}}/>
    <div className="approved-top-actions"><NotificationBell/><button onClick={logout}>Logout</button></div>
    <style jsx global>{`
      .approved-topbar{height:82px;background:#fff;border-bottom:1px solid #e4eaf2;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:0 32px;box-sizing:border-box}
      .approved-search{width:min(760px,72%);min-width:260px;border:1px solid #cdd7e4;border-radius:12px;padding:13px 15px;background:#f8fafc;color:#0f172a;font:inherit;outline:none}.approved-search:focus{border-color:#9ab9f8;background:#fff}
      .approved-top-actions{display:flex;align-items:center;gap:10px}.approved-top-actions>button{border:1.5px solid #0f172a;background:#fff;border-radius:10px;padding:11px 15px;font-weight:800;cursor:pointer}
    `}</style>
  </header>
}
