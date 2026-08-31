import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import IdleLogout from "@/components/auth/IdleLogout";
import { requirePlatformUser } from "@/lib/admin/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({children}){
  const store=await cookies();
  const mode=store.get("phoniq_portal")?.value;

  if(mode!=="admin"){
    redirect("/admin-login");
  }

  try{
    await requirePlatformUser();
  }catch(error){
    if(Number(error?.status)===401)redirect("/admin-login");

    return (
      <main style={{padding:40}}>
        <h1>Phoniq Admin Console</h1>
        <p>{error?.message||"Access denied."}</p>
      </main>
    );
  }

  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#f6f8fc",fontFamily:"var(--font-geist-sans),Arial,sans-serif"}}>
      <AdminSidebar/>
      <div style={{flex:1,minWidth:0}}>
        <AdminTopbar/>
        <main style={{padding:34}}>{children}</main>
      </div>
      <IdleLogout timeoutMinutes={10} warningSeconds={60}/>
    </div>
  );
}
